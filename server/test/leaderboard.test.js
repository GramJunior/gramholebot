import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoWeek, dayKey, nextWeekStart, nextDayStart, prevDayKey } from '../src/lib/time.js';
import { checkAbyssRun, maxStartFloor } from '../src/lib/anticheat.js';
import { makeEnv, api, loginTg } from './helpers.js';

const UTC = { DAY_OFFSET_MIN: '0' };
const MSK = { DAY_OFFSET_MIN: '180' };

test('ISO week edge cases', () => {
  const w = (s, env = UTC) => isoWeek(Date.parse(s), env);
  assert.equal(w('2026-11-03T12:00:00Z'), '2026-W45');
  assert.equal(w('2021-01-03T12:00:00Z'), '2020-W53'); // Sunday belongs to previous ISO year
  assert.equal(w('2021-01-04T00:00:00Z'), '2021-W01');
  assert.equal(w('2026-12-31T12:00:00Z'), '2026-W53'); // 2026 has 53 ISO weeks
  assert.equal(w('2027-01-01T12:00:00Z'), '2026-W53');
  assert.equal(w('2027-01-04T00:00:00Z'), '2027-W01');
  assert.equal(w('2024-12-30T00:00:00Z'), '2025-W01'); // Monday belongs to next ISO year
  // Offset: Sunday 22:00 UTC is already Monday 01:00 in Moscow.
  assert.equal(w('2026-11-08T22:00:00Z', UTC), '2026-W45');
  assert.equal(w('2026-11-08T22:00:00Z', MSK), '2026-W46');
  assert.equal(new Date(nextWeekStart(Date.parse('2026-11-04T10:00:00Z'), MSK)).toISOString(), '2026-11-08T21:00:00.000Z');
  assert.equal(new Date(nextWeekStart(Date.parse('2026-11-09T10:00:00Z'), UTC)).toISOString(), '2026-11-16T00:00:00.000Z');
});

test('day keys with offset', () => {
  assert.equal(dayKey(Date.parse('2026-11-03T20:59:59Z'), MSK), '2026-11-03');
  assert.equal(dayKey(Date.parse('2026-11-03T21:00:00Z'), MSK), '2026-11-04');
  assert.equal(new Date(nextDayStart(Date.parse('2026-11-03T12:00:00Z'), MSK)).toISOString(), '2026-11-03T21:00:00.000Z');
  assert.equal(prevDayKey('2026-03-01'), '2026-02-28');
});

test('abyss anti-cheat rules', () => {
  const base = { startFloor: 1, startedAt: 0, env: {} };
  assert.deepEqual(checkAbyssRun({ ...base, floor: 10, timeMs: 8 * 60000, now: 8 * 60000 }), { ok: true, cleared: 10 });
  assert.equal(checkAbyssRun({ ...base, floor: 30, timeMs: 5 * 60000, now: 5 * 60000 }).reason, 'too_fast'); // > 3 floors/min
  assert.equal(checkAbyssRun({ ...base, floor: 5, timeMs: 20000, now: 5 * 60000 }).reason, 'too_fast'); // 4 s per floor
  assert.equal(checkAbyssRun({ ...base, floor: 5, timeMs: 60 * 60000, now: 5 * 60000 }).reason, 'time_mismatch');
  assert.equal(checkAbyssRun({ ...base, floor: 5, timeMs: 1, now: 7 * 3600000 }).reason, 'expired');
  assert.deepEqual(checkAbyssRun({ ...base, floor: 0, timeMs: 1000, now: 1000 }), { ok: true, cleared: 0 });
  assert.equal(maxStartFloor(0), 1);
  assert.equal(maxStartFloor(21), 11);
});

async function run(call, token, clock, floor, minutes, startFloor = 1) {
  const s = await call('POST', '/abyss/start', { token, body: { startFloor } });
  assert.equal(s.status, 200, JSON.stringify(s.body));
  clock.now += minutes * 60000;
  return call('POST', '/abyss/finish', { token, body: { runId: s.body.runId, floor, timeMs: minutes * 60000 - 5000 } });
}

