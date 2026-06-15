import type { Board, Section } from '../types'

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// Дефолтный шаблон секций для новой карточки (по образцу референса).
export const defaultSectionTemplate = (): Section[] => [
  { id: uid(), heading: 'Зачем это важно', body: '' },
  { id: uid(), heading: 'Пример', body: '' },
  { id: uid(), heading: 'Механика', body: '' },
  { id: uid(), heading: 'Ключевые тезисы', body: '' },
]

export const categoryPalette = [
  '#60a5fa', // blue
  '#34d399', // green
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#f87171', // red
  '#22d3ee', // cyan
  '#a3e635', // lime
]

// Стартовая демо-доска (используется, если нет ни localStorage, ни data.json).
export const createStarterBoard = (): Board => {
  const основа = 'cat-osnova'
  const retrieval = 'cat-retrieval'
  const memory = 'cat-memory'

  const n1 = uid()
  const n2 = uid()
  const n3 = uid()

  return {
    version: 1,
    title: 'Моя карта концепций',
    categories: [
      { id: основа, name: 'Основа', color: '#60a5fa' },
      { id: retrieval, name: 'Retrieval', color: '#34d399' },
      { id: memory, name: 'Memory', color: '#a78bfa' },
    ],
    nodes: [
      {
        id: n1,
        position: { x: 0, y: 0 },
        title: 'Context Engineering',
        categoryId: основа,
        sections: [
          {
            id: uid(),
            heading: 'Зачем это важно',
            body: 'Качество ответа модели определяется тем, **какой контекст** ей дали. Управление контекстом — отдельная дисциплина.',
          },
          {
            id: uid(),
            heading: 'Ключевые тезисы',
            body: '- Контекст ограничен\n- Релевантность важнее объёма\n- Структура помогает модели',
          },
        ],
        tags: ['основа', 'llm'],
        sources: [
          { id: uid(), label: 'Референс-карта', url: 'https://safreliy.github.io/context-engineering-mindmap/' },
        ],
      },
      {
        id: n2,
        position: { x: 320, y: -120 },
        title: 'Retrieval (RAG)',
        categoryId: retrieval,
        sections: [
          {
            id: uid(),
            heading: 'Механика',
            body: 'Поиск релевантных фрагментов и подстановка их в контекст перед генерацией.',
          },
        ],
        tags: ['retrieval', 'rag'],
        sources: [],
      },
      {
        id: n3,
        position: { x: 320, y: 120 },
        title: 'Memory',
        categoryId: memory,
        sections: [
          {
            id: uid(),
            heading: 'Зачем это важно',
            body: 'Сохранение состояния между шагами/сессиями расширяет полезный контекст за пределы одного запроса.',
          },
        ],
        tags: ['memory', 'state'],
        sources: [],
      },
    ],
    edges: [
      { id: uid(), source: n1, target: n2, label: 'включает' },
      { id: uid(), source: n1, target: n3, label: 'включает' },
    ],
  }
}
