// Модель данных доски. Весь экспорт/импорт = сериализация объекта Board.

export type Category = {
  id: string
  name: string
  color: string // hex, например "#60a5fa"
}

export type Section = {
  id: string
  heading: string
  body: string // Markdown
}

export type Source = {
  id: string
  label: string
  url?: string
}

export type CardNode = {
  id: string
  position: { x: number; y: number }
  title: string
  categoryId: string | null
  sections: Section[]
  tags: string[]
  sources: Source[]
}

export type CardEdge = {
  id: string
  source: string
  target: string
  label?: string
}

export type Board = {
  version: 1
  title: string
  categories: Category[]
  nodes: CardNode[]
  edges: CardEdge[]
}

export type Mode = 'edit' | 'view'
