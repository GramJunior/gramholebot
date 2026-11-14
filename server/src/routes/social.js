// Referrals, friends, reward inbox, reminder scheduling.
//   GET  /referrals                    -> { code, link, invited, pending, activated, friends:[...] }  (v41: inviter is rewarded when the friend beats 1-5)
//   POST /friends/add { pid }          (one-way "follow" for the friends leaderboard)
//   GET  /inbox                        -> unclaimed reward letters
//   POST /inbox/claim { id }           -> { reward }  (idempotent per letter)
//   POST /notify/schedule { kind, at } -> remind via the bot at server time `at` (opt-in only)
import { fail, json, readJson, int, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { userByPid, queueNotification, NAME_SQL } from '../lib/common.js';

export function refLink(env, code) {
  const bot = env.BOT_USERNAME;
  if (!bot) return null;
  return env.APP_SHORT_NAME
    ? `https://t.me/${bot}/${env.APP_SHORT_NAME}?startapp=ref_${code}`
    : `https://t.me/${bot}?start=ref_${code}`;
}

export async function getReferrals(c) {
  const user = await requireUser(c);
  const invited = await c.env.DB.prepare("SELECT COUNT(*) n, SUM(ref_state='pending') pending, SUM(ref_state='done') activated FROM users WHERE referred_by=?").bind(user.id).first();
  const friends = (await c.env.DB.prepare(`SELECT u.ref_code, ${NAME_SQL} FROM friends f JOIN users u ON u.id=f.friend_uid WHERE f.uid=? ORDER BY f.created_at DESC LIMIT 200`).bind(user.id).all()).results;
  return json({ ok: true, code: user.ref_code, link: refLink(c.env, user.ref_code), invited: invited ? invited.n : 0, pending: (invited && invited.pending) || 0, activated: (invited && invited.activated) || 0, friends: friends.map((f) => ({ pid: f.ref_code, name: (f.first_name || 'Искроносец').slice(0, 32) })) });
}

export async function addFriend(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 512);
  const t = await userByPid(c.env, str(body.pid, 16));
  if (t.id === user.id) fail(400, 'self', 'Это вы');
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM friends WHERE uid=?').bind(user.id).first();
  if (n && n.n >= 200) fail(409, 'friends_limit', 'Слишком много друзей');
  await c.env.DB.prepare('INSERT OR IGNORE INTO friends (uid, friend_uid, created_at) VALUES (?,?,?)').bind(user.id, t.id, c.now).run();
  return json({ ok: true });
}

export async function getInbox(c) {
  const user = await requireUser(c);
  const rows = (await c.env.DB.prepare('SELECT id, kind, title, reward, created_at FROM inbox WHERE uid=? AND claimed_at IS NULL ORDER BY id LIMIT 50').bind(user.id).all()).results;
  return json({ ok: true, items: rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, reward: JSON.parse(r.reward), at: r.created_at })) });
}

export async function claimInbox(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 256);
  const id = int(body.id, 0);
  const row = await c.env.DB.prepare('SELECT * FROM inbox WHERE id=? AND uid=?').bind(id, user.id).first();
  if (!row) fail(404, 'no_letter', 'Письмо не найдено');
  const r = await c.env.DB.prepare('UPDATE inbox SET claimed_at=? WHERE id=? AND claimed_at IS NULL').bind(c.now, id).run();
  if (!r.meta.changes) fail(409, 'claimed', 'Награда уже получена');
  return json({ ok: true, id, reward: JSON.parse(row.reward) });
}

export const NOTIFY_TEXT = {
  forge: 'Кузница закончила работу — Горан ждёт тебя в Броде.',
  hatch: 'В питомнике что-то шевелится: яйцо готово проклюнуться!',
  income: 'Склад Брода полон — пора собрать доход.',
  daily: 'Новый день в Броде: ежедневная награда и свежие контракты ждут.',
  raid: 'Набег на вашу деревню! Загляните в журнал обороны — можно отомстить.',
  // v42 (liveops §6.1)
  build_done: 'Стройка в Броде закончена — заходи, мастера ждут следующего дела.',
  expedition_done: 'Спутники вернулись из похода с добычей. Брод ждёт тебя.',
  streak: 'Уголь в очаге гаснет. Дар дня ещё ждёт.',
  comeback: 'Брод стоит. Для тебя отложен подарок.',
};
const CLIENT_KINDS = ['forge', 'hatch', 'income', 'daily', 'build_done', 'expedition_done', 'streak', 'comeback'];

export async function scheduleNotify(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 512);
  const kind = str(body.kind, 16);
  if (!CLIENT_KINDS.includes(kind)) fail(400, 'bad_kind', 'kind: ' + CLIENT_KINDS.join(' | '));
  if (body.cancel === true) {
    await c.env.DB.prepare("DELETE FROM notifications WHERE uid=? AND kind=? AND status='pending'").bind(user.id, kind).run();
    return json({ ok: true, cancelled: true });
  }
  // Clients send a delay (seconds) — not an absolute time — so a wrong phone clock doesn't matter.
  const delay = int(body.inSec, -1);
  if (delay < 60 || delay > 7 * 86400) fail(400, 'bad_time', 'inSec: от 60 секунд до 7 дней');
  if (!user.notify) return json({ ok: true, scheduled: false, reason: 'opted_out' });
  await queueNotification(c.env, user.id, kind, c.now + delay * 1000);
  return json({ ok: true, scheduled: true, dueAt: c.now + delay * 1000 });
}
