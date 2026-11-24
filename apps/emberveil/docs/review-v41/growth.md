# ЭМБЕРВЕЙЛ — ревью аналитики и роста (review41 / growth)

Дата: 2026-11-12. Источники: `apps/emberveil/src/p18.js` (track/trkFlush/ADS/pay/share), `p9.js`, `p20.js`, `p21.js`, `p30.js`, `p80.js`; `server/src/routes/metrics.js`, `auth.js`, `live.js`, `social.js`, `bot.js` (cron), `lib/common.js` (applyReferral), `lib/config.js`; `server/migrations/0001–0006`; `apps/legal/privacy.html`.
Пометка: всё, что помечено «(оценка)», — отраслевые ориентиры, не измеренные данные; калибруем в бете.

---

# ЧАСТЬ A. Аналитика

## 1. Что отслеживается сегодня и где пробелы

### Как устроен конвейер (факт)
- Клиент: `track(e,k)` → локальная очередь `emberveil_trk` (до 300 шт.) → `trkFlush()` раз в 20 с / при сворачивании → `POST /events` пачками по 50. `trackOnce(e,k)` — разовые шаги (запоминаются в сохранении `meta.tk`, т. е. переживают смену устройства через облако).
- Сервер (`metrics.js`) хранит **только агрегаты**: `ev_counts(day, name, n, users)` — сколько раз и сколько уникальных игроков за день; `active_days(uid, day, ev)` — дни активности; `ev_seen` — служебная таблица уникальности (чистится через 3 дня); `err_reports` — сводка ошибок без uid (30 дней).
- Имя счётчика = `событие:ключ` (regex `^[a-z0-9_]{1,24}(:[a-z0-9_.-]{1,24})?$`), всё в нижнем регистре, ключ обрезается до 24 символов.
- `/admin/metrics?days=14` отдаёт DAU, когорты D1/D7, сырые счётчики и топ ошибок. `/admin/stats` — всего игроков, active24h, кланы, оплаты, сумма Stars. HTML-страницы админки нет.

### Каталог событий (~75 имён)
| Область | События | Оценка |
|---|---|---|
| FTUE | `ftue:prologue_start/prologue_end/wake/wake_scene/yard_*/yard_done/yard_skip_sN/done`, `ftue:build/stage11/kill/equip/rare/companion/boss/raid/pet`, `yard:new/replay`, `tut:<id>` | Хорошо: разовые шаги — готовая основа воронки |
| Этапы | `stage_start:<key>`, `stage_finish:<key>` (**только победа**), `stage_map:open`, `boss_intro`, `a2:boss:*`, `nm_win`, `c33_*`, `abyss_start/floor/end`, `raid_start/prep` | Нет поражения / выхода |
| Возврат | `day_return:dN` (локальные календарные дни с создания сейва), `session_day:nN` | Есть, но по часам клиента |
| Реклама | `ad_offer:<place>` (не чаще 1/мин), `ad_offer_shown`, `ad_start:<place>`, `ad_done:<place>`, `ad_fail:<place>.<na/skip/nofill/error/timeout/nosdk/unverified/inactive>`, `ad_fail:sdk`, interstitial `il_*` | Хорошо — почти полная воронка размещения |
| Stars | `purchase_intent/success/fail/blocked:<pid>`, `deal_buy`, `stars_chest`, `pass_open`, `pass_tier` | Нет показа витрины/товара |
| Экономика | `crys_spend:<why>`, `speedup:bld_*`, `chest_open:<tier_src>`, `build/build_start`, `spin:*`, `login_claim`, `daily_done`, `weekly_done` | Нет earn/spend по ресурсам и сумм |
| Социальное | `share:<kind>`, `name_set`, `recruit`, `bld_help` | Нет кланов, друзей, переходов по ссылкам |
| Техника | `error:<sig>` (+детали), `perf_bench:<ql:fps>`, `save_reset`, `jit` | Хорошо |

### Пробелы (по приоритету)
1. **Нет связи событий с когортой.** `ev_counts` агрегирован по дням: воронку FTUE можно считать только как «сколько уникальных игроков прошли шаг за период», а не «из когорты 10 ноября 1-1 прошли 62%». Сегментировать по источнику трафика, рефералам, версии игры нельзя.
2. **Не отслеживаются поражения на этапах.** `stage_finish` срабатывает только при победе (`p9.js:164`); смерть (`playerDie`, `p19.js:139`), отказ от воскрешения и выход в меню не логируются. Точки отвала по этапам видны только как разница start−finish, без причины.
3. **Нет длительности сессии** и числа сессий в день.
4. **Нет экономики earn/spend**: счётчики считают число событий, сумм нет (в `ev_counts` нет поля для значения). Есть только `crys_spend:<why>`, без суммы.
5. **Время события теряется.** Клиент пишет `t`, но `trkFlush` его не отправляет, а сервер кладёт пачку в день отправки. Офлайн-события и сессии около полуночи попадают не в тот день, `day_return` считается по локальному дню, а `active_days` — по серверному (`dayKey` + offset). Расхождение небольшое, но мешает D1.
6. **Нет D30**: `cohorts()` считает только D1/D7, при этом таблица `active_days` нигде не чистится (данных для D30 хватает; см. п. 4 про политику).
7. **Нет источника привлечения.** `start_param` разбирается только как `ref_<code>` (`applyReferral`). Метки каналов (`src_tgads_1`, `src_chan_xyz`) теряются — оценить, какой канал запуска окупился, не выйдет. **Это блокер для части B.**
8. **Рефералы**: событий нет, только `users.referred_by`. Награда выдаётся **сразу при регистрации** (`lib/common.js:91–94`, лимит 50 на пригласившего) — ферма твинков даёт 50×(500 золота + 25 эссенции) бесплатно. Нужен порог активации.
9. **Реклама**: подтверждённая сервером награда (`ad_credits`) чистится через 3 дня и не агрегируется — нет серверной «правды» о числе досмотров для сверки с кабинетом Adsgram. Нет ввода eCPM → нельзя посчитать ARPDAU от рекламы.
10. **Stars**: нет `shop_view`/`offer_view` → нельзя посчитать конверсию «увидел → нажал → оплатил» по товару. Выручка есть в `payments` (серверная правда).
11. Мелочи: `MAX_PER_DAY=2000` на игрока — нормально; ключи товаров/мест обрезаются до 24 символов — следить за длиной `pid` (`pack_village_lanterns` = 21, ок).

