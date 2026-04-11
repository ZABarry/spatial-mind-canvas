import type { GraphState, NodeEntity } from './types'

export function getNode(graph: GraphState, id: string): NodeEntity | undefined {
  return graph.nodes[id]
}

export function getOutgoingEdges(graph: GraphState, nodeId: string) {
  return Object.values(graph.edges).filter((e) => e.sourceId === nodeId)
}

export function getIncomingEdges(graph: GraphState, nodeId: string) {
  return Object.values(graph.edges).filter((e) => e.targetId === nodeId)
}

/** Descendants following parentId links */
export function collectDescendantIds(graph: GraphState, rootId: string): Set<string> {
  const out = new Set<string>()
  const walk = (id: string) => {
    for (const n of Object.values(graph.nodes)) {
      if (n.parentId === id && !out.has(n.id)) {
        out.add(n.id)
        walk(n.id)
      }
    }
  }
  walk(rootId)
  return out
}

export function isAncestorCollapsed(graph: GraphState, nodeId: string): boolean {
  let cur: string | undefined = graph.nodes[nodeId]?.parentId
  const seen = new Set<string>()
  while (cur) {
    if (seen.has(cur)) break
    seen.add(cur)
    const node: NodeEntity | undefined = graph.nodes[cur]
    if (!node) break
    if (node.collapsed) return true
    cur = node.parentId
  }
  return false
}

export function shouldRenderNode(graph: GraphState, nodeId: string): boolean {
  const start = graph.nodes[nodeId]
  if (!start) return false
  let cur: string | undefined = start.parentId
  const seen = new Set<string>()
  while (cur) {
    if (seen.has(cur)) break
    seen.add(cur)
    const p = graph.nodes[cur]
    if (!p) break
    if (p.collapsed) return false
    cur = p.parentId
  }
  return true
}

/** k-hop neighbors via edges */
export function neighborIdsByEdges(graph: GraphState, seedIds: string[], depth: number): Set<string> {
  const result = new Set<string>(seedIds)
  let frontier = [...seedIds]
  for (let d = 0; d < depth; d++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const e of Object.values(graph.edges)) {
        if (e.sourceId === id) {
          if (!result.has(e.targetId)) {
            result.add(e.targetId)
            next.push(e.targetId)
          }
        }
        if (e.targetId === id) {
          if (!result.has(e.sourceId)) {
            result.add(e.sourceId)
            next.push(e.sourceId)
          }
        }
      }
    }
    frontier = next
  }
  return result
}
