// v42 live-ops: dated event calendar, season passes (s1 «Путь Угля» + «Огниво» 51–60, s2 «Долгая Стужа»),
// weekly overlord rotation («Владыка недели»), server-wide shared goals («Ночь Долгих Углей») and clan weekly goals.
// Pure data + pure functions (unit tested). The game has the same tables as a fallback (apps/emberveil/src/p98.js).
// Docs: apps/emberveil/docs/review-v41/liveops.md §4.2–4.5, §5, §6.3; README «События и сезоны v42».
import { dayKey, DAY_MS } from './time.js';

const MSK = (d, h = 5) => Date.parse(`${d}T${String(h).padStart(2, '0')}:00:00+03:00`);
// Event windows open at 05:00 МСК (the daily reset) on the first day and close at 05:00 МСК after the last day.
const win = (from, to) => ({ start: MSK(from), end: MSK(to) + DAY_MS });

const LUCKY = { base: 'lucky_weekend', name: 'Выходные удачи', type: 'bonus', icon: 'gold', col: '#ffd27a', descr: 'Двойная добыча: вещи падают вдвое чаще, золота ×1,5. Опыт пропуска ×1,5.', modifiers: { dropMul: 2, goldMul: 1.5, xpMul: 1.5 } };

/** Event calendar 16.11.2026 – 14.02.2027 (liveops.md §5.4). `id` is unique per window; `base` names the mechanic. */
export const CALENDAR = [
  { id: 'lucky_2611a', ...LUCKY, ...win('2026-11-21', '2026-11-22') },
  { id: 'ash_night_26', base: 'ash_night', name: 'Ночь Пепла', type: 'challenge', icon: 'abyss', col: '#b04aff', ...win('2026-11-26', '2026-11-30'),
    descr: 'Бездна темнеет: на каждом этаже «Тьма» и «Ярость», зато осколков ×2. Цель дня — 3 этажа; 5 дней из 5 — рамка «Пепельная».',
    modifiers: { abyssMod: 'ashnight', shardMul: 2 }, quest: { kind: 'floors', perDay: 3, days: 5, reward: { cosmetic: 'frame_ash' } } },
  { id: 'lucky_2612a', ...LUCKY, ...win('2026-12-05', '2026-12-06') },
  { id: 'hmar_hunt_26', base: 'hmar_hunt', name: 'Охота на Хмарь', type: 'collection', icon: 'eye', col: '#8a7ad0', ...win('2026-12-10', '2026-12-17'),
    descr: 'Элита и чемпионы роняют «клочья Хмари». Меняйте их в лавке события — товары обновляются на 1-й, 4-й и 7-й день.',
    modifiers: { collect: 'wisp' } },
  { id: 'lucky_2612b', ...LUCKY, ...win('2026-12-19', '2026-12-20') },
  { id: 'long_embers_26', base: 'long_embers', name: 'Ночь Долгих Углей', type: 'community', icon: 'flame', col: '#ff9a3a', ...win('2026-12-24', '2027-01-08'),
    descr: 'Весь Вейл зажигает огни: каждый этап, этаж Бездны, набег и владыка добавляют огни в общую цель. Пороги 25/50/75/100% — подарок всем участникам. Каждый день — свеча, награда каждые 4 свечи.',
    modifiers: { goal: 'embers26' } },
  { id: 'colossus_echo_26', base: 'colossus_echo', name: 'Эхо Колосса', type: 'boss', icon: 'skull', col: '#ff7a3a', ...win('2026-12-28', '2027-01-03'),
    descr: 'Сезонный босс: стражи Бездны на 5-м и 10-м этажах — «Эхо Колосса». Первая победа за событие — трофей «Осколок Эха» и самоцветы.',
    modifiers: { seasonBoss: 'colossus' } },
  { id: 'lucky_2701a', ...LUCKY, ...win('2027-01-09', '2027-01-10') },
  { id: 's2_start', base: 's2_start', name: 'Долгая Стужа', type: 'season', icon: 'snow', col: '#9fe8ff', ...win('2027-01-15', '2027-01-17'),
    descr: 'Новый сезон: мороз ползёт к Броду. Новый «Путь» на 50 уровней, Владыка недели — Воевода Стужень.', modifiers: {} },
  { id: 'aurora_27', base: 'aurora', name: 'Цвета сияния', type: 'clan', icon: 'flag', col: '#7af0c8', ...win('2027-01-22', '2027-01-29'),
    descr: 'Кланы «окрашивают» сияние: очки недели клана ×2. Всем, кто внёс вклад в клан, взявший 1-й порог, — рамка «Сияния».',
    modifiers: { clanMul: 2, clanFrame: 'frame_aurora' } },
  { id: 'lucky_2701b', ...LUCKY, ...win('2027-01-30', '2027-01-31') },
  { id: 'two_sparks_27', base: 'two_sparks', name: 'Две искры', type: 'friends', icon: 'heart', col: '#ff8ab0', ...win('2027-02-06', '2027-02-13'),
    descr: 'Играйте вместе: этапы с другом или соклановцем в клане, подарки друг другу. Облик «Парные угли» — тем, кто внёс вклад в цель клана.',
    modifiers: { clanFrame: 'skin_pair' } },
];