Расхождение со стандартом имён: в проекте принят формат `событие:ключ` (snake_case, двоеточие), а не `category.action.detail`. **Рекомендую формат проекта не ломать** (regex сервера, тесты, накопленные данные) и вводить новые события в нём же; категорию задавать префиксом (`eco_`, `ad_`, `shop_`, `sess_`).

## 2. Минимальная схема событий

### 2.0 Решение по хранению (на выбор пользователя)
| Вариант | Что это | Плюсы | Минусы |
|---|---|---|---|
| A. Только агрегаты (как сейчас) + поле суммы | `ev_counts` + колонка `v` | Ноль новых персональных данных | Воронки не привязаны к когорте, нет сегментов |
| **B. Агрегаты + таблица вех на игрока (рекомендую)** | `milestones(uid, m, ts)` — ~15–25 строк на игрока, только разовые шаги | Точные когортные воронки, сегменты по источнику/рефералу, D1-D30 по шагам; дёшево для D1 | Новые персональные данные (имя события + время) — нужна правка политики |
| C. Сырой лог событий | `events(uid, name, ts, v)` | Любой анализ | Много записей в D1 (лимиты/стоимость), сильное расширение данных, противоречит «храним в основном общие счётчики» |

Рекомендую B: закрывает все вопросы воронки и удержания и остаётся в рамках текущей формулировки политики (уточнив её, см. п. 4).

### 2.1 Изменения сервера (спецификация для программиста, не код)
Миграция `0007_analytics.sql`:
```sql
ALTER TABLE ev_counts ADD COLUMN v INTEGER NOT NULL DEFAULT 0;      -- сумма значений (золото, секунды…)
ALTER TABLE active_days ADD COLUMN sess INTEGER NOT NULL DEFAULT 0; -- сессий за день
ALTER TABLE active_days ADD COLUMN sec  INTEGER NOT NULL DEFAULT 0; -- секунд в игре за день (с ограничением сверху)
ALTER TABLE users ADD COLUMN src TEXT;                              -- первый источник (start_param src_*), неизменяемый
ALTER TABLE users ADD COLUMN ver0 TEXT;                             -- версия игры при первом входе
CREATE TABLE IF NOT EXISTS milestones (
  uid TEXT NOT NULL, m TEXT NOT NULL, ts INTEGER NOT NULL,          -- m = имя разового события ('ftue:stage11', 'pay:first', 'ref:activated')
  PRIMARY KEY (uid, m)
);
CREATE INDEX IF NOT EXISTS milestones_m ON milestones(m, ts);
CREATE TABLE IF NOT EXISTS ads_daily (                              -- серверная правда по рекламе (Reward URL / claim)
  day TEXT NOT NULL, place TEXT NOT NULL, rewarded INTEGER NOT NULL DEFAULT 0, claimed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, place)
);
```
Протокол `POST /events`: элемент `{e, k?, v?, t?, o?}`:
- `v` — целое ≥0 (≤10^7), прибавляется к `ev_counts.v`.
- `t` — время клиента; сервер кладёт событие в `dayKey(t)`, если `t` в пределах [сейчас−72 ч, сейчас+5 мин], иначе — в текущий день.
- `o:1` — разовое событие: дополнительно `INSERT OR IGNORE INTO milestones` (клиент ставит его из `trackOnce`). Лимит 64 вехи на игрока.
- `sess`/`sec` на уровне пачки: `{events:[…], sess:1, sec:312}` → `active_days.sess += sess`, `sec += min(sec, 4*3600)`.
- `/auth`: `start_param` вида `src_<a-z0-9_>{1,32}` → `users.src` (только если NULL); `ref_<code>` → как сейчас + `src='ref'`. Можно комбинировать `ref_<code>__src_<tag>` (лимит startapp — 64 символа `A-Za-z0-9_-`).
- `/ads/reward` (Reward URL) → `ads_daily.rewarded += 1` (место `any`); `/ads/claim` → `claimed += 1` по `place`.
- `deleteMe` → добавить `milestones` в список таблиц; `users.src/ver0` обнулить.
- `cohorts()` → добавить D3/D14/D30.

### 2.2 События по разделам (новые помечены ★; формат `имя:ключ`, `v` — значение)
**Воронка первого запуска** (все разовые, `o:1`):
| Шаг | Событие | Где сработает |
|---|---|---|
| 0 Открыл | ★ `app_open:first` (+ сервер: первая строка в `active_days`) | загрузка `p0/metaBoot` |
| 0.5 Загрузился | ★ `boot:ready` (`v` = мс до интерактива) | конец загрузки ассетов |
| 1 Пролог начат/закончен | `ftue:prologue_start` / `ftue:prologue_end` | есть |
| 2 Двор | `ftue:yard_done` (или `yard_skip_sN`) | есть |
| 3 Очнулся в Броде | `ftue:wake` | есть |
| 4 Этап 1-1 начат | ★ `ftue:s11_start` (сейчас только неразовый `stage_start:1-1`) | `p9.js:73` при key=1-1 |
| 5 Этап 1-1 пройден | `ftue:stage11` | есть |
| 6 Деревня: первая стройка | `ftue:build` | есть |
| 7 Босс 1-5 | `ftue:boss` | есть |
| 8 День 2 | `day_return:d1` + ★ веха `ret:d1` | `metaDayTick` |
| 9 FTUE завершён | `ftue:done` | есть |

