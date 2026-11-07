-- ЭМБЕРВЕЙЛ — схема базы D1 (SQLite).
-- Этот файл = migrations/0001_init.sql (тест проверяет, что они совпадают).
-- Все времена — миллисекунды Unix (INTEGER), время всегда серверное.

-- Игроки. Храним минимум: Telegram id, имя, необязательный username.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- 't<telegram id>' или 'g<hex>' (гость, только dev)
  tg_id         INTEGER UNIQUE,            -- Telegram user id (NULL у гостей)
  first_name    TEXT NOT NULL DEFAULT '',
  username      TEXT,
  lang          TEXT,
  ref_code      TEXT NOT NULL UNIQUE,      -- личный реферальный код
  referred_by   TEXT,                      -- id пригласившего
  can_pm        INTEGER NOT NULL DEFAULT 0,-- бот может писать игроку
  notify        INTEGER NOT NULL DEFAULT 0,-- игрок согласился на напоминания
  power         INTEGER NOT NULL DEFAULT 0,-- сила героя (из снимка деревни)
  flags         INTEGER NOT NULL DEFAULT 0,-- счётчик подозрительных действий
  banned        INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  last_seen     INTEGER NOT NULL
);

-- Облачное сохранение: один JSON-блоб на игрока.
CREATE TABLE IF NOT EXISTS saves (
  uid         TEXT PRIMARY KEY,
  version     INTEGER NOT NULL,            -- растёт на 1 при каждой записи
  data        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  summary     TEXT NOT NULL,               -- выжимка счётчиков для проверок
  updated_at  INTEGER NOT NULL
);

-- Журнал подозрительных событий (для ручного разбора).
CREATE TABLE IF NOT EXISTS audit (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  uid     TEXT NOT NULL,
  kind    TEXT NOT NULL,
  detail  TEXT,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_uid ON audit(uid, ts);

-- Серверные забеги (Бездна и набеги): старт/финиш фиксирует сервер.
CREATE TABLE IF NOT EXISTS runs (
  id          TEXT PRIMARY KEY,            -- случайный токен забега
  uid         TEXT NOT NULL,
  kind        TEXT NOT NULL,               -- 'abyss' | 'raid'
  start_floor INTEGER NOT NULL DEFAULT 1,
  started_at  INTEGER NOT NULL,
  finished_at INTEGER,
  status      TEXT NOT NULL DEFAULT 'open',-- open | done | rejected
  result      TEXT
);
CREATE INDEX IF NOT EXISTS runs_uid ON runs(uid, started_at);

-- Таблицы лидеров Бездны. period: 'all' | 'w:2026-W45' | 's:<id сезона>'.
CREATE TABLE IF NOT EXISTS lb_abyss (
  period      TEXT NOT NULL,
  uid         TEXT NOT NULL,
  floor       INTEGER NOT NULL,
  time_ms     INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (period, uid)
);
CREATE INDEX IF NOT EXISTS lb_rank ON lb_abyss(period, floor DESC, time_ms ASC);

-- Друзья (из рефералов). Храним обе стороны.
CREATE TABLE IF NOT EXISTS friends (
  uid        TEXT NOT NULL,
  friend_uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uid, friend_uid)
);

