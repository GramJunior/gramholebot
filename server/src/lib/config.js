// Live config: values stored in the `config` table override these defaults.
// Admins change them through PUT /admin/config/<key> (see README).
import { CALENDAR, PASSES, GOALS, WB_ROTATION, CLAN_GOAL } from './liveops.js';

export const CONFIG_KEYS = ['season', 'battlepass', 'events', 'shop', 'products', 'daily', 'referral', 'raid', 'freeChestHours', 'ads', 'passes', 'goals', 'wb', 'clanGoal'];

const DAY = 86400000;

export const DEFAULTS = {
  // Current season. null = no season (season leaderboard is empty).
  season: null, // { id:'s1', name:'Сезон 1', start: <ms>, end: <ms> }

  // Season pass «Путь Угля»: 50 tiers × 200 XP (v40; was 30 × 100 — finished in the first week). Existing progress: migration 0006 doubles XP (same tier). `cosmetic` ids are the game's cosmetics (apps/emberveil/src/p18.js COSM).
  // v42: + «Огниво» tiers 51–60 (cosmetics only). Legacy single-pass key; the dated list is `passes` (s1 → s2 «Долгая Стужа» 15.01.2027), src/lib/liveops.js.
  // The game counts pass XP from play itself; the server keeps its own XP from validated actions (abyss, raids, daily),
  // and the game shows the larger of the two. Premium = entitlement `premiumProduct` (Telegram Stars).
  // XP earned for server-validated actions (`xp`): daily login 60, daily contract 25 (as v34), abyss floor 8, raid star 10.
  battlepass: PASSES[0],
  // v42: season passes by date (the one whose [start, end) contains now is active; see liveops.js currentPass)
  passes: PASSES,
  // v42: server-wide shared goals (owned by calendar events via modifiers.goal), weekly overlord rotation, clan weekly goal
  goals: GOALS,
  wb: { rotation: WB_ROTATION },
  clanGoal: CLAN_GOAL,

  // [{ id, base, name, start, end, modifiers: { goldMul, dropMul, abyssMod, goal, ... }, descr }]
  // v42: dated calendar 16.11.2026 – 14.02.2027 (liveops.md §5.4) instead of the eternal weekly rotation; the game has the same list as a fallback.
  // PUT /admin/config/events replaces it (see README «События и сезоны v42»); [] = no events at all.
  events: CALENDAR,

  // Village shop rotation (prices in game currency, applied on the client).
  // Free wooden chest timer (POST /chest/free), hours.
  freeChestHours: 4,

  // v39.4: rewarded ads (Adsgram). Block ids are public (they end up in the page anyway), not secrets.
  // blockRewarded — id of the Rewarded block (e.g. "12345"); blockInterstitial — optional Interstitial block (e.g. "int-12345").
  // verify — true once the block's Reward URL points at GET /ads/reward: valuable ad rewards then need a server credit.
  // caps — per-placement daily limits for spending credits on the server (the game has the same caps, src/p18.js ADS.lim).
  ads: { blockRewarded: '', blockInterstitial: '', verify: false, caps: { revive: 2, chest: 1, fchest: 1 } },

  shop: {
    rotationHours: 24,
    slots: 4,
    pool: [
      { id: 'potion5', name: 'Связка зелий ×5', cost: { gold: 300 }, give: { potion: 5 } },
      { id: 'bomb3', name: 'Бомбы ×3', cost: { gold: 240 }, give: { bomb: 3 } },
      { id: 'ess40', name: 'Эссенция ×40', cost: { gold: 500 }, give: { ess: 40 } },
      { id: 'ore80', name: 'Руда ×80', cost: { gold: 350 }, give: { ore: 80 } },
      { id: 'wood120', name: 'Древесина ×120', cost: { gold: 320 }, give: { wood: 120 } },
      { id: 'scroll', name: 'Свиток возвращения', cost: { gold: 200 }, give: { scroll: 1 } },
      { id: 'shards15', name: 'Осколки Бездны ×15', cost: { ess: 60 }, give: { shards: 15 } },
    ],
  },

  // Telegram Stars products. Cosmetics/pass/subscription are entitlements; products with `grant` are consumables:
  // the game claims them once via POST /pay/claim (idempotent). `once` — buy once, `weekly` — once per ISO week.
  // v41: `firstX2` — the very first purchase of this pack grants its `grant` twice (server-side, once per product);
  // `days` + `perDay` — a timed card: /pay/seal hands out perDay gems once per game day while the entitlement is active.
  // Paid chests (open_gold/open_leg) share the game's daily chest limit (gold ≤ 3, legendary ≤ 1; extras wait until the next day),
  // items from paid chests are capped at the last cleared stage level and legendary rarity (src/p93.js).
  // Grant keys (applied by the game, src/p21.js grantBundle): sparks (= «Самоцветы»), open_<tier> (chest opened now),
  // chest_<tier> (stored chest), key_iron/key_gold/key_leg, frag, prot/tome/potion…, slot2 (second builder), spin (Wheel of Fortune spins, src/p71.js).
  // No combat power is sold directly: gems buy time/chests; PvP raids & Abyss board use «Честный бой» (see game README).
  products: [
    { id: 'crys_80', title: 'Горсть самоцветов', description: '80 самоцветов', stars: 49, type: 'currency', grant: { sparks: 80 }, firstX2: true },
    { id: 'crys_450', title: 'Мешочек самоцветов', description: '450 самоцветов (+12%)', stars: 249, type: 'currency', grant: { sparks: 450 }, tag: 'Хит', firstX2: true },
    { id: 'crys_1000', title: 'Сундучок самоцветов', description: '1000 самоцветов (+25%)', stars: 499, type: 'currency', grant: { sparks: 1000 }, firstX2: true },
    { id: 'crys_2200', title: 'Казна самоцветов', description: '2200 самоцветов (+37%)', stars: 999, type: 'currency', grant: { sparks: 2200 }, tag: 'Выгодно', firstX2: true },
    { id: 'starter_pack', title: 'Набор новичка', description: '300 самоцветов, 2 золотых сундука, 2 железных сундука, 3 свитка удачи', stars: 99, type: 'bundle', once: true, grant: { sparks: 300, open_gold: 2, chest_iron: 2, prot: 3 }, tag: '×4 выгода' },
    // v41: «Набор приключенца» — первая покупка «на пробу» (один раз): самоцветы и рамка портрета (cos_<id> — косметика из src/p18.js COSM)
    { id: 'adv_pack', title: 'Набор приключенца', description: '100 самоцветов и рамка портрета «Приключенца»', stars: 29, type: 'bundle', once: true, grant: { sparks: 100, cos_frame_adv: 1 }, tag: 'Проба' },
    { id: 'weekly_pack', title: 'Недельный набор', description: '400 самоцветов, легендарный сундук (в дневном лимите), 2 золотых ключа', stars: 149, type: 'bundle', weekly: true, grant: { sparks: 400, open_leg: 1, key_gold: 2 } },
    { id: 'build_slot', title: 'Второй строитель', description: 'Навсегда: две стройки одновременно (+50 самоцветов)', stars: 199, type: 'bundle', once: true, grant: { slot2: 1, sparks: 50 } },
    { id: 'chest_gold3', title: 'Три золотых сундука', description: 'Открываются сразу (в дневном лимите: 3 золотых в день)', stars: 99, type: 'bundle', grant: { open_gold: 3 } },
    { id: 'chest_leg1', title: 'Легендарный сундук', description: 'Легендарная вещь гарантирована (1 легендарный сундук в день)', stars: 119, type: 'bundle', grant: { open_leg: 1 } },
    // Колесо судьбы (игра v34, хаб «Награды»): купленные вращения копятся в сохранении и не сгорают; grant.spin — число вращений
    { id: 'spin_1', title: 'Вращение Колеса', description: '1 вращение Колеса судьбы', stars: 25, type: 'spin', grant: { spin: 1 } },
    { id: 'spin_10', title: '10 вращений Колеса', description: '10 вращений Колеса судьбы (−20%)', stars: 200, type: 'spin', grant: { spin: 10 }, tag: '−20%' },
    { id: 'bp_s1', title: 'Боевой пропуск — Сезон 1', description: 'Премиум-дорожка: облики, рамки, эмоции питомцев', stars: 250, type: 'battlepass', once: true, season: 's1' },
    // v42: S2 «Долгая Стужа» (15.01–26.02.2027); the game shows only the product of the current season
    { id: 'bp_s2', title: 'Боевой пропуск — «Долгая Стужа»', description: 'Премиум-дорожка сезона 2: облики, свечения, рамки и самоцветы', stars: 250, type: 'battlepass', once: true, season: 's2' },
    { id: 'skin_cloak_ember', title: 'Плащ «Тлеющий»', description: 'Косметический облик героя', stars: 100, type: 'cosmetic', once: true },
    { id: 'pack_village_lanterns', title: 'Фонари Брода', description: 'Украшения для деревни', stars: 75, type: 'cosmetic', once: true },
    { id: 'pet_skin_frost', title: 'Иней для питомца', description: 'Скин питомца', stars: 90, type: 'cosmetic', once: true },
    { id: 'pack_dawn', title: 'Набор «Рассвет Вейла»', description: 'Облик, свечение оружия и рамка портрета', stars: 150, type: 'cosmetic', once: true },
    // v41: «Хранитель Брода» — только удобство (как в игре, src/p20.js/p21.js): склад +6 ч, +10 мест в сумке, стройка и ковка на 10% быстрее, рамка. Боевых бонусов нет.
    { id: 'keeper_30d', title: 'Хранитель Брода (30 дней)', description: 'Склад копит на 6 ч дольше, +10 мест в сумке, стройка и ковка на 10% быстрее, рамка. Без боевых бонусов', stars: 200, type: 'subscription', once: false, days: 30 },
    // v41: месячная карта «Угольная печать»: 150 самоцветов сразу (grant, /pay/claim) + perDay самоцветов раз в игровой день за вход (POST /pay/seal), пока печать действует (days)
    { id: 'coal_seal', title: 'Угольная печать (30 дней)', description: '150 самоцветов сразу и 40 каждый день за вход — 30 дней (в «Наградах»)', stars: 199, type: 'bundle', days: 30, perDay: 40, grant: { sparks: 150 }, tag: '×7' },
  ],

  // 7-day cycle of login rewards (resource keys match the game save: gold/wood/ore/ess/shards).
  daily: {
    rewards: [
      { gold: 150 }, { wood: 80, ore: 40 }, { ess: 15 }, { gold: 300 },
      { shards: 8 }, { gold: 400, ess: 20 }, { shards: 20, gold: 500 },
    ],
    quests: ['d_kill', 'd_chest', 'd_stage', 'd_elite', 'd_abyss', 'd_salv', 'd_boss', 'd_nopot'],
    maxQuestsPerDay: 3, // v42: 3 contracts a day (liveops §3)
  },

  referral: {
    referrer: { gold: 500, ess: 25 },
    referee: { gold: 300, ess: 15 },
    maxRewarded: 50,
  },

  raid: {
    // loot = base * hallLevel * starMul[stars]
    base: { gold: 120, wood: 60, ore: 30 },
    starMul: [0.15, 0.5, 0.8, 1.2],
    shieldHours: 4,
    revengeHours: 48,
  },
};