**Сессии**: ★ `sess_start` (k = `cold`/`resume`), длительность — через `sec` в пачке (накапливать активное время, пока вкладка видима, не в паузе >60 с). ★ `sess_len:<lt1m|1_3m|3_10m|10_30m|30_60m|60m>` — один раз на сессию при сворачивании (даёт гистограмму без расчётов).

**Этапы**:
- `stage_start:<key>`, `stage_finish:<key>` — есть.
- ★ `stage_fail:<key>` (`v` = секунд в этапе) — смерть без воскрешения.
- ★ `stage_quit:<key>` — выход в меню / закрытие.
- ★ `revive:<key>.<ad|crys|no>` — исход предложения воскреснуть.
- ★ разовые `first_fail:<key>` для 1-1…1-5 (`o:1`) — сколько новичков споткнулись.

**Экономика** (агрегировать на клиенте: одна запись на сочетание за пачку, `v` = сумма):
- ★ `eco_in:<res>.<src>` — res ∈ `gold, wood, ore, ess, shards, sparks, keys_*`; src ∈ `stage, chest, daily, login, quest, pass, raid, abyss, ad, shop, ref, salvage, event`.
- ★ `eco_out:<res>.<sink>` — sink ∈ `build, craft, upgrade, speedup, spin, revive, shop, recruit, pet`.
- Существующий `crys_spend:<why>` оставить, добавить к нему `v`.
- ★ раз в день `eco_bal:<res>` с `v` = остаток (снимок для «инфляции» — среднее = v/users).

**Реклама** (по месту `place` ∈ `spin, revive, chest, exp, build, fchest, dealref, il`):
| Метрика | Событие |
|---|---|
| показано предложение | `ad_offer:<place>` (есть) |
| запрошено | `ad_start:<place>` (есть) |
| нет рекламы | `ad_fail:<place>.nofill` (есть) |
| показано (оценка) | start − nofill − na − nosdk − error |
| пропущено | `ad_fail:<place>.skip` (есть) |
| досмотрено (клиент) | `ad_done:<place>` (есть) |
| награда подтверждена (сервер) | ★ `ads_daily.rewarded/claimed` |
| eCPM | ★ ручной ввод: `PUT /admin/config/ads_ecpm {"day":"…","usd":2.1}` или CSV из кабинета Adsgram |

**Stars** (по товару `pid`):
- ★ `shop_open:<tab>` (раз на открытие), ★ `offer_view:<pid>` (не чаще раза в сессию на товар), `purchase_intent:<pid>`, `purchase_success:<pid>`, `purchase_fail:<reason>`, `purchase_blocked:<why>` (есть).
- ★ веха `pay:first` (`o:1`, `v` = Stars) — конверсия в первого плательщика по когорте.
- Выручку считать **только** по `payments` (сервер), клиентские события — для воронки.

**Рефералы и соцфункции**:
- `share:<kind>` (есть) + ★ `ref_panel:open`, ★ `ref_link:copy|tg`.
- ★ сервер: веха пригласившему `ref:joined`, приглашённому — `ref:activated` при прохождении 1-5 (или D1-возврате). Награду приглашающему — переносим на активацию (см. п. 7).
- ★ `clan_join:<open|code>`, ★ `clan_create`, ★ `friend_add`, ★ `lb_open:<friends|clan|global>`.

## 3. Админ-дашборд `/admin`

### Форма
- Одна статическая страница (например, `apps/admin/index.html` или `GET /admin/ui` из Worker), токен админа вводится вручную и хранится в `sessionStorage`, в URL не попадает. Данные — новый `GET /admin/dash?from=&to=` (JSON со всеми запросами ниже), графики — любая лёгкая библиотека (uPlot/Chart.js) или SVG.
- Все дни — строки `YYYY-MM-DD` по игровым суткам (`dayKey`). Платежи хранят мс UTC — переводить с тем же смещением: `date((created_at + :off)/1000,'unixepoch')`, где `:off` = смещение из `lib/time.js`.
- Параметры: `:from`, `:to` (дни), `:off` (мс).

### Плитки (верхний ряд, «сегодня / вчера / Δ за 7 дней»)
DAU, новые, D1 вчерашней когорты, D7, средняя длительность в день, Stars за день, платящих, ARPDAU, просмотров рекламы на DAU, fill rate, ошибок на 1000 DAU, crash-free.

