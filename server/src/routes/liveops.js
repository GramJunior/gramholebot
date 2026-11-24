// v42 live-ops routes (migration 0008):
//   GET  /wb                               -> this week's overlord, tiers, my clears and best          (Владыка недели)
//   POST /wb/start   { tier, boss }        -> { runId, week, boss }
//   POST /wb/finish  { runId, timeMs, hearth } -> { recorded, firstClear, best, rank }
//   GET  /lb/wb?filter=global|friends|clan&league=1..3&boss=&week=   weekly board («Честный бой», leagues by Hearth level)
//   GET  /goal/:id                         -> server-wide shared goal: total, tiers, my points/claims  («Ночь Долгих Углей»)
//   POST /goal/:id/contrib { points }      -> add my points (capped per call and per game day; only while its event runs)
//   POST /goal/:id/claim   { pct }         -> reward of a reached threshold (once; needs my own ≥ minPoints)
//   GET  /clan/goal                        -> my clan's weekly goal: thresholds by members, score, my points, claims
//   POST /clan/goal/claim  { tier }        -> reward of a reached clan threshold (once per week; needs my weekly points ≥ minPoints)
import { fail, json, readJson, int, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { loadConfig } from '../lib/config.js';
import { isoWeek, nextWeekStart, dayKey, nextDayStart } from '../lib/time.js';
import { addContrib, audit, clanOf, clanFeed, newRunId, NAME_SQL } from '../lib/common.js';
import { wbWeek, WB_TIERS, WB_BOSS, WB_LEAGUES, wbLeague, checkWbRun, goalEvent, clanThresholds, CLAN_GOAL, GOALS } from '../lib/liveops.js';

const rotationOf = (cfg) => (cfg.wb && Array.isArray(cfg.wb.rotation) && cfg.wb.rotation.length ? cfg.wb.rotation : undefined);

// ---------------- weekly overlord ----------------
export async function getWb(c) {
  const user = await requireUser(c);
  const cfg = await loadConfig(c.env);
  const week = isoWeek(c.now, c.env);
  const w = wbWeek(c.now, c.env, rotationOf(cfg));
  const clears = (await c.env.DB.prepare('SELECT tier, time_ms FROM wb_clears WHERE week=? AND uid=? ORDER BY tier').bind(week, user.id).all()).results;
  const best = await c.env.DB.prepare('SELECT boss, tier, time_ms, league FROM lb_wboss WHERE week=? AND uid=? ORDER BY tier DESC, time_ms ASC LIMIT 1').bind(week, user.id).first();
  return json({ ok: true, week, ...w, tiers: WB_TIERS, leagues: WB_LEAGUES, resetsAt: nextWeekStart(c.now, c.env), cleared: clears.map((r) => r.tier), best: best ? { boss: best.boss, tier: best.tier, timeMs: best.time_ms, league: best.league } : null, serverTime: c.now });
}

export async function wbStart(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  const cfg = await loadConfig(c.env);
  const tier = int(body.tier, 0);
  if (!WB_TIERS.some((t) => t.tier === tier)) fail(400, 'bad_tier', 'Ступень: 1, 2 или 3');
  const w = wbWeek(c.now, c.env, rotationOf(cfg));
  // the player may get the nearest boss they have opened (same modifiers): any known overlord is accepted
  const boss = str(body.boss, 24) || w.boss;
  if (!WB_BOSS[boss]) fail(400, 'bad_boss', 'Неизвестный владыка');
  const id = newRunId();
  const week = isoWeek(c.now, c.env);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE runs SET status='abandoned' WHERE uid=? AND kind='wboss' AND status='open'").bind(user.id),
    c.env.DB.prepare("INSERT INTO runs (id, uid, kind, start_floor, started_at, result) VALUES (?,?,'wboss',?,?,?)").bind(id, user.id, tier, c.now, JSON.stringify({ week, boss })),
  ]);
  return json({ ok: true, runId: id, week, boss, mods: w.mods, tier, serverTime: c.now });
}

const UPSERT_WB = `INSERT INTO lb_wboss (week, boss, uid, tier, time_ms, league, hearth, updated_at) VALUES (?,?,?,?,?,?,?,?)
  ON CONFLICT(week, boss, uid) DO UPDATE SET tier=excluded.tier, time_ms=excluded.time_ms, league=excluded.league, hearth=excluded.hearth, updated_at=excluded.updated_at
  WHERE excluded.tier > lb_wboss.tier OR (excluded.tier = lb_wboss.tier AND excluded.time_ms < lb_wboss.time_ms)`;

