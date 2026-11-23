// v45.2 «Круг побратимов» (3 tiers, milestones, gates, 24 h hold, caps), weekly cosmetic prizes «Летопись Вече»,
// Abyss week/season boards from floor 1 only, login days for everyone, migration 0009.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeEnv, api, loginTg, gameSave } from './helpers.js';
import { circleConfig, niceRound, msReward, resolveChain, gatesOk, reachedMs, runCircleCron } from '../src/lib/circle.js';
import { bracketFor, rankGroup, runWeeklyPrizes } from '../src/lib/prizes.js';
import { DEFAULTS } from '../src/lib/config.js';
import { runCron } from '../src/routes/bot.js';

const DAY = 86400000;
const HOUR = 3600000;
const T0 = Date.parse('2026-11-10T09:00:00Z');
const cfg0 = circleConfig(null);
const ms = (id) => cfg0.milestones.find((m) => m.id === id);

async function putSave(call, s, over) {
  const cur = await call('GET', '/save', { token: s.token });
  const r = await call('PUT', '/save', { token: s.token, body: { baseVersion: cur.body.version, data: gameSave(over) } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r;
}
const rows = async (env, friend) => (await env.DB.prepare('SELECT ms, tier, rcpt, status, reason, reward FROM ref_ms WHERE friend=? ORDER BY ms, tier').bind(friend).all()).results;
const letters = async (env, uid) => (await env.DB.prepare("SELECT kind, title, reward FROM inbox WHERE uid=? AND kind='referrer' ORDER BY id").bind(uid).all()).results.map((r) => ({ ...r, reward: JSON.parse(r.reward) }));

test('chain resolution: three tiers up, never self, never repeats (no cycles)', () => {
  assert.deepEqual(resolveChain('e', 'd', { t1: 'c', t2: 'b' }), { t1: 'd', t2: 'c', t3: 'b' });
  assert.deepEqual(resolveChain('b', 'a', null), { t1: 'a', t2: null, t3: null });
  assert.equal(resolveChain('a', 'a', null), null, 'self-invite');
  assert.deepEqual(resolveChain('x', 'd', { t1: 'x', t2: 'b' }), { t1: 'd', t2: null, t3: null }, 'cycle through self is cut');
  assert.deepEqual(resolveChain('x', 'd', { t1: 'c', t2: 'x' }), { t1: 'd', t2: 'c', t3: null });
  assert.deepEqual(resolveChain('x', 'd', { t1: 'd', t2: 'c' }), { t1: 'd', t2: null, t3: null }, 'repeat is cut');
});

test('milestone payout math: spec gold (≈200×1.12^(L−1)×3), 100/20/4 shares, min(recipient, milestone) level, tier-1-only items, no sparks', () => {
  assert.deepEqual([niceRound(4), niceRound(68), niceRound(1040), niceRound(1664), niceRound(49848), niceRound(154800)], [4, 70, 1000, 1700, 50000, 155000]);
  const g = (id, tier, lvl = 50) => msReward(cfg0, ms(id), tier, lvl).res.gold;
  // table from the spec (emberveil-social-v45 «Вехи и награды»)
  assert.deepEqual(['join', 'l5', 'l10', 'l20', 'l30', 'l40', 'l50'].map((id) => g(id, 1)), [100, 500, 1700, 5200, 16000, 50000, 155000]);
  assert.deepEqual(['join', 'l5', 'l10', 'l20', 'l30', 'l40', 'l50'].map((id) => g(id, 2)), [20, 100, 340, 1000, 3200, 10000, 31000]);
  assert.deepEqual(['join', 'l5', 'l10', 'l20', 'l30', 'l40', 'l50'].map((id) => g(id, 3)), [4, 20, 70, 210, 640, 2000, 6200]);
  // items: chests/shards/essence/cosmetics only for tier 1
  assert.deepEqual(msReward(cfg0, ms('l10'), 1, 50), { res: { gold: 1700, chest_iron: 1 }, cosmetics: [] });
  assert.deepEqual(msReward(cfg0, ms('l10'), 2, 50), { res: { gold: 340 }, cosmetics: [] });
  assert.deepEqual(msReward(cfg0, ms('l50'), 1, 50).cosmetics, ['title_sworn', 'glow_sworn']);
  assert.deepEqual(msReward(cfg0, ms('l5'), 1, 1).res, { gold: 500, ess: 25 }, 'fixed amounts are not level-scaled');
  // min level rule: a level-3 inviter of a level-30 friend gets gold of level 3
  assert.equal(g('l30', 1, 3), niceRound(3 * 200 * 1.12 ** 2));
  assert.equal(g('l30', 2, 3), niceRound(niceRound(3 * 200 * 1.12 ** 2) * 0.2));
  // config-driven mixes (economy review): materials, a shared material, sparks are stripped
  const cfg = circleConfig({ shareTypes: ['gold', 'ore'], milestones: [{ id: 'l10', lvl: 10, rewards: [{ type: 'ore', amount: 500 }, { type: 'sparks', amount: 99 }, { type: 'chest_gold', amount: 2 }] }] });
  assert.deepEqual(msReward(cfg, cfg.milestones[0], 1, 50).res, { ore: 500, chest_gold: 2 });
  assert.deepEqual(msReward(cfg, cfg.milestones[0], 2, 50).res, { ore: 100 });
  // the v41 stored shape keeps working (merged over defaults)
  const v41 = circleConfig({ referrer: { gold: 700 }, referee: { gold: 300, ess: 15 }, maxRewarded: 2 });
  assert.deepEqual([v41.maxRewarded, v41.holdHours, v41.milestones.length], [2, 24, 7]);
  assert.deepEqual(msReward(v41, v41.milestones[1], 1, 9).res, { gold: 700 });
  // reached milestones from a cloud-save summary
  assert.deepEqual(reachedMs(cfg0, { lvl: 12, b15: 1 }), ['l5', 'l10']);
  assert.deepEqual(reachedMs(cfg0, { lvl: 12, b15: 0 }), ['l10']);
  // every reward amount lives in config
  assert.ok(DEFAULTS.referral.milestones.every((m) => m.rewards === 'referrer' || m.rewards.every((r) => r.amount !== undefined || r.stages !== undefined || r.id)));
});

test('gates: account age, distinct login days, server-recorded run', () => {
  const f = { ageMs: 3 * DAY, days: 3, abyss: false, wb: false };
  assert.deepEqual(gatesOk(ms('l10').gates, f), { ok: true });
  assert.deepEqual(gatesOk(ms('l20').gates, f), { ok: false, reason: 'run' });
  assert.deepEqual(gatesOk(ms('l20').gates, { ...f, abyss: true }), { ok: true });
  assert.deepEqual(gatesOk(ms('l30').gates, { ...f, ageMs: 8 * DAY, days: 5, wb: true }), { ok: true });
  assert.deepEqual(gatesOk(ms('l30').gates, { ...f, ageMs: 6 * DAY, days: 5, wb: true }), { ok: false, reason: 'age' });
  assert.deepEqual(gatesOk(ms('l30').gates, { ...f, ageMs: 8 * DAY, days: 4, abyss: true }), { ok: false, reason: 'days' });
});

test('3-tier circle end to end: chain on first login, join + level milestones from the cloud save, gates, 24 h hold, min level, flags', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: T0 };
  const call = api(env, clock);
  const A = await loginTg(call, 4001, 'Аня');
  const B = await loginTg(call, 4002, 'Борис', { startParam: 'ref_' + A.me.refCode });
  const C = await loginTg(call, 4003, 'Вера', { startParam: 'ref_' + B.me.refCode });
  const D = await loginTg(call, 4004, 'Гоша', { startParam: 'ref_' + C.me.refCode });
  let E = await loginTg(call, 4005, 'Даша', { startParam: 'ref_' + D.me.refCode });
  const chain = await env.DB.prepare("SELECT t1, t2, t3 FROM ref_chain WHERE uid='t4005'").first();
  assert.deepEqual(chain, { t1: 't4004', t2: 't4003', t3: 't4002' }, 'A is beyond the third tier');
  // chain is immutable: re-login with another code changes nothing
  await loginTg(call, 4005, 'Даша', { startParam: 'ref_' + A.me.refCode });
  assert.deepEqual(await env.DB.prepare("SELECT t1, t2, t3 FROM ref_chain WHERE uid='t4005'").first(), chain);
  assert.deepEqual((await rows(env, 't4005')).map((r) => [r.ms, r.tier, r.rcpt, r.status]), [['join', 1, 't4004', 'wait'], ['join', 2, 't4003', 'wait'], ['join', 3, 't4002', 'wait']]);
  // recipients' levels: D is level 3 (min-level rule), C and B are level 50
  for (const [s, lvl] of [[D, 3], [C, 50], [B, 50]]) await putSave(call, s, { hero: { lvl } });

  // hold: nothing before 24 h, then exactly once
  await runCircleCron(env, clock.now + HOUR);
  assert.ok((await rows(env, 't4005')).every((r) => r.status === 'hold'));
  assert.equal((await letters(env, 't4004')).length, 0);
  await runCircleCron(env, T0 + 24 * HOUR);
  await runCircleCron(env, T0 + 25 * HOUR);
  assert.deepEqual((await letters(env, 't4004')).map((l) => l.reward), [{ gold: 100 }]);
  const paid = async (m) => (await rows(env, 't4005')).filter((r) => r.ms === m).map((r) => [r.tier, r.status, JSON.parse(r.reward)]);
  assert.deepEqual(await paid('join'), [[1, 'paid', { gold: 100 }], [2, 'paid', { gold: 20 }], [3, 'paid', { gold: 4 }]]);
  // A got only its own tier-1..3 letters for B, C, D (100 + 20 + 4), nothing from E (4th tier)
  assert.deepEqual((await letters(env, 't4001')).map((l) => l.reward.gold).sort((x, y) => x - y), [4, 20, 100]);

  // level 10 from the cloud save on day 0: gates (age 1 day, 2 login days) wait
  clock.now = T0 + 30 * 60000;
  E = await loginTg(call, 4005, 'Даша');
  await putSave(call, E, { hero: { lvl: 10 } });
  let l10 = (await rows(env, 't4005')).filter((r) => r.ms === 'l10');
  assert.deepEqual(l10.map((r) => [r.tier, r.status, r.reason]), [[1, 'wait', 'age'], [2, 'wait', 'age'], [3, 'wait', 'age']]);
  // a day later: still one login day
  await runCircleCron(env, T0 + 26 * HOUR);
  l10 = (await rows(env, 't4005')).filter((r) => r.ms === 'l10');
  assert.ok(l10.every((r) => r.status === 'wait' && r.reason === 'days'), JSON.stringify(l10));
  // she comes back on another day → hold → paid after the hold (counted from reaching the milestone)
  clock.now = T0 + 30 * HOUR;
  E = await loginTg(call, 4005, 'Даша');
  await runCircleCron(env, T0 + 34 * HOUR);
  l10 = (await rows(env, 't4005')).filter((r) => r.ms === 'l10');
  assert.ok(l10.every((r) => r.status === 'paid'), JSON.stringify(l10));
  const dl = await letters(env, 't4004');
  assert.deepEqual(dl[1].reward, { gold: niceRound(3 * 200 * 1.12 ** 2), chest_iron: 1 }, 'level-3 inviter: gold of level 3, tier-1 chest');
  assert.equal(dl[1].kind, 'referrer');
  assert.match(dl[1].title, /10-го уровня/);
  assert.deepEqual((await paid('l10')).map((x) => x[2]), [{ gold: niceRound(3 * 200 * 1.12 ** 2), chest_iron: 1 }, { gold: 340 }, { gold: 70 }]);

  // l20 needs a server-recorded Abyss run
  clock.now = T0 + 4 * DAY;
  E = await loginTg(call, 4005, 'Даша');
  await putSave(call, E, { hero: { lvl: 20 } });
  await runCircleCron(env, clock.now + 25 * HOUR);
  assert.ok((await rows(env, 't4005')).filter((r) => r.ms === 'l20').every((r) => r.status === 'wait' && r.reason === 'run'));
  clock.now += 25 * HOUR;
  E = await loginTg(call, 4005, 'Даша');
  const run = await call('POST', '/abyss/start', { token: E.token, body: { startFloor: 1 } });
  clock.now += 3 * 60000;
  assert.equal((await call('POST', '/abyss/finish', { token: E.token, body: { runId: run.body.runId, floor: 3, timeMs: 150000 } })).status, 200);
  await runCircleCron(env, clock.now + 7 * HOUR);
  const l20 = (await rows(env, 't4005')).filter((r) => r.ms === 'l20');
  assert.ok(l20.every((r) => r.status === 'paid'), JSON.stringify(l20));
  assert.deepEqual((await letters(env, 't4004')).at(-1).reward, { gold: niceRound(3 * 200 * 1.12 ** 2), shards: 20, cosmetic: 'frame_sworn' });

  // GET /referrals: old fields unchanged + v45.2 fields
  const Dn = await loginTg(call, 4004, 'Гоша');
  const r = (await call('GET', '/referrals', { token: Dn.token })).body;
  for (const k of ['ok', 'code', 'link', 'invited', 'pending', 'activated', 'friends']) assert.ok(k in r, k);
  assert.deepEqual([r.invited, r.pending, r.activated], [1, 1, 0]);
  const fe = r.friends.find((f) => f.name === 'Даша');
  assert.deepEqual([fe.pid, fe.tier, fe.level, fe.activated, fe.ms, fe.next], [E.me.refCode, 1, 20, false, ['join', 'l10', 'l20'], 'l5']);
  assert.deepEqual(fe.earned, { gold: 100 + 2 * niceRound(3 * 200 * 1.12 ** 2), chest_iron: 1, shards: 20 });
  assert.equal(r.friends.find((f) => f.name === 'Вера').tier, null, 'the inviter is a friend, not a tier');
  assert.deepEqual(r.tiers, { t1: 1, t2: 0, t3: 0 });
  assert.deepEqual(r.earned, fe.earned);
  assert.deepEqual(r.held, []);
  assert.equal(r.milestones.length, 7);
  assert.deepEqual(r.milestones[2], { id: 'l10', lvl: 10, rewards: [{ gold: 750, chest_iron: 1 }, { gold: 150 }, { gold: 30 }] });
  const Bn = await loginTg(call, 4002, 'Борис');
  assert.deepEqual((await call('GET', '/referrals', { token: Bn.token })).body.tiers, { t1: 1, t2: 1, t3: 1 });

  // suspicious friend: flags → refused, never paid
  await env.DB.prepare("UPDATE users SET flags=1 WHERE id='t4005'").run();
  clock.now += DAY;
  E = await loginTg(call, 4005, 'Даша');
  await putSave(call, E, { hero: { lvl: 20 }, prog: { stages: { '1-5': { stars: 1 } } } });
  const l5 = (await rows(env, 't4005')).filter((r) => r.ms === 'l5');
  assert.ok(l5.length === 3 && l5.every((r) => r.status === 'refused' && r.reason === 'flags'), JSON.stringify(l5));
});

