// Rewarded ads (Adsgram) — server-side reward verification (v39.4).
//
// Adsgram calls the block's «Reward URL» from its own servers after a user has watched a rewarded ad to the end:
//   GET /ads/reward?userid=<telegram user id>[&key=<ADS_REWARD_KEY>]
// (in the Adsgram dashboard: https://<api-host>/ads/reward?userid=[userId] — Adsgram replaces [userId]).
// Each call stores one short-lived «ad credit» for that player (table ad_credits, migration 0005).
// The game spends a credit for valuable rewards: POST /ads/claim { place } -> { ok } | 409 no_credit | 409 limit.
// Only when the live config says so (`ads.verify = true`, exposed as /config.adsVerify) does the game require it;
// otherwise (and offline) the game falls back to its own daily caps. Docs: https://docs.adsgram.ai/publisher/
import { fail, json, readJson, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { envInt } from '../lib/common.js';
import { safeEqual } from '../lib/crypto.js';
import { getConfigKey } from '../lib/config.js';
import { dayKey } from '../lib/time.js';

export const PLACE_RE = /^[a-z0-9_]{1,16}$/;
const ttlMs = (env) => envInt(env, 'ADS_CREDIT_TTL_SEC', 900) * 1000;

/** GET /ads/reward?userid=… — called by Adsgram (not by the game). Never reveals whether the user exists. */
export async function adsReward(c) {
  const key = c.env.ADS_REWARD_KEY;
  if (key && !safeEqual(String(c.url.searchParams.get('key') || ''), String(key))) fail(403, 'bad_key', 'Нет доступа');
  const tg = String(c.url.searchParams.get('userid') || c.url.searchParams.get('userId') || '').trim();
  if (!/^\d{1,16}$/.test(tg)) fail(400, 'bad_user', 'userid — число (Telegram id)');
  const u = await c.env.DB.prepare('SELECT id FROM users WHERE tg_id=?').bind(Number(tg)).first();
  if (!u) return json({ ok: true });
  const maxOpen = envInt(c.env, 'ADS_OPEN_MAX', 5); // unspent, live credits per player
  const maxDay = envInt(c.env, 'ADS_DAILY_MAX', 40); // credits per player per 24 h
  const open = await c.env.DB.prepare('SELECT COUNT(*) n FROM ad_credits WHERE uid=? AND used_at IS NULL AND at>=?').bind(u.id, c.now - ttlMs(c.env)).first('n');
  const day = await c.env.DB.prepare('SELECT COUNT(*) n FROM ad_credits WHERE uid=? AND at>=?').bind(u.id, c.now - 86400000).first('n');
  if (open >= maxOpen || day >= maxDay) return json({ ok: true });
  await c.env.DB.prepare('INSERT INTO ad_credits (uid, at) VALUES (?,?)').bind(u.id, c.now).run();
  return json({ ok: true });
}

/** POST /ads/claim { place } — spend the oldest live credit of the signed-in player. */
export async function adsClaim(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 256);
  const place = str(body.place, 16);
  if (!PLACE_RE.test(place)) fail(400, 'bad_place', 'place: a-z0-9_');
  const cfg = (await getConfigKey(c.env, 'ads')) || {};
  const caps = (cfg && cfg.caps) || {};
  const day = dayKey(c.now, c.env);
  if (Number.isFinite(caps[place])) {
    const used = await c.env.DB.prepare('SELECT COUNT(*) n FROM ad_credits WHERE uid=? AND day=? AND place=?').bind(user.id, day, place).first('n');
    if (used >= caps[place]) fail(409, 'limit', 'На сегодня всё — лимит наград за рекламу');
  }
  // one atomic statement: two parallel claims cannot spend the same credit
  const r = await c.env.DB.prepare(`UPDATE ad_credits SET used_at=?, place=?, day=?
    WHERE id=(SELECT id FROM ad_credits WHERE uid=? AND used_at IS NULL AND at>=? ORDER BY at LIMIT 1) AND used_at IS NULL`)
    .bind(c.now, place, day, user.id, c.now - ttlMs(c.env)).run();
  if (!r.meta.changes) fail(409, 'no_credit', 'Просмотр рекламы не подтверждён');
  return json({ ok: true, place });
}
