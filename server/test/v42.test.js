// v42: daily reset at 05:00 МСК (with a one-time switch on 2026-11-16) and bot reminders by priority / quiet hours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg, mockTelegram, makeInitData } from './helpers.js';
import { runCron, quietUntil } from '../src/routes/bot.js';
import { dayKey, nextDayStart, dayStart, isoWeek, nextWeekStart, weekStart, switchAt } from '../src/lib/time.js';

const MSK = { DAY_OFFSET_MIN: '180' };
const iso = (t) => new Date(t).toISOString();

test('reset 05:00 МСК: day key, next/this day start, weeks', () => {
  // after the switch: 04:59 МСК still belongs to the previous day, 05:00 starts a new one
  assert.equal(dayKey(Date.parse('2026-12-02T04:59:00+03:00'), MSK), '2026-12-01');
  assert.equal(dayKey(Date.parse('2026-12-02T05:00:00+03:00'), MSK), '2026-12-02');
  assert.equal(dayKey(Date.parse('2026-12-02T00:30:00+03:00'), MSK), '2026-12-01'); // night player keeps the day
  assert.equal(iso(nextDayStart(Date.parse('2026-12-02T12:00:00+03:00'), MSK)), '2026-12-03T02:00:00.000Z');
  assert.equal(iso(dayStart(Date.parse('2026-12-02T12:00:00+03:00'), MSK)), '2026-12-02T02:00:00.000Z');
  // weeks: Monday 05:00 МСК
  assert.equal(isoWeek(Date.parse('2026-11-30T04:00:00+03:00'), MSK), '2026-W48'); // Mon 04:00 — still last week
  assert.equal(isoWeek(Date.parse('2026-11-30T05:00:00+03:00'), MSK), '2026-W49');
  assert.equal(iso(nextWeekStart(Date.parse('2026-12-02T12:00:00+03:00'), MSK)), '2026-12-07T02:00:00.000Z');
  assert.equal(iso(weekStart(Date.parse('2026-12-02T12:00:00+03:00'), MSK)), '2026-11-30T02:00:00.000Z');
});

test('reset switch: no backward step, the switch day lasts 29 h', () => {
  const T = switchAt(MSK);
  assert.equal(iso(T), '2026-11-16T02:00:00.000Z'); // Mon 16.11 05:00 МСК
  // before the switch — the old midnight rule
  assert.equal(dayKey(Date.parse('2026-11-15T23:59:00+03:00'), MSK), '2026-11-15');
  assert.equal(dayKey(Date.parse('2026-11-16T00:00:00+03:00'), MSK), '2026-11-16');
  assert.equal(dayKey(Date.parse('2026-11-16T04:59:00+03:00'), MSK), '2026-11-16');
  // after: same day until 17.11 05:00
  assert.equal(dayKey(T, MSK), '2026-11-16');
  assert.equal(dayKey(Date.parse('2026-11-17T04:59:00+03:00'), MSK), '2026-11-16');
  assert.equal(dayKey(Date.parse('2026-11-17T05:00:00+03:00'), MSK), '2026-11-17');
  // keys never go backwards minute by minute across 15.11–18.11
  let prev = '';
  for (let t = Date.parse('2026-11-15T00:00:00Z'); t < Date.parse('2026-11-18T00:00:00Z'); t += 60000) {
    const k = dayKey(t, MSK); assert.ok(k >= prev, 'monotonic at ' + iso(t)); prev = k;
  }
  // day boundaries around the switch
  assert.equal(iso(nextDayStart(Date.parse('2026-11-15T12:00:00+03:00'), MSK)), '2026-11-15T21:00:00.000Z');
  assert.equal(iso(nextDayStart(Date.parse('2026-11-16T01:00:00+03:00'), MSK)), '2026-11-17T02:00:00.000Z');
  assert.equal(iso(dayStart(Date.parse('2026-11-16T10:00:00+03:00'), MSK)), '2026-11-15T21:00:00.000Z');
  assert.equal(iso(dayStart(Date.parse('2026-11-16T01:00:00+03:00'), MSK)), '2026-11-15T21:00:00.000Z');
  // the week of the switch: started Mon 00:00, next one starts Mon 05:00
  assert.equal(isoWeek(Date.parse('2026-11-16T01:00:00+03:00'), MSK), '2026-W47');
  assert.equal(iso(weekStart(Date.parse('2026-11-18T12:00:00+03:00'), MSK)), '2026-11-15T21:00:00.000Z');
  assert.equal(iso(nextWeekStart(Date.parse('2026-11-16T01:00:00+03:00'), MSK)), '2026-11-23T02:00:00.000Z');
});

