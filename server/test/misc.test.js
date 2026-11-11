import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeEnv, api, loginTg, mockTelegram } from './helpers.js';
import { runCron } from '../src/routes/bot.js';
import { shopRotation, DEFAULTS } from '../src/lib/config.js';

test('schema.sql equals migrations/0001_init.sql', () => {
  const a = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  const b = readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8');
  assert.equal(a, b);
});

test('clans: create/join/roles/kick/leave, size limit, weekly score, feed', async () => {
  const env = makeEnv({ CLAN_MAX_MEMBERS: '3' });
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const [l, o, m, x] = [await loginTg(call, 1, 'Лидер'), await loginTg(call, 2, 'Офицер'), await loginTg(call, 3, 'Боец'), await loginTg(call, 4, 'Лишний')];
  const c = await call('POST', '/clan/create', { token: l.token, body: { name: 'Пепел Брода', tag: 'ash' } });
  assert.equal(c.status, 200, JSON.stringify(c.body));
  const id = c.body.clan.id;
  assert.equal(c.body.clan.tag, 'ASH');
  assert.equal((await call('POST', '/clan/create', { token: o.token, body: { name: 'пепел брода', tag: 'X1' } })).status, 409, 'name unique, case-insensitive');
  assert.equal((await call('POST', '/clan/create', { token: o.token, body: { name: '<b>', tag: 'X1' } })).status, 400);
  await call('POST', '/clan/join', { token: o.token, body: { clanId: id } });
  await call('POST', '/clan/join', { token: m.token, body: { clanId: id } });
  const full = await call('POST', '/clan/join', { token: x.token, body: { clanId: id } });
  assert.equal(full.status, 409);
  assert.equal(full.body.error, 'clan_full');

  assert.equal((await call('POST', '/clan/role', { token: o.token, body: { pid: m.me.pid, role: 'officer' } })).status, 403, 'only leader sets roles');
  assert.equal((await call('POST', '/clan/role', { token: l.token, body: { pid: o.me.pid, role: 'officer' } })).status, 200);
  assert.equal((await call('POST', '/clan/kick', { token: m.token, body: { pid: o.me.pid } })).status, 403);

  // Contributions: abyss floors count for the clan this week.
  for (const [u, floor] of [[l, 4], [o, 6]]) {
    const s = await call('POST', '/abyss/start', { token: u.token, body: {} });
    clock.now += 5 * 60000;
    await call('POST', '/abyss/finish', { token: u.token, body: { runId: s.body.runId, floor, timeMs: 280000 } });
  }
  let my = await call('GET', '/clan/me', { token: m.token });
  assert.equal(my.body.clan.score, 10);
  assert.equal(my.body.clan.inviteCode, undefined, 'members do not see invite code');
  assert.ok(my.body.clan.feed.some((f) => f.type === 'abyss_record' && f.data.floor === 6));

  // Officer kicks member, leader leaves -> officer becomes leader.
  assert.equal((await call('POST', '/clan/kick', { token: o.token, body: { pid: m.me.pid } })).status, 200);
  assert.equal((await call('POST', '/clan/leave', { token: l.token })).status, 200);
  my = await call('GET', '/clan/me', { token: o.token });
  assert.equal(my.body.role, 'leader');
  assert.equal(my.body.clan.members, 1);
  assert.equal(my.body.clan.score, 6, 'score = current members only');
  const types = my.body.clan.feed.map((f) => f.type);
  for (const t of ['created', 'joined', 'promoted', 'kicked', 'left', 'new_leader']) assert.ok(types.includes(t), t);
  const list = await call('GET', '/clans');
  assert.equal(list.body.clans[0].name, 'Пепел Брода');
  // Last member leaves -> clan deleted.
  await call('POST', '/clan/leave', { token: o.token });
  assert.equal((await call('GET', '/clan/' + id)).status, 404);
});

