// Async village raids (PvP-lite). The defender never loses resources: loot is
// minted by the server, the defender gets a raid log, a shield and a revenge option.
//   PUT  /village         { power, hall, bld:{...}, layout:[...], hero:{lvl,...}, pets:[...] }
//   GET  /raid/opponents  -> up to 3 matchmade opponents by power band
//   POST /raid/start      { pid } | { revengeOf: raidId }  -> { raidId, snapshot, defender }
//   POST /raid/finish     { raidId, stars, pct, timeMs }   -> { reward }
//   GET  /raid/log        -> { incoming:[...], outgoing:[...], today:{used,limit} }
import { fail, json, readJson, int, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { checkRaid, raidReward, POWER_BANDS } from '../lib/anticheat.js';
import { getConfigKey, loadConfig } from '../lib/config.js';
import { dayKey, nextDayStart } from '../lib/time.js';
import { addContrib, addBpXp, audit, clanOf, clanFeed, envInt, userByPid, newRunId, pub, queueNotification, NAME_SQL } from '../lib/common.js';

const BUILDINGS = ['hall', 'forge', 'alch', 'pen', 'tavern', 'temple', 'store', 'walls', 'saw', 'mine', 'well', 'houses'];
const MAX_POWER = 10_000_000;

/** Validate and normalise a village snapshot. Throws 400 on garbage. */
export function cleanSnapshot(b) {
  const bld = {};
  for (const k of BUILDINGS) {
    const v = int(b.bld && b.bld[k], 0);
    if (v < 0 || v > 5) fail(400, 'bad_snapshot', 'Уровень здания вне 0..5');
    bld[k] = v;
  }
  if (bld.hall < 1) fail(400, 'bad_snapshot', 'Нет ратуши');
  for (const k of BUILDINGS) if (k !== 'hall' && bld[k] > bld.hall) fail(400, 'bad_snapshot', 'Здание выше ратуши');
  const power = int(b.power, 0);
  if (power < 0 || power > MAX_POWER) fail(400, 'bad_snapshot', 'Неверная сила');
  const layout = Array.isArray(b.layout) ? b.layout.slice(0, 64) : [];
  const hero = b.hero && typeof b.hero === 'object' ? b.hero : {};
  const lvl = int(hero.lvl, 1);
  if (lvl < 1 || lvl > 50) fail(400, 'bad_snapshot', 'Неверный уровень героя');
  const snap = { bld, layout, hero: { ...hero, lvl }, pets: Array.isArray(b.pets) ? b.pets.slice(0, 2) : [], power };
  if (JSON.stringify(snap).length > 16 * 1024) fail(413, 'too_large', 'Снимок деревни слишком большой');
  return snap;
}

export async function putVillage(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 20 * 1024);
  const snap = cleanSnapshot(body);
  await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO villages (uid, power, hall, data, updated_at) VALUES (?,?,?,?,?)
      ON CONFLICT(uid) DO UPDATE SET power=excluded.power, hall=excluded.hall, data=excluded.data, updated_at=excluded.updated_at`)
      .bind(user.id, snap.power, snap.bld.hall, JSON.stringify(snap), c.now),
    c.env.DB.prepare('UPDATE users SET power=? WHERE id=?').bind(snap.power, user.id),
  ]);
  return json({ ok: true, power: snap.power });
}

async function usedToday(c, uid) {
  const r = await c.env.DB.prepare('SELECT COUNT(*) n FROM raids WHERE attacker=? AND day=? AND revenge_of IS NULL').bind(uid, dayKey(c.now, c.env)).first();
  return r ? r.n : 0;
}

/**
 * Matchmaking: widen the power band until we have up to 3 candidates.
 * Excludes self, banned, shielded, own clan, inactive (>14 d) and anyone raided by me in the last 24 h.
 */
export async function findOpponents(env, uid, power, now, n = 3) {
  const clan = await clanOf(env, uid);
  const found = new Map();
  for (const [lo, hi] of POWER_BANDS) {
    if (found.size >= n) break;
    const rows = (await env.DB.prepare(
      `SELECT v.uid, v.power, v.hall, u.ref_code, ${NAME_SQL} FROM villages v JOIN users u ON u.id=v.uid
       WHERE v.uid<>? AND u.banned=0 AND v.shield_until<=? AND v.updated_at>=? AND v.power BETWEEN ? AND ?
       AND v.uid NOT IN (SELECT uid FROM clan_members WHERE clan_id=?)
       AND v.uid NOT IN (SELECT defender FROM raids WHERE attacker=? AND started_at>=?)
       ORDER BY RANDOM() LIMIT ?`
    ).bind(uid, now, now - 14 * 86400000, Math.floor(power * lo), Math.ceil(power * hi), clan ? clan.clan_id : -1, uid, now - 86400000, n * 2).all()).results;
    for (const r of rows) if (found.size < n && !found.has(r.uid)) found.set(r.uid, r);
  }
  return [...found.values()];
}

export async function opponents(c) {
  const user = await requireUser(c);
  const v = await c.env.DB.prepare('SELECT power FROM villages WHERE uid=?').bind(user.id).first();
  if (!v) fail(409, 'no_village', 'Сначала опубликуйте свою деревню (PUT /village)');
  const list = await findOpponents(c.env, user.id, v.power, c.now);
  return json({
    ok: true,
    opponents: list.map((r) => ({ pid: r.ref_code, name: (r.first_name || 'Искроносец').slice(0, 32), power: r.power, hall: r.hall })),
    today: { used: await usedToday(c, user.id), limit: envInt(c.env, 'RAID_DAILY_LIMIT', 5), resetsAt: nextDayStart(c.now, c.env) },
  });
}

export async function raidStart(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  const cfg = await getConfigKey(c.env, 'raid');
  const mine = await c.env.DB.prepare('SELECT power FROM villages WHERE uid=?').bind(user.id).first();
  if (!mine) fail(409, 'no_village', 'Сначала опубликуйте свою деревню');
  let defender, revengeOf = null;
  if (body.revengeOf) {
    const orig = await c.env.DB.prepare('SELECT * FROM raids WHERE id=?').bind(str(body.revengeOf, 64)).first();
    if (!orig || orig.defender !== user.id || orig.status !== 'done') fail(404, 'no_raid', 'Набег не найден');
    if (orig.revenged) fail(409, 'revenged', 'Месть уже свершилась');
    if (c.now - orig.finished_at > (cfg.revengeHours || 48) * 3600000) fail(409, 'revenge_expired', 'Время для мести вышло');
    defender = await c.env.DB.prepare('SELECT * FROM users WHERE id=?').bind(orig.attacker).first();
    revengeOf = orig.id;
  } else {
    defender = await userByPid(c.env, body.pid);
    if (defender.id === user.id) fail(400, 'self', 'Нельзя напасть на себя');
    if (await usedToday(c, user.id) >= envInt(c.env, 'RAID_DAILY_LIMIT', 5)) fail(429, 'raid_limit', 'Набеги на сегодня закончились');
  }
  const v = await c.env.DB.prepare('SELECT * FROM villages WHERE uid=?').bind(defender.id).first();
  if (!v || defender.banned) fail(404, 'no_village', 'Деревня не найдена');
  if (!revengeOf && v.shield_until > c.now) fail(409, 'shielded', 'Деревня под защитным щитом');
  const id = newRunId();
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE raids SET status='rejected' WHERE attacker=? AND status='open'").bind(user.id),
    c.env.DB.prepare("INSERT INTO runs (id, uid, kind, started_at) VALUES (?,?,'raid',?)").bind(id, user.id, c.now),
    c.env.DB.prepare('INSERT INTO raids (id, attacker, defender, att_power, def_power, snapshot, revenge_of, started_at, day) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(id, user.id, defender.id, mine.power, v.power, v.data, revengeOf, c.now, dayKey(c.now, c.env)),
  ]);
  return json({ ok: true, raidId: id, defender: { ...pub(defender), power: v.power, hall: v.hall }, snapshot: JSON.parse(v.data), revenge: !!revengeOf, serverTime: c.now });
}

export async function raidFinish(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 2048);
  const raid = await c.env.DB.prepare('SELECT * FROM raids WHERE id=?').bind(str(body.raidId, 64)).first();
  if (!raid || raid.attacker !== user.id) fail(404, 'no_raid', 'Набег не найден');
  if (raid.status !== 'open') fail(409, 'raid_closed', 'Набег уже завершён');
  const stars = int(body.stars, -1), pct = int(body.pct, -1), timeMs = int(body.timeMs, -1);
  const chk = checkRaid({ startedAt: raid.started_at, now: c.now, stars, pct, timeMs, attPower: raid.att_power, defPower: raid.def_power, env: c.env });
  const cfgAll = await loadConfig(c.env);
  const cfg = cfgAll.raid;
  const reward = chk.ok ? raidReward(cfg, JSON.parse(raid.snapshot).bld.hall, stars, !!raid.revenge_of) : {};
  const upd = await c.env.DB.prepare("UPDATE raids SET status=?, finished_at=?, stars=?, pct=?, reward=? WHERE id=? AND status='open'")
    .bind(chk.ok ? 'done' : 'rejected', c.now, chk.ok ? stars : 0, chk.ok ? pct : 0, JSON.stringify(reward), raid.id).run();
  if (!upd.meta.changes) fail(409, 'raid_closed', 'Набег уже завершён');
  await c.env.DB.prepare("UPDATE runs SET status=?, finished_at=? WHERE id=?").bind(chk.ok ? 'done' : 'rejected', c.now, raid.id).run();
  if (!chk.ok) {
    await audit(c.env, user.id, 'raid_rejected', { stars, pct, timeMs, reason: chk.reason }, c.now);
    fail(422, 'raid_rejected', 'Результат набега не прошёл проверку', { reason: chk.reason });
  }
  if (raid.revenge_of) await c.env.DB.prepare('UPDATE raids SET revenged=1 WHERE id=?').bind(raid.revenge_of).run();
  if (stars >= 1) {
    await c.env.DB.prepare('UPDATE villages SET shield_until=MAX(shield_until, ?) WHERE uid=?').bind(c.now + (cfg.shieldHours || 4) * 3600000, raid.defender).run();
  }
  await addContrib(c.env, user.id, stars * 3, c.now);
  if (stars === 0) await addContrib(c.env, raid.defender, 2, c.now); // successful defence
  await addBpXp(c.env, user.id, stars * ((cfgAll.battlepass.xp && cfgAll.battlepass.xp.raidStar) || 0), c.now, cfgAll);
  await queueNotification(c.env, raid.defender, 'raid', c.now);
  if (stars === 3) {
    const clan = await clanOf(c.env, user.id);
    if (clan) await clanFeed(c.env, clan.clan_id, 'raid_win', user.id, { stars, revenge: !!raid.revenge_of }, c.now);
  }
  return json({ ok: true, stars, pct, reward });
}

export async function raidLog(c) {
  const user = await requireUser(c);
  const cfg = await getConfigKey(c.env, 'raid');
  const q = (col) => c.env.DB.prepare(
    `SELECT r.*, u.ref_code, ${NAME_SQL} FROM raids r JOIN users u ON u.id=r.${col === 'defender' ? 'attacker' : 'defender'}
     WHERE r.${col}=? AND r.status='done' ORDER BY r.finished_at DESC LIMIT 20`
  ).bind(user.id).all();
  const inc = (await q('defender')).results, out = (await q('attacker')).results;
  const map = (r, incoming) => ({
    raidId: r.id, at: r.finished_at, stars: r.stars, pct: r.pct, revenge: !!r.revenge_of,
    opponent: { pid: r.ref_code, name: (r.first_name || 'Искроносец').slice(0, 32) },
    ...(incoming
      ? { canRevenge: !r.revenged && c.now - r.finished_at <= (cfg.revengeHours || 48) * 3600000, revenged: !!r.revenged }
      : { reward: JSON.parse(r.reward || '{}') }),
  });
  return json({
    ok: true,
    incoming: inc.map((r) => map(r, true)),
    outgoing: out.map((r) => map(r, false)),
    today: { used: await usedToday(c, user.id), limit: envInt(c.env, 'RAID_DAILY_LIMIT', 5), resetsAt: nextDayStart(c.now, c.env) },
  });
}
