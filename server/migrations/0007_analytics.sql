-- ЭМБЕРВЕЙЛ — миграция 7 (игра v41): аналитика по отчёту docs/review-v41/growth.md, часть A (вариант хранения B).
-- Применяется ДО `wrangler deploy` версии v41 (старый код новые колонки не трогает, новый без них падает):
--   npx wrangler d1 migrations apply emberveil --remote
-- Сроки хранения (cron, src/routes/bot.js → runCron): active_days и milestones — 13 месяцев, ev_counts и ads_daily — 25 месяцев
-- (агрегаты без id игрока). Всё, что привязано к игроку, удаляется и в DELETE /me.

-- сумма значений события за день (золото, секунды, мс загрузки…): POST /events {e, k, v}
ALTER TABLE ev_counts ADD COLUMN v INTEGER NOT NULL DEFAULT 0;

-- сессий и секунд в игре за день (клиент шлёт {sess, sec} на уровне пачки; секунды ограничены сверху)
ALTER TABLE active_days ADD COLUMN sess INTEGER NOT NULL DEFAULT 0;
ALTER TABLE active_days ADD COLUMN sec  INTEGER NOT NULL DEFAULT 0;

-- первый источник (start_param src_<метка>, 'ref' — пришёл по приглашению), задаётся один раз при создании профиля
ALTER TABLE users ADD COLUMN src TEXT;
-- версия игры при первой пачке событий
ALTER TABLE users ADD COLUMN ver0 TEXT;
-- игровой день первого входа в игру (когорта удержания; раньше считалась как MIN(day) по active_days — полный проход таблицы)
ALTER TABLE users ADD COLUMN day0 TEXT;
-- состояние приглашения: NULL — не приглашён; 'pending' — ждёт победы над владыкой 1-5; 'done' — пригласивший награждён;
-- 'legacy' — приглашён до v41 (пригласивший уже получил награду при регистрации друга — второй раз не платим)
ALTER TABLE users ADD COLUMN ref_state TEXT;
-- игрок выключил «Отправлять статистику» (сервер не учитывает его события, кроме отчётов об ошибках)
ALTER TABLE users ADD COLUMN stats_off INTEGER NOT NULL DEFAULT 0;

UPDATE users SET ref_state = 'legacy' WHERE referred_by IS NOT NULL;
UPDATE users SET day0 = (SELECT MIN(a.day) FROM active_days a WHERE a.uid = users.id) WHERE day0 IS NULL;

-- разовые вехи игрока (вариант B): 'ftue:stage11', 'ftue:boss', 'pay:first', 'ref:activated'… ~15–25 строк на игрока, не больше 64
CREATE TABLE IF NOT EXISTS milestones (
  uid TEXT NOT NULL,
  m   TEXT NOT NULL,
  ts  INTEGER NOT NULL,                   -- мс UTC (время события по часам клиента с поправкой на часы сервера)
  PRIMARY KEY (uid, m)
);
CREATE INDEX IF NOT EXISTS milestones_m ON milestones(m, ts);
CREATE INDEX IF NOT EXISTS milestones_ts ON milestones(ts);

-- серверная правда по рекламе: вызовы Reward URL от Adsgram (place='any') и потраченные кредиты (/ads/claim по месту)
CREATE TABLE IF NOT EXISTS ads_daily (
  day      TEXT NOT NULL,
  place    TEXT NOT NULL,
  rewarded INTEGER NOT NULL DEFAULT 0,
  claimed  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, place)
);

-- индексы для GET /admin/stats
CREATE INDEX IF NOT EXISTS users_day0 ON users(day0);
CREATE INDEX IF NOT EXISTS users_referred ON users(referred_by);
CREATE INDEX IF NOT EXISTS payments_paid ON payments(status, created_at);
