// v42 live-ops: dated event calendar, season passes (s1 + «Огниво» 51–60, s2 «Долгая Стужа»), weekly overlord + board,
// server-wide shared goal («Ночь Долгих Углей»), clan weekly goal with thresholds (migration 0008).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg } from './helpers.js';
import { DEFAULTS } from '../src/lib/config.js';
import { CALENDAR, PASSES, passError, wbWeek, wbLeague, checkWbRun, clanThresholds, FLINT_FREE, FLINT_PREM } from '../src/lib/liveops.js';

const MSK = (s) => Date.parse(s + '+03:00');
const admin = (env) => ({ authorization: 'Bearer ' + env.ADMIN_SECRET });

test('calendar: dated windows (no eternal rotation), no overlap of same mechanic, pet_ember only in the pass', async () => {
  assert.ok(CALENDAR.length >= 10);
  for (const e of CALENDAR) assert.ok(e.id && e.start < e.end && e.name, e.id);
  const ids = new Set(CALENDAR.map((e) => e.id)); assert.equal(ids.size, CALENDAR.length, 'unique ids');
  // the same mechanic never runs twice at once
  for (const a of CALENDAR) for (const b of CALENDAR) if (a !== b && a.base === b.base) assert.ok(a.end <= b.start || b.end <= a.start, a.id + ' / ' + b.id);
  assert.ok(CALENDAR.every((e) => e.start >= MSK('2026-11-16T00:00:00') && e.end <= MSK('2027-02-15T05:00:00')), 'first 3 months only');
  assert.ok(!JSON.stringify(CALENDAR).includes('pet_ember'), 'pet_ember is a pass reward (tier 40), not an event reward');
  assert.equal(PASSES[0].tiers.find((t) => t.tier === 40).free.cosmetic, 'pet_ember');
  assert.equal(JSON.stringify(PASSES).split('"pet_ember"').length - 1, 1, 'one source');

  const env = makeEnv();
  const clock = { now: MSK('2026-11-20T12:00:00') };
  const call = api(env, clock);
  let c = (await call('GET', '/config')).body;
  assert.deepEqual(c.events, [], '20.11: nothing on');
  assert.equal(c.upcoming[0].id, 'lucky_2611a');
  assert.equal(c.season.id, 's1');
  assert.equal(c.battlepass.tiers.length, 60);
  assert.equal(c.nextSeason.id, 's2');
  assert.equal(c.wb.boss, 'gobKing');
  assert.ok(c.products.some((p) => p.id === 'bp_s1') && !c.products.some((p) => p.id === 'bp_s2'), 'only this season premium is sold');
  clock.now = MSK('2026-11-21T06:00:00');
  assert.deepEqual((await call('GET', '/config')).body.events.map((e) => e.base), ['lucky_weekend']);
  clock.now = MSK('2026-12-24T12:00:00');
  c = (await call('GET', '/config')).body;
  assert.deepEqual(c.events.map((e) => e.id), ['long_embers_26']);
  assert.equal(c.events[0].modifiers.goal, 'embers26');
  clock.now = MSK('2026-12-29T12:00:00');
  assert.deepEqual((await call('GET', '/config')).body.events.map((e) => e.id).sort(), ['colossus_echo_26', 'long_embers_26']);
  clock.now = MSK('2027-01-16T12:00:00');
  c = (await call('GET', '/config')).body;
  assert.deepEqual(c.events.map((e) => e.id), ['s2_start']);
  assert.equal(c.season.id, 's2');
  assert.equal(c.season.name, 'Долгая Стужа');
  assert.equal(c.battlepass.season, 's2');
  assert.equal(c.battlepass.premiumProduct, 'bp_s2');
  assert.equal(c.battlepass.tiers.length, 50);
  assert.ok(c.products.some((p) => p.id === 'bp_s2') && !c.products.some((p) => p.id === 'bp_s1'));
  assert.equal(c.wb.boss, 'bogMother', 'week of 11.01; Стужень from 18.01');
  // admin override of the calendar still works; [] = nothing
  assert.equal((await call('PUT', '/admin/config/events', { headers: admin(env), body: [] })).status, 200);
  assert.deepEqual((await call('GET', '/config')).body.events, []);
});

