/**
 * Pure rules for XR status HUD: one dominant guidance channel, less stacking noise.
 * Priority (highest first): modal → active session (link/grab/menu/drag) → recovery (panels) → save → onboarding → idle nudges.
 */

import type { InteractionSession } from '../../input/sessionTypes'

export type XrHudDensity = 'full' | 'quiet' | 'minimal'

export type XrHudGuidanceSnapshot = {
  /** How many base lines to show (1 = tool/nav only, 2 = + selection, 3 = + mode help). */
  baseLines: 1 | 2 | 3
  /** Show the long mode line (line3) — off when quiet/minimal. */
  showModeLine: boolean
  /** Onboarding block allowed. */
  showOnboarding: boolean
  /** Idle “nothing selected” nudge. */
  showIdleNudge: boolean
  /** Near-pinch workspace warm hint. */
  showPinchWarm: boolean
  /** Session-specific line (link, grab, menu). */
  showSessionHint: boolean
  /** Panel/modal recovery one-liner. */
  showRecovery: boolean
  /** Save / feedback persistence line. */
  showPersist: boolean
  density: XrHudDensity
}

export function hasOpenFloatingPanel(input: {
  searchOpen: boolean
  detailNodeId: string | null
  settingsOpen: boolean
  mapHistoryOpen: boolean
  bookmarksPanelOpen: boolean
  xrHelpOpen: boolean
}): boolean {
  return (
    input.searchOpen ||
    input.detailNodeId != null ||
    input.settingsOpen ||
    input.mapHistoryOpen ||
    input.bookmarksPanelOpen ||
    input.xrHelpOpen
  )
}

export function computeXrHudGuidance(input: {
  confirmDialog: unknown
  textPromptDialog: unknown
  interactionSession: InteractionSession
  floatingPanelOpen: boolean
}): XrHudGuidanceSnapshot {
  const hasModal = Boolean(input.confirmDialog || input.textPromptDialog)
  const kind = input.interactionSession.kind

  if (hasModal) {
    return {
      baseLines: 1,
      showModeLine: false,
      showOnboarding: false,
      showIdleNudge: false,
      showPinchWarm: false,
      showSessionHint: false,
      showRecovery: true,
      showPersist: true,
      density: 'minimal',
    }
  }

  const activeSession =
    kind === 'link' || kind === 'worldGrab' || kind === 'menu' || kind === 'nodeDrag'

  if (activeSession) {
    return {
      baseLines: 2,
      showModeLine: false,
      showOnboarding: false,
      showIdleNudge: false,
      showPinchWarm: false,
      showSessionHint: true,
      showRecovery: false,
      showPersist: true,
      density: 'quiet',
    }
  }

  const quietChrome = input.floatingPanelOpen

  if (quietChrome) {
    return {
      baseLines: 2,
      showModeLine: false,
      showOnboarding: false,
      showIdleNudge: false,
      showPinchWarm: false,
      showSessionHint: false,
      showRecovery: true,
      showPersist: true,
      density: 'quiet',
    }
  }

  return {
    baseLines: 3,
    showModeLine: true,
    showOnboarding: true,
    showIdleNudge: true,
    showPinchWarm: true,
    showSessionHint: false,
    showRecovery: false,
    showPersist: true,
    density: 'full',
  }
}
