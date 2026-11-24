# Claude Code Game Studios (агенты и навыки)

Источник: https://github.com/Donchitos/Claude-Code-Game-Studios — релиз 1.2.0, коммит 05ad7c8 (лицензия MIT, текст в `GAME-STUDIOS-LICENSE`).

Установлено: `.claude/agents` (49 агентов), `.claude/skills` (74 навыка), `.claude/rules`, `.claude/docs`, `.claude/scripts`.

**Не установлено намеренно:** хуки (`.claude/hooks`), `settings.json`, строка статуса, корневой `CLAUDE.md` с протоколом «спрашивать перед каждой правкой», `project.yaml`, папки `design/` и `production/`. Наш процесс работы над ЭМБЕРВЕЙЛ не меняется: агенты и навыки вызываются по запросу.

Особенности для нашего проекта:
- Движок — Three.js r128 (веб, Telegram Mini App), а в студии есть специалисты только под Godot/Unity/Unreal; их не используем. Подходят общие роли: дизайнеры (game/systems/level/economy/live-ops/ux), нарратив и сценарист, арт- и аудио-директора, технический художник, программисты (gameplay/ui/ai/engine/performance), QA, продюсер, релиз, аналитика, локализация, доступность, сообщество.
- Многие навыки читают `project.yaml` и ждут папки `design/`, `production/`; без них используют значения по умолчанию.
- Агенты появляются в новой сессии Claude Code.
