# MEMORY — журнал

## Статус проекта
MVP работает: интерактивная доска mind map (Vite + React + TS) собирается и
запускается локально. Опубликован на GitHub: https://github.com/konicaRu/mindmap.
Критерий готовности: **MVP работает** (собирается и работает локально; дальше —
поддержка и доработки по запросу).

## Открытые вопросы
- Пока нет.

## Лог сессий
### 2026-06-15 (публикация на GitHub Pages)
- Включил GitHub Pages через REST API (build_type=workflow, source = GitHub Actions).
- Перезапустил упавший деплой-workflow → success. Сайт живой (HTTP 200):
  https://konicaru.github.io/mindmap/ (режим просмотра: `?view=1`).

### 2026-06-15 (старт по project-starter)
- Скопировал `project-starter.md` в корень проекта.
- `git init` (ветка `main`), первый коммит, remote `origin` → konicaRu/mindmap, push.
- Стартовый опрос: язык — русский; git — есть, пушим на GitHub; модуль «накопительные
  правила» — нет; humanizer — нет; критерий готовности — «MVP работает».
- Завёл контекстные файлы `MEMORY.md` и `ARCHITECTURE.md` (README уже был).
