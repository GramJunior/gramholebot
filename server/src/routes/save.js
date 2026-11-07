// Cloud save: optimistic concurrency with a server version number.
//
//   GET  /save                       -> { version, updatedAt, data } (version 0 = no save yet)
//   PUT  /save { baseVersion, data, overwrite? }
//        baseVersion must equal the server's current version; otherwise 409 with the
//        server copy, and the client decides (keep server / overwrite with local).
//        On success version = baseVersion + 1 and updatedAt = server time.
import { fail, json, readJson } from '../lib/http.js';
import { requireUser } from './auth.js';
import { summarize, checkSave } from '../lib/savecheck.js';
import { audit, envInt } from '../lib/common.js';

export async function getSave(c) {
  const user = await requireUser(c);
  const r = await c.env.DB.prepare('SELECT version, data, updated_at FROM saves WHERE uid=?').bind(user.id).first();
  if (!r) return json({ ok: true, version: 0, updatedAt: 0, data: null, serverTime: c.now });
  return json({ ok: true, version: r.version, updatedAt: r.updated_at, data: JSON.parse(r.data), serverTime: c.now });
}

function conflict(cur) {
  return json({
    ok: false, error: 'conflict', message: 'На сервере более новое сохранение',
    server: cur ? { version: cur.version, updatedAt: cur.updated_at, data: JSON.parse(cur.data) } : { version: 0, updatedAt: 0, data: null },
  }, 409);
}

export async function putSave(c) {
  const user = await requireUser(c);
  const maxBytes = envInt(c.env, 'MAX_SAVE_BYTES', 256 * 1024);
  const body = await readJson(c.req, maxBytes + 4096);
  const base = Number(body.baseVersion);
  if (!Number.isInteger(base) || base < 0) fail(400, 'bad_version', 'Нужен baseVersion');
  const data = body.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'bad_data', 'Нет данных сохранения');
  const text = JSON.stringify(data);
  if (text.length > maxBytes) fail(413, 'too_large', 'Сохранение слишком большое');

  const cur = await c.env.DB.prepare('SELECT version, data, summary, updated_at FROM saves WHERE uid=?').bind(user.id).first();
  if ((cur ? cur.version : 0) !== base) return conflict(cur);

  const next = summarize(data);
  const prev = cur ? JSON.parse(cur.summary) : null;
  const vb = await c.env.DB.prepare("SELECT floor FROM lb_abyss WHERE period='all' AND uid=?").bind(user.id).first();
  const { hard, soft } = checkSave(prev, next, {
    elapsedMs: cur ? c.now - cur.updated_at : 0,
    overwrite: body.overwrite === true,
    verifiedBest: vb ? vb.floor : 0,
  });
  if (hard.length) {
    await audit(c.env, user.id, 'save_rejected', hard, c.now);
    fail(422, 'save_rejected', 'Сохранение не прошло проверку', { reasons: hard });
  }
  if (soft.length) await audit(c.env, user.id, 'save_suspicious', soft, c.now);
  if (body.overwrite === true && prev) await c.env.DB.prepare('INSERT INTO audit (uid, kind, detail, ts) VALUES (?,?,?,?)').bind(user.id, 'save_overwrite', null, c.now).run();

  const version = base + 1;
  let r;
  if (cur) {
    r = await c.env.DB.prepare('UPDATE saves SET version=?, data=?, size=?, summary=?, updated_at=? WHERE uid=? AND version=?')
      .bind(version, text, text.length, JSON.stringify(next), c.now, user.id, base).run();
  } else {
    r = await c.env.DB.prepare('INSERT INTO saves (uid, version, data, size, summary, updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(uid) DO NOTHING')
      .bind(user.id, version, text, text.length, JSON.stringify(next), c.now).run();
  }
  if (!r.meta.changes) {
    // Lost a race with another device between SELECT and UPDATE.
    return conflict(await c.env.DB.prepare('SELECT version, data, updated_at FROM saves WHERE uid=?').bind(user.id).first());
  }
  return json({ ok: true, version, updatedAt: c.now, warnings: soft });
}
