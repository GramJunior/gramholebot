// Analytics: the game batches small events, the server keeps only aggregated daily counters
// (no payloads, no personal data beyond the user id in `active_days` / `ev_seen`).
//   POST /events { events: [{ e: 'ftue:first_kill' }, { e: 'stage_finish', k: '1-3' }, ...] }  (max 50 per batch)
//   GET  /admin/metrics?days=14   cohorts (new players per day, D1/D7 retention) + top event counters
import { fail, json, readJson, int } from '../lib/http.js';
import { requireUser } from './auth.js';
import { requireAdmin } from './live.js';
import { dayKey, DAY_MS } from '../lib/time.js';

export const EVENT_RE = /^[a-z0-9_]{1,24}(?::[a-z0-9_.-]{1,24})?$/;
export const MAX_BATCH = 50;
const MAX_PER_DAY = 2000; // per player per day (spam guard); extra events are dropped silently

/** Mark a player as active today (used by auth and /events). */
export async function markActive(env, uid, now) {
  await env.DB.prepare('INSERT OR IGNORE INTO active_days (uid, day) VALUES (?,?)').bind(uid, dayKey(now, env)).run();
}

/** Normalise one client event into a counter name ('name' or 'name:key'), or null if invalid. */
export function eventName(ev) {
  if (!ev || typeof ev !== 'object') return null;
  const e = String(ev.e || '').toLowerCase();
  const k = ev.k === undefined || ev.k === null || ev.k === '' ? '' : String(ev.k).toLowerCase().replace(/[^a-z0-9_.-]/g, '_').slice(0, 24);
  const name = k ? `${e}:${k}` : e;
  return EVENT_RE.test(name) ? name : null;
}

export async function postEvents(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 16 * 1024);
  const list = Array.isArray(body.events) ? body.events : [];
  if (list.length > MAX_BATCH) fail(413, 'too_many', `Не больше ${MAX_BATCH} событий за раз`);
  const day = dayKey(c.now, c.env);
  const counts = new Map();
  let bad = 0;
  for (const ev of list) { const n = eventName(ev); if (!n) { bad++; continue; } counts.set(n, (counts.get(n) || 0) + 1); }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  await c.env.DB.prepare('INSERT INTO active_days (uid, day, ev) VALUES (?,?,?) ON CONFLICT(uid, day) DO UPDATE SET ev = ev + excluded.ev').bind(user.id, day, total).run();
  const used = await c.env.DB.prepare('SELECT ev FROM active_days WHERE uid=? AND day=?').bind(user.id, day).first();
  if (!total || (used && used.ev > MAX_PER_DAY)) return json({ ok: true, accepted: 0, rejected: list.length });
  const names = [...counts.keys()];
  // first time this player sends this event today -> +1 unique user
  const seenRes = await c.env.DB.batch(names.map((name) => c.env.DB.prepare('INSERT OR IGNORE INTO ev_seen (day, name, uid) VALUES (?,?,?)').bind(day, name, user.id)));
  await c.env.DB.batch(names.map((name, i) => c.env.DB.prepare(
    'INSERT INTO ev_counts (day, name, n, users) VALUES (?,?,?,?) ON CONFLICT(day, name) DO UPDATE SET n = n + excluded.n, users = users + excluded.users'
  ).bind(day, name, counts.get(name), seenRes[i] && seenRes[i].meta && seenRes[i].meta.changes ? 1 : 0)));
  return json({ ok: true, accepted: list.length - bad, rejected: bad });
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
  });
}