// ---------------- season passes ----------------
const S1_FREE = { 5: 'glow_ember', 10: 'skin_ash', 20: 'deco_banners', 30: 'frame_ember', 40: 'pet_ember', 50: 'glow_gold' };
const S1_PREM = ['frame_gold', 'glow_frost', 'pet_shadow', 'skin_frost', 'deco_statue', 'glow_void', 'skin_abyss', 'pet_gold', 'deco_bonfire', 'skin_royal'];
// «Огниво» (owner decision s1, 12.11.2026): tiers 51–60, cosmetics only. Free — even tiers, premium — every tier.
export const FLINT_FREE = { 52: 'frame_flint', 54: 'glow_tinder', 56: 'pet_cinder', 58: 'frame_tinder', 60: 'skin_flint' };
export const FLINT_PREM = { 51: 'glow_spark', 52: 'frame_steel', 53: 'pet_ash', 54: 'skin_cinder', 55: 'glow_forge', 56: 'frame_flame', 57: 'pet_spark', 58: 'skin_smith', 59: 'glow_hearth', 60: 'skin_hearth' };
// S2 «Долгая Стужа» (placeholders — the art pass replaces tints; ids are stable)
const S2_FREE = { 5: 'glow_rime', 10: 'frame_rime', 20: 'pet_rime', 30: 'deco_icicles', 40: 'skin_northman', 50: 'glow_aurora' };
const S2_PREM = ['frame_frostcrown', 'glow_icefire', 'pet_snowowl', 'skin_rime', 'deco_snowmen', 'glow_blizzard', 'skin_legion', 'pet_frostwolf', 'frame_aurora2', 'skin_belava'];

function s1Tier(t) {
  if (t > 50) return { tier: t, free: FLINT_FREE[t] ? { cosmetic: FLINT_FREE[t] } : null, premium: { cosmetic: FLINT_PREM[t] }, flint: true };
  return {
    tier: t,
    // same table as the game (apps/emberveil/src/p18.js passTiersDefault)
    free: S1_FREE[t] ? { cosmetic: S1_FREE[t] } : t % 3 === 0 ? { shards: 6 + Math.round(t * 0.6) } : t % 2 ? { gold: 150 + t * 25 } : { ess: 8 + Math.round(t * 0.6) },
    premium: t % 5 === 0 ? { cosmetic: S1_PREM[t / 5 - 1] } : { sparks: 10 + Math.floor(t / 10) * 5 }, // sparks = cosmetic-only currency
  };
}
function s2Tier(t) {
  return {
    tier: t,
    free: S2_FREE[t] ? { cosmetic: S2_FREE[t] } : t % 3 === 0 ? { shards: 7 + Math.round(t * 0.6) } : t % 2 ? { gold: 180 + t * 25 } : { ess: 9 + Math.round(t * 0.6) },
    premium: t % 5 === 0 ? { cosmetic: S2_PREM[t / 5 - 1] } : { sparks: 10 + Math.floor(t / 10) * 5 },
  };
}
export const PASS_XP = { abyssFloor: 8, raidStar: 10, daily: 60, quest: 25 };
export const PASSES = [
  { season: 's1', name: 'Путь Угля', theme: 'Последний уголь Вейла', start: Date.parse('2026-11-01T00:00:00+03:00'), end: Date.parse('2027-01-15T00:00:00+03:00'),
    xpPerTier: 200, premiumProduct: 'bp_s1', tiers: Array.from({ length: 60 }, (_, i) => s1Tier(i + 1)), xp: PASS_XP },
  { season: 's2', name: 'Долгая Стужа', theme: 'Белава, Царевна Стужи; мороз ползёт к Броду', start: Date.parse('2027-01-15T00:00:00+03:00'), end: Date.parse('2027-02-26T00:00:00+03:00'),
    xpPerTier: 200, premiumProduct: 'bp_s2', tiers: Array.from({ length: 50 }, (_, i) => s2Tier(i + 1)), xp: PASS_XP, lateBoost: { days: 14, mul: 1.5 } },
];

