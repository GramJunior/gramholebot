// Display name (POST /me/settings {name}), analytics (/events, /admin/metrics), daily total, 30-tier pass defaults.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg } from './helpers.js';
import { DEFAULTS } from '../src/lib/config.js';
import { eventName } from '../src/routes/metrics.js';

const ADM = { authorization: 'Bearer test-admin-secret-0123456789' };

test('display name: validation, shown on leaderboards/raids instead of the Telegram name, survives re-login, reset to null', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  let s = await loginTg(call, 501, 'Гость');
  for (const bad of ['a', 'x'.repeat(21), '<b>hi</b>', ' ', 'Гость', '_lead', 'ok😀']) {
    const r = await call('POST', '/me/settings', { token: s.token, body: { name: bad } });
    assert.equal(r.status, 400, 'rejects ' + JSON.stringify(bad));
    assert.equal(r.body.error, 'bad_name');
  }
  const ok = await call('POST', '/me/settings', { token: s.token, body: { name: '  Пепельный   Лис ' } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(ok.body.me.name, 'Пепельный Лис', 'spaces collapsed');
  assert.equal(ok.body.customName, true);
  // notify untouched by a name-only call, and a bad notify type is rejected
  assert.equal(ok.body.notify, false);
  assert.equal((await call('POST', '/me/settings', { token: s.token, body: { notify: 'yes' } })).status, 400);
  // Telegram login again must not overwrite the chosen name
  s = await loginTg(call, 501, 'Гость');
  assert.equal(s.me.name, 'Пепельный Лис');
  // Abyss leaderboard shows it
  const run = await call('POST', '/abyss/start', { token: s.token, body: { startFloor: 1 } });
  clock.now += 3 * 60000;
  await call('POST', '/abyss/finish', { token: s.token, body: { runId: run.body.runId, floor: 4, timeMs: 170000 } });
  const lb = await call('GET', '/lb/abyss?board=all');
  assert.equal(lb.body.entries[0].name, 'Пепельный Лис');
  // reset
  const back = await call('POST', '/me/settings', { token: s.token, body: { name: null } });
  assert.equal(back.body.me.name, 'Гость');
  assert.equal(back.body.customName, false);
  // forget-me clears it
  await call('POST', '/me/settings', { token: s.token, body: { name: 'Искра' } });
  assert.equal((await call('DELETE', '/me', { token: s.token })).status, 200);
  const row = await env.DB.prepare('SELECT display_name, first_name FROM users WHERE id=?').bind('t501').first();
  assert.deepEqual([row.display_name, row.first_name], [null, '']);
});

test('events: batching, validation, aggregated counters + unique users, quota, D1/D7 cohorts', async () => {
  assert.equal(eventName({ e: 'ftue', k: 'first_kill' }), 'ftue:first_kill');
  assert.equal(eventName({ e: 'stage_finish', k: '1-3' }), 'stage_finish:1-3');
  assert.equal(eventName({ e: 'Bad Name!' }), null);
  assert.equal(eventName({ e: 'x', k: { a: 1 } }), 'x:_object_object_', 'objects are flattened, never stored as payload');
  const env = makeEnv({ RATE_LIMIT: '0' });
  const day0 = Date.parse('2026-11-04T09:00:00Z');
  const clock = { now: day0 };
  const call = api(env, clock);
  const a = await loginTg(call, 601), b = await loginTg(call, 602);
  assert.equal((await call('POST', '/events', { body: { events: [{ e: 'x' }] } })).status, 401, 'needs a session');
  const tooMany = await call('POST', '/events', { token: a.token, body: { events: Array.from({ length: 51 }, () => ({ e: 'x' })) } });
  assert.equal(tooMany.status, 413);
  const r1 = await call('POST', '/events', { token: a.token, body: { events: [{ e: 'ftue', k: 'first_kill' }, { e: 'ftue', k: 'first_kill' }, { e: 'stage_start', k: '1-1' }, { e: '!!' }] } });
  assert.deepEqual([r1.status, r1.body.accepted, r1.body.rejected], [200, 3, 1]);
  await call('POST', '/events', { token: b.token, body: { events: [{ e: 'ftue', k: 'first_kill' }] } });
  const row = await env.DB.prepare("SELECT n, users FROM ev_counts WHERE name='ftue:first_kill'").first();
  assert.deepEqual([row.n, row.users], [3, 2], '3 events from 2 players');
  // no payload columns at all
  const cols = (await env.DB.prepare("SELECT name FROM pragma_table_info('ev_counts')").all()).results.map((c) => c.name);
  assert.deepEqual(cols.sort(), ['day', 'n', 'name', 'users', 'v'], 'v41: v is a summed number, still no payloads');
  // quota: a spammer stops being counted after 2000 events/day
  for (let i = 0; i < 41; i++) await call('POST', '/events', { token: b.token, body: { events: Array.from({ length: 50 }, () => ({ e: 'spam' })) } });
  const sp = await env.DB.prepare("SELECT n FROM ev_counts WHERE name='spam'").first();
  assert.ok(sp.n <= 2000, 'capped: ' + sp.n);
  // retention: a comes back on day 1 and day 7, b never
  clock.now = day0 + 86400000;
  await loginTg(call, 601);
  clock.now = day0 + 7 * 86400000;
  const a7 = await loginTg(call, 601);
  await call('POST', '/events', { token: a7.token, body: { events: [{ e: 'day_return', k: 'd7' }] } });
  assert.equal((await call('GET', '/admin/metrics')).status, 401);
  const m = await call('GET', '/admin/metrics?days=10', { headers: ADM });
  assert.equal(m.status, 200, JSON.stringify(m.body));
  const c0 = m.body.cohorts.find((c) => c.day === '2026-11-04');
  assert.deepEqual([c0.newPlayers, c0.d1, c0.d7, c0.d1Pct, c0.d7Pct], [2, 1, 1, 50, 50]);
  assert.ok(m.body.dau.some((d) => d.day === '2026-11-11' && d.n === 1));
  const f = await call('GET', '/admin/metrics?days=10&prefix=ftue', { headers: ADM });
  assert.ok(f.body.events.every((e) => e.name.startsWith('ftue')) && f.body.events.length === 1);
});

test('daily: total login days for the 28-day calendar; pass defaults have 50 tiers × 200 XP (+ «Огниво» 51–60 in v42), premium track is cosmetic-only', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  let s = await loginTg(call, 701);
  assert.equal((await call('GET', '/daily', { token: s.token })).body.total, 0);
  assert.equal((await call('POST', '/daily/claim', { token: s.token })).body.total, 1);
  clock.now += 86400000; s = await loginTg(call, 701);
  assert.equal((await call('POST', '/daily/claim', { token: s.token })).body.total, 2);
  assert.equal((await call('GET', '/daily', { token: s.token })).body.total, 2);
  const T = DEFAULTS.battlepass.tiers;
  assert.equal(T.length, 60); // v42: «Огниво» 51–60
  assert.equal(DEFAULTS.battlepass.xpPerTier, 200);
  assert.equal(DEFAULTS.battlepass.xp.daily, 60);
  for (const t of T) assert.ok(t.premium.cosmetic || (t.premium.sparks && Object.keys(t.premium).length === 1), 'premium tier ' + t.tier + ' must be cosmetic/sparks only');
  const cfg = await call('GET', '/config');
  assert.equal(cfg.body.battlepass.tiers.length, 60);
  assert.equal(cfg.body.battlepass.xpPerTier, 200);
});
