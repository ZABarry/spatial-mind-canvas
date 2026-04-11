import { describe, it, expect } from 'vitest'
import { emptyGraph } from './defaults'
import { addNode, addEdge, createNodeDefaults } from './mutations'
import { neighborIdsByEdges } from './selectors'
import { v3 } from '../utils/math'

describe('graph mutations', () => {
  it('adds node and edge', () => {
    let g = emptyGraph()
    const a = addNode(g, createNodeDefaults(v3(0, 0, 0)))
    g = a.graph
    const b = addNode(g, createNodeDefaults(v3(2, 0, 0)))
    g = b.graph
    const e = addEdge(g, { sourceId: a.node.id, targetId: b.node.id, style: 'straight' })
    g = e.graph
    expect(Object.keys(g.nodes)).toHaveLength(2)
    expect(Object.keys(g.edges)).toHaveLength(1)
  })
})

describe('neighbors', () => {
  it('finds one-hop neighbors', () => {
    let g = emptyGraph()
    const a = addNode(g, createNodeDefaults(v3(0, 0, 0)))
    g = a.graph
    const b = addNode(g, createNodeDefaults(v3(2, 0, 0)))
    g = b.graph
    const e = addEdge(g, { sourceId: a.node.id, targetId: b.node.id, style: 'straight' })
    g = e.graph
    const n = neighborIdsByEdges(g, [a.node.id], 1)
    expect(n.has(b.node.id)).toBe(true)
  })
})
