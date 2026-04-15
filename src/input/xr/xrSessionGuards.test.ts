import { describe, expect, it } from 'vitest'
import { createBlankProject } from '../../graph/defaults'
import { idleSession, type InteractionSession } from '../sessionTypes'
import { canBeginWorldGrab, shouldIgnoreXrGraphSelect, type WorldGrabGuardState } from './xrSessionGuards'

const wt = () => createBlankProject().worldTransform

function base(over: Partial<WorldGrabGuardState> = {}): WorldGrabGuardState {
  return {
    navigationMode: 'world',
    interactionSession: idleSession,
    searchOpen: false,
    mapHistoryOpen: false,
    bookmarksPanelOpen: false,
    detailNodeId: null,
    settingsOpen: false,
    confirmDialog: null,
    textPromptDialog: null,
    xrHelpOpen: false,
    placementPreview: null,
    ...over,
  }
}

describe('canBeginWorldGrab', () => {
  it('allows idle + world nav with no blockers', () => {
    expect(canBeginWorldGrab(base())).toBe(true)
  })

  it('blocks travel navigation', () => {
    expect(canBeginWorldGrab(base({ navigationMode: 'travel' }))).toBe(false)
  })

  it('blocks non-idle sessions', () => {
    const sessions: InteractionSession[] = [
      { kind: 'link', pointerId: 'x', fromNodeId: 'a' },
      {
        kind: 'nodeDrag',
        pointerId: 'p',
        nodeId: 'a',
        start: [0, 0, 0],
        current: [0, 0, 0],
      },
      { kind: 'worldGrab', pointerIds: [], startWorld: wt() },
      { kind: 'menu', menu: 'global' },
      { kind: 'menu', menu: 'node' },
    ]
    for (const interactionSession of sessions) {
      expect(canBeginWorldGrab(base({ interactionSession }))).toBe(false)
    }
  })

  it('blocks when UI overlays are open', () => {
    expect(canBeginWorldGrab(base({ searchOpen: true }))).toBe(false)
    expect(canBeginWorldGrab(base({ mapHistoryOpen: true }))).toBe(false)
    expect(canBeginWorldGrab(base({ bookmarksPanelOpen: true }))).toBe(false)
    expect(canBeginWorldGrab(base({ detailNodeId: 'n1' }))).toBe(false)
    expect(canBeginWorldGrab(base({ settingsOpen: true }))).toBe(false)
    expect(canBeginWorldGrab(base({ confirmDialog: { title: 'x', message: 'y', onConfirm: () => {} } }))).toBe(false)
    expect(canBeginWorldGrab(base({ textPromptDialog: { title: 't', defaultValue: '', onSubmit: () => {} } }))).toBe(
      false,
    )
    expect(canBeginWorldGrab(base({ xrHelpOpen: true }))).toBe(false)
    expect(canBeginWorldGrab(base({ placementPreview: { position: [0, 0, 0] } }))).toBe(false)
  })
})

describe('shouldIgnoreXrGraphSelect', () => {
  it('is false when nothing blocks', () => {
    expect(shouldIgnoreXrGraphSelect(base())).toBe(false)
  })

  it('is true when flat/HTML overlays block graph aim', () => {
    expect(shouldIgnoreXrGraphSelect(base({ searchOpen: true }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ mapHistoryOpen: true }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ bookmarksPanelOpen: true }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ detailNodeId: 'x' }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ settingsOpen: true }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ confirmDialog: {} }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ textPromptDialog: {} }))).toBe(true)
    expect(shouldIgnoreXrGraphSelect(base({ xrHelpOpen: true }))).toBe(true)
  })
})
