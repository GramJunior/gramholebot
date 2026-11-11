# ЭМБЕРВЕЙЛ — онлайн-сервер

Сервер даёт игре всё онлайновое: облачные сохранения, рейтинги Бездны, кланы, набеги на деревни, сезоны и события, ежедневные награды, покупки за Telegram Stars, приглашения друзей и напоминания от бота.

Главное правило: **игра работает и без сервера.** Если сервер не настроен или недоступен, игра сохраняется в `localStorage`, как сейчас. Сетевые функции включаются, когда сервер на месте.

---

## 1. Как это устроено

```
 Игра (Telegram Mini App)                Cloudflare (бесплатно)
 ┌──────────────────────┐   HTTPS/JSON  ┌──────────────────────────┐
 │ index.html           │ ────────────► │ Worker  (src/index.js)   │
 │  + client/ev-net.js  │               │   ├─ проверка Telegram   │
 └──────────────────────┘               │   ├─ сохранения, рейтинги│
            ▲                           │   ├─ кланы, набеги       │
            │ кнопка «Играть»           │   ├─ сезоны, награды     │
 ┌──────────┴───────────┐  webhook      │   └─ платежи Stars       │
 │ Telegram-бот         │ ────────────► │ D1 (база SQLite)         │
 └──────────────────────┘ ◄──────────── │ Cron каждые 10 мин       │
            напоминания, ответы         └──────────────────────────┘
```

- **Cloudflare Worker** — маленькая программа, которая отвечает на запросы игры. Сервер арендовать не нужно, Cloudflare запускает её сам.
- **D1** — база данных SQLite в Cloudflare. Схема лежит в `schema.sql`, она же записана как миграция `migrations/0001_init.sql`.
- **Cron Trigger** раз в 10 минут рассылает напоминания и убирает старые записи.
- **`client/ev-net.js`** — модуль для игры без зависимостей. Он создаёт глобальный объект `EVNet`.

Код написан на обычном JavaScript без сборки и без зависимостей во время работы. Единственная dev-зависимость — `wrangler`, официальная утилита Cloudflare.

```
server/
  wrangler.toml          настройки (без секретов)
  schema.sql             схема базы
  migrations/            миграции для wrangler
  src/index.js           маршрутизатор + cron
  src/routes/*.js        auth, save, abyss, clans, raids, live (конфиг/админ), daily, payments, social, bot
  src/lib/*.js           криптография, время/недели, античит, конфиг по умолчанию, Bot API
  client/ev-net.js       модуль для игры
  test/*.test.js         тесты (node --test, база SQLite в памяти)
```

## 2. Сколько это стоит

**Бесплатно** на старте. Лимиты бесплатного тарифа Cloudflare (проверьте актуальные на cloudflare.com, они иногда меняются):

| Что | Бесплатно |
|---|---|
| Workers — запросы | 100 000 в сутки |
| Workers — время процессора | 10 мс на запрос (нашим запросам хватает) |
| D1 — хранилище | 5 ГБ |
| D1 — чтение | 5 млн строк в сутки |
| D1 — запись | 100 000 строк в сутки |
| Cron Triggers | есть на бесплатном тарифе |

**Прикидка.** Активный игрок за день делает примерно 30–80 запросов. Облако сохраняется не чаще раза в 45 секунд и при сворачивании игры. Бесплатного тарифа хватит примерно на **1–2 тысячи игроков в день**. Дальше подключается Workers Paid за **5 $ в месяц**: там 10 млн запросов и намного больше записей в D1. Карта для бесплатного тарифа не нужна.

Telegram за бота и Mini App денег не берёт. Stars выводятся через Telegram/Fragment с задержкой, условия смотрите в документации Telegram.

## 3. Запуск, шаг за шагом

Понадобятся компьютер с **Node.js 20+** (скачать на nodejs.org) и терминал.

### Шаг 1. Аккаунт Cloudflare
Зарегистрируйтесь на <https://dash.cloudflare.com/sign-up>. Это бесплатно.

### Шаг 2. Установка
```bash
cd server
npm i
```

### Шаг 3. Вход в Cloudflare
```bash
npx wrangler login
```
Откроется браузер, нажмите «Allow».

### Шаг 4. Создать базу
```bash
npx wrangler d1 create emberveil
```
Команда выведет `database_id = "…"`. Скопируйте его в `wrangler.toml` вместо `00000000-0000-0000-0000-000000000000`.

### Шаг 5. Создать таблицы
```bash
npx wrangler d1 migrations apply emberveil --remote
```

### Шаг 6. Заполнить настройки в `wrangler.toml` (раздел `[vars]`)
- `ALLOWED_ORIGINS` — адрес, где лежит игра, например `https://ilya.github.io`. Без пути и без `/` в конце.
- `WEBAPP_URL` — полный адрес игры, например `https://ilya.github.io/gramholebot/apps/emberveil/`.
- `BOT_USERNAME` — имя бота без `@`.
- `APP_SHORT_NAME` — короткое имя Mini App, которое вы зададите в @BotFather (шаг 10).
- `ALLOW_GUEST = "0"` в бою. `"1"` — только для теста в браузере.

