// Telegram bot webhook (+ scheduled reminders).
// Telegram sends updates to POST /tg/webhook with header
// X-Telegram-Bot-Api-Secret-Token = WEBHOOK_SECRET (set when calling setWebhook).
import { fail, json } from '../lib/http.js';
import { safeEqual } from '../lib/crypto.js';
import { tgCall, webAppButton } from '../lib/telegram.js';
import { upsertUser, getUser, envInt, queueNotification } from '../lib/common.js';
import { dayKey, localHour } from '../lib/time.js';
import { checkPreCheckout, grantPayment, revokePayment } from './payments.js';
import { NOTIFY_TEXT, refLink } from './social.js';

const WELCOME = 'Добро пожаловать в Тлеющий Брод, Искроносец.\n\nПоследний уголь Вейла ещё теплится — и только ты можешь его разжечь. Жми «Играть».';

export async function webhook(c) {
  const env = c.env;
  if (!env.WEBHOOK_SECRET) fail(503, 'not_configured', 'WEBHOOK_SECRET не задан');
  if (!safeEqual(c.req.headers.get('x-telegram-bot-api-secret-token') || '', env.WEBHOOK_SECRET)) fail(401, 'bad_secret', 'forbidden');
  let upd;
  try { upd = await c.req.json(); } catch { return json({ ok: true }); }
  try {
    await handleUpdate(env, upd, c.now);
  } catch (e) {
    // Always 200 so Telegram doesn't hammer us with retries; the error is logged without secrets.
    console.error('webhook error', e && e.message);
  }
  return json({ ok: true });
}

export async function handleUpdate(env, upd, now) {
  if (upd.pre_checkout_query) {
    const q = upd.pre_checkout_query;
    const r = await checkPreCheckout(env, q, now);
    await tgCall(env, 'answerPreCheckoutQuery', r.ok
      ? { pre_checkout_query_id: q.id, ok: true }
      : { pre_checkout_query_id: q.id, ok: false, error_message: r.error });
    return { preCheckout: r };
  }
  const msg = upd.message;
  if (!msg || !msg.from || msg.from.is_bot) return null;
  if (msg.successful_payment) {
    const r = await grantPayment(env, msg, now);
    if (r.granted) await safeSend(env, msg.chat.id, 'Покупка получена — спасибо! Награда уже ждёт в игре.', true);
    return { payment: r };
  }
  if (msg.refunded_payment) return { refund: await revokePayment(env, msg.refunded_payment.telegram_payment_charge_id, now) };
  if (msg.chat && msg.chat.type !== 'private') return null;
  const text = String(msg.text || '');
  const [cmd, arg] = text.split(/\s+/, 2);
  const uid = 't' + msg.from.id;
  if (cmd === '/start' || cmd.startsWith('/start@')) {
    // The user wrote to the bot, so it may message them now.
    const { user } = await upsertUser(env, { uid, tgId: msg.from.id, firstName: msg.from.first_name, username: msg.from.username, lang: msg.from.language_code, canPm: true, startParam: arg || '' }, now);
    await safeSend(env, msg.chat.id, WELCOME + (user.notify ? '' : '\n\nХочешь напоминания (кузница, набеги)? Напиши /notify.'), true);
    return { start: true };
  }
  if (cmd === '/notify' || cmd === '/notify_off' || cmd === '/stop') {
    const on = cmd === '/notify';
    await upsertUser(env, { uid, tgId: msg.from.id, firstName: msg.from.first_name, username: msg.from.username, canPm: on ? true : null }, now);
    await env.DB.prepare('UPDATE users SET notify=? WHERE id=?').bind(on ? 1 : 0, uid).run();
    if (!on) await env.DB.prepare("UPDATE notifications SET status='dropped' WHERE uid=? AND status='pending'").bind(uid).run();
    await safeSend(env, msg.chat.id, on ? 'Напоминания включены (не больше нескольких в день). Выключить: /notify_off' : 'Напоминания выключены. Включить снова: /notify');
    return { notify: on };
  }
  if (cmd === '/paysupport') {
    await safeSend(env, msg.chat.id, 'Вопрос по покупке? Опишите проблему одним сообщением и приложите дату платежа — мы ответим. Возврат Stars возможен, если награда не пришла.');
    return { support: true };
  }
  if (cmd === '/invite') {
    const u = await getUser(env, uid);
    const link = u && refLink(env, u.ref_code);
    await safeSend(env, msg.chat.id, link ? `Твоя ссылка для друзей:\n${link}\nДруг получит подарок сразу, а ты — когда он победит владыку 1-5.` : 'Сначала зайди в игру: /start');
    return { invite: true };
  }
  if (cmd === '/privacy' || cmd === '/terms' || cmd.startsWith('/privacy@') || cmd.startsWith('/terms@')) {
    const priv = cmd.startsWith('/privacy');
    const url = legalUrl(env, priv ? 'privacy.html' : 'terms.html');
    await safeSend(env, msg.chat.id, priv
      ? `Политика конфиденциальности: какие данные получает игра, зачем и как их удалить.\n${url}\n\nУдалить аккаунт: в игре «Настройки» → «Удалить аккаунт и данные».`
      : `Пользовательское соглашение: правила игры, покупки за Stars и честная игра.\n${url}\n\nВопрос по покупке: /paysupport`);
    return { legal: priv ? 'privacy' : 'terms' };
  }
  if (cmd === '/play' || cmd.startsWith('/play@')) {
    await safeSend(env, msg.chat.id, 'Брод ждёт. Жми «Играть».', true);
    return { play: true };
  }
  await safeSend(env, msg.chat.id, 'Игра открывается кнопкой ниже.', true);
  return { fallback: true };
}

