// Server time helpers. All "days" and "weeks" are computed on the server so the
// client clock never matters. A configurable offset lets the day roll over at
// local midnight (default UTC+3 — Moscow).
//
// v42: the game day starts at RESET_HOUR (05:00) in the DAY_OFFSET_MIN zone (Moscow), not at
// midnight — night players (16–26) don't lose their day at 00:00. The constant is applied on top
// of DAY_OFFSET_MIN (wrangler.toml stays as is; env RESET_HOUR overrides it for tests/ops).
// One-time switch without double grants or a lost day: until the instant the new-rule day
// RESET_SWITCH_DAY starts (default 2026-11-16 05:00 MSK, a Monday) the old midnight rule applies;
// that day simply lasts 29 hours (00:00 → next day 05:00). Keys never go backwards at the switch,
// so streaks, daily limits, ad caps/credits and pass daily XP keep counting the same day.

export const DAY_MS = 86400000;
export const RESET_HOUR = 5; // 05:00 МСК
export const RESET_SWITCH_DAY = '2026-11-16';

function baseOffMs(env) {
  const m = Number(env && env.DAY_OFFSET_MIN);
  return (Number.isFinite(m) ? m : 180) * 60000;
}
function resetMs(env) {
  const h = Number(env && env.RESET_HOUR);
  return (Number.isFinite(h) && h >= 0 && h < 24 ? h : RESET_HOUR) * 3600000;
}
/** UTC ms when the reset rule switches on (start of RESET_SWITCH_DAY under the new rule). */
export function switchAt(env) {
  const d = (env && env.RESET_SWITCH_DAY) || RESET_SWITCH_DAY;
  const t = Date.parse(d + 'T00:00:00Z');
  return (Number.isFinite(t) ? t : 0) - baseOffMs(env) + resetMs(env);
}

/** Effective offset (ms) for the game day containing `now` (old rule before the switch). */
export function offsetMs(env, now = Date.now()) {
  return now < switchAt(env) ? baseOffMs(env) : baseOffMs(env) - resetMs(env);
}

/** 'YYYY-MM-DD' of the game day containing `now`. */
export function dayKey(now, env) {
  return new Date(now + offsetMs(env, now)).toISOString().slice(0, 10);
}

/** Timestamp (UTC ms) when the next game day starts. */
export function nextDayStart(now, env) {
  const off = offsetMs(env, now);
  const s = Math.floor((now + off) / DAY_MS) * DAY_MS + DAY_MS - off;
  const T = switchAt(env);
  return now < T && s > T ? s + resetMs(env) : s; // the switch day ends at 05:00
}

/** Timestamp (UTC ms) when the current game day started. */
export function dayStart(now, env) {
  const off = offsetMs(env, now);
  const s = Math.floor((now + off) / DAY_MS) * DAY_MS - off;
  const T = switchAt(env);
  return now >= T && s === T ? T - resetMs(env) : s; // the switch day began at midnight
}

/** Day key for the day before `key`. */
export function prevDayKey(key) {
  return new Date(Date.parse(key + 'T00:00:00Z') - DAY_MS).toISOString().slice(0, 10);
}

/**
 * ISO-8601 week key like '2026-W45' for the game-local date of `now`.
 * Weeks start on Monday; week 1 contains the year's first Thursday.
 */
export function isoWeek(now, env) {
  const d = new Date(now + offsetMs(env, now));
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = t.getUTCDay() || 7; // Mon=1..Sun=7
  t.setUTCDate(t.getUTCDate() + 4 - dow); // Thursday of this week
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** UTC ms when the next ISO week (Monday, game-day start) starts. */
export function nextWeekStart(now, env) {
  const off = offsetMs(env, now);
  const local = now + off;
  const ds = Math.floor(local / DAY_MS) * DAY_MS;
  const dow = new Date(ds).getUTCDay() || 7;
  const s = ds + (8 - dow) * DAY_MS - off;
  const T = switchAt(env);
  return now < T && s > T ? s + resetMs(env) : s;
}

/** UTC ms when the current ISO week started. */
export function weekStart(now, env) {
  const s = nextWeekStart(now, env) - 7 * DAY_MS;
  const T = switchAt(env);
  return now >= T && s === T ? T - resetMs(env) : s;
}

/** Hour (0..23) of `now` in the DAY_OFFSET_MIN zone (Moscow) — for quiet hours. */
export function localHour(now, env) {
  return new Date(now + baseOffMs(env)).getUTCHours();
}
