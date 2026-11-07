// Server time helpers. All "days" and "weeks" are computed on the server so the
// client clock never matters. A configurable offset lets the day roll over at
// local midnight (default UTC+3 — Moscow).

export const DAY_MS = 86400000;

export function offsetMs(env) {
  const m = Number(env && env.DAY_OFFSET_MIN);
  return (Number.isFinite(m) ? m : 180) * 60000;
}

/** 'YYYY-MM-DD' of the game day containing `now`. */
export function dayKey(now, env) {
  return new Date(now + offsetMs(env)).toISOString().slice(0, 10);
}

/** Timestamp (UTC ms) when the next game day starts. */
export function nextDayStart(now, env) {
  const off = offsetMs(env);
  return Math.floor((now + off) / DAY_MS) * DAY_MS + DAY_MS - off;
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
  const d = new Date(now + offsetMs(env));
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = t.getUTCDay() || 7; // Mon=1..Sun=7
  t.setUTCDate(t.getUTCDate() + 4 - dow); // Thursday of this week
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** UTC ms when the next ISO week (Monday 00:00 game-local) starts. */
export function nextWeekStart(now, env) {
  const off = offsetMs(env);
  const local = now + off;
  const dayStart = Math.floor(local / DAY_MS) * DAY_MS;
  const dow = new Date(dayStart).getUTCDay() || 7;
  return dayStart + (8 - dow) * DAY_MS - off;
}