/** Load all config rows merged over defaults. */
export async function loadConfig(env) {
  const out = structuredClone(DEFAULTS);
  let version = 0;
  const stored = [];
  const rows = (await env.DB.prepare('SELECT key, value, updated_at FROM config').all()).results || [];
  for (const r of rows) {
    if (!CONFIG_KEYS.includes(r.key)) continue;
    try { out[r.key] = JSON.parse(r.value); stored.push(r.key); } catch { /* keep default */ }
    version = Math.max(version, r.updated_at);
  }
  out.version = version;
  Object.defineProperty(out, '_stored', { value: stored, enumerable: false }); // v42: which keys an admin overrode (liveops.js currentPass)
  return out;
}

export async function getConfigKey(env, key) {
  const r = await env.DB.prepare('SELECT value FROM config WHERE key=?').bind(key).first();
  if (r) { try { return JSON.parse(r.value); } catch { /* fallthrough */ } }
  return structuredClone(DEFAULTS[key]);
}

export function activeSeason(cfg, now) {
  const s = cfg.season && cfg.season.id ? cfg.season : null;
  if (!s) return datedSeason(cfg, now); // v42: no explicit season → the dated pass (s1, s2…) is the season
  if (s.start && now < s.start) return null;
  if (s.end && now >= s.end) return null;
  return s;
}

export function activeEvents(events, now) {
  return (Array.isArray(events) ? events : []).filter((e) => e && (!e.start || now >= e.start) && (!e.end || now < e.end));
}

/** Deterministic shop rotation for the current time bucket. */
export function shopRotation(shop, now) {
  const hours = Math.max(1, Number(shop.rotationHours) || 24);
  const bucket = Math.floor(now / (hours * 3600000));
  const pool = Array.isArray(shop.pool) ? shop.pool.slice() : [];
  let seed = (bucket * 2654435761) >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { rotation: bucket, items: pool.slice(0, Math.max(0, Number(shop.slots) || 4)), endsAt: (bucket + 1) * hours * 3600000 };
}

function datedSeason(cfg, now) {
  const list = Array.isArray(cfg.passes) ? cfg.passes : [];
  const p = list.find((x) => x && x.season && x.start && x.end && now >= x.start && now < x.end);
  return p ? { id: p.season, name: p.name, start: p.start, end: p.end } : null;
}

export { DAY };
