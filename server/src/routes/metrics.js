// Analytics: the game batches small events, the server keeps only aggregated daily counters
// (no payloads, no personal data beyond the user id in `active_days` / `ev_seen`).
//   POST /events { events: [{ e: 'ftue:first_kill' }, { e: 'stage_finish', k: '1-3' }, ...] }  (max 50 per batch)
//   GET  /admin/metrics?days=14   cohorts (new players per day, D1/D7 retention) + top event counters + client errors
// v39: crash reports ride the same pipeline: { e: 'error', k: '<sig>', d: { m: message, s: stack top, v: version, md: mode } }.
// They are counted like any event ('error:<sig>') and summarised per day in err_reports (first message/stack kept, capped).
//   GET  /admin/errors?days=7     top error signatures
import { fail, json, readJson, int } from '../lib/http.js';
import { requireUser } from './auth.js';
import { requireAdmin } from './live.js';
import { dayKey, DAY_MS, offsetMs } from '../lib/time.js';
import { activateReferral, REF_ACTIVATE_MILESTONE } from '../lib/common.js';

export const EVENT_RE = /^[a-z0-9_]{1,24}(?::[a-z0-9_.-]{1,24})?$/;
export const MAX_BATCH = 50;
const MAX_PER_DAY = 2000; // per player per day (spam guard); extra events are dropped silently
const ERR_PER_BATCH = 5; // error reports with details per batch (the rest are counted only)
const clip = (v, n) => (typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').slice(0, n);

/** Error details from an `error` event, or null. */
export function errDetail(ev, name) {
  if (!ev || String(ev.e || '').toLowerCase() !== 'error' || !name || !name.startsWith('error:')) return null;
  const d = ev.d && typeof ev.d === 'object' && !Array.isArray(ev.d) ? ev.d : {};
  return { sig: name.slice(6), msg: clip(d.m, 200), stack: clip(d.s, 300), ver: clip(d.v, 24), mode: clip(d.md, 16) };
}

/** Mark a player as active today (used by auth and /events). v41: also fixes the player's cohort day (users.day0) once. */
export async function markActive(env, uid, now, user) {
  const day = dayKey(now, env);
  await env.DB.prepare('INSERT OR IGNORE INTO active_days (uid, day) VALUES (?,?)').bind(uid, day).run();
  if (user && !user.day0) { await env.DB.prepare('UPDATE users SET day0=? WHERE id=? AND day0 IS NULL').bind(day, uid).run(); user.day0 = day; }
}

/** Normalise one client event into a counter name ('name' or 'name:key'), or null if invalid. */
export function eventName(ev) {
  if (!ev || typeof ev !== 'object') return null;
  const e = String(ev.e || '').toLowerCase();
  const k = ev.k === undefined || ev.k === null || ev.k === '' ? '' : String(ev.k).toLowerCase().replace(/[^a-z0-9_.-]/g, '_').slice(0, 24);
  const name = k ? `${e}:${k}` : e;
  return EVENT_RE.test(name) ? name : null;
}

// v41 protocol (old clients keep working: every new field is optional):
//   POST /events { events: [{ e, k?, v?, t?, o?, d? }], now?, sess?, sec?, st?, na?, ver? }
//   v   — integer 0..10^7, summed into ev_counts.v (gold earned, seconds in a stage, ms to boot…)
//   t   — client time (ms) of the event; `now` — client clock at send time: t + (server − client) skew puts an
//         offline event into its real game day. Allowed window: [server now − 72 h (not before the profile), now + 5 min],
//         anything outside lands in the current day.
//   o:1 — one-time step -> also a per-player milestone (table milestones, max 64 per player); 'ftue:*', 'ret:*',
//         'first_*', 'pay:*', 'app_open:*' are milestones even without o (old clients send them via trackOnce too).
//   sess / sec — sessions started and active seconds since the last batch (active_days.sess/sec, capped); st — when.
//   na:1 — «Отправлять статистику» is off: only error reports are counted, no milestones/sessions; remembered in
//          users.stats_off (na:0 clears it; a batch without na follows the stored flag).
export const T_PAST_MS = 72 * 3600000;
export const T_FUTURE_MS = 5 * 60000;
export const V_MAX = 1e7;
export const MS_MAX = 64;
const SEC_BATCH_MAX = 4 * 3600;
const SEC_DAY_MAX = 20 * 3600;
const MS_AUTO = /^(?:ftue|ret|first_fail|first_win|pay|app_open):/;

/** Server-side time of a client timestamp: skew-corrected and clamped to the allowed window (else `now`). */
export function eventTime(t, skew, now, createdAt) {
  const x = Number(t);
  if (t === undefined || t === null || !Number.isFinite(x) || x <= 0) return now;
  const ts = Math.round(x + skew);
  const lo = Math.max(now - T_PAST_MS, Number(createdAt) || 0);
  return ts < lo || ts > now + T_FUTURE_MS ? now : ts;
}
const clampInt = (v, lo, hi) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo; };
const changed = (r) => (r && r.meta && r.meta.changes ? 1 : 0);

