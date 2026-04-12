/**
 * High-level interaction phases for Spatial Mind Canvas.
 * These are derived from store fields — use to reason about mutually exclusive UX (desktop vs XR vs hands).
 *
 * Rules of thumb:
 * - `modalConfirm` blocks graph edits until dismissed.
 * - `drawingEdge` takes precedence over `draggingNode` for the same pointer when a connection draft exists.
 * - `nodeDetail` is an overlay: driven by `detailNodeId`, not navigation mode.
 */
import type { InteractionMode } from '../graph/types'
import type { InteractionSession } from './sessionTypes'

export type InteractionPhase =
  | 'idle'
  | 'hovering'
  | 'placingNode'
  | 'draggingNode'
  | 'drawingEdge'
  | 'grabbingWorld'
  | 'nodeDetail'
  | 'travel'
  | 'modalConfirm'
  | 'searchPalette'

export function getInteractionPhase(s: {
  confirmDialog: unknown
  searchOpen: boolean
  detailNodeId: string | null
  connectionDraft: unknown
  placementPreview: unknown
  interactionMode: InteractionMode
  hover: { nodeId?: string; edgeId?: string }
  interactionSession: InteractionSession
  nodeDragActive: boolean
}): InteractionPhase {
  if (s.confirmDialog) return 'modalConfirm'
  if (s.searchOpen) return 'searchPalette'
  if (s.detailNodeId) return 'nodeDetail'
  if (s.interactionSession.kind === 'worldGrab') return 'grabbingWorld'
  if (s.connectionDraft || s.interactionSession.kind === 'link') return 'drawingEdge'
  if (s.placementPreview) return 'placingNode'
  if (s.interactionSession.kind === 'nodeDrag' || s.nodeDragActive) return 'draggingNode'
  if (s.interactionMode === 'travel') return 'travel'
  if (s.hover.nodeId || s.hover.edgeId) return 'hovering'
  return 'idle'
}
