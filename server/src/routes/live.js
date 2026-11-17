// Live config (season, battle pass, events, shop rotation), battle pass progress and admin API.
import { fail, json, readJson, int, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { loadConfig, activeSeason, activeEvents, shopRotation, CONFIG_KEYS, DEFAULTS } from '../lib/config.js';
import { safeEqual } from '../lib/crypto.js';
import { addInbox, userByPid, getUser } from '../lib/common.js';
import { currentPass, nextPass, passError, wbWeek, WB_TIERS } from '../lib/liveops.js';
import { nextWeekStart } from '../lib/time.js';

/** GET /config — public, cacheable. */
export async function getConfig(c) {
  const cfg = await loadConfig(c.env);
  const season = activeSeason(cfg, c.now);
  const events = Array.isArray(cfg.events) ? cfg.events : [];
  return json({
    ok: true,
    version: cfg.version,
    serverTime: c.now,
    season,
    battlepass: currentPass(cfg, c.now),
    // v42: the next dated season (teaser «скоро»), weekly overlord of this game week (src/routes/liveops.js)
    nextSeason: (() => { const n = nextPass(cfg, c.now); return n ? { id: n.season, name: n.name, start: n.start, end: n.end, theme: n.theme } : null; })(),
    wb: { ...wbWeek(c.now, c.env, (cfg.wb && cfg.wb.rotation) || undefined), resetsAt: nextWeekStart(c.now, c.env), tiers: WB_TIERS },
    events: activeEvents(events, c.now),
    upcoming: events.filter((e) => e && e.start && e.start > c.now).slice(0, 5),
    // v42: the whole dated calendar (for the «Календарь» tab), without descriptions
    calendar: events.filter((e) => e && e.start && e.end).map((e) => ({ id: e.id, base: e.base, name: e.name, type: e.type, icon: e.icon, col: e.col, start: e.start, end: e.end })),
    shop: shopRotation(cfg.shop || {}, c.now),
    products: (cfg.products || []).filter((p) => p.type !== 'battlepass' || !p.season || p.id === currentPass(cfg, c.now).premiumProduct).map((p) => ({ id: p.id, title: p.title, description: p.description, stars: p.stars, type: p.type, once: !!p.once, weekly: !!p.weekly, tag: p.tag || undefined, grant: p.grant || undefined, firstX2: p.firstX2 ? true : undefined, days: p.days || undefined, perDay: p.perDay || undefined })),
    freeChestHours: cfg.freeChestHours,
    // v39.4: Adsgram block ids (public) and whether ad rewards are verified on the server (src/routes/ads.js)
    adsBlockRewarded: String((cfg.ads && cfg.ads.blockRewarded) || ''),
    adsBlockInterstitial: String((cfg.ads && cfg.ads.blockInterstitial) || ''),
    adsVerify: !!(cfg.ads && cfg.ads.verify),
    daily: { rewards: (cfg.daily || {}).rewards || [] },
  }, 200, { 'cache-control': 'public, max-age=60' });
}

function bpSeasonId(cfg, now) {
  const s = activeSeason(cfg, now);
  return s ? s.id : currentPass(cfg, now).season;
}
/** v42: pass definition for a season id (dated `passes`, or the legacy `battlepass`). */
function passFor(cfg, sid, now) {
  const p = currentPass(cfg, now);
  if (p.season === sid) return p;
  const list = Array.isArray(cfg.passes) ? cfg.passes : [];
  return list.find((x) => x.season === sid) || p;
}

async function hasPremium(env, uid, product) {
  if (!product) return false;
  const e = await env.DB.prepare('SELECT qty FROM entitlements WHERE uid=? AND product_id=?').bind(uid, product).first();
  return !!(e && e.qty > 0);
}

/** GET /bp — my battle pass progress. */
export async function getBp(c) {
  const user = await requireUser(c);
  const cfg = await loadConfig(c.env);
  const sid = bpSeasonId(cfg, c.now);
  const row = sid ? await c.env.DB.prepare('SELECT xp, claimed FROM bp_progress WHERE uid=? AND season=?').bind(user.id, sid).first() : null;
  const xp = row ? row.xp : 0;
  const P = passFor(cfg, sid, c.now);
  const per = P.xpPerTier || 200;
  return json({ ok: true, season: sid, name: P.name, xp, tier: Math.floor(xp / per), xpPerTier: per, claimed: row ? JSON.parse(row.claimed) : [], premium: await hasPremium(c.env, user.id, P.premiumProduct), premiumProduct: P.premiumProduct, tiers: P.tiers });
}

/** POST /bp/claim { tier, track: 'free'|'premium' } -> { reward } */
export async function claimBp(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 512);
  const cfg = await loadConfig(c.env);
  const sid = bpSeasonId(cfg, c.now);
  if (!sid) fail(409, 'no_season', 'Сезон не активен');
  const tier = int(body.tier, 0);
  const track = body.track === 'premium' ? 'premium' : 'free';
  const P = passFor(cfg, sid, c.now);
  const T = (P.tiers || []).find((t) => t.tier === tier);
  if (!T || !T[track]) fail(404, 'no_tier', 'Нет такой награды');
  const row = await c.env.DB.prepare('SELECT xp, claimed FROM bp_progress WHERE uid=? AND season=?').bind(user.id, sid).first();
  const xp = row ? row.xp : 0;
  if (!row || Math.floor(xp / (P.xpPerTier || 200)) < tier) fail(409, 'locked', 'Уровень пропуска ещё не открыт');
  if (track === 'premium' && !(await hasPremium(c.env, user.id, P.premiumProduct))) fail(402, 'no_premium', 'Нужен премиум-пропуск');
  const claimed = row ? JSON.parse(row.claimed) : [];
  const key = `${track}:${tier}`;
  if (claimed.includes(key)) fail(409, 'claimed', 'Награда уже получена');
  claimed.push(key);
  // Optimistic: only succeeds if `claimed` didn't change since we read it.
  const r = await c.env.DB.prepare('UPDATE bp_progress SET claimed=? WHERE uid=? AND season=? AND claimed=?').bind(JSON.stringify(claimed), user.id, sid, row.claimed).run();
  if (!r.meta.changes) fail(409, 'claimed', 'Награда уже получена');
  return json({ ok: true, reward: T[track], claimed });
}