test('season pass: «Огниво» 51–60 cosmetics only; S2 by date; pass validation (anti-P2W)', async () => {
  const s1 = PASSES[0];
  for (let t = 51; t <= 60; t++) {
    const T = s1.tiers[t - 1];
    assert.ok(T.premium && Object.keys(T.premium).join() === 'cosmetic', 'premium ' + t);
    assert.ok(!T.free || Object.keys(T.free).join() === 'cosmetic', 'free ' + t);
  }
  assert.equal(Object.keys(FLINT_FREE).length + Object.keys(FLINT_PREM).length, 15);
  for (const p of PASSES) assert.equal(passError(p), '', p.season);
  assert.ok(DEFAULTS.passes[1].start === s1.end, 's2 starts when s1 ends');
  assert.match(passError({ ...s1, tiers: s1.tiers.map((t) => (t.tier === 3 ? { ...t, premium: { gold: 999 } } : t)) }), /только облики/);
  assert.match(passError({ ...s1, tiers: s1.tiers.map((t) => (t.tier === 55 ? { ...t, free: { gold: 1 } } : t)) }), /Огниво/);
  assert.match(passError({ ...s1, tiers: s1.tiers.slice(1) }), /tier/);

  const env = makeEnv();
  const clock = { now: MSK('2026-12-01T12:00:00') };
  const call = api(env, clock);
  const bad = [{ ...PASSES[0] }, { ...PASSES[1], start: PASSES[0].end - 86400000 }];
  assert.equal((await call('PUT', '/admin/config/passes', { headers: admin(env), body: bad })).status, 400, 'overlap');
  assert.equal((await call('PUT', '/admin/config/passes', { headers: admin(env), body: [{ ...PASSES[1], tiers: [{ tier: 1, premium: { ore: 5 } }, ...PASSES[1].tiers.slice(1)] }] })).status, 400);
  assert.equal((await call('PUT', '/admin/config/battlepass', { headers: admin(env), body: { ...PASSES[0], tiers: PASSES[0].tiers.map((t) => (t.tier === 1 ? { ...t, premium: { potion: 5 } } : t)) } })).status, 400);
  assert.equal((await call('PUT', '/admin/config/passes', { headers: admin(env), body: PASSES })).status, 200);

  // s1: tier 55 premium needs bp_s1; in s2 the server switches tiers, product and XP bucket
  let s = await loginTg(call, 4201, 'Сезон');
  await env.DB.prepare("INSERT INTO bp_progress (uid, season, xp) VALUES ('t4201','s1',11000)").run();
  let bp = (await call('GET', '/bp', { token: s.token })).body;
  assert.deepEqual([bp.season, bp.tier, bp.tiers.length], ['s1', 55, 60]);
  assert.equal((await call('POST', '/bp/claim', { token: s.token, body: { tier: 55, track: 'premium' } })).status, 402);
  await call('POST', '/admin/grant', { headers: admin(env), body: { pid: s.me.pid, productId: 'bp_s1', qty: 1 } });
  const r = await call('POST', '/bp/claim', { token: s.token, body: { tier: 55, track: 'premium' } });
  assert.equal(r.status, 200); assert.deepEqual(r.body.reward, { cosmetic: FLINT_PREM[55] });
  clock.now = MSK('2027-01-20T12:00:00'); s = await loginTg(call, 4201, 'Сезон');
  bp = (await call('GET', '/bp', { token: s.token })).body;
  assert.deepEqual([bp.season, bp.xp, bp.tiers.length, bp.premium, bp.name], ['s2', 0, 50, false, 'Долгая Стужа']);
  await call('POST', '/daily/claim', { token: s.token });
  assert.equal((await call('GET', '/bp', { token: s.token })).body.xp, 60, 'XP goes to s2');
});

test('weekly overlord: rotation by week, leagues, plausibility', () => {
  const env = { DAY_OFFSET_MIN: '180' };
  const at = (s) => wbWeek(MSK(s), env);
  assert.deepEqual([at('2026-11-16T12:00:00').boss, at('2026-11-16T12:00:00').mods], ['gobKing', ['fury', 'adds']]);
  assert.equal(at('2026-11-23T12:00:00').boss, 'rotroot');
  assert.equal(at('2026-11-29T23:00:00').boss, 'rotroot', 'Sunday still the same week');
  assert.equal(at('2026-12-07T12:00:00').boss, 'colossus');
  assert.equal(at('2026-12-28T12:00:00').name, 'Эхо Колосса');
  assert.equal(at('2027-01-18T12:00:00').boss, 'stuzhen');
  assert.equal(at('2027-02-01T12:00:00').boss, 'dragon');
  assert.equal(at('2027-02-08T12:00:00').boss, 'gobKing', 'wraps after 12 weeks');
  assert.equal(at('2026-11-10T12:00:00').boss, 'gobKing', 'before the start — week 0');
  assert.deepEqual([wbLeague(0), wbLeague(9), wbLeague(10), wbLeague(25)], [1, 1, 2, 3]);
  assert.equal(checkWbRun({ startedAt: 0, now: 60000, timeMs: 5000 }).reason, 'too_fast');
  assert.equal(checkWbRun({ startedAt: 0, now: 60000, timeMs: 120000 }).reason, 'time_mismatch');
  assert.equal(checkWbRun({ startedAt: 0, now: 2 * 3600000, timeMs: 60000 }).reason, 'expired');
  assert.ok(checkWbRun({ startedAt: 0, now: 90000, timeMs: 80000 }).ok);
});