export async function postEvents(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 16 * 1024);
  const list = Array.isArray(body.events) ? body.events : [];
  if (list.length > MAX_BATCH) fail(413, 'too_many', `Не больше ${MAX_BATCH} событий за раз`);
  const DB = c.env.DB;
  const na = body.na === 1 || body.na === true ? 1 : body.na === 0 || body.na === false ? 0 : null;
  const off = na === null ? !!user.stats_off : !!na;
  if (na !== null && na !== (user.stats_off ? 1 : 0)) await DB.prepare('UPDATE users SET stats_off=? WHERE id=?').bind(na, user.id).run();
  const cn = Number(body.now);
  const skew = Number.isFinite(cn) && cn > 0 && Math.abs(c.now - cn) < 30 * 86400000 ? c.now - cn : 0;
  const today = dayKey(c.now, c.env);
  const agg = new Map(); // 'day|name' -> { day, name, n, v }
  const perDay = new Map(); // day -> events
  const ms = new Map(); // milestone -> ts
  const errs = new Map();
  let bad = 0, skipped = 0;
  for (const ev of list) {
    const n = eventName(ev); if (!n) { bad++; continue; }
    if (off && !n.startsWith('error:')) { skipped++; continue; }
    const ts = eventTime(ev.t, skew, c.now, user.created_at);
    const day = dayKey(ts, c.env);
    const v = ev.v === undefined || ev.v === null ? 0 : clampInt(ev.v, 0, V_MAX);
    const key = day + '|' + n;
    const a = agg.get(key); if (a) { a.n++; a.v += v; } else agg.set(key, { day, name: n, n: 1, v });
    perDay.set(day, (perDay.get(day) || 0) + 1);
    if (!off && (ev.o === 1 || ev.o === true || MS_AUTO.test(n)) && !n.startsWith('error:')) { const p = ms.get(n); if (!p || ts < p) ms.set(n, ts); }
    const ed = errDetail(ev, n); if (ed) { const o = errs.get(day + '|' + ed.sig); if (o) o.n++; else if (errs.size < ERR_PER_BATCH) errs.set(day + '|' + ed.sig, { ...ed, day, n: 1 }); }
  }
  const sess = off ? 0 : clampInt(body.sess, 0, 5);
  const sec = off ? 0 : clampInt(body.sec, 0, SEC_BATCH_MAX);
  const sDay = dayKey(eventTime(body.st, skew, c.now, user.created_at), c.env);
  if (sess || sec) perDay.set(sDay, perDay.get(sDay) || 0);
  if (!perDay.size) perDay.set(today, 0);
  const days = [...perDay.keys()];
  await DB.batch(days.map((d) => DB.prepare(
    'INSERT INTO active_days (uid, day, ev, sess, sec) VALUES (?,?,?,?,?) ' +
    'ON CONFLICT(uid, day) DO UPDATE SET ev = ev + excluded.ev, sess = sess + excluded.sess, sec = MIN(' + SEC_DAY_MAX + ', sec + excluded.sec)'
  ).bind(user.id, d, perDay.get(d), d === sDay ? sess : 0, d === sDay ? sec : 0)));
  if (!user.day0) { await DB.prepare('UPDATE users SET day0=? WHERE id=? AND day0 IS NULL').bind(today, user.id).run(); user.day0 = today; }
  if (!off && !user.ver0 && typeof body.ver === 'string' && /^[A-Za-z0-9._-]{1,24}$/.test(body.ver)) await DB.prepare('UPDATE users SET ver0=? WHERE id=? AND ver0 IS NULL').bind(body.ver, user.id).run();
  // spam guard per player and game day: extra events are dropped silently
  const over = new Set();
  for (const d of days) {
    if (!perDay.get(d)) continue;
    const used = await DB.prepare('SELECT ev FROM active_days WHERE uid=? AND day=?').bind(user.id, d).first();
    if (used && used.ev > MAX_PER_DAY) over.add(d);
  }
  const rows = [...agg.values()].filter((r) => !over.has(r.day));
  if (rows.length) {
    // first time this player sends this event this day -> +1 unique user
    const seenRes = await DB.batch(rows.map((r) => DB.prepare('INSERT OR IGNORE INTO ev_seen (day, name, uid) VALUES (?,?,?)').bind(r.day, r.name, user.id)));
    const fresh = rows.map((r, i) => changed(seenRes[i]));
    await DB.batch(rows.map((r, i) => DB.prepare(
      'INSERT INTO ev_counts (day, name, n, users, v) VALUES (?,?,?,?,?) ON CONFLICT(day, name) DO UPDATE SET n = n + excluded.n, users = users + excluded.users, v = v + excluded.v'
    ).bind(r.day, r.name, r.n, fresh[i], r.v)));
    const live = [...errs.values()].filter((x) => !over.has(x.day));
    if (live.length) {
      const isFresh = (x) => { const i = rows.findIndex((r) => r.day === x.day && r.name === 'error:' + x.sig); return i >= 0 ? fresh[i] : 0; };
      await DB.batch(live.map((x) => DB.prepare(
        `INSERT INTO err_reports (day, sig, msg, stack, ver, mode, n, users, last) VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT(day, sig) DO UPDATE SET n = n + excluded.n, users = users + excluded.users, last = excluded.last, ver = excluded.ver, mode = excluded.mode`
      ).bind(x.day, x.sig, x.msg, x.stack, x.ver, x.mode, x.n, isFresh(x), c.now)));
    }
  }
  let milestones = 0;
  if (ms.size) {
    const have = await DB.prepare('SELECT COUNT(*) n FROM milestones WHERE uid=?').bind(user.id).first('n');
    const ins = [...ms.entries()].slice(0, Math.max(0, MS_MAX - (have || 0)));
    if (ins.length) {
      const res = await DB.batch(ins.map(([m, ts]) => DB.prepare('INSERT OR IGNORE INTO milestones (uid, m, ts) VALUES (?,?,?)').bind(user.id, m, ts)));
      milestones = res.reduce((a, r) => a + changed(r), 0);
    }
    if (ms.has(REF_ACTIVATE_MILESTONE)) await activateReferral(c.env, user, c.now);
  }
  return json({ ok: true, accepted: list.length - bad - skipped, rejected: bad, skipped, milestones, statsOff: off });
}