export async function wbFinish(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  const runId = str(body.runId, 64);
  const run = await c.env.DB.prepare("SELECT * FROM runs WHERE id=? AND kind='wboss'").bind(runId).first();
  if (!run || run.uid !== user.id) fail(404, 'no_run', 'Бой не найден');
  if (run.status !== 'open') fail(409, 'run_closed', 'Бой уже завершён');
  const meta = JSON.parse(run.result || '{}');
  const timeMs = int(body.timeMs, -1);
  const hearth = Math.max(0, Math.min(99, int(body.hearth, 0)));
  const chk = checkWbRun({ startedAt: run.started_at, now: c.now, timeMs, env: c.env });
  const upd = await c.env.DB.prepare("UPDATE runs SET status=?, finished_at=?, result=? WHERE id=? AND status='open'")
    .bind(chk.ok ? 'done' : 'rejected', c.now, JSON.stringify({ ...meta, timeMs, reason: chk.reason || null }), runId).run();
  if (!upd.meta.changes) fail(409, 'run_closed', 'Бой уже завершён');
  if (!chk.ok) {
    await audit(c.env, user.id, 'wb_rejected', { timeMs, reason: chk.reason }, c.now);
    fail(422, 'run_rejected', 'Результат боя не прошёл проверку', { reason: chk.reason });
  }
  const tier = run.start_floor;
  const league = wbLeague(hearth);
  await c.env.DB.prepare(UPSERT_WB).bind(meta.week, meta.boss, user.id, tier, timeMs, league, hearth, c.now).run();
  const first = await c.env.DB.prepare('INSERT INTO wb_clears (week, uid, tier, time_ms, ts) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING').bind(meta.week, user.id, tier, timeMs, c.now).run();
  const firstClear = !!first.meta.changes;
  if (firstClear) {
    const T = WB_TIERS.find((t) => t.tier === tier);
    await addContrib(c.env, user.id, T ? T.clan : 0, c.now);
    const clan = await clanOf(c.env, user.id);
    if (clan) await clanFeed(c.env, clan.clan_id, 'wb_clear', user.id, { tier, boss: meta.boss, pts: T ? T.clan : 0 }, c.now);
  }
  const mine = await c.env.DB.prepare('SELECT tier, time_ms FROM lb_wboss WHERE week=? AND boss=? AND uid=?').bind(meta.week, meta.boss, user.id).first();
  const better = await c.env.DB.prepare('SELECT COUNT(*) n FROM lb_wboss l JOIN users u ON u.id=l.uid WHERE l.week=? AND l.boss=? AND l.league=? AND u.banned=0 AND (l.tier > ? OR (l.tier = ? AND l.time_ms < ?))')
    .bind(meta.week, meta.boss, league, mine.tier, mine.tier, mine.time_ms).first();
  return json({ ok: true, recorded: true, week: meta.week, boss: meta.boss, tier, firstClear, league, best: { tier: mine.tier, timeMs: mine.time_ms }, rank: (better ? better.n : 0) + 1 });
}

export async function lbWb(c) {
  const q = c.url.searchParams;
  const filter = q.get('filter') || 'global';
  const limit = Math.min(100, Math.max(1, int(q.get('limit'), 50)));
  const cfg = await loadConfig(c.env);
  const w = q.get('week');
  const week = w && /^\d{4}-W\d{2}$/.test(w) ? w : isoWeek(c.now, c.env);
  const boss = WB_BOSS[q.get('boss') || ''] ? q.get('boss') : wbWeek(c.now, c.env, rotationOf(cfg)).boss;
  const league = int(q.get('league'), 0);
  let user = null;
  if (filter !== 'global' || (c.req.headers.get('authorization') || '').startsWith('Bearer ')) user = await requireUser(c);
  let where = 'l.week=? AND l.boss=? AND u.banned=0';
  const args = [week, boss];
  if (league >= 1 && league <= 3) { where += ' AND l.league=?'; args.push(league); }
  if (filter === 'friends') {
    // friends = referrals both ways (stored as pairs) + clan mates (liveops.md §6.4)
    where += ` AND (l.uid=? OR l.uid IN (SELECT friend_uid FROM friends WHERE uid=?)
      OR l.uid IN (SELECT uid FROM clan_members WHERE clan_id=(SELECT clan_id FROM clan_members WHERE uid=?)))`;
    args.push(user.id, user.id, user.id);
  } else if (filter === 'clan') {
    where += ' AND l.uid IN (SELECT uid FROM clan_members WHERE clan_id=(SELECT clan_id FROM clan_members WHERE uid=?))';
    args.push(user.id);
  } else if (filter !== 'global') fail(400, 'bad_filter', 'filter: global | friends | clan');
  const rows = (await c.env.DB.prepare(
    `SELECT l.uid, l.tier, l.time_ms, l.league, u.ref_code, ${NAME_SQL}, cl.tag FROM lb_wboss l
     JOIN users u ON u.id=l.uid LEFT JOIN clan_members m ON m.uid=l.uid LEFT JOIN clans cl ON cl.id=m.clan_id
     WHERE ${where} ORDER BY l.tier DESC, l.time_ms ASC, l.updated_at ASC LIMIT ?`
  ).bind(...args, limit).all()).results;
  const entries = rows.map((r, i) => ({ rank: i + 1, pid: r.ref_code, name: (r.first_name || 'Искроносец').slice(0, 32), clanTag: r.tag || null, tier: r.tier, timeMs: r.time_ms, league: r.league, me: user ? r.uid === user.id : false }));
  let me = null;
  if (user) {
    const mine = await c.env.DB.prepare('SELECT tier, time_ms, league FROM lb_wboss WHERE week=? AND boss=? AND uid=?').bind(week, boss, user.id).first();
    if (mine) {
      const better = await c.env.DB.prepare(`SELECT COUNT(*) n FROM lb_wboss l JOIN users u ON u.id=l.uid WHERE ${where} AND (l.tier > ? OR (l.tier = ? AND l.time_ms < ?))`)
        .bind(...args, mine.tier, mine.tier, mine.time_ms).first();
      me = { rank: (better ? better.n : 0) + 1, tier: mine.tier, timeMs: mine.time_ms, league: mine.league };
    }
  }
  return json({ ok: true, week, boss, filter, league: league || null, entries, me, resetsAt: nextWeekStart(c.now, c.env), serverTime: c.now });
}

