// Auth: Telegram initData -> session JWT; guest mode for local testing.
import { validateInitData, signJwt, verifyJwt, sha256Hex } from '../lib/crypto.js';
import { fail, json, readJson, str } from '../lib/http.js';
import { upsertUser, getUser, envInt, pub, clanOf, cleanName } from '../lib/common.js';
import { markActive } from './metrics.js';

async function issue(env, user, now, kind) {
  if (!env.JWT_SECRET || String(env.JWT_SECRET).length < 16) fail(503, 'not_configured', 'Сервер не настроен (JWT_SECRET)');
  const ttl = envInt(env, 'SESSION_TTL_SEC', 6 * 3600);
  const token = await signJwt({ sub: user.id, k: kind, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ttl }, env.JWT_SECRET);
  return { token, expiresAt: now + ttl * 1000 };
}

function meView(user, clan) {
  return {
    ...pub(user),
    refCode: user.ref_code,
    guest: !user.tg_id,
    notify: !!user.notify,
    canPm: !!user.can_pm,
    customName: !!user.display_name,
    createdAt: user.created_at,
    clan: clan ? { id: clan.clan_id, name: clan.name, tag: clan.tag, role: clan.role } : null,
  };
}

export async function authTelegram(c) {
  const body = await readJson(c.req, 16 * 1024);
  const maxAge = envInt(c.env, 'INITDATA_MAX_AGE_SEC', 86400);
  const v = await validateInitData(body.initData, c.env.BOT_TOKEN, { maxAgeSec: maxAge, now: c.now });
  if (!v.ok) {
    if (v.reason === 'not_configured') fail(503, 'not_configured', 'Сервер не настроен (BOT_TOKEN)');
    fail(401, 'bad_init_data', 'Не удалось проверить данные Telegram', { reason: v.reason });
  }
  const u = v.user;
  const { user, isNew } = await upsertUser(c.env, {
    uid: 't' + u.id, tgId: u.id, firstName: u.first_name, username: u.username, lang: u.language_code,
    canPm: u.allows_write_to_pm === true ? true : null, startParam: v.startParam,
  }, c.now);
  if (user.banned) fail(403, 'banned', 'Аккаунт заблокирован');
  const s = await issue(c.env, user, c.now, 'tg');
  await markActive(c.env, user.id, c.now);
  return json({ ok: true, ...s, isNew, me: meView(user, await clanOf(c.env, user.id)), serverTime: c.now });
}

/** Guest login — only when ALLOW_GUEST=1 (local dev / browser testing). */
export async function authGuest(c) {
  if (c.env.ALLOW_GUEST !== '1') fail(403, 'guest_disabled', 'Гостевой вход выключен');
  const body = await readJson(c.req, 4096);
  const dev = str(body.deviceId, 128);
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(dev)) fail(400, 'bad_device', 'Нужен deviceId (16+ символов)');
  const uid = 'g' + (await sha256Hex('guest:' + dev)).slice(0, 24);
  const { user, isNew } = await upsertUser(c.env, { uid, firstName: str(body.name, 32) || 'Гость', startParam: str(body.startParam, 64) }, c.now);
  if (user.banned) fail(403, 'banned', 'Аккаунт заблокирован');
  const s = await issue(c.env, user, c.now, 'guest');
  await markActive(c.env, user.id, c.now);
  return json({ ok: true, ...s, isNew, me: meView(user, null), serverTime: c.now });
}

/** Resolve the Bearer session. Returns the user row or throws 401. */
export async function requireUser(c) {
  if (c._user) return c._user;
  const h = c.req.headers.get('authorization') || '';
  const m = /^Bearer (.+)$/.exec(h);
  if (!m || !c.env.JWT_SECRET) fail(401, 'no_session', 'Нужна авторизация');
  const p = await verifyJwt(m[1], c.env.JWT_SECRET, c.now);
  if (!p) fail(401, 'bad_session', 'Сессия истекла');
  const user = await getUser(c.env, p.sub);
  if (!user) fail(401, 'bad_session', 'Сессия истекла');
  if (user.banned) fail(403, 'banned', 'Аккаунт заблокирован');
  if (c.now - user.last_seen > 10 * 60000) {
    await c.env.DB.prepare('UPDATE users SET last_seen=? WHERE id=?').bind(c.now, user.id).run();
  }
  c._user = user;
  return user;
}

export async function getMe(c) {
  const user = await requireUser(c);
  return json({ ok: true, me: meView(user, await clanOf(c.env, user.id)), serverTime: c.now });
}

/** POST /me/settings { notify?: boolean, name?: string|null } — bot reminders opt-in, display name (null = back to Telegram name). */
export async function postSettings(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  if (body.notify !== undefined && typeof body.notify !== 'boolean') fail(400, 'bad_notify', 'notify: true/false');
  if (typeof body.notify === 'boolean') {
    await c.env.DB.prepare('UPDATE users SET notify=? WHERE id=?').bind(body.notify ? 1 : 0, user.id).run();
    if (!body.notify) await c.env.DB.prepare("UPDATE notifications SET status='dropped' WHERE uid=? AND status='pending'").bind(user.id).run();
  }
  if (body.name !== undefined) {
    const name = body.name === null || body.name === '' ? null : cleanName(body.name);
    await c.env.DB.prepare('UPDATE users SET display_name=? WHERE id=?').bind(name, user.id).run();
  }
  const u = await getUser(c.env, user.id);
  return json({ ok: true, notify: !!u.notify, canPm: !!u.can_pm, me: pub(u), customName: !!u.display_name });
}

/** DELETE /me — erase all personal data (GDPR-style "forget me"). */
export async function deleteMe(c) {
  const user = await requireUser(c);
  const uid = user.id;
  const clan = await clanOf(c.env, uid);
  if (clan && clan.role === 'leader') fail(409, 'leader', 'Сначала передайте лидерство или покиньте клан');
  const tables = ['saves', 'runs', 'lb_abyss', 'villages', 'daily', 'quest_claims', 'bp_progress', 'inbox', 'notifications', 'weekly_contrib', 'audit', 'active_days', 'ev_seen'];
  const st = tables.map((t) => c.env.DB.prepare(`DELETE FROM ${t} WHERE uid=?`).bind(uid));
  st.push(c.env.DB.prepare('DELETE FROM friends WHERE uid=? OR friend_uid=?').bind(uid, uid));
  if (clan) {
    st.push(c.env.DB.prepare('DELETE FROM clan_members WHERE uid=?').bind(uid));
    st.push(c.env.DB.prepare('UPDATE clans SET members=members-1 WHERE id=?').bind(clan.clan_id));
  }
  // Payments/entitlements are kept for accounting, but detached from the profile name.
  st.push(c.env.DB.prepare("UPDATE users SET first_name='', display_name=NULL, username=NULL, lang=NULL, notify=0, can_pm=0 WHERE id=?").bind(uid));
  await c.env.DB.batch(st);
  return json({ ok: true });
}