/** v40: legal pages (apps/legal/ on Cloudflare Pages). LEGAL_BASE_URL, else «../legal/» next to WEBAPP_URL. */
export function legalUrl(env, file) {
  let base = env.LEGAL_BASE_URL;
  if (!base) { try { base = new URL('../legal/', env.WEBAPP_URL || '').href; } catch { base = 'https://emberveil-dwp.pages.dev/legal/'; } }
  return base.replace(/\/?$/, '/') + file;
}

async function safeSend(env, chatId, text, button = false) {
  try {
    await tgCall(env, 'sendMessage', { chat_id: chatId, text, ...(button ? { reply_markup: webAppButton(env, 'Играть') } : {}) });
    return true;
  } catch (e) {
    console.error('sendMessage failed', e.message);
    return false;
  }
}

/** v42 (liveops §6.1): priority (lower = more valuable) — on a conflict the more valuable one is sent, the rest dropped. */
export const NOTIFY_PRIO = { raid: 1, forge: 2, hatch: 2, build_done: 2, expedition_done: 2, streak: 3, clan_goal: 4, boss_week: 5, event: 6, comeback: 7, income: 8, chest_free: 8, daily: 8 };
/** «Marketing» reminders — at most one a day; the rest are the player's own timers. */
export const NOTIFY_MARKETING = ['event', 'comeback', 'boss_week'];
/** Low-value reminders — only if nothing else was sent in the last 24 h. */
const NOTIFY_FILLER = ['income', 'chest_free', 'daily'];
/** Quiet hours in the DAY_OFFSET_MIN zone (Moscow): 23:00–09:00 — reminders wait until 09:00. */
export const QUIET_FROM = 23, QUIET_TO = 9;
/** 0 outside quiet hours, else UTC ms of the next 09:00 (zone time). */
export function quietUntil(now, env) {
  const h = localHour(now, env);
  if (h < QUIET_FROM && h >= QUIET_TO) return 0;
  const off = (Number.isFinite(Number(env && env.DAY_OFFSET_MIN)) ? Number(env.DAY_OFFSET_MIN) : 180) * 60000;
  const day0 = Math.floor((now + off) / 86400000) * 86400000;
  return day0 + (h >= QUIET_FROM ? 86400000 : 0) + QUIET_TO * 3600000 - off;
}

/**
 * Cron: deliver due reminders. Rate limits: NOTIFY_MAX_PER_DAY per user (default 3),
 * at least NOTIFY_MIN_GAP_MIN minutes between messages (default 60). Late or
 * over-limit reminders are dropped (never queued forever). Also cleans up old rows.
 * v42: quiet hours 23:00–09:00 МСК (postponed to 09:00), priorities, ≤1 marketing a day,
 * income only on an otherwise silent day, streak only if today's gift is not taken,
 * comeback only while the player is still away (chain: day 2 → 5 → 14, then stop).
 */