// ---------------- server-wide shared goal ----------------
function goalOf(cfg, id) {
  const g = (cfg.goals && cfg.goals[id]) || GOALS[id];
  if (!g) fail(404, 'no_goal', 'Нет такой цели');
  return g;
}
async function goalState(env, id, uid, now) {
  const tot = await env.DB.prepare('SELECT COALESCE(SUM(points),0) s, COUNT(DISTINCT uid) n FROM goal_contrib WHERE goal=?').bind(id).first();
  let mine = { points: 0, today: 0, claimed: [] };
  if (uid) {
    const m = await env.DB.prepare('SELECT COALESCE(SUM(points),0) s FROM goal_contrib WHERE goal=? AND uid=?').bind(id, uid).first();
    const d = await env.DB.prepare('SELECT points FROM goal_contrib WHERE goal=? AND uid=? AND day=?').bind(id, uid, dayKey(now, env)).first();
    const cl = (await env.DB.prepare('SELECT pct FROM goal_claims WHERE goal=? AND uid=? ORDER BY pct').bind(id, uid).all()).results;
    mine = { points: m ? m.s : 0, today: d ? d.points : 0, claimed: cl.map((r) => r.pct) };
  }
  return { total: tot ? tot.s : 0, participants: tot ? tot.n : 0, mine };
}
function goalView(id, g, ev, st, now, env) {
  return {
    ok: true, id, name: g.name, unit: g.unit || '', target: g.target, total: st.total, participants: st.participants,
    pct: Math.min(100, Math.floor((st.total / g.target) * 1000) / 10),
    tiers: g.tiers.map((t) => ({ pct: t.pct, reward: t.reward, reached: st.total >= Math.ceil((g.target * t.pct) / 100) })),
    perDay: g.perDay, minPoints: g.minPoints || 0, active: !!ev, event: ev ? { id: ev.id, start: ev.start, end: ev.end } : null,
    me: st.mine, resetsAt: nextDayStart(now, env), serverTime: now,
  };
}

export async function getGoal(c) {
  const id = str(c.params.id, 32);
  const cfg = await loadConfig(c.env);
  const g = goalOf(cfg, id);
  let uid = null;
  if ((c.req.headers.get('authorization') || '').startsWith('Bearer ')) uid = (await requireUser(c)).id;
  const ev = goalEvent(cfg.events, id, c.now);
  return json(goalView(id, g, ev, await goalState(c.env, id, uid, c.now), c.now, c.env));
}

export async function goalContrib(c) {
  const user = await requireUser(c);
  const id = str(c.params.id, 32);
  const body = await readJson(c.req, 512);
  const cfg = await loadConfig(c.env);
  const g = goalOf(cfg, id);
  const ev = goalEvent(cfg.events, id, c.now);
  if (!ev) fail(409, 'goal_closed', 'Событие не идёт');
  const want = int(body.points, 0);
  if (want <= 0) fail(400, 'bad_points', 'points — целое > 0');
  const day = dayKey(c.now, c.env);
  const cur = await c.env.DB.prepare('SELECT points FROM goal_contrib WHERE goal=? AND uid=? AND day=?').bind(id, user.id, day).first();
  const left = Math.max(0, (g.perDay || 400) - (cur ? cur.points : 0));
  const add = Math.min(want, g.perCall || 80, left);
  if (add > 0) {
    await c.env.DB.prepare('INSERT INTO goal_contrib (goal, uid, day, points) VALUES (?,?,?,?) ON CONFLICT(goal, uid, day) DO UPDATE SET points = points + excluded.points').bind(id, user.id, day, add).run();
  }
  const st = await goalState(c.env, id, user.id, c.now);
  return json({ ...goalView(id, g, ev, st, c.now, c.env), added: add, capped: add < want });
}

