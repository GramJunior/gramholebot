import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg, mockTelegram } from './helpers.js';

const hook = (env) => ({ 'x-telegram-bot-api-secret-token': env.WEBHOOK_SECRET });
let upd = 100;
// buy a product end-to-end (invoice -> pre-checkout -> successful_payment); returns the charge id
async function buy(call, env, tg, s, uid, productId, charge) {
  const inv = await call('POST', '/pay/invoice', { token: s.token, body: { productId } });
  if (inv.status !== 200) return inv;
  const ci = tg.calls.filter((c) => c.method === 'createInvoiceLink').pop();
  const payload = ci.params.payload; const amount = ci.params.prices[0].amount;
  await call('POST', '/tg/webhook', { headers: hook(env), body: { update_id: upd++, pre_checkout_query: { id: 'q' + upd, from: { id: uid }, currency: 'XTR', total_amount: amount, invoice_payload: payload } } });
  const ok = tg.calls.filter((c) => c.method === 'answerPreCheckoutQuery').pop();
  assert.equal(ok.params.ok, true, 'pre-checkout accepted');
  const pay = { update_id: upd++, message: { message_id: upd, chat: { id: uid, type: 'private' }, from: { id: uid, first_name: 'П' }, successful_payment: { currency: 'XTR', total_amount: amount, invoice_payload: payload, telegram_payment_charge_id: charge } } };
  assert.equal((await call('POST', '/tg/webhook', { headers: hook(env), body: pay })).status, 200);
  return { status: 200, pay };
}

