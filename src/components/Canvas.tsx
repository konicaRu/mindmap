import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBoardStore } from '../store/boardStore'
import CardNodeView from './CardNodeView'

const nodeTypes = { card: CardNodeView }

function CanvasInner() {
  const board = useBoardStore((s) => s.board)
  const mode = useBoardStore((s) => s.mode)
  const selectedNodeId = useBoardStore((s) => s.selectedNodeId)
  const activeCategoryId = useBoardStore((s) => s.activeCategoryId)
  const setSelected = useBoardStore((s) => s.setSelected)
  const moveNode = useBoardStore((s) => s.moveNode)
  const addEdgeAction = useBoardStore((s) => s.addEdge)
  const removeNode = useBoardStore((s) => s.removeNode)
  const removeEdge = useBoardStore((s) => s.removeEdge)
  const addNode = useBoardStore((s) => s.addNode)

  const isEdit = mode === 'edit'
  const { screenToFlowPosition } = useReactFlow()

  const colorOf = useCallback(
    (categoryId: string | null) =>
      board.categories.find((c) => c.id === categoryId)?.color ?? null,
    [board.categories],
  )

  const rfNodes: Node[] = useMemo(
    () =>
      board.nodes.map((n) => ({
        id: n.id,
        type: 'card',
        position: n.position,
        selected: n.id === selectedNodeId,
        draggable: isEdit,
        data: {
          title: n.title,
          color: colorOf(n.categoryId),
          tags: n.tags,
          dimmed:
            activeCategoryId !== null && n.categoryId !== activeCategoryId,
        },
      })),
    [board.nodes, selectedNodeId, isEdit, colorOf, activeCategoryId],
  )

  const rfEdges: Edge[] = useMemo(
    () =>
      board.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: false,
        style: { stroke: '#94a3b8' },
        labelStyle: { fill: '#cbd5e1', fontSize: 11 },
        labelBgStyle: { fill: 'rgba(30,41,59,0.85)' },
      })),
    [board.edges],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const ch of changes) {
        if (ch.type === 'position' && ch.position && ch.dragging === false) {
          moveNode(ch.id, ch.position)
        }
        if (ch.type === 'remove' && isEdit) removeNode(ch.id)
      }
    },
    [moveNode, removeNode, isEdit],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const ch of changes) {
        if (ch.type === 'remove' && isEdit) removeEdge(ch.id)
      }
    },
    [removeEdge, isEdit],
  )

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) addEdgeAction(c.source, c.target)
    },
    [addEdgeAction],
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => setSelected(node.id),
    [setSelected],
  )

  const onPaneClick = useCallback(() => setSelected(null), [setSelected])

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEdit) return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(pos)
    },
    [isEdit, screenToFlowPosition, addNode],
  )

  return (
    <div className="h-full w-full" onDoubleClick={onDoubleClick}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={isEdit}
        nodesConnectable={isEdit}
        elementsSelectable
        fitView
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={isEdit ? ['Backspace', 'Delete'] : []}
      >
        <Background gap={20} color="#475569" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) =>
            (n.data as { color?: string | null })?.color ?? '#94a3b8'
          }
          className="!bg-slate-200 dark:!bg-slate-800"
        />
      </ReactFlow>
    </div>
  )
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
