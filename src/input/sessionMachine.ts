import type { EdgeStyle, Project } from '../graph/types'
import type { Vec3 } from '../utils/math'
import type { HitTarget } from './hitTargets'
import { idleSession, type InteractionSession } from './sessionTypes'

type ConnectionDraftLike = {
  fromNodeId: string
  style: EdgeStyle
  pathPoints: Vec3[]
  xrControllerIndex?: number
} | null

/**
 * Phase 1: derive session from existing store fields so behavior stays stable while scaffolding lands.
 */
export function deriveInteractionSession(input: {
  connectionDraft: ConnectionDraftLike
  nodeDragActive: boolean
  /** Primary node id while dragging (approximation from selection). */
  nodeDragNodeId: string | null
  /** Snapshot taken at XR world-grab start; non-null while grab in progress. */
  worldGrabBefore: Project | null
  projectNodePosition: (nodeId: string) => Vec3 | undefined
}): InteractionSession {
  const { connectionDraft, nodeDragActive, nodeDragNodeId, worldGrabBefore, projectNodePosition } = input

  if (worldGrabBefore) {
    return {
      kind: 'worldGrab',
      pointerIds: [],
      startWorld: { ...worldGrabBefore.worldTransform },
    }
  }

  if (connectionDraft) {
    const pointerId =
      connectionDraft.xrControllerIndex !== undefined
        ? `xr-controller-${connectionDraft.xrControllerIndex}`
        : 'mouse'
    return {
      kind: 'link',
      pointerId,
      fromNodeId: connectionDraft.fromNodeId,
      path: connectionDraft.pathPoints,
    }
  }

  if (nodeDragActive && nodeDragNodeId) {
    const pos = projectNodePosition(nodeDragNodeId)
    const p = pos ?? ([0, 0, 0] as Vec3)
    return {
      kind: 'nodeDrag',
      pointerId: 'primary',
      nodeId: nodeDragNodeId,
      start: p,
      current: p,
    }
  }

  return idleSession
}

export function linkPreviewTargetFromSession(session: InteractionSession): HitTarget | undefined {
  if (session.kind !== 'link') return undefined
  return session.previewTarget
}
