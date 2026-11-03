// Runs client/ev-net.js in a sandbox with a fake browser window whose fetch is
// wired to the in-process Worker. Verifies graceful offline behaviour + sync.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { handle } from '../src/index.js';
import { makeEnv, makeInitData, gameSave } from './helpers.js';

const SRC = readFileSync(new URL('../client/ev-net.js', import.meta.url), 'utf8');

function sandbox({ env, down = { value: false }, telegram = null } = {}) {
  const ls = new Map();
  const win = {
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k) },
    location: { search: '' },
    addEventListener() {}, document: { hidden: false, addEventListener() {} },
    crypto: globalThis.crypto, console, setTimeout, clearTimeout, Promise, JSON, Date, Math, Uint8Array, AbortController, encodeURIComponent,
    Telegram: telegram ? { WebApp: telegram } : undefined,
    fetch: async (url, init) => {
      if (down.value || !env) throw new TypeError('Failed to fetch');
      return handle(new Request(url, init), env, Date.now());
    },
  };
  win.window = win;
  win.globalThis = win;
  vm.createContext(win);
  vm.runInContext(SRC, win);
  return { EVNet: win.EVNet, ls, win };
}

test('client: no baseUrl -> every call resolves offline, nothing throws', async () => {
  const { EVNet } = sandbox();
  const init = await EVNet.init({});
  assert.equal(init.ok, false);
  assert.equal(init.offline, true);
  assert.equal(init.error, 'not_configured');
  const results = await Promise.all([
    EVNet.save.pull(gameSave()), EVNet.save.push(gameSave()), EVNet.abyss.start(1), EVNet.abyss.finish('x', 3, 1000),
    EVNet.leaderboard.abyss({}), EVNet.clans.mine(), EVNet.raids.opponents(), EVNet.config.get(), EVNet.daily.claim(),
    EVNet.pay.buy('bp_s1'), EVNet.referrals.get(), EVNet.inbox.list(), EVNet.notify.schedule('forge', 100),
  ]);
  for (const r of results) assert.equal(r.ok, false, JSON.stringify(r));
  assert.ok(results.filter((r) => r.offline).length >= 12);
});

test('client: server unreachable -> offline + queued, then syncs when back', async () => {
  const env = makeEnv();
  const down = { value: true };
  const { EVNet } = sandbox({ env, down });
  const i1 = await EVNet.init({ baseUrl: 'https://api.test/' });
  assert.deepEqual([i1.ok, i1.offline, i1.error], [false, true, 'network']);
  const p = await EVNet.save.push(gameSave(), true);
  assert.equal(p.offline, true);
  assert.equal(EVNet.save.pending(), true);

  down.value = false;
  const i2 = await EVNet.init({ baseUrl: 'https://api.test' });
  assert.equal(i2.ok, true);
  assert.equal(i2.me.guest, true);
  const f = await EVNet.save.flush();
  assert.equal(f.ok, true, JSON.stringify(f));
  assert.equal(f.version, 1);
  assert.equal(EVNet.save.pending(), false);
  // Abyss run while the network drops at the end -> result queued and delivered later.
  const st = await EVNet.abyss.start(1);
  assert.equal(st.ok, true);
  down.value = true;
  const fin = await EVNet.abyss.finish(st.runId, 0, 0);
  assert.deepEqual([fin.offline, fin.queued], [true, true]);
  down.value = false;
  const fl = await EVNet.save.flush();
  assert.equal(fl.ok, true, JSON.stringify(fl));
  const cfg = await EVNet.config.get();
  assert.equal(cfg.ok, true);
  down.value = true;
  const cached = await EVNet.config.get(true);
  assert.equal(cached.offline, true);
  assert.ok(cached.products.length > 0, 'cached config served offline');
});

test('client: Telegram login + conflict resolution keeps the more progressed copy', async () => {
  const env = makeEnv();
  const initData = await makeInitData({ id: 4242, first_name: 'Клиент' });
  const a = sandbox({ env, telegram: { initData } });
  assert.equal((await a.EVNet.init({ baseUrl: 'https://api.test' })).me.guest, false);
  // Device A uploads a strong save.
  assert.equal((await a.EVNet.save.push(gameSave({ hero: { lvl: 20 } }), true)).ok, true);
  // Device B (fresh storage) has a weak local save -> server copy wins on pull.
  const b = sandbox({ env, telegram: { initData } });
  await b.EVNet.init({ baseUrl: 'https://api.test' });
  const pull = await b.EVNet.save.pull(gameSave({ hero: { lvl: 2 } }));
  assert.equal(pull.action, 'use_server');
  assert.equal(pull.data.hero.lvl, 20);
  // Device C has a stronger local save -> it overwrites the server.
  const c = sandbox({ env, telegram: { initData } });
  await c.EVNet.init({ baseUrl: 'https://api.test' });
  const pc = await c.EVNet.save.pull(gameSave({ hero: { lvl: 30 } }));
  assert.equal(pc.action, 'uploaded');
  assert.equal(pc.push.ok, true, JSON.stringify(pc.push));
  // Device A pushes stale-version data -> 409 -> default policy keeps server (lvl 30) and notifies.
  let remote = null;
  await a.EVNet.init({ baseUrl: 'https://api.test', onRemoteSave: (d) => { remote = d; } });
  const r = await a.EVNet.save.push(gameSave({ hero: { lvl: 21 } }), true);
  assert.equal(r.action, 'use_server');
  assert.equal(remote.hero.lvl, 30);
  // Payments outside Telegram's invoice API resolve cleanly.
  assert.equal((await a.EVNet.pay.buy('bp_s1')).error, 'tg_only');
});
