// v45.3 «Меняла» (economy v45): `market` live-config key (defaults mirror apps/emberveil/src/p108.js MK108_DEF),
// admin validation (no core / gems / keys / chests for gold), save checks stay quiet on gold spending, idle-gold analytics.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, api, loginTg, gameSave } from './helpers.js';
import { DEFAULTS, CONFIG_KEYS } from '../src/lib/config.js';
import { summarize, checkSave } from '../src/lib/savecheck.js';

const ADM = { authorization: 'Bearer test-admin-secret-0123456789' };
const T0 = Date.parse('2026-11-10T10:00:00Z');
const F = (L) => Math.pow(1.12, L - 1);

test('market: defaults (spec prices and caps), never core/sparks/keys/chests, /config exposes it, admin override validated', async () => {
  assert.ok(CONFIG_KEYS.includes('market'));
  const M = DEFAULTS.market;
  const L = M.lots;
  assert.deepEqual([L.dust.B, L.dust.g, L.dust.cap, L.dust.cap2], [25, 1.02, 50, 100]);
  assert.deepEqual([L.steel.B, L.steel.g, L.steel.cap], [14, 1.04, 30]);
  assert.deepEqual([L.mithril.B, L.mithril.g, L.mithril.cap, L.mithril.zone], [120, 1.08, 10, 6], 'mithril 10 a week from zone 6 (owner decision)');
  assert.deepEqual([L.ess.cap, L.shards.cap, L.zmat.cap, L.cingot.cap], [20, 30, 15, 3]);
  for (const x of Object.values(L)) assert.ok(!/^(core|sparks|key|frag|chest|prot|scroll)/.test(x.res), x.res);
  // spec table: first unit of dust at L20 ≈ 170, mithril at L50 ≈ 17.8k, a full week of mithril at L50 ≈ 257k
  const unit = (x, Lv, n) => Math.round(x.B * Math.pow(F(Lv), M.pow) * Math.pow(x.g, n));
  assert.equal(unit(L.dust, 20, 0), 174);
  assert.ok(Math.abs(unit(L.mithril, 50, 0) - 17800) < 300);
  const wk = Array.from({ length: 10 }, (_, n) => unit(L.mithril, 50, n)).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(wk - 257000) < 5000, String(wk));
  assert.deepEqual([M.tigel.fee, M.tigel.pow, M.tigel.dustCap, M.polish.B, M.polish.g], [150, 0.8, 20, 300, 1.5]);

  const env = makeEnv();
  const call = api(env, { now: T0 });
  let c = await call('GET', '/config');
  assert.equal(c.status, 200);
  assert.deepEqual(c.body.market, M);
  const put = await call('PUT', '/admin/config/market', { headers: ADM, raw: JSON.stringify({ lots: { dust: { B: 30, cap: 80 } }, rot: 2 }) });
  assert.equal(put.status, 200, JSON.stringify(put.body));
  c = await call('GET', '/config');
  assert.deepEqual([c.body.market.lots.dust, c.body.market.rot], [{ B: 30, cap: 80 }, 2], 'stored as is; the game merges it over its defaults');
  for (const bad of [[1], { lots: [] }, { lots: { x: { res: 'core', B: 1, g: 1, cap: 1 } } }, { lots: { x: { res: 'key_gold' } } }, { lots: { x: { res: 'chest_gold' } } },
    { lots: { x: { res: 'sparks' } } }, { lots: { dust: { B: -1 } } }, { lots: { dust: { g: 0.5 } } }, { lots: { dust: { cap: 1.5 } } }]) {
    const r = await call('PUT', '/admin/config/market', { headers: ADM, raw: JSON.stringify(bad) });
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
});

test('market: gold spending (Меняла, Тигель, Шлифовка) never trips save checks; bought shards/dust stay under the gain caps', async () => {
  const prev = summarize(gameSave({ res: { gold: 3_000_000, shards: 100, ess: 500 }, hero: { lvl: 45 } }));
  // a week of Меняла at L45 in 10 minutes: −2.4M gold, +30 shards, +30 essence (bulk), dust/steel/mithril are not checked
  const next = summarize(gameSave({ res: { gold: 600_000, shards: 130, ess: 530, dust: 999 }, hero: { lvl: 45 } }));
  const r = checkSave(prev, next, { elapsedMs: 10 * 60000 });
  assert.deepEqual(r, { hard: [], soft: [] });
  // the «Большая ярмарка» double week (+60 shards) right after the first upload grace is fine too
  const r2 = checkSave(prev, summarize(gameSave({ res: { gold: 0, shards: 160, ess: 500 }, hero: { lvl: 45 } })), { elapsedMs: 0 });
  assert.deepEqual(r2.soft, []);
});

test('analytics: idle gold by level band (eco_gidle:<band>) in /admin/stats goldIdle', async () => {
  const env = makeEnv();
  const clock = { now: T0 };
  const call = api(env, clock);
  const a = await loginTg(call, 2601, 'A');
  const b = await loginTg(call, 2602, 'B');
  const send = (s, events) => call('POST', '/events', { token: s.token, body: { sess: 1, sec: 60, events } });
  assert.equal((await send(a, [{ e: 'eco_gidle', k: 'l31_40', v: 600000 }, { e: 'eco_bal', k: 'gold', v: 600000 }])).status, 200);
  await send(b, [{ e: 'eco_gidle', k: 'l31_40', v: 200000 }, { e: 'eco_gidle', k: 'l11_20', v: 9000 }]);
  const s = (await call('GET', '/admin/stats?days=7', { headers: ADM })).body;
  assert.deepEqual(s.goldIdle, [{ band: 'l11_20', reports: 1, users: 1, avg: 9000 }, { band: 'l31_40', reports: 2, users: 2, avg: 400000 }]);
  assert.ok(!s.economy.some((e) => e.res === 'l31_40'), 'not mixed into eco_in / eco_out');
});
