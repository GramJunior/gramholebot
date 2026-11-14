import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInitData, signJwt, verifyJwt } from '../src/lib/crypto.js';
import { makeEnv, api, makeInitData, loginTg } from './helpers.js';

// Known vector computed independently with Python's hmac/hashlib:
//   secret = HMAC_SHA256(key=b"WebAppData", msg=token); hash = HMAC_SHA256(secret, data_check_string).hex()
const VEC_TOKEN = '1234567890:TEST-TOKEN-for-emberveil-vectors';
const VEC_HASH = '0c927a197f4d4565be063ee960935b86e869c67bb0e66124bfee702e5789fd5a';
const VEC = 'auth_date=1762128000&query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22%D0%98%D1%81%D0%BA%D1%80%D0%B0%22%2C%22username%22%3A%22spark_test%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%7D&start_param=ref_abcd2345&signature=dGVzdHNpZ25hdHVyZQ&hash=' + VEC_HASH;
const VEC_NOW = 1762128000 * 1000 + 60000; // one minute after auth_date

test('initData: known test vector validates', async () => {
  const r = await validateInitData(VEC, VEC_TOKEN, { now: VEC_NOW });
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.user.id, 279058397);
  assert.equal(r.user.first_name, 'Искра');
  assert.equal(r.startParam, 'ref_abcd2345');
});

test('initData: wrong token / tampered field / tampered hash rejected', async () => {
  assert.equal((await validateInitData(VEC, VEC_TOKEN + 'x', { now: VEC_NOW })).reason, 'bad_hash');
  assert.equal((await validateInitData(VEC.replace('ref_abcd2345', 'ref_abcd2346'), VEC_TOKEN, { now: VEC_NOW })).reason, 'bad_hash');
  assert.equal((await validateInitData(VEC.replace(VEC_HASH, VEC_HASH.replace(/^0/, '1')), VEC_TOKEN, { now: VEC_NOW })).reason, 'bad_hash');
  assert.equal((await validateInitData(VEC.replace(/&hash=.*/, ''), VEC_TOKEN, { now: VEC_NOW })).reason, 'no_hash');
  assert.equal((await validateInitData('', VEC_TOKEN)).reason, 'empty');
  assert.equal((await validateInitData(VEC, '')).reason, 'not_configured');
});

test('initData: auth_date freshness', async () => {
  assert.equal((await validateInitData(VEC, VEC_TOKEN, { now: VEC_NOW + 2 * 86400000 })).reason, 'expired');
  assert.equal((await validateInitData(VEC, VEC_TOKEN, { now: VEC_NOW + 2 * 86400000, maxAgeSec: 7 * 86400 })).ok, true);
  assert.equal((await validateInitData(VEC, VEC_TOKEN, { now: VEC_NOW - 3600000 })).reason, 'future');
});

test('initData: our generator matches the vector (sanity of test helper)', async () => {
  const gen = await makeInitData(
    { id: 279058397, first_name: 'Искра', username: 'spark_test', language_code: 'ru', allows_write_to_pm: true },
    { authDate: 1762128000, token: VEC_TOKEN, startParam: 'ref_abcd2345', extra: { query_id: 'AAHdF6IQAAAAAN0XohDhrOrc', signature: 'dGVzdHNpZ25hdHVyZQ' } }
  );
  assert.equal(new URLSearchParams(gen).get('hash'), VEC_HASH);
});

test('JWT sign/verify/expiry/tamper', async () => {
  const now = Date.now();
  const t = await signJwt({ sub: 't1', exp: Math.floor(now / 1000) + 60 }, 'secret-secret-secret');
  assert.equal((await verifyJwt(t, 'secret-secret-secret', now)).sub, 't1');
  assert.equal(await verifyJwt(t, 'other-secret-secret', now), null);
  assert.equal(await verifyJwt(t, 'secret-secret-secret', now + 120000), null);
  const [h, , s] = t.split('.');
  const forged = h + '.' + Buffer.from(JSON.stringify({ sub: 't2', exp: 9e9 })).toString('base64url') + '.' + s;
  assert.equal(await verifyJwt(forged, 'secret-secret-secret', now), null);
});

test('auth endpoint: login, /me, never leaks bot token, guest mode switch', async () => {
  const env = makeEnv();
  const call = api(env);
  const s = await loginTg(call, 555, 'Ведана');
  assert.ok(s.token);
  assert.equal(s.me.name, 'Ведана');
  assert.equal(s.isNew, true);
  assert.ok(!JSON.stringify(s).includes(env.BOT_TOKEN));
  const me = await call('GET', '/me', { token: s.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.me.pid, s.me.pid);
  assert.equal((await call('GET', '/me')).status, 401);
  assert.equal((await call('GET', '/me', { token: s.token + 'x' })).status, 401);

  const bad = await call('POST', '/auth/telegram', { body: { initData: 'user=%7B%7D&auth_date=1&hash=' + '0'.repeat(64) } });
  assert.equal(bad.status, 401);

  const g = await call('POST', '/auth/guest', { body: { deviceId: 'dev-device-0123456789' } });
  assert.equal(g.status, 200);
  assert.equal(g.body.me.guest, true);
  const g2 = await call('POST', '/auth/guest', { body: { deviceId: 'dev-device-0123456789' } });
  assert.equal(g2.body.me.pid, g.body.me.pid, 'same device -> same guest');
  env.ALLOW_GUEST = '0';
  assert.equal((await call('POST', '/auth/guest', { body: { deviceId: 'dev-device-0123456789' } })).status, 403);
});

test('referral via start_param: friend gets a gift at once, both become friends (inviter waits for 1-5, see analytics.test.js)', async () => {
  const env = makeEnv();
  const call = api(env);
  const a = await loginTg(call, 1001, 'Горан');
  const b = await loginTg(call, 1002, 'Мира', { startParam: 'ref_' + a.me.refCode });
  const inboxA = await call('GET', '/inbox', { token: a.token });
  const inboxB = await call('GET', '/inbox', { token: b.token });
  assert.equal(inboxA.body.items.length, 0, 'v41: no reward for the inviter at registration');
  assert.equal(inboxB.body.items.length, 1);
  const cl = await call('POST', '/inbox/claim', { token: b.token, body: { id: inboxB.body.items[0].id } });
  assert.equal(cl.status, 200);
  assert.ok(cl.body.reward.gold > 0);
  assert.equal((await call('POST', '/inbox/claim', { token: b.token, body: { id: inboxB.body.items[0].id } })).status, 409);
  const refs = await call('GET', '/referrals', { token: a.token });
  assert.equal(refs.body.invited, 1);
  assert.match(refs.body.link, /^https:\/\/t\.me\/ember_test_bot\/play\?startapp=ref_/);
  assert.equal(refs.body.friends[0].name, 'Мира');
  // Re-login of an existing user with someone's code does nothing; self-referral impossible.
  await loginTg(call, 1001, 'Горан', { startParam: 'ref_' + b.me.refCode });
  assert.equal((await call('GET', '/inbox', { token: a.token })).body.items.length, 0);
  assert.equal((await call('GET', '/inbox', { token: b.token })).body.items.length, 0, 'b claimed its gift; no new letters');
});
