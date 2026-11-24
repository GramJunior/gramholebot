// v39: rate limiting (429 on /auth, PUT /save, /events, /pay/invoice, /admin/*), client error reports, initData max age.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg, gameSave, makeInitData } from './helpers.js';
import { rlGroup, memTake, RL_RULES } from '../src/lib/ratelimit.js';

const ADM = { authorization: 'Bearer test-admin-secret-0123456789' };

test('rate limit: route groups and token bucket refill', () => {
  assert.equal(rlGroup('POST', '/auth/telegram'), 'auth');
  assert.equal(rlGroup('POST', '/auth/guest'), 'auth');
  assert.equal(rlGroup('PUT', '/save'), 'save');
  assert.equal(rlGroup('GET', '/save'), null, 'reading the save is not limited');
  assert.equal(rlGroup('POST', '/events'), 'events');
  assert.equal(rlGroup('POST', '/pay/invoice'), 'pay');
  assert.equal(rlGroup('GET', '/admin/metrics'), 'admin');
  assert.equal(rlGroup('GET', '/config'), null);
  const env = {};
  let t = 1000;
  for (let i = 0; i < 3; i++) assert.ok(memTake(env, 'k', 3, 60, t).ok);
  const r = memTake(env, 'k', 3, 60, t);
  assert.equal(r.ok, false); assert.ok(r.retry >= 1 && r.retry <= 20, 'retry ' + r.retry);
  t += 20000; // 3 per 60 s → one token back after 20 s
  assert.ok(memTake(env, 'k', 3, 60, t).ok);
  assert.equal(memTake(env, 'k', 3, 60, t).ok, false);
});

test('rate limit: /auth per IP → 429 with retry-after; another IP is not affected; RATE_LIMIT=0 disables', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const ip = (a) => ({ headers: { 'cf-connecting-ip': a } });
  const lim = RL_RULES.auth.limit;
  for (let i = 0; i < lim; i++) {
    const r = await call('POST', '/auth/guest', { body: { deviceId: 'dev-' + i + '-abcdefghijkl' }, ...ip('1.1.1.1') });
    assert.notEqual(r.status, 429, 'request ' + i);
  }
  const over = await call('POST', '/auth/guest', { body: { deviceId: 'dev-x-abcdefghijkl' }, ...ip('1.1.1.1') });
  assert.equal(over.status, 429);
  assert.equal(over.body.error, 'rate_limited');
  assert.ok(Number(over.headers.get('retry-after')) >= 1);
  const other = await call('POST', '/auth/guest', { body: { deviceId: 'dev-y-abcdefghijkl' }, ...ip('2.2.2.2') });
  assert.notEqual(other.status, 429);
  clock.now += 61000; // window passed
  assert.notEqual((await call('POST', '/auth/guest', { body: { deviceId: 'dev-z-abcdefghijkl' }, ...ip('1.1.1.1') })).status, 429);
  const off = api(makeEnv({ RATE_LIMIT: '0' }), clock);
  for (let i = 0; i < lim + 5; i++) assert.notEqual((await off('POST', '/auth/guest', { body: { deviceId: 'dev-' + i + '-abcdefghijkl' } })).status, 429);
});