/**
 * Pass of `now`: the one whose window contains `now`; before the first — the first, after the last — the last.
 * A stored `battlepass` row (legacy admin override) wins for its own season.
 */
export function currentPass(cfg, now) {
  const list = Array.isArray(cfg.passes) && cfg.passes.length ? cfg.passes : PASSES;
  let p = list.find((x) => (!x.start || now >= x.start) && (!x.end || now < x.end));
  if (!p) p = now < (list[0].start || 0) ? list[0] : list[list.length - 1];
  const bp = cfg._stored && cfg._stored.includes('battlepass') ? cfg.battlepass : null;
  if (bp && bp.season === p.season) p = { ...p, ...bp };
  return p;
}
export function nextPass(cfg, now) {
  const list = Array.isArray(cfg.passes) && cfg.passes.length ? cfg.passes : PASSES;
  return list.find((x) => x.start && x.start > now) || null;
}
/** Season object for /config and leaderboards: explicit `season` config, else the dated pass. */
export function seasonOf(cfg, now) {
  if (cfg.season && cfg.season.id) return cfg.season;
  const p = currentPass(cfg, now);
  return p && (!p.start || now >= p.start) && (!p.end || now < p.end) ? { id: p.season, name: p.name, start: p.start, end: p.end, theme: p.theme } : null;
}

/** Validation of an admin `passes` / `battlepass` config. Returns an error string or ''. */
export function passError(p) {
  if (!p || typeof p !== 'object') return 'пропуск — объект';
  if (!/^[a-z0-9_-]{1,32}$/i.test(p.season || '')) return 'season — id сезона (a-z0-9_-)';
  if (!Number.isInteger(p.xpPerTier) || p.xpPerTier < 50 || p.xpPerTier > 10000) return 'xpPerTier — целое 50..10000';
  if (!Array.isArray(p.tiers) || p.tiers.length < 5 || p.tiers.length > 100) return 'tiers — массив из 5..100 уровней';
  for (let i = 0; i < p.tiers.length; i++) {
    const t = p.tiers[i];
    if (!t || t.tier !== i + 1) return `tiers[${i}].tier должен быть ${i + 1}`;
    for (const trk of ['free', 'premium']) {
      const rw = t[trk];
      if (rw === null || rw === undefined) continue;
      if (typeof rw !== 'object' || Array.isArray(rw)) return `уровень ${t.tier}: ${trk} — объект награды`;
      for (const [k, v] of Object.entries(rw)) {
        if (k === 'cosmetic') { if (typeof v !== 'string' || !/^[a-z0-9_]{2,40}$/.test(v)) return `уровень ${t.tier}: cosmetic — id облика`; continue; }
        if (!/^[a-z0-9_]{2,16}$/.test(k) || !Number.isFinite(v) || v < 0 || v > 100000) return `уровень ${t.tier}: ${trk}.${k} — число 0..100000`;
      }
      // anti-P2W (economy.md §5): the premium track is cosmetic-only — облики и самоцветы
      if (trk === 'premium' && Object.keys(rw).some((k) => k !== 'cosmetic' && k !== 'sparks')) return `уровень ${t.tier}: премиум — только облики (cosmetic) и самоцветы (sparks)`;
    }
    if (t.flint && t.free && Object.keys(t.free).some((k) => k !== 'cosmetic')) return `уровень ${t.tier}: «Огниво» — только облики`;
  }
  if (p.start && p.end && p.end <= p.start) return 'end должен быть позже start';
  return '';
}

