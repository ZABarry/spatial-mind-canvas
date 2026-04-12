import { describe, expect, it } from 'vitest'
import { createBlankProject, emptyGraph } from '../graph/defaults'
import { addNode, createNodeDefaults } from '../graph/mutations'
import { v3 } from '../utils/math'
import { getInteractionPhase } from './interactionPhase'
import { deriveInteractionSession } from './sessionMachine'
import { idleSession } from './sessionTypes'

const wt = () => createBlankProject().worldTransform

function sessionInput(overrides: Partial<Parameters<typeof deriveInteractionSession>[0]>) {
  let g = emptyGraph()
  const added = addNode(g, createNodeDefaults(v3(1, 0, 0)))
  g = added.graph
  const nodeId = added.node.id
  const base: Parameters<typeof deriveInteractionSession>[0] = {
    connectionDraft: null,
    nodeDragActive: false,
    nodeDragNodeId: null,
    worldGrabBefore: null,
    projectNodePosition: (id) => g.nodes[id]?.position,
    ...overrides,
  }
  if (overrides.nodeDragNodeId === undefined && overrides.nodeDragActive) {
    base.nodeDragNodeId = nodeId
  }
  return base
}

describe('deriveInteractionSession', () => {
  it('returns idle when nothing active', () => {
    expect(deriveInteractionSession(sessionInput({})).kind).toBe('idle')
  })

  it('prefers worldGrab over link and drag', () => {
    const p = createBlankProject()
    const s = deriveInteractionSession(
      sessionInput({
        worldGrabBefore: p,
        connectionDraft: { fromNodeId: 'x' },
        nodeDragActive: true,
        nodeDragNodeId: 'a',
      }),
    )
    expect(s.kind).toBe('worldGrab')
    if (s.kind === 'worldGrab') {
      expect(s.startWorld).toEqual(p.worldTransform)
    }
  })

  it('returns link session with mouse pointer when connectionDraft set', () => {
    const s = deriveInteractionSession(
      sessionInput({
        connectionDraft: { fromNodeId: 'n1' },
      }),
    )
    expect(s).toMatchObject({
      kind: 'link',
      pointerId: 'mouse',
      fromNodeId: 'n1',
    })
  })

  it('returns link session with xr controller id when draft has index', () => {
    const s = deriveInteractionSession(
      sessionInput({
        connectionDraft: { fromNodeId: 'n1', xrControllerIndex: 1 },
      }),
    )
    expect(s).toMatchObject({
      kind: 'link',
      pointerId: 'xr-controller-1',
      fromNodeId: 'n1',
    })
  })

  it('returns nodeDrag when dragging without draft or grab', () => {
    let g = emptyGraph()
    const added = addNode(g, { ...createNodeDefaults(v3(1, 0, 0)), id: 'a' })
    g = added.graph
    const s = deriveInteractionSession({
      connectionDraft: null,
      nodeDragActive: true,
      nodeDragNodeId: 'a',
      worldGrabBefore: null,
      projectNodePosition: (id) => g.nodes[id]?.position,
    })
    expect(s.kind).toBe('nodeDrag')
    if (s.kind === 'nodeDrag') {
      expect(s.nodeId).toBe('a')
      expect(s.current).toEqual([1, 0, 0])
    }
  })
})

describe('getInteractionPhase', () => {
  const basePhase = {
    confirmDialog: null,
    searchOpen: false,
    detailNodeId: null,
    connectionDraft: null,
    placementPreview: null,
    interactionMode: 'worldManip' as const,
    hover: {},
    interactionSession: idleSession,
    nodeDragActive: false,
  }

  it('modalConfirm blocks other phases', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        confirmDialog: { title: 'x', message: 'y', onConfirm: () => {} },
        searchOpen: true,
      }),
    ).toBe('modalConfirm')
  })

  it('searchPalette when search open', () => {
    expect(getInteractionPhase({ ...basePhase, searchOpen: true })).toBe('searchPalette')
  })

  it('nodeDetail when detail open', () => {
    expect(getInteractionPhase({ ...basePhase, detailNodeId: 'n' })).toBe('nodeDetail')
  })

  it('grabbingWorld when session is worldGrab', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        interactionSession: {
          kind: 'worldGrab',
          pointerIds: [],
          startWorld: wt(),
        },
      }),
    ).toBe('grabbingWorld')
  })

  it('drawingEdge when connection draft or link session', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        connectionDraft: { fromNodeId: 'a' },
        interactionSession: {
          kind: 'link',
          pointerId: 'm',
          fromNodeId: 'a',
        },
      }),
    ).toBe('drawingEdge')
  })

  it('placingNode over drag when placement preview set', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        placementPreview: { position: [0, 0, 0] },
        nodeDragActive: true,
        interactionSession: {
          kind: 'nodeDrag',
          pointerId: 'p',
          nodeId: 'a',
          start: [0, 0, 0],
          current: [1, 0, 0],
        },
      }),
    ).toBe('placingNode')
  })

  it('draggingNode when node drag active', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        nodeDragActive: true,
        interactionSession: {
          kind: 'nodeDrag',
          pointerId: 'p',
          nodeId: 'a',
          start: [0, 0, 0],
          current: [1, 0, 0],
        },
      }),
    ).toBe('draggingNode')
  })

  it('travel when interactionMode travel', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        interactionMode: 'travel',
      }),
    ).toBe('travel')
  })

  it('hovering when something hovered', () => {
    expect(getInteractionPhase({ ...basePhase, hover: { nodeId: 'x' } })).toBe('hovering')
  })

  it('idle otherwise', () => {
    expect(getInteractionPhase(basePhase)).toBe('idle')
  })
})
