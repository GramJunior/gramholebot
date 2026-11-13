// Daily login reward with streaks + daily contract claim validation.
// The "day" is decided by the server clock (DAY_OFFSET_MIN, default UTC+3),
// so moving the phone clock forward does nothing.
//   GET  /daily
//   POST /daily/claim            -> { reward, streak }
//   POST /quests/claim { questId } -> { ok }  (once per contract per day, max N per day)
import { fail, json, readJson, str } from '../lib/http.js';
import { requireUser } from './auth.js';
import { dayKey, prevDayKey, nextDayStart } from '../lib/time.js';
import { loadConfig } from '../lib/config.js';
import { addBpXp, addContrib } from '../lib/common.js';

/** Pure streak logic. */
export function nextStreak(row, today) {
  if (!row) return { claimable: true, streak: 1 };
  // v42: a stored day after `today` (the day key moved back when the reset hour changed) counts as claimed today
  if (row.last_day === today || row.last_day > today) return { claimable: false, streak: row.streak };
  return { claimable: true, streak: row.last_day === prevDayKey(today) ? row.streak + 1 : 1 };
}

const rewardFor = (cfg, streak) => {
  const list = (cfg.daily && cfg.daily.rewards) || [];
  return list.length ? list[(streak - 1) % list.length] : {};
};

export async function getDaily(c) {
  const user = await requireUser(c);
  const cfg = await loadConfig(c.env);
  const today = dayKey(c.now, c.env);
  const row = await c.env.DB.prepare('SELECT * FROM daily WHERE uid=?').bind(user.id).first();
  const ns = nextStreak(row, today);
  const quests = (await c.env.DB.prepare('SELECT quest_id FROM quest_claims WHERE uid=? AND day=?').bind(user.id, today).all()).results.map((r) => r.quest_id);
  return json({
    ok: true, day: today, serverTime: c.now, resetsAt: nextDayStart(c.now, c.env),
    canClaim: ns.claimable, streak: ns.claimable ? (row ? row.streak : 0) : row.streak,
    total: row ? row.total : 0, // login days claimed in total (the client's 28-day calendar position)
    nextReward: rewardFor(cfg, ns.streak), nextStreak: ns.streak,
    questsClaimed: quests, questSeed: today, // the client can seed its contract list with this
  });
}

export async function claimDaily(c) {
  const user = await requireUser(c);
  const cfg = await loadConfig(c.env);
  const today = dayKey(c.now, c.env);
  const row = await c.env.DB.prepare('SELECT * FROM daily WHERE uid=?').bind(user.id).first();
  const ns = nextStreak(row, today);
  if (!ns.claimable) fail(409, 'claimed', 'Награда за сегодня уже получена', { resetsAt: nextDayStart(c.now, c.env) });
  let r;
  if (row) {
    r = await c.env.DB.prepare('UPDATE daily SET last_day=?, streak=?, total=total+1 WHERE uid=? AND last_day=?').bind(today, ns.streak, user.id, row.last_day).run();
  } else {
    r = await c.env.DB.prepare('INSERT INTO daily (uid, last_day, streak, total) VALUES (?,?,?,1) ON CONFLICT DO NOTHING').bind(user.id, today, ns.streak).run();
  }
  if (!r.meta.changes) fail(409, 'claimed', 'Награда за сегодня уже получена');
  await addBpXp(c.env, user.id, (cfg.battlepass.xp && cfg.battlepass.xp.daily) || 0, c.now, cfg);
  return json({ ok: true, day: today, streak: ns.streak, total: (row ? row.total : 0) + 1, reward: rewardFor(cfg, ns.streak), resetsAt: nextDayStart(c.now, c.env) });
}

export async function claimQuest(c) {
  const user = await requireUser(c);
  const body = await readJson(c.req, 512);
  const cfg = await loadConfig(c.env);
  const today = dayKey(c.now, c.env);
  const qid = str(body.questId, 32);
  const d = cfg.daily || {};
  if (!(d.quests || []).includes(qid)) fail(400, 'bad_quest', 'Неизвестный контракт');
  if (body.day && body.day !== today) fail(409, 'day_over', 'Этот день уже закончился', { day: today });
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM quest_claims WHERE uid=? AND day=?').bind(user.id, today).first();
  if ((n ? n.n : 0) >= (d.maxQuestsPerDay || 3)) fail(429, 'quest_limit', 'Контракты на сегодня закончились');
  const r = await c.env.DB.prepare('INSERT INTO quest_claims (uid, day, quest_id, ts) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').bind(user.id, today, qid, c.now).run();
  if (!r.meta.changes) fail(409, 'claimed', 'Контракт уже сдан');
  await addBpXp(c.env, user.id, (cfg.battlepass.xp && cfg.battlepass.xp.quest) || 0, c.now, cfg);
  await addContrib(c.env, user.id, 2, c.now); // v42: a daily contract brings the clan 2 points (liveops.md §6.3)
  return json({ ok: true, day: today, questId: qid });
}