### Шаг 7. Секреты
Секреты нельзя писать в файлы и отправлять в git. Задайте их так:
```bash
npx wrangler secret put BOT_TOKEN        # токен от @BotFather
npx wrangler secret put JWT_SECRET       # случайная строка
npx wrangler secret put ADMIN_SECRET     # случайная строка (пароль админки)
npx wrangler secret put WEBHOOK_SECRET   # случайная строка (только A-Z a-z 0-9 _ -)
```
Случайную строку можно получить так:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Сохраните `ADMIN_SECRET` и `WEBHOOK_SECRET` в менеджер паролей. Они понадобятся дальше.

### Шаг 8. Выложить сервер
```bash
npx wrangler deploy
```
В конце появится адрес вида `https://emberveil-api.<ваше-имя>.workers.dev`. Проверьте его в браузере: `…/health` должен ответить `{"ok":true,…}`.

### Шаг 9. Подключить бота к серверу (webhook)
Подставьте свой токен, адрес и `WEBHOOK_SECRET`:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://emberveil-api.<имя>.workers.dev/tg/webhook" \
  -d "secret_token=<WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message","pre_checkout_query"]'
```
Ответ должен быть `{"ok":true,…}`. Чтобы токен не остался в истории терминала, после этого можно выполнить `history -c`.

### Шаг 10. Настроить Mini App в @BotFather
1. `/mybots` → ваш бот → **Bot Settings → Configure Mini App**: укажите адрес игры (`WEBAPP_URL`).
2. `/newapp` → выберите бота. Задайте название, картинку, адрес игры и **short name**, например `play`. Short name впишите в `APP_SHORT_NAME`, затем снова выполните `npx wrangler deploy`.
3. `/setcommands` → вставьте:
   ```
   start - Играть
   notify - Включить напоминания
   notify_off - Выключить напоминания
   invite - Ссылка для друзей
   paysupport - Помощь с покупками
   ```
4. Платежи в Stars отдельно включать не нужно: для цифровых товаров они работают сразу.

### Шаг 11. Подключить модуль к игре
Описано в разделе 7 ниже. Игре нужен только адрес сервера.

### Обновление сервера
После изменений в коде выполните `npx wrangler deploy`. Новые миграции применяются командой `npx wrangler d1 migrations apply emberveil --remote` (сейчас их две: `0001_init.sql` и `0002_meta.sql` — имя игрока и таблицы метрик). **После обновления до версии с `0002_meta.sql` сначала примените миграцию, потом `deploy`.** Локально: `npm run db:init:local`.

## 4. Проверка у себя на компьютере

```bash
cd server
npm i
npm test                       # все тесты: несколько секунд, без интернета
```

Локальный сервер для проверки в браузере:
```bash
# скопируйте .dev.vars.example в .dev.vars (он в .gitignore):
#   JWT_SECRET=любая-длинная-строка-16+
#   ADMIN_SECRET=любая-длинная-строка-16+
#   WEBHOOK_SECRET=local
#   ALLOW_GUEST=1
#   ALLOWED_ORIGINS=*
npm run db:init:local          # таблицы в локальной базе
npx wrangler dev               # сервер на http://localhost:8787
```
Откройте игру в браузере с `window.EVNET_BASE_URL = 'http://localhost:8787'`. Без Telegram модуль войдёт как гость.

## 5. Сезоны, события, магазин (админка)

Все живые настройки хранятся в базе. Меняются одним запросом с паролем `ADMIN_SECRET`. Игра получает их через `GET /config` и кэширует на 10 минут. Время везде указано в **миллисекундах**. Перевести дату в миллисекунды:
```bash
node -e "console.log(Date.parse('2026-12-01T00:00:00+03:00'))"   # → 1796072400000
```

Для удобства задайте переменные:
```bash
API=https://emberveil-api.<имя>.workers.dev
ADM="Authorization: Bearer <ADMIN_SECRET>"
```

**Сезон.** Со стартом сезона открывается сезонный рейтинг Бездны и опыт пропуска:
```bash
curl -X PUT $API/admin/config/season -H "$ADM" -d '{
  "id":"s1","name":"Сезон 1: Пробуждение Угля",
  "start":1796072400000,"end":1801256400000 }'
```

**Боевой пропуск.** Награды уровней. Опыт начисляет сервер: за этажи Бездны, звёзды набегов, награду дня и контракты.
```bash
curl -X PUT $API/admin/config/battlepass -H "$ADM" -d '{
  "season":"s1","xpPerTier":200,"premiumProduct":"bp_s1",
  "xp":{"abyssFloor":8,"raidStar":10,"daily":60,"quest":25},
  "tiers":[
    {"tier":1,"free":{"gold":200},"premium":{"cosmetic":"cloak_ash"}},
    {"tier":2,"free":{"shards":10},"premium":{"cosmetic":"frame_ember"}}
  ]}'
```

**События.** Активные события игра получает в `events`, будущие — в `upcoming`:
```bash
curl -X PUT $API/admin/config/events -H "$ADM" -d '[
  {"id":"ember_week","name":"Неделя Угля","descr":"Золото ×1.5 в Бездне",
   "start":1796072400000,"end":1796677200000,
   "modifiers":{"goldMul":1.5,"abyssMod":"lava"}} ]'
```

**Магазин.** Ротация товаров каждые N часов, одинаковая для всех игроков:
```bash
curl -X PUT $API/admin/config/shop -H "$ADM" -d '{"rotationHours":24,"slots":4,"pool":[
  {"id":"potion5","name":"Связка зелий ×5","cost":{"gold":300},"give":{"potion":5}} ]}'