test('daily gift across the switch: no double claim, no lost day, streak continues', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-15T20:00:00+03:00') };
  const call = api(env, clock);
  const claim = async () => call('POST', '/daily/claim', { token: (await loginTg(call, 4201, 'Ночной')).token });
  assert.equal((await claim()).body.streak, 1); // 15.11
  clock.now = Date.parse('2026-11-16T00:30:00+03:00'); // new day under the old rule
  assert.equal((await claim()).body.streak, 2); // 16.11
  clock.now = Date.parse('2026-11-16T06:00:00+03:00'); // after the switch — still 16.11
  assert.equal((await claim()).status, 409);
  clock.now = Date.parse('2026-11-17T04:00:00+03:00'); // still 16.11 (29-hour day)
  assert.equal((await claim()).status, 409);
  clock.now = Date.parse('2026-11-17T05:01:00+03:00');
  const d = await claim();
  assert.equal(d.body.streak, 3); // 17.11, streak intact
  assert.equal(iso(d.body.resetsAt), '2026-11-18T02:00:00.000Z');
  // a stored day later than "today" (e.g. key moved back) counts as already claimed
  await env.DB.prepare("UPDATE daily SET last_day='2026-11-18' WHERE uid='t4201'").run();
  assert.equal((await claim()).status, 409);
});

test('seal and contracts across the switch day: one claim per game day', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-16T00:30:00+03:00') };
  const call = api(env, clock);
  const q = async (id) => call('POST', '/quests/claim', { token: (await loginTg(call, 4202, 'Контракт')).token, body: { questId: id } });
  assert.equal((await q('d_kill')).status, 200);
  clock.now = Date.parse('2026-11-16T07:00:00+03:00');
  assert.equal((await q('d_kill')).status, 409, 'same day after the switch');
  assert.equal((await q('d_chest')).status, 200);
  assert.equal((await q('d_stage')).status, 200);
  assert.equal((await q('d_elite')).status, 429, '3 contracts a day');
  clock.now = Date.parse('2026-11-17T05:10:00+03:00');
  assert.equal((await q('d_kill')).status, 200, 'next day');
});

test('quiet hours 23:00–09:00 МСК', () => {
  assert.equal(quietUntil(Date.parse('2026-12-02T12:00:00+03:00'), MSK), 0);
  assert.equal(quietUntil(Date.parse('2026-12-02T22:59:00+03:00'), MSK), 0);
  assert.equal(iso(quietUntil(Date.parse('2026-12-02T23:00:00+03:00'), MSK)), '2026-12-03T06:00:00.000Z');
  assert.equal(iso(quietUntil(Date.parse('2026-12-03T03:00:00+03:00'), MSK)), '2026-12-03T06:00:00.000Z');
  assert.equal(quietUntil(Date.parse('2026-12-03T09:00:00+03:00'), MSK), 0);
});

test('in-game opt-in: requestWriteAccess → notify + can_pm; new kinds accepted', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-12-02T12:00:00+03:00') };
  const call = api(env, clock);
  const initData = await makeInitData({ id: 4203, first_name: 'Тихий', allows_write_to_pm: false }, { authDate: Math.floor(clock.now / 1000) });
  const s = (await call('POST', '/auth/telegram', { body: { initData } })).body;
  assert.equal(s.me.canPm, false);
  const r = await call('POST', '/me/settings', { token: s.token, body: { notify: true, writeAccess: true } });
  assert.equal(r.body.notify, true);
  assert.equal(r.body.canPm, true);
  for (const kind of ['build_done', 'expedition_done', 'streak', 'comeback']) {
    assert.equal((await call('POST', '/notify/schedule', { token: s.token, body: { kind, inSec: 3600 } })).body.scheduled, true, kind);
  }
  assert.equal((await call('POST', '/notify/schedule', { token: s.token, body: { kind: 'raid', inSec: 3600 } })).status, 400, 'raid is server-only');
});