test('weekly overlord: start/finish, best result, first clear → clan points, board by league + friends', async () => {
  const env = makeEnv();
  const clock = { now: MSK('2026-11-23T12:00:00') };
  const call = api(env, clock);
  const [a, b, c] = [await loginTg(call, 4301, 'Аня'), await loginTg(call, 4302, 'Боря'), await loginTg(call, 4303, 'Вера')];
  const w = (await call('GET', '/wb', { token: a.token })).body;
  assert.deepEqual([w.boss, w.week, w.cleared, w.best], ['rotroot', '2026-W48', [], null]);
  assert.equal((await call('POST', '/wb/start', { token: a.token, body: { tier: 4 } })).status, 400);
  assert.equal((await call('POST', '/wb/start', { token: a.token, body: { tier: 1, boss: 'nobody' } })).status, 400);
  const run = async (s, tier, sec, o = {}) => {
    const st = await call('POST', '/wb/start', { token: s.token, body: { tier, ...(o.boss ? { boss: o.boss } : {}) } });
    assert.equal(st.status, 200, JSON.stringify(st.body));
    clock.now += sec * 1000 + 2000;
    return call('POST', '/wb/finish', { token: s.token, body: { runId: st.body.runId, timeMs: sec * 1000, hearth: o.hearth || 5 } });
  };
  // a clan: А and В
  const cl = await call('POST', '/clan/create', { token: a.token, body: { name: 'Угли Брода', tag: 'ugl' } });
  await call('POST', '/clan/join', { token: c.token, body: { clanId: cl.body.clan.id } });

  const fast = await call('POST', '/wb/start', { token: a.token, body: { tier: 1 } });
  clock.now += 3000;
  assert.equal((await call('POST', '/wb/finish', { token: a.token, body: { runId: fast.body.runId, timeMs: 2000 } })).status, 422, 'too fast');
  let r = await run(a, 1, 95);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.firstClear, r.body.tier, r.body.rank, r.body.league], [true, 1, 1, 1]);
  r = await run(a, 1, 80);
  assert.equal(r.body.firstClear, false, 'second clear of a tier — no new weekly reward');
  assert.equal(r.body.best.timeMs, 80000, 'better time kept');
  r = await run(a, 1, 120);
  assert.equal(r.body.best.timeMs, 80000, 'worse time ignored');
  r = await run(a, 2, 150);
  assert.deepEqual([r.body.firstClear, r.body.best.tier], [true, 2]);
  assert.equal((await call('POST', '/wb/finish', { token: a.token, body: { runId: 'x', timeMs: 1 } })).status, 404);
  await run(b, 3, 200, { hearth: 14 });
  await run(c, 1, 60);
  // clan points: А 10+20, В 10; feed has the clears
  const me = (await call('GET', '/clan/me', { token: a.token })).body.clan;
  assert.equal(me.score, 40);
  assert.ok(me.feed.some((f) => f.type === 'wb_clear'));

  let lb = (await call('GET', '/lb/wb')).body;
  assert.deepEqual(lb.entries.map((e) => [e.name, e.tier]), [['Боря', 3], ['Аня', 2], ['Вера', 1]]);
  lb = (await call('GET', '/lb/wb?league=1', { token: a.token })).body;
  assert.deepEqual(lb.entries.map((e) => e.name), ['Аня', 'Вера'], 'Боря is in league 2 (Очаг 14)');
  assert.equal(lb.me.rank, 1);
  lb = (await call('GET', '/lb/wb?filter=friends', { token: a.token })).body;
  assert.deepEqual(lb.entries.map((e) => e.name), ['Аня', 'Вера'], 'friends = referrals + clan mates');
  assert.equal((await call('GET', '/lb/wb?filter=friends')).status, 401);
  // next week: a fresh board, the fallback boss has its own board
  clock.now = MSK('2026-11-30T12:00:00');
  const a2 = await loginTg(call, 4301, 'Аня');
  assert.equal((await call('GET', '/wb', { token: a2.token })).body.boss, 'bogMother');
  assert.deepEqual((await call('GET', '/lb/wb')).body.entries, []);
  r = await run(a2, 1, 70, { boss: 'gobKing' });
  assert.equal(r.body.boss, 'gobKing');
  assert.equal((await call('GET', '/lb/wb?boss=gobKing')).body.entries.length, 1);
});

