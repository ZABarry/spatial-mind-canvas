import { describe, expect, it } from 'vitest'
import { createBlankProject } from '../graph/defaults'
import { addNode } from '../graph/mutations'
import { applyMapSnapshotPayload, buildMapSnapshotPayload } from './snapshotPayload'

describe('snapshotPayload', () => {
  it('build + apply round-trip preserves project id and map content', () => {
    const p = createBlankProject('My map')
    const withNode = addNode(p.graph, {
      title: 'A',
      shortDescription: '',
      note: '',
      color: '#fff',
      shape: 'sphere',
      size: 1,
      position: [1, 2, 3],
      tags: [],
      collapsed: false,
      pinned: false,
      mediaIds: [],
    })
    p.graph = withNode.graph

    const snap = buildMapSnapshotPayload(p)
    const p2 = createBlankProject('Other')
    p2.id = p.id
    p2.name = 'Renamed'
    const restored = applyMapSnapshotPayload(p2, snap)

    expect(restored.id).toBe(p.id)
    expect(restored.name).toBe('Renamed')
    expect(Object.keys(restored.graph.nodes).length).toBe(1)
    const nid = Object.keys(restored.graph.nodes)[0]
    expect(restored.graph.nodes[nid]?.title).toBe('A')
  })

  it('applyMapSnapshotPayload updates map settings from snapshot', () => {
    const p = createBlankProject('T')
    p.settings.focusHopDepth = 2
    p.settings.worldAxisControls = false

    const snap = buildMapSnapshotPayload(p)
    const p2 = createBlankProject('T2')
    p2.id = p.id
    p2.settings.focusHopDepth = 0
    p2.settings.worldAxisControls = true

    const out = applyMapSnapshotPayload(p2, snap)
    expect(out.settings.focusHopDepth).toBe(2)
    expect(out.settings.worldAxisControls).toBe(false)
  })
})