### Запросы
**DAU / WAU / MAU / stickiness**
```sql
SELECT day, COUNT(*) dau FROM active_days WHERE day BETWEEN :from AND :to GROUP BY day ORDER BY day;
-- WAU/MAU на дату :to
SELECT (SELECT COUNT(DISTINCT uid) FROM active_days WHERE day > date(:to,'-7 day')  AND day <= :to) wau,
       (SELECT COUNT(DISTINCT uid) FROM active_days WHERE day > date(:to,'-30 day') AND day <= :to) mau;
-- stickiness = средний DAU за 30 дн / MAU
```
**Новые игроки по дням** (когорта = первый день в `active_days`, как в `cohorts()`)
```sql
WITH f AS (SELECT uid, MIN(day) d0 FROM active_days GROUP BY uid)
SELECT d0 day, COUNT(*) new_users FROM f WHERE d0 BETWEEN :from AND :to GROUP BY d0 ORDER BY d0;
```
**Удержание D1/D3/D7/D14/D30 (классическое, «вернулся ровно в день N»)** — тепловая карта когорт
```sql
WITH f AS (SELECT uid, MIN(day) d0 FROM active_days GROUP BY uid)
SELECT f.d0 cohort, COUNT(*) n,
  ROUND(100.0*SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+1 day')))/COUNT(*),1)  d1,
  ROUND(100.0*SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+3 day')))/COUNT(*),1)  d3,
  ROUND(100.0*SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+7 day')))/COUNT(*),1)  d7,
  ROUND(100.0*SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+14 day')))/COUNT(*),1) d14,
  ROUND(100.0*SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+30 day')))/COUNT(*),1) d30
FROM f WHERE f.d0 BETWEEN :from AND :to GROUP BY f.d0 ORDER BY f.d0;
-- Незрелые клетки (d0+N > сегодня) показывать пустыми, как в cohorts().
-- Сегмент: добавить JOIN users u ON u.id=f.uid и GROUP BY u.src (органика / ref / каждый канал).
```
**Воронка первого запуска (вариант B, по когорте)** — столбчатая с % от шага 0 и от предыдущего шага
```sql
WITH f AS (SELECT uid, MIN(day) d0 FROM active_days GROUP BY uid HAVING MIN(day) BETWEEN :from AND :to),
steps(i, m) AS (VALUES (1,'ftue:prologue_start'),(2,'ftue:prologue_end'),(3,'ftue:yard_done'),(4,'ftue:wake'),
                      (5,'ftue:s11_start'),(6,'ftue:stage11'),(7,'ftue:build'),(8,'ftue:boss'),(9,'ret:d1'),(10,'ftue:done'))
SELECT s.i, s.m, COUNT(ms.uid) users, ROUND(100.0*COUNT(ms.uid)/(SELECT COUNT(*) FROM f),1) pct_of_open
FROM steps s LEFT JOIN milestones ms ON ms.m=s.m AND ms.uid IN (SELECT uid FROM f)
GROUP BY s.i, s.m ORDER BY s.i;
-- Медианное время до шага: из milestones.ts минус ts вехи app_open:first (на клиенте страницы).
```
**Воронка сегодня (без B, приближённо по агрегатам)**
```sql
SELECT name, SUM(users) users FROM ev_counts
WHERE day BETWEEN :from AND :to AND name IN ('ftue:prologue_start','ftue:prologue_end','ftue:yard_done','ftue:wake',
      'ftue:stage11','ftue:build','ftue:boss','day_return:d1','ftue:done')
GROUP BY name;   -- разовые события, поэтому SUM(users) ≈ уникальные игроки за окно
```
**Длительность сессий**
```sql
SELECT day, COUNT(*) dau, ROUND(AVG(sec)/60.0,1) min_per_dau, ROUND(1.0*SUM(sess)/COUNT(*),2) sess_per_dau,
       ROUND(1.0*SUM(sec)/NULLIF(SUM(sess),0)/60.0,1) min_per_session
FROM active_days WHERE day BETWEEN :from AND :to AND sess>0 GROUP BY day ORDER BY day;
-- Гистограмма: SELECT name, SUM(n) FROM ev_counts WHERE name LIKE 'sess_len:%' AND day BETWEEN :from AND :to GROUP BY name;
```
**Точки отвала по этапам** — таблица + столбцы «% побед / % поражений / % выходов» по ключу этапа
```sql
WITH s AS (
  SELECT substr(name, instr(name,':')+1) stage,
         SUM(CASE WHEN name LIKE 'stage_start:%'  THEN n END) starts,
         SUM(CASE WHEN name LIKE 'stage_finish:%' THEN n END) wins,
         SUM(CASE WHEN name LIKE 'stage_fail:%'   THEN n END) fails,
         SUM(CASE WHEN name LIKE 'stage_quit:%'   THEN n END) quits,
         SUM(CASE WHEN name LIKE 'stage_start:%'  THEN users END) uniq
  FROM ev_counts WHERE day BETWEEN :from AND :to AND name GLOB 'stage_[sfq]*:*' GROUP BY stage)
SELECT stage, starts, uniq, wins, fails, quits,
       ROUND(100.0*wins/starts,1) win_pct, ROUND(1.0*starts/NULLIF(uniq,0),2) tries_per_player
FROM s ORDER BY stage;
-- Отвал после этапа (кто начал N и не начал N+1) — только с milestones (first_fail / first_win по ключу) или по SUM(users) соседних этапов.
```
**Экономика: источники и стоки по ресурсам** — стопки «приход/расход» по дням, таблица на DAU
```sql
SELECT day,
       substr(name, instr(name,':')+1, instr(substr(name, instr(name,':')+1),'.')-1) res,
       CASE WHEN name LIKE 'eco_in:%' THEN 'in' ELSE 'out' END dir,
       substr(name, instr(name,'.')+1) src_sink,
       SUM(v) amount, SUM(users) users
FROM ev_counts WHERE day BETWEEN :from AND :to AND (name LIKE 'eco_in:%' OR name LIKE 'eco_out:%')
GROUP BY day, res, dir, src_sink ORDER BY day, res, dir, amount DESC;
-- Net flow на DAU: (in − out)/DAU по ресурсу — главный сигнал инфляции для экономдизайнера.
-- Средний остаток: SELECT day, name, 1.0*SUM(v)/SUM(users) FROM ev_counts WHERE name LIKE 'eco_bal:%' GROUP BY day, name;
```
**Реклама по местам** — таблица place × (offer, start, nofill, skip, done, fill%, completion%) + линия «просмотров на DAU»
```sql
WITH a AS (
  SELECT day,
    CASE WHEN name LIKE 'ad_fail:%' THEN substr(name, 9, instr(substr(name,9),'.')-1)
         ELSE substr(name, instr(name,':')+1) END place,
    CASE WHEN name LIKE 'ad_fail:%' THEN substr(name, instr(substr(name,9),'.')+9) ELSE substr(name,1,instr(name,':')-1) END kind,
    n
  FROM ev_counts WHERE day BETWEEN :from AND :to AND (name LIKE 'ad_offer:%' OR name LIKE 'ad_start:%' OR name LIKE 'ad_done:%' OR name LIKE 'ad_fail:%'))
SELECT place,
  SUM(CASE kind WHEN 'ad_offer' THEN n END) offered,
  SUM(CASE kind WHEN 'ad_start' THEN n END) requested,
  SUM(CASE kind WHEN 'nofill' THEN n END) nofill,
  SUM(CASE kind WHEN 'skip' THEN n END) skipped,
  SUM(CASE kind WHEN 'ad_done' THEN n END) rewarded,
  ROUND(100.0*(1 - 1.0*SUM(CASE WHEN kind IN ('nofill','error','na','nosdk','timeout') THEN n ELSE 0 END)/NULLIF(SUM(CASE kind WHEN 'ad_start' THEN n END),0)),1) fill_pct,
  ROUND(100.0*SUM(CASE kind WHEN 'ad_done' THEN n END)/NULLIF(SUM(CASE kind WHEN 'ad_start' THEN n END),0),1) complete_pct
FROM a GROUP BY place ORDER BY rewarded DESC;
-- Interstitial идёт как 'ad_start:il_<where>' / 'ad_fail:il.<reason>' — объединять по префиксу il.
-- Просмотров на DAU: SUM(n по ad_done:%)/DAU по дням. Сверка: ads_daily.rewarded vs SUM(ad_done) (расхождение >10% — проблема Reward URL или накрутка).
```
**Stars по товарам**
```sql
SELECT product_id, COUNT(*) purchases, COUNT(DISTINCT uid) buyers, SUM(stars) stars
FROM payments WHERE status='paid' AND created_at BETWEEN :from_ms AND :to_ms GROUP BY product_id ORDER BY stars DESC;
-- Воронка товара: offer_view:<pid> → purchase_intent:<pid> → purchase_success:<pid> из ev_counts (SUM(users)).
-- По дням:
SELECT date((created_at + :off)/1000,'unixepoch') day, SUM(stars) stars, COUNT(DISTINCT uid) payers, COUNT(*) tx
FROM payments WHERE status='paid' GROUP BY day ORDER BY day;
-- Возвраты: то же с status='refunded'.
-- Конверсия когорты в плательщика (D7):
WITH f AS (SELECT uid, MIN(day) d0 FROM active_days GROUP BY uid)
SELECT f.d0, COUNT(*) n, COUNT(p.uid) payers_d7, ROUND(100.0*COUNT(p.uid)/COUNT(*),2) conv_pct
FROM f LEFT JOIN (SELECT uid, MIN(created_at) t FROM payments WHERE status='paid' GROUP BY uid) p
  ON p.uid=f.uid AND date((p.t + :off)/1000,'unixepoch') <= date(f.d0,'+7 day')
WHERE f.d0 BETWEEN :from AND :to GROUP BY f.d0;
```
**ARPDAU / ARPPU** (Stars → $ по курсу вывода разработчику, держать в конфиге `stars_usd`, ≈0,013 $ (оценка — проверить актуальный курс Fragment); реклама — eCPM из конфига)
```sql
WITH d AS (SELECT day, COUNT(*) dau FROM active_days WHERE day BETWEEN :from AND :to GROUP BY day),
p AS (SELECT date((created_at + :off)/1000,'unixepoch') day, SUM(stars) stars, COUNT(DISTINCT uid) payers FROM payments WHERE status='paid' GROUP BY day),
ad AS (SELECT day, SUM(n) views FROM ev_counts WHERE name LIKE 'ad_done:%' OR name LIKE 'ad_done:il_%' GROUP BY day)
SELECT d.day, d.dau, COALESCE(p.stars,0) stars, COALESCE(ad.views,0) ad_views,
       ROUND(1.0*COALESCE(ad.views,0)/d.dau,2) views_per_dau,
       ROUND((COALESCE(p.stars,0)*:stars_usd + COALESCE(ad.views,0)*:ecpm/1000.0)/d.dau,4) arpdau_usd,
       ROUND(COALESCE(p.stars,0)*:stars_usd/NULLIF(p.payers,0),2) arppu_usd
FROM d LEFT JOIN p USING(day) LEFT JOIN ad USING(day) ORDER BY d.day;
```
**Рефералы и источники**
```sql
-- K-фактор по дням: приглашённые новички / все новички
SELECT date((created_at + :off)/1000,'unixepoch') day, COUNT(*) new_users,
       SUM(referred_by IS NOT NULL) referred, ROUND(1.0*SUM(referred_by IS NOT NULL)/COUNT(*),3) k_share
FROM users WHERE tg_id IS NOT NULL GROUP BY day ORDER BY day;
-- Активированные рефералы (вариант B): SELECT COUNT(*) FROM milestones WHERE m='ref:activated' AND ts BETWEEN :from_ms AND :to_ms;
-- Топ пригласивших (для антифрода и наград-амбассадоров), без имён — только ref_code:
SELECT r.ref_code, COUNT(*) invited, SUM(EXISTS(SELECT 1 FROM milestones m WHERE m.uid=u.id AND m.m='ftue:boss')) activated
FROM users u JOIN users r ON r.id=u.referred_by GROUP BY r.ref_code ORDER BY invited DESC LIMIT 50;
-- Каналы привлечения: новички, D1, D7, плательщики по users.src (JOIN к запросу когорт).
-- Шеринг: SELECT name, SUM(n), SUM(users) FROM ev_counts WHERE name LIKE 'share:%' GROUP BY name;
```
**Здоровье / стабильность** (есть `/admin/errors`)
```sql
SELECT e.day, SUM(e.users) err_users, d.dau, ROUND(1000.0*SUM(e.n)/d.dau,1) errors_per_1k_dau,
       ROUND(100.0*(1 - 1.0*SUM(e.users)/d.dau),1) crash_free_users_pct   -- верхняя оценка: игрок с 2 ошибками считается дважды
FROM err_reports e JOIN (SELECT day, COUNT(*) dau FROM active_days GROUP BY day) d USING(day)
WHERE e.day BETWEEN :from AND :to GROUP BY e.day ORDER BY e.day;
-- FPS: SELECT name, SUM(users) FROM ev_counts WHERE name LIKE 'perf_bench:%' GROUP BY name; (распределение по качеству графики)
-- Время загрузки: SUM(v)/SUM(n) по 'boot:ready'.
```

