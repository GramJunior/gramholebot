-- ЭМБЕРВЕЙЛ — миграция 4 (игра v39): отчёты об ошибках клиента (window.onerror / unhandledrejection).
-- Приходят обычным POST /events как событие {e:'error', k:<подпись>, d:{m,s,v,md}}; здесь — сводка по дням:
-- подпись (хэш сообщения и верхней строки стека), первые сообщение/стек, версия, режим игры, сколько раз и у скольких игроков.
-- Применяется после 0003_shop.sql (npx wrangler d1 migrations apply emberveil --remote). Записи старше 30 дней убирает cron.
CREATE TABLE IF NOT EXISTS err_reports (
  day   TEXT NOT NULL,
  sig   TEXT NOT NULL,
  msg   TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '',
  ver   TEXT NOT NULL DEFAULT '',
  mode  TEXT NOT NULL DEFAULT '',
  n     INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  last  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, sig)
);
