import type { NavigationMode } from '../tools'
import type { InteractionSession } from '../sessionTypes'

/**
 * Minimal snapshot for XR policy (avoids importing the full RootState graph).
 */
export type WorldGrabGuardState = {
  navigationMode: NavigationMode
  interactionSession: InteractionSession
  searchOpen: boolean
  detailNodeId: string | null
  settingsOpen: boolean
  confirmDialog: unknown
  textPromptDialog: unknown
  xrHelpOpen: boolean
  placementPreview: unknown
}

/**
 * World grab may only start in world navigation mode with no other live gesture
 * and no blocking UI (matches conservative accidental-grab prevention).
 */
export function canBeginWorldGrab(s: WorldGrabGuardState): boolean {
  if (s.navigationMode !== 'world') return false
  if (s.interactionSession.kind !== 'idle') return false
  if (s.searchOpen) return false
  if (s.detailNodeId) return false
  if (s.settingsOpen) return false
  if (s.confirmDialog) return false
  if (s.textPromptDialog) return false
  if (s.xrHelpOpen) return false
  if (s.placementPreview) return false
  return true
}

/**
 * Skip aiming the graph with the controller when flat/HTML XR UI has focus.
 */
export function shouldIgnoreXrGraphSelect(s: WorldGrabGuardState): boolean {
  if (s.searchOpen) return true
  if (s.detailNodeId) return true
  if (s.settingsOpen) return true
  if (s.confirmDialog) return true
  if (s.textPromptDialog) return true
  if (s.xrHelpOpen) return true
  return false
}
