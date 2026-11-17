// v41 analytics: migration 0007, /events with client timestamps, milestones, sessions, opt-out, start_param sources,
// referral reward on the friend's 1-5 win, retention cron, GET /admin/stats (auth + shape).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeEnv, api, loginTg, gameSave } from './helpers.js';
import { parseStart } from '../src/lib/common.js';
import { eventTime, T_PAST_MS, MS_MAX } from '../src/routes/metrics.js';
import { runCron, retentionCutoffs } from '../src/routes/bot.js';

const ADM = { authorization: 'Bearer test-admin-secret-0123456789' };
const DAY = 86400000;
const T0 = Date.parse('2026-11-10T09:00:00Z'); // 12:00 MSK
const ev = (call, s, body) => call('POST', '/events', { token: s.token, body });

test('migration 0007: new columns/tables/indexes; pre-v41 referrals become legacy, day0 is backfilled', () => {
  const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
  const files = readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  const db = new DatabaseSync(':memory:');
  for (const f of files.filter((f) => f < '0007')) db.exec(readFileSync(dir + f, 'utf8'));
  db.exec("INSERT INTO users (id, first_name, ref_code, created_at, last_seen) VALUES ('ta','A','aaaa1111',1,1),('tb','B','bbbb2222',1,1)");
  db.exec("UPDATE users SET referred_by='ta' WHERE id='tb'");
  db.exec("INSERT INTO active_days (uid, day) VALUES ('tb','2026-10-02'),('tb','2026-10-01'),('ta','2026-10-05')");
  db.exec(readFileSync(dir + '0007_analytics.sql', 'utf8'));
  const cols = (t) => db.prepare(`SELECT name FROM pragma_table_info('${t}')`).all().map((r) => r.name);
  for (const c of ['src', 'ver0', 'day0', 'ref_state', 'stats_off']) assert.ok(cols('users').includes(c), 'users.' + c);
  for (const c of ['sess', 'sec']) assert.ok(cols('active_days').includes(c));
  assert.ok(cols('ev_counts').includes('v'));
  assert.deepEqual(cols('milestones').sort(), ['m', 'ts', 'uid']);
  assert.deepEqual(cols('ads_daily').sort(), ['claimed', 'day', 'place', 'rewarded']);
  const idx = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map((r) => r.name);
  for (const i of ['milestones_m', 'milestones_ts', 'users_day0', 'users_referred', 'payments_paid']) assert.ok(idx.includes(i), i);
  assert.deepEqual(db.prepare("SELECT id, ref_state, day0 FROM users ORDER BY id").all().map((r) => ({ ...r })), [
    { id: 'ta', ref_state: null, day0: '2026-10-05' }, { id: 'tb', ref_state: 'legacy', day0: '2026-10-01' }]);
});

test('start_param: src_* / ref_* / ref_*__src_* are parsed; first-touch source is stored once', async () => {
  assert.deepEqual(parseStart('src_tgads_1'), { ref: null, src: 'tgads_1' });
  assert.deepEqual(parseStart('src_Chan_XYZ'), { ref: null, src: 'chan_xyz' });
  assert.deepEqual(parseStart('ref_abcd2345'), { ref: 'abcd2345', src: null });
  assert.deepEqual(parseStart('ref_abcd2345__src_share_raid'), { ref: 'abcd2345', src: 'share_raid' });
  for (const bad of ['', 'src_', 'src_a-b', 'hello', 'ref_ab', 'ref_abcd2345src_x', 'src_' + 'x'.repeat(33)]) assert.deepEqual(parseStart(bad), { ref: null, src: null }, bad);
  const env = makeEnv();
  const call = api(env, { now: T0 });
  const a = await loginTg(call, 2001, 'A', { startParam: 'src_tgads_1' });
  await loginTg(call, 2001, 'A', { startParam: 'src_other' }); // later visits never overwrite
  const b = await loginTg(call, 2002, 'B', { startParam: 'ref_' + a.me.refCode });
  const c = await loginTg(call, 2003, 'C', { startParam: 'ref_' + a.me.refCode + '__src_share_abyss' });
  await loginTg(call, 2004, 'D');
  const g = await call('POST', '/auth/guest', { body: { deviceId: 'guest-device-0123456789', startParam: 'src_vk_post' } });
  assert.equal(g.status, 200);
  const rows = (await env.DB.prepare('SELECT id, src, referred_by, ref_state, day0 FROM users ORDER BY id').all()).results;
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(by.t2001.src, 'tgads_1');
  assert.deepEqual([by.t2002.src, by.t2002.referred_by, by.t2002.ref_state], ['ref', 't2001', 'pending']);
  assert.deepEqual([by.t2003.src, by.t2003.referred_by], ['share_abyss', 't2001']);
  assert.equal(by.t2004.src, null);
  assert.equal(rows.find((r) => r.id.startsWith('g')).src, 'vk_post');
  assert.ok(rows.every((r) => r.day0 === '2026-11-10'), 'cohort day set at first login');
  assert.ok(b.me && c.me);
});

