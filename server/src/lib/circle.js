// v45.2 «Круг побратимов»: three-tier friend milestones (migration 0009: ref_chain, ref_ms, login_days).
//
// Chain: written once when the invited friend's profile is created (applyReferral) and never changed:
//   t1 = inviter, t2 = whoever invited t1, t3 = whoever invited t2. No self, no repeats (no cycles).
// Milestones (config referral.milestones): join, l5 (chapter-1 boss 1-5), l10, l20, l30, l40, l50.
//   Detected ONLY from the accepted cloud save (PUT /save; cron re-reads recently updated saves).
//   Row per (friend, milestone, tier): wait → (gates: account age, distinct login days, server-recorded run) → hold
//   (holdHours, «Летописец сверяет запись») → paid (a letter in `inbox`, kind 'referrer') | refused.
//   Before paying: friend banned / suspicious (users.flags > maxFlags) → refused; recipient banned → refused;
//   per-recipient caps: capDay / capWeek letters (postponed), capMonthUpper for tiers 2–3 and maxRewarded tier-1 friends (refused).
// Amounts: gold `stages` entries use level min(recipient level, milestone level); tiers 2/3 get shares of shareTypes.
// Pure helpers are exported for unit tests.
import { getConfigKey, DEFAULTS } from './config.js';
import { dayKey } from './time.js';

const MIN = 60000;
const HOUR = 3600000;
const DAY = 86400000;
const NO_REF_TYPES = ['sparks']; // owner decision v45: no premium currency for referrals
/** A cap value: a positive number, else «no cap». */
const capOf = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : Infinity);

/** Stored `referral` value merged over the defaults (an admin may store only a few keys, e.g. the v41 shape). */
export function circleConfig(stored) {
  const d = structuredClone(DEFAULTS.referral);
  const s = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const out = { ...d, ...s };
  out.gold = { ...d.gold, ...(s.gold || {}) };
  if (!Array.isArray(out.shares) || out.shares.length < 3) out.shares = d.shares;
  if (!Array.isArray(out.milestones) || !out.milestones.length) out.milestones = d.milestones;
  if (!Array.isArray(out.shareTypes)) out.shareTypes = d.shareTypes;
  return out;
}

export async function loadCircleConfig(env) {
  return circleConfig(await getConfigKey(env, 'referral'));
}

/** Round to «nice» numbers: <10 as is, <1000 to tens, <100k two significant digits, else three. */
export function niceRound(v) {
  v = Math.max(0, Number(v) || 0);
  if (v < 10) return Math.round(v);
  if (v < 1000) return Math.round(v / 10) * 10;
  const digits = v < 100000 ? 2 : 3;
  const p = Math.pow(10, Math.floor(Math.log10(v)) - digits + 1);
  return Math.round(v / p) * p;
}

/** Gold of one stage at level L (p4.js: ≈ 200 × 1.12^(L−1)). */
export function stageGold(cfg, L) {
  const g = cfg.gold || {};
  return (Number(g.base) || 200) * Math.pow(Number(g.growth) || 1.12, Math.max(0, (Number(L) || 1) - 1));
}

/** Reward list of a milestone (resolving rewards:'referrer'). */
export function msRewardList(cfg, ms) {
  if (ms.rewards === 'referrer') return Object.entries(cfg.referrer || {}).map(([type, amount]) => ({ type, amount }));
  return Array.isArray(ms.rewards) ? ms.rewards : [];
}

/**
 * Reward of milestone `ms` for a recipient at `tier` (1..3) whose hero level is `recipLvl`.
 * Returns { res: { gold, ess, chest_iron, … }, cosmetics: [ids] } — empty when nothing is due.
 */
export function msReward(cfg, ms, tier, recipLvl) {
  const share = Number(cfg.shares[tier - 1]) || 0;
  const L = Math.max(1, Math.min(Number(recipLvl) || 1, Number(ms.lvl) || 1));
  const res = {};
  const cosmetics = [];
  for (const it of msRewardList(cfg, ms)) {
    if (!it || typeof it.type !== 'string' || NO_REF_TYPES.includes(it.type)) continue;
    if (it.type === 'cosmetic') {
      if (tier === 1 && typeof it.id === 'string' && it.id) cosmetics.push(it.id);
      continue;
    }
    const base = it.stages !== undefined ? niceRound((Number(it.stages) || 0) * stageGold(cfg, L)) : Number(it.amount) || 0;
    let v;
    if (tier === 1) v = base;
    else if (cfg.shareTypes.includes(it.type)) v = niceRound(base * share);
    else v = 0;
    v = Math.trunc(v);
    if (v > 0) res[it.type] = (res[it.type] || 0) + v;
  }
  return { res, cosmetics };
}

