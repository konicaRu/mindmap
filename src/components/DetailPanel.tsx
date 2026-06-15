import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBoardStore } from '../store/boardStore'
import SectionEditor from './SectionEditor'

export default function DetailPanel() {
  const board = useBoardStore((s) => s.board)
  const mode = useBoardStore((s) => s.mode)
  const selectedNodeId = useBoardStore((s) => s.selectedNodeId)
  const setSelected = useBoardStore((s) => s.setSelected)
  const updateNode = useBoardStore((s) => s.updateNode)
  const removeNode = useBoardStore((s) => s.removeNode)
  const setTags = useBoardStore((s) => s.setTags)
  const addSource = useBoardStore((s) => s.addSource)
  const updateSource = useBoardStore((s) => s.updateSource)
  const removeSource = useBoardStore((s) => s.removeSource)

  const node = board.nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const isEdit = mode === 'edit'
  const category = board.categories.find((c) => c.id === node.categoryId)

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-slate-300 bg-white text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      {/* шапка */}
      <div className="flex items-start gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
        <div className="flex-1">
          {isEdit ? (
            <input
              value={node.title}
              onChange={(e) => updateNode(node.id, { title: e.target.value })}
              className="w-full rounded bg-slate-100 px-2 py-1 text-base font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
            />
          ) : (
            <h2 className="text-lg font-bold">{node.title}</h2>
          )}
          {category && (
            <span
              className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          )}
        </div>
        <button
          onClick={() => setSelected(null)}
          title="Закрыть"
          className="rounded p-1 text-xl leading-none hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      {/* тело (скролл) */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {isEdit && (
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Категория</span>
            <select
              value={node.categoryId ?? ''}
              onChange={(e) =>
                updateNode(node.id, { categoryId: e.target.value || null })
              }
              className="w-full rounded bg-slate-100 px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
            >
              <option value="">— без категории —</option>
              {board.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* секции */}
        {isEdit ? (
          <SectionEditor nodeId={node.id} sections={node.sections} />
        ) : (
          <div className="space-y-4">
            {node.sections
              .filter((s) => s.heading || s.body)
              .map((s) => (
                <section key={s.id}>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {s.heading}
                  </h3>
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {s.body}
                    </ReactMarkdown>
                  </div>
                </section>
              ))}
          </div>
        )}

        {/* теги */}
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Теги
          </h3>
          {isEdit ? (
            <input
              value={node.tags.join(', ')}
              onChange={(e) =>
                setTags(
                  node.id,
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
              placeholder="через запятую"
              className="w-full rounded bg-slate-100 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
            />
          ) : node.tags.length ? (
            <div className="flex flex-wrap gap-1">
              {node.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">—</p>
          )}
        </div>

        {/* источники */}
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Источники
          </h3>
          {isEdit ? (
            <div className="space-y-2">
              {node.sources.map((src) => (
                <div key={src.id} className="flex items-center gap-1">
                  <input
                    value={src.label}
                    onChange={(e) =>
                      updateSource(node.id, src.id, { label: e.target.value })
                    }
                    placeholder="Название"
                    className="w-1/2 rounded bg-slate-100 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <input
                    value={src.url ?? ''}
                    onChange={(e) =>
                      updateSource(node.id, src.id, { url: e.target.value })
                    }
                    placeholder="https://"
                    className="flex-1 rounded bg-slate-100 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <button
                    onClick={() => removeSource(node.id, src.id)}
                    className="rounded px-1.5 py-1 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addSource(node.id)}
                className="w-full rounded-lg border border-dashed border-slate-400 py-1 text-sm text-slate-500 hover:border-blue-500 hover:text-blue-500 dark:border-slate-600"
              >
                + Источник
              </button>
            </div>
          ) : node.sources.length ? (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {node.sources.map((src) => (
                <li key={src.id}>
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 underline"
                    >
                      {src.label || src.url}
                    </a>
                  ) : (
                    src.label
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">—</p>
          )}
        </div>
      </div>

      {/* футер: удаление */}
      {isEdit && (
        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <button
            onClick={() => removeNode(node.id)}
            className="w-full rounded-lg bg-red-500/10 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20"
          >
            Удалить карточку
          </button>
        </div>
      )}
    </aside>
  )
}