test('events: client timestamps (skew-corrected, clamped), values, milestones, sessions; old clients still work', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: T0 };
  const call = api(env, clock);
  await loginTg(call, 2101);
  clock.now = T0 + 2 * DAY; // two days later: the phone was offline, clock 1 hour slow
  const s = await loginTg(call, 2101);
  const slow = clock.now - 3600000;
  const r = await ev(call, s, {
    now: slow, sess: 2, sec: 999999, st: slow, ver: 'v41',
    events: [
      { e: 'stage_start', k: '1-2', t: slow - DAY }, // yesterday (offline) -> lands in yesterday
      { e: 'stage_fail', k: '1-2', t: slow - DAY + 60000, v: 95 },
      { e: 'stage_fail', k: '1-2', t: slow - DAY + 120000, v: 40.7 },
      { e: 'eco_in', k: 'gold.stage', v: 1e9 }, // clamped to 10^7
      { e: 'old', k: 'x', t: slow - 10 * DAY }, // outside 72 h -> today
      { e: 'future', t: clock.now + 3600000 }, // too far ahead -> today
      { e: 'ftue', k: 'stage11', t: slow - 600000 }, // auto milestone (old clients) with its time
      { e: 'first_fail', k: '1-2', o: 1, t: slow - DAY + 60000 },
      { e: 'boot', k: 'ready', v: 2300 },
    ],
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.accepted, r.body.rejected, r.body.milestones], [9, 0, 2]);
  const yesterday = '2026-11-11', today = '2026-11-12';
  const row = async (day, name) => env.DB.prepare('SELECT n, users, v FROM ev_counts WHERE day=? AND name=?').bind(day, name).first();
  assert.deepEqual({ ...(await row(yesterday, 'stage_start:1-2')) }, { n: 1, users: 1, v: 0 });
  assert.deepEqual({ ...(await row(yesterday, 'stage_fail:1-2')) }, { n: 2, users: 1, v: 135 });
  assert.equal((await row(today, 'eco_in:gold.stage')).v, 1e7);
  assert.ok(await row(today, 'old:x'));
  assert.ok(await row(today, 'future'));
  const ad = (await env.DB.prepare('SELECT day, ev, sess, sec FROM active_days WHERE uid=? ORDER BY day').bind('t2101').all()).results.map((x) => ({ ...x }));
  assert.deepEqual(ad, [{ day: '2026-11-10', ev: 0, sess: 0, sec: 0 }, { day: yesterday, ev: 4, sess: 0, sec: 0 }, { day: today, ev: 5, sess: 2, sec: 4 * 3600 }]);
  const ms = (await env.DB.prepare('SELECT m, ts FROM milestones WHERE uid=? ORDER BY m').bind('t2101').all()).results;
  assert.deepEqual(ms.map((m) => m.m), ['first_fail:1-2', 'ftue:stage11']);
  assert.equal(ms[1].ts, clock.now - 600000, 'client time + skew correction');
  assert.equal((await env.DB.prepare("SELECT ver0 FROM users WHERE id='t2101'").first()).ver0, 'v41');
  // the same milestone again is ignored; the per-player cap holds
  await ev(call, s, { events: [{ e: 'ftue', k: 'stage11' }] });
  assert.equal((await env.DB.prepare("SELECT ts FROM milestones WHERE uid='t2101' AND m='ftue:stage11'").first()).ts, clock.now - 600000);
  for (let i = 0; i < 2; i++) await ev(call, s, { events: Array.from({ length: 40 }, (_, j) => ({ e: 'm' + i, k: 'k' + j, o: 1 })) });
  assert.equal((await env.DB.prepare("SELECT COUNT(*) n FROM milestones WHERE uid='t2101'").first()).n, MS_MAX);
  // day sec cap (20 h) and old-style batch without any new fields
  for (let i = 0; i < 6; i++) await ev(call, s, { sec: 4 * 3600, events: [] });
  assert.equal((await env.DB.prepare('SELECT sec FROM active_days WHERE uid=? AND day=?').bind('t2101', today).first()).sec, 20 * 3600);
  const old = await ev(call, s, { events: [{ e: 'stage_start', k: '1-3' }] });
  assert.deepEqual([old.status, old.body.accepted], [200, 1]);
  // eventTime unit: never before the profile was created
  assert.equal(eventTime(T0 - 1000, 0, T0 + 1000, T0), T0 + 1000);
  assert.equal(eventTime(T0 + 500, 0, T0 + 1000, T0), T0 + 500);
  assert.equal(eventTime(undefined, 0, T0, 0), T0);
  assert.equal(eventTime(T0 - T_PAST_MS - 1, 0, T0, 0), T0);
});