/** Milestones (excluding join) reached by a cloud-save summary { lvl, b15 }. */
export function reachedMs(cfg, summary) {
  const out = [];
  for (const ms of cfg.milestones) {
    if (!ms || ms.join) continue;
    if (ms.stage ? ms.stage === '1-5' && !!summary.b15 : summary.lvl >= (ms.lvl || 99)) out.push(ms.id);
  }
  return out;
}

/** Chain of a new player `uid` invited by `t1` whose own chain is `parent` ({t1,t2}|null). Drops self and repeats. */
export function resolveChain(uid, t1, parent) {
  if (!t1 || t1 === uid) return null;
  const c = { t1, t2: null, t3: null };
  const t2 = parent && parent.t1;
  if (t2 && t2 !== uid && t2 !== t1) {
    c.t2 = t2;
    const t3 = parent.t2;
    if (t3 && t3 !== uid && t3 !== t1 && t3 !== t2) c.t3 = t3;
  }
  return c;
}

/** Gate check. facts: { ageMs, days, abyss:bool, wb:bool }. */
export function gatesOk(gates, facts) {
  const g = gates || {};
  if (facts.ageMs < (Number(g.ageMin) || 0) * MIN) return { ok: false, reason: 'age' };
  if (facts.days < (Number(g.days) || 0)) return { ok: false, reason: 'days' };
  if (g.run === 'abyss' && !facts.abyss) return { ok: false, reason: 'run' };
  if (g.run === 'wb' && !facts.wb) return { ok: false, reason: 'run' };
  if (g.run === 'any' && !facts.abyss && !facts.wb) return { ok: false, reason: 'run' };
  return { ok: true };
}

// ---------------- DB ----------------

/** One row per player and game day — for everyone, also with «Отправлять статистику» off (anti-fraud only). */
export async function recordLogin(env, uid, now) {
  await env.DB.prepare('INSERT OR IGNORE INTO login_days (uid, day) VALUES (?,?)').bind(uid, dayKey(now, env)).run();
}

/** The player's chain (creating it from users.referred_by when missing — e.g. linked by an older worker). */
export async function getChain(env, user, now) {
  if (!user || !user.referred_by) return null;
  const r = await env.DB.prepare('SELECT t1, t2, t3 FROM ref_chain WHERE uid=?').bind(user.id).first();
  if (r) return r;
  const parent = await env.DB.prepare('SELECT t1, t2 FROM ref_chain WHERE uid=?').bind(user.referred_by).first();
  const c = resolveChain(user.id, user.referred_by, parent);
  if (!c) return null;
  await env.DB.prepare('INSERT OR IGNORE INTO ref_chain (uid, t1, t2, t3, created_at) VALUES (?,?,?,?,?)').bind(user.id, c.t1, c.t2, c.t3, now).run();
  return env.DB.prepare('SELECT t1, t2, t3 FROM ref_chain WHERE uid=?').bind(user.id).first();
}

async function insertMs(env, friend, chain, msIds, now) {
  const st = [];
  for (const ms of msIds) {
    for (const [tier, rcpt] of [[1, chain.t1], [2, chain.t2], [3, chain.t3]]) {
      if (!rcpt || rcpt === friend) continue;
      st.push(env.DB.prepare("INSERT OR IGNORE INTO ref_ms (friend, ms, tier, rcpt, status, reached_at, due_at) VALUES (?,?,?,?,'wait',?,?)").bind(friend, ms, tier, rcpt, now, now));
    }
  }
  if (st.length) await env.DB.batch(st);
  return st.length;
}

/** New referral: write the chain and the «join» milestone (called once from applyReferral). */
export async function startCircle(env, user, now) {
  const chain = await getChain(env, user, now);
  if (!chain) return null;
  const cfg = await loadCircleConfig(env);
  if (cfg.tgOnly && !user.tg_id) return chain; // guests (dev only) never count
  const join = cfg.milestones.filter((m) => m && m.join).map((m) => m.id);
  await insertMs(env, user.id, chain, join, now);
  return chain;
}

/**
 * The friend's accepted cloud save (summary { lvl, b15 }) — create rows for newly reached milestones.
 * Legacy referrals (rewarded at registration before v41) skip join and l5. Returns the number of new rows.
 */
