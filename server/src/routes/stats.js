// v41: admin dashboard data — GET /admin/stats?days=30 (Authorization: Bearer <ADMIN_SECRET>).
// One JSON with everything the static page apps/admin/index.html draws (queries: docs/review-v41/growth.md, part A §3).
// All days are game days ('YYYY-MM-DD', dayKey with DAY_OFFSET_MIN); payments (ms UTC) are shifted by the same offset.
// Cohort = users.day0 (first day in the game, migration 0007). Efficient paths: users_day0, active_days PK (uid, day) /
// active_days_day, milestones PK (uid, m), ev_counts PK (day, name), payments_paid (status, created_at).
// The old top-level counters (users, active24h, saves, clans, payments, stars) are kept for existing scripts.
import { json, int } from '../lib/http.js';
import { requireAdmin } from './live.js';
import { dayKey, offsetMs, DAY_MS } from '../lib/time.js';

// first-session funnel: open (cohort) → prologue → yard → village → 1-1 → boss 1-5 → day 2 (returned next day)
export const FUNNEL = [
  ['open', 'Открыл игру', null],
  ['prologue_start', 'Пролог: начал', "m.m='ftue:prologue_start'"],
  ['prologue_end', 'Пролог: закончил', "m.m='ftue:prologue_end'"],
  ['yard', 'Двор пройден', "(m.m='ftue:yard_done' OR m.m GLOB 'ftue:yard_skip*')"],
  ['village', 'Очнулся в Броде', "m.m='ftue:wake'"],
  ['s11_start', 'Этап 1-1: начал', "(m.m='ftue:s11_start' OR m.m='ftue:stage11')"],
  ['s11_win', 'Этап 1-1: прошёл', "m.m='ftue:stage11'"],
  ['build', 'Первая стройка', "m.m='ftue:build'"],
  ['boss', 'Владыка 1-5', "m.m='ftue:boss'"],
  ['day2', 'Вернулся на 2-й день', 'D1'],
];
const RET = [1, 3, 7, 14, 30];
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const plusDay = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);

