// Telegram Stars payments (currency XTR).
//   POST /pay/invoice { productId } -> { link }   (open with Telegram.WebApp.openInvoice(link))
//   GET  /entitlements                -> { items:[{productId, qty, expiresAt, active}] }
// Webhook side (called from bot.js):
//   pre_checkout_query  -> answerPreCheckoutQuery(ok) after validating invoice/amount/owner
//   successful_payment  -> grant entitlement idempotently (telegram_payment_charge_id is the PK)
//   refunded_payment    -> revoke
import { fail, json, readJson, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { getConfigKey, loadConfig, activeSeason } from '../lib/config.js';
import { randomId } from '../lib/crypto.js';
import { tgCall } from '../lib/telegram.js';
import { requireAdmin } from './live.js';
import { nextWeekStart, nextDayStart } from '../lib/time.js';

const DAY = 86400000;

async function ownedActive(env, uid, productId, now) {
  const e = await env.DB.prepare('SELECT qty, expires_at FROM entitlements WHERE uid=? AND product_id=?').bind(uid, productId).first();
  return !!(e && e.qty > 0 && (!e.expires_at || e.expires_at > now));
}

export async function createInvoice(c) {
  const user = await requireUser(c);
  if (!user.tg_id) fail(403, 'tg_only', 'Покупки доступны только в Telegram');
  const body = await readJson(c.req, 512);
  const products = await getConfigKey(c.env, 'products');
  const p = (products || []).find((x) => x.id === str(body.productId, 40));
  if (!p) fail(404, 'no_product', 'Товар не найден');
  // v42: a season's premium pass is sold only while that season runs (s1 → bp_s1, s2 «Долгая Стужа» → bp_s2)
  if (p.type === 'battlepass' && p.season) { const s = activeSeason(await loadConfig(c.env), c.now); if (!s || s.id !== p.season) fail(409, 'off_season', 'Этот сезон сейчас не идёт'); }
  if (p.once && (await ownedActive(c.env, user.id, p.id, c.now))) fail(409, 'owned', 'Уже куплено');
  if (p.weekly && (await weeklyBought(c.env, user.id, p.id, c.now))) fail(409, 'owned_week', 'Уже куплено на этой неделе');
  const payload = randomId(16);
  await c.env.DB.prepare('INSERT INTO invoices (payload, uid, product_id, stars, created_at) VALUES (?,?,?,?,?)').bind(payload, user.id, p.id, p.stars, c.now).run();
  let link;
  try {
    link = await tgCall(c.env, 'createInvoiceLink', {
      title: String(p.title).slice(0, 32),
      description: String(p.description || p.title).slice(0, 255),
      payload,
      currency: 'XTR',
      prices: [{ label: String(p.title).slice(0, 32), amount: p.stars }],
    });
  } catch (e) {
    console.error('createInvoiceLink failed', e.message);
    fail(502, 'tg_failed', 'Telegram не создал счёт, попробуйте позже');
  }
  return json({ ok: true, link, productId: p.id, stars: p.stars });
}

export async function listEntitlements(c) {
  const user = await requireUser(c);
  const rows = (await c.env.DB.prepare('SELECT product_id, qty, claimed, expires_at FROM entitlements WHERE uid=? AND qty>0').bind(user.id).all()).results;
  return json({ ok: true, items: rows.map((r) => ({ productId: r.product_id, qty: r.qty, ...(r.claimed ? { claimed: r.claimed } : {}), expiresAt: r.expires_at || null, active: !r.expires_at || r.expires_at > c.now })) });
}

/** Validate a pre_checkout_query. Returns { ok, error? } — error text is shown to the user. */
export async function checkPreCheckout(env, q, now) {
  const inv = await env.DB.prepare('SELECT * FROM invoices WHERE payload=?').bind(String(q.invoice_payload || '')).first();
  if (!inv || inv.status !== 'created') return { ok: false, error: 'Счёт устарел. Откройте покупку заново.' };
  if (inv.uid !== 't' + q.from.id) return { ok: false, error: 'Счёт выписан другому игроку.' };
  if (q.currency !== 'XTR' || q.total_amount !== inv.stars) return { ok: false, error: 'Сумма не совпадает.' };
  const products = await getConfigKey(env, 'products');
  const p = (products || []).find((x) => x.id === inv.product_id);
  if (!p) return { ok: false, error: 'Товар больше не продаётся.' };
  if (p.once && (await ownedActive(env, inv.uid, p.id, now))) return { ok: false, error: 'Этот товар у вас уже есть.' };
  if (p.weekly && (await weeklyBought(env, inv.uid, p.id, now))) return { ok: false, error: 'Недельный набор уже куплен.' };
  return { ok: true };
}

/**
 * Grant a successful payment. Idempotent: Telegram may deliver the same update
 * more than once; the charge id is the primary key so the second insert is ignored.
 */
export async function grantPayment(env, msg, now) {
  const sp = msg.successful_payment;
  const charge = String(sp.telegram_payment_charge_id || '');
  if (!charge) return { granted: false, reason: 'no_charge' };
  const inv = await env.DB.prepare('SELECT * FROM invoices WHERE payload=?').bind(String(sp.invoice_payload || '')).first();
  const uid = inv ? inv.uid : 't' + msg.from.id;
  const productId = inv ? inv.product_id : 'unknown';
  const ins = await env.DB.prepare('INSERT INTO payments (charge_id, uid, product_id, stars, payload, created_at) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING')
    .bind(charge, uid, productId, sp.total_amount | 0, String(sp.invoice_payload || ''), now).run();
  if (!ins.meta.changes) return { granted: false, duplicate: true };
  if (!inv) { console.error('payment without invoice', charge); return { granted: false, reason: 'no_invoice' }; }
  const products = await getConfigKey(env, 'products');
  const p = (products || []).find((x) => x.id === productId) || {};
  const ext = p.days ? p.days * DAY : null;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO entitlements (uid, product_id, qty, expires_at, updated_at) VALUES (?,?,1,?,?)
      ON CONFLICT(uid, product_id) DO UPDATE SET qty=qty+1,
        expires_at=CASE WHEN ? IS NULL THEN NULL ELSE MAX(COALESCE(expires_at,0), ?) + ? END, updated_at=excluded.updated_at`)
      .bind(uid, productId, ext ? now + ext : null, now, ext, now, ext),
    env.DB.prepare("UPDATE invoices SET status='paid' WHERE payload=?").bind(inv.payload),
  ]);
  // v41: first-payer milestone (cohort conversion) — not for players who turned «Отправлять статистику» off
  await env.DB.prepare("INSERT OR IGNORE INTO milestones (uid, m, ts) SELECT ?, 'pay:first', ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE id=? AND stats_off=1)").bind(uid, now, uid).run();
  return { granted: true, uid, productId };
}

export async function revokePayment(env, chargeId, now) {
  const pay = await env.DB.prepare("SELECT * FROM payments WHERE charge_id=? AND status='paid'").bind(String(chargeId)).first();
  if (!pay) return { revoked: false };
  const r = await env.DB.prepare("UPDATE payments SET status='refunded' WHERE charge_id=? AND status='paid'").bind(pay.charge_id).run();
  if (!r.meta.changes) return { revoked: false };
  await env.DB.batch([
    env.DB.prepare('UPDATE entitlements SET qty=MAX(0, qty-1), updated_at=? WHERE uid=? AND product_id=?').bind(now, pay.uid, pay.product_id),
    env.DB.prepare("UPDATE invoices SET status='refunded' WHERE payload=?").bind(pay.payload),
  ]);
  return { revoked: true };
}

/** POST /admin/refund { chargeId } — refund Stars via Bot API and revoke. */
export async function adminRefund(c) {
  requireAdmin(c);
  const b = await readJson(c.req, 512);
  const pay = await c.env.DB.prepare("SELECT * FROM payments WHERE charge_id=? AND status='paid'").bind(str(b.chargeId, 128)).first();
  if (!pay) fail(404, 'no_payment', 'Платёж не найден');
  const u = await c.env.DB.prepare('SELECT tg_id FROM users WHERE id=?').bind(pay.uid).first();
  try {
    await tgCall(c.env, 'refundStarPayment', { user_id: u.tg_id, telegram_payment_charge_id: pay.charge_id });
  } catch (e) {
    fail(502, 'tg_failed', 'Telegram отклонил возврат: ' + String(e.message).replace(/^tg_error:refundStarPayment:/, ''));
  }
  return json({ ok: true, ...(await revokePayment(c.env, pay.charge_id, c.now)) });
}

// ---------- v5 «Лавка»: consumables & bundles ----------
// Paid products with a `grant` are consumables: every successful payment raises entitlements.qty;
// the game claims (qty - claimed) once. The claim is idempotent per claimId so a lost response can be retried.

/** POST /pay/claim { claimId } -> { ok, claimId, grants:[{productId, n, grant}] } */
export async function claimPurchases(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 512);
  const claimId = str(body.claimId, 48);
  if (!/^[a-z0-9_-]{6,48}$/i.test(claimId)) fail(400, 'bad_claim', 'Нужен claimId');
  const prev = await c.env.DB.prepare('SELECT uid, result FROM pay_claims WHERE claim_id=?').bind(claimId).first();
  if (prev) {
    if (prev.uid !== user.id) fail(409, 'claim_taken', 'Этот claimId уже использован');
    return json({ ok: true, claimId, grants: JSON.parse(prev.result), repeat: true });
  }
  const rows = (await c.env.DB.prepare('SELECT product_id, qty, claimed FROM entitlements WHERE uid=? AND qty>claimed').bind(user.id).all()).results || [];
  const products = (await getConfigKey(c.env, 'products')) || [];
  const grants = [];
  for (const r of rows) {
    const p = products.find((x) => x.id === r.product_id);
    if (!p || !p.grant) continue; // cosmetics/pass/subscriptions are read from /entitlements
    const n = r.qty - r.claimed;
    // compare-and-set: a concurrent claim with another id cannot grant the same purchase twice
    const up = await c.env.DB.prepare('UPDATE entitlements SET claimed=?, updated_at=? WHERE uid=? AND product_id=? AND claimed=?').bind(r.qty, c.now, user.id, r.product_id, r.claimed).run();
    if (up.meta.changes) {
      grants.push({ productId: p.id, n, grant: p.grant });
      // v41: first purchase ×2 — once per product, only when nothing of it was ever claimed before (server-validated)
      if (p.firstX2 && r.claimed === 0) grants.push({ productId: p.id, n: 1, grant: p.grant, bonus: 'first_x2' });
    }
  }
  await c.env.DB.prepare('INSERT INTO pay_claims (claim_id, uid, result, created_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').bind(claimId, user.id, JSON.stringify(grants), c.now).run();
  return json({ ok: true, claimId, grants });
}

/** Weekly products (weekly:true) can be bought once per ISO week (game-local). */
export async function weeklyBought(env, uid, productId, now) {
  const start = nextWeekStart(now, env) - 7 * DAY;
  const r = await env.DB.prepare("SELECT COUNT(*) n FROM payments WHERE uid=? AND product_id=? AND status='paid' AND created_at>=?").bind(uid, productId, start).first();
  return (r && r.n) > 0;
}

/** POST /chest/free -> { ok:true, next } when the free wooden chest is ready (server clock), else { ok:false, next }. */
export async function freeChest(c) {
  const user = await requireUser(c);
  const hours = Number(await getConfigKey(c.env, 'freeChestHours')) || 4;
  const period = hours * 3600000;
  const t = await c.env.DB.prepare('SELECT at, n FROM user_timers WHERE uid=? AND key=?').bind(user.id, 'free_chest').first();
  if (t && c.now < t.at + period) return json({ ok: false, error: 'not_ready', next: t.at + period, n: t.n });
  // conditional upsert: two parallel taps cannot both succeed
  const r = await c.env.DB.prepare(`INSERT INTO user_timers (uid, key, at, n) VALUES (?,?,?,1)
    ON CONFLICT(uid, key) DO UPDATE SET at=excluded.at, n=n+1 WHERE user_timers.at <= ?`).bind(user.id, 'free_chest', c.now, c.now - period).run();
  if (!r.meta.changes) return json({ ok: false, error: 'not_ready', next: (t ? t.at : c.now) + period });
  return json({ ok: true, next: c.now + period, n: (t ? t.n : 0) + 1 });
}

/**
 * v41 «Угольная печать» (timed card, product with `days` + `perDay`): POST /pay/seal { productId? }
 * -> { ok:true, sparks, daysLeft, expiresAt, next } once per game day while the entitlement is active;
 *    { ok:false, error:'claimed', next } — already taken today; 403 no_seal — not bought or expired.
 */
export async function claimSeal(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 256);
  const products = (await getConfigKey(c.env, 'products')) || [];
  const want = str(body.productId || 'coal_seal', 40);
  const p = products.find((x) => x.id === want && x.days > 0 && x.perDay > 0);
  if (!p) fail(404, 'no_product', 'Товар не найден');
  const e = await c.env.DB.prepare('SELECT qty, expires_at FROM entitlements WHERE uid=? AND product_id=?').bind(user.id, p.id).first();
  if (!e || !(e.qty > 0) || !e.expires_at || e.expires_at <= c.now) fail(403, 'no_seal', 'Печать не действует');
  const next = nextDayStart(c.now, c.env);
  const dayStart = next - 86400000;
  const key = 'seal:' + p.id;
  // conditional upsert: one claim per game day even with parallel taps
  const r = await c.env.DB.prepare(`INSERT INTO user_timers (uid, key, at, n) VALUES (?,?,?,1)
    ON CONFLICT(uid, key) DO UPDATE SET at=excluded.at, n=n+1 WHERE user_timers.at < ?`).bind(user.id, key, c.now, dayStart).run();
  if (!r.meta.changes) return json({ ok: false, error: 'claimed', next, expiresAt: e.expires_at });
  const daysLeft = Math.max(0, Math.ceil((e.expires_at - c.now) / DAY));
  return json({ ok: true, productId: p.id, sparks: p.perDay | 0, daysLeft, expiresAt: e.expires_at, next });
}
