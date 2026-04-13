import { describe, expect, it } from 'vitest'
import { createBlankProject } from './defaults'
import { addNode } from './mutations'
import { spawnChildBranchPositions } from './branching'

describe('spawnChildBranchPositions', () => {
  it('returns count positions distinct from parent', () => {
    const p = createBlankProject()
    const root = addNode(p.graph, {
      title: 'R',
      shortDescription: '',
      note: '',
      color: '#ccc',
      shape: 'sphere',
      size: 1,
      position: [0, 0, 0],
      tags: [],
      collapsed: false,
      pinned: false,
      mediaIds: [],
    })
    const parent = root.node
    const g = root.graph
    const pos = spawnChildBranchPositions(g, parent, 3)
    expect(pos).toHaveLength(3)
    for (const q of pos) {
      expect(q[0] === 0 && q[1] === 0 && q[2] === 0).toBe(false)
    }
  })
})