test('events: «Отправлять статистику» off (na:1) — only error reports count, flag is remembered, na:0 resumes', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const call = api(env, { now: T0 });
  const s = await loginTg(call, 2201);
  const r = await ev(call, s, { na: 1, sess: 1, sec: 60, events: [{ e: 'stage_start', k: '1-1' }, { e: 'ftue', k: 'wake', o: 1 }, { e: 'error', k: 'abc', d: { m: 'boom' } }] });
  assert.deepEqual([r.body.accepted, r.body.skipped, r.body.statsOff], [1, 2, true]);
  assert.equal((await env.DB.prepare("SELECT stats_off FROM users WHERE id='t2201'").first()).stats_off, 1);
  assert.equal(await env.DB.prepare("SELECT 1 FROM ev_counts WHERE name='stage_start:1-1'").first(), null);
  assert.ok(await env.DB.prepare("SELECT 1 FROM ev_counts WHERE name='error:abc'").first());
  assert.equal((await env.DB.prepare("SELECT COUNT(*) n FROM milestones WHERE uid='t2201'").first()).n, 0);
  assert.deepEqual({ ...(await env.DB.prepare("SELECT sess, sec FROM active_days WHERE uid='t2201'").first()) }, { sess: 0, sec: 0 });
  // an old client (no na) of an opted-out player is not counted either
  assert.equal((await ev(call, s, { events: [{ e: 'x' }] })).body.skipped, 1);
  assert.equal((await call('GET', '/me', { token: s.token })).body.me.statsOff, true);
  const on = await ev(call, s, { na: 0, events: [{ e: 'x' }] });
  assert.deepEqual([on.body.accepted, on.body.statsOff], [1, false]);
  // also via settings
  const st = await call('POST', '/me/settings', { token: s.token, body: { stats: false } });
  assert.equal(st.body.statsOff, true);
  assert.equal((await call('POST', '/me/settings', { token: s.token, body: { stats: 'no' } })).status, 400);
});

