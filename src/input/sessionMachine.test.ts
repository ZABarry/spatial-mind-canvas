import { describe, expect, it } from 'vitest'
import { createBlankProject, emptyGraph } from '../graph/defaults'
import { addNode, createNodeDefaults } from '../graph/mutations'
import { v3 } from '../utils/math'
import { noneHit } from './hitTargets'
import { getInteractionPhase } from './interactionPhase'
import { linkPreviewTargetFromSession, sessionDisablesOrbitRotation, withLinkPreviewTarget } from './sessionMachine'
import { idleSession, type InteractionSession } from './sessionTypes'

const wt = () => createBlankProject().worldTransform

describe('sessionDisablesOrbitRotation', () => {
  it('is true for link and nodeDrag', () => {
    expect(
      sessionDisablesOrbitRotation({
        kind: 'link',
        pointerId: 'm',
        fromNodeId: 'a',
      }),
    ).toBe(true)
    expect(
      sessionDisablesOrbitRotation({
        kind: 'nodeDrag',
        pointerId: 'p',
        nodeId: 'a',
        start: [0, 0, 0],
        current: [1, 0, 0],
      }),
    ).toBe(true)
  })

  it('is false for idle and worldGrab', () => {
    expect(sessionDisablesOrbitRotation(idleSession)).toBe(false)
    expect(
      sessionDisablesOrbitRotation({
        kind: 'worldGrab',
        pointerIds: [],
        startWorld: wt(),
      }),
    ).toBe(false)
  })
})

describe('linkPreviewTargetFromSession', () => {
  it('returns undefined when not link', () => {
    expect(linkPreviewTargetFromSession(idleSession)).toBeUndefined()
  })

  it('returns previewTarget for link session', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'm',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'b' },
    }
    expect(linkPreviewTargetFromSession(s)).toEqual({ kind: 'node', nodeId: 'b' })
  })
})

describe('withLinkPreviewTarget', () => {
  it('returns null when session is not link', () => {
    expect(withLinkPreviewTarget(idleSession, { kind: 'node', nodeId: 'x' })).toBeNull()
  })

  it('returns null when target unchanged', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'm',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'b' },
    }
    expect(withLinkPreviewTarget(s, { kind: 'node', nodeId: 'b' })).toBeNull()
  })

  it('returns updated session when target changes', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'm',
      fromNodeId: 'a',
    }
    const next = withLinkPreviewTarget(s, { kind: 'ground', point: [0, 0, 0] })
    expect(next).toMatchObject({
      kind: 'link',
      previewTarget: { kind: 'ground', point: [0, 0, 0] },
    })
  })

  it('clears preview with undefined', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'm',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'b' },
    }
    const next = withLinkPreviewTarget(s, undefined)
    expect(next).not.toBeNull()
    if (next?.kind === 'link') expect(next.previewTarget).toBeUndefined()
  })

  it('treats noneHit as distinct from undefined', () => {
    const s: InteractionSession = { kind: 'link', pointerId: 'm', fromNodeId: 'a' }
    const next = withLinkPreviewTarget(s, noneHit)
    expect(next).not.toBeNull()
    if (next?.kind === 'link') expect(next.previewTarget).toEqual(noneHit)
  })
})

describe('getInteractionPhase', () => {
  const basePhase = {
    confirmDialog: null,
    searchOpen: false,
    detailNodeId: null,
    placementPreview: null,
    interactionMode: 'worldManip' as const,
    hover: {},
    interactionSession: idleSession,
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

  it('xrMenu when menu session', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        interactionSession: { kind: 'menu', menu: 'global' },
      }),
    ).toBe('xrMenu')
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

  it('drawingEdge when link session', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
        interactionSession: {
          kind: 'link',
          pointerId: 'm',
          fromNodeId: 'a',
        },
      }),
    ).toBe('drawingEdge')
  })

  it('placingNode over drag when placement preview set', () => {
    let g = emptyGraph()
    const added = addNode(g, { ...createNodeDefaults(v3(1, 0, 0)), id: 'a' })
    g = added.graph
    expect(
      getInteractionPhase({
        ...basePhase,
        placementPreview: { position: [0, 0, 0] },
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

  it('draggingNode when nodeDrag session', () => {
    expect(
      getInteractionPhase({
        ...basePhase,
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