```

### Монетизация: товары и цены (Telegram Stars)

Два вида товаров. **Постоянные** (облики, пропуск, «Хранитель») — игра читает их из `GET /entitlements`. **Расходуемые** (у товара есть `grant`) — самоцветы, наборы, сундуки: каждая оплата увеличивает `entitlements.qty`, игра забирает разницу `qty − claimed` через `POST /pay/claim {claimId}`. Выдача идемпотентна: повтор того же `claimId` вернёт тот же результат (если ответ потерялся), двойная выдача невозможна (сравнение-и-запись по `claimed`). Не забранное (игра закрылась во время оплаты) игра заберёт при следующем входе.

| id | Товар | ⭐ | Что получает игрок (`grant`) | Ограничение |
|---|---|---|---|---|
| `crys_80` | Горсть самоцветов | 49 | 80 самоцветов | — |
| `crys_450` | Мешочек самоцветов | 249 | 450 (+12%) | — |
| `crys_1000` | Сундучок самоцветов | 499 | 1000 (+25%) | — |
| `crys_2200` | Казна самоцветов | 999 | 2200 (+37%) | — |
| `starter_pack` | Набор новичка | 99 | 300 самоцветов, 2 золотых сундука (сразу), 5 железных ключей, 3 свитка защиты | один раз |
| `weekly_pack` | Недельный набор | 149 | 400 самоцветов, легендарный сундук, 2 золотых ключа | раз в неделю (ISO, по игровым суткам) |
| `build_slot` | Второй строитель | 199 | второй слот стройки навсегда + 50 самоцветов | один раз |
| `chest_gold3` | Три золотых сундука | 129 | 3 золотых сундука, открываются сразу | — |
| `chest_leg1` | Легендарный сундук | 119 | легендарный сундук (легендарная вещь гарантирована) | — |
| `spin_1` | Вращение Колеса | 25 | 1 вращение Колеса судьбы (`grant.spin`, копится в сохранении) | — |
| `spin_10` | 10 вращений Колеса | 200 | 10 вращений (−20%) | — |
| `bp_s1` | Путь Угля — премиум | 250 | премиум-дорожка (облики, самоцветы) | один раз за сезон |
| `pack_dawn` | Набор «Рассвет Вейла» | 150 | облик, свечение, рамка | один раз |
| `skin_cloak_ember` / `pet_skin_frost` / `pack_village_lanterns` | облики | 100 / 90 / 75 | облик героя / питомца / украшение деревни | один раз |
| `keeper_30d` | Хранитель Брода | 200 | 30 дней: склад +6 ч, +10 мест в сумке, стройка на 10% быстрее, рамка | продлевается |

Ключи `grant` (их применяет игра, `apps/emberveil/src/p21.js` `grantBundle`): `sparks` (самоцветы), `open_<wood|iron|gold|leg>` (сундук открывается сразу), `chest_<…>` (сундук в запас), `key_iron|key_gold|key_leg`, `frag` (обломки золотого ключа), `prot`/`tome`/`potion`/… (расходники), `slot2` (второй строитель), `tome_<школа>` (фолиант магии), `cosmetic`. Товары без `grant` — постоянные. Сила напрямую не продаётся; в набегах на соседей действует «Честный бой» (README игры).

**Бесплатный сундук**: `POST /chest/free` — раз в `freeChestHours` (по умолчанию 4 ч) по часам сервера (`{ok:true,next}` или `{ok:false,next}`), таблица `user_timers`. Поменять период: `curl -X PUT $API/admin/config/freeChestHours -H "$ADM" -d '6'`.

**Миграция** `migrations/0003_shop.sql` (`entitlements.claimed`, `pay_claims`, `user_timers`): `npx wrangler d1 migrations apply emberveil --remote`.

**Товары за Stars.** `once: true` — купить можно один раз. `weekly: true` — раз в неделю. `days` — товар действует ограниченный срок. `grant` — расходуемый товар (см. выше). Если задаёте `products` через админку, перечислите **все** товары (включая самоцветы и наборы) — список заменяется целиком.
```bash
curl -X PUT $API/admin/config/products -H "$ADM" -d '[
  {"id":"bp_s1","title":"Боевой пропуск — Сезон 1","description":"Премиум-дорожка","stars":250,"type":"battlepass","once":true},
  {"id":"skin_cloak_ember","title":"Плащ «Тлеющий»","description":"Облик героя","stars":100,"type":"cosmetic","once":true} ]'
