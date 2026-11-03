// Abyss (Бездна) runs and leaderboards.
//   POST /abyss/start  { startFloor }            -> { runId, startFloor }
//   POST /abyss/finish { runId, floor, timeMs }  -> { recorded, best:{all,week,season} }
//   GET  /lb/abyss?board=week|all|season&filter=global|friends|clan&week=2026-W45&limit=50
import { fail, json, readJson, int, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { checkAbyssRun, maxStartFloor } from '../lib/anticheat.js';
import { isoWeek, nextWeekStart } from '../lib/time.js';
import { loadConfig, activeSeason } from '../lib/config.js';
import { addContrib, addBpXp, audit, clanOf, clanFeed, newRunId } from '../lib/common.js';

export async function abyssStart(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  const best = await c.env.DB.prepare("SELECT floor FROM lb_abyss WHERE period='all' AND uid=?").bind(user.id).first();
  const startFloor = Math.max(1, int(body.startFloor, 1));
  if (startFloor > maxStartFloor(best ? best.floor : 0)) fail(400, 'bad_start', 'Нельзя начать с этого этажа');
  const id = newRunId();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE runs SET status='abandoned' WHERE uid=? AND kind='abyss' AND status='open'").bind(user.id),
    c.env.DB.prepare("INSERT INTO runs (id, uid, kind, start_floor, started_at) VALUES (?,?,'abyss',?,?)").bind(id, user.id, startFloor, c.now),
  ]);
  return json({ ok: true, runId: id, startFloor, serverTime: c.now });
}

const UPSERT_LB = `INSERT INTO lb_abyss (period, uid, floor, time_ms, updated_at) VALUES (?,?,?,?,?)
  ON CONFLICT(period, uid) DO UPDATE SET floor=excluded.floor, time_ms=excluded.time_ms, updated_at=excluded.updated_at
  WHERE excluded.floor > lb_abyss.floor OR (excluded.floor = lb_abyss.floor AND excluded.time_ms < lb_abyss.time_ms)`;

/** Periods a finished run counts for. */
export function periodsFor(now, env, cfg) {
  const p = ['all', 'w:' + isoWeek(now, env)];
  const s = activeSeason(cfg, now);
  if (s) p.push('s:' + s.id);
  return p;
}

export async function abyssFinish(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 2048);
  const runId = str(body.runId, 64);
  const run = await c.env.DB.prepare("SELECT * FROM runs WHERE id=? AND kind='abyss'").bind(runId).first();
  if (!run || run.uid !== user.id) fail(404, 'no_run', 'Забег не найден');
  if (run.status !== 'open') fail(409, 'run_closed', 'Забег уже завершён');
  const floor = int(body.floor, -1);
  const timeMs = int(body.timeMs, -1);
  const chk = checkAbyssRun({ startFloor: run.start_floor, startedAt: run.started_at, floor, timeMs, now: c.now, env: c.env });
  const result = JSON.stringify({ floor, timeMs, reason: chk.reason || null });
  const upd = await c.env.DB.prepare("UPDATE runs SET status=?, finished_at=?, result=? WHERE id=? AND status='open'")
    .bind(chk.ok ? 'done' : 'rejected', c.now, result, runId).run();
  if (!upd.meta.changes) fail(409, 'run_closed', 'Забег уже завершён');
  if (!chk.ok) {
    await audit(c.env, user.id, 'abyss_rejected', { floor, timeMs, reason: chk.reason }, c.now);
    fail(422, 'run_rejected', 'Результат забега не прошёл проверку', { reason: chk.reason });
  }
  const cfg = await loadConfig(c.env);
  const out = { ok: true, recorded: chk.cleared > 0, cleared: chk.cleared, newRecord: false };
  if (chk.cleared > 0) {
    const prevAll = await c.env.DB.prepare("SELECT floor FROM lb_abyss WHERE period='all' AND uid=?").bind(user.id).first();
    const periods = periodsFor(c.now, c.env, cfg);
    await c.env.DB.batch(periods.map((p) => c.env.DB.prepare(UPSERT_LB).bind(p, user.id, floor, timeMs, c.now)));
    await addContrib(c.env, user.id, chk.cleared, c.now);
    await addBpXp(c.env, user.id, chk.cleared * ((cfg.battlepass.xp && cfg.battlepass.xp.abyssFloor) || 0), c.now, cfg);
    if (!prevAll || floor > prevAll.floor) {
      out.newRecord = true;
      const clan = await clanOf(c.env, user.id);
      if (clan && floor >= 5) await clanFeed(c.env, clan.clan_id, 'abyss_record', user.id, { floor }, c.now);
    }
  }
  return json(out);
}

