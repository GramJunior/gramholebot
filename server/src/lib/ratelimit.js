// Rate limiting (v39): per-player / per-IP limits on the expensive or abusable routes.
//
// Production: Cloudflare Workers Rate Limiting API — bindings RL_AUTH, RL_SAVE, RL_EVENTS, RL_PAY, RL_ADMIN, RL_ADS_REWARD, RL_ADS_CLAIM
// declared in wrangler.toml ([[ratelimits]], counters are kept by Cloudflare per location, 10 s or 60 s windows).
// Without a binding (local dev, tests, an old wrangler) a small in-memory token bucket per isolate is used instead:
// weaker (each isolate counts on its own), but it still stops a single client hammering one isolate.
// RATE_LIMIT = "0" turns limiting off (e.g. for load tests).
import { fail } from './http.js';

// group → { binding, key: 'ip' | 'user', limit, period (s) } — the in-memory fallback uses the same numbers.
export const RL_RULES = {
  auth: { binding: 'RL_AUTH', key: 'ip', limit: 20, period: 60 },
  save: { binding: 'RL_SAVE', key: 'user', limit: 30, period: 60 },
  events: { binding: 'RL_EVENTS', key: 'user', limit: 30, period: 60 },
  pay: { binding: 'RL_PAY', key: 'user', limit: 10, period: 60 },
  admin: { binding: 'RL_ADMIN', key: 'ip', limit: 30, period: 60 },
  // v39.4: Adsgram Reward URL — keyed by the Telegram id in the query (calls come from Adsgram's servers, few IPs)
  adsreward: { binding: 'RL_ADS_REWARD', key: 'userid', limit: 20, period: 60 },
  adsclaim: { binding: 'RL_ADS_CLAIM', key: 'user', limit: 20, period: 60 },
};

/** Which limit group a request falls into (null = not limited). */
export function rlGroup(method, path) {
  if (method === 'OPTIONS') return null;
  if (method === 'POST' && path.startsWith('/auth/')) return 'auth';
  if (method === 'PUT' && path === '/save') return 'save';
  if (method === 'POST' && path === '/events') return 'events';
  if (method === 'POST' && path === '/pay/invoice') return 'pay';
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin';
  if (method === 'GET' && path === '/ads/reward') return 'adsreward';
  if (method === 'POST' && path === '/ads/claim') return 'adsclaim';
  return null;
}

export function clientIp(req) {
  return req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}

// The player id is read from the bearer token WITHOUT verifying it: it is only a bucket key.
// A forged token gets its own bucket but is still rejected by requireUser right after.
function tokenSub(req) {
  const a = req.headers.get('authorization') || '';
  const t = a.startsWith('Bearer ') ? a.slice(7) : '';
  const p = t.split('.');
  if (p.length !== 3) return '';
  try {
    const s = p[1].replace(/-/g, '+').replace(/_/g, '/');
    const o = JSON.parse(atob(s + '==='.slice((s.length + 3) % 4)));
    return o && (o.sub || o.uid) ? String(o.sub || o.uid).slice(0, 40) : '';
  } catch { return ''; }
}

export function rlKey(rule, req) {
  const ip = clientIp(req);
  if (rule.key === 'user') { const u = tokenSub(req); return u ? 'u:' + u : 'ip:' + ip; }
  if (rule.key === 'userid') {
    let q = '';
    try { const s = new URL(req.url).searchParams; q = String(s.get('userid') || s.get('userId') || '').replace(/\D/g, '').slice(0, 16); } catch { /* bad url */ }
    return q ? 'tg:' + q : 'ip:' + ip;
  }
  return 'ip:' + ip;
}

// ---- in-memory token bucket (fallback) — one Map per env object, so tests do not leak into each other ----
const MEM = new WeakMap();
function memBuckets(env) { let m = MEM.get(env); if (!m) { m = new Map(); MEM.set(env, m); } return m; }
export function memTake(env, id, limit, periodSec, now) {
  const m = memBuckets(env);
  const rate = limit / (periodSec * 1000); // tokens per ms
  let b = m.get(id);
  if (!b) { b = { tok: limit, t: now }; m.set(id, b); }
  b.tok = Math.min(limit, b.tok + (now - b.t) * rate); b.t = now;
  if (m.size > 5000) { for (const [k, v] of m) { if (now - v.t > periodSec * 2000) m.delete(k); } }
  if (b.tok >= 1) { b.tok -= 1; return { ok: true }; }
  return { ok: false, retry: Math.max(1, Math.ceil((1 - b.tok) / rate / 1000)) };
}

/** Throws 429 when the request is over its limit. Never throws for other reasons (a failing limiter lets the request through). */
export async function rateLimit(req, env, path, now) {
  if (String(env.RATE_LIMIT ?? '1') === '0') return;
  const g = rlGroup(req.method, path);
  if (!g) return;
  const rule = RL_RULES[g];
  const key = g + '|' + rlKey(rule, req);
  let ok = true, retry = rule.period;
  const bind = env[rule.binding];
  if (bind && typeof bind.limit === 'function') {
    try { const r = await bind.limit({ key }); ok = !r || r.success !== false; } catch { ok = true; }
  } else {
    const r = memTake(env, key, rule.limit, rule.period, now);
    ok = r.ok; if (!ok) retry = r.retry;
  }
  if (!ok) fail(429, 'rate_limited', 'Слишком много запросов — подождите немного', { retryAfter: retry });
}
