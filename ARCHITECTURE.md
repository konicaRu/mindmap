# ARCHITECTURE

## Назначение
Интерактивная доска концепций (mind map): карточки-узлы с настраиваемыми секциями
контекста (Markdown), связи между ними, фильтр по категориям, режимы редактирования и
просмотра. Без бэкенда — чистая статика, хранение в localStorage + экспорт/импорт JSON.
Публикуется на GitHub Pages.

## Структура
- `index.html` — точка входа Vite.
- `src/main.tsx` — бутстрап React.
- `src/App.tsx` — корневой компонент, раскладка.
- `src/components/`
  - `Canvas.tsx` — холст (@xyflow/react): узлы, связи, зум/пан.
  - `CardNodeView.tsx` — отрисовка карточки-узла.
  - `CategoryTabs.tsx` — вкладки-фильтр по категориям.
  - `DetailPanel.tsx` — правая панель с контекстом выбранной карточки.
  - `SectionEditor.tsx` — редактор настраиваемых секций (Markdown).
  - `Toolbar.tsx` — верхняя панель действий (создать, экспорт/импорт, тема, режим).
- `src/store/boardStore.ts` — состояние доски (zustand).
- `src/lib/`
  - `defaults.ts` — стартовые данные/демо.
  - `persistence.ts` — сохранение/загрузка (localStorage, экспорт/импорт JSON).
- `src/types.ts` — модель данных: `Board` → `categories[]`, `nodes[]` (с `sections[]`,
  `tags[]`, `sources[]`), `edges[]`.
- `src/styles.css`, `tailwind.config.js`, `postcss.config.js` — стили (Tailwind).
- `public/data.json` — данные для режима просмотра на опубликованном сайте.
- `.github/workflows/deploy.yml` — сборка и публикация на GitHub Pages.
- `vite.config.ts` — конфиг сборки (`BASE_PATH` для project-страниц).

## Команды
- `npm install` — установка зависимостей.
- `npm run dev` — дев-сервер (http://localhost:5173).
- `npm run build` — сборка статики в `dist/`.
- `npm run preview` — локальный предпросмотр сборки.

## Стек
Vite · React · TypeScript · @xyflow/react · Tailwind CSS · zustand · react-markdown.

## Changelog
### 2026-06-15
- Инициализирован git, проект выложен на GitHub (konicaRu/mindmap).
- Добавлен `project-starter.md`; заведены `MEMORY.md` и `ARCHITECTURE.md`.
- `project-starter.md`: раздел 2 → чек-лист «по пунктам»; добавлены модули «Скиллы
  Карпатого» (10) и «Superpowers» (11); синхронизируется в 3 копиях.
