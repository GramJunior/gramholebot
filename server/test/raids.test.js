import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRaid, raidReward } from '../src/lib/anticheat.js';
import { DEFAULTS } from '../src/lib/config.js';
import { makeEnv, api, loginTg } from './helpers.js';

const village = (power, hall = 3, over = {}) => ({
  power, hall, bld: { hall, forge: Math.min(2, hall), walls: hall, saw: 1 }, layout: [{ t: 'tower', x: 1, z: 2 }], hero: { lvl: 10, weapon: 'sword' }, pets: ['wolf'], ...over,
});

test('raid plausibility rules', () => {
  const b = { startedAt: 0, now: 90000, timeMs: 85000, attPower: 1000, defPower: 1000, env: {} };
  assert.equal(checkRaid({ ...b, stars: 3, pct: 100 }).ok, true);
  assert.equal(checkRaid({ ...b, stars: 3, pct: 90 }).reason, 'stars_mismatch');
  assert.equal(checkRaid({ ...b, stars: 0, pct: 100 }).reason, 'stars_mismatch');
  assert.equal(checkRaid({ ...b, stars: 2, pct: 10 }).reason, 'stars_mismatch');
  assert.equal(checkRaid({ ...b, stars: 1, pct: 40, now: 5000, timeMs: 4000 }).reason, 'too_fast');
  assert.equal(checkRaid({ ...b, stars: 1, pct: 40, timeMs: 500000 }).reason, 'time_mismatch');
  assert.equal(checkRaid({ ...b, stars: 1, pct: 40, now: 3600000 }).reason, 'expired');
  assert.equal(checkRaid({ ...b, stars: 3, pct: 100, attPower: 300 }).reason, 'implausible_power');
  assert.equal(checkRaid({ ...b, stars: 4, pct: 100 }).reason, 'bad_stars');
  assert.deepEqual(raidReward(DEFAULTS.raid, 3, 3, false), { gold: 432, wood: 216, ore: 108 });
  assert.deepEqual(raidReward(DEFAULTS.raid, 1, 0, false), { gold: 18, wood: 9, ore: 5 });
});

test('matchmaking by power band excludes self, clanmates, shielded and recently raided', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const me = await loginTg(call, 100, 'Я');
  await call('PUT', '/village', { token: me.token, body: village(1000) });
  const users = {};
  for (const [id, p] of [[101, 950], [102, 1100], [103, 1200], [104, 5000], [105, 100], [106, 1000]]) {
    users[id] = await loginTg(call, id, 'P' + id);
    assert.equal((await call('PUT', '/village', { token: users[id].token, body: village(p) })).status, 200);
  }
  // 106 is my clanmate -> excluded.
  const cl = await call('POST', '/clan/create', { token: me.token, body: { name: 'Угли', tag: 'UGL' } });
  await call('POST', '/clan/join', { token: users[106].token, body: { clanId: cl.body.clan.id } });

  const o = await call('GET', '/raid/opponents', { token: me.token });
  assert.equal(o.status, 200);
  const powers = o.body.opponents.map((x) => x.power).sort((a, b) => a - b);
  assert.deepEqual(powers, [950, 1100, 1200], 'closest band first, clanmate excluded');
  assert.ok(!o.body.opponents.some((x) => x.pid === me.me.pid));

  // Raid 102, then it is excluded for 24h (and shielded after a star).
  const st = await call('POST', '/raid/start', { token: me.token, body: { pid: users[102].me.pid } });
  assert.equal(st.status, 200);
  assert.equal(st.body.snapshot.bld.hall, 3);
  clock.now += 60000;
  const fin = await call('POST', '/raid/finish', { token: me.token, body: { raidId: st.body.raidId, stars: 2, pct: 70, timeMs: 55000 } });
  assert.equal(fin.status, 200);
  assert.ok(fin.body.reward.gold > 0);
  const o2 = await call('GET', '/raid/opponents', { token: me.token });
  assert.ok(!o2.body.opponents.some((x) => x.power === 1100));
  assert.equal(o2.body.opponents.length, 3, 'band widened to fill');
  // Others see 102 as shielded.
  const other = await call('POST', '/raid/start', { token: users[101].token, body: { pid: users[102].me.pid } });
  assert.equal(other.status, 409);
  assert.equal(other.body.error, 'shielded');
});

