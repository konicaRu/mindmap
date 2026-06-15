import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useBoardStore } from '../store/boardStore'

export type CardNodeData = {
  title: string
  color: string | null
  dimmed: boolean
  tags: string[]
}

// Кастомный узел-карточка. Хэндлы видны/активны только в режиме редактирования.
export default function CardNodeView({ data, selected }: NodeProps) {
  const d = data as unknown as CardNodeData
  const mode = useBoardStore((s) => s.mode)
  const isEdit = mode === 'edit'
  const accent = d.color ?? '#94a3b8'

  return (
    <div
      className={[
        'rounded-xl border bg-white/95 dark:bg-slate-800/95 shadow-md backdrop-blur',
        'min-w-[160px] max-w-[240px] transition-opacity',
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/40'
          : 'border-slate-300 dark:border-slate-600',
        d.dimmed ? 'opacity-30' : 'opacity-100',
      ].join(' ')}
      style={{ borderTopColor: accent, borderTopWidth: 4 }}
    >
      {isEdit && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !bg-slate-400"
        />
      )}
      <div className="px-3 py-2">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
          {d.title || 'Без названия'}
        </div>
        {d.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {d.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
      {isEdit && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !bg-slate-400"
        />
      )}
    </div>
  )
}
