import { create } from 'zustand'
import type {
  Board,
  CardEdge,
  CardNode,
  Category,
  Mode,
  Section,
  Source,
} from '../types'
import {
  categoryPalette,
  defaultSectionTemplate,
  uid,
} from '../lib/defaults'
import { saveToStorage } from '../lib/persistence'

type BoardState = {
  board: Board
  mode: Mode
  selectedNodeId: string | null
  activeCategoryId: string | null // null = «Все»
  theme: 'dark' | 'light'

  // инициализация / целиком
  setBoard: (board: Board) => void
  setMode: (mode: Mode) => void
  setTitle: (title: string) => void
  setSelected: (id: string | null) => void
  setActiveCategory: (id: string | null) => void
  toggleTheme: () => void

  // узлы
  addNode: (position?: { x: number; y: number }) => string
  updateNode: (id: string, patch: Partial<Omit<CardNode, 'id'>>) => void
  moveNode: (id: string, position: { x: number; y: number }) => void
  removeNode: (id: string) => void

  // связи
  addEdge: (source: string, target: string) => void
  updateEdge: (id: string, patch: Partial<Omit<CardEdge, 'id'>>) => void
  removeEdge: (id: string) => void

  // секции
  addSection: (nodeId: string) => void
  updateSection: (nodeId: string, sectionId: string, patch: Partial<Section>) => void
  removeSection: (nodeId: string, sectionId: string) => void
  moveSection: (nodeId: string, sectionId: string, dir: -1 | 1) => void

  // теги / источники
  setTags: (nodeId: string, tags: string[]) => void
  addSource: (nodeId: string) => void
  updateSource: (nodeId: string, sourceId: string, patch: Partial<Source>) => void
  removeSource: (nodeId: string, sourceId: string) => void

  // категории
  addCategory: () => void
  updateCategory: (id: string, patch: Partial<Category>) => void
  removeCategory: (id: string) => void
}

// Обновляет доску, автосохраняет в localStorage и возвращает новый стейт.
const commit = (
  set: (fn: (s: BoardState) => Partial<BoardState>) => void,
  updater: (board: Board) => Board,
) => {
  set((s) => {
    const board = updater(s.board)
    saveToStorage(board)
    return { board }
  })
}

const mapNodes = (board: Board, id: string, fn: (n: CardNode) => CardNode): Board => ({
  ...board,
  nodes: board.nodes.map((n) => (n.id === id ? fn(n) : n)),
})

export const useBoardStore = create<BoardState>((set, get) => ({
  board: { version: 1, title: '', categories: [], nodes: [], edges: [] },
  mode: 'edit',
  selectedNodeId: null,
  activeCategoryId: null,
  theme: 'dark',

  setBoard: (board) => {
    saveToStorage(board)
    set({ board, selectedNodeId: null })
  },
  setMode: (mode) => set({ mode }),
  setTitle: (title) => commit(set, (b) => ({ ...b, title })),
  setSelected: (selectedNodeId) => set({ selectedNodeId }),
  setActiveCategory: (activeCategoryId) => set({ activeCategoryId }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  addNode: (position) => {
    const id = uid()
    const node: CardNode = {
      id,
      position: position ?? { x: 0, y: 0 },
      title: 'Новая карточка',
      categoryId: get().activeCategoryId,
      sections: defaultSectionTemplate(),
      tags: [],
      sources: [],
    }
    commit(set, (b) => ({ ...b, nodes: [...b.nodes, node] }))
    set({ selectedNodeId: id })
    return id
  },

  updateNode: (id, patch) =>
    commit(set, (b) => mapNodes(b, id, (n) => ({ ...n, ...patch }))),

  moveNode: (id, position) =>
    commit(set, (b) => mapNodes(b, id, (n) => ({ ...n, position }))),

  removeNode: (id) => {
    commit(set, (b) => ({
      ...b,
      nodes: b.nodes.filter((n) => n.id !== id),
      edges: b.edges.filter((e) => e.source !== id && e.target !== id),
    }))
    if (get().selectedNodeId === id) set({ selectedNodeId: null })
  },

  addEdge: (source, target) => {
    if (source === target) return
    commit(set, (b) => {
      const exists = b.edges.some((e) => e.source === source && e.target === target)
      if (exists) return b
      return { ...b, edges: [...b.edges, { id: uid(), source, target }] }
    })
  },

  updateEdge: (id, patch) =>
    commit(set, (b) => ({
      ...b,
      edges: b.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  removeEdge: (id) =>
    commit(set, (b) => ({ ...b, edges: b.edges.filter((e) => e.id !== id) })),

  addSection: (nodeId) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => ({
        ...n,
        sections: [...n.sections, { id: uid(), heading: 'Новая секция', body: '' }],
      })),
    ),

  updateSection: (nodeId, sectionId, patch) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => ({
        ...n,
        sections: n.sections.map((s) =>
          s.id === sectionId ? { ...s, ...patch } : s,
        ),
      })),
    ),

  removeSection: (nodeId, sectionId) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => ({
        ...n,
        sections: n.sections.filter((s) => s.id !== sectionId),
      })),
    ),

  moveSection: (nodeId, sectionId, dir) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => {
        const idx = n.sections.findIndex((s) => s.id === sectionId)
        const next = idx + dir
        if (idx < 0 || next < 0 || next >= n.sections.length) return n
        const sections = [...n.sections]
        ;[sections[idx], sections[next]] = [sections[next], sections[idx]]
        return { ...n, sections }
      }),
    ),

  setTags: (nodeId, tags) =>
    commit(set, (b) => mapNodes(b, nodeId, (n) => ({ ...n, tags }))),

  addSource: (nodeId) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => ({
        ...n,
        sources: [...n.sources, { id: uid(), label: '', url: '' }],
      })),
    ),

  updateSource: (nodeId, sourceId, patch) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => ({
        ...n,
        sources: n.sources.map((s) =>
          s.id === sourceId ? { ...s, ...patch } : s,
        ),
      })),
    ),

  removeSource: (nodeId, sourceId) =>
    commit(set, (b) =>
      mapNodes(b, nodeId, (n) => ({
        ...n,
        sources: n.sources.filter((s) => s.id !== sourceId),
      })),
    ),

  addCategory: () =>
    commit(set, (b) => {
      const color = categoryPalette[b.categories.length % categoryPalette.length]
      return {
        ...b,
        categories: [
          ...b.categories,
          { id: uid(), name: 'Категория', color },
        ],
      }
    }),

  updateCategory: (id, patch) =>
    commit(set, (b) => ({
      ...b,
      categories: b.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeCategory: (id) =>
    commit(set, (b) => ({
      ...b,
      categories: b.categories.filter((c) => c.id !== id),
      nodes: b.nodes.map((n) =>
        n.categoryId === id ? { ...n, categoryId: null } : n,
      ),
    })),
}))