// ---------------- admin ----------------
export function requireAdmin(c) {
  const s = c.env.ADMIN_SECRET;
  if (!s || String(s).length < 16) fail(503, 'admin_disabled', 'ADMIN_SECRET не задан');
  const h = c.req.headers.get('authorization') || '';
  if (!safeEqual(h, 'Bearer ' + s)) fail(401, 'not_admin', 'Нет доступа');
}

function validateConfig(key, v) {
  const bad = (m) => fail(400, 'bad_config', m);
  if (key === 'season') {
    if (v === null) return;
    if (typeof v !== 'object' || !/^[a-z0-9_-]{1,32}$/i.test(v.id || '')) bad('season.id обязателен (a-z0-9_-)');
    if (v.start && v.end && v.end <= v.start) bad('season.end должен быть позже start');
  } else if (key === 'events') {
    if (!Array.isArray(v)) bad('events — массив');
    for (const e of v) if (!e || !e.id || typeof e.start !== 'number' || typeof e.end !== 'number' || e.end <= e.start) bad('у события нужны id, start, end (мс)');
  } else if (key === 'products') {
    if (!Array.isArray(v)) bad('products — массив');
    for (const p of v) if (!p || !/^[a-z0-9_]{2,40}$/.test(p.id || '') || !p.title || !Number.isInteger(p.stars) || p.stars < 1 || p.stars > 100000) bad('товар: id (a-z0-9_), title, stars (целое 1..100000)');
    for (const p of v) if ((p.perDay !== undefined && (!Number.isInteger(p.perDay) || p.perDay < 0 || p.perDay > 10000)) || (p.days !== undefined && (!Number.isInteger(p.days) || p.days < 1 || p.days > 366))) bad('товар: days — целое 1..366, perDay — целое 0..10000');
    for (const p of v) if (p.grant !== undefined && (typeof p.grant !== 'object' || !p.grant || Object.values(p.grant).some((x) => !Number.isFinite(x) || x < 0 || x > 1e6))) bad('товар: grant — объект {ключ: число ≥ 0}');
  } else if (key === 'freeChestHours') {
    if (!Number.isFinite(v) || v < 0.5 || v > 72) bad('freeChestHours — число часов 0.5..72');
  } else if (key === 'ads') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) bad('ads — объект {blockRewarded, blockInterstitial, verify, caps}');
    for (const k of ['blockRewarded', 'blockInterstitial']) if (v[k] !== undefined && (typeof v[k] !== 'string' || !/^[A-Za-z0-9_-]{0,40}$/.test(v[k]))) bad(`ads.${k} — id блока Adsgram (например "12345" или "int-12345")`);
    if (v.verify !== undefined && typeof v.verify !== 'boolean') bad('ads.verify — true/false');
    if (v.caps !== undefined && (typeof v.caps !== 'object' || !v.caps || Array.isArray(v.caps) || Object.entries(v.caps).some(([k, x]) => !/^[a-z0-9_]{1,16}$/.test(k) || !Number.isInteger(x) || x < 0 || x > 100))) bad('ads.caps — {место: целое 0..100}');
  } else if (key === 'battlepass') {
    if (!v || !Array.isArray(v.tiers)) bad('battlepass.tiers — массив');
    const e = passError(v); if (e) bad('battlepass: ' + e);
  } else if (key === 'passes') {
    if (!Array.isArray(v) || !v.length || v.length > 20) bad('passes — массив из 1..20 пропусков');
    const ids = new Set();
    for (const p of v) { const e = passError(p); if (e) bad('passes: ' + e); if (!p.start || !p.end) bad('passes: у пропуска нужны start и end (мс)'); if (ids.has(p.season)) bad('passes: повтор season ' + p.season); ids.add(p.season); }
    const sorted = v.slice().sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) if (sorted[i].start < sorted[i - 1].end) bad('passes: сезоны пересекаются (' + sorted[i - 1].season + ' / ' + sorted[i].season + ')');
  } else if (key === 'goals') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) bad('goals — объект {id: цель}');
    for (const [id, g] of Object.entries(v)) {
      if (!/^[a-z0-9_]{2,32}$/.test(id) || !g || !Number.isInteger(g.target) || g.target < 1 || !Array.isArray(g.tiers) || !g.tiers.length) bad('goals.' + id + ': target (целое ≥ 1) и tiers [{pct, reward}]');
      for (const t of g.tiers) if (!Number.isFinite(t.pct) || t.pct <= 0 || t.pct > 100 || !t.reward || typeof t.reward !== 'object') bad('goals.' + id + ': порог pct 1..100 и reward');
    }
  } else if (key === 'wb') {
    if (!v || !Array.isArray(v.rotation) || !v.rotation.length || v.rotation.some((w) => !w || typeof w.boss !== 'string' || !Array.isArray(w.mods))) bad('wb.rotation — массив [{boss, mods:[…]}]');
  } else if (!v || typeof v !== 'object') bad('ожидался объект');
}

