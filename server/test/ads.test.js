// v39.4: Adsgram rewarded ads — Reward URL (GET /ads/reward?userid=…), ad credits (POST /ads/claim), /config keys, limits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg } from './helpers.js';
import { rlGroup } from '../src/lib/ratelimit.js';
import { runCron } from '../src/routes/bot.js';

const ADM = { authorization: 'Bearer test-admin-secret-0123456789' };
const T0 = Date.parse('2026-11-10T10:00:00Z');

test('ads: /config exposes block ids + verify flag (defaults empty / off), admin can set them, bad values rejected', async () => {
  const env = makeEnv();
  const call = api(env, { now: T0 });
  let c = await call('GET', '/config');
  assert.equal(c.status, 200);
  assert.deepEqual([c.body.adsBlockRewarded, c.body.adsBlockInterstitial, c.body.adsVerify], ['', '', false]);
  const put = await call('PUT', '/admin/config/ads', { headers: ADM, raw: JSON.stringify({ blockRewarded: '12345', blockInterstitial: 'int-12346', verify: true, caps: { revive: 2, chest: 1 } }) });
  assert.equal(put.status, 200, JSON.stringify(put.body));
  c = await call('GET', '/config');
  assert.deepEqual([c.body.adsBlockRewarded, c.body.adsBlockInterstitial, c.body.adsVerify], ['12345', 'int-12346', true]);
  for (const bad of [{ blockRewarded: '<script>' }, { verify: 'yes' }, { caps: { revive: -1 } }, [1]]) {
    const r = await call('PUT', '/admin/config/ads', { headers: ADM, raw: JSON.stringify(bad) });
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
});

test('ads: reward URL stores a credit, claim spends it once; no credit → 409; expired credit is not usable', async () => {
  const env = makeEnv();
  const clock = { now: T0 };
  const call = api(env, clock);
  const { token } = await loginTg(call, 7001);
  const { token: other } = await loginTg(call, 7002);

  let r = await call('POST', '/ads/claim', { token, body: { place: 'revive' } });
  assert.equal(r.status, 409); assert.equal(r.body.error, 'no_credit');

  r = await call('GET', '/ads/reward?userid=7001');
  assert.equal(r.status, 200); assert.equal(r.body.ok, true);
  // a different player cannot spend it
  r = await call('POST', '/ads/claim', { token: other, body: { place: 'revive' } });
  assert.equal(r.status, 409);
  r = await call('POST', '/ads/claim', { token, body: { place: 'revive' } });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.place, 'revive');
  r = await call('POST', '/ads/claim', { token, body: { place: 'revive' } });
  assert.equal(r.status, 409, 'one credit = one reward');

  // expiry (default 15 min)
  await call('GET', '/ads/reward?userid=7001');
  clock.now += 16 * 60000;
  r = await call('POST', '/ads/claim', { token, body: { place: 'chest' } });
  assert.equal(r.status, 409); assert.equal(r.body.error, 'no_credit');

  // unknown user / bad input / auth
  r = await call('GET', '/ads/reward?userid=999999');
  assert.equal(r.status, 200, 'unknown user is not revealed');
  r = await call('GET', '/ads/reward?userid=abc');
  assert.equal(r.status, 400);
  r = await call('GET', '/ads/reward');
  assert.equal(r.status, 400);
  r = await call('POST', '/ads/claim', { body: { place: 'revive' } });
  assert.equal(r.status, 401);
  await call('GET', '/ads/reward?userid=7001');
  r = await call('POST', '/ads/claim', { token, body: { place: 'Bad Place!' } });
  assert.equal(r.status, 400);
});

test('ads: per-placement daily caps (config ads.caps) and open-credit cap', async () => {
  const env = makeEnv({ ADS_OPEN_MAX: '3' });
  const clock = { now: T0 };
  const call = api(env, clock);
  const { token } = await loginTg(call, 7101);
  for (let i = 0; i < 5; i++) await call('GET', '/ads/reward?userid=7101');
  const n = env.DB.db.prepare('SELECT COUNT(*) n FROM ad_credits').get().n;
  assert.equal(n, 3, 'at most ADS_OPEN_MAX live credits');
  // default caps: revive 2, chest 1
  assert.equal((await call('POST', '/ads/claim', { token, body: { place: 'chest' } })).status, 200);
  const r = await call('POST', '/ads/claim', { token, body: { place: 'chest' } });
  assert.equal(r.status, 409); assert.equal(r.body.error, 'limit');
  assert.equal((await call('POST', '/ads/claim', { token, body: { place: 'revive' } })).status, 200);
  assert.equal((await call('POST', '/ads/claim', { token, body: { place: 'revive' } })).status, 200);
  await call('GET', '/ads/reward?userid=7101');
  assert.equal((await call('POST', '/ads/claim', { token, body: { place: 'revive' } })).body.error, 'limit');
  // uncapped placement spends the remaining credit
  assert.equal((await call('POST', '/ads/claim', { token, body: { place: 'spin' } })).status, 200);
  // next game day: caps reset
  clock.now += 86400000;
  const { token: t2 } = await loginTg(call, 7101); // the session token expires in 6 h
  await call('GET', '/ads/reward?userid=7101');
  assert.equal((await call('POST', '/ads/claim', { token: t2, body: { place: 'chest' } })).status, 200);
});

test('ads: optional ADS_REWARD_KEY secret on the Reward URL', async () => {
  const env = makeEnv({ ADS_REWARD_KEY: 'k-test-0123456789' });
  const call = api(env, { now: T0 });
  const { token } = await loginTg(call, 7201);
  assert.equal((await call('GET', '/ads/reward?userid=7201')).status, 403);
  assert.equal((await call('GET', '/ads/reward?userid=7201&key=wrong')).status, 403);
  assert.equal((await call('GET', '/ads/reward?userid=7201&key=k-test-0123456789')).status, 200);
  assert.equal((await call('POST', '/ads/claim', { token, body: { place: 'revive' } })).status, 200);
});

test('ads: rate limited (reward URL per Telegram id, claim per player); cron removes old credits', async () => {
  assert.equal(rlGroup('GET', '/ads/reward'), 'adsreward');
  assert.equal(rlGroup('POST', '/ads/claim'), 'adsclaim');
  const env = makeEnv();
  const clock = { now: T0 };
  const call = api(env, clock);
  await loginTg(call, 7301);
  let last;
  for (let i = 0; i < 21; i++) last = await call('GET', '/ads/reward?userid=7301');
  assert.equal(last.status, 429);
  assert.ok(last.headers.get('retry-after'));
  assert.equal((await call('GET', '/ads/reward?userid=7302')).status, 200, 'another user id has its own bucket');
  clock.now += 4 * 86400000;
  await runCron(env, clock.now);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM ad_credits').get().n, 0);
});
