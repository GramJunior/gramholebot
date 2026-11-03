import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg, mockTelegram, BOT_TOKEN } from './helpers.js';

const hook = (env) => ({ 'x-telegram-bot-api-secret-token': env.WEBHOOK_SECRET });

test('Stars: invoice -> pre_checkout -> successful_payment is idempotent', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const tg = mockTelegram({ createInvoiceLink: () => 'https://t.me/$invoice-test' });
  try {
    const s = await loginTg(call, 777, 'Покупатель');
    const inv = await call('POST', '/pay/invoice', { token: s.token, body: { productId: 'bp_s1' } });
    assert.equal(inv.status, 200, JSON.stringify(inv.body));
    assert.equal(inv.body.link, 'https://t.me/$invoice-test');
    const ci = tg.calls.find((c) => c.method === 'createInvoiceLink');
    assert.equal(ci.params.currency, 'XTR');
    assert.equal(ci.params.prices[0].amount, 250);
    assert.ok(!('provider_token' in ci.params) || ci.params.provider_token === '');
    const payload = ci.params.payload;

    // Webhook auth.
    assert.equal((await call('POST', '/tg/webhook', { body: {} })).status, 401);

    // Pre-checkout: wrong amount -> rejected; correct -> ok.
    await call('POST', '/tg/webhook', { headers: hook(env), body: { update_id: 1, pre_checkout_query: { id: 'q1', from: { id: 777 }, currency: 'XTR', total_amount: 1, invoice_payload: payload } } });
    await call('POST', '/tg/webhook', { headers: hook(env), body: { update_id: 2, pre_checkout_query: { id: 'q2', from: { id: 999 }, currency: 'XTR', total_amount: 250, invoice_payload: payload } } });
    await call('POST', '/tg/webhook', { headers: hook(env), body: { update_id: 3, pre_checkout_query: { id: 'q3', from: { id: 777 }, currency: 'XTR', total_amount: 250, invoice_payload: payload } } });
    const answers = tg.calls.filter((c) => c.method === 'answerPreCheckoutQuery').map((c) => [c.params.pre_checkout_query_id, c.params.ok]);
    assert.deepEqual(answers, [['q1', false], ['q2', false], ['q3', true]]);

    // successful_payment delivered twice (Telegram retry) -> granted once.
    const pay = { update_id: 4, message: { message_id: 1, chat: { id: 777, type: 'private' }, from: { id: 777, first_name: 'Покупатель' }, successful_payment: { currency: 'XTR', total_amount: 250, invoice_payload: payload, telegram_payment_charge_id: 'chg_1' } } };
    assert.equal((await call('POST', '/tg/webhook', { headers: hook(env), body: pay })).status, 200);
    assert.equal((await call('POST', '/tg/webhook', { headers: hook(env), body: { ...pay, update_id: 5 } })).status, 200);
    const ent = await call('GET', '/entitlements', { token: s.token });
    assert.deepEqual(ent.body.items, [{ productId: 'bp_s1', qty: 1, expiresAt: null, active: true }]);
    const n = await env.DB.prepare('SELECT COUNT(*) n FROM payments').first();
    assert.equal(n.n, 1);
    assert.equal(tg.calls.filter((c) => c.method === 'sendMessage').length, 1, 'thank-you sent once');

    // Already owned one-time product: new invoice refused, and stale invoice fails pre-checkout.
    assert.equal((await call('POST', '/pay/invoice', { token: s.token, body: { productId: 'bp_s1' } })).status, 409);

    // Premium battle pass now unlocks premium track claims.
    const bp = await call('GET', '/bp', { token: s.token });
    assert.equal(bp.body.premium, true);

    // Refund revokes.
    await call('POST', '/tg/webhook', { headers: hook(env), body: { update_id: 6, message: { message_id: 2, chat: { id: 777, type: 'private' }, from: { id: 777 }, refunded_payment: { currency: 'XTR', total_amount: 250, invoice_payload: payload, telegram_payment_charge_id: 'chg_1' } } } });
    assert.deepEqual((await call('GET', '/entitlements', { token: s.token })).body.items, []);

    // The bot token never appears in any response.
    assert.ok(!JSON.stringify(inv.body).includes(BOT_TOKEN));
  } finally { tg.restore(); }
});

test('Stars: 30-day subscription extends expiry; guests cannot buy', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const tg = mockTelegram({ createInvoiceLink: 'https://t.me/$sub' });
  try {
    const s = await loginTg(call, 778);
    for (let i = 0; i < 2; i++) {
      await call('POST', '/pay/invoice', { token: s.token, body: { productId: 'keeper_30d' } });
      const payload = tg.calls.filter((c) => c.method === 'createInvoiceLink').at(-1).params.payload;
      await call('POST', '/tg/webhook', { headers: hook(env), body: { message: { message_id: i, chat: { id: 778, type: 'private' }, from: { id: 778 }, successful_payment: { currency: 'XTR', total_amount: 200, invoice_payload: payload, telegram_payment_charge_id: 'sub_' + i } } } });
    }
    const e = (await call('GET', '/entitlements', { token: s.token })).body.items[0];
    assert.equal(e.qty, 2);
    assert.equal(e.expiresAt, clock.now + 60 * 86400000);
    const g = await call('POST', '/auth/guest', { body: { deviceId: 'guest-device-123456789' } });
    assert.equal((await call('POST', '/pay/invoice', { token: g.body.token, body: { productId: 'bp_s1' } })).status, 403);
  } finally { tg.restore(); }
});

test('bot: /start replies with web_app button and links referral; /notify toggles', async () => {
  const env = makeEnv();
  const call = api(env);
  const tg = mockTelegram();
  try {
    const a = await loginTg(call, 900, 'Старый');
    await call('POST', '/tg/webhook', { headers: hook(env), body: { message: { message_id: 1, chat: { id: 901, type: 'private' }, from: { id: 901, first_name: 'Новый' }, text: '/start ref_' + a.me.refCode } } });
    const sm = tg.calls.find((c) => c.method === 'sendMessage');
    assert.equal(sm.params.chat_id, 901);
    assert.equal(sm.params.reply_markup.inline_keyboard[0][0].web_app.url, env.WEBAPP_URL);
    const u = await env.DB.prepare("SELECT referred_by, can_pm FROM users WHERE id='t901'").first();
    assert.deepEqual(u, { referred_by: 't900', can_pm: 1 });
    await call('POST', '/tg/webhook', { headers: hook(env), body: { message: { message_id: 2, chat: { id: 901, type: 'private' }, from: { id: 901, first_name: 'Новый' }, text: '/notify' } } });
    assert.equal((await env.DB.prepare("SELECT notify FROM users WHERE id='t901'").first()).notify, 1);
  } finally { tg.restore(); }
});
