import { nanoid } from 'nanoid'
import type { EdgeEntity, EdgeStyle, GraphState, NodeEntity, NodeShape } from './types'
import type { Vec3 } from '../utils/math'

const now = () => Date.now()

export function addNode(
  graph: GraphState,
  partial: Omit<NodeEntity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): { graph: GraphState; node: NodeEntity } {
  const t = now()
  const node: NodeEntity = {
    id: partial.id ?? nanoid(),
    title: partial.title,
    shortDescription: partial.shortDescription,
    note: partial.note,
    color: partial.color,
    shape: partial.shape,
    size: partial.size,
    position: partial.position,
    tags: partial.tags,
    createdAt: t,
    updatedAt: t,
    collapsed: partial.collapsed,
    pinned: partial.pinned,
    mediaIds: partial.mediaIds,
    parentId: partial.parentId,
  }
  return {
    graph: {
      nodes: { ...graph.nodes, [node.id]: node },
      edges: graph.edges,
    },
    node,
  }
}

export function patchNode(
  graph: GraphState,
  id: string,
  patch: Partial<Omit<NodeEntity, 'id' | 'createdAt'>>,
): GraphState {
  const n = graph.nodes[id]
  if (!n) return graph
  const updated: NodeEntity = {
    ...n,
    ...patch,
    updatedAt: now(),
  }
  return { ...graph, nodes: { ...graph.nodes, [id]: updated } }
}

export function removeNode(graph: GraphState, id: string): GraphState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [id]: _removed, ...restNodes } = graph.nodes
  const edges: Record<string, EdgeEntity> = {}
  for (const [eid, e] of Object.entries(graph.edges)) {
    if (e.sourceId === id || e.targetId === id) continue
    edges[eid] = e
  }
  return { nodes: restNodes, edges }
}

export function addEdge(
  graph: GraphState,
  opts: {
    id?: string
    sourceId: string
    targetId: string
    label?: string
    style: EdgeStyle
    controlPoints?: Vec3[]
    thickness?: number
    directed?: boolean
  },
): { graph: GraphState; edge: EdgeEntity } {
  const t = now()
  const edge: EdgeEntity = {
    id: opts.id ?? nanoid(),
    sourceId: opts.sourceId,
    targetId: opts.targetId,
    label: opts.label ?? '',
    style: opts.style,
    controlPoints: opts.controlPoints,
    thickness: opts.thickness ?? 1,
    directed: opts.directed ?? false,
    createdAt: t,
    updatedAt: t,
  }
  return {
    graph: { ...graph, edges: { ...graph.edges, [edge.id]: edge } },
    edge,
  }
}

export function patchEdge(
  graph: GraphState,
  id: string,
  patch: Partial<Omit<EdgeEntity, 'id' | 'createdAt'>>,
): GraphState {
  const e = graph.edges[id]
  if (!e) return graph
  const updated: EdgeEntity = { ...e, ...patch, updatedAt: now() }
  return { ...graph, edges: { ...graph.edges, [id]: updated } }
}

export function removeEdge(graph: GraphState, id: string): GraphState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [id]: _removed, ...rest } = graph.edges
  return { ...graph, edges: rest }
}

export function clearGraph(): GraphState {
  return { nodes: {}, edges: {} }
}

export function createNodeDefaults(position: Vec3, shape: NodeShape = 'sphere'): Omit<NodeEntity, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: 'Idea',
    shortDescription: '',
    note: '',
    color: '#7eb8da',
    shape,
    size: 1,
    position,
    tags: [],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  }
}
