import type { Board } from '../types'
import { createStarterBoard } from './defaults'

const STORAGE_KEY = 'context-mindmap:board'

export function saveToStorage(board: Board): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
  } catch (e) {
    console.warn('Не удалось сохранить в localStorage', e)
  }
}

export function loadFromStorage(): Board | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeBoard(JSON.parse(raw))
  } catch (e) {
    console.warn('Не удалось прочитать localStorage', e)
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Загрузка опубликованной доски из public/data.json (учитывает base path).
export async function loadPublishedBoard(): Promise<Board | null> {
  try {
    const url = `${import.meta.env.BASE_URL}data.json`
    const res = await fetch(url, { cache: 'no-cache' })
    if (!res.ok) return null
    return normalizeBoard(await res.json())
  } catch {
    return null
  }
}

// Определяет стартовую доску: localStorage → data.json → демо.
export async function resolveInitialBoard(): Promise<Board> {
  const stored = loadFromStorage()
  if (stored) return stored
  const published = await loadPublishedBoard()
  if (published) return published
  return createStarterBoard()
}

export function exportBoard(board: Board): void {
  const blob = new Blob([JSON.stringify(board, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safe = board.title.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60) || 'board'
  a.download = `${safe}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBoard(file: File): Promise<Board> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(normalizeBoard(JSON.parse(String(reader.result))))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// Защита от неполных/старых файлов: гарантируем форму Board.
export function normalizeBoard(data: unknown): Board {
  const b = (data ?? {}) as Partial<Board>
  return {
    version: 1,
    title: typeof b.title === 'string' ? b.title : 'Без названия',
    categories: Array.isArray(b.categories) ? b.categories : [],
    nodes: Array.isArray(b.nodes)
      ? b.nodes.map((n) => ({
          ...n,
          sections: Array.isArray(n.sections) ? n.sections : [],
          tags: Array.isArray(n.tags) ? n.tags : [],
          sources: Array.isArray(n.sources) ? n.sources : [],
          categoryId: n.categoryId ?? null,
          position: n.position ?? { x: 0, y: 0 },
        }))
      : [],
    edges: Array.isArray(b.edges) ? b.edges : [],
  }
}