export async function adminGetConfig(c) {
  requireAdmin(c);
  const rows = (await c.env.DB.prepare('SELECT key, value, updated_at FROM config').all()).results;
  return json({ ok: true, keys: CONFIG_KEYS, stored: Object.fromEntries(rows.map((r) => [r.key, { value: JSON.parse(r.value), updatedAt: r.updated_at }])), defaults: DEFAULTS });
}

export async function adminPutConfig(c) {
  requireAdmin(c);
  const key = c.params.key;
  if (!CONFIG_KEYS.includes(key)) fail(404, 'bad_key', 'Ключи: ' + CONFIG_KEYS.join(', '));
  const text = await c.req.text();
  if (text.length > 128 * 1024) fail(413, 'too_large', 'Слишком большой конфиг');
  let v;
  try { v = JSON.parse(text); } catch { fail(400, 'bad_json', 'Некорректный JSON'); }
  validateConfig(key, v);
  await c.env.DB.prepare('INSERT INTO config (key, value, updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
    .bind(key, JSON.stringify(v), c.now).run();
  return json({ ok: true, key, updatedAt: c.now });
}

export async function adminDeleteConfig(c) {
  requireAdmin(c);
  await c.env.DB.prepare('DELETE FROM config WHERE key=?').bind(c.params.key).run();
  return json({ ok: true, key: c.params.key, reset: 'default' });
}

/** POST /admin/grant { pid, productId, qty } — manual entitlement (support cases). */
export async function adminGrant(c) {
  requireAdmin(c);
  const b = await readJson(c.req, 1024);
  const u = await userByPid(c.env, b.pid);
  const qty = int(b.qty, 1);
  await c.env.DB.prepare('INSERT INTO entitlements (uid, product_id, qty, updated_at) VALUES (?,?,?,?) ON CONFLICT(uid, product_id) DO UPDATE SET qty=MAX(0, qty+excluded.qty), updated_at=excluded.updated_at')
    .bind(u.id, str(b.productId, 40), qty, c.now).run();
  return json({ ok: true });
}

/** POST /admin/inbox { pid, title, reward } — send a reward letter. */
export async function adminInbox(c) {
  requireAdmin(c);
  const b = await readJson(c.req, 4096);
  const u = await userByPid(c.env, b.pid);
  await addInbox(c.env, u.id, 'admin', str(b.title, 120) || 'Подарок', b.reward || {}, c.now);
  return json({ ok: true });
}

/** POST /admin/ban { pid, banned } */
export async function adminBan(c) {
  requireAdmin(c);
  const b = await readJson(c.req, 1024);
  const u = await userByPid(c.env, b.pid);
  await c.env.DB.prepare('UPDATE users SET banned=? WHERE id=?').bind(b.banned === false ? 0 : 1, u.id).run();
  return json({ ok: true, banned: !!(await getUser(c.env, u.id)).banned });
}

/** GET /admin/audit?limit=100 — suspicious activity, most flagged players first. */
export async function adminAudit(c) {
  requireAdmin(c);
  const limit = Math.min(500, Math.max(1, int(c.url.searchParams.get('limit'), 100)));
  const top = (await c.env.DB.prepare("SELECT ref_code pid, COALESCE(NULLIF(display_name,''), first_name) name, flags, banned FROM users WHERE flags>0 ORDER BY flags DESC LIMIT 50").all()).results;
  const recent = (await c.env.DB.prepare('SELECT a.kind, a.detail, a.ts, u.ref_code pid FROM audit a JOIN users u ON u.id=a.uid ORDER BY a.id DESC LIMIT ?').bind(limit).all()).results;
  return json({ ok: true, top, recent });
}