test('leaderboard: weekly rollover by ISO week, all-time keeps best, rank & ties by time', async () => {
  const env = makeEnv(MSK);
  const clock = { now: Date.parse('2026-11-08T20:00:00Z') }; // Sunday 23:00 MSK, week 45
  const call = api(env, clock);
  const a = await loginTg(call, 21, 'Ойка');
  const b = await loginTg(call, 22, 'Серый');

  const r1 = await run(call, a.token, clock, 12, 10);
  assert.equal(r1.status, 200);
  assert.equal(r1.body.newRecord, true);
  await run(call, b.token, clock, 12, 8); // same floor, faster -> ranks above
  let wk = await call('GET', '/lb/abyss?board=week', { token: a.token });
  assert.equal(wk.body.period, 'w:2026-W45');
  assert.deepEqual(wk.body.entries.map((e) => e.name), ['Серый', 'Ойка']);
  assert.deepEqual(wk.body.me, { rank: 2, floor: 12, timeMs: 10 * 60000 - 5000 });

  // Clock passes Monday 00:00 MSK -> new week, fresh board.
  clock.now = Date.parse('2026-11-08T21:30:00Z');
  wk = await call('GET', '/lb/abyss?board=week', { token: a.token });
  assert.equal(wk.body.period, 'w:2026-W46');
  assert.equal(wk.body.entries.length, 0);
  assert.equal(wk.body.me, null);
  await run(call, a.token, clock, 4, 3);
  wk = await call('GET', '/lb/abyss?board=week');
  assert.deepEqual(wk.body.entries.map((e) => [e.name, e.floor]), [['Ойка', 4]]);
  // All-time keeps the better (12) result, previous week remains queryable.
  const all = await call('GET', '/lb/abyss?board=all', { token: a.token });
  assert.equal(all.body.me.floor, 12);
  const prev = await call('GET', '/lb/abyss?board=week&week=2026-W45');
  assert.equal(prev.body.entries.length, 2);
});

test('leaderboard: friends filter, season board, run token single-use, start floor limit', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const admin = { authorization: 'Bearer ' + env.ADMIN_SECRET };
  await call('PUT', '/admin/config/season', { headers: admin, body: { id: 's1', name: 'Сезон 1', start: clock.now - 1000, end: clock.now + 30 * 86400000 } });
  const a = await loginTg(call, 31, 'A');
  const b = await loginTg(call, 32, 'B', { startParam: 'ref_' + a.me.refCode }); // friends via referral
  const c = await loginTg(call, 33, 'C');
  for (const [u, f] of [[a, 5], [b, 6], [c, 9]]) await run(call, u.token, clock, f, 5);

  const fr = await call('GET', '/lb/abyss?board=all&filter=friends', { token: a.token });
  assert.deepEqual(fr.body.entries.map((e) => e.name), ['B', 'A']);
  assert.equal((await call('GET', '/lb/abyss?board=all&filter=friends')).status, 401);
  const se = await call('GET', '/lb/abyss?board=season');
  assert.equal(se.body.period, 's:s1');
  assert.deepEqual(se.body.entries.map((e) => e.floor), [9, 6, 5]);

  // Same run token can't be submitted twice.
  const s = await call('POST', '/abyss/start', { token: c.token, body: {} });
  clock.now += 5 * 60000;
  const f1 = await call('POST', '/abyss/finish', { token: c.token, body: { runId: s.body.runId, floor: 3, timeMs: 200000 } });
  assert.equal(f1.status, 200);
  assert.equal((await call('POST', '/abyss/finish', { token: c.token, body: { runId: s.body.runId, floor: 3, timeMs: 200000 } })).status, 409);
  // Someone else's run id is not found.
  const s2 = await call('POST', '/abyss/start', { token: c.token, body: {} });
  assert.equal((await call('POST', '/abyss/finish', { token: a.token, body: { runId: s2.body.runId, floor: 1, timeMs: 1 } })).status, 404);
  // Too fast is rejected and audited; nothing recorded.
  const s3 = await call('POST', '/abyss/start', { token: a.token, body: {} });
  clock.now += 60000;
  const fast = await call('POST', '/abyss/finish', { token: a.token, body: { runId: s3.body.runId, floor: 50, timeMs: 59000 } });
  assert.equal(fast.status, 422);
  assert.equal(fast.body.reason, 'too_fast');
  // Start floor: best 9 -> may start from 5, not 6.
  assert.equal((await call('POST', '/abyss/start', { token: c.token, body: { startFloor: 5 } })).status, 200);
  assert.equal((await call('POST', '/abyss/start', { token: c.token, body: { startFloor: 6 } })).status, 400);
});
