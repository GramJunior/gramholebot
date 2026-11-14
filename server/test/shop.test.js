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
    // v41: the very first purchase of a gem pack is doubled (second grant entry, tagged bonus)
    assert.deepEqual(c1.body.grants, [{ productId: 'crys_450', n: 1, grant: { sparks: 450 } }, { productId: 'crys_450', n: 1, grant: { sparks: 450 }, bonus: 'first_x2' }]);
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
    assert.deepEqual(byId.starter_pack.grant, { sparks: 300, open_gold: 2, chest_iron: 2, prot: 3 });
    assert.equal(byId.weekly_pack.grant.open_leg, 1);
    // next Monday (game-local, UTC+3) the weekly pack is available again
    clock.now = Date.parse('2026-11-09T00:30:00+03:00');
    const s2 = await loginTg(call, 601, 'Набор'); // fresh session after 5 days
    await buy(call, env, tg, s2, 601, 'weekly_pack', 'ch_w2');
    assert.deepEqual((await call('POST', '/pay/claim', { token: s2.token, body: { claimId: 'cl_pack2' } })).body.grants.map((g) => [g.productId, g.n]), [['weekly_pack', 1]]);
  } finally { tg.restore(); }
});

test('Колесо судьбы: вращения за Stars (×1 и ×10 со скидкой) — расходники, выдаются один раз', async () => {
  const env = makeEnv();
  const call = api(env, { now: Date.parse('2026-11-04T10:00:00Z') });
  const tg = mockTelegram({ createInvoiceLink: () => 'https://t.me/$inv' });
  try {
    const s = await loginTg(call, 701, 'Колесо');
    const cfg = await call('GET', '/config');
    const p1 = cfg.body.products.find((x) => x.id === 'spin_1');
    const p10 = cfg.body.products.find((x) => x.id === 'spin_10');
    assert.deepEqual(p1.grant, { spin: 1 }); assert.deepEqual(p10.grant, { spin: 10 });
    assert.ok(p10.stars < p1.stars * 10, '×10 дешевле десяти ×1');
    assert.equal(p1.once, false); assert.equal(p10.weekly, false);
    await buy(call, env, tg, s, 701, 'spin_10', 'ch_sp1');
    await buy(call, env, tg, s, 701, 'spin_1', 'ch_sp2');
    await buy(call, env, tg, s, 701, 'spin_1', 'ch_sp3');
    const c = await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_spin1' } });
    assert.equal(c.status, 200);
    const g = Object.fromEntries(c.body.grants.map((x) => [x.productId, x]));
    assert.deepEqual(g.spin_10, { productId: 'spin_10', n: 1, grant: { spin: 10 } });
    assert.deepEqual(g.spin_1, { productId: 'spin_1', n: 2, grant: { spin: 1 } });
    assert.deepEqual((await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_spin2' } })).body.grants, []);
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

test('v41 Stars: first purchase ×2 once per gem tier, catalog prices, keeper has no combat bonus', async () => {
  const env = makeEnv();
  const call = api(env, { now: Date.parse('2026-11-12T10:00:00Z') });
  const tg = mockTelegram({ createInvoiceLink: () => 'https://t.me/$inv' });
  try {
    const cfg = (await call('GET', '/config')).body;
    const by = Object.fromEntries(cfg.products.map((p) => [p.id, p]));
    assert.equal(by.chest_gold3.stars, 99, 'три золотых сундука дешевле легендарного');
    assert.ok(by.chest_gold3.stars < by.chest_leg1.stars);
    assert.equal(by.starter_pack.tag, '×4 выгода');
    assert.ok(!('key_iron' in by.starter_pack.grant), 'вместо ключей — железные сундуки');
    assert.equal(by.adv_pack.stars, 29); assert.equal(by.adv_pack.once, true); assert.deepEqual(by.adv_pack.grant, { sparks: 100, cos_frame_adv: 1 });
    assert.equal(by.coal_seal.stars, 199); assert.equal(by.coal_seal.days, 30); assert.equal(by.coal_seal.perDay, 40); assert.deepEqual(by.coal_seal.grant, { sparks: 150 });
    assert.ok(/Без боевых бонусов/.test(by.keeper_30d.description));
    for (const id of ['crys_80', 'crys_450', 'crys_1000', 'crys_2200']) assert.equal(by[id].firstX2, true, id);
    const s = await loginTg(call, 801, 'Первая');
    await buy(call, env, tg, s, 801, 'crys_80', 'ch_x1');
    await buy(call, env, tg, s, 801, 'crys_1000', 'ch_x2');
    const c1 = (await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_x2_01' } })).body.grants;
    const sum = (g, id) => g.filter((x) => x.productId === id).reduce((a, x) => a + x.n * x.grant.sparks, 0);
    assert.equal(sum(c1, 'crys_80'), 160); assert.equal(sum(c1, 'crys_1000'), 2000);
    // second purchase of the same tier: no bonus
    await buy(call, env, tg, s, 801, 'crys_80', 'ch_x3');
    const c2 = (await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_x2_02' } })).body.grants;
    assert.deepEqual(c2, [{ productId: 'crys_80', n: 1, grant: { sparks: 80 } }]);
    // the adventurer pack is one-time
    await buy(call, env, tg, s, 801, 'adv_pack', 'ch_adv');
    assert.equal((await call('POST', '/pay/invoice', { token: s.token, body: { productId: 'adv_pack' } })).status, 409);
  } finally { tg.restore(); }
});

test('v41 «Угольная печать»: 150 now, 40 once per game day for 30 days (server entitlement)', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-12T10:00:00Z') };
  const call = api(env, clock);
  const tg = mockTelegram({ createInvoiceLink: () => 'https://t.me/$inv' });
  try {
    const s = await loginTg(call, 901, 'Печать');
    // not bought -> refused
    const no = await call('POST', '/pay/seal', { token: s.token, body: {} });
    assert.equal(no.status, 403); assert.equal(no.body.error, 'no_seal');
    await buy(call, env, tg, s, 901, 'coal_seal', 'ch_seal1');
    const cl = (await call('POST', '/pay/claim', { token: s.token, body: { claimId: 'cl_seal01' } })).body.grants;
    assert.deepEqual(cl, [{ productId: 'coal_seal', n: 1, grant: { sparks: 150 } }]);
    const ent = (await call('GET', '/entitlements', { token: s.token })).body.items.find((i) => i.productId === 'coal_seal');
    assert.equal(ent.expiresAt, clock.now + 30 * 86400000); assert.equal(ent.active, true);
    const d1 = await call('POST', '/pay/seal', { token: s.token, body: {} });
    assert.equal(d1.status, 200); assert.equal(d1.body.ok, true); assert.equal(d1.body.sparks, 40); assert.equal(d1.body.daysLeft, 30);
    // same game day -> refused
    const d1b = await call('POST', '/pay/seal', { token: s.token, body: {} });
    assert.equal(d1b.body.ok, false); assert.equal(d1b.body.error, 'claimed');
    // next game day (UTC+3 midnight) -> ok again
    clock.now = Date.parse('2026-11-13T00:10:00+03:00');
    const s2 = await loginTg(call, 901, 'Печать');
    const d2 = await call('POST', '/pay/seal', { token: s2.token, body: {} });
    assert.equal(d2.body.ok, true); assert.equal(d2.body.daysLeft, 30);
    // after 30 days the seal expires
    clock.now = Date.parse('2026-12-13T12:00:00Z');
    const s3 = await loginTg(call, 901, 'Печать');
    assert.equal((await call('POST', '/pay/seal', { token: s3.token, body: {} })).status, 403);
    // guest without auth
    assert.equal((await call('POST', '/pay/seal', { body: {} })).status, 401);
  } finally { tg.restore(); }
});