### Графики (что видим → какое решение)
| График | Источник | Решение, которое он поддерживает |
|---|---|---|
| DAU + новые (стопкой: органика/ref/каналы) | active_days, users.src | какой канал масштабировать |
| Тепловая карта удержания D1–D30 | active_days | работает ли FTUE/мета; сравнение версий |
| Воронка FTUE (абс. + % шага) | milestones / ev_counts | где резать/упрощать пролог и двор |
| Этапы: win%/fail%/quit% + попыток на игрока | ev_counts stage_* | балансировка «стен» (дизайнер решает) |
| Экономика: приход/расход на DAU по ресурсу | ev_counts eco_* | инфляция/дефицит → экономдизайнер |
| Реклама по местам: fill/complete/views per DAU | ev_counts ad_*, ads_daily | какие места ценны, где nofill |
| Stars: выручка/плательщики/ARPPU по товарам, воронка товара | payments, ev_counts | цены и витрина |
| Рефералы: k-share, активация | users, milestones | работают ли награды за друзей |
| Ошибки на 1000 DAU, топ сигнатур, загрузка | err_reports, ev_counts | приоритет багфиксов |

## 4. Приватность (согласованность с `apps/legal/privacy.html`)
Что совпадает: агрегаты без содержимого событий; отчёты об ошибках без ID в `err_reports`; удаление `active_days`/`ev_seen` в `deleteMe`; 3 дня для `ev_seen`/`ad_credits`; IP не хранится.