```

Пока `events` пуст, игра крутит встроенную недельную ротацию (Эхо Колосса пн–вт, Ночь Пепла ср–чт, Выходные удачи сб–вс). Модификаторы, которые понимает игра: `dropMul`, `goldMul`, `xpMul` (опыт пропуска), `shardMul`, `abyssMod: "ashnight"`, `seasonBoss: "colossus"` (или id другого босса). Известные `id` (`colossus_echo`, `ash_night`, `lucky_weekend`) получают свои иконки.

По умолчанию пропуск «Путь Угля» — 50 уровней × 200 оп. (с игры v40; было 30 × 100 — пропуск закрывался за неделю): бесплатная дорожка (ресурсы + облики на 5/10/20/30/40/50), премиум — только облики (каждые 5 уровней) (`{"cosmetic":"skin_frost"}`) и самоцветы (`{"sparks":15}` — ключ остался прежним: бывшие «искры» стали премиум-валютой «Самоцветы»). Список id обликов — `COSM` в `apps/emberveil/src/p18.js`. Опыт пути игра считает сама по игре; сервер ведёт свой (Бездна, набеги, награда дня, контракты), игра показывает больший.

Есть ещё ключи `daily` (награды 7-дневного цикла — игра растит их по неделям в 28-дневном календаре, список контрактов) и `referral` (подарки за друга). Посмотреть всё, включая значения по умолчанию: `curl $API/admin/config -H "$ADM"`. Вернуть ключ к значению по умолчанию: `curl -X DELETE $API/admin/config/events -H "$ADM"`.

**Другие команды админки:**
| Запрос | Что делает |
|---|---|
| `GET /admin/stats` | игроки, активные за сутки, кланы, платежи, сумма Stars |
| `GET /admin/audit` | подозрительные действия; в начале — игроки с наибольшим числом флагов |
| `POST /admin/ban {"pid":"…","banned":true}` | бан (игрок пропадает из рейтингов) |
| `POST /admin/grant {"pid":"…","productId":"bp_s1","qty":1}` | выдать товар вручную |
| `POST /admin/inbox {"pid":"…","title":"Извините!","reward":{"gold":500}}` | письмо с подарком |
| `POST /admin/refund {"chargeId":"…"}` | вернуть Stars через Telegram и забрать товар |

`pid` — публичный id игрока. Его видно в рейтингах и в профиле.

## 5б. Метрики

Игра шлёт события пачками на `POST /events` (`{e:'ftue', k:'first_kill'}` → счётчик `ftue:first_kill`). Сервер хранит **только суточные счётчики** (`ev_counts`: день, имя события, сколько раз, сколько разных игроков) и дни захода игроков (`active_days`: id игрока + день) — никаких других данных. Спам-защита: не больше 2000 событий в день от игрока, не больше 50 за запрос.

```bash
curl "$API/admin/metrics?days=14" -H "$ADM"            # всё за 2 недели
curl "$API/admin/metrics?days=30&prefix=ftue" -H "$ADM" # только воронка обучения
```
В ответе:
- `cohorts` — когорты по дню первого захода: `newPlayers`, `d1`/`d1Pct` (сколько вернулись на следующий день), `d7`/`d7Pct` (на 7-й день). Пока день не наступил — `null`. **D1 = d1Pct, D7 = d7Pct** соответствующей когорты; для недели берите среднее по когортам, взвешенное по `newPlayers`. Ориентиры для мобильных RPG: D1 35–45 %, D7 12–20 %.
- `dau` — уникальные игроки по дням.
- `events` — счётчики: `name`, `n` (сколько раз), `users` (разных игроков).

Как читать воронку обучения: `users` у `ftue:prologue_start` → `ftue:prologue_end` → `ftue:wake` → `ftue:build` → `ftue:stage11` → … → `ftue:raid` → `ftue:done`. Самая большая просадка — место для правки. `ftue:prologue_skip_t30` показывает, на какой секунде пролог пропускают. Монетизация: `purchase_intent:<товар>` → `purchase_success:<товар>`; `purchase_blocked:offline|no_tg` — сколько хотели купить вне Telegram. Реклама: `ad_offer:<место>` → `ad_watch:<место>`, `ad_unavailable` — если SDK не подключён. Возвраты: `day_return:d1`, `d7`… (по часам устройства, для быстрой проверки).

**Ошибки клиента (v39).** Игра ловит `window.onerror` и необработанные `Promise` и шлёт их тем же `POST /events` как `{e:'error', k:<подпись>, d:{m:сообщение, s:верх стека, v:версия, md:режим}}` — не чаще раза на подпись и не больше 5 за сессию. Счётчик `error:<подпись>` попадает в `events`, а в таблицу `err_reports` (миграция `0004_errors.sql`) — сводка по дням: первое сообщение (≤200 символов), стек (≤300), версия, режим, сколько раз и у скольких игроков; хранится 30 дней (cron).
```bash
curl "$API/admin/errors?days=7" -H "$ADM"   # частые ошибки за неделю (то же — в /admin/metrics → errors, топ-20)
```

Прямой SQL (например, D1 за конкретный день):
```bash
npx wrangler d1 execute emberveil --remote --command "WITH f AS (SELECT uid, MIN(day) d0 FROM active_days GROUP BY uid) SELECT d0, COUNT(*) n, SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.uid=f.uid AND a.day=date(f.d0,'+1 day'))) d1 FROM f GROUP BY d0 ORDER BY d0 DESC LIMIT 14"
```

## 5в. Реклама Adsgram: проверка награды (v39.4)

Игра показывает ролики Adsgram (шаги для владельца — `apps/emberveil/README.md`, раздел «Реклама Adsgram (v39.4)»). Сервер делает две вещи:

1. **Отдаёт id блоков** в `GET /config`: `adsBlockRewarded`, `adsBlockInterstitial`, `adsVerify`. Задаются ключом живого конфига `ads` (id блока — не секрет):
   ```bash
   curl -X PUT $API/admin/config/ads -H "$ADM" -d '{"blockRewarded":"12345","blockInterstitial":"","verify":false,"caps":{"revive":2,"chest":1,"fchest":1}}'
   ```
   (Проще — строкой в `apps/emberveil/ads.config.js`; если задано там, игра берёт её.)
2. **Принимает «Reward URL»** — Adsgram после досмотренного ролика сам вызывает адрес, указанный в настройках блока:
   ```
   https://<адрес API>/ads/reward?userid=[userId]
   ```
   `<адрес API>` — адрес Worker из шага 8 (`emberveil-api.<имя>.workers.dev` или ваш домен). `[userId]` оставьте как есть — Adsgram подставит Telegram id игрока. Каждый вызов = одна «рекламная запись» игрока в таблице `ad_credits` на 15 мин (`ADS_CREDIT_TTL_SEC`). Не больше 5 непотраченных (`ADS_OPEN_MAX`) и 40 за сутки (`ADS_DAILY_MAX`) на игрока; неизвестный id молча игнорируется.
   - **Секрет в адресе (рекомендуется):** Adsgram не подписывает вызов, поэтому задайте `npx wrangler secret put ADS_REWARD_KEY` (случайная строка) и допишите в Reward URL `&key=<эта строка>`. Без верного `key` сервер ответит 403. Строку храните только в кабинете Adsgram и в секретах Worker, не в git.
   - Игра тратит запись на ценные награды: `POST /ads/claim {place}` 🔒 → `{ok:true}` / `409 no_credit` (ролик не подтверждён) / `409 limit` (дневной лимит `ads.caps[place]`, по игровым суткам). Списание атомарное: две параллельные траты не получат одну запись.
   - **Включение:** `"verify": true` в ключе `ads` — только когда Reward URL настроен и вызовы доходят (проверка: `npx wrangler d1 execute emberveil --remote --command "SELECT uid, at, used_at, place FROM ad_credits ORDER BY id DESC LIMIT 5"`). Пока `verify:false` (по умолчанию) или игрок без связи, игра выдаёт награду по своим дневным лимитам.
   - Частота: `GET /ads/reward` — 20 в минуту на один Telegram id (`RL_ADS_REWARD`), `POST /ads/claim` — 20 в минуту на игрока (`RL_ADS_CLAIM`). Записи старше 3 дней удаляет cron.

**Выкладка v40 (пропуск 50 × 200):** сначала `npx wrangler d1 migrations apply emberveil --remote` (`migrations/0006_pass_v40.sql` — опыт сезона s1 ×2, уровень у всех прежний), затем `npx wrangler deploy`. Если в таблице `config` лежит своя запись `battlepass` с `xpPerTier: 100`, обновите её (PUT `/admin/config/battlepass`) или удалите — игра v40 не берёт с сервера дорожку с шагом меньше 200 оп. и считает по своей. Тесты — `test/meta.test.js`, `test/misc.test.js`.

**Выкладка v39.4:** `npx wrangler d1 migrations apply emberveil --remote` (таблица `ad_credits`, `migrations/0005_ads.sql`), затем `npx wrangler deploy` (маршруты `/ads/*`, привязки `RL_ADS_REWARD`/`RL_ADS_CLAIM`). Тесты — `test/ads.test.js`.

## 6. Как проверить платежи

**Вариант А (проще всего): настоящие Stars, дешёвый товар, затем возврат.**
1. Временно добавьте товар со `"stars":1`.
2. Купите его в игре.
3. `GET /admin/stats` покажет платёж, а `GET /entitlements` в игре — покупку.
4. Верните Stars: `POST /admin/refund` с `chargeId` (его видно в таблице `payments`: `npx wrangler d1 execute emberveil --remote --command "SELECT charge_id, product_id FROM payments"`).

**Вариант Б: тестовая среда Telegram** (отдельные тестовые аккаунты, настоящие деньги не тратятся).
1. Войдите в тестовую среду. iOS: 10 раз нажмите «Настройки» → «Добавить аккаунт» → «Тестовый». Telegram Desktop: Shift+Alt+правый клик по «Добавить аккаунт» → «Test Server».
2. Создайте **отдельного** бота у тестового @BotFather. Это другой бот с другим токеном.
3. Поставьте `TG_TEST_ENV = "1"` и задайте `BOT_TOKEN` тестового бота. Лучше в отдельном воркере: `name = "emberveil-api-test"` и отдельная база.
4. Webhook ставится через тестовый адрес: `https://api.telegram.org/bot<TOKEN>/test/setWebhook`.
5. Подробности есть в документации Telegram: «Testing Mini Apps» и «Payments in Stars».

Как проходит оплата:
1. Игра вызывает `EVNet.pay.buy('bp_s1')`.
2. Сервер создаёт счёт через `createInvoiceLink`, валюта `XTR`.
3. Telegram показывает окно оплаты.
4. Бот получает `pre_checkout_query`. Сервер проверяет, что счёт свой, сумма совпадает и товар ещё не куплен, и отвечает «ок».
5. Приходит `successful_payment`. Сервер выдаёт товар **ровно один раз**, даже если Telegram пришлёт сообщение повторно: ключом служит `telegram_payment_charge_id`.
6. Игра видит покупку в `EVNet.pay.entitlements()`.

## 7. Подключение к игре (для разработчика)

Код игры лежит внутри `(function(){ … })()`, поэтому хуки ставятся прямо в исходниках `apps/emberveil/src/`. Ниже указаны функции, которые уже есть в игре. Номера строк примерные, ищите по имени функции.

**1) `src/p0.html`** — сразу после строки с `telegram-web-app.js` (строка 12):
```html
<script src="ev-net.js"></script>  <!-- скопировать server/client/ev-net.js рядом с index.html (или встроить в build.sh) -->
<script>window.EVNET_BASE_URL = 'https://emberveil-api.<имя>.workers.dev';</script>
```

**2) `src/p1.js`, `saveGame(now)`** (строка 59). Облако сохраняется вслед за `localStorage`. Модуль сам отправляет не чаще раза в 45 с и откладывает отправку, если нет сети:
```js
function saveGame(now){ if(!now){_saveT=1;return;} _saveT=0; try{Store.set(SKEY,JSON.stringify(S));}catch(e){}
  try{ if(window.EVNet) EVNet.save.push(S, document.hidden); }catch(e){} }
```

**3) `src/p9.js`, `boot()`** — шаг «Ищем старую летопись…» (около строки 329). После `loadGame(); … initTG();` добавьте `netBoot();`, а рядом с `boot()` объявите:
```js
function netBoot(){
  if(!window.EVNet) return;
  EVNet.init({
    baseUrl: window.EVNET_BASE_URL || '',
    // Серверную копию берём, только пока игрок на титульном экране, иначе оставляем локальную.
    onConflict: (srv, loc) => (G.mode==='title' && EVNet.progressScore(srv.data) > EVNet.progressScore(loc)) ? 'server' : 'local',
    onRemoteSave: d => applyCloud(d),
  }).then(r => r.ok ? EVNet.save.pull(S) : null)
    .then(p => { if(p && p.ok && p.action==='use_server') applyCloud(p.data); })
    .then(() => claimInbox());
}
function applyCloud(d){ if(G.mode!=='title') return; Store.set(SKEY, JSON.stringify(d)); location.reload(); }
function claimInbox(){            // подарки за друзей, компенсации, письма админа
  EVNet.inbox.list().then(r => { if(!r.ok) return; for(const it of r.items) EVNet.inbox.claim(it.id).then(c => {
    if(c.ok){ const rw={}; for(const k in c.reward) if(k in S.res) rw[k]=c.reward[k]; giveReward(rw, it.title); saveGame(true); } }); });
}
```

**4) Бездна (`src/p9.js`).** В `startAbyss(floor)` (около строки 171) после создания `G.abyss`:
```js
G.abyss.net = window.EVNet ? EVNet.abyss.start(floor) : null;
```
В `abyssEnd(reason)` (около строки 203), в начале:
```js
if(G.abyss.net){ const fl=G.abyss.floor-1, t=Math.round(((G.run&&G.run.t)||0)*1000);
  G.abyss.net.then(r => { if(r.ok) EVNet.abyss.finish(r.runId, fl, t); }); }
```
Если связи нет, результат встанет в очередь. Рейтинг: `EVNet.leaderboard.abyss({board:'week'|'all'|'season', filter:'global'|'friends'|'clan'})`.

**5) Контракты дня.** Кнопка «Забрать» в `src/p8.js` (строка 316) делает `d.c=true; giveReward(rw,'Контракт')`. Перед этим проверьте на сервере. Офлайн тоже разрешено, чтобы игра оставалась полностью офлайновой:
```js
EVNet.quests.claim(d.id).then(r => { if(r.ok || r.offline){ d.c=true; giveReward(rw,'Контракт'); AU.sfx('quest'); saveGame(); rerender(); } else toast(r.message||'Уже получено'); });
```
Награда за вход: `EVNet.daily.status()` / `EVNet.daily.claim()` возвращают `reward` (ключи как в `S.res`) и серию дней. Сервер знает «сегодня» по своим часам, поэтому перевод часов в телефоне ничего не даёт.

**6) Набеги** (в игре пока нет экрана набегов). При входе в деревню (`enterVillage`, `src/p9.js:15`) опубликуйте оборону:
```js
EVNet.raids.publish({ power: gearPower() + S.hero.lvl*10, bld: S.bld, hero: {lvl: S.hero.lvl}, pets: S.pets.active.filter(Boolean) });
```
Дальше: `EVNet.raids.opponents()` → `EVNet.raids.start(pid)` → игрок проходит набег на снимке деревни → `EVNet.raids.finish(raidId, stars, pct, timeMs)` → `giveReward(r.reward,'Набег')`. Журнал обороны: `EVNet.raids.log()`. Месть: `EVNet.raids.revenge(raidId)`.

**7) Остальное:** кланы `EVNet.clans.*`, конфиг `EVNet.config.get()` (сезон, события, магазин, товары), пропуск `EVNet.battlepass.*`, покупки `EVNet.pay.buy(id)` / `EVNet.pay.entitlements()`, друзья `EVNet.referrals.share()`, напоминания `EVNet.notify.setEnabled(true)` и `EVNet.notify.schedule('forge', секунд)`. Каждая функция описана в JSDoc в `client/ev-net.js`.

Без `EVNET_BASE_URL` все вызовы сразу возвращают `{ok:false, offline:true, error:'not_configured'}`. Игра ведёт себя как раньше.

## 8. Список методов API

Все ответы в JSON. `🔒` — нужен заголовок `Authorization: Bearer <token>` (токен даёт `/auth/*`).

| Метод | Что делает |
|---|---|
| `GET /health` | проверка, что сервер жив |
| `POST /auth/telegram {initData}` | вход из Telegram → токен на 6 часов |
| `POST /auth/guest {deviceId}` | гостевой вход (только при `ALLOW_GUEST=1`) |
| 🔒 `GET /me`, `POST /me/settings {notify?, name?}`, `DELETE /me` | профиль, напоминания, имя в рейтингах (2–20 букв/цифр, `null` — снова имя из Telegram), удаление данных |
| 🔒 `GET /save`, `PUT /save {baseVersion,data,overwrite?}` | облачное сохранение (409 при конфликте, в ответе копия с сервера) |
| 🔒 `POST /abyss/start`, `POST /abyss/finish` | забег в Бездну (токен забега выдаёт сервер) |
| `GET /lb/abyss?board=week\|all\|season&filter=global\|friends\|clan` | рейтинги |
| `GET /lb/clans`, `GET /clans?q=`, `GET /clan/:id` | кланы и их недельные очки |
| 🔒 `GET /clan/me`, `POST /clan/create\|join\|leave\|kick\|role\|edit` | управление кланом |
| 🔒 `PUT /village`, `GET /raid/opponents`, `POST /raid/start\|finish`, `GET /raid/log` | набеги |
| `GET /config` | сезон, пропуск, события, магазин, товары, id блоков рекламы (`adsBlockRewarded`, `adsBlockInterstitial`, `adsVerify`) |
| 🔒 `GET /bp`, `POST /bp/claim {tier,track}` | боевой пропуск |
| 🔒 `GET /daily`, `POST /daily/claim`, `POST /quests/claim {questId}` | награда дня и контракты |
| 🔒 `POST /pay/invoice {productId}`, `GET /entitlements` | покупки за Stars |
| 🔒 `POST /pay/claim {claimId}` | забрать расходуемые покупки (самоцветы, наборы, сундуки), идемпотентно |
| 🔒 `POST /chest/free` | бесплатный сундук (таймер по часам сервера) |
| `GET /ads/reward?userid=<tg id>[&key=…]` | Reward URL для Adsgram (вызывает Adsgram): одна «рекламная запись» игрока на 15 мин (§5в) |
| 🔒 `POST /ads/claim {place}` | потратить запись на награду за ролик (`409 no_credit` / `409 limit`) |
| 🔒 `GET /referrals`, `POST /friends/add`, `GET /inbox`, `POST /inbox/claim` | друзья и подарки |
| 🔒 `POST /notify/schedule {kind,inSec}` | напоминание через бота |
| 🔒 `POST /events {events:[{e,k,d?}]}` | аналитика игры: до 50 событий за раз, хранятся только суточные счётчики; `d` — только у `error` (сводка `err_reports`) |
| `POST /tg/webhook` | обновления от Telegram (проверяется секретный заголовок) |
| `GET\|PUT\|DELETE /admin/config[/:key]`, `POST /admin/grant\|inbox\|ban\|refund`, `GET /admin/audit\|stats\|metrics\|errors` | админка (`ADMIN_SECRET`) |

## 9. Защита от читов: что проверяется

Игра однопользовательская, и сохранение живёт у игрока. Полностью доказать честность сервер не может, поэтому проверяет то, что проверить дёшево:

- **Сохранение.** Сохранение отклоняется, если это не формат игры, ресурсы отрицательные или огромные, уровень вне 1–40, счётчики убийств, этажей и рекорда **уменьшились** или поменялась дата создания. Исключение — игрок сам выбрал «оставить копию с этого устройства». Сохранение принимается, но помечается флагом, если ресурсов прибавилось намного больше, чем можно заработать за прошедшее время, уровень растёт слишком быстро или рекорд Бездны в сохранении намного выше подтверждённого.
- **Рейтинг Бездны** не верит сохранению. Его ведёт сервер: время начала забега записывает он сам. Не больше 3 этажей в минуту (`ABYSS_MAX_FLOORS_PER_MIN`), не меньше 8 с на этаж, забег живёт не дольше 6 часов, каждый токен забега используется один раз.
- **Набеги.** Длительность от 15 с до 10 мин по часам сервера. Звёзды должны соответствовать проценту разрушений. Намного более слабый игрок не может получить 3 звезды. Добычу считает сервер. Не больше 5 набегов в день, и запуск набега тоже входит в этот лимит.
- **Награда дня и контракты** — «сегодня» определяют часы сервера, каждую награду можно забрать один раз.
- Все подозрения пишутся в `audit`. Проверяйте `GET /admin/audit`, нарушителей баньте через `POST /admin/ban`.

## 10. Конфиденциальность

Сервер хранит **минимум данных**:
- Telegram user id, имя (first name), username (если есть), язык интерфейса;
- игровые данные: сохранение, рекорды, клан, набеги, покупки;
- согласие на напоминания.

**Не хранится:** телефон, фамилия, фото, контакты, геолокация. Другие игроки видят только имя и случайный публичный id (`pid`), но не Telegram id и не username. Платежи хранят только id транзакции Telegram, товар и сумму. Данных карт у нас нет: оплату целиком проводит Telegram.

Игрок может удалить свои данные: `EVNet.deleteAccount()` (`DELETE /me`). Это стирает сохранение, рекорды, клан и письма, а имя обнуляется. Записи о платежах остаются для учёта. Журнал `audit` чистится через 90 дней.

Укажите это в описании бота или в политике конфиденциальности. Этого требуют правила Telegram для Mini Apps.

## 11. Чек-лист безопасности

- [ ] `BOT_TOKEN`, `JWT_SECRET`, `ADMIN_SECRET`, `WEBHOOK_SECRET` заданы через `wrangler secret put`, а не в `wrangler.toml` и не в git.
- [ ] `JWT_SECRET` и `ADMIN_SECRET` — случайные строки по 32+ символа (сервер не принимает короче 16).
- [ ] `ALLOW_GUEST = "0"` в боевом воркере.
- [ ] `ALLOWED_ORIGINS` = только адрес игры, без `*`.
- [ ] Webhook поставлен с `secret_token`: без него сервер отвергает обновления.
- [ ] `TG_TEST_ENV = "0"` в боевом воркере.
- [ ] Токен бота никогда не логируется и не попадает в ответы. Это проверяют тесты.
- [ ] Если токен утёк: @BotFather → `/revoke`, затем `wrangler secret put BOT_TOKEN` и заново шаг 9.
- [ ] Включите двухфакторный вход в Cloudflare и Telegram.
- [ ] Раз в неделю смотрите `GET /admin/audit`.
- [ ] Ограничение частоты запросов включено (v39, см. раздел 11б): привязки `[[ratelimits]]` в `wrangler.toml` выложены вместе с воркером. Для `/admin/*` дополнительно стоит закрыть путь Cloudflare Access.
- [ ] `INITDATA_MAX_AGE_SEC = "3600"` (по умолчанию с v39): подписанный Telegram `initData` старше часа не принимается.
- [ ] Резервная копия базы: `npx wrangler d1 export emberveil --remote --output backup.sql`.

## 11б. Ограничение частоты запросов (v39)

Каждый запрос к «дорогим» методам проходит через `src/lib/ratelimit.js`; сверх лимита — `429 {error:'rate_limited', retryAfter}` и заголовок `Retry-After`. Игра (`ev-net.js`) воспринимает 429 как обычную ошибку и повторит позже (сохранение и события стоят в очереди).

| Группа | Методы | Ключ | Лимит |
|---|---|---|---|
| `RL_AUTH` | `POST /auth/telegram`, `POST /auth/guest` | IP (`CF-Connecting-IP`) | 20 в минуту |
| `RL_SAVE` | `PUT /save` | игрок (из токена) | 30 в минуту |
| `RL_EVENTS` | `POST /events` | игрок | 30 в минуту |
| `RL_PAY` | `POST /pay/invoice` | игрок | 10 в минуту |
| `RL_ADMIN` | `/admin/*` | IP | 30 в минуту |
| `RL_ADS_REWARD` | `GET /ads/reward` (v39.4) | Telegram id из `?userid=` (вызовы идут с серверов Adsgram) | 20 в минуту |
| `RL_ADS_CLAIM` | `POST /ads/claim` (v39.4) | игрок | 20 в минуту |

- **В бою** счётчики ведёт Cloudflare: [Workers Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), привязки `[[ratelimits]]` в `wrangler.toml` (нужен wrangler ≥ 4.36; в проекте — 4.x). Окно — 10 или 60 с, счёт ведётся в каждой точке присутствия отдельно (это защита от наводнения запросами, а не точный учёт). `namespace_id` — любое целое, уникальное в аккаунте Cloudflare.
- **Без привязок** (локально, в тестах, старый wrangler) работает запасной счётчик «ведро с жетонами» в памяти изолята с теми же числами — слабее (каждый изолят считает сам), но одного клиента, долбящего сервер, останавливает.
- Привязка недоступна или упала — запрос пропускается (игрока не блокируем из-за сбоя ограничителя).
- `RATE_LIMIT = "0"` в `[vars]` выключает ограничение (нагрузочные тесты). Лимиты меняются в `RL_RULES` (`src/lib/ratelimit.js`) и в `wrangler.toml` вместе.
- Тесты: `test/limits.test.js` (группы, 429 и `Retry-After`, ключ по игроку и по IP, приоритет привязки, отказ привязки, ошибки клиента, срок `initData`).

**Выкладка v39:** `npx wrangler d1 migrations apply emberveil --remote` (таблица `err_reports`), затем `npx wrangler deploy` (привязки ограничителя и `INITDATA_MAX_AGE_SEC=3600`).

## 12. Ограничения (честно)

- Ограничение частоты запросов (v39) считает по точкам присутствия Cloudflare, а запасной счётчик — по изолятам: это защита от наводнения, не строгий лимит.
- Облачное сохранение — защита «от дурака», а не настоящий античит. Опытный игрок может подделать сохранение в разумных пределах. Рейтинги защищены лучше, но время забега всё равно меряет клиент.
- Набег проходит на телефоне атакующего. Сервер проверяет правдоподобие результата, но бой не пересчитывает. Экрана набегов в игре пока нет, сервер для него готов.
- Подписка «Хранитель Брода» — это разовая покупка на 30 дней без автопродления. Продление складывается со сроком.
- Друзья — те, кто пришёл по ссылке, добавлен по `pid` или состоит в том же клане. Список контактов Telegram недоступен.
- Напоминания приходят только тем, кто сам открыл бота и включил `/notify`. Не больше 3 в день, с интервалом от часа. Точность — до 10 минут (cron).
- Нет живого чата клана, только лента событий.
