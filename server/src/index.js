// ЭМБЕРВЕЙЛ online backend — Cloudflare Worker entry point.
import { json, errorResponse, corsHeaders, fail } from './lib/http.js';
import * as auth from './routes/auth.js';
import * as save from './routes/save.js';
import * as abyss from './routes/abyss.js';
import * as clans from './routes/clans.js';
import * as raids from './routes/raids.js';
import * as live from './routes/live.js';
import * as daily from './routes/daily.js';
import * as pay from './routes/payments.js';
import * as social from './routes/social.js';
import * as bot from './routes/bot.js';
import * as metrics from './routes/metrics.js';
import * as ads from './routes/ads.js';
import * as stats from './routes/stats.js';
import * as liveops from './routes/liveops.js';
import { rateLimit } from './lib/ratelimit.js';

const health = (c) => json({ ok: true, name: 'emberveil', serverTime: c.now, telegram: !!c.env.BOT_TOKEN, guest: c.env.ALLOW_GUEST === '1' });

// [method, path pattern, handler]. ':name' segments become c.params.name.
export const ROUTES = [
  ['GET', '/health', health],
  ['POST', '/auth/telegram', auth.authTelegram],
  ['POST', '/auth/guest', auth.authGuest],
  ['GET', '/me', auth.getMe],
  ['POST', '/me/settings', auth.postSettings],
  ['DELETE', '/me', auth.deleteMe],

  ['GET', '/save', save.getSave],
  ['PUT', '/save', save.putSave],

  ['POST', '/abyss/start', abyss.abyssStart],
  ['POST', '/abyss/finish', abyss.abyssFinish],
  ['GET', '/lb/abyss', abyss.lbAbyss],
  ['GET', '/lb/clans', clans.listClans],

  ['GET', '/clans', clans.listClans],
  ['GET', '/clan/me', clans.myClan],
  // v42: clan weekly goal with thresholds (before /clan/:id)
  ['GET', '/clan/goal', liveops.getClanGoal],
  ['POST', '/clan/goal/claim', liveops.clanGoalClaim],
  ['POST', '/clan/create', clans.createClan],
  ['POST', '/clan/join', clans.joinClan],
  ['POST', '/clan/leave', clans.leaveClan],
  ['POST', '/clan/kick', clans.kickMember],
  ['POST', '/clan/role', clans.setRole],
  ['POST', '/clan/edit', clans.editClan],
  ['GET', '/clan/:id', clans.getClan],

  ['PUT', '/village', raids.putVillage],
  ['GET', '/raid/opponents', raids.opponents],
  ['POST', '/raid/start', raids.raidStart],
  ['POST', '/raid/finish', raids.raidFinish],
  ['GET', '/raid/log', raids.raidLog],

  // v42 live-ops: weekly overlord + its board, server-wide shared goals (src/routes/liveops.js, migration 0008)
  ['GET', '/wb', liveops.getWb],
  ['POST', '/wb/start', liveops.wbStart],
  ['POST', '/wb/finish', liveops.wbFinish],
  ['GET', '/lb/wb', liveops.lbWb],
  ['GET', '/goal/:id', liveops.getGoal],
  ['POST', '/goal/:id/contrib', liveops.goalContrib],
  ['POST', '/goal/:id/claim', liveops.goalClaim],

  ['GET', '/config', live.getConfig],
  ['GET', '/bp', live.getBp],
  ['POST', '/bp/claim', live.claimBp],

  ['GET', '/daily', daily.getDaily],
  ['POST', '/daily/claim', daily.claimDaily],
  ['POST', '/quests/claim', daily.claimQuest],

  ['POST', '/pay/invoice', pay.createInvoice],
  ['GET', '/entitlements', pay.listEntitlements],
  ['POST', '/pay/claim', pay.claimPurchases],
  ['POST', '/pay/seal', pay.claimSeal],
  ['POST', '/chest/free', pay.freeChest],

  ['GET', '/referrals', social.getReferrals],
  ['POST', '/friends/add', social.addFriend],
  ['GET', '/inbox', social.getInbox],
  ['POST', '/inbox/claim', social.claimInbox],
  ['POST', '/notify/schedule', social.scheduleNotify],

  ['POST', '/events', metrics.postEvents],

  // v39.4: Adsgram Reward URL (called by Adsgram) + spending an ad credit (game), src/routes/ads.js
  ['GET', '/ads/reward', ads.adsReward],
  ['POST', '/ads/claim', ads.adsClaim],

  ['POST', '/tg/webhook', bot.webhook],

  ['GET', '/admin/config', live.adminGetConfig],
  ['PUT', '/admin/config/:key', live.adminPutConfig],
  ['DELETE', '/admin/config/:key', live.adminDeleteConfig],
  ['POST', '/admin/grant', live.adminGrant],
  ['POST', '/admin/inbox', live.adminInbox],
  ['POST', '/admin/ban', live.adminBan],
  ['POST', '/admin/refund', pay.adminRefund],
  ['GET', '/admin/audit', live.adminAudit],
  ['GET', '/admin/stats', stats.adminStats], // v41: dashboard JSON for apps/admin/index.html (src/routes/stats.js)
  ['GET', '/admin/metrics', metrics.adminMetrics],
  ['GET', '/admin/errors', metrics.adminErrors],
];

function match(method, path) {
  const segs = path.split('/').filter(Boolean);
  let pathMatched = false;
  for (const [m, pattern, h] of ROUTES) {
    const ps = pattern.split('/').filter(Boolean);
    if (ps.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].startsWith(':')) params[ps[i].slice(1)] = decodeURIComponent(segs[i]);
      else if (ps[i] !== segs[i]) { ok = false; break; }
    }
    if (!ok) continue;
    pathMatched = true;
    if (m === method) return { h, params };
  }
  return { h: null, pathMatched };
}

export async function handle(req, env, now = Date.now()) {
  const cors = corsHeaders(req, env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  let res;
  try {
    if (!env.DB) fail(503, 'not_configured', 'База D1 не подключена');
    const url = new URL(req.url);
    const prefix = env.API_PREFIX || '';
    let path = url.pathname;
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length) || '/';
    const { h, params, pathMatched } = match(req.method, path);
    if (!h) fail(pathMatched ? 405 : 404, pathMatched ? 'method' : 'not_found', 'Нет такого метода');
    await rateLimit(req, env, path, now); // v39: 429 на /auth, PUT /save, /events, /pay/invoice, /admin/*, /ads/* (src/lib/ratelimit.js)
    res = await h({ req, env, url, now, params });
  } catch (e) {
    res = errorResponse(e);
  }
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
  out.headers.set('x-content-type-options', 'nosniff');
  if (out.status === 429 && !out.headers.has('retry-after')) out.headers.set('retry-after', '60');
  if (!out.headers.has('cache-control')) out.headers.set('cache-control', 'no-store');
  return out;
}

export default {
  fetch: (req, env) => handle(req, env),
  scheduled: (event, env, ctx) => {
    ctx.waitUntil(bot.runCron(env, Date.now()).catch((e) => console.error('cron failed', e && e.message)));
  },
};