test('shared goal «Ночь Долгих Углей»: only during the event, caps per call/day, thresholds for participants', async () => {
  const env = makeEnv();
  const clock = { now: MSK('2026-12-20T12:00:00') };
  const call = api(env, clock);
  let [a, b] = [await loginTg(call, 4401, 'Аня'), await loginTg(call, 4402, 'Боря')];
  assert.equal((await call('GET', '/goal/nope')).status, 404);
  let g = (await call('GET', '/goal/embers26')).body;
  assert.deepEqual([g.active, g.total, g.target, g.tiers.length], [false, 0, 1000000, 4]);
  assert.equal((await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: 10 } })).status, 409, 'event not started');
  // small target for the test
  const goals = structuredClone(DEFAULTS.goals); goals.embers26.target = 1000;
  assert.equal((await call('PUT', '/admin/config/goals', { headers: admin(env), body: goals })).status, 200);
  assert.equal((await call('PUT', '/admin/config/goals', { headers: admin(env), body: { x: { target: 0, tiers: [] } } })).status, 400);
  clock.now = MSK('2026-12-24T12:00:00'); a = await loginTg(call, 4401, 'Аня'); b = await loginTg(call, 4402, 'Боря');
  let r = await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: 500 } });
  assert.deepEqual([r.status, r.body.added, r.body.capped, r.body.total], [200, 80, true, 80], 'per-call cap 80');
  for (let i = 0; i < 6; i++) r = await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: 80 } });
  assert.deepEqual([r.body.me.today, r.body.added], [400, 0], 'per-day cap 400');
  assert.equal(r.body.pct, 40);
  assert.equal((await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: -5 } })).status, 400);
  await call('POST', '/goal/embers26/contrib', { token: b.token, body: { points: 10 } });
  // 25% reached: А claims, Б has too little of his own (min 20)
  r = await call('POST', '/goal/embers26/claim', { token: a.token, body: { pct: 25 } });
  assert.equal(r.status, 200); assert.equal(r.body.reward.sparks, 30);
  assert.equal((await call('POST', '/goal/embers26/claim', { token: a.token, body: { pct: 25 } })).status, 409, 'once');
  assert.equal((await call('POST', '/goal/embers26/claim', { token: a.token, body: { pct: 50 } })).status, 409, 'not reached');
  assert.equal((await call('POST', '/goal/embers26/claim', { token: b.token, body: { pct: 25 } })).body.error, 'no_contrib');
  // next day the cap resets; total crosses 50% → А gets the frame
  clock.now += 86400000; a = await loginTg(call, 4401, 'Аня');
  await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: 80 } });
  g = (await call('GET', '/goal/embers26', { token: a.token })).body;
  assert.deepEqual([g.total, g.participants, g.me.points, g.me.claimed, g.tiers.map((t) => t.reached)], [490, 2, 480, [25], [true, false, false, false]]);
  for (let i = 0; i < 1; i++) await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: 80 } });
  r = await call('POST', '/goal/embers26/claim', { token: a.token, body: { pct: 50 } });
  assert.equal(r.status, 200); assert.equal(r.body.reward.cosmetic, 'frame_embers');
  // after the event: no more contributions, claims still work
  clock.now = MSK('2027-01-10T12:00:00'); a = await loginTg(call, 4401, 'Аня');
  assert.equal((await call('POST', '/goal/embers26/contrib', { token: a.token, body: { points: 10 } })).status, 409);
  assert.equal((await call('GET', '/goal/embers26')).body.active, false);
});

