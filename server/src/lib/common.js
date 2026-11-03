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
export const pub = (u) => (u ? { pid: u.ref_code, name: (u.first_name || 'Искроносец').slice(0, 32) } : null);

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
 * Create or refresh a user. Only minimal data is stored: id, first name, optional
 * username, language. For brand-new users a `ref_<code>` start param links the referrer.
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
  let code = newRefCode();
  for (let i = 0; i < 4; i++) {
    const r = await env.DB.prepare(
      'INSERT INTO users (id, tg_id, first_name, username, lang, ref_code, can_pm, created_at, last_seen) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING'
    ).bind(uid, tgId, fn, un, lg, code, canPm ? 1 : 0, now, now).run();
    if (r.meta.changes) break;
    const again = await getUser(env, uid);
    if (again) return { user: again, isNew: false }; // concurrent insert
    code = newRefCode();
  }
  const user = await getUser(env, uid);
  if (!user) throw new Error('user_insert_failed');
  if (startParam) await applyReferral(env, user, startParam, now);
  return { user: await getUser(env, uid), isNew: true };
}

/** Link a new user to their referrer, make them friends and mail rewards to both. */
export async function applyReferral(env, user, startParam, now) {
  const m = /^ref_([a-z0-9]{4,16})$/.exec(String(startParam));
  if (!m || user.referred_by) return false;
  const ref = await env.DB.prepare('SELECT * FROM users WHERE ref_code=?').bind(m[1]).first();
  if (!ref || ref.id === user.id) return false;
  const cfg = await getConfigKey(env, 'referral');
  const r = await env.DB.prepare('UPDATE users SET referred_by=? WHERE id=? AND referred_by IS NULL').bind(ref.id, user.id).run();
  if (!r.meta.changes) return false;
  await addFriendPair(env, user.id, ref.id, now);
  const rewarded = await env.DB.prepare("SELECT COUNT(*) n FROM inbox WHERE uid=? AND kind='referrer'").bind(ref.id).first();
  if ((rewarded?.n || 0) < (cfg.maxRewarded ?? 50)) {
    await addInbox(env, ref.id, 'referrer', `Друг ${user.first_name || 'Искроносец'} пришёл по вашему приглашению`, cfg.referrer, now);
  }
  await addInbox(env, user.id, 'referee', 'Подарок за приглашение', cfg.referee, now);
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
