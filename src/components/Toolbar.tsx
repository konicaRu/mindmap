import { useRef } from 'react'
import { useBoardStore } from '../store/boardStore'
import {
  clearStorage,
  exportBoard,
  importBoard,
} from '../lib/persistence'
import { createStarterBoard } from '../lib/defaults'

export default function Toolbar() {
  const board = useBoardStore((s) => s.board)
  const mode = useBoardStore((s) => s.mode)
  const theme = useBoardStore((s) => s.theme)
  const setMode = useBoardStore((s) => s.setMode)
  const setTitle = useBoardStore((s) => s.setTitle)
  const setBoard = useBoardStore((s) => s.setBoard)
  const addNode = useBoardStore((s) => s.addNode)
  const toggleTheme = useBoardStore((s) => s.toggleTheme)

  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = mode === 'edit'

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setBoard(await importBoard(file))
    } catch {
      alert('Не удалось прочитать файл: проверьте, что это корректный JSON доски.')
    }
    e.target.value = ''
  }

  return (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      <span className="text-lg">🧠</span>
      {isEdit ? (
        <input
          value={board.title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-56 rounded bg-slate-100 px-2 py-1 text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100"
        />
      ) : (
        <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {board.title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {isEdit && (
          <button onClick={() => addNode({ x: 0, y: 0 })} className="btn-primary">
            + Карточка
          </button>
        )}

        {isEdit && (
          <>
            <button onClick={() => exportBoard(board)} className="btn">
              Экспорт
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn">
              Импорт
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onImport}
              className="hidden"
            />
            <button
              onClick={() => {
                if (
                  confirm(
                    'Очистить доску и начать заново? Текущие данные будут потеряны (сделайте экспорт заранее).',
                  )
                ) {
                  clearStorage()
                  setBoard(createStarterBoard())
                }
              }}
              className="btn"
            >
              Сброс
            </button>
          </>
        )}

        <button onClick={toggleTheme} className="btn" title="Тема">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          onClick={() => setMode(isEdit ? 'view' : 'edit')}
          className="btn-primary"
        >
          {isEdit ? 'Просмотр' : 'Редактировать'}
        </button>
      </div>
    </header>
  )
}
