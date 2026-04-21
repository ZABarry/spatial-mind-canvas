import { describe, expect, it } from 'vitest'
import { computeXrHudGuidance, hasOpenFloatingPanel } from './xrHudGuidance'

describe('hasOpenFloatingPanel', () => {
  it('is true when any panel flag is set', () => {
    expect(
      hasOpenFloatingPanel({
        searchOpen: true,
        detailNodeId: null,
        settingsOpen: false,
        mapHistoryOpen: false,
        bookmarksPanelOpen: false,
        xrHelpOpen: false,
      }),
    ).toBe(true)
  })

  it('is false when all closed', () => {
    expect(
      hasOpenFloatingPanel({
        searchOpen: false,
        detailNodeId: null,
        settingsOpen: false,
        mapHistoryOpen: false,
        bookmarksPanelOpen: false,
        xrHelpOpen: false,
      }),
    ).toBe(false)
  })
})

describe('computeXrHudGuidance', () => {
  const idle = { kind: 'idle' as const }

  it('minimal when modal', () => {
    const g = computeXrHudGuidance({
      confirmDialog: { title: 'x' },
      textPromptDialog: null,
      interactionSession: idle,
      floatingPanelOpen: false,
    })
    expect(g.density).toBe('minimal')
    expect(g.showOnboarding).toBe(false)
    expect(g.showRecovery).toBe(true)
  })

  it('quiet when link active', () => {
    const g = computeXrHudGuidance({
      confirmDialog: null,
      textPromptDialog: null,
      interactionSession: {
        kind: 'link',
        pointerId: 'p',
        fromNodeId: 'a',
        previewTarget: undefined,
      },
      floatingPanelOpen: true,
    })
    expect(g.density).toBe('quiet')
    expect(g.showSessionHint).toBe(true)
    expect(g.showRecovery).toBe(false)
    expect(g.baseLines).toBe(2)
  })

  it('quiet when floating panel and idle', () => {
    const g = computeXrHudGuidance({
      confirmDialog: null,
      textPromptDialog: null,
      interactionSession: idle,
      floatingPanelOpen: true,
    })
    expect(g.showRecovery).toBe(true)
    expect(g.showModeLine).toBe(false)
  })

  it('full when idle and no panels', () => {
    const g = computeXrHudGuidance({
      confirmDialog: null,
      textPromptDialog: null,
      interactionSession: idle,
      floatingPanelOpen: false,
    })
    expect(g.density).toBe('full')
    expect(g.showModeLine).toBe(true)
    expect(g.showOnboarding).toBe(true)
  })
})
