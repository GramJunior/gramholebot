// Telegram Stars payments (currency XTR).
//   POST /pay/invoice { productId } -> { link }   (open with Telegram.WebApp.openInvoice(link))
//   GET  /entitlements                -> { items:[{productId, qty, expiresAt, active}] }
// Webhook side (called from bot.js):
//   pre_checkout_query  -> answerPreCheckoutQuery(ok) after validating invoice/amount/owner
//   successful_payment  -> grant entitlement idempotently (telegram_payment_charge_id is the PK)
//   refunded_payment    -> revoke
import { fail, json, readJson, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { getConfigKey } from '../lib/config.js';
import { randomId } from '../lib/crypto.js';
import { tgCall } from '../lib/telegram.js';
import { requireAdmin } from './live.js';

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
  if (p.once && (await ownedActive(c.env, user.id, p.id, c.now))) fail(409, 'owned', 'Уже куплено');
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
  const rows = (await c.env.DB.prepare('SELECT product_id, qty, expires_at FROM entitlements WHERE uid=? AND qty>0').bind(user.id).all()).results;
  return json({ ok: true, items: rows.map((r) => ({ productId: r.product_id, qty: r.qty, expiresAt: r.expires_at || null, active: !r.expires_at || r.expires_at > c.now })) });
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