test('referral v41: the inviter is rewarded only when the friend beats 1-5 (milestone or save), once, capped; legacy not paid twice', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: T0 };
  const call = api(env, clock);
  const a = await loginTg(call, 2301, 'Горан');
  const b = await loginTg(call, 2302, 'Мира', { startParam: 'ref_' + a.me.refCode });
  const inbox = async (s) => (await call('GET', '/inbox', { token: s.token })).body.items;
  assert.equal((await inbox(a)).length, 0);
  assert.equal((await inbox(b)).length, 1, 'friend gift at once');
  let refs = (await call('GET', '/referrals', { token: a.token })).body;
  assert.deepEqual([refs.invited, refs.pending, refs.activated], [1, 1, 0]);
  // too fast (bot farm): beating 1-5 within 10 minutes of registering does not pay
  await ev(call, b, { events: [{ e: 'ftue', k: 'boss', o: 1 }] });
  assert.equal((await inbox(a)).length, 0);
  // the milestone exists now; a later save with 1-5 done activates
  clock.now = T0 + 15 * 60000;
  const b2 = await loginTg(call, 2302, 'Мира');
  const put = await call('PUT', '/save', { token: b2.token, body: { baseVersion: 0, data: gameSave({ prog: { stages: { '1-1': { stars: 3 }, '1-5': { stars: 1 } } } }) } });
  assert.equal(put.status, 200, JSON.stringify(put.body));
  let la = await inbox(a);
  assert.equal(la.length, 1);
  assert.equal(la[0].kind, 'referrer');
  assert.match(la[0].title, /1-5/);
  assert.ok(la[0].reward.gold > 0);
  // repeated signals do not pay again
  await ev(call, b2, { events: [{ e: 'ftue', k: 'boss' }] });
  await call('PUT', '/save', { token: b2.token, body: { baseVersion: 1, data: gameSave({ prog: { stages: { '1-5': { stars: 2 } } } }) } });
  assert.equal((await inbox(a)).length, 1);
  refs = (await call('GET', '/referrals', { token: a.token })).body;
  assert.deepEqual([refs.invited, refs.pending, refs.activated], [1, 0, 1]);
  assert.ok(await env.DB.prepare("SELECT 1 FROM milestones WHERE uid='t2302' AND m='ref:activated'").first());
  assert.ok(await env.DB.prepare("SELECT 1 FROM milestones WHERE uid='t2301' AND m='ref:joined'").first());
  // activation via /events milestone path
  const c = await loginTg(call, 2303, 'Ива', { startParam: 'ref_' + a.me.refCode });
  clock.now += 11 * 60000;
  const c2 = await loginTg(call, 2303, 'Ива');
  await ev(call, c2, { events: [{ e: 'ftue', k: 'boss', o: 1 }] });
  assert.equal((await inbox(a)).length, 2);
  assert.ok(c);
  // cap: referral.maxRewarded letters per inviter
  await env.DB.prepare("INSERT INTO config (key, value, updated_at) VALUES ('referral', ?, 0)").bind(JSON.stringify({ referrer: { gold: 500, ess: 25 }, referee: { gold: 300, ess: 15 }, maxRewarded: 2 })).run();
  const d = await loginTg(call, 2304, 'Дан', { startParam: 'ref_' + a.me.refCode });
  clock.now += 11 * 60000;
  await ev(call, await loginTg(call, 2304, 'Дан'), { events: [{ e: 'ftue', k: 'boss', o: 1 }] });
  assert.equal((await inbox(a)).length, 2, 'cap reached');
  assert.equal((await env.DB.prepare("SELECT ref_state FROM users WHERE id='t2304'").first()).ref_state, 'done');
  assert.ok(d);
  // legacy referral (rewarded at registration before v41) is never paid again
  await env.DB.prepare("UPDATE users SET ref_state='legacy' WHERE id='t2304'").run();
  const e = await loginTg(call, 2305, 'Ель');
  await env.DB.prepare("UPDATE users SET referred_by='t2305', ref_state='legacy' WHERE id='t2301'").run();
  await ev(call, await loginTg(call, 2301, 'Горан'), { events: [{ e: 'ftue', k: 'boss', o: 1 }] });
  assert.equal((await inbox(e)).length, 0);
});

