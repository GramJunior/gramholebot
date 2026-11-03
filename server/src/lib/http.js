// HTTP helpers: JSON responses, errors, CORS, body parsing with a size cap.

export class HttpError extends Error {
  /** @param {number} status @param {string} code @param {string} [msg] @param {object} [extra] */
  constructor(status, code, msg, extra) {
    super(msg || code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

/** Shorthand: throw a 4xx with a machine code and a Russian human message. */
export const fail = (status, code, msg, extra) => { throw new HttpError(status, code, msg, extra); };

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function errorResponse(e) {
  if (e instanceof HttpError) {
    return json({ ok: false, error: e.code, message: e.message, ...(e.extra || {}) }, e.status);
  }
  // Never echo internal error text (could contain SQL or secrets) — log only the message.
  console.error('internal error:', e && e.message);
  return json({ ok: false, error: 'internal', message: 'Внутренняя ошибка сервера' }, 500);
}

export function corsHeaders(req, env) {
  const origin = req.headers.get('origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);
  let allow = '';
  if (allowed.includes('*')) allow = '*';
  else if (origin && allowed.includes(origin)) allow = origin;
  const h = {
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
  if (allow) h['access-control-allow-origin'] = allow;
  return h;
}

/** Read a JSON body, enforcing a byte limit. Returns {} for empty bodies. */
export async function readJson(req, maxBytes = 64 * 1024) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > maxBytes) fail(413, 'too_large', 'Слишком большой запрос');
  const text = await req.text();
  if (text.length > maxBytes) fail(413, 'too_large', 'Слишком большой запрос');
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== 'object' || Array.isArray(v)) fail(400, 'bad_json', 'Ожидался JSON-объект');
    return v;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    fail(400, 'bad_json', 'Некорректный JSON');
  }
}

export const int = (v, def = 0) => (v === null || v === undefined || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v)) ? def : Math.trunc(Number(v)));
export const str = (v, max = 64) => (typeof v === 'string' ? v.slice(0, max) : '');