export async function detectMilestones(env, user, summary, now, cfg) {
  if (!user || !user.referred_by || !summary) return 0;
  cfg = cfg || (await loadCircleConfig(env));
  if (cfg.tgOnly && !user.tg_id) return 0;
  const chain = await getChain(env, user, now);
  if (!chain) return 0;
  const have = new Set((await env.DB.prepare('SELECT DISTINCT ms FROM ref_ms WHERE friend=?').bind(user.id).all()).results.map((r) => r.ms));
  let want = reachedMs(cfg, summary);
  if (user.ref_state !== 'legacy') want = cfg.milestones.filter((m) => m && m.join).map((m) => m.id).concat(want);
  else want = want.filter((id) => id !== 'l5');
  want = want.filter((id) => !have.has(id));
  if (!want.length) return 0;
  return insertMs(env, user.id, chain, want, now);
}

async function friendFacts(env, f, now) {
  const days = await env.DB.prepare('SELECT COUNT(*) n FROM login_days WHERE uid=?').bind(f.id).first();
  const ab = await env.DB.prepare("SELECT 1 x FROM lb_abyss WHERE uid=? AND period='all' UNION ALL SELECT 1 FROM runs WHERE uid=? AND kind='abyss' AND status='done' LIMIT 1").bind(f.id, f.id).first();
  const wb = await env.DB.prepare('SELECT 1 x FROM wb_clears WHERE uid=? LIMIT 1').bind(f.id).first();
  return { ageMs: now - (f.created_at || now), days: days ? days.n : 0, abyss: !!ab, wb: !!wb };
}

export async function heroLevel(env, uid) {
  const s = await env.DB.prepare('SELECT summary FROM saves WHERE uid=?').bind(uid).first();
  if (!s) return 1;
  try { const v = JSON.parse(s.summary).lvl; return Number.isFinite(v) && v >= 1 ? Math.min(50, Math.trunc(v)) : 1; } catch { return 1; }
}

const msTitle = (ms, tier, name) => {
  const who = tier === 1 ? `Побратим ${name}` : tier === 2 ? `Побратим вашего побратима (${name})` : `Дальний круг (${name})`;
  const what = ms.join ? 'пришёл на ваш огонь' : ms.stage === '1-5' ? 'победил владыку 1-5' : `достиг ${ms.lvl}-го уровня`;
  return `Брод благодарит: ${who} ${what}`;
};

async function setRow(env, r, status, due, reason) {
  await env.DB.prepare('UPDATE ref_ms SET status=?, due_at=?, reason=? WHERE friend=? AND ms=? AND tier=? AND status=?')
    .bind(status, due, reason || null, r.friend, r.ms, r.tier, r.status).run();
  r.status = status; r.due_at = due; r.reason = reason || null;
}

/**
 * Advance one ref_ms row (wait → hold → paid/refused). Safe to repeat: every transition is a conditional UPDATE,
 * and the letter is inserted in the same transaction as the 'paid' flip, only while the row is still 'hold'.
 */
