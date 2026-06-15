import { useEffect } from 'react'
import { useBoardStore } from './store/boardStore'
import { resolveInitialBoard } from './lib/persistence'
import Toolbar from './components/Toolbar'
import CategoryTabs from './components/CategoryTabs'
import Canvas from './components/Canvas'
import DetailPanel from './components/DetailPanel'

export default function App() {
  const setBoard = useBoardStore((s) => s.setBoard)
  const setMode = useBoardStore((s) => s.setMode)
  const theme = useBoardStore((s) => s.theme)
  const selectedNodeId = useBoardStore((s) => s.selectedNodeId)

  // Стартовая загрузка: localStorage → data.json → демо.
  // ?view=1 в URL запускает режим просмотра (для опубликованной карты).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === '1') setMode('view')
    resolveInitialBoard().then(setBoard)
  }, [setBoard, setMode])

  // Переключение темы на <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Toolbar />
      <CategoryTabs />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>
        {selectedNodeId && <DetailPanel />}
      </div>
    </div>
  )
}
