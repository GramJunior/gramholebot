// Clans: create/join/leave, roles, kick, feed, weekly score.
//   GET  /clans?q=            list (top by weekly score)
//   GET  /clan/me             my clan (members, feed, score)
//   GET  /clan/:id            public clan view
//   POST /clan/create { name, tag, descr?, open? }
//   POST /clan/join   { clanId, code? }
//   POST /clan/leave
//   POST /clan/role   { pid, role: 'officer'|'member'|'leader' }
//   POST /clan/kick   { pid }
//   POST /clan/edit   { descr?, open? }        (leader)
import { fail, json, readJson, int, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { clanOf, clanFeed, envInt, userByPid, newRefCode } from '../lib/common.js';
import { isoWeek, nextWeekStart } from '../lib/time.js';

const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _-]{1,22}[\p{L}\p{N}]$/u;
const TAG_RE = /^[\p{L}\p{N}]{2,5}$/u;

async function clanScore(env, clanId, week) {
  const r = await env.DB.prepare('SELECT COALESCE(SUM(w.points),0) s FROM clan_members m JOIN weekly_contrib w ON w.uid=m.uid AND w.week=? WHERE m.clan_id=?').bind(week, clanId).first();
  return r ? r.s : 0;
}

async function clanView(c, clanId, viewerUid) {
  const env = c.env;
  const clan = await env.DB.prepare('SELECT * FROM clans WHERE id=?').bind(clanId).first();
  if (!clan) fail(404, 'no_clan', 'Клан не найден');
  const week = isoWeek(c.now, env);
  const members = (await env.DB.prepare(
    `SELECT m.uid, m.role, m.joined_at, u.ref_code, u.first_name, u.power, COALESCE(w.points,0) pts FROM clan_members m
     JOIN users u ON u.id=m.uid LEFT JOIN weekly_contrib w ON w.uid=m.uid AND w.week=? WHERE m.clan_id=?
     ORDER BY CASE m.role WHEN 'leader' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END, pts DESC`
  ).bind(week, clanId).all()).results;
  const isMember = members.some((m) => m.uid === viewerUid);
  const out = {
    id: clan.id, name: clan.name, tag: clan.tag, descr: clan.descr, open: !!clan.open,
    members: members.length, maxMembers: envInt(env, 'CLAN_MAX_MEMBERS', 30),
    week, score: members.reduce((s, m) => s + m.pts, 0), resetsAt: nextWeekStart(c.now, env),
    roster: members.map((m) => ({ pid: m.ref_code, name: (m.first_name || 'Искроносец').slice(0, 32), role: m.role, power: m.power, weekly: m.pts, me: m.uid === viewerUid })),
  };
  if (isMember) {
    const me = members.find((m) => m.uid === viewerUid);
    if (me.role !== 'member') out.inviteCode = clan.invite_code;
    const names = Object.fromEntries(members.map((m) => [m.uid, (m.first_name || 'Искроносец').slice(0, 32)]));
    out.feed = (await env.DB.prepare('SELECT id, ts, type, uid, data FROM clan_feed WHERE clan_id=? ORDER BY id DESC LIMIT 50').bind(clanId).all()).results
      .map((f) => ({ id: f.id, ts: f.ts, type: f.type, name: f.uid ? names[f.uid] || 'бывший участник' : null, data: f.data ? JSON.parse(f.data) : null }));
  }
  return out;
}

export async function listClans(c) {
  const q = str(c.url.searchParams.get('q'), 24).replace(/[%_]/g, '');
  const week = isoWeek(c.now, c.env);
  const rows = (await c.env.DB.prepare(
    `SELECT c.id, c.name, c.tag, c.open, c.members, COALESCE(SUM(w.points),0) score FROM clans c
     LEFT JOIN clan_members m ON m.clan_id=c.id LEFT JOIN weekly_contrib w ON w.uid=m.uid AND w.week=?
     WHERE (? = '' OR c.name LIKE ? OR c.tag LIKE ?) GROUP BY c.id ORDER BY score DESC, c.members DESC LIMIT 50`
  ).bind(week, q, `%${q}%`, `%${q}%`).all()).results;
  return json({ ok: true, week, clans: rows.map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, tag: r.tag, open: !!r.open, members: r.members, score: r.score })) });
}

