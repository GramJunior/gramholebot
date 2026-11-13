-- ЭМБЕРВЕЙЛ — миграция 8 (игра v42): live-ops — общая цель сервера («Ночь Долгих Углей»), Владыка недели, недельная цель клана.
-- Применяется один раз, ДО `wrangler deploy` версии v42:
--   npx wrangler d1 migrations apply emberveil --remote
-- Ничего не удаляет и не меняет в старых таблицах.

-- Вклад игрока в общую цель сервера по игровым дням (сумма = общий счёт; дневной потолок проверяет сервер).
CREATE TABLE IF NOT EXISTS goal_contrib (
  goal    TEXT NOT NULL,                 -- id цели (config `goals`, событие с modifiers.goal)
  uid     TEXT NOT NULL,
  day     TEXT NOT NULL,                 -- игровой день 'YYYY-MM-DD'
  points  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (goal, uid, day)
);
CREATE INDEX IF NOT EXISTS goal_contrib_uid ON goal_contrib(goal, uid);

-- Полученные награды порогов общей цели (одна на игрока и порог).
CREATE TABLE IF NOT EXISTS goal_claims (
  goal    TEXT NOT NULL,
  uid     TEXT NOT NULL,
  pct     INTEGER NOT NULL,
  ts      INTEGER NOT NULL,
  PRIMARY KEY (goal, uid, pct)
);

-- Владыка недели: лучший результат игрока за неделю на владыке (ступень выше, затем время меньше). Лига — по уровню Пламени Очага.
CREATE TABLE IF NOT EXISTS lb_wboss (
  week       TEXT NOT NULL,              -- '2026-W47'
  boss       TEXT NOT NULL,              -- id владыки (gobKing, rotroot…): у новичков он может отличаться от владыки недели
  uid        TEXT NOT NULL,
  tier       INTEGER NOT NULL,           -- 1 Бронза, 2 Серебро, 3 Золото
  time_ms    INTEGER NOT NULL,
  league     INTEGER NOT NULL DEFAULT 1,
  hearth     INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (week, boss, uid)
);
CREATE INDEX IF NOT EXISTS lb_wboss_rank ON lb_wboss(week, boss, league, tier DESC, time_ms ASC);

-- Первые прохождения ступеней за неделю (очки клана 10/20/30 и награда недели — один раз).
CREATE TABLE IF NOT EXISTS wb_clears (
  week    TEXT NOT NULL,
  uid     TEXT NOT NULL,
  tier    INTEGER NOT NULL,
  time_ms INTEGER NOT NULL,
  ts      INTEGER NOT NULL,
  PRIMARY KEY (week, uid, tier)
);

-- Недельная цель клана: полученные награды порогов (каждому участнику со своим вкладом ≥ порога вклада).
CREATE TABLE IF NOT EXISTS clan_goal_claims (
  week     TEXT NOT NULL,
  uid      TEXT NOT NULL,
  clan_id  INTEGER NOT NULL,
  tier     INTEGER NOT NULL,
  ts       INTEGER NOT NULL,
  PRIMARY KEY (week, uid, tier)
);