test('cron retention: active_days and milestones 13 months, aggregates 25 months', async () => {
  const env = makeEnv();
  const now = Date.parse('2026-11-12T10:00:00Z');
  const r = retentionCutoffs(now);
  assert.deepEqual([r.day13, r.day25], ['2025-10-12', '2024-10-12']);
  const DB = env.DB;
  await DB.exec(`INSERT INTO active_days (uid, day) VALUES ('u','2025-10-11'),('u','2025-10-12');
    INSERT INTO milestones (uid, m, ts) VALUES ('u','old',${r.ms13 - 1}),('u','new',${r.ms13});
    INSERT INTO ev_counts (day, name, n, users) VALUES ('2024-10-11','x',1,1),('2024-10-12','x',1,1);
    INSERT INTO ads_daily (day, place, rewarded) VALUES ('2024-10-11','any',1),('2025-01-01','any',1);`);
  await runCron(env, now);
  assert.deepEqual((await DB.prepare('SELECT day FROM active_days').all()).results.map((x) => x.day), ['2025-10-12']);
  assert.deepEqual((await DB.prepare('SELECT m FROM milestones').all()).results.map((x) => x.m), ['new']);
  assert.deepEqual((await DB.prepare('SELECT day FROM ev_counts').all()).results.map((x) => x.day), ['2024-10-12']);
  assert.deepEqual((await DB.prepare('SELECT day FROM ads_daily').all()).results.map((x) => x.day), ['2025-01-01']);
});

