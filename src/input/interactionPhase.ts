/**
 * High-level interaction phases for Spatial Mind Canvas.
 * These are derived from store fields — use to reason about mutually exclusive UX (desktop vs XR vs hands).
 *
 * Rules of thumb:
 * - `modalConfirm` blocks graph edits until dismissed.
 * - `drawingEdge` takes precedence over `draggingNode` for the same pointer when a connection draft exists.
 * - `nodeDetail` is an overlay mode: prefer canceling drafts before opening detail in new flows.
 */
import type { InteractionMode } from '../graph/types'

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
}): InteractionPhase {
  if (s.confirmDialog) return 'modalConfirm'
  if (s.searchOpen) return 'searchPalette'
  if (s.detailNodeId) return 'nodeDetail'
  if (s.connectionDraft) return 'drawingEdge'
  if (s.placementPreview) return 'placingNode'
  if (s.interactionMode === 'travel') return 'travel'
  if (s.hover.nodeId || s.hover.edgeId) return 'hovering'
  return 'idle'
}