test('daily reward: server day, streak, no double claim, clock cheating impossible', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  let s = await loginTg(call, 50);
  const d1 = await call('POST', '/daily/claim', { token: s.token });
  assert.equal(d1.status, 200);
  assert.deepEqual([d1.body.streak, d1.body.reward], [1, DEFAULTS.daily.rewards[0]]);
  assert.equal((await call('POST', '/daily/claim', { token: s.token, headers: { date: 'Fri, 01 Jan 2100 00:00:00 GMT' } })).status, 409);
  clock.now += 86400000;
  assert.equal((await call('POST', '/daily/claim', { token: s.token })).status, 401, 'session (6h) expired');
  s = await loginTg(call, 50);
  assert.equal((await call('POST', '/daily/claim', { token: s.token })).body.streak, 2);
  clock.now += 3 * 86400000; // missed days -> streak resets
  s = await loginTg(call, 50);
  assert.equal((await call('POST', '/daily/claim', { token: s.token })).body.streak, 1);
  const g = await call('GET', '/daily', { token: s.token });
  assert.equal(g.body.canClaim, false);

  assert.equal((await call('POST', '/quests/claim', { token: s.token, body: { questId: 'd_kill' } })).status, 200);
  assert.equal((await call('POST', '/quests/claim', { token: s.token, body: { questId: 'd_kill' } })).status, 409);
  assert.equal((await call('POST', '/quests/claim', { token: s.token, body: { questId: 'd_hack' } })).status, 400);
  assert.equal((await call('POST', '/quests/claim', { token: s.token, body: { questId: 'd_boss', day: '2020-01-01' } })).status, 409);
});

test('config + admin + battle pass claims', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const admin = { authorization: 'Bearer ' + env.ADMIN_SECRET };
  assert.equal((await call('PUT', '/admin/config/events', { body: [] })).status, 401);
  assert.equal((await call('PUT', '/admin/config/events', { headers: { authorization: 'Bearer wrong' }, body: [] })).status, 401);
  assert.equal((await call('PUT', '/admin/config/events', { headers: admin, body: [{ id: 'x' }] })).status, 400);
  const ev = [{ id: 'ember_week', name: 'Неделя Угля', start: clock.now - 1000, end: clock.now + 86400000, modifiers: { goldMul: 1.5 } },
    { id: 'later', name: 'Потом', start: clock.now + 5 * 86400000, end: clock.now + 6 * 86400000 }];
  assert.equal((await call('PUT', '/admin/config/events', { headers: admin, body: ev })).status, 200);
  const cfg = await call('GET', '/config');
  assert.deepEqual(cfg.body.events.map((e) => e.id), ['ember_week']);
  assert.deepEqual(cfg.body.upcoming.map((e) => e.id), ['later']);
  assert.equal(cfg.body.shop.items.length, 4);
  assert.match(cfg.headers.get('cache-control'), /max-age/);
  // Shop rotation is deterministic within a bucket and changes across buckets.
  const r1 = shopRotation(DEFAULTS.shop, clock.now), r2 = shopRotation(DEFAULTS.shop, clock.now + 1000);
  assert.deepEqual(r1, r2);

  const s = await loginTg(call, 60);
  await env.DB.prepare("INSERT INTO bp_progress (uid, season, xp) VALUES ('t60','s1',450)").run();
  const bp = await call('GET', '/bp', { token: s.token });
  assert.equal(bp.body.tier, 2); // v40: 200 XP per tier
  assert.equal(bp.body.xpPerTier, 200);
  assert.equal((await call('POST', '/bp/claim', { token: s.token, body: { tier: 1, track: 'free' } })).status, 200);
  assert.equal((await call('POST', '/bp/claim', { token: s.token, body: { tier: 1, track: 'free' } })).status, 409);
  assert.equal((await call('POST', '/bp/claim', { token: s.token, body: { tier: 3, track: 'free' } })).status, 409);
  assert.equal((await call('POST', '/bp/claim', { token: s.token, body: { tier: 1, track: 'premium' } })).status, 402);
  await call('POST', '/admin/grant', { headers: admin, body: { pid: s.me.pid, productId: 'bp_s1', qty: 1 } });
  assert.equal((await call('POST', '/bp/claim', { token: s.token, body: { tier: 1, track: 'premium' } })).status, 200);
  const st = await call('GET', '/admin/stats', { headers: admin });
  assert.equal(st.body.users, 1);
});