Нестыковки уже сейчас (сообщить владельцу политики):
1. **Срок хранения `active_days` не указан в политике и не чистится cron'ом** (`bot.js:145–153`). Нужно либо добавить строку «дни активности — до 13 месяцев», либо cron `DELETE FROM active_days WHERE day < date('now','-400 day')`. Решение за пользователем.
2. «Отчёты хранятся без привязки к вашему ID» — в целом верно, но `ev_seen` 3 дня хранит пару (uid, `error:<sig>`). Мелочь; можно не учитывать `error:*` в `ev_seen` или уточнить формулировку.
3. Отказа от аналитики нет (ни в политике, ни в настройках). Для 152-ФЗ/GDPR-логики стоит добавить переключатель «Отправлять статистику» (по умолчанию вкл. как необходимую для работы — это вопрос юристу) — клиент просто не шлёт `track`, кроме `error`.

Что потребует правок политики при внедрении схемы:
| Новое | Формулировка в политику | Срок |
|---|---|---|
| `milestones` (вехи по игроку) | «отметки о ключевых шагах в игре (например, “прошёл этап 1-1”) с датой» — в строке «Игровая аналитика» | пока есть профиль, удаляются с аккаунтом |
| `users.src` | «по какой рекламной/партнёрской ссылке вы пришли (метка ссылки, без данных о вас из других сервисов)» | как профиль |
| `active_days.sess/sec` | «сколько сессий и минут в день вы играли» | как `active_days` |
| `ev_counts.v`, `ads_daily` | агрегаты без ID — правка не нужна | — |
Не собирать: устройство/UA, IP, `username` в аналитике, тексты чата; не передавать события третьим лицам (никаких внешних SDK аналитики — это сохранит фразу «не передаём другим компаниям»). Если подключите пиксель Telegram Ads / внешний трекер — это новая передача данных, нужна отдельная строка в п. 4 политики.

---

# ЧАСТЬ B. Рост и маркетинг в Telegram

## 5. План закрытой беты
**Предусловия (до старта):** события из п. 2 (минимум: `stage_fail`, сессии, `src`, `t` в пачке, вехи), дашборд п. 3, cron очистки, исправленный порог реферальной награды, кнопка «Сообщить о проблеме» → бот (скриншот + версия + `mode`).

**Формат:** не публикуем бота в каталогах, вход по ссылке `t.me/emberveil_game_bot/play?startapp=src_beta_<волна>`; на сервере флаг `beta` в конфиге — можно вести вайтлист по `src`, но проще «закрытость» обеспечить нераспространением ссылки.

| Волна | Срок | Размер | Источники | Цель |
|---|---|---|---|---|
| 0 — техно | 3–5 дней | 20–40 | знакомые, команда, 1–2 чата инди-разработчиков | краши, загрузка, оплата Stars (тестовые), Adsgram fill |
| 1 — ядро | 7 дней | 150–300 | свой канал «Эмбервейл | дневник разработки», чаты RPG/ARPG/«Diablo-подобных», DTF/Pikabu-пост «ищем тестеров», 1 небольшой игровой канал (5–20 тыс.) | FTUE-воронка, D1, баланс 1-1…1-5 |
| 2 — масштаб | 10–14 дней | 800–2000 | 2–4 посева в игровых каналах, рефералы беты, кросс-промо с инди-TMA | D7, экономика, реклама/ARPDAU, кланы и набеги на живой популяции |

Минимальные выборки: D1 с точностью ±5 п.п. — ~350 новичков на когорту/вариант; D7 ±3 п.п. — ~800. Поэтому выводы по D7 — только с волны 2.

**Цикл обратной связи:**
- Telegram-группа с темами: «Баги», «Баланс», «Идеи», «Объявления»; дежурный отвечает в течение 24 ч.
- Опрос в боте (3 вопроса, 1 мин) после `ftue:boss` и на день 3: «Что непонятно?», «Оценка 1–5», «Порекомендуете другу?» (NPS).
- 5–8 созвонов с записью экрана (новички, не геймеры-энтузиасты) — смотрим пролог и двор молча.
- Еженедельно: дашборд → 3 главных проблемы → патч → заметка в канале «что исправили по вашим отзывам» (повышает удержание тестеров).
- Награда тестерам: эксклюзивная косметика «Первый Искроносец» (рамка + свечение), выдаётся при релизе по `src=beta_*`.