test('rate limit: PUT /save and /events are per player; /admin per IP; Workers binding is used when present', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const a = await loginTg(call, 701), b = await loginTg(call, 702);
  let ver = 0, got429 = false;
  for (let i = 0; i < RL_RULES.save.limit + 3; i++) {
    const r = await call('PUT', '/save', { token: a.token, body: { baseVersion: ver, data: gameSave({ st: { kills: 100 + i } }) } });
    if (r.status === 429) { got429 = true; break; }
    assert.equal(r.status, 200, JSON.stringify(r.body)); ver = r.body.version;
  }
  assert.ok(got429, 'save flood is limited');
  assert.equal((await call('PUT', '/save', { token: b.token, body: { baseVersion: 0, data: gameSave() } })).status, 200, 'other player unaffected');
  assert.equal((await call('GET', '/save', { token: a.token })).status, 200, 'GET /save not limited');
  for (let i = 0; i < RL_RULES.events.limit; i++) assert.equal((await call('POST', '/events', { token: a.token, body: { events: [{ e: 'x' }] } })).status, 200);
  assert.equal((await call('POST', '/events', { token: a.token, body: { events: [{ e: 'x' }] } })).status, 429);
  for (let i = 0; i < RL_RULES.admin.limit; i++) assert.equal((await call('GET', '/admin/stats', { headers: { ...ADM, 'cf-connecting-ip': '9.9.9.9' } })).status, 200);
  assert.equal((await call('GET', '/admin/stats', { headers: { ...ADM, 'cf-connecting-ip': '9.9.9.9' } })).status, 429);
  // binding (Workers Rate Limiting API) takes precedence over the in-memory fallback
  const keys = [];
  const env2 = makeEnv({ RL_EVENTS: { limit: async ({ key }) => { keys.push(key); return { success: keys.length <= 2 }; } } });
  const call2 = api(env2, clock);
  const c = await loginTg(call2, 703);
  assert.equal((await call2('POST', '/events', { token: c.token, body: { events: [{ e: 'x' }] } })).status, 200);
  assert.equal((await call2('POST', '/events', { token: c.token, body: { events: [{ e: 'x' }] } })).status, 200);
  assert.equal((await call2('POST', '/events', { token: c.token, body: { events: [{ e: 'x' }] } })).status, 429);
  assert.ok(keys.every((k) => k.startsWith('events|u:')), 'keyed by player: ' + keys[0]);
  // a broken binding never blocks players
  const env3 = makeEnv({ RL_EVENTS: { limit: async () => { throw new Error('down'); } } });
  const call3 = api(env3, clock); const d = await loginTg(call3, 704);
  assert.equal((await call3('POST', '/events', { token: d.token, body: { events: [{ e: 'x' }] } })).status, 200);
});

test('errors: client crash reports are aggregated per signature, capped, and listed for admins', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const a = await loginTg(call, 801), b = await loginTg(call, 802);
  const er = (sig, m) => ({ e: 'error', k: sig, d: { m, s: 'at computeStats (index.html:1:2)\n' + 'x'.repeat(900), v: 'v39', md: 'village' } });
  const r = await call('POST', '/events', { token: a.token, body: { events: [er('a1b2c3', 'TypeError: boom'), er('a1b2c3', 'TypeError: boom'), er('zz9', 'Other'), { e: 'stage_start', k: '1-1' }] } });
  assert.deepEqual([r.status, r.body.accepted], [200, 4]);
  await call('POST', '/events', { token: b.token, body: { events: [er('a1b2c3', 'TypeError: boom')] } });
  const row = await env.DB.prepare("SELECT * FROM err_reports WHERE sig='a1b2c3'").first();
  assert.deepEqual([row.n, row.users, row.msg, row.ver, row.mode], [3, 2, 'TypeError: boom', 'v39', 'village']);
  assert.ok(row.stack.length <= 300 && row.stack.startsWith('at computeStats'));
  const cnt = await env.DB.prepare("SELECT n, users FROM ev_counts WHERE name='error:a1b2c3'").first();
  assert.deepEqual([cnt.n, cnt.users], [3, 2], 'also counted like any event');
  // details only for `error`, a non-error event with d is a plain counter
  await call('POST', '/events', { token: a.token, body: { events: [{ e: 'stage_start', k: '1-2', d: { m: 'nope' } }] } });
  assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM err_reports').first()).n, 2);
  // at most 5 detailed signatures per batch
  await call('POST', '/events', { token: a.token, body: { events: Array.from({ length: 9 }, (_, i) => er('s' + i, 'm' + i)) } });
  assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM err_reports').first()).n, 7);
  assert.equal((await call('GET', '/admin/errors')).status, 401);
  const L = await call('GET', '/admin/errors?days=3', { headers: ADM });
  assert.equal(L.status, 200);
  assert.equal(L.body.errors[0].sig, 'a1b2c3');
  const m = await call('GET', '/admin/metrics?days=3', { headers: ADM });
  assert.ok(Array.isArray(m.body.errors) && m.body.errors.length >= 1);
});

test('auth: initData older than 1 hour is rejected by default', async () => {
  const env = makeEnv();
  const now = Date.parse('2026-11-04T10:00:00Z');
  const call = api(env, { now });
  const user = { id: 901, first_name: 'Старый' };
  const old = await makeInitData(user, { authDate: Math.floor(now / 1000) - 2 * 3600 });
  const r = await call('POST', '/auth/telegram', { body: { initData: old } });
  assert.equal(r.status, 401, JSON.stringify(r.body));
  const fresh = await makeInitData(user, { authDate: Math.floor(now / 1000) - 600 });
  assert.equal((await call('POST', '/auth/telegram', { body: { initData: fresh } })).status, 200);
});