-- Кланы.
CREATE TABLE IF NOT EXISTS clans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  name_key    TEXT NOT NULL UNIQUE,        -- name в нижнем регистре (уникальность без учёта регистра)
  tag         TEXT NOT NULL,
  descr       TEXT NOT NULL DEFAULT '',
  open        INTEGER NOT NULL DEFAULT 1,  -- 1: вход свободный, 0: по коду
  invite_code TEXT NOT NULL,
  leader_uid  TEXT NOT NULL,
  members     INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS clan_members (
  uid       TEXT PRIMARY KEY,              -- игрок может быть только в одном клане
  clan_id   INTEGER NOT NULL,
  role      TEXT NOT NULL,                 -- leader | officer | member
  joined_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS clan_members_clan ON clan_members(clan_id);
CREATE TABLE IF NOT EXISTS clan_feed (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL,
  ts      INTEGER NOT NULL,
  type    TEXT NOT NULL,
  uid     TEXT,
  data    TEXT
);
CREATE INDEX IF NOT EXISTS clan_feed_clan ON clan_feed(clan_id, id DESC);

-- Недельный вклад игрока (очки клана = сумма вкладов текущих участников).
CREATE TABLE IF NOT EXISTS weekly_contrib (
  week   TEXT NOT NULL,
  uid    TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (week, uid)
);

-- Набеги: снимок обороны деревни.
CREATE TABLE IF NOT EXISTS villages (
  uid          TEXT PRIMARY KEY,
  power        INTEGER NOT NULL,
  hall         INTEGER NOT NULL,
  data         TEXT NOT NULL,
  shield_until INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS villages_power ON villages(power);

CREATE TABLE IF NOT EXISTS raids (
  id           TEXT PRIMARY KEY,           -- = runs.id
  attacker     TEXT NOT NULL,
  defender     TEXT NOT NULL,
  att_power    INTEGER NOT NULL,
  def_power    INTEGER NOT NULL,
  snapshot     TEXT NOT NULL,              -- замороженная копия обороны
  revenge_of   TEXT,                       -- id набега, за который мстим
  started_at   INTEGER NOT NULL,
  day          TEXT NOT NULL,              -- игровые сутки атакующего
  finished_at  INTEGER,
  status       TEXT NOT NULL DEFAULT 'open', -- open | done | rejected
  stars        INTEGER,
  pct          INTEGER,
  reward       TEXT,
  revenged     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS raids_att ON raids(attacker, day);
CREATE INDEX IF NOT EXISTS raids_def ON raids(defender, started_at);

-- Живой конфиг (сезон, пропуск, события, магазин, товары). value — JSON.
CREATE TABLE IF NOT EXISTS config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Ежедневная награда и серия.
CREATE TABLE IF NOT EXISTS daily (
  uid        TEXT PRIMARY KEY,
  last_day   TEXT NOT NULL,
  streak     INTEGER NOT NULL,
  total      INTEGER NOT NULL
);
-- Контракты дня: один раз на (игрок, день, контракт).
CREATE TABLE IF NOT EXISTS quest_claims (
  uid      TEXT NOT NULL,
  day      TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  ts       INTEGER NOT NULL,
  PRIMARY KEY (uid, day, quest_id)
);

-- Боевой пропуск.
CREATE TABLE IF NOT EXISTS bp_progress (
  uid     TEXT NOT NULL,
  season  TEXT NOT NULL,
  xp      INTEGER NOT NULL DEFAULT 0,
  claimed TEXT NOT NULL DEFAULT '[]',      -- ["free:1","premium:3",...]
  PRIMARY KEY (uid, season)
);

-- Платежи Telegram Stars.
CREATE TABLE IF NOT EXISTS invoices (
  payload    TEXT PRIMARY KEY,             -- случайный id, уходит в счёт
  uid        TEXT NOT NULL,
  product_id TEXT NOT NULL,
  stars      INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'created', -- created | paid | refunded
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  charge_id  TEXT PRIMARY KEY,             -- telegram_payment_charge_id: гарантия идемпотентности
  uid        TEXT NOT NULL,
  product_id TEXT NOT NULL,
  stars      INTEGER NOT NULL,
  payload    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'paid', -- paid | refunded
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS entitlements (
  uid        TEXT NOT NULL,
  product_id TEXT NOT NULL,
  qty        INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,                      -- для временных товаров (подписка на 30 дней)
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (uid, product_id)
);

-- Почта наград (рефералы, компенсации, выдача админом).
CREATE TABLE IF NOT EXISTS inbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  uid        TEXT NOT NULL,
  kind       TEXT NOT NULL,
  title      TEXT NOT NULL,
  reward     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  claimed_at INTEGER
);
CREATE INDEX IF NOT EXISTS inbox_uid ON inbox(uid, claimed_at);

-- Напоминания от бота (кузница, набег и т.п.).
CREATE TABLE IF NOT EXISTS notifications (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  uid     TEXT NOT NULL,
  kind    TEXT NOT NULL,
  due_at  INTEGER NOT NULL,
  sent_at INTEGER,
  status  TEXT NOT NULL DEFAULT 'pending'  -- pending | sent | dropped
);
CREATE INDEX IF NOT EXISTS notif_due ON notifications(status, due_at);
CREATE INDEX IF NOT EXISTS notif_uid ON notifications(uid, sent_at);