test('Лавка: gem packs are consumables claimed exactly once (idempotent claim id)', async () => {
  const env = makeEnv();
  const call = api(env, { now: Date.parse('2026-11-04T10:00:00Z') });
  const tg = mockTelegram({ createInvoiceLink: () => 'https://t.me/$inv' });
  try {
    const s = await loginTg(call, 501, 'Самоцвет');
    // config exposes grants for the client shop
    const cfg = await call('GET', '/config');
    const p = cfg.body.products.find((x) => x.id === 'crys_450');
    assert.deepEqual(p.grant, { sparks: 450 });
    assert.equal(cfg.body.freeChestHours, 4);

    // nothing to claim yet
    assert.deepEqual((await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_empty1' } })).body.grants, []);
    assert.equal((await call('POST', '/pay/claim', { token: s.token, body: { claimId: '!' } })).status, 400);

    const b = await buy(call, env, tg, s, 501, 'crys_450', 'ch_g1');
    // Telegram retries the same update -> still one purchase
    await call('POST', '/tg/webhook', { headers: hook(env), body: { ...b.pay, update_id: upd++ } });
    const c1 = await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_aaaa1' } });
    assert.equal(c1.status, 200);
    assert.deepEqual(c1.body.grants, [{ productId: 'crys_450', n: 1, grant: { sparks: 450 } }]);
    // response lost -> the game retries with the same id -> same result, nothing new granted
    const c1b = await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_aaaa1' } });
    assert.deepEqual(c1b.body.grants, c1.body.grants); assert.equal(c1b.body.repeat, true);
    // a new claim id sees nothing left
    assert.deepEqual((await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_aaaa2' } })).body.grants, []);
    // consumables can be bought again; two more purchases -> one claim with n=2
    await buy(call, env, tg, s, 501, 'crys_450', 'ch_g2');
    await buy(call, env, tg, s, 501, 'crys_450', 'ch_g3');
    const c2 = await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_aaaa3' } });
    assert.deepEqual(c2.body.grants, [{ productId: 'crys_450', n: 2, grant: { sparks: 450 } }]);
    const ent = (await call('GET', '/entitlements', { token: s.token })).body.items.find((i) => i.productId === 'crys_450');
    assert.equal(ent.qty, 3); assert.equal(ent.claimed, 3);
    // another player cannot reuse someone's claim id
    const s2 = await loginTg(call, 502, 'Другой');
    assert.equal((await call('POST', '/pay/claim', { token: s2.token, body: { claimId: 'cl_aaaa1' } })).status, 409);
    // cosmetics (no grant) are never returned by /pay/claim
    await buy(call, env, tg, s, 501, 'pack_dawn', 'ch_c1');
    assert.deepEqual((await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_aaaa4' } })).body.grants, []);
  } finally { tg.restore(); }
});

test('Лавка: starter pack once, weekly pack once per ISO week, bundles carry grants', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') }; // Wednesday
  const call = api(env, clock);
  const tg = mockTelegram({ createInvoiceLink: () => 'https://t.me/$inv' });
  try {
    const s = await loginTg(call, 601, 'Набор');
    await buy(call, env, tg, s, 601, 'starter_pack', 'ch_s1');
    assert.equal((await call('POST', '/pay/invoice', { token: s.token, body: { productId: 'starter_pack' } })).status, 409);
    await buy(call, env, tg, s, 601, 'weekly_pack', 'ch_w1');
    const again = await call('POST', '/pay/invoice', { token: s.token, body: { productId: 'weekly_pack' } });
    assert.equal(again.status, 409); assert.equal(again.body.error, 'owned_week');
    const cl = await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_pack1' } });
    const byId = Object.fromEntries(cl.body.grants.map((g) => [g.productId, g]));
    assert.deepEqual(byId.starter_pack.grant, { sparks: 300, open_gold: 2, key_iron: 5, prot: 3 });
    assert.equal(byId.weekly_pack.grant.open_leg, 1);
    // next Monday (game-local, UTC+3) the weekly pack is available again
    clock.now = Date.parse('2026-11-09T00:30:00+03:00');
    const s2 = await loginTg(call, 601, 'Набор'); // fresh session after 5 days
    await buy(call, env, tg, s2, 601, 'weekly_pack', 'ch_w2');
    assert.deepEqual((await call('POST', '/pay/claim', { token: s2.token, body: { claimId: 'cl_pack2' } })).body.grants.map((g) => [g.productId, g.n]), [['weekly_pack', 1]]);
  } finally { tg.restore(); }
});

test('Лавка: free chest timer is enforced by the server clock', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const s = await loginTg(call, 701, 'Сундук');
  const a = await call('POST', '/chest/free', { token: s.token, body: {} });
  assert.equal(a.body.ok, true); assert.equal(a.body.next, clock.now + 4 * 3600000);
  clock.now += 3600000;
  const b = await call('POST', '/chest/free', { token: s.token, body: {} });
  assert.equal(b.body.ok, false); assert.equal(b.body.next, a.body.next);
  clock.now = a.body.next;
  const c = await call('POST', '/chest/free', { token: s.token, body: {} });
  assert.equal(c.body.ok, true); assert.equal(c.body.n, 2);
  assert.equal((await call('POST', '/chest/free', { body: {} })).status, 401);
});

test('Лавка: admin config validates grants and free chest hours', async () => {
  const env = makeEnv();
  const call = api(env, { now: Date.parse('2026-11-04T10:00:00Z') });
  const adm = { authorization: 'Bearer ' + env.ADMIN_SECRET };
  const put = (key, v) => call('PUT', '/admin/config/' + key, { headers: { ...adm, 'content-type': 'application/json' }, raw: JSON.stringify(v) });
  assert.equal((await put('products', [{ id: 'crys_x', title: 'X', stars: 10, grant: { sparks: -5 } }])).status, 400);
  assert.equal((await put('products', [{ id: 'crys_x', title: 'X', stars: 10, grant: { sparks: 5 } }])).status, 200);
  assert.equal((await put('freeChestHours', 0)).status, 400);
  assert.equal((await put('freeChestHours', 6)).status, 200);
  const cfg = await call('GET', '/config');
  assert.equal(cfg.body.freeChestHours, 6);
  assert.deepEqual(cfg.body.products.map((p) => p.id), ['crys_x']);
});