test('caps: per-day letters postponed, tier-1 friends capped (maxRewarded), guests never count', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: T0 };
  const call = api(env, clock);
  await env.DB.prepare("INSERT INTO config (key, value, updated_at) VALUES ('referral', ?, 0)").bind(JSON.stringify({ maxRewarded: 2, capDay: 1, holdHours: 1 })).run();
  const A = await loginTg(call, 5001, 'Аня');
  for (const id of [5002, 5003, 5004]) await loginTg(call, id, 'Друг' + id, { startParam: 'ref_' + A.me.refCode });
  const g = await call('POST', '/auth/guest', { body: { deviceId: 'device-abcdef-0123456789', startParam: 'ref_' + A.me.refCode } });
  assert.equal(g.status, 200);
  const st = async () => (await env.DB.prepare("SELECT friend, status, reason FROM ref_ms WHERE rcpt='t5001' ORDER BY friend").all()).results;
  await runCircleCron(env, T0 + 2 * HOUR);
  let s1 = await st();
  assert.ok(s1.every((r) => r.friend.startsWith('t')) && s1.length === 3, 'guest has no rows');
  assert.equal(s1.filter((r) => r.status === 'paid').length, 1, JSON.stringify(s1));
  assert.deepEqual(s1.filter((r) => r.status === 'hold').map((r) => r.reason), ['cap_day', 'cap_day'], 'postponed, not lost');
  // the next day: one more is paid, the third is over maxRewarded (2 distinct tier-1 friends) → refused
  await runCircleCron(env, T0 + 27 * HOUR);
  s1 = await st();
  assert.deepEqual(s1.map((r) => r.status).sort(), ['paid', 'paid', 'refused']);
  assert.equal(s1.find((r) => r.status === 'refused').reason, 'cap');
  assert.equal((await letters(env, 't5001')).length, 2);
});

