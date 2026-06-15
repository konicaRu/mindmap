import type { Section } from '../types'
import { useBoardStore } from '../store/boardStore'

type Props = {
  nodeId: string
  sections: Section[]
}

// Редактор настраиваемых секций: заголовок, тело (Markdown), порядок, удаление.
export default function SectionEditor({ nodeId, sections }: Props) {
  const updateSection = useBoardStore((s) => s.updateSection)
  const removeSection = useBoardStore((s) => s.removeSection)
  const moveSection = useBoardStore((s) => s.moveSection)
  const addSection = useBoardStore((s) => s.addSection)

  return (
    <div className="space-y-3">
      {sections.map((sec, i) => (
        <div
          key={sec.id}
          className="rounded-lg border border-slate-300 p-2 dark:border-slate-600"
        >
          <div className="mb-1 flex items-center gap-1">
            <input
              value={sec.heading}
              onChange={(e) =>
                updateSection(nodeId, sec.id, { heading: e.target.value })
              }
              placeholder="Заголовок секции"
              className="flex-1 rounded bg-slate-100 px-2 py-1 text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700"
            />
            <button
              title="Вверх"
              disabled={i === 0}
              onClick={() => moveSection(nodeId, sec.id, -1)}
              className="rounded px-1.5 py-1 text-xs hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-600"
            >
              ↑
            </button>
            <button
              title="Вниз"
              disabled={i === sections.length - 1}
              onClick={() => moveSection(nodeId, sec.id, 1)}
              className="rounded px-1.5 py-1 text-xs hover:bg-slate-200 disabled:opacity-30 dark:hover:bg-slate-600"
            >
              ↓
            </button>
            <button
              title="Удалить секцию"
              onClick={() => removeSection(nodeId, sec.id)}
              className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              ✕
            </button>
          </div>
          <textarea
            value={sec.body}
            onChange={(e) =>
              updateSection(nodeId, sec.id, { body: e.target.value })
            }
            placeholder="Текст (поддерживается Markdown)"
            rows={4}
            className="w-full resize-y rounded bg-slate-100 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700"
          />
        </div>
      ))}
      <button
        onClick={() => addSection(nodeId)}
        className="w-full rounded-lg border border-dashed border-slate-400 py-1.5 text-sm text-slate-500 hover:border-blue-500 hover:text-blue-500 dark:border-slate-600"
      >
        + Добавить секцию
      </button>
    </div>
  )
}