export async function lbAbyss(c) {
  const q = c.url.searchParams;
  const board = q.get('board') || 'week';
  const filter = q.get('filter') || 'global';
  const limit = Math.min(100, Math.max(1, int(q.get('limit'), 50)));
  let period;
  if (board === 'all') period = 'all';
  else if (board === 'week') {
    const w = q.get('week');
    period = 'w:' + (w && /^\d{4}-W\d{2}$/.test(w) ? w : isoWeek(c.now, c.env));
  } else if (board === 'season') {
    const cfg = await loadConfig(c.env);
    const sid = q.get('season') || (activeSeason(cfg, c.now) || {}).id;
    if (!sid) return json({ ok: true, board, period: null, entries: [], me: null, note: 'Сезон не активен' });
    period = 's:' + String(sid).slice(0, 32);
  } else fail(400, 'bad_board', 'board: week | all | season');

  // Friends/clan views need a session; the global view is public (but shows "me" if logged in).
  let user = null;
  if (filter !== 'global' || (c.req.headers.get('authorization') || '').startsWith('Bearer ')) user = await requireUser(c);

  let where = 'l.period=? AND u.banned=0';
  const args = [period];
  if (filter === 'friends') {
    where += ` AND (l.uid=? OR l.uid IN (SELECT friend_uid FROM friends WHERE uid=?)
      OR l.uid IN (SELECT uid FROM clan_members WHERE clan_id=(SELECT clan_id FROM clan_members WHERE uid=?)))`;
    args.push(user.id, user.id, user.id);
  } else if (filter === 'clan') {
    where += ' AND l.uid IN (SELECT uid FROM clan_members WHERE clan_id=(SELECT clan_id FROM clan_members WHERE uid=?))';
    args.push(user.id);
  } else if (filter !== 'global') fail(400, 'bad_filter', 'filter: global | friends | clan');

  const rows = (await c.env.DB.prepare(
    `SELECT l.uid, l.floor, l.time_ms, u.ref_code, u.first_name, cl.tag FROM lb_abyss l
     JOIN users u ON u.id=l.uid LEFT JOIN clan_members m ON m.uid=l.uid LEFT JOIN clans cl ON cl.id=m.clan_id
     WHERE ${where} ORDER BY l.floor DESC, l.time_ms ASC, l.updated_at ASC LIMIT ?`
  ).bind(...args, limit).all()).results;
  const entries = rows.map((r, i) => ({ rank: i + 1, pid: r.ref_code, name: (r.first_name || 'Искроносец').slice(0, 32), clanTag: r.tag || null, floor: r.floor, timeMs: r.time_ms, me: user ? r.uid === user.id : false }));

  let me = null;
  if (user) {
    const mine = await c.env.DB.prepare('SELECT floor, time_ms FROM lb_abyss WHERE period=? AND uid=?').bind(period, user.id).first();
    if (mine) {
      const better = await c.env.DB.prepare(
        `SELECT COUNT(*) n FROM lb_abyss l JOIN users u ON u.id=l.uid WHERE ${where} AND (l.floor > ? OR (l.floor = ? AND l.time_ms < ?))`
      ).bind(...args, mine.floor, mine.floor, mine.time_ms).first();
      me = { rank: (better ? better.n : 0) + 1, floor: mine.floor, timeMs: mine.time_ms };
    }
  }
  const extra = board === 'week' ? { resetsAt: nextWeekStart(c.now, c.env) } : {};
  return json({ ok: true, board, filter, period, entries, me, ...extra, serverTime: c.now });
}