export async function processRow(env, r, cfg, now, cache = {}) {
  const ms = cfg.milestones.find((m) => m && m.id === r.ms);
  if (!ms) { await setRow(env, r, 'refused', now, 'no_ms'); return r.status; }
  const f = cache['u:' + r.friend] || (cache['u:' + r.friend] = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(r.friend).first());
  const rc = await env.DB.prepare('SELECT id, banned FROM users WHERE id=?').bind(r.rcpt).first();
  if (!f || (cfg.tgOnly && !f.tg_id)) { await setRow(env, r, 'refused', now, 'friend'); return r.status; }
  if (f.banned || (f.flags || 0) > (Number(cfg.maxFlags) || 0)) { await setRow(env, r, 'refused', now, 'flags'); return r.status; }
  if (!rc || rc.banned) { await setRow(env, r, 'refused', now, 'rcpt'); return r.status; }

  if (r.status === 'wait') {
    const facts = cache['f:' + r.friend] || (cache['f:' + r.friend] = await friendFacts(env, f, now));
    const g = gatesOk(ms.gates, facts);
    if (!g.ok) { await setRow(env, r, 'wait', now + (Number(cfg.waitRetryMin) || 360) * MIN, g.reason); return r.status; }
    await setRow(env, r, 'hold', Math.max(now, r.reached_at + (Number(cfg.holdHours) || 0) * HOUR), null);
  }
  if (r.status !== 'hold' || r.due_at > now) return r.status;

  // caps (per recipient)
  if (r.tier === 1) {
    const seen = await env.DB.prepare("SELECT COUNT(DISTINCT friend) n, SUM(friend=?) mine FROM ref_ms WHERE rcpt=? AND tier=1 AND status IN ('paid','legacy')").bind(r.friend, r.rcpt).first();
    if (!(seen && seen.mine) && (seen ? seen.n : 0) >= capOf(cfg.maxRewarded)) { await setRow(env, r, 'refused', now, 'cap'); return r.status; }
  } else {
    const m = await env.DB.prepare("SELECT COUNT(*) n FROM ref_ms WHERE rcpt=? AND tier>1 AND status='paid' AND paid_at>=?").bind(r.rcpt, now - 30 * DAY).first();
    if ((m ? m.n : 0) >= capOf(cfg.capMonthUpper)) { await setRow(env, r, 'refused', now, 'cap'); return r.status; }
  }
  const lim = await env.DB.prepare("SELECT SUM(paid_at>=?) d, COUNT(*) w FROM ref_ms WHERE rcpt=? AND status='paid' AND paid_at>=?").bind(now - DAY, r.rcpt, now - 7 * DAY).first();
  if (((lim && lim.d) || 0) >= capOf(cfg.capDay) || ((lim && lim.w) || 0) >= capOf(cfg.capWeek)) {
    await setRow(env, r, 'hold', now + (Number(cfg.capRetryMin) || 60) * MIN, 'cap_day');
    return r.status;
  }

  const lvl = cache['l:' + r.rcpt] || (cache['l:' + r.rcpt] = await heroLevel(env, r.rcpt));
  const { res, cosmetics } = msReward(cfg, ms, r.tier, lvl);
  const letters = [];
  const first = { ...res };
  if (cosmetics.length) first.cosmetic = cosmetics[0];
  if (Object.keys(first).length) letters.push(first);
  for (const c of cosmetics.slice(1)) letters.push({ cosmetic: c });
  const title = msTitle(ms, r.tier, String(f.display_name || f.first_name || 'Искроносец').slice(0, 32));
  const key = [r.friend, r.ms, r.tier];
  const st = letters.map((rw) => env.DB.prepare("INSERT INTO inbox (uid, kind, title, reward, created_at) SELECT ?,'referrer',?,?,? WHERE EXISTS (SELECT 1 FROM ref_ms WHERE friend=? AND ms=? AND tier=? AND status='hold')")
    .bind(r.rcpt, title.slice(0, 120), JSON.stringify(rw), now, ...key));
  st.push(env.DB.prepare("UPDATE ref_ms SET status='paid', paid_at=?, reward=?, reason=NULL WHERE friend=? AND ms=? AND tier=? AND status='hold'")
    .bind(now, JSON.stringify({ ...res, ...(cosmetics.length ? { cosmetics } : {}) }), ...key));
  await env.DB.batch(st);
  r.status = 'paid';
  return r.status;
}

/** Process this friend's due rows right away (after their cloud save). */
export async function processFriend(env, friend, now, cfg) {
  cfg = cfg || (await loadCircleConfig(env));
  const rows = (await env.DB.prepare("SELECT * FROM ref_ms WHERE friend=? AND status IN ('wait','hold') AND due_at<=? LIMIT 30").bind(friend, now).all()).results;
  const cache = {};
  const out = {};
  for (const r of rows) { const s = await processRow(env, r, cfg, now, cache); out[s] = (out[s] || 0) + 1; }
  return out;
}

/** Cron: re-read recently updated cloud saves of invited players, then advance due rows. */
export async function runCircleCron(env, now) {
  const cfg = await loadCircleConfig(env);
  const stats = { detected: 0, paid: 0, hold: 0, wait: 0, refused: 0 };
  const recent = (await env.DB.prepare(
    `SELECT u.*, s.summary FROM saves s JOIN users u ON u.id=s.uid WHERE s.updated_at>=? AND u.referred_by IS NOT NULL LIMIT ?`
  ).bind(now - (Number(cfg.recheckMin) || 30) * MIN, Number(cfg.cronBatch) || 200).all()).results;
  for (const u of recent) {
    let sm = null;
    try { sm = JSON.parse(u.summary); } catch { /* skip */ }
    if (sm) stats.detected += await detectMilestones(env, u, sm, now, cfg);
  }
  const rows = (await env.DB.prepare("SELECT * FROM ref_ms WHERE status IN ('wait','hold') AND due_at<=? ORDER BY due_at LIMIT ?").bind(now, Number(cfg.cronBatch) || 200).all()).results;
  const cache = {};
  for (const r of rows) {
    const s = await processRow(env, r, cfg, now, cache);
    stats[s] = (stats[s] || 0) + 1;
  }
  return stats;
}