test('cron: quiet hours postpone, priority, ≤1 marketing, filler, streak and comeback rules', async () => {
  const env = makeEnv({ NOTIFY_MAX_PER_DAY: '3', NOTIFY_MIN_GAP_MIN: '60' });
  const clock = { now: Date.parse('2026-12-02T22:30:00+03:00') };
  const call = api(env, clock);
  const tg = mockTelegram({ sendMessage: () => ({ message_id: 1 }) });
  const sent = () => tg.calls.filter((x) => x.method === 'sendMessage').map((x) => x.params.text);
  try {
    const a = await loginTg(call, 4210, 'Игрок');
    await call('POST', '/me/settings', { token: a.token, body: { notify: true } });
    const sch = async (kind, inSec) => call('POST', '/notify/schedule', { token: (await loginTg(call, 4210, 'Игрок')).token, body: { kind, inSec } });
    // 1) due at 23:10 МСК → postponed to 09:00, then sent
    await sch('build_done', 40 * 60);
    clock.now = Date.parse('2026-12-02T23:15:00+03:00');
    let r = await runCron(env, clock.now);
    assert.deepEqual(r, { sent: 0, dropped: 0, postponed: 1 });
    const row = await env.DB.prepare("SELECT due_at FROM notifications WHERE uid='t4210' AND status='pending'").first();
    assert.equal(iso(row.due_at), '2026-12-03T06:00:00.000Z');
    clock.now = Date.parse('2026-12-03T09:01:00+03:00');
    r = await runCron(env, clock.now);
    assert.equal(r.sent, 1);
    assert.match(sent().at(-1), /Стройка/);
    // 2) priority: expedition (2) beats income (8) when both are due
    clock.now = Date.parse('2026-12-03T10:30:00+03:00');
    await sch('income', 60); await sch('expedition_done', 120);
    clock.now += 5 * 60000;
    r = await runCron(env, clock.now);
    assert.deepEqual([r.sent, r.dropped], [1, 1]);
    assert.match(sent().at(-1), /Спутники/);
    // 3) filler only on a silent day: income alone is dropped (two sent already)
    clock.now += 2 * 3600000;
    await sch('income', 60); clock.now += 2 * 60000;
    r = await runCron(env, clock.now);
    assert.deepEqual([r.sent, r.dropped], [0, 1]);
    // 4) streak: dropped if today's gift is taken
    await call('POST', '/daily/claim', { token: (await loginTg(call, 4210, 'Игрок')).token });
    await sch('streak', 60); clock.now += 2 * 60000;
    r = await runCron(env, clock.now);
    assert.deepEqual([r.sent, r.dropped], [0, 1]);
  } finally { tg.restore(); }
});

test('cron: comeback only while away, chain 2 → 5 → 14 days, ≤1 marketing a day', async () => {
  const env = makeEnv({ NOTIFY_MAX_PER_DAY: '3', NOTIFY_MIN_GAP_MIN: '60' });
  const clock = { now: Date.parse('2026-12-02T12:00:00+03:00') };
  const call = api(env, clock);
  const tg = mockTelegram({ sendMessage: () => ({ message_id: 1 }) });
  try {
    const a = await loginTg(call, 4220, 'Ушедший');
    await call('POST', '/me/settings', { token: a.token, body: { notify: true } });
    const seen0 = (await env.DB.prepare("SELECT last_seen FROM users WHERE id='t4220'").first()).last_seen;
    await call('POST', '/notify/schedule', { token: a.token, body: { kind: 'comeback', inSec: 2 * 86400 } });
    await env.DB.prepare("UPDATE users SET last_seen=? WHERE id='t4220'").bind(seen0).run();
    clock.now += 2 * 86400000 + 60000;
    let r = await runCron(env, clock.now);
    assert.equal(r.sent, 1);
    let next = await env.DB.prepare("SELECT due_at FROM notifications WHERE uid='t4220' AND kind='comeback' AND status='pending'").first();
    assert.equal(next.due_at, seen0 + 5 * 86400000);
    // a second marketing message the same day is dropped
    await env.DB.prepare("INSERT INTO notifications (uid, kind, due_at) VALUES ('t4220','event',?)").bind(clock.now + 2 * 3600000).run();
    clock.now += 2 * 3600000 + 60000;
    r = await runCron(env, clock.now);
    assert.deepEqual([r.sent, r.dropped], [0, 1]);
    // day 5 → sent, then day 14 queued
    clock.now = next.due_at + 60000;
    r = await runCron(env, clock.now);
    assert.equal(r.sent, 1);
    next = await env.DB.prepare("SELECT due_at FROM notifications WHERE uid='t4220' AND kind='comeback' AND status='pending'").first();
    assert.equal(next.due_at, seen0 + 14 * 86400000);
    // the player comes back → day-14 reminder is dropped
    await env.DB.prepare("UPDATE users SET last_seen=? WHERE id='t4220'").bind(next.due_at - 3600000).run();
    clock.now = next.due_at + 60000;
    r = await runCron(env, clock.now);
    assert.deepEqual([r.sent, r.dropped], [0, 1]);
  } finally { tg.restore(); }
});