test('cron reminders: opt-in only, rate limited, blocked bot disables', async () => {
  const env = makeEnv({ NOTIFY_MAX_PER_DAY: '2', NOTIFY_MIN_GAP_MIN: '30' });
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const tg = mockTelegram({ sendMessage: (p) => (p.chat_id === 72 ? { __error: 'Forbidden: bot was blocked by the user', code: 403 } : { message_id: 1 }) });
  try {
    const a = await loginTg(call, 70, 'Согласен');
    const b = await loginTg(call, 71, 'Против');
    const c = await loginTg(call, 72, 'Заблокировал');
    await call('POST', '/me/settings', { token: a.token, body: { notify: true } });
    await call('POST', '/me/settings', { token: c.token, body: { notify: true } });
    const off = await call('POST', '/notify/schedule', { token: b.token, body: { kind: 'forge', inSec: 120 } });
    assert.equal(off.body.scheduled, false);
    assert.equal((await call('POST', '/notify/schedule', { token: a.token, body: { kind: 'forge', inSec: 5 } })).status, 400);
    assert.equal((await call('POST', '/notify/schedule', { token: a.token, body: { kind: 'forge', inSec: 120 } })).body.scheduled, true);
    await call('POST', '/notify/schedule', { token: a.token, body: { kind: 'hatch', inSec: 120 } });
    await call('POST', '/notify/schedule', { token: c.token, body: { kind: 'forge', inSec: 120 } });

    let r = await runCron(env, clock.now); // nothing due yet
    assert.deepEqual(r, { sent: 0, dropped: 0 });
    clock.now += 5 * 60000;
    r = await runCron(env, clock.now);
    // a: forge sent, hatch dropped (one per user per run / min gap); c: send fails -> dropped & can_pm=0
    assert.deepEqual(r, { sent: 1, dropped: 2 });
    const sent = tg.calls.filter((x) => x.method === 'sendMessage' && x.params.chat_id === 70);
    assert.match(sent[0].params.text, /Кузница/);
    assert.equal((await env.DB.prepare("SELECT can_pm FROM users WHERE id='t72'").first()).can_pm, 0);
    // Gap rule: a new reminder 10 min later is dropped; after 30 min it's sent; then the daily cap (2) applies.
    for (const [delay, expectSent] of [[10, 0], [40, 1], [80, 0]]) {
      await call('POST', '/notify/schedule', { token: a.token, body: { kind: 'income', inSec: 60 } });
      clock.now += delay * 60000;
      r = await runCron(env, clock.now);
      assert.equal(r.sent, expectSent, 'delay ' + delay);
    }
  } finally { tg.restore(); }
});

test('CORS, 404, health', async () => {
  const env = makeEnv({ ALLOWED_ORIGINS: 'https://game.example' });
  const call = api(env);
  const h = await call('GET', '/health', { headers: { origin: 'https://game.example' } });
  assert.equal(h.status, 200);
  assert.equal(h.headers.get('access-control-allow-origin'), 'https://game.example');
  const h2 = await call('GET', '/health', { headers: { origin: 'https://evil.example' } });
  assert.equal(h2.headers.get('access-control-allow-origin'), null);
  assert.equal((await call('GET', '/nope')).status, 404);
  assert.equal((await call('DELETE', '/save')).status, 405);
});

test('DELETE /me erases personal data', async () => {
  const env = makeEnv();
  const call = api(env);
  const s = await loginTg(call, 80, 'Удалите');
  await call('PUT', '/save', { token: s.token, body: { baseVersion: 0, data: { v: 1, created: 1, hero: { lvl: 1 } } } });
  assert.equal((await call('DELETE', '/me', { token: s.token })).status, 200);
  const u = await env.DB.prepare("SELECT first_name, username FROM users WHERE id='t80'").first();
  assert.deepEqual(u, { first_name: '', username: null });
  assert.equal((await env.DB.prepare("SELECT COUNT(*) n FROM saves WHERE uid='t80'").first()).n, 0);
});

test('migration 0006 (game v40): pass XP ×2 — same tier at 200 XP per tier', async () => {
  const env = makeEnv();
  const clock = { now: Date.parse('2026-11-04T10:00:00Z') };
  const call = api(env, clock);
  const s = await loginTg(call, 61);
  await env.DB.prepare("INSERT INTO bp_progress (uid, season, xp) VALUES ('t61','s1',350)").run(); // old: tier 3 at 100/tier
  const sql = readFileSync(new URL('../migrations/0006_pass_v40.sql', import.meta.url), 'utf8').split('\n').filter((l) => !l.startsWith('--')).join('\n').trim();
  await env.DB.prepare(sql).run();
  const bp = await call('GET', '/bp', { token: s.token });
  assert.equal(bp.body.xp, 700);
  assert.equal(bp.body.tier, 3);
});