test('GET /admin/stats: admin only; DAU/WAU/MAU, sources, cohorts, funnel, stage fails, sessions, ads, Stars, referrals', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: T0 };
  const call = api(env, clock);
  assert.equal((await call('GET', '/admin/stats')).status, 401);
  assert.equal((await call('GET', '/admin/stats', { headers: { authorization: 'Bearer nope' } })).status, 401);
  const a = await loginTg(call, 2401, 'A', { startParam: 'src_tgads_1' });
  const b = await loginTg(call, 2402, 'B', { startParam: 'ref_' + a.me.refCode });
  await ev(call, a, {
    sess: 1, sec: 300, events: [
      { e: 'ftue', k: 'prologue_start', o: 1 }, { e: 'ftue', k: 'prologue_end', o: 1 }, { e: 'ftue', k: 'yard_skip_s2', o: 1 }, { e: 'ftue', k: 'wake', o: 1 },
      { e: 'stage_start', k: '1-1' }, { e: 'stage_start', k: '1-1' }, { e: 'stage_fail', k: '1-1', v: 50 }, { e: 'stage_fc', k: '1-1.death' }, { e: 'stage_finish', k: '1-1' },
      { e: 'ftue', k: 's11_start', o: 1 }, { e: 'ftue', k: 'stage11', o: 1 },
      { e: 'ad_offer', k: 'revive' }, { e: 'ad_start', k: 'revive' }, { e: 'ad_start', k: 'revive' }, { e: 'ad_start', k: 'revive' },
      { e: 'ad_done', k: 'revive' }, { e: 'ad_fail', k: 'revive.nofill' }, { e: 'ad_fail', k: 'revive.skip' }, { e: 'ad_start', k: 'il_village' }, { e: 'ad_fail', k: 'sdk' },
      { e: 'offer_view', k: 'pack_start' }, { e: 'purchase_intent', k: 'pack_start' }, { e: 'sess_len', k: '3_10m', v: 300 },
      { e: 'eco_in', k: 'gold.stage', v: 1200 }, { e: 'eco_out', k: 'gold.build', v: 800 },
    ],
  });
  await ev(call, b, { sess: 1, sec: 100, events: [{ e: 'ftue', k: 'prologue_start', o: 1 }, { e: 'stage_start', k: '1-1' }, { e: 'stage_fail', k: '1-1', v: 30 }, { e: 'stage_fc', k: '1-1.death' }] });
  await env.DB.prepare("INSERT INTO payments (charge_id, uid, product_id, stars, payload, created_at) VALUES ('c1','t2401','pack_start',29,'p1',?),('c2','t2401','bp_s1',250,'p2',?)").bind(T0, T0).run();
  await call('GET', '/ads/reward?userid=2401');
  clock.now = T0 + DAY; // a returns on day 2
  await loginTg(call, 2401, 'A');
  const r = await call('GET', '/admin/stats?days=7', { headers: ADM });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const s = r.body;
  for (const k of ['users', 'active24h', 'saves', 'clans', 'payments', 'stars']) assert.equal(typeof s[k], 'number', k);
  assert.deepEqual([s.users, s.payments, s.stars], [2, 2, 279]);
  assert.deepEqual([s.tiles.dau, s.tiles.wau, s.tiles.mau], [1, 2, 2]);
  assert.deepEqual(s.dau.map((d) => [d.day, d.n]), [['2026-11-10', 2], ['2026-11-11', 1]]);
  assert.deepEqual(s.newBySource.map((x) => [x.src, x.n, x.d1Pct]).sort(), [['ref', 1, 0], ['tgads_1', 1, 100]]);
  const c0 = s.cohorts.find((x) => x.day === '2026-11-10');
  assert.deepEqual([c0.n, c0.d1, c0.d1Pct, c0.d7, c0.d30], [2, 1, 50, null, null]);
  const f = Object.fromEntries(s.funnel.map((x) => [x.id, x.users]));
  assert.deepEqual([f.open, f.prologue_start, f.prologue_end, f.yard, f.village, f.s11_start, f.s11_win, f.boss, f.day2], [2, 2, 1, 1, 1, 1, 1, 0, 1]);
  assert.equal(s.funnel[1].pct, 100);
  const st = s.stageFails[0];
  assert.deepEqual([st.stage, st.starts, st.fails, st.wins, st.avgFailSec, st.topCause, st.failPct], ['1-1', 3, 2, 1, 40, 'death', 66.7]);
  assert.deepEqual([s.sessions.sessions, s.sessions.avgSessionSec], [2, 200]);
  assert.ok(s.sessions.medianSessionSec === 100 || s.sessions.medianSessionSec === 300);
  assert.deepEqual(s.sessions.hist, [{ bucket: '3_10m', n: 1, sec: 300 }]);
  const rv = s.ads.find((x) => x.place === 'revive');
  assert.deepEqual([rv.offered, rv.requested, rv.shown, rv.nofill, rv.skipped, rv.rewarded, rv.fillPct], [1, 3, 2, 1, 1, 1, 66.7]);
  assert.equal(s.ads.find((x) => x.place === 'il').requested, 1);
  assert.deepEqual(s.adsServer, [{ place: 'any', rewarded: 1, claimed: 0 }]);
  const pk = s.starsRevenue.byProduct.find((p) => p.product_id === 'pack_start');
  assert.deepEqual([pk.purchases, pk.stars, pk.views, pk.intents], [1, 29, 1, 1]);
  assert.equal(s.starsRevenue.byDay[0].stars, 279);
  assert.deepEqual([s.referrals.invited, s.referrals.pending, s.referrals.activated, s.referrals.top[0].pid], [1, 1, 0, a.me.refCode]);
  assert.deepEqual(s.economy.map((e) => [e.dir, e.res, e.src, e.amount]), [['in', 'gold', 'stage', 1200], ['out', 'gold', 'build', 800]]);
  assert.equal((await call('GET', '/admin/stats?days=999', { headers: ADM })).body.days, 120);
});
