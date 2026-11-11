-- ЭМБЕРВЕЙЛ — миграция 6 (игра v40): «Путь Угля» — 50 уровней × 200 оп. вместо 30 × 100.
-- Опыт сезона s1 удваивается: уровень пропуска у всех остаётся прежним (полученные награды — ключи `free:N`/`premium:N` — не меняются).
-- Игра делает то же со своим сохранением (v12, apps/emberveil/src/p90.js → v12Migrate). Применяется один раз, ДО `wrangler deploy` версии v40:
--   npx wrangler d1 migrations apply emberveil --remote
UPDATE bp_progress SET xp = xp * 2 WHERE season = 's1';
