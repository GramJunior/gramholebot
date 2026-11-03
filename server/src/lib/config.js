// Live config: values stored in the `config` table override these defaults.
// Admins change them through PUT /admin/config/<key> (see README).

export const CONFIG_KEYS = ['season', 'battlepass', 'events', 'shop', 'products', 'daily', 'referral', 'raid'];

const DAY = 86400000;

export const DEFAULTS = {
  // Current season. null = no season (season leaderboard is empty).
  season: null, // { id:'s1', name:'Сезон 1', start: <ms>, end: <ms> }

  // Season pass «Путь Угля»: 30 tiers. `cosmetic` ids are the game's cosmetics (apps/emberveil/src/p18.js COSM).
  // The game counts pass XP from play itself; the server keeps its own XP from validated actions (abyss, raids, daily),
  // and the game shows the larger of the two. Premium = entitlement `premiumProduct` (Telegram Stars).
  battlepass: {
    season: 's1',
    name: 'Путь Угля',
    xpPerTier: 100,
    premiumProduct: 'bp_s1',
    tiers: Array.from({ length: 30 }, (_, i) => {
      const t = i + 1;
      const FREE_COS = { 5: 'glow_ember', 10: 'skin_ash', 15: 'deco_banners', 20: 'frame_ember', 25: 'pet_ember', 30: 'glow_gold' };
      const PREM_COS = ['frame_gold', 'glow_frost', 'pet_shadow', 'skin_frost', 'deco_statue', 'glow_void', 'skin_abyss', 'pet_gold', 'deco_bonfire', 'skin_royal'];
      return {
        tier: t,
        free: FREE_COS[t] ? { cosmetic: FREE_COS[t] } : t % 3 === 0 ? { shards: 6 + t } : t % 2 ? { gold: 150 + t * 40 } : { ess: 8 + t },
        premium: t % 3 === 0 ? { cosmetic: PREM_COS[t / 3 - 1] } : { sparks: 10 + Math.floor(t / 5) * 5 }, // sparks = cosmetic-only currency
      };
    }),
    // XP earned for server-validated actions:
    xp: { abyssFloor: 8, raidStar: 10, daily: 25, quest: 15 },
  },

  // [{ id, name, start, end, modifiers: { goldMul, dropMul, abyssMod, ... }, descr }]
  // Empty here = the game uses its built-in rotation (weekend «Выходные удачи», «Ночь Пепла», seasonal boss «Эхо Колосса»).
  // Put explicit windows here to override (see README «События»).
  events: [],

  // Village shop rotation (prices in game currency, applied on the client).
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

  // Telegram Stars products (no pay-to-win: cosmetics + battle pass).
  products: [
    { id: 'bp_s1', title: 'Боевой пропуск — Сезон 1', description: 'Премиум-дорожка: облики, рамки, эмоции питомцев', stars: 250, type: 'battlepass', once: true },
    { id: 'skin_cloak_ember', title: 'Плащ «Тлеющий»', description: 'Косметический облик героя', stars: 100, type: 'cosmetic', once: true },
    { id: 'pack_village_lanterns', title: 'Фонари Брода', description: 'Украшения для деревни', stars: 75, type: 'cosmetic', once: true },
    { id: 'pet_skin_frost', title: 'Иней для питомца', description: 'Скин питомца', stars: 90, type: 'cosmetic', once: true },
    { id: 'pack_dawn', title: 'Набор «Рассвет Вейла»', description: 'Облик, свечение оружия и рамка портрета', stars: 150, type: 'cosmetic', once: true },
    { id: 'keeper_30d', title: 'Хранитель Брода (30 дней)', description: 'Больше склада и аура, без боевых бонусов', stars: 200, type: 'subscription', once: false, days: 30 },
  ],

  // 7-day cycle of login rewards (resource keys match the game save: gold/wood/ore/ess/shards).
  daily: {
    rewards: [
      { gold: 150 }, { wood: 80, ore: 40 }, { ess: 15 }, { gold: 300 },
      { shards: 8 }, { gold: 400, ess: 20 }, { shards: 20, gold: 500 },
    ],
    quests: ['d_kill', 'd_chest', 'd_stage', 'd_elite', 'd_abyss', 'd_salv', 'd_boss', 'd_nopot'],
    maxQuestsPerDay: 5,
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
  const rows = (await env.DB.prepare('SELECT key, value, updated_at FROM config').all()).results || [];
  for (const r of rows) {
    if (!CONFIG_KEYS.includes(r.key)) continue;
    try { out[r.key] = JSON.parse(r.value); } catch { /* keep default */ }
    version = Math.max(version, r.updated_at);
  }
  out.version = version;
  return out;
}

export async function getConfigKey(env, key) {
  const r = await env.DB.prepare('SELECT value FROM config WHERE key=?').bind(key).first();
  if (r) { try { return JSON.parse(r.value); } catch { /* fallthrough */ } }
  return structuredClone(DEFAULTS[key]);
}

export function activeSeason(cfg, now) {
  const s = cfg.season;
  if (!s || !s.id) return null;
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

export { DAY };
