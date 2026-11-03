// Cloud-save sanity checks ("anti-tamper lite").
//
// The game is single-player and the save lives on the client, so the server
// can't prove a save is honest. What it can do cheaply:
//   HARD (save rejected, HTTP 422):
//     - wrong format (not the game's save object, v !== 1)
//     - impossible values: negative / NaN / huge resources, hero level outside 1..40
//     - monotonic counters going DOWN (kills, floors, abyss best, runs, bosses, chests,
//       hero level) or `created` changing — unless the client explicitly sends
//       overwrite:true (user chose "use this device's copy" after a conflict).
//   SOFT (save accepted, but logged to `audit` and users.flags++):
//     - resource gains much bigger than the elapsed time allows
//     - hero level jumping too fast
//     - abyss best in the save far above the server-verified leaderboard best
// Leaderboards never trust the save: they use server-recorded runs only.

export const MAX_LEVEL = 40;
const MAX_RES = 1e12;
const COUNTERS = ['kills', 'floors', 'boss', 'chests', 'runs', 'best', 'lvl'];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);

/** Extract the numbers we check from a game save object (see apps/emberveil/src/p1.js newSave()). */
export function summarize(d) {
  const st = (d && d.st) || {};
  const res = (d && d.res) || {};
  return {
    v: d && d.v,
    created: num(d && d.created),
    lvl: num(d && d.hero && d.hero.lvl),
    kills: num(st.kills ?? 0),
    floors: num(st.floors ?? 0),
    boss: num(st.boss ?? 0),
    chests: num(st.chests ?? 0),
    runs: num((d && d.endless && d.endless.runs) ?? 0),
    best: num((d && d.endless && d.endless.best) ?? 0),
    gold: num(res.gold ?? 0),
    wood: num(res.wood ?? 0),
    ore: num(res.ore ?? 0),
    ess: num(res.ess ?? 0),
    shards: num(res.shards ?? 0),
  };
}

/**
 * @param {object|null} prev summary of the server copy (null for the first upload)
 * @param {object} next summary of the incoming save
 * @param {{elapsedMs:number, overwrite?:boolean, verifiedBest?:number}} o
 * @returns {{hard:string[], soft:string[]}}
 */
export function checkSave(prev, next, o = {}) {
  const hard = [];
  const soft = [];
  if (next.v !== 1) hard.push('bad_version');
  if (!(next.created > 0)) hard.push('bad_created');
  if (!(Number.isInteger(next.lvl) && next.lvl >= 1 && next.lvl <= MAX_LEVEL)) hard.push('bad_level');
  for (const k of ['gold', 'wood', 'ore', 'ess', 'shards', 'kills', 'floors', 'boss', 'chests', 'runs', 'best']) {
    if (!(next[k] >= 0 && next[k] <= MAX_RES)) hard.push('bad_' + k);
  }
  if (hard.length || !prev) {
    if (!hard.length && o.verifiedBest !== undefined && next.best > o.verifiedBest + 10) soft.push('best_unverified');
    return { hard, soft };
  }

  if (!o.overwrite) {
    if (prev.created > 0 && next.created !== prev.created) hard.push('created_changed');
    for (const k of COUNTERS) if (next[k] < prev[k]) hard.push('counter_down:' + k);
  }

  const h = Math.max(0, o.elapsedMs || 0) / 3600000 + 0.25; // grace for the first 15 min
  const lvl = Math.max(prev.lvl || 1, next.lvl || 1);
  const goldCap = h * (20000 + 6000 * lvl);
  const matCap = h * (8000 + 2500 * lvl);
  if (next.gold - prev.gold > goldCap) soft.push('gold_gain');
  for (const k of ['wood', 'ore', 'ess']) if (next[k] - prev[k] > matCap) soft.push(k + '_gain');
  if (next.shards - prev.shards > h * 2500) soft.push('shards_gain');
  if (next.lvl - prev.lvl > 3 + h * 4) soft.push('level_jump');
  if (o.verifiedBest !== undefined && next.best > o.verifiedBest + 10) soft.push('best_unverified');
  return { hard, soft };
}
