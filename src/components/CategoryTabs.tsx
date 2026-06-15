import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'

// Верхние вкладки-фильтры по категориям + управление списком в режиме редактирования.
export default function CategoryTabs() {
  const board = useBoardStore((s) => s.board)
  const mode = useBoardStore((s) => s.mode)
  const activeCategoryId = useBoardStore((s) => s.activeCategoryId)
  const setActiveCategory = useBoardStore((s) => s.setActiveCategory)
  const addCategory = useBoardStore((s) => s.addCategory)
  const updateCategory = useBoardStore((s) => s.updateCategory)
  const removeCategory = useBoardStore((s) => s.removeCategory)

  const [managing, setManaging] = useState(false)
  const isEdit = mode === 'edit'

  const countFor = (id: string | null) =>
    id === null
      ? board.nodes.length
      : board.nodes.filter((n) => n.categoryId === id).length

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/80 px-3 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <Tab
        active={activeCategoryId === null}
        onClick={() => setActiveCategory(null)}
        label={`Все (${countFor(null)})`}
      />
      {board.categories.map((c) => (
        <Tab
          key={c.id}
          active={activeCategoryId === c.id}
          onClick={() => setActiveCategory(c.id)}
          label={`${c.name} (${countFor(c.id)})`}
          color={c.color}
        />
      ))}

      {isEdit && (
        <button
          onClick={() => setManaging((v) => !v)}
          className="ml-auto rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          {managing ? 'Готово' : 'Категории…'}
        </button>
      )}

      {isEdit && managing && (
        <div className="w-full">
          <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            {board.categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                  className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                />
                <input
                  value={c.name}
                  onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                  className="flex-1 rounded bg-slate-100 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
                />
                <button
                  onClick={() => removeCategory(c.id)}
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              onClick={addCategory}
              className="w-full rounded-lg border border-dashed border-slate-400 py-1 text-sm text-slate-500 hover:border-blue-500 hover:text-blue-500 dark:border-slate-600"
            >
              + Категория
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Tab({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors',
        active
          ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600',
      ].join(' ')}
    >
      {color && (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  )
}
