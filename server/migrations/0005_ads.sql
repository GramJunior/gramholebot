-- ЭМБЕРВЕЙЛ — миграция 5 (игра v39.4): реклама Adsgram, проверка награды на сервере.
-- Adsgram после досмотренного ролика вызывает «Reward URL» блока: GET /ads/reward?userid=<Telegram id> (src/routes/ads.js).
-- Каждый такой вызов — одна «рекламная запись» (кредит) игрока на короткое время (ADS_CREDIT_TTL_SEC, по умолчанию 15 мин).
-- Ценная награда в игре (встать после смерти, удвоение первой победы, бесплатный сундук) тратит кредит: POST /ads/claim {place}.
-- Применяется после 0004_errors.sql (npx wrangler d1 migrations apply emberveil --remote). Записи старше 3 дней убирает cron.
CREATE TABLE IF NOT EXISTS ad_credits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  uid     TEXT NOT NULL,
  at      INTEGER NOT NULL,            -- когда пришёл вызов Reward URL (мс)
  used_at INTEGER,                     -- когда потрачен (NULL — ещё нет)
  place   TEXT NOT NULL DEFAULT '',    -- на что потрачен (revive, chest, fchest…)
  day     TEXT NOT NULL DEFAULT ''     -- игровой день траты (для дневных лимитов)
);
CREATE INDEX IF NOT EXISTS ad_credits_uid ON ad_credits (uid, used_at, at);
CREATE INDEX IF NOT EXISTS ad_credits_day ON ad_credits (uid, day, place);