/** Retention cohorts: a player's cohort is the first day they were seen in active_days. */
export async function cohorts(env, now, days) {
  const from = dayKey(now - (days - 1) * DAY_MS, env);
  const rows = (await env.DB.prepare(
    `WITH f AS (SELECT uid, MIN(day) d0 FROM active_days GROUP BY uid)
     SELECT f.d0 day, COUNT(*) n,
       SUM(CASE WHEN EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+1 day')) THEN 1 ELSE 0 END) d1,
       SUM(CASE WHEN EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+7 day')) THEN 1 ELSE 0 END) d7
     FROM f WHERE f.d0>=? GROUP BY f.d0 ORDER BY f.d0`
  ).bind(from).all()).results;
  const today = dayKey(now, env);
  const plus = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
  return rows.map((r) => ({
    day: r.day, newPlayers: r.n,
    d1: plus(r.day, 1) <= today ? r.d1 : null, d7: plus(r.day, 7) <= today ? r.d7 : null,
    d1Pct: plus(r.day, 1) <= today && r.n ? Math.round((r.d1 / r.n) * 1000) / 10 : null,
    d7Pct: plus(r.day, 7) <= today && r.n ? Math.round((r.d7 / r.n) * 1000) / 10 : null,
  }));
}

export async function adminMetrics(c) {
  requireAdmin(c);
  const days = Math.max(1, Math.min(60, int(c.url.searchParams.get('days'), 14)));
  const from = dayKey(c.now - (days - 1) * DAY_MS, c.env);
  const events = (await c.env.DB.prepare('SELECT day, name, n, users FROM ev_counts WHERE day>=? ORDER BY day, name').bind(from).all()).results;
  const dau = (await c.env.DB.prepare('SELECT day, COUNT(*) n FROM active_days WHERE day>=? GROUP BY day ORDER BY day').bind(from).all()).results;
  const prefix = c.url.searchParams.get('prefix');
  return json({
    ok: true, from, to: dayKey(c.now, c.env),
    dau, cohorts: await cohorts(c.env, c.now, days),
    events: prefix ? events.filter((e) => e.name.startsWith(prefix)) : events,
    errors: await topErrors(c.env, from, 20),
  });
}

async function topErrors(env, from, limit) {
  return (await env.DB.prepare(
    'SELECT sig, MAX(msg) msg, MAX(stack) stack, MAX(ver) ver, MAX(mode) mode, SUM(n) n, SUM(users) users, MAX(last) last FROM err_reports WHERE day>=? GROUP BY sig ORDER BY SUM(n) DESC LIMIT ?'
  ).bind(from, limit).all()).results;
}

/** GET /admin/errors?days=7 — client crash reports, most frequent first. */
export async function adminErrors(c) {
  requireAdmin(c);
  const days = Math.max(1, Math.min(60, int(c.url.searchParams.get('days'), 7)));
  const from = dayKey(c.now - (days - 1) * DAY_MS, c.env);
  return json({ ok: true, from, errors: await topErrors(c.env, from, 100) });
}