**Критерии успеха беты (go / no-go на запуск):**
| Метрика | No-go | Go |
|---|---|---|
| Crash-free пользователей/день | < 97% | ≥ 99% |
| Загрузка до интерактива (медиана, 4G) | > 12 с | ≤ 7 с |
| Открыл → прошёл 1-1 | < 55% | ≥ 70% |
| Открыл → победил босса 1-5 | < 30% | ≥ 45% |
| D1 | < 25% | ≥ 35% |
| D7 (волна 2) | < 8% | ≥ 14% |
| Средняя игра на DAU | < 10 мин | ≥ 20 мин |
| Fill rate рекламы (RU) | < 60% | ≥ 80% |
| Оплата Stars — сквозной тест на 3 товарах | ошибки | 100% выдача, 0 жалоб |
| NPS (после дня 3) | < 0 | ≥ 30 |

## 6. Каналы запуска и бюджеты
**Бесплатные / почти бесплатные (обязательно для любого бюджета):**
- **Магазин Mini Apps внутри Telegram**: назначить Main Mini App в @BotFather, заполнить описание, превью-скриншоты и видео (есть `botfather_640x360_*.png` — нужны ещё вертикальные скриншоты геймплея). Ранжирование зависит от активности, поэтому подключаем после того, как удержание подтвердится.
- **Telegram Apps Center** и альтернативные каталоги TMA (FindMini.app и аналоги): подать заявку с RU/EN-описанием. Порядок подачи и требования меняются — проверить на момент подачи.
- **Экосистема TON**: игра на Stars, кошелька нет — сильный «TON-ивент» не наш профиль. Реалистично: листинг в каталогах приложений TON/TMA и участие в подборках «игры без крипты». Квесты с выдачей токенов не рекомендую: они приводят фармеров с D7 около нуля.
- **Свой канал + чат игры** с первого дня беты; ссылка из бота (`/start` → «Новости»).
- **Кросс-промо с инди-TMA** (в репозитории есть соседние приложения: aura, driftline, echo, nullcity, orbit, vibewars — это бесплатный внутренний инвентарь): баннер/квест «сыграй в Эмбервейл — получи награду там» с меткой `src_xp_<app>`.
- **Контентные площадки**: DTF (devlog + запуск), Pikabu (лига геймдева), VK-паблики про инди, YouTube Shorts/TikTok/VK Клипы (короткие ролики боссов).

**Платные:**
- **Посевы в Telegram-каналах** (игровые, фэнтези, мобильные игры, «во что поиграть»): основной канал для RU-аудитории. Ориентир CPM 300–1200 ₽, установка 15–60 ₽ в зависимости от качества канала (оценка). Проверять через TGStat/Telemetr: ER, накрутки, гео. Каждый посев — своя метка `src_ch_<id>`.
- **Telegram Ads** (ads.telegram.org, оплата TON/Stars, таргетинг по каналам и темам): чистый трафик, но порог входа и минимальный CPM выше; подходит, когда D7 подтверждён ≥12%. Минимальные депозиты и CPM — уточнить на момент запуска.
- **Инфлюенсеры**: микро-блогеры YouTube/VK/Twitch по ARPG и мобильным играм (5–50 тыс.) — летсплей «Пролог + первый босс» + промокод-косметика; 3–15 тыс. ₽ за интеграцию у микро (оценка).
- **Реклама внутри других TMA/ботов** (рекламные сети внутри Telegram, включая продажу показов через Adsgram-подобные сети): дешёвая, но очень низкого качества (тапалки). Только малые тесты с жёстким контролем D1 по `src`.

**Бюджетные уровни (на первый месяц после запуска; цифры — оценка):**
| Уровень | Бюджет | Состав | Ожидание |
|---|---|---|---|
| 0 — органика | 0–10 тыс. ₽ | каталоги, свой канал, DTF/Pikabu, кросс-промо, рефералы, 2–3 бартерных посева | 1–3 тыс. установок |
| 1 — тест каналов | 50–100 тыс. ₽ | 8–15 посевов по 3–8 тыс. ₽ (по 2–3 в каждой тематике), 2–3 микро-блогера, тест Telegram Ads на минимальном депозите | 3–8 тыс. установок, CPI по каналам, выбрать топ-3 |
| 2 — масштаб | 300–600 тыс. ₽ | масштаб лучших 3 типов каналов, Telegram Ads по каналам-аналогам, 1–2 средних блогера, ивент запуска с призами в Stars-косметике | 15–40 тыс. установок; держать CPI < LTV30 |

Правило масштаба: увеличивать бюджет канала, только если его когорта даёт D1 ≥ 30% и LTV30 ≥ CPI×0,7 (с учётом виральности). Иначе урезать.

## 7. Вирусные механики (конкретные награды)
Текущее состояние: реферальная ссылка `startapp=ref_<code>`; награда сразу 500 золота + 25 эссенции пригласившему, 300 + 15 приглашённому (лимит 50); косметика `frame_friend` (1 друг), `glow_friend` (3 друга); шеринг (набег/бездна); друзья в рейтинге Бездны; кланы с кодом приглашения.

Рекомендации (решение — за гейм-/экономдизайнером, цифры — стартовые):
1. **Реферальная награда в два этапа (антифрод):**
   - при входе: приглашённому — 300 золота + 15 эссенции (как сейчас); пригласившему — только уведомление «Друг пришёл».
   - при активации друга (победа над боссом 1-5 **или** вход на день 2): пригласившему — 500 золота + 25 эссенции + 20 самоцветов; другу — железный сундук.
   - лестница по активированным: 1 — рамка «Друга» (есть); 3 — свечение «Братство» (есть); 5 — питомец-облик «Уголёк-спутник»; 10 — облик плаща «Побратим Брода»; 25 — титул + золотой сундук. Лимит наград по золоту/самоцветам — 20 друзей, косметика без лимита.
   - **«Уголёк дружбы»**: 5% от самоцветов, которые друг заработал игрой (не купил) за первые 14 дней, — пассивный стимул звать активных.
