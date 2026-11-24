// Tiny Telegram Bot API client. The bot token never leaves this module:
// errors are rethrown without the URL so it can't end up in logs or responses.

export async function tgCall(env, method, params = {}) {
  if (!env.BOT_TOKEN) throw new Error('bot_not_configured');
  const base = env.TG_API_BASE || 'https://api.telegram.org';
  const test = env.TG_TEST_ENV === '1' ? '/test' : '';
  let res;
  try {
    res = await fetch(`${base}/bot${env.BOT_TOKEN}${test}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error(`tg_network:${method}`);
  }
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!data || !data.ok) {
    const err = new Error(`tg_error:${method}:${(data && data.description) || res.status}`);
    err.tg = data;
    throw err;
  }
  return data.result;
}

/** Inline keyboard with a single button that opens the Mini App. */
export function webAppButton(env, text = 'Играть') {
  return { inline_keyboard: [[{ text, web_app: { url: env.WEBAPP_URL || 'https://example.com' } }]] };
}
