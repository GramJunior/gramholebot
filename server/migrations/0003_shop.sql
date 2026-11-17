-- ЭМБЕРВЕЙЛ — миграция 3: «Лавка» v5 — расходуемые покупки (самоцветы, сундуки, наборы) и серверные таймеры.
-- Применяется после 0002_meta.sql: npx wrangler d1 migrations apply emberveil --remote

-- Сколько штук товара игрок уже забрал в игру (qty — сколько куплено). Разница выдаётся через POST /pay/claim.
ALTER TABLE entitlements ADD COLUMN claimed INTEGER NOT NULL DEFAULT 0;

-- Идемпотентность выдачи: повтор того же claim_id возвращает тот же результат (ответ потерялся — игра просит снова).
CREATE TABLE IF NOT EXISTS pay_claims (
  claim_id   TEXT PRIMARY KEY,
  uid        TEXT NOT NULL,
  result     TEXT NOT NULL,              -- JSON: [{productId, n, grant}]
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pay_claims_uid ON pay_claims(uid, created_at);

-- Простые таймеры игрока по серверным часам (бесплатный сундук раз в N часов и т. п.).
CREATE TABLE IF NOT EXISTS user_timers (
  uid TEXT NOT NULL,
  key TEXT NOT NULL,
  at  INTEGER NOT NULL,                  -- когда сработало в последний раз (мс)
  n   INTEGER NOT NULL DEFAULT 0,        -- сколько раз всего
  PRIMARY KEY (uid, key)
);
