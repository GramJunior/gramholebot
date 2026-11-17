// Crypto helpers on Web Crypto (works in Cloudflare Workers and Node >= 20).

const enc = new TextEncoder();

async function hmacKey(keyBytes) {
  return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

/** HMAC-SHA256(key, msg) -> Uint8Array. key/msg may be strings or bytes. */
export async function hmac(key, msg) {
  const k = await hmacKey(typeof key === 'string' ? enc.encode(key) : key);
  const sig = await crypto.subtle.sign('HMAC', k, typeof msg === 'string' ? enc.encode(msg) : msg);
  return new Uint8Array(sig);
}

export const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(s) {
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))));
}

/** Constant-time string comparison (length leak only). */
export function safeEqual(a, b) {
  a = String(a ?? '');
  b = String(b ?? '');
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Random URL-safe id with `bytes` of entropy. */
export function randomId(bytes = 16) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return b64url(b);
}

export function b64url(bytes) {
  let s = '';
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Validate Telegram Mini App initData (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 *   secret_key = HMAC_SHA256(key = "WebAppData", msg = bot_token)
 *   hash       = hex(HMAC_SHA256(key = secret_key, msg = data_check_string))
 * data_check_string = all fields except `hash`, sorted by key, "key=value" joined by "\n".
 * Returns { ok, reason?, user?, authDate?, startParam?, fields? }.
 */
export async function validateInitData(initData, botToken, { maxAgeSec = 86400, now = Date.now() } = {}) {
  if (!botToken) return { ok: false, reason: 'not_configured' };
  if (typeof initData !== 'string' || !initData || initData.length > 8192) return { ok: false, reason: 'empty' };
  let params;
  try { params = new URLSearchParams(initData); } catch { return { ok: false, reason: 'parse' }; }
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return { ok: false, reason: 'no_hash' };
  const pairs = [];
  for (const [k, v] of params) if (k !== 'hash') pairs.push([k, v]);
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const dcs = pairs.map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac('WebAppData', botToken);
  const calc = toHex(await hmac(secret, dcs));
  if (!safeEqual(calc, hash)) return { ok: false, reason: 'bad_hash' };
  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, reason: 'no_auth_date' };
  const age = now / 1000 - authDate;
  if (age > maxAgeSec) return { ok: false, reason: 'expired' };
  if (age < -300) return { ok: false, reason: 'future' };
  let user = null;
  try { user = JSON.parse(params.get('user') || 'null'); } catch { /* ignore */ }
  if (!user || !Number.isSafeInteger(user.id)) return { ok: false, reason: 'no_user' };
  return { ok: true, user, authDate, startParam: params.get('start_param') || '', fields: Object.fromEntries(pairs) };
}

/** Minimal HS256 JWT. */
export async function signJwt(payload, secret) {
  const head = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await hmac(secret, `${head}.${body}`));
  return `${head}.${body}.${sig}`;
}

export async function verifyJwt(token, secret, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expect = b64url(await hmac(secret, `${parts[0]}.${parts[1]}`));
  if (!safeEqual(expect, parts[2])) return null;
  let p;
  try { p = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))); } catch { return null; }
  if (!p || typeof p.exp !== 'number' || p.exp * 1000 < now) return null;
  return p;
}
