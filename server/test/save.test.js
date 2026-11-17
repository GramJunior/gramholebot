import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, checkSave } from '../src/lib/savecheck.js';
import { makeEnv, api, loginTg, gameSave } from './helpers.js';

test('save: first upload, version increments, GET returns it', async () => {
  const env = makeEnv();
  const clock = { now: 1_800_000_000_000 };
  const call = api(env, clock);
  const s = await loginTg(call, 10);
  const g0 = await call('GET', '/save', { token: s.token });
  assert.deepEqual([g0.body.version, g0.body.data], [0, null]);
  const p1 = await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: gameSave() } });
  assert.equal(p1.status, 200);
  assert.equal(p1.body.version, 1);
  assert.equal(p1.body.updatedAt, clock.now, 'updatedAt is server time');
  clock.now += 60000;
  const p2 = await call('PUT', '/save', { token: s.token, body: { baseVersion: 1, data: gameSave({ st: { kills: 120 } }) } });
  assert.equal(p2.body.version, 2);
  const g = await call('GET', '/save', { token: s.token });
  assert.equal(g.body.version, 2);
  assert.equal(g.body.data.st.kills, 120);
});

test('save conflict: stale baseVersion -> 409 with server copy; resolve by re-put on server version', async () => {
  const env = makeEnv();
  const clock = { now: 1_800_000_000_000 };
  const call = api(env, clock);
  const s = await loginTg(call, 11);
  await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: gameSave() } });
  // Device A writes v2.
  clock.now += 1000;
  await call('PUT', '/save', { token: s.token, body: { baseVersion: 1, data: gameSave({ st: { kills: 200 } }) } });
  // Device B still thinks v1.
  const c = await call('PUT', '/save', { token: s.token, body: { baseVersion: 1, data: gameSave({ st: { kills: 150 } }) } });
  assert.equal(c.status, 409);
  assert.equal(c.body.error, 'conflict');
  assert.equal(c.body.server.version, 2);
  assert.equal(c.body.server.data.st.kills, 200);
  // B chooses its local copy: counters went down vs server, so it needs overwrite:true.
  const noOw = await call('PUT', '/save', { token: s.token, body: { baseVersion: 2, data: gameSave({ st: { kills: 150 } }) } });
  assert.equal(noOw.status, 422);
  assert.ok(noOw.body.reasons.includes('counter_down:kills'));
  const ow = await call('PUT', '/save', { token: s.token, body: { baseVersion: 2, data: gameSave({ st: { kills: 150 } }), overwrite: true } });
  assert.equal(ow.status, 200);
  assert.equal(ow.body.version, 3);
  // Future baseVersion is also a conflict.
  assert.equal((await call('PUT', '/save', { token: s.token, body: { baseVersion: 9, data: gameSave() } })).status, 409);
});

test('save: size limit and format checks', async () => {
  const env = makeEnv({ MAX_SAVE_BYTES: '2000' });
  const call = api(env);
  const s = await loginTg(call, 12);
  const big = gameSave({ inv: Array.from({ length: 200 }, (_, i) => ({ id: i, base: 'sword1' })) });
  assert.equal((await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: big } })).status, 413);
  const bad = await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: gameSave({ v: 0, hero: { lvl: 99 }, res: { gold: -5 } }) } });
  assert.equal(bad.status, 422);
  assert.deepEqual(bad.body.reasons.sort(), ['bad_gold', 'bad_level', 'bad_version']);
  assert.equal((await call('PUT', '/save', { token: s.token, body: { baseVersion: 0 } })).status, 400);
  // newer game save formats (v2, v3, ...) are accepted
  assert.equal((await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: gameSave({ v: 3 }) } })).status, 200);
});

test('savecheck: soft flags for implausible gains (accepted, audited)', async () => {
  const prev = summarize(gameSave());
  const ok = checkSave(prev, summarize(gameSave({ res: { gold: 5000 } })), { elapsedMs: 3600000 });
  assert.deepEqual(ok, { hard: [], soft: [] });
  const sus = checkSave(prev, summarize(gameSave({ res: { gold: 10_000_000, shards: 99999 }, hero: { lvl: 30 } })), { elapsedMs: 60000 });
  assert.deepEqual(sus.hard, []);
  assert.deepEqual(sus.soft.sort(), ['gold_gain', 'level_jump', 'shards_gain']);
  const hard = checkSave(prev, summarize(gameSave({ created: 5, endless: { best: 1 } })), { elapsedMs: 0 });
  assert.ok(hard.hard.includes('created_changed'));
  assert.ok(hard.hard.includes('counter_down:best'));
  assert.ok(checkSave(null, summarize(gameSave({ endless: { best: 80 } })), { verifiedBest: 3 }).soft.includes('best_unverified'));

  const env = makeEnv();
  const clock = { now: 1_800_000_000_000 };
  const call = api(env, clock);
  const s = await loginTg(call, 13);
  await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: gameSave() } });
  clock.now += 1000;
  const r = await call('PUT', '/save', { token: s.token, body: { baseVersion: 1, data: gameSave({ res: { gold: 9e9 } }) } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.warnings, ['gold_gain']);
  const aud = await call('GET', '/admin/audit', { headers: { authorization: 'Bearer ' + env.ADMIN_SECRET } });
  assert.equal(aud.body.recent[0].kind, 'save_suspicious');
});