export async function myClan(c) {
  const user = await requireUser(c);
  const m = await clanOf(c.env, user.id);
  if (!m) return json({ ok: true, clan: null });
  return json({ ok: true, clan: await clanView(c, m.clan_id, user.id), role: m.role });
}

export async function getClan(c) {
  const id = int(c.params.id, 0);
  let viewer = null;
  if ((c.req.headers.get('authorization') || '').startsWith('Bearer ')) viewer = (await requireUser(c)).id;
  return json({ ok: true, clan: await clanView(c, id, viewer) });
}

export async function createClan(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 2048);
  const name = str(body.name, 24).trim();
  const tag = str(body.tag, 5).trim().toUpperCase();
  if (!NAME_RE.test(name)) fail(400, 'bad_name', 'Название: 3–24 буквы/цифры');
  if (!TAG_RE.test(tag)) fail(400, 'bad_tag', 'Тег: 2–5 букв/цифр');
  if (await clanOf(c.env, user.id)) fail(409, 'in_clan', 'Вы уже в клане');
  const key = name.toLowerCase().replace(/\s+/g, ' ').replace(/ё/g, 'е');
  const exists = await c.env.DB.prepare('SELECT id FROM clans WHERE name_key=?').bind(key).first();
  if (exists) fail(409, 'name_taken', 'Такое название уже занято');
  const r = await c.env.DB.prepare('INSERT INTO clans (name, name_key, tag, descr, open, invite_code, leader_uid, members, created_at) VALUES (?,?,?,?,?,?,?,1,?) ON CONFLICT DO NOTHING')
    .bind(name, key, tag, str(body.descr, 200), body.open === false ? 0 : 1, newRefCode(6), user.id, c.now).run();
  if (!r.meta.changes) fail(409, 'name_taken', 'Такое название уже занято');
  const clanId = r.meta.last_row_id;
  await c.env.DB.prepare("INSERT INTO clan_members (uid, clan_id, role, joined_at) VALUES (?,?,'leader',?)").bind(user.id, clanId, c.now).run();
  await clanFeed(c.env, clanId, 'created', user.id, { name }, c.now);
  return json({ ok: true, clan: await clanView(c, clanId, user.id) });
}

export async function joinClan(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  if (await clanOf(c.env, user.id)) fail(409, 'in_clan', 'Вы уже в клане');
  const clanId = int(body.clanId, 0);
  const clan = await c.env.DB.prepare('SELECT * FROM clans WHERE id=?').bind(clanId).first();
  if (!clan) fail(404, 'no_clan', 'Клан не найден');
  if (!clan.open && str(body.code, 16) !== clan.invite_code) fail(403, 'closed', 'Клан закрыт — нужен код приглашения');
  const max = envInt(c.env, 'CLAN_MAX_MEMBERS', 30);
  const r = await c.env.DB.prepare('UPDATE clans SET members=members+1 WHERE id=? AND members<?').bind(clanId, max).run();
  if (!r.meta.changes) fail(409, 'clan_full', 'В клане нет мест');
  const ins = await c.env.DB.prepare("INSERT INTO clan_members (uid, clan_id, role, joined_at) VALUES (?,?,'member',?) ON CONFLICT DO NOTHING").bind(user.id, clanId, c.now).run();
  if (!ins.meta.changes) {
    await c.env.DB.prepare('UPDATE clans SET members=members-1 WHERE id=?').bind(clanId).run();
    fail(409, 'in_clan', 'Вы уже в клане');
  }
  await clanFeed(c.env, clanId, 'joined', user.id, null, c.now);
  return json({ ok: true, clan: await clanView(c, clanId, user.id) });
}

