// Shared domain helpers: users, referrals, inbox, contributions, clan feed, audit.
import { randomId } from './crypto.js';
import { isoWeek } from './time.js';
import { getConfigKey, loadConfig, activeSeason } from './config.js';
import { fail } from './http.js';

export const envInt = (env, key, def) => {
  const v = Number(env[key]);
  return Number.isFinite(v) && env[key] !== '' && env[key] !== undefined ? v : def;
};

const ALPH = 'abcdefghjkmnpqrstuvwxyz23456789';
export function newRefCode(len = 8) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  let s = '';
  for (const x of b) s += ALPH[x % ALPH.length];
  return s;
}

/** Public projection of a user (never exposes Telegram id or username). */
/** Name shown to other players: the one the player chose (POST /me/settings {name}) or the Telegram first name. */
export const shownName = (u) => String((u && (u.display_name || u.first_name)) || 'Искроносец').slice(0, 32);
/** SQL expression for the shown name of users alias `u` (keeps column name first_name for the callers). */
export const NAME_SQL = "COALESCE(NULLIF(u.display_name,''), u.first_name) first_name";

/** Public projection of a user (never exposes Telegram id or username). */
export const pub = (u) => (u ? { pid: u.ref_code, name: shownName(u) } : null);

/** Validate a display name: 2–20 letters/digits/spaces/_-. , collapsed spaces. Returns the clean name or throws 400. */
export function cleanName(v) {
  const s = String(v == null ? '' : v).normalize('NFC').replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 20) fail(400, 'bad_name', 'Имя: от 2 до 20 символов');
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _.\-]*$/u.test(s)) fail(400, 'bad_name', 'В имени можно использовать буквы, цифры, пробел, _ . -');
  if (/^(гость|guest|admin|админ|модератор|moderator)$/i.test(s)) fail(400, 'bad_name', 'Это имя занято');
  return s;
}

export async function getUser(env, uid) {
  return env.DB.prepare('SELECT * FROM users WHERE id=?').bind(uid).first();
}

export async function userByPid(env, pid) {
  if (typeof pid !== 'string' || !/^[a-z0-9]{4,16}$/.test(pid)) fail(400, 'bad_pid', 'Неверный id игрока');
  const u = await env.DB.prepare('SELECT * FROM users WHERE ref_code=?').bind(pid).first();
  if (!u) fail(404, 'no_player', 'Игрок не найден');
  return u;
}

/**
 * Parse a Mini App / bot start parameter (Telegram allows 64 chars of A-Za-z0-9_-):
 *   ref_<code>               — invited by a player
 *   src_<tag>                — traffic source label (ad campaign, channel post, share card…)
 *   ref_<code>__src_<tag>    — both
 * Returns { ref: code|null, src: tag|null } (src lower-cased, a-z0-9_ up to 32 chars).
 */
export function parseStart(startParam) {
  const s = String(startParam || '').slice(0, 64);
  const m = /^(?:ref_([a-z0-9]{4,16}))?(?:(?:^|__)src_([A-Za-z0-9_]{1,32}))?$/.exec(s);
  if (!m || (!m[1] && !m[2])) return { ref: null, src: null };
  return { ref: m[1] || null, src: m[2] ? m[2].toLowerCase() : null };
}

/**
 * Create or refresh a user. Only minimal data is stored: id, first name, optional
 * username, language. For brand-new users a `ref_<code>` start param links the referrer
 * and `src_<tag>` is kept as the first-touch source (users.src, never overwritten).
 */
export async function upsertUser(env, { uid, tgId = null, firstName = '', username = null, lang = null, canPm = null, startParam = '' }, now) {
  const cur = await getUser(env, uid);
  const fn = String(firstName || '').slice(0, 64);
  const un = username ? String(username).slice(0, 64) : null;
  const lg = lang ? String(lang).slice(0, 8) : null;
  if (cur) {
    await env.DB.prepare('UPDATE users SET first_name=?, username=?, lang=COALESCE(?,lang), can_pm=COALESCE(?,can_pm), last_seen=? WHERE id=?')
      .bind(fn || cur.first_name, un, lg, canPm === null ? null : canPm ? 1 : 0, now, uid).run();
    return { user: { ...cur, first_name: fn || cur.first_name, username: un, last_seen: now }, isNew: false };
  }
  const sp = parseStart(startParam);
  let code = newRefCode();
  for (let i = 0; i < 4; i++) {
    const r = await env.DB.prepare(
      'INSERT INTO users (id, tg_id, first_name, username, lang, ref_code, can_pm, created_at, last_seen, src) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING'
    ).bind(uid, tgId, fn, un, lg, code, canPm ? 1 : 0, now, now, sp.src).run();
    if (r.meta.changes) break;
    const again = await getUser(env, uid);
    if (again) return { user: again, isNew: false }; // concurrent insert
    code = newRefCode();
  }
  const user = await getUser(env, uid);
  if (!user) throw new Error('user_insert_failed');
  if (sp.ref) await applyReferral(env, user, 'ref_' + sp.ref, now);
  return { user: await getUser(env, uid), isNew: true };
}

// v41: the inviter's reward waits until the friend beats the chapter-1 boss (stage 1-5, milestone 'ftue:boss').
export const REF_ACTIVATE_MILESTONE = 'ftue:boss';
const REF_MIN_PLAY_MS = 10 * 60000; // anti-farm: the friend's profile must be at least 10 min old when the boss falls

