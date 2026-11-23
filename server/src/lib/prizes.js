// v45.2 «Летопись Вече»: weekly prizes for places — COSMETICS ONLY (owner decision: no resources, no currency).
// Run by the cron (src/routes/bot.js). A finished game week (Monday 05:00 МСК reset) is settled `delayHours` after
// the reset (time to remove cheaters), for:
//   'wb'    — Владыка недели: places inside each (overlord, league) board (lb_wboss), one prize per player a week;
//   'abyss' — Бездна, weekly board 'w:<week>' (only runs started at floor 1 since v45.2).
// Skipped: banned players and players with suspicious records (audit kinds `suspicious`) from the week's start until
// settlement; ranks are counted without them. Idempotent: weekly_prizes (week, board, uid) is the key, the letter is
// inserted in the same transaction only while its row is unsent; prize_runs marks a settled board.
import { getConfigKey, DEFAULTS } from './config.js';
import { isoWeek, weekStart } from './time.js';
import { WB_LEAGUES } from './liveops.js';

const HOUR = 3600000;
const WEEK = 7 * 86400000;

export function prizesConfig(stored) {
  const d = structuredClone(DEFAULTS.prizes);
  const s = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return { ...d, ...s };
}

/** Cosmetic id of the best bracket reached by `place` (1-based) among `n` entries, or null. Only `cosmetic` is used. */
export function bracketFor(list, place, n) {
  for (const b of Array.isArray(list) ? list : []) {
    if (!b || typeof b.cosmetic !== 'string' || !b.cosmetic) continue;
    if (b.top > 0 && place <= b.top) return b.cosmetic;
    if (b.pct > 0 && place <= Math.ceil((n * b.pct) / 100)) return b.cosmetic;
  }
  return null;
}

/** Rank already-sorted rows (best first), skipping `skip` uids. Returns [{ uid, place, n, cosmetic, rank }]. */
export function rankGroup(rows, list, skip = new Set()) {
  const ok = rows.filter((r) => !skip.has(r.uid));
  const out = [];
  ok.forEach((r, i) => {
    const cosmetic = bracketFor(list, i + 1, ok.length);
    if (cosmetic) out.push({ ...r, place: i + 1, n: ok.length, cosmetic, rank: list.findIndex((b) => b && b.cosmetic === cosmetic) });
  });
  return out;
}

async function suspiciousUids(env, kinds, from, to) {
  if (!Array.isArray(kinds) || !kinds.length) return new Set();
  const q = kinds.map(() => '?').join(',');
  const rows = (await env.DB.prepare(`SELECT DISTINCT uid FROM audit WHERE ts>=? AND ts<? AND kind IN (${q})`).bind(from, to, ...kinds).all()).results;
  return new Set(rows.map((r) => r.uid));
}

async function award(env, week, board, winners, titleOf, now) {
  let sent = 0;
  for (let i = 0; i < winners.length; i += 30) {
    const st = [];
    for (const w of winners.slice(i, i + 30)) {
      const k = [week, board, w.uid];
      st.push(env.DB.prepare('INSERT OR IGNORE INTO weekly_prizes (week, board, uid, place, grp, cosmetic, sent, ts) VALUES (?,?,?,?,?,?,0,?)').bind(...k, w.place, w.grp || null, w.cosmetic, now));
      st.push(env.DB.prepare("INSERT INTO inbox (uid, kind, title, reward, created_at) SELECT ?,'prize',?,?,? WHERE EXISTS (SELECT 1 FROM weekly_prizes WHERE week=? AND board=? AND uid=? AND sent=0)")
        .bind(w.uid, titleOf(w).slice(0, 120), JSON.stringify({ cosmetic: w.cosmetic }), now, ...k));
      st.push(env.DB.prepare('UPDATE weekly_prizes SET sent=1 WHERE week=? AND board=? AND uid=? AND sent=0').bind(...k));
    }
    const res = await env.DB.batch(st);
    for (let j = 1; j < res.length; j += 3) sent += res[j].meta.changes || 0;
  }
  return sent;
}

async function settleWb(env, cfg, week, skip, now) {
  const rows = (await env.DB.prepare(
    `SELECT l.uid, l.boss, l.league, l.tier, l.time_ms FROM lb_wboss l JOIN users u ON u.id=l.uid
     WHERE l.week=? AND u.banned=0 ORDER BY l.boss, l.league, l.tier DESC, l.time_ms ASC, l.updated_at ASC`
  ).bind(week).all()).results;
  const groups = {};
  for (const r of rows) (groups[r.boss + ':' + r.league] || (groups[r.boss + ':' + r.league] = [])).push(r);
  const best = {};
  for (const [grp, list] of Object.entries(groups)) {
    for (const w of rankGroup(list, cfg.wb, skip)) {
      const cur = best[w.uid];
      if (!cur || w.rank < cur.rank || (w.rank === cur.rank && w.place < cur.place)) best[w.uid] = { ...w, grp };
    }
  }
  const winners = Object.values(best);
  const title = (w) => `Летопись Вече: Владыка недели ${week} — ${w.place}-е место, ${(WB_LEAGUES[w.league] || 'лига').replace(/ \(.*\)$/, '')}`;
  return { n: winners.length, sent: await award(env, week, 'wb', winners, title, now) };
}

async function settleAbyss(env, cfg, week, skip, now) {
  const rows = (await env.DB.prepare(
    `SELECT l.uid, l.floor, l.time_ms FROM lb_abyss l JOIN users u ON u.id=l.uid
     WHERE l.period=? AND u.banned=0 ORDER BY l.floor DESC, l.time_ms ASC, l.updated_at ASC`
  ).bind('w:' + week).all()).results;
  const winners = rankGroup(rows, cfg.abyss, skip);
  const title = (w) => `Летопись Вече: Бездна недели ${week} — ${w.place}-е место`;
  return { n: winners.length, sent: await award(env, week, 'abyss', winners, title, now) };
}

/** Settle every finished week (up to lookbackWeeks back) whose settlement time has come. Returns stats. */
export async function runWeeklyPrizes(env, now) {
  const cfg = prizesConfig(await getConfigKey(env, 'prizes'));
  const stats = {};
  const delay = (Number(cfg.delayHours) || 0) * HOUR;
  const back = Math.max(1, Math.min(8, Number(cfg.lookbackWeeks) || 2));
  for (let k = 0; k < back; k++) {
    const end = weekStart(now, env) - k * WEEK; // the week [end − 7 d, end) is finished
    if (now < end + delay) continue;
    const week = isoWeek(end - 1, env);
    if (cfg.fromWeek && week < String(cfg.fromWeek)) continue;
    const done = new Set((await env.DB.prepare('SELECT board FROM prize_runs WHERE week=?').bind(week).all()).results.map((r) => r.board));
    const todo = [['wb', settleWb], ['abyss', settleAbyss]].filter(([b]) => !done.has(b));
    if (!todo.length) continue;
    const skip = await suspiciousUids(env, cfg.suspicious, end - WEEK, end + delay);
    for (const [board, fn] of todo) {
      const r = await fn(env, cfg, week, skip, now);
      await env.DB.prepare('INSERT OR IGNORE INTO prize_runs (week, board, n, ts) VALUES (?,?,?,?)').bind(week, board, r.n, now).run();
      stats[board + ':' + week] = r.sent;
    }
  }
  return stats;
}