/** Remove a member; if the leader leaves, the oldest officer (or member) takes over; empty clans are deleted. */
async function removeMember(env, clanId, uid, now, type) {
  const m = await env.DB.prepare('SELECT role FROM clan_members WHERE uid=? AND clan_id=?').bind(uid, clanId).first();
  if (!m) return;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM clan_members WHERE uid=?').bind(uid),
    env.DB.prepare('UPDATE clans SET members=members-1 WHERE id=?').bind(clanId),
  ]);
  const left = await env.DB.prepare('SELECT members FROM clans WHERE id=?').bind(clanId).first();
  if (!left || left.members <= 0) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM clans WHERE id=?').bind(clanId),
      env.DB.prepare('DELETE FROM clan_feed WHERE clan_id=?').bind(clanId),
      env.DB.prepare('DELETE FROM clan_members WHERE clan_id=?').bind(clanId),
    ]);
    return;
  }
  await clanFeed(env, clanId, type, uid, null, now);
  if (m.role === 'leader') {
    const heir = await env.DB.prepare(
      "SELECT uid FROM clan_members WHERE clan_id=? ORDER BY CASE role WHEN 'officer' THEN 0 ELSE 1 END, joined_at ASC LIMIT 1"
    ).bind(clanId).first();
    if (heir) {
      await env.DB.batch([
        env.DB.prepare("UPDATE clan_members SET role='leader' WHERE uid=?").bind(heir.uid),
        env.DB.prepare('UPDATE clans SET leader_uid=? WHERE id=?').bind(heir.uid, clanId),
      ]);
      await clanFeed(env, clanId, 'new_leader', heir.uid, null, now);
    }
  }
}

export async function leaveClan(c) {
  const user = await requireUser(c);
  const m = await clanOf(c.env, user.id);
  if (!m) fail(409, 'no_clan', 'Вы не в клане');
  await removeMember(c.env, m.clan_id, user.id, c.now, 'left');
  return json({ ok: true });
}

export async function kickMember(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  const me = await clanOf(c.env, user.id);
  if (!me || me.role === 'member') fail(403, 'no_rights', 'Недостаточно прав');
  const target = await userByPid(c.env, body.pid);
  const t = await clanOf(c.env, target.id);
  if (!t || t.clan_id !== me.clan_id || target.id === user.id) fail(404, 'not_member', 'Игрок не в вашем клане');
  if (me.role === 'officer' && t.role !== 'member') fail(403, 'no_rights', 'Офицер может исключать только участников');
  await removeMember(c.env, me.clan_id, target.id, c.now, 'kicked');
  return json({ ok: true });
}

export async function setRole(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 1024);
  const role = str(body.role, 10);
  if (!['leader', 'officer', 'member'].includes(role)) fail(400, 'bad_role', 'Роль: leader | officer | member');
  const me = await clanOf(c.env, user.id);
  if (!me || me.role !== 'leader') fail(403, 'no_rights', 'Только лидер меняет роли');
  const target = await userByPid(c.env, body.pid);
  const t = await clanOf(c.env, target.id);
  if (!t || t.clan_id !== me.clan_id || target.id === user.id) fail(404, 'not_member', 'Игрок не в вашем клане');
  if (role === 'leader') {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE clan_members SET role='leader' WHERE uid=?").bind(target.id),
      c.env.DB.prepare("UPDATE clan_members SET role='officer' WHERE uid=?").bind(user.id),
      c.env.DB.prepare('UPDATE clans SET leader_uid=? WHERE id=?').bind(target.id, me.clan_id),
    ]);
    await clanFeed(c.env, me.clan_id, 'new_leader', target.id, null, c.now);
  } else {
    await c.env.DB.prepare('UPDATE clan_members SET role=? WHERE uid=?').bind(role, target.id).run();
    await clanFeed(c.env, me.clan_id, role === 'officer' ? 'promoted' : 'demoted', target.id, null, c.now);
  }
  return json({ ok: true, clan: await clanView(c, me.clan_id, user.id) });
}

export async function editClan(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 2048);
  const me = await clanOf(c.env, user.id);
  if (!me || me.role !== 'leader') fail(403, 'no_rights', 'Только лидер');
  if (typeof body.descr === 'string') await c.env.DB.prepare('UPDATE clans SET descr=? WHERE id=?').bind(str(body.descr, 200), me.clan_id).run();
  if (typeof body.open === 'boolean') await c.env.DB.prepare('UPDATE clans SET open=? WHERE id=?').bind(body.open ? 1 : 0, me.clan_id).run();
  if (body.newCode === true) await c.env.DB.prepare('UPDATE clans SET invite_code=? WHERE id=?').bind(newRefCode(6), me.clan_id).run();
  return json({ ok: true, clan: await clanView(c, me.clan_id, user.id) });
}

export { clanScore };