test('raid validation, single-use token, defender log + revenge, daily limit', async () => {
  const env = makeEnv({ RAID_DAILY_LIMIT: '2' });
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const att = await loginTg(call, 200, 'Атакующий');
  const def = await loginTg(call, 201, 'Защитник');
  const d2 = await loginTg(call, 202, 'Второй');
  for (const u of [att, def, d2]) await call('PUT', '/village', { token: u.token, body: village(1000) });

  assert.equal((await call('POST', '/raid/start', { token: att.token, body: { pid: att.me.pid } })).status, 400, 'no self raid');

  // Implausible: finishing in 3 s.
  const r1 = await call('POST', '/raid/start', { token: att.token, body: { pid: def.me.pid } });
  clock.now += 3000;
  const bad = await call('POST', '/raid/finish', { token: att.token, body: { raidId: r1.body.raidId, stars: 3, pct: 100, timeMs: 3000 } });
  assert.equal(bad.status, 422);
  assert.equal(bad.body.reason, 'too_fast');
  assert.equal((await call('POST', '/raid/finish', { token: att.token, body: { raidId: r1.body.raidId, stars: 1, pct: 50, timeMs: 3000 } })).status, 409, 'token used up');

  // Valid 3-star raid on d2.
  const r2 = await call('POST', '/raid/start', { token: att.token, body: { pid: d2.me.pid } });
  clock.now += 120000;
  const ok = await call('POST', '/raid/finish', { token: att.token, body: { raidId: r2.body.raidId, stars: 3, pct: 100, timeMs: 110000 } });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.reward, raidReward(DEFAULTS.raid, 3, 3, false));

  // Daily limit (2) reached — every *started* raid counts.
  const lim = await call('POST', '/raid/start', { token: att.token, body: { pid: def.me.pid } });
  assert.equal(lim.status, 429);

  // Defender sees the raid and takes revenge (not limited by daily cap, ignores shield).
  const log = await call('GET', '/raid/log', { token: d2.token });
  assert.equal(log.body.incoming.length, 1);
  assert.equal(log.body.incoming[0].opponent.name, 'Атакующий');
  assert.equal(log.body.incoming[0].canRevenge, true);
  const rv = await call('POST', '/raid/start', { token: d2.token, body: { revengeOf: log.body.incoming[0].raidId } });
  assert.equal(rv.status, 200);
  assert.equal(rv.body.revenge, true);
  clock.now += 90000;
  const rvf = await call('POST', '/raid/finish', { token: d2.token, body: { raidId: rv.body.raidId, stars: 1, pct: 55, timeMs: 80000 } });
  assert.equal(rvf.status, 200);
  assert.deepEqual(rvf.body.reward, raidReward(DEFAULTS.raid, 3, 1, true));
  const again = await call('POST', '/raid/start', { token: d2.token, body: { revengeOf: log.body.incoming[0].raidId } });
  assert.equal(again.status, 409);
  assert.equal(again.body.error, 'revenged');

  // A "raid" notification was queued for the defender.
  const n = await env.DB.prepare("SELECT COUNT(*) n FROM notifications WHERE uid='t202' AND kind='raid'").first();
  assert.equal(n.n, 1);

  // Next game day: limit resets.
  clock.now = Date.parse('2026-11-04T21:05:00Z'); // 00:05 MSK next day
  const att2 = await loginTg(call, 200, 'Атакующий'); // sessions last 6 h
  const next = await call('GET', '/raid/opponents', { token: att2.token });
  assert.equal(next.body.today.used, 0);

  // Garbage snapshots are refused.
  assert.equal((await call('PUT', '/village', { token: att2.token, body: village(1000, 2, { bld: { hall: 2, forge: 5 } }) })).status, 400);
});
