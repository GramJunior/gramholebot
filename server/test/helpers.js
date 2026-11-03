// Test harness: a Cloudflare D1-compatible wrapper over Node's built-in SQLite
// (node:sqlite), plus helpers to call the Worker in-process and mock Telegram.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { handle } from '../src/index.js';
import { hmac, toHex } from '../src/lib/crypto.js';

const SCHEMA = readFileSync(fileURLToPath(new URL('../schema.sql', import.meta.url)), 'utf8');

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) {
    for (const a of args) if (a === undefined) throw new Error('D1_TYPE_ERROR: undefined bound in: ' + this.sql);
    return new Stmt(this.db, this.sql, args);
  }
  _p() { return this.db.prepare(this.sql); }
  async first(col) {
    const r = this._p().get(...this.args);
    if (!r) return null;
    const o = { ...r };
    return col ? o[col] : o;
  }
  async all() { return { success: true, results: this._p().all(...this.args).map((r) => ({ ...r })), meta: {} }; }
  async run() { return this._runSync(); }
  _runSync() {
    const r = this._p().run(...this.args);
    return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

export class D1Shim {
  constructor() { this.db = new DatabaseSync(':memory:'); this.db.exec(SCHEMA); }
  prepare(sql) { return new Stmt(this.db, sql); }
  async batch(stmts) {
    this.db.exec('BEGIN');
    try {
      const out = stmts.map((s) => s._runSync());
      this.db.exec('COMMIT');
      return out;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  async exec(sql) { this.db.exec(sql); }
}

export const BOT_TOKEN = '123456789:AAFakeTestTokenForUnitTests_xxxxxxx';

export function makeEnv(extra = {}) {
  return {
    DB: new D1Shim(),
    BOT_TOKEN,
    JWT_SECRET: 'test-jwt-secret-0123456789abcdef',
    ADMIN_SECRET: 'test-admin-secret-0123456789',
    WEBHOOK_SECRET: 'hook-secret',
    ALLOW_GUEST: '1',
    BOT_USERNAME: 'ember_test_bot',
    APP_SHORT_NAME: 'play',
    WEBAPP_URL: 'https://game.example/',
    TG_API_BASE: 'https://tg.mock',
    DAY_OFFSET_MIN: '180',
    ...extra,
  };
}

/** Build signed initData exactly like Telegram does. */
export async function makeInitData(user, { authDate = Math.floor(Date.now() / 1000), startParam, token = BOT_TOKEN, extra = {} } = {}) {
  const fields = { auth_date: String(authDate), query_id: 'AAHtest', user: JSON.stringify(user), ...extra };
  if (startParam) fields.start_param = startParam;
  const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const hash = toHex(await hmac(await hmac('WebAppData', token), dcs));
  const p = new URLSearchParams({ ...fields, hash });
  return p.toString();
}

/** Call the worker. Returns { status, body }. */
export function api(env, clock = { now: Date.now() }) {
  const call = async (method, path, { body, token, headers = {}, raw } = {}) => {
    const h = { ...headers };
    if (token) h.authorization = 'Bearer ' + token;
    if (body !== undefined) h['content-type'] = 'application/json';
    const req = new Request('https://api.test' + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
    const res = await handle(req, env, clock.now);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, body: json, headers: res.headers };
  };
  call.clock = clock;
  return call;
}

/** Mock Telegram Bot API via global fetch. Records calls; `responders[method]` can override results. */
export function mockTelegram(responders = {}) {
  const calls = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const m = /^https:\/\/tg\.mock\/bot[^/]+(?:\/test)?\/(\w+)$/.exec(String(url));
    if (!m) return orig(url, init);
    const params = JSON.parse(init.body || '{}');
    calls.push({ method: m[1], params, url: String(url) });
    const r = responders[m[1]];
    const result = typeof r === 'function' ? r(params) : r !== undefined ? r : true;
    if (result && result.__error) return new Response(JSON.stringify({ ok: false, error_code: result.code || 400, description: result.__error }), { status: result.code || 400 });
    return new Response(JSON.stringify({ ok: true, result }), { status: 200 });
  };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}

/** Log in a fresh Telegram user, returns { token, me }. */
export async function loginTg(call, id, name = 'Тест', opts = {}) {
  const initData = await makeInitData({ id, first_name: name, username: 'u' + id, allows_write_to_pm: true }, { authDate: Math.floor(call.clock.now / 1000), ...opts });
  const r = await call('POST', '/auth/telegram', { body: { initData } });
  if (r.status !== 200) throw new Error('login failed ' + JSON.stringify(r.body));
  return r.body;
}

/** Minimal valid game save (mirrors apps/emberveil/src/p1.js newSave()). */
export function gameSave(over = {}) {
  const base = {
    v: 1, created: 1700000000000, started: true,
    hero: { lvl: 5, xp: 10, tp: 0, talents: {} },
    res: { gold: 1000, wood: 100, ore: 50, ess: 10, shards: 5 },
    st: { kills: 100, boss: 1, chests: 5, floors: 3 },
    endless: { best: 3, runs: 1 },
    bld: { hall: 2 },
  };
  return deepMerge(base, over);
}
function deepMerge(a, b) {
  for (const k in b) a[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? deepMerge(a[k] || {}, b[k]) : b[k];
  return a;
}