test('login days for everyone: recorded with «Отправлять статистику» off, analytics untouched; forget-me cancels open rewards', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: T0 };
  const call = api(env, clock);
  const A = await loginTg(call, 6001, 'Аня');
  let B = await loginTg(call, 6002, 'Борис', { startParam: 'ref_' + A.me.refCode });
  await call('POST', '/me/settings', { token: B.token, body: { stats: false } });
  clock.now += DAY;
  B = await loginTg(call, 6002, 'Борис');
  const ld = (await env.DB.prepare("SELECT day FROM login_days WHERE uid='t6002' ORDER BY day").all()).results.map((r) => r.day);
  const ad = (await env.DB.prepare("SELECT day FROM active_days WHERE uid='t6002' ORDER BY day").all()).results.map((r) => r.day);
  assert.deepEqual([ld.length, ad.length], [2, 1], 'login_days for anti-fraud, active_days only while stats are on');
  assert.equal((await call('DELETE', '/me', { token: B.token })).status, 200);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) n FROM login_days WHERE uid='t6002'").first()).n, 0);
  const st = (await env.DB.prepare("SELECT status, reason FROM ref_ms WHERE friend='t6002'").all()).results;
  assert.ok(st.length && st.every((r) => r.status === 'refused' && r.reason === 'deleted'));
  // retention: 13 months
  await env.DB.exec("INSERT INTO login_days (uid, day) VALUES ('old','2025-01-01')");
  await runCron(env, clock.now);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) n FROM login_days WHERE uid='old'").first()).n, 0);
});