test('clan weekly goal: thresholds grow with members, reward for members with own ≥ 20, «Цвета сияния» ×2 + frame', async () => {
  assert.deepEqual(clanThresholds(1), [120, 300, 600], 'min 3 members counted');
  assert.deepEqual(clanThresholds(10), [400, 1000, 2000]);
  const env = makeEnv();
  const clock = { now: MSK('2026-11-25T12:00:00') };
  const call = api(env, clock);
  const [a, b, c] = [await loginTg(call, 4501, 'Аня'), await loginTg(call, 4502, 'Боря'), await loginTg(call, 4503, 'Вера')];
  assert.equal((await call('GET', '/clan/goal', { token: a.token })).body.clan, null);
  assert.equal((await call('POST', '/clan/goal/claim', { token: a.token, body: { tier: 1 } })).status, 409);
  const cl = await call('POST', '/clan/create', { token: a.token, body: { name: 'Стража Угля', tag: 'stu' } });
  await call('POST', '/clan/join', { token: b.token, body: { clanId: cl.body.clan.id } });
  await call('POST', '/clan/join', { token: c.token, body: { clanId: cl.body.clan.id } });
  const week = (await call('GET', '/clan/goal', { token: a.token })).body.week;
  await env.DB.prepare('INSERT INTO weekly_contrib (week, uid, points) VALUES (?,?,?),(?,?,?),(?,?,?)').bind(week, 't4501', 100, week, 't4502', 15, week, 't4503', 0).run();
  let g = (await call('GET', '/clan/goal', { token: a.token })).body;
  assert.deepEqual([g.members, g.score, g.myPoints, g.tiers.map((t) => t.need), g.tiers.map((t) => t.reached)], [3, 115, 100, [120, 300, 600], [false, false, false]]);
  assert.equal((await call('POST', '/clan/goal/claim', { token: a.token, body: { tier: 1 } })).body.error, 'locked');
  // a daily contract adds 2 clan points (§6.3)
  const day = (await call('GET', '/daily', { token: c.token })).body.day;
  for (const q of ['d_kill', 'd_chest', 'd_stage']) await call('POST', '/quests/claim', { token: c.token, body: { questId: q, day } });
  g = (await call('GET', '/clan/goal', { token: a.token })).body;
  assert.equal(g.score, 121); assert.equal(g.tiers[0].reached, true);
  const r = await call('POST', '/clan/goal/claim', { token: a.token, body: { tier: 1 } });
  assert.equal(r.status, 200); assert.ok(r.body.reward.chest_iron && !r.body.reward.cosmetic);
  assert.equal((await call('POST', '/clan/goal/claim', { token: a.token, body: { tier: 1 } })).body.error, 'claimed');
  assert.equal((await call('POST', '/clan/goal/claim', { token: b.token, body: { tier: 1 } })).body.error, 'no_contrib', 'Боря: 15 < 20');
  // «Цвета сияния»: points ×2 and the clan frame on tier 1
  clock.now = MSK('2027-01-25T12:00:00');
  const a2 = await loginTg(call, 4501, 'Аня'), c2 = await loginTg(call, 4503, 'Вера');
  const day2 = (await call('GET', '/daily', { token: c2.token })).body.day;
  await call('POST', '/quests/claim', { token: c2.token, body: { questId: 'd_kill', day: day2 } });
  g = (await call('GET', '/clan/goal', { token: a2.token })).body;
  assert.equal(g.score, 4, 'quest ×2 during the event');
  assert.equal(g.event.cosmetic, 'frame_aurora');
  const week2 = g.week;
  await env.DB.prepare('INSERT INTO weekly_contrib (week, uid, points) VALUES (?,?,?) ON CONFLICT(week, uid) DO UPDATE SET points=points+excluded.points').bind(week2, 't4501', 200).run();
  const r2 = await call('POST', '/clan/goal/claim', { token: a2.token, body: { tier: 1 } });
  assert.equal(r2.status, 200); assert.equal(r2.body.reward.cosmetic, 'frame_aurora');
});

test('game fallback (apps/emberveil/src/p98.js) mirrors the server tables: calendar, passes, rotation', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const f = new URL('../../apps/emberveil/src/p98.js', import.meta.url);
  if (!existsSync(f)) return; // server checked out without the game sources
  const src = readFileSync(f, 'utf8');
  for (const e of CALENDAR) {
    assert.ok(src.includes(`id:'${e.id}'`), 'calendar id in p98: ' + e.id);
    const d = new Date(e.start + 3 * 3600000).toISOString().slice(0, 10);
    assert.ok(src.includes(`'${d}'`), `start date of ${e.id} (${d}) in p98`);
  }
  const S1_OLD = ['glow_ember', 'skin_ash', 'deco_banners', 'frame_ember', 'pet_ember', 'glow_gold', 'frame_gold', 'glow_frost', 'pet_shadow', 'skin_frost', 'deco_statue', 'glow_void', 'skin_abyss', 'pet_gold', 'deco_bonfire', 'skin_royal'];
  for (const p of PASSES) for (const t of p.tiers) for (const trk of ['free', 'premium']) {
    const id = t[trk] && t[trk].cosmetic;
    if (id && !S1_OLD.includes(id)) assert.ok(src.includes(id + ':{'), 'cosmetic defined in the game: ' + id);
  }
  const { WB_ROTATION } = await import('../src/lib/liveops.js');
  for (const w of WB_ROTATION) assert.ok(src.includes(`{boss:'${w.boss}',mods:[${w.mods.map((m) => `'${m}'`).join(',')}]`), 'rotation in p98: ' + w.boss);
});