export async function adminStats(c) {
  requireAdmin(c);
  const env = c.env, DB = env.DB, now = c.now;
  const days = Math.max(1, Math.min(120, int(c.url.searchParams.get('days'), 30)));
  const to = dayKey(now, env), from = dayKey(now - (days - 1) * DAY_MS, env);
  const off = offsetMs(env);
  const fromMs = Date.parse(from + 'T00:00:00Z') - off, toMs = Date.parse(to + 'T00:00:00Z') + DAY_MS - off;
  const all = async (sql, ...a) => (await DB.prepare(sql).bind(...a).all()).results;
  const one = async (sql, ...a) => (await DB.prepare(sql).bind(...a).first()) || {};
  const n = async (sql, ...a) => (await one(sql, ...a)).n || 0;

  // --- activity
  const dau = await all('SELECT day, COUNT(*) n, SUM(sess) sess, SUM(sec) sec FROM active_days WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day', from, to);
  const wm = await one(`SELECT (SELECT COUNT(DISTINCT uid) FROM active_days WHERE day > date(?1,'-7 day') AND day <= ?1) wau,
                               (SELECT COUNT(DISTINCT uid) FROM active_days WHERE day > date(?1,'-30 day') AND day <= ?1) mau`, to);
  const today = dau.find((d) => d.day === to);
  const avgDau = dau.length ? dau.reduce((a, d) => a + d.n, 0) / dau.length : 0;

  // --- new players and sources (first-touch src; NULL = organic)
  const newByDay = await all('SELECT day0 day, COUNT(*) n FROM users WHERE day0 BETWEEN ? AND ? GROUP BY day0 ORDER BY day0', from, to);
  const bySrc = await all(`SELECT COALESCE(u.src,'organic') src, COUNT(*) n,
      SUM(u.day0 <= date(?3,'-1 day')) n1, SUM(u.day0 <= date(?3,'-1 day') AND EXISTS(SELECT 1 FROM active_days a WHERE a.uid=u.id AND a.day=date(u.day0,'+1 day'))) r1,
      SUM(u.day0 <= date(?3,'-7 day')) n7, SUM(u.day0 <= date(?3,'-7 day') AND EXISTS(SELECT 1 FROM active_days a WHERE a.uid=u.id AND a.day=date(u.day0,'+7 day'))) r7,
      SUM(EXISTS(SELECT 1 FROM payments p WHERE p.uid=u.id AND p.status='paid')) payers
    FROM users u WHERE u.day0 BETWEEN ?1 AND ?2 GROUP BY 1 ORDER BY n DESC LIMIT 30`, from, to, to);

  // --- retention cohorts D1/D3/D7/D14/D30 (classic: came back exactly on day N); immature cells are null
  const ex = (k) => `SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=u.id AND a.day=date(u.day0,'+${k} day'))) d${k}`;
  const coh = await all(`SELECT u.day0 day, COUNT(*) n, ${RET.map(ex).join(', ')} FROM users u WHERE u.day0 BETWEEN ? AND ? GROUP BY u.day0 ORDER BY u.day0`, from, to);
  const cohorts = coh.map((r) => {
    const o = { day: r.day, n: r.n };
    for (const k of RET) { const ok = plusDay(r.day, k) <= to; o['d' + k] = ok ? r['d' + k] : null; o['d' + k + 'Pct'] = ok ? pct(r['d' + k], r.n) : null; }
    return o;
  });

  // --- funnel for players whose first day is in the window (milestones, variant B)
  const fsql = FUNNEL.map(([id, , cond]) => (!cond ? 'COUNT(*) s_' + id
    : cond === 'D1' ? `SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=u.id AND a.day=date(u.day0,'+1 day'))) s_${id}`
      : `SUM(EXISTS(SELECT 1 FROM milestones m WHERE m.uid=u.id AND ${cond})) s_${id}`)).join(', ');
  const fr = await one(`SELECT ${fsql} FROM users u WHERE u.day0 BETWEEN ? AND ?`, from, to);
  const base = fr.s_open || 0;
  const funnel = FUNNEL.map(([id, label], i) => {
    const users = fr['s_' + id] || 0, prev = i ? fr['s_' + FUNNEL[i - 1][0]] || 0 : base;
    return { id, label, users, pct: pct(users, base), stepPct: pct(users, prev) };
  });

  // --- event counters in the window (ev_counts PK (day, name) range)
  const evRows = await all(`SELECT name, SUM(n) n, SUM(users) users, SUM(v) v FROM ev_counts WHERE day BETWEEN ? AND ?
      AND (name GLOB 'stage_*:*' OR name GLOB 'ad_*:*' OR name GLOB 'sess_*' OR name GLOB 'eco_*:*' OR name GLOB 'offer_view:*'
           OR name GLOB 'purchase_*:*' OR name GLOB 'shop_open:*' OR name GLOB 'ref_*' OR name GLOB 'share:*' OR name GLOB 'unlock:*')
      GROUP BY name`, from, to);
  const ev = (prefix) => evRows.filter((r) => r.name.startsWith(prefix));
  const after = (name) => name.slice(name.indexOf(':') + 1);

  // stages: starts / wins / fails / quits, seconds before failing, causes; top-10 by fails
  const st = new Map();
  const S = (k) => { let o = st.get(k); if (!o) st.set(k, (o = { stage: k, starts: 0, players: 0, wins: 0, fails: 0, failPlayers: 0, quits: 0, failSec: 0, causes: {} })); return o; };
  for (const r of ev('stage_')) {
    const kind = r.name.slice(0, r.name.indexOf(':')), key = after(r.name);
    if (kind === 'stage_start') { const o = S(key); o.starts += r.n; o.players += r.users; }
    else if (kind === 'stage_finish') S(key).wins += r.n;
    else if (kind === 'stage_fail') { const o = S(key); o.fails += r.n; o.failPlayers += r.users; o.failSec += r.v || 0; }
    else if (kind === 'stage_leave' || kind === 'stage_quit') S(key).quits += r.n;
    else if (kind === 'stage_fc') { const i = key.lastIndexOf('.'); if (i > 0) { const o = S(key.slice(0, i)); o.causes[key.slice(i + 1)] = (o.causes[key.slice(i + 1)] || 0) + r.n; } }
  }
  const stageFails = [...st.values()].filter((o) => o.fails > 0)
    .map((o) => ({ ...o, failPct: pct(o.fails, o.starts), winPct: pct(o.wins, o.starts), avgFailSec: o.fails ? Math.round(o.failSec / o.fails) : null, topCause: Object.entries(o.causes).sort((a, b) => b[1] - a[1])[0]?.[0] || null }))
    .sort((a, b) => b.fails - a.fails).slice(0, 10);

  // sessions: medians from active_days (per session = sec/sess of a player-day; per player-day = sec), histogram from sess_len
  const med = async (expr) => {
    const cnt = await n('SELECT COUNT(*) n FROM active_days WHERE day BETWEEN ? AND ? AND sess>0', from, to);
    if (!cnt) return null;
    const r = await one(`SELECT ${expr} x FROM active_days WHERE day BETWEEN ? AND ? AND sess>0 ORDER BY x LIMIT 1 OFFSET ?`, from, to, Math.floor(cnt / 2));
    return r.x === undefined || r.x === null ? null : Math.round(r.x);
  };
  const sessTot = dau.reduce((a, d) => ({ sess: a.sess + (d.sess || 0), sec: a.sec + (d.sec || 0) }), { sess: 0, sec: 0 });
  const sessions = {
    medianSessionSec: await med('1.0*sec/sess'), medianDailySec: await med('sec'),
    avgSessionSec: sessTot.sess ? Math.round(sessTot.sec / sessTot.sess) : null, sessions: sessTot.sess,
    hist: ev('sess_len:').map((r) => ({ bucket: after(r.name), n: r.n, sec: r.v })),
  };

  // ads by placement (client funnel) + server truth (ads_daily)
  const ad = new Map();
  const A = (p) => { let o = ad.get(p); if (!o) ad.set(p, (o = { place: p, offered: 0, requested: 0, shown: 0, nofill: 0, skipped: 0, failed: 0, rewarded: 0 })); return o; };
  for (const r of ev('ad_')) {
    const kind = r.name.slice(0, r.name.indexOf(':')), key = after(r.name);
    if (kind === 'ad_offer') A(key).offered += r.n;
    else if (kind === 'ad_start') A(key.startsWith('il_') ? 'il' : key).requested += r.n;
    else if (kind === 'ad_done') A(key.startsWith('il_') ? 'il' : key).rewarded += r.n;
    else if (kind === 'ad_fail') {
      const i = key.indexOf('.'); if (i < 0) continue; // 'ad_fail:sdk' — SDK did not load
      const o = A(key.slice(0, i)), why = key.slice(i + 1);
      if (why === 'nofill') o.nofill += r.n; else if (why === 'skip') o.skipped += r.n; else o.failed += r.n;
    }
  }
  const ads = [...ad.values()].map((o) => ({ ...o, shown: o.rewarded + o.skipped, fillPct: pct(o.requested - o.nofill - o.failed, o.requested), completePct: pct(o.rewarded, o.requested) }))
    .sort((a, b) => b.requested - a.requested);
  const adsServer = await all('SELECT place, SUM(rewarded) rewarded, SUM(claimed) claimed FROM ads_daily WHERE day BETWEEN ? AND ? GROUP BY place ORDER BY place', from, to);

  // Stars: revenue by product (payments = server truth) + view → intent → paid funnel from events
  const byProduct = await all(`SELECT product_id, COUNT(*) purchases, COUNT(DISTINCT uid) buyers, SUM(stars) stars FROM payments
      WHERE status='paid' AND created_at >= ? AND created_at < ? GROUP BY product_id ORDER BY stars DESC`, fromMs, toMs);
  const fun = {};
  for (const r of [...ev('offer_view:'), ...ev('purchase_')]) {
    const kind = r.name.slice(0, r.name.indexOf(':')), pid = after(r.name);
    if (!['offer_view', 'purchase_intent', 'purchase_success'].includes(kind)) continue;
    (fun[pid] = fun[pid] || { views: 0, intents: 0, success: 0 })[kind === 'offer_view' ? 'views' : kind === 'purchase_intent' ? 'intents' : 'success'] += r.users;
  }
  for (const p of byProduct) Object.assign(p, fun[p.product_id] || { views: 0, intents: 0, success: 0 });
  for (const pid in fun) if (!byProduct.some((p) => p.product_id === pid)) byProduct.push({ product_id: pid, purchases: 0, buyers: 0, stars: 0, ...fun[pid] });
  const starsByDay = await all(`SELECT date((created_at + ?)/1000,'unixepoch') day, SUM(stars) stars, COUNT(DISTINCT uid) payers, COUNT(*) tx FROM payments
      WHERE status='paid' AND created_at >= ? AND created_at < ? GROUP BY day ORDER BY day`, off, fromMs, toMs);
  const refunds = await one("SELECT COUNT(*) n, COALESCE(SUM(stars),0) stars FROM payments WHERE status='refunded' AND created_at >= ? AND created_at < ?", fromMs, toMs);

  // referrals: invited in the window, activated (friend beat 1-5) in the window, pending, top inviters (ref_code only)
  const refs = {
    invited: await n('SELECT COUNT(*) n FROM users WHERE referred_by IS NOT NULL AND created_at >= ? AND created_at < ?', fromMs, toMs),
    activated: await n("SELECT COUNT(*) n FROM milestones WHERE m='ref:activated' AND ts >= ? AND ts < ?", fromMs, toMs),
    pending: await n("SELECT COUNT(*) n FROM users WHERE ref_state='pending'"),
    newPlayers: newByDay.reduce((a, d) => a + d.n, 0),
    top: await all(`SELECT r.ref_code pid, COUNT(*) invited, SUM(u.ref_state='done') activated, SUM(u.ref_state='pending') pending
        FROM users u JOIN users r ON r.id=u.referred_by WHERE u.created_at >= ? AND u.created_at < ? GROUP BY r.id ORDER BY invited DESC LIMIT 20`, fromMs, toMs),
    shares: ev('share:').map((r) => ({ kind: after(r.name), n: r.n, users: r.users })),
  };
  refs.kShare = refs.newPlayers ? Math.round((1000 * refs.invited) / refs.newPlayers) / 1000 : null;

  // economy: earn / spend per resource and source (client aggregates eco_in:<res>.<src>, eco_out:<res>.<sink>, v = amount)
  const economy = [...ev('eco_in:'), ...ev('eco_out:')].map((r) => {
    const key = after(r.name), i = key.indexOf('.');
    return { dir: r.name.startsWith('eco_in:') ? 'in' : 'out', res: i > 0 ? key.slice(0, i) : key, src: i > 0 ? key.slice(i + 1) : '', amount: r.v || 0, events: r.n, users: r.users };
  }).sort((a, b) => b.amount - a.amount);

  const q = async (sql, ...a) => n(sql, ...a);
  return json({
    ok: true, from, to, days, serverTime: now,
    // v38-era counters (kept)
    users: await q('SELECT COUNT(*) n FROM users'),
    active24h: await q('SELECT COUNT(*) n FROM users WHERE last_seen>=?', now - 86400000),
    saves: await q('SELECT COUNT(*) n FROM saves'),
    clans: await q('SELECT COUNT(*) n FROM clans'),
    payments: await q("SELECT COUNT(*) n FROM payments WHERE status='paid'"),
    stars: await q("SELECT COALESCE(SUM(stars),0) n FROM payments WHERE status='paid'"),
    statsOff: await q('SELECT COUNT(*) n FROM users WHERE stats_off=1'),
    // dashboard
    tiles: { dau: today ? today.n : 0, wau: wm.wau || 0, mau: wm.mau || 0, stickiness: wm.mau ? Math.round((1000 * avgDau) / wm.mau) / 10 : null, newToday: (newByDay.find((d) => d.day === to) || {}).n || 0 },
    dau, newByDay, newBySource: bySrc.map((r) => ({ src: r.src, n: r.n, d1Pct: pct(r.r1, r.n1), d7Pct: pct(r.r7, r.n7), payers: r.payers })),
    cohorts, funnel, stageFails, sessions, ads, adsServer,
    starsRevenue: { byProduct, byDay: starsByDay, refunds: { n: refunds.n || 0, stars: refunds.stars || 0 } },
    referrals: refs, economy,
  });
}