2. **Карточки шеринга (картинка, а не только текст):** генерировать PNG на клиенте (canvas): портрет героя, сила, этаж Бездны / победа над боссом / результат набега + реферальная ссылка. Поводы: первый босс, новый рекорд Бездны, легендарный предмет, звёзды набега 3/3. Награда за шеринг: 1 раз в день — 1 вращение колеса (не за клик, а после возврата в игру, чтобы не плодить спам; не проверяемо — держать награду маленькой). Через `shareMessage`/`switchInlineQuery` (Bot API 8.0+), если поддерживается клиентом, — карточка с кнопкой «Играть».
3. **Клановые приглашения:** ссылка `startapp=clan_<code>` (новичок сразу попадает в клан после двора). Награда клану за каждого нового активного участника — +50 очков недельного вклада; приглашённому — «клановый пакет» (2 железных ключа). Недельный клановый сундук по рангу клана: топ-10% — золотой, топ-50% — железный.
4. **Рейтинги друзей:** уже есть фильтр `friends` в Бездне. Добавить: уведомление бота «Бран (друг) обошёл тебя в Бездне: этаж 14» (только при включённых напоминаниях), недельный сундук «лучший среди друзей» при ≥3 друзьях.
5. **Помощь друга:** уже есть `bld_help` (−20% стройки). Сделать помощь доступной от друзей/клана по ссылке («Помоги мне достроить кузницу») — классическая петля «просьба → вход друга».
6. **Набег-реванш с другом:** «Позови друга отомстить» — совместная месть, общий бонус к награде +25%.
Метрики механик: k-share, % активированных рефералов, шеринг на DAU, переходы по `src=share_*` (размечать ссылки в карточках отдельной меткой).

## 8. Контент-план соцсетей (первые 4 недели; Telegram-канал — основной, VK/Shorts/DTF — вторичные)
Ритм: Telegram 4–5 постов/нед., короткие видео 2–3/нед., DTF 1 лонгрид/2 нед.
| Неделя | Тема | Telegram (основное) | Видео (Shorts/Клипы/TikTok) | Длинное |
|---|---|---|---|---|
| 1 — «Тлеющий Брод» (тизер, набор в бету) | мир и атмосфера | пн: анонс + арт; ср: лор «Что такое Хмарь»; пт: открыт набор в бету (форма/ссылка); вс: опрос «какой класс героя» | 15 с: пролог, 15 с: первый удар/взрыв бочки | DTF: «Делаем ARPG в Telegram: зачем и как» |
| 2 — бета-волна 1 | герой и бой | пн: старт беты; ср: гайд «как пройти Брюхана»; пт: «что исправили за неделю»; вс: фан-арт/скрины тестеров | клип босса 1-5; «до/после» снаряжения | — |
| 3 — деревня и кланы | мета | пн: деревня и стройки; ср: кланы и набеги; пт: патч-ноут; вс: конкурс «лучшая деревня» (приз — косметика) | таймлапс стройки; набег 3/3 | DTF: постмортем беты, цифры воронки (без личных данных) |
| 4 — подготовка к запуску | ивент запуска | пн: дата запуска + бонус ранним; ср: «Путь Угля» (пропуск) — что бесплатно; пт: реферальный конкурс (топ-10 пригласивших — эксклюзивный облик); вс: тизер ролика | трейлер 30 с; «топ-3 легендарки» | пресс-рассылка блогерам и каналам |
Правила: каждый пост — со ссылкой на бота с меткой `src_tgch_<пост>`; опросы и конкурсы — чтобы мерить вовлечённость; честные патч-ноуты (доверие к бете).

## 9. Целевые KPI (оценка; пересмотреть по итогам волны 2)
Контекст: трафик TMA в среднем менее качественный, чем в мобильных сторах (много «тапальщиков»); для мид-кор ARPG в Telegram реалистичны цифры ниже мобильных бенчмарков. Пороги — «минимум / цель / отлично».
| KPI | Бета | Запуск (первые 30 дней) |
|---|---|---|
| Открыл → 1-1 пройден | 60 / 70 / 80% | 50 / 60 / 70% |
| D1 | 30 / 35 / 45% | 25 / 30 / 40% |
| D7 | 10 / 14 / 20% | 8 / 12 / 16% |
| D30 | — (мало данных) | 3 / 5 / 8% |
| Минут на DAU | 15 / 20 / 30 | 12 / 18 / 25 |
| Сессий на DAU | 2 / 2,5 / 3,5 | 1,8 / 2,3 / 3 |
| Просмотров рекламы (rewarded) на DAU | 1,5 / 2,5 / 4 | 1,5 / 2,5 / 3,5 (при лимите ~12/день — не выше, иначе удержание проседает) |
| Fill rate Adsgram | 70 / 80 / 90% | 70 / 80 / 90% |
| Конверсия в плательщика (к D30 когорты) | 1 / 2 / 3% | 0,8 / 1,5 / 2,5% |
| ARPPU (30 дн.) | — | 250 / 400 / 600 Stars |
| ARPDAU (реклама + Stars, $) | — | 0,008 / 0,015 / 0,03 $ |
| K-share (приглашённые / новые) | 10 / 20 / 30% | 8 / 15 / 25% |
| Crash-free пользователей | ≥ 99% | ≥ 99,3% |
Расчёт ARPDAU (оценка): реклама 2,5 просмотра × eCPM 2–4 $ (RU rewarded) ≈ 0,005–0,01 $; Stars: 1,5% плательщиков × ~400 Stars × 0,013 $ / 30 дн. ≈ 0,003 $ — плюс накопительный эффект пропуска и подписки. Реклама — основной доход на старте; Stars растут с D30.

## Открытые вопросы к пользователю
1. Хранение: вариант A, B (рекомендую) или C для вех по игроку?
2. Срок хранения `active_days` (предлагаю 13 месяцев) — и согласовать правку политики с юристом.
3. Нужен ли переключатель «Отправлять статистику»?
4. Переносим ли награду пригласившему на «активацию» друга (рекомендую) — решение гейм-/экономдизайнера.
5. Бюджет первого месяца — уровень 0, 1 или 2?

Следующие шаги: передать спецификацию п. 2.1–2.2 программисту сервера/клиента; спецификацию п. 3 — на реализацию страницы `/admin`; экономические события и награды п. 7 — экономдизайнеру на утверждение.
