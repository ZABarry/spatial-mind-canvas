import { nanoid } from 'nanoid'
import type { EdgeEntity, GraphState, NodeEntity, NodeShape } from './types'
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  NODE_LABEL_OUTLINE_DEFAULT,
  NODE_LABEL_TEXT_DEFAULT,
} from './types'
import type { Vec3 } from '../utils/math'

const now = () => Date.now()

/** Input for `addNode`: label colors optional (defaults from `createNodeDefaults`). */
export type NewNodeInput = Omit<NodeEntity, 'id' | 'createdAt' | 'updatedAt' | 'labelTextColor' | 'labelOutlineColor'> & {
  id?: string
  labelTextColor?: string
  labelOutlineColor?: string
}

export function addNode(graph: GraphState, partial: NewNodeInput): { graph: GraphState; node: NodeEntity } {
  const t = now()
  const base = createNodeDefaults(partial.position, partial.shape)
  const node: NodeEntity = {
    ...base,
    ...partial,
    labelTextColor: partial.labelTextColor ?? base.labelTextColor,
    labelOutlineColor: partial.labelOutlineColor ?? base.labelOutlineColor,
    id: partial.id ?? nanoid(),
    createdAt: t,
    updatedAt: t,
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
    style: 'straight',
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

export function createNodeDefaults(position: Vec3, shape: NodeShape = DEFAULT_NODE_SHAPE): Omit<NodeEntity, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: 'Idea',
    shortDescription: '',
    note: '',
    color: DEFAULT_NODE_COLOR,
    labelTextColor: NODE_LABEL_TEXT_DEFAULT,
    labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
    shape,
    size: 1,
    position,
    tags: [],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  }
}