export async function goalClaim(c) {
  const user = await requireUser(c);
  const id = str(c.params.id, 32);
  const body = await readJson(c.req, 512);
  const cfg = await loadConfig(c.env);
  const g = goalOf(cfg, id);
  const pct = int(body.pct, 0);
  const T = g.tiers.find((t) => t.pct === pct);
  if (!T) fail(404, 'no_tier', 'Нет такого порога');
  const st = await goalState(c.env, id, user.id, c.now);
  if (st.total < Math.ceil((g.target * pct) / 100)) fail(409, 'locked', 'Порог ещё не взят');
  if (st.mine.points < (g.minPoints || 0)) fail(409, 'no_contrib', `Нужен ваш вклад: от ${g.minPoints} ${g.unit || 'очков'}`);
  // claims stay open after the event (a week of grace is not needed: rewards wait until claimed)
  const r = await c.env.DB.prepare('INSERT INTO goal_claims (goal, uid, pct, ts) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').bind(id, user.id, pct, c.now).run();
  if (!r.meta.changes) fail(409, 'claimed', 'Награда уже получена');
  return json({ ok: true, id, pct, reward: T.reward });
}

// ---------------- clan weekly goal ----------------
async function clanGoalView(c, user) {
  const env = c.env;
  const cfg = await loadConfig(env);
  const G = cfg.clanGoal || CLAN_GOAL;
  const m = await clanOf(env, user.id);
  const week = isoWeek(c.now, env);
  if (!m) return { ok: true, clan: null, week };
  const rows = (await env.DB.prepare('SELECT m.uid, COALESCE(w.points,0) pts FROM clan_members m LEFT JOIN weekly_contrib w ON w.uid=m.uid AND w.week=? WHERE m.clan_id=?').bind(week, m.clan_id).all()).results;
  const score = rows.reduce((s, r) => s + r.pts, 0);
  const mine = (rows.find((r) => r.uid === user.id) || { pts: 0 }).pts;
  const thr = clanThresholds(rows.length, G);
  const claimed = (await env.DB.prepare('SELECT tier FROM clan_goal_claims WHERE week=? AND uid=? ORDER BY tier').bind(week, user.id).all()).results.map((r) => r.tier);
  const ev = (Array.isArray(cfg.events) ? cfg.events : []).find((e) => e && e.modifiers && e.modifiers.clanFrame && c.now >= e.start && c.now < e.end) || null;
  return {
    ok: true, week, clan: { id: m.clan_id, name: m.name, tag: m.tag }, members: rows.length, score, myPoints: mine, minPoints: G.minPoints,
    tiers: thr.map((need, i) => ({ tier: i + 1, need, reached: score >= need, reward: G.rewards[i] || {}, claimed: claimed.includes(i + 1) })),
    event: ev ? { id: ev.id, name: ev.name, cosmetic: ev.modifiers.clanFrame, clanMul: ev.modifiers.clanMul || 1 } : null,
    points: { stage: 0, abyssFloor: 1, raidStar: 3, defence: 2, quest: 2, wb: WB_TIERS.map((t) => t.clan) },
    resetsAt: nextWeekStart(c.now, env),
  };
}

export async function getClanGoal(c) {
  const user = await requireUser(c);
  return json(await clanGoalView(c, user));
}

export async function clanGoalClaim(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 512);
  const v = await clanGoalView(c, user);
  if (!v.clan) fail(409, 'no_clan', 'Вы не в клане');
  const tier = int(body.tier, 0);
  const T = v.tiers.find((t) => t.tier === tier);
  if (!T) fail(404, 'no_tier', 'Нет такого порога');
  if (!T.reached) fail(409, 'locked', 'Клан ещё не взял этот порог');
  if (v.myPoints < v.minPoints) fail(409, 'no_contrib', `Нужен ваш вклад за неделю: от ${v.minPoints} очков`);
  const r = await c.env.DB.prepare('INSERT INTO clan_goal_claims (week, uid, clan_id, tier, ts) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING').bind(v.week, user.id, v.clan.id, tier, c.now).run();
  if (!r.meta.changes) fail(409, 'claimed', 'Награда уже получена');
  const reward = { ...T.reward };
  if (tier === 1 && v.event && v.event.cosmetic) reward.cosmetic = v.event.cosmetic; // «Цвета сияния» / «Две искры»
  return json({ ok: true, week: v.week, tier, reward });
}