test('Abyss: only runs started at floor 1 count on week/season boards; the personal record still moves', async () => {
  const env = makeEnv({ RATE_LIMIT: '0' });
  const clock = { now: Date.parse('2026-11-24T10:00:00Z') };
  const call = api(env, clock);
  const s = await loginTg(call, 7001, 'Аня');
  const runFrom = async (startFloor, floor) => {
    const r = await call('POST', '/abyss/start', { token: s.token, body: { startFloor } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    clock.now += 10 * 60000;
    return (await call('POST', '/abyss/finish', { token: s.token, body: { runId: r.body.runId, floor, timeMs: (floor - startFloor + 1) * 20000 } })).body;
  };
  assert.equal((await runFrom(1, 6)).board, true);
  const f2 = await runFrom(3, 12);
  assert.deepEqual([f2.recorded, f2.board, f2.newRecord], [true, false, true]);
  const lb = async (board) => (await call('GET', '/lb/abyss?board=' + board)).body.entries.map((e) => e.floor);
  assert.deepEqual(await lb('week'), [6]);
  assert.deepEqual(await lb('season'), [6]);
  assert.deepEqual(await lb('all'), [12]);
});

test('weekly prizes: cosmetics only, by place in own league / board, 24 h after the reset, suspicious skipped, idempotent', async () => {
  // brackets
  const W = DEFAULTS.prizes.wb;
  assert.deepEqual([1, 10, 11, 20, 21, 50, 51].map((p) => bracketFor(W, p, 200)), ['frame_wb_top10', 'frame_wb_top10', 'frame_wb_p10', 'frame_wb_p10', 'glow_wb_p25', 'glow_wb_p25', 'troph_wb_p50']);
  assert.equal(bracketFor(W, 101, 200), null);
  assert.equal(bracketFor([{ top: 3, gold: 999 }], 1, 10), null, 'entries without a cosmetic give nothing');
  assert.deepEqual(rankGroup([{ uid: 'a' }, { uid: 'b' }, { uid: 'c' }], [{ top: 1, cosmetic: 'x' }], new Set(['a'])).map((w) => [w.uid, w.place]), [['b', 1]]);

  const env = makeEnv({ RATE_LIMIT: '0' });
  const DB = env.DB;
  const week = '2026-W48';
  const reset = Date.parse('2026-11-30T02:00:00Z'); // Monday 05:00 МСК
  const users = [];
  for (let i = 1; i <= 24; i++) users.push(`('u${i}', 'c${String(i).padStart(4, '0')}', 'P${i}', 0, 0)`);
  await DB.exec(`INSERT INTO users (id, ref_code, first_name, created_at, last_seen) VALUES ${users.join(',')};`);
  // overlord: league 1 has 20 players (u1..u20), league 2 has u21..u24; u2 is suspicious, u3 banned
  const st = [];
  for (let i = 1; i <= 20; i++) st.push(`('${week}','gobKing','u${i}',3,${10000 + i * 100},1,5,${reset - DAY})`);
  for (let i = 21; i <= 24; i++) st.push(`('${week}','gobKing','u${i}',2,${10000 + i * 100},2,12,${reset - DAY})`);
  st.push(`('${week}','rotroot','u1',3,5000,1,5,${reset - DAY})`); // same player on another overlord: still one prize
  await DB.exec(`INSERT INTO lb_wboss (week, boss, uid, tier, time_ms, league, hearth, updated_at) VALUES ${st.join(',')};`);
  await DB.exec(`UPDATE users SET banned=1 WHERE id='u3'; INSERT INTO audit (uid, kind, detail, ts) VALUES ('u2','wb_rejected',NULL,${reset - 2 * DAY});`);
  // abyss weekly board: u21 > u22 > u23 > u24; u24 suspicious after the week (before settlement)
  await DB.exec(`INSERT INTO lb_abyss (period, uid, floor, time_ms, updated_at) VALUES ('w:${week}','u21',30,1,1),('w:${week}','u22',25,1,1),('w:${week}','u23',20,1,1),('w:${week}','u24',40,1,1),('w:2026-W47','u1',99,1,1);
    INSERT INTO audit (uid, kind, detail, ts) VALUES ('u24','save_suspicious',NULL,${reset + HOUR});`);

  assert.deepEqual(await runWeeklyPrizes(env, reset + 23 * HOUR), {}, 'not before 24 h');
  const r1 = await runWeeklyPrizes(env, reset + 25 * HOUR);
  // league 1: 18 ranked (u2, u3 out) → places 1..10 (top 10; 10% / 25% / 50% of 18 are inside the top 10); league 2: u24 is suspicious → 3
  assert.deepEqual(r1, { [`wb:${week}`]: 13, [`abyss:${week}`]: 3 }, JSON.stringify(r1));
  const inbox = (await DB.prepare("SELECT uid, kind, title, reward FROM inbox ORDER BY id").all()).results;
  assert.ok(inbox.every((l) => l.kind === 'prize' && Object.keys(JSON.parse(l.reward)).join() === 'cosmetic'), 'cosmetics only');
  const prize = (uid, board) => (inbox.filter((l) => l.uid === uid && l.title.includes(board === 'wb' ? 'Владыка' : 'Бездна')).map((l) => JSON.parse(l.reward).cosmetic));
  assert.deepEqual(prize('u1', 'wb'), ['frame_wb_top10'], 'one overlord prize a week');
  assert.deepEqual([prize('u2', 'wb'), prize('u3', 'wb')], [[], []], 'suspicious and banned skipped');
  assert.deepEqual(prize('u4', 'wb'), ['frame_wb_top10'], 'place 2 once u2, u3 are out');
  assert.deepEqual([prize('u12', 'wb'), prize('u13', 'wb'), prize('u20', 'wb')], [['frame_wb_top10'], [], []]);
  assert.deepEqual(prize('u21', 'wb'), ['frame_wb_top10'], 'own league');
  assert.deepEqual([prize('u21', 'abyss'), prize('u22', 'abyss'), prize('u23', 'abyss'), prize('u24', 'abyss')], [['frame_abyss_top3'], ['frame_abyss_top3'], ['frame_abyss_top3'], []]);
  assert.equal(inbox.filter((l) => l.title.includes('W47')).length, 0, 'weeks before fromWeek are not settled');
  // idempotent: re-running (also after a lost prize_runs mark) adds nothing
  await runWeeklyPrizes(env, reset + 26 * HOUR);
  await DB.exec('DELETE FROM prize_runs');
  await runWeeklyPrizes(env, reset + 27 * HOUR);
  assert.equal((await DB.prepare('SELECT COUNT(*) n FROM inbox').first()).n, inbox.length);
  // also from the regular cron
  await runCron(env, reset + 28 * HOUR);
  assert.equal((await DB.prepare('SELECT COUNT(*) n FROM inbox').first()).n, inbox.length);
});

test('migration 0009: tables, chain backfill without self/repeats, pre-v45 join / 1-5 marked legacy, login days from analytics', () => {
  const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
  const files = readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  assert.equal(files.at(-1), '0009_circle.sql');
  const db = new DatabaseSync(':memory:');
  for (const f of files.slice(0, -1)) db.exec(readFileSync(dir + f, 'utf8'));
  db.exec(`INSERT INTO users (id, ref_code, created_at, last_seen) VALUES ('a','ca',1,1),('b','cb',2,2),('c','cc',3,3),('d','cd',4,4),('e','ce',5,5);
    UPDATE users SET referred_by='a', ref_state='done' WHERE id='b';
    UPDATE users SET referred_by='b', ref_state='pending' WHERE id='c';
    UPDATE users SET referred_by='c', ref_state='legacy' WHERE id='d';
    UPDATE users SET referred_by='d' WHERE id='e';
    INSERT INTO active_days (uid, day) VALUES ('b','2026-11-01'),('b','2026-11-02');`);
  db.exec(readFileSync(dir + files.at(-1), 'utf8'));
  const all = (sql) => db.prepare(sql).all().map((r) => ({ ...r }));
  assert.deepEqual(all('SELECT uid, t1, t2, t3 FROM ref_chain ORDER BY uid'), [
    { uid: 'b', t1: 'a', t2: null, t3: null }, { uid: 'c', t1: 'b', t2: 'a', t3: null },
    { uid: 'd', t1: 'c', t2: 'b', t3: 'a' }, { uid: 'e', t1: 'd', t2: 'c', t3: 'b' }]);
  assert.deepEqual(all("SELECT friend, ms, tier FROM ref_ms WHERE ms='l5' ORDER BY friend"), [{ friend: 'b', ms: 'l5', tier: 1 }, { friend: 'd', ms: 'l5', tier: 1 }]);
  assert.equal(all("SELECT COUNT(*) n FROM ref_ms WHERE ms='join' AND status='legacy'")[0].n, 1 + 2 + 3 + 3);
  assert.equal(all("SELECT COUNT(*) n FROM login_days WHERE uid='b'")[0].n, 2);
  for (const t of ['ref_chain', 'ref_ms', 'login_days', 'weekly_prizes', 'prize_runs']) assert.ok(all(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}'`).length, t);
});