/**
 * Link a new user to their referrer and make them friends. The friend gets their gift at once;
 * the inviter is rewarded later by activateReferral() (anti-abuse: a twink farm no longer pays at registration).
 */
export async function applyReferral(env, user, startParam, now) {
  const m = /^ref_([a-z0-9]{4,16})$/.exec(String(startParam));
  if (!m || user.referred_by) return false;
  const ref = await env.DB.prepare('SELECT * FROM users WHERE ref_code=?').bind(m[1]).first();
  if (!ref || ref.id === user.id) return false;
  const cfg = await getConfigKey(env, 'referral');
  const r = await env.DB.prepare("UPDATE users SET referred_by=?, ref_state='pending', src=COALESCE(src,'ref') WHERE id=? AND referred_by IS NULL").bind(ref.id, user.id).run();
  if (!r.meta.changes) return false;
  await addFriendPair(env, user.id, ref.id, now);
  await addInbox(env, user.id, 'referee', 'Подарок за приглашение', cfg.referee, now);
  await env.DB.prepare('INSERT OR IGNORE INTO milestones (uid, m, ts) VALUES (?,?,?)').bind(ref.id, 'ref:joined', now).run();
  return true;
}

/**
 * The invited friend reached the activation milestone: reward the inviter once (cap: referral.maxRewarded letters).
 * Safe to call repeatedly — only a 'pending' referral flips to 'done' (atomic UPDATE).
 */
export async function activateReferral(env, user, now) {
  if (!user || user.ref_state !== 'pending' || !user.referred_by) return false;
  if (now - (user.created_at || now) < REF_MIN_PLAY_MS) return false;
  const r = await env.DB.prepare("UPDATE users SET ref_state='done' WHERE id=? AND ref_state='pending'").bind(user.id).run();
  if (!r.meta.changes) return false;
  user.ref_state = 'done';
  await env.DB.prepare('INSERT OR IGNORE INTO milestones (uid, m, ts) VALUES (?,?,?)').bind(user.id, 'ref:activated', now).run();
  const ref = await getUser(env, user.referred_by);
  if (!ref || ref.banned) return true;
  const cfg = await getConfigKey(env, 'referral');
  const rewarded = await env.DB.prepare("SELECT COUNT(*) n FROM inbox WHERE uid=? AND kind='referrer'").bind(ref.id).first();
  if ((rewarded?.n || 0) < (cfg.maxRewarded ?? 50)) {
    await addInbox(env, ref.id, 'referrer', `Друг ${shownName(user)} победил владыку 1-5 — награда за приглашение`, cfg.referrer, now);
  }
  return true;
}

export async function addFriendPair(env, a, b, now) {
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO friends (uid, friend_uid, created_at) VALUES (?,?,?)').bind(a, b, now),
    env.DB.prepare('INSERT OR IGNORE INTO friends (uid, friend_uid, created_at) VALUES (?,?,?)').bind(b, a, now),
  ]);
}

export async function addInbox(env, uid, kind, title, reward, now) {
  await env.DB.prepare('INSERT INTO inbox (uid, kind, title, reward, created_at) VALUES (?,?,?,?,?)')
    .bind(uid, kind, String(title).slice(0, 120), JSON.stringify(reward || {}), now).run();
}

export async function addContrib(env, uid, points, now) {
  if (!points) return;
  await env.DB.prepare('INSERT INTO weekly_contrib (week, uid, points) VALUES (?,?,?) ON CONFLICT(week, uid) DO UPDATE SET points = points + excluded.points')
    .bind(isoWeek(now, env), uid, Math.trunc(points)).run();
}

export async function clanOf(env, uid) {
  return env.DB.prepare('SELECT m.clan_id, m.role, c.name, c.tag FROM clan_members m JOIN clans c ON c.id=m.clan_id WHERE m.uid=?').bind(uid).first();
}

export async function clanFeed(env, clanId, type, uid, data, now) {
  await env.DB.prepare('INSERT INTO clan_feed (clan_id, ts, type, uid, data) VALUES (?,?,?,?,?)')
    .bind(clanId, now, type, uid || null, data ? JSON.stringify(data) : null).run();
}

export async function audit(env, uid, kind, detail, now) {
  await env.DB.batch([
    env.DB.prepare('INSERT INTO audit (uid, kind, detail, ts) VALUES (?,?,?,?)').bind(uid, kind, detail ? JSON.stringify(detail).slice(0, 2000) : null, now),
    env.DB.prepare('UPDATE users SET flags = flags + 1 WHERE id=?').bind(uid),
  ]);
}

/** Add battle-pass XP for the currently active season (no-op when there is none). */
export async function addBpXp(env, uid, xp, now, cfg) {
  if (!xp) return;
  cfg = cfg || (await loadConfig(env));
  const season = activeSeason(cfg, now);
  const sid = season ? season.id : cfg.battlepass && cfg.battlepass.season;
  if (!sid) return;
  await env.DB.prepare('INSERT INTO bp_progress (uid, season, xp) VALUES (?,?,?) ON CONFLICT(uid, season) DO UPDATE SET xp = xp + excluded.xp')
    .bind(uid, sid, Math.trunc(xp)).run();
}

export async function queueNotification(env, uid, kind, dueAt) {
  // Keep at most one pending reminder per kind per user.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM notifications WHERE uid=? AND kind=? AND status='pending'").bind(uid, kind),
    env.DB.prepare('INSERT INTO notifications (uid, kind, due_at) VALUES (?,?,?)').bind(uid, kind, dueAt),
  ]);
}

export const newRunId = () => randomId(18);
