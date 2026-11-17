-- ЭМБЕРВЕЙЛ — миграция 2: отображаемое имя игрока и метрики (агрегированные счётчики событий).
-- Применяется после 0001_init.sql: npx wrangler d1 migrations apply emberveil --remote

-- Имя, которое игрок задал сам (рейтинги, кланы, набеги). NULL — используется имя из Telegram.
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Счётчики событий игры по дням (без личных данных): «ftue:first_kill» за 2026-11-04 — 132 раза.
CREATE TABLE IF NOT EXISTS ev_counts (
  day   TEXT NOT NULL,                     -- игровые сутки 'YYYY-MM-DD' (часы сервера)
  name  TEXT NOT NULL,                     -- имя события (a-z0-9_:.-)
  n     INTEGER NOT NULL DEFAULT 0,        -- сколько раз пришло
  users INTEGER NOT NULL DEFAULT 0,        -- сколько разных игроков (первое событие игрока за день)
  PRIMARY KEY (day, name)
);

-- Дни, когда игрок заходил (для удержания D1/D7). Только id игрока и день.
CREATE TABLE IF NOT EXISTS active_days (
  uid TEXT NOT NULL,
  day TEXT NOT NULL,
  ev  INTEGER NOT NULL DEFAULT 0,          -- сколько событий игрок прислал за день (защита от спама)
  PRIMARY KEY (uid, day)
);
CREATE INDEX IF NOT EXISTS active_days_day ON active_days(day);

-- Кто из игроков уже отмечен в событии за день (чтобы считать users в ev_counts). Чистится через 3 дня.
CREATE TABLE IF NOT EXISTS ev_seen (
  day  TEXT NOT NULL,
  name TEXT NOT NULL,
  uid  TEXT NOT NULL,
  PRIMARY KEY (day, name, uid)
);