// ---------------- weekly overlord ----------------
export const WB_START = '2026-11-16'; // Monday of rotation week 0
// boss id → stage that opens it (the player must have beaten it; otherwise the nearest open boss is used, same modifiers)
export const WB_BOSS = { gobKing: '1-5', rotroot: '2-5', bogMother: '3-5', morven: '4-5', colossus: '5-5', dragon: '6-5', stuzhen: '7-4', belava: '7-5' };
export const WB_MODS = ['fury', 'dark', 'ash', 'nopot', 'tough', 'adds', 'fragile', 'frost'];
export const WB_ROTATION = [
  { boss: 'gobKing', mods: ['fury', 'adds'] },
  { boss: 'rotroot', mods: ['ash', 'nopot'] },
  { boss: 'bogMother', mods: ['tough', 'dark'] },
  { boss: 'colossus', mods: ['fury', 'fragile'] },
  { boss: 'dragon', mods: ['dark', 'ash'] },
  { boss: 'gobKing', mods: ['nopot', 'adds'], name: 'Брюхан зимний' },
  { boss: 'colossus', mods: ['fury', 'tough'], name: 'Эхо Колосса' },
  { boss: 'rotroot', mods: ['tough', 'fury'] },
  { boss: 'bogMother', mods: ['fragile', 'dark'] },
  { boss: 'stuzhen', mods: ['fury', 'frost'] },
  { boss: 'belava', mods: ['dark', 'nopot'] },
  { boss: 'dragon', mods: ['adds', 'ash'] },
];
// tiers: Бронза / Серебро / Золото. Clan points per first clear of the tier this week (liveops.md §6.3: 10/20/30).
export const WB_TIERS = [
  { tier: 1, name: 'Бронза', clan: 10, ember: 20 },
  { tier: 2, name: 'Серебро', clan: 20, ember: 30 },
  { tier: 3, name: 'Золото', clan: 30, ember: 40 },
];
/** Hearth-level leagues (economy.md §5.6). */
export function wbLeague(hearth) {
  const h = Math.max(0, Math.min(99, Math.trunc(Number(hearth) || 0)));
  return h >= 20 ? 3 : h >= 10 ? 2 : 1;
}
export const WB_LEAGUES = { 1: 'Лига Искры (Очаг 0–9)', 2: 'Лига Пламени (Очаг 10–19)', 3: 'Лига Горна (Очаг 20+)' };

/** Rotation index of the game week containing `now` (weeks since Monday 16.11.2026, game-day aligned). */
export function wbIndex(now, env, rotation = WB_ROTATION) {
  const d = Date.parse(dayKey(now, env) + 'T00:00:00Z');
  const n = Math.floor((d - Date.parse(WB_START + 'T00:00:00Z')) / (7 * DAY_MS));
  const len = rotation.length || 1;
  return ((Math.max(0, n) % len) + len) % len;
}
export function wbWeek(now, env, rotation = WB_ROTATION) {
  const i = wbIndex(now, env, rotation);
  return { index: i, ...rotation[i] };
}

/** Plausibility of a weekly boss result (server stored the start time). */
export function checkWbRun({ startedAt, now, timeMs, env = {} }) {
  const minMs = Number(env.WB_MIN_SEC || 20) * 1000;
  const maxMs = Number(env.WB_MAX_MIN || 60) * 60000;
  if (!Number.isInteger(timeMs) || timeMs < 0) return { ok: false, reason: 'bad_time' };
  const elapsed = now - startedAt;
  if (elapsed > maxMs) return { ok: false, reason: 'expired' };
  if (timeMs < minMs) return { ok: false, reason: 'too_fast' };
  if (timeMs > elapsed + 30000) return { ok: false, reason: 'time_mismatch' };
  return { ok: true };
}

// ---------------- shared (server-wide) goals ----------------
// Each goal belongs to an event of the calendar (`modifiers.goal`). Contribution caps keep a single client from filling it.
export const GOALS = {
  embers26: {
    name: 'Ночь Долгих Углей', unit: 'огней', target: 1000000, perCall: 80, perDay: 400, minPoints: 20,
    // reward for every participant with ≥ minPoints of their own when the server total crosses the threshold
    tiers: [
      { pct: 25, reward: { sparks: 30, chest_iron: 1 } },
      { pct: 50, reward: { sparks: 40, cosmetic: 'frame_embers' } },
      { pct: 75, reward: { sparks: 50, chest_gold: 1, cosmetic: 'deco_candles' } },
      { pct: 100, reward: { sparks: 80, cosmetic: 'skin_candle' } },
    ],
  },
};
/** Event (from the calendar/config) that owns goal `id` and is running at `now`. */
export function goalEvent(events, id, now) {
  return (Array.isArray(events) ? events : []).find((e) => e && e.modifiers && e.modifiers.goal === id && now >= e.start && now < e.end) || null;
}

// ---------------- clan weekly goal (§6.3) ----------------
export const CLAN_GOAL = {
  perMember: [40, 100, 200], // thresholds = perMember × members (min 3 members counted)
  minMembers: 3,
  minPoints: 20, // own weekly points needed to receive a tier's reward
  rewards: [{ chest_iron: 1, sparks: 10 }, { chest_gold: 1, sparks: 20 }, { chest_gold: 1, sparks: 40, key_gold: 1 }],
};
export function clanThresholds(members, g = CLAN_GOAL) {
  const n = Math.max(g.minMembers, members | 0);
  return g.perMember.map((k) => k * n);
}
