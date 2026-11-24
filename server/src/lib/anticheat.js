// Plausibility rules for server-recorded runs. Pure functions — unit tested.
import { envInt } from './common.js';

/**
 * Abyss run: the server stored `startedAt` and `startFloor` when the run began.
 * `floor` = highest floor CLEARED in the run, `timeMs` = client-measured play time.
 */
export function checkAbyssRun({ startFloor, startedAt, floor, timeMs, now, env = {} }) {
  const maxPerMin = envInt(env, 'ABYSS_MAX_FLOORS_PER_MIN', 3);
  const minFloorMs = envInt(env, 'ABYSS_MIN_FLOOR_MS', 8000);
  const maxRunMs = envInt(env, 'ABYSS_MAX_RUN_HOURS', 6) * 3600000;
  if (!Number.isInteger(floor) || floor < 0 || floor > 5000) return { ok: false, reason: 'bad_floor' };
  if (!Number.isInteger(timeMs) || timeMs < 0) return { ok: false, reason: 'bad_time' };
  const elapsed = now - startedAt;
  if (elapsed > maxRunMs) return { ok: false, reason: 'expired' };
  const cleared = floor - startFloor + 1;
  if (cleared <= 0) return { ok: true, cleared: 0 };
  if (cleared > maxPerMin * (elapsed / 60000) + 1) return { ok: false, reason: 'too_fast' };
  if (timeMs > elapsed + 60000) return { ok: false, reason: 'time_mismatch' };
  if (timeMs < cleared * minFloorMs) return { ok: false, reason: 'too_fast' };
  return { ok: true, cleared };
}

/** Highest floor a player may start from: the game allows "half of the best record". */
export function maxStartFloor(best) {
  return Math.max(1, Math.ceil((best || 0) / 2));
}

/**
 * Raid result. Stars: 0..3, pct: 0..100 destroyed. Rules:
 *   - 3 stars only at 100%; 100% gives at least 1 star; pct >= (stars-1)*30
 *   - server-measured duration between RAID_MIN_SEC and RAID_MAX_SEC (+30 s slack for client time)
 *   - a much weaker attacker (power < 35% of the defender) can't get 3 stars
 */
export function checkRaid({ startedAt, now, stars, pct, timeMs, attPower, defPower, env = {} }) {
  const minMs = envInt(env, 'RAID_MIN_SEC', 15) * 1000;
  const maxMs = envInt(env, 'RAID_MAX_SEC', 600) * 1000;
  if (!Number.isInteger(stars) || stars < 0 || stars > 3) return { ok: false, reason: 'bad_stars' };
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) return { ok: false, reason: 'bad_pct' };
  if (!Number.isInteger(timeMs) || timeMs < 0) return { ok: false, reason: 'bad_time' };
  const elapsed = now - startedAt;
  if (elapsed > maxMs + 60000) return { ok: false, reason: 'expired' };
  if (elapsed < minMs || timeMs < minMs * 0.8) return { ok: false, reason: 'too_fast' };
  if (timeMs > elapsed + 30000) return { ok: false, reason: 'time_mismatch' };
  if (stars === 3 && pct < 100) return { ok: false, reason: 'stars_mismatch' };
  if (pct === 100 && stars < 1) return { ok: false, reason: 'stars_mismatch' };
  if (stars > 0 && pct < (stars - 1) * 30) return { ok: false, reason: 'stars_mismatch' };
  if (stars === 3 && defPower > 0 && attPower < defPower * 0.35) return { ok: false, reason: 'implausible_power' };
  return { ok: true };
}

/** Raid loot, computed on the server from the defender's town hall level. */
export function raidReward(cfg, hall, stars, revenge) {
  const mul = (cfg.starMul && cfg.starMul[stars]) ?? 0;
  const out = {};
  for (const k in cfg.base || {}) {
    const v = Math.round(cfg.base[k] * Math.max(1, hall) * mul * (revenge ? 1.2 : 1));
    if (v > 0) out[k] = v;
  }
  return out;
}

/** Power bands for matchmaking, widest last. */
export const POWER_BANDS = [[0.8, 1.25], [0.6, 1.6], [0.4, 2.5], [0, 1e9]];