export async function runCron(env, now) {
  const maxDay = envInt(env, 'NOTIFY_MAX_PER_DAY', 3);
  const gap = envInt(env, 'NOTIFY_MIN_GAP_MIN', 60) * 60000;
  const due = (await env.DB.prepare(
    `SELECT n.id, n.uid, n.kind, n.due_at, u.tg_id, u.notify, u.can_pm, u.last_seen FROM notifications n JOIN users u ON u.id=n.uid
     WHERE n.status='pending' AND n.due_at<=? ORDER BY n.due_at LIMIT 100`
  ).bind(now).all()).results;
  const prio = (k) => NOTIFY_PRIO[k] || 9;
  due.sort((a, b) => (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0) || prio(a.kind) - prio(b.kind) || a.due_at - b.due_at || a.id - b.id);
  const stats = { sent: 0, dropped: 0 };
  const sentNow = new Set();
  const quiet = quietUntil(now, env);
  for (const n of due) {
    let drop = !n.notify || !n.can_pm || !n.tg_id || now - n.due_at > 12 * 3600000 || sentNow.has(n.uid);
    if (!drop && quiet) {
      // quiet hours: wait until 09:00 (counted neither as sent nor as dropped)
      await env.DB.prepare('UPDATE notifications SET due_at=? WHERE id=?').bind(quiet, n.id).run();
      stats.postponed = (stats.postponed || 0) + 1;
      continue;
    }
    if (!drop) {
      const r = await env.DB.prepare("SELECT COUNT(*) cnt, MAX(sent_at) last FROM notifications WHERE uid=? AND status='sent' AND sent_at>=?").bind(n.uid, now - 86400000).first();
      if ((r.cnt || 0) >= maxDay || (r.last && now - r.last < gap)) drop = true;
      else if (NOTIFY_FILLER.includes(n.kind) && (r.cnt || 0) > 0) drop = true;
    }
    if (!drop && NOTIFY_MARKETING.includes(n.kind)) {
      const m = await env.DB.prepare(`SELECT COUNT(*) cnt FROM notifications WHERE uid=? AND status='sent' AND sent_at>=? AND kind IN (${NOTIFY_MARKETING.map(() => '?').join(',')})`)
        .bind(n.uid, now - 86400000, ...NOTIFY_MARKETING).first();
      if ((m.cnt || 0) >= 1) drop = true;
    }
    if (!drop && n.kind === 'streak') {
      const d = await env.DB.prepare('SELECT last_day FROM daily WHERE uid=?').bind(n.uid).first();
      if (d && d.last_day >= dayKey(now, env)) drop = true; // today's gift is already taken
    }
    if (!drop && n.kind === 'comeback' && now - (n.last_seen || 0) < 36 * 3600000) drop = true; // the player is back
    if (drop) {
      await env.DB.prepare("UPDATE notifications SET status='dropped' WHERE id=?").bind(n.id).run();
      stats.dropped++;
      continue;
    }
    try {
      await tgCall(env, 'sendMessage', { chat_id: n.tg_id, text: NOTIFY_TEXT[n.kind] || 'Брод ждёт тебя.', reply_markup: webAppButton(env, 'Открыть Брод') });
      await env.DB.prepare("UPDATE notifications SET status='sent', sent_at=? WHERE id=?").bind(now, n.id).run();
      sentNow.add(n.uid);
      stats.sent++;
      if (n.kind === 'comeback') {
        const away = (now - (n.last_seen || now)) / 86400000;
        const next = away < 4.5 ? 5 : away < 13.5 ? 14 : 0;
        if (next) await queueNotification(env, n.uid, 'comeback', (n.last_seen || now) + next * 86400000);
      }
    } catch (e) {
      // 403 = user blocked the bot: stop messaging them.
      if (/403|blocked|deactivated/i.test(e.message)) await env.DB.prepare('UPDATE users SET can_pm=0 WHERE id=?').bind(n.uid).run();
      await env.DB.prepare("UPDATE notifications SET status='dropped' WHERE id=?").bind(n.id).run();
      stats.dropped++;
    }
  }
  // Housekeeping (cheap, bounded).
  const ret = retentionCutoffs(now);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM notifications WHERE status<>'pending' AND due_at<?").bind(now - 7 * 86400000),
    env.DB.prepare("UPDATE runs SET status='abandoned' WHERE status='open' AND started_at<?").bind(now - 6 * 3600000),
    env.DB.prepare("UPDATE raids SET status='rejected' WHERE status='open' AND started_at<?").bind(now - 3600000),
    env.DB.prepare('DELETE FROM runs WHERE started_at<?').bind(now - 30 * 86400000),
    env.DB.prepare("DELETE FROM invoices WHERE status='created' AND created_at<?").bind(now - 7 * 86400000),
    env.DB.prepare('DELETE FROM audit WHERE ts<?').bind(now - 90 * 86400000),
    env.DB.prepare('DELETE FROM ev_seen WHERE day<?').bind(new Date(now - 3 * 86400000).toISOString().slice(0, 10)),
    env.DB.prepare('DELETE FROM err_reports WHERE day<?').bind(new Date(now - 30 * 86400000).toISOString().slice(0, 10)),
    env.DB.prepare('DELETE FROM ad_credits WHERE at<?').bind(now - 3 * 86400000),
    // v41 retention (privacy policy): per-player activity days and milestones — 13 months; anonymous aggregates — 25 months
    env.DB.prepare('DELETE FROM active_days WHERE day<?').bind(ret.day13),
    env.DB.prepare('DELETE FROM milestones WHERE ts<?').bind(ret.ms13),
    env.DB.prepare('DELETE FROM ev_counts WHERE day<?').bind(ret.day25),
    env.DB.prepare('DELETE FROM ads_daily WHERE day<?').bind(ret.day25),
  ]);
  return stats;
}

/** v41: retention cutoffs — 13 months for per-player analytics (active_days, milestones), 25 months for aggregates. */
export function retentionCutoffs(now) {
  const back = (months) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - months); return d; };
  const d13 = back(13), d25 = back(25);
  return { day13: d13.toISOString().slice(0, 10), ms13: d13.getTime(), day25: d25.toISOString().slice(0, 10) };
}