/** Forget-me: open rows of this player (as friend or recipient) are refused; paid rows stay (accounting, no names). */
export function circleForgetStatements(env, uid) {
  return [env.DB.prepare("UPDATE ref_ms SET status='refused', reason='deleted' WHERE (friend=? OR rcpt=?) AND status IN ('wait','hold')").bind(uid, uid)];
}

/** Data for GET /referrals (v45.2 fields; old fields are built by the route). */
export async function circleView(env, user, friends, now) {
  const cfg = await loadCircleConfig(env);
  const myLvl = await heroLevel(env, user.id);
  const tiers = await env.DB.prepare('SELECT SUM(t1=?) a, SUM(t2=?) b, SUM(t3=?) c FROM ref_chain WHERE t1=? OR t2=? OR t3=?').bind(user.id, user.id, user.id, user.id, user.id, user.id).first();
  const rows = (await env.DB.prepare('SELECT friend, ms, tier, status, due_at, reward, reached_at FROM ref_ms WHERE rcpt=? ORDER BY reached_at').bind(user.id).all()).results;
  const earned = {};
  const byFriend = {};
  const held = [];
  const msOf = (id) => cfg.milestones.find((m) => m && m.id === id);
  for (const r of rows) {
    const fb = byFriend[r.friend] || (byFriend[r.friend] = { ms: [], pending: [], earned: {} });
    if (r.status !== 'refused') fb.ms.push(r.ms);
    if (r.status === 'paid' && r.reward) {
      let rw = {};
      try { rw = JSON.parse(r.reward); } catch { /* skip */ }
      for (const k in rw) if (typeof rw[k] === 'number') { earned[k] = (earned[k] || 0) + rw[k]; fb.earned[k] = (fb.earned[k] || 0) + rw[k]; }
    }
    if (r.status === 'wait' || r.status === 'hold') {
      const m = msOf(r.ms);
      const est = m ? msReward(cfg, m, r.tier, myLvl) : { res: {}, cosmetics: [] };
      const p = { ms: r.ms, tier: r.tier, status: r.status, dueAt: r.status === 'hold' ? Math.max(r.due_at, now) : null, reward: { ...est.res, ...(est.cosmetics.length ? { cosmetics: est.cosmetics } : {}) } };
      fb.pending.push(p);
      held.push(p);
    }
  }
  // friends' levels (cloud save) and tier
  const ids = friends.map((f) => f.uid);
  const levels = {};
  const tierOf = {};
  for (let i = 0; i < ids.length; i += 50) {
    const part = ids.slice(i, i + 50);
    const q = part.map(() => '?').join(',');
    for (const s of (await env.DB.prepare(`SELECT uid, summary FROM saves WHERE uid IN (${q})`).bind(...part).all()).results) {
      try { levels[s.uid] = JSON.parse(s.summary).lvl || null; } catch { /* skip */ }
    }
    for (const c of (await env.DB.prepare(`SELECT uid FROM ref_chain WHERE t1=? AND uid IN (${q})`).bind(user.id, ...part).all()).results) tierOf[c.uid] = 1;
  }
  const order = cfg.milestones.filter((m) => m && !m.join).map((m) => m.id);
  const per = friends.map((f) => {
    const fb = byFriend[f.uid] || { ms: [], pending: [], earned: {} };
    const next = order.find((id) => !fb.ms.includes(id)) || null;
    return {
      tier: tierOf[f.uid] || null,
      level: Number.isFinite(levels[f.uid]) ? levels[f.uid] : null,
      activated: f.ref_state === 'done' || f.ref_state === 'legacy' || fb.ms.includes('l5'),
      ms: [...new Set(fb.ms)],
      next,
      pending: fb.pending,
      earned: fb.earned,
    };
  });
  const table = cfg.milestones.filter(Boolean).map((m) => ({
    id: m.id, lvl: m.lvl || 1,
    rewards: [1, 2, 3].map((t) => { const x = msReward(cfg, m, t, myLvl); return { ...x.res, ...(x.cosmetics.length ? { cosmetics: x.cosmetics } : {}) }; }),
  }));
  return {
    per,
    extra: {
      tiers: { t1: (tiers && tiers.a) || 0, t2: (tiers && tiers.b) || 0, t3: (tiers && tiers.c) || 0 },
      earned,
      held,
      milestones: table,
      holdHours: Number(cfg.holdHours) || 0,
      shares: cfg.shares,
      myLevel: myLvl,
    },
  };
}
