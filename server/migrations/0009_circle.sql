-- ЭМБЕРВЕЙЛ — миграция 9 (v45.2): «Круг побратимов» (вехи друзей на три звена), дни входа для защиты от накруток,
-- недельные призы «Летописи Вече» (только облики).
-- Применяется один раз, ДО `wrangler deploy` версии v45.2:
--   npx wrangler d1 migrations apply emberveil --remote
-- Ничего не удаляет и не меняет в старых таблицах (только добавляет строки в новые).

-- Цепочка «кто пригласил»: три звена вверх, записывается один раз при первом входе и больше не меняется.
-- t1 — пригласивший (= users.referred_by), t2 — кто пригласил его, t3 — третье звено. Себя и повторы в цепочке не пишем.
CREATE TABLE IF NOT EXISTS ref_chain (
  uid        TEXT PRIMARY KEY,
  t1         TEXT NOT NULL,
  t2         TEXT,
  t3         TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ref_chain_t1 ON ref_chain(t1);
CREATE INDEX IF NOT EXISTS ref_chain_t2 ON ref_chain(t2);
CREATE INDEX IF NOT EXISTS ref_chain_t3 ON ref_chain(t3);

-- Вехи друзей: одна строка на «друг + веха + звено» (получатель однозначен — звено цепочки).
-- status: wait (веха взята, ждём условий: возраст, дни входа, забег) → hold (сутки «Летописец сверяет запись», due_at)
--         → paid (письмо отправлено, reward — что выдано) | refused (reason: flags, cap, rcpt, deleted…) | legacy (выдано до v45.2)
CREATE TABLE IF NOT EXISTS ref_ms (
  friend     TEXT NOT NULL,              -- приглашённый, чья веха
  ms         TEXT NOT NULL,              -- 'join' | 'l5' | 'l10' | 'l20' | 'l30' | 'l40' | 'l50' (config referral.milestones)
  tier       INTEGER NOT NULL,           -- 1 побратим, 2 его побратим, 3 дальний круг
  rcpt       TEXT NOT NULL,              -- кому награда
  status     TEXT NOT NULL DEFAULT 'wait',
  reached_at INTEGER NOT NULL,
  due_at     INTEGER NOT NULL,           -- когда проверить снова / когда выдать
  paid_at    INTEGER,
  reward     TEXT,                       -- JSON выданной награды
  reason     TEXT,
  PRIMARY KEY (friend, ms, tier)
);
CREATE INDEX IF NOT EXISTS ref_ms_due ON ref_ms(status, due_at);
CREATE INDEX IF NOT EXISTS ref_ms_rcpt ON ref_ms(rcpt, status, paid_at);

-- Дни входа ВСЕХ игроков (даже при выключенной статистике) — только для проверки вех друзей. Хранится 13 месяцев.
CREATE TABLE IF NOT EXISTS login_days (
  uid TEXT NOT NULL,
  day TEXT NOT NULL,                     -- игровой день 'YYYY-MM-DD'
  PRIMARY KEY (uid, day)
);
CREATE INDEX IF NOT EXISTS login_days_day ON login_days(day);

-- Недельные призы за места (Владыка недели по лигам, Бездна недели): одна строка на игрока, неделю и таблицу — повторный запуск ничего не удвоит.
CREATE TABLE IF NOT EXISTS weekly_prizes (
  week     TEXT NOT NULL,                -- '2026-W47'
  board    TEXT NOT NULL,                -- 'wb' | 'abyss'
  uid      TEXT NOT NULL,
  place    INTEGER NOT NULL,
  grp      TEXT,                         -- группа (владыка:лига)
  cosmetic TEXT NOT NULL,
  sent     INTEGER NOT NULL DEFAULT 0,   -- письмо положено в inbox
  ts       INTEGER NOT NULL,
  PRIMARY KEY (week, board, uid)
);
-- Итоги недели подведены (таблица целиком).
CREATE TABLE IF NOT EXISTS prize_runs (
  week  TEXT NOT NULL,
  board TEXT NOT NULL,
  n     INTEGER NOT NULL DEFAULT 0,
  ts    INTEGER NOT NULL,
  PRIMARY KEY (week, board)
);

-- Перенос: цепочки уже приглашённых (до трёх звеньев по users.referred_by), без себя и повторов.
INSERT OR IGNORE INTO ref_chain (uid, t1, t2, t3, created_at)
  SELECT u.id, u.referred_by, p.referred_by, g.referred_by, u.created_at
  FROM users u LEFT JOIN users p ON p.id = u.referred_by LEFT JOIN users g ON g.id = p.referred_by
  WHERE u.referred_by IS NOT NULL AND u.referred_by <> u.id;
UPDATE ref_chain SET t2 = NULL, t3 = NULL WHERE t2 = uid OR t2 = t1;
UPDATE ref_chain SET t3 = NULL WHERE t3 = uid OR t3 = t1 OR t3 = t2;

-- Уже приглашённые не получают «Пришёл по ссылке» задним числом; веха 5 (владыка 1-5) уже оплачена тем, кто активирован (v41) или legacy.
INSERT OR IGNORE INTO ref_ms (friend, ms, tier, rcpt, status, reached_at, due_at, reason)
  SELECT uid, 'join', 1, t1, 'legacy', created_at, created_at, 'pre-v45' FROM ref_chain;
INSERT OR IGNORE INTO ref_ms (friend, ms, tier, rcpt, status, reached_at, due_at, reason)
  SELECT uid, 'join', 2, t2, 'legacy', created_at, created_at, 'pre-v45' FROM ref_chain WHERE t2 IS NOT NULL;
INSERT OR IGNORE INTO ref_ms (friend, ms, tier, rcpt, status, reached_at, due_at, reason)
  SELECT uid, 'join', 3, t3, 'legacy', created_at, created_at, 'pre-v45' FROM ref_chain WHERE t3 IS NOT NULL;
INSERT OR IGNORE INTO ref_ms (friend, ms, tier, rcpt, status, reached_at, due_at, reason)
  SELECT r.uid, 'l5', 1, r.t1, 'legacy', r.created_at, r.created_at, 'pre-v45' FROM ref_chain r JOIN users u ON u.id = r.uid
  WHERE u.ref_state IN ('done', 'legacy');

-- Дни входа: начинаем с уже известных дней (аналитика active_days).
INSERT OR IGNORE INTO login_days (uid, day) SELECT uid, day FROM active_days;
