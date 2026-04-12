import type { HitTarget } from './hitTargets'
import type { InteractionSession } from './sessionTypes'

export function linkPreviewTargetFromSession(session: InteractionSession): HitTarget | undefined {
  if (session.kind !== 'link') return undefined
  return session.previewTarget
}

/** True when orbit camera rotation should be disabled (desktop). */
export function sessionDisablesOrbitRotation(session: InteractionSession): boolean {
  return session.kind === 'nodeDrag' || session.kind === 'link'
}

function hitTargetEqual(a: HitTarget | undefined, b: HitTarget | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case 'node':
    case 'node-link-handle':
      return b.kind === a.kind && a.nodeId === (b as { nodeId: string }).nodeId
    case 'edge':
      return b.kind === 'edge' && a.edgeId === b.edgeId
    case 'ground':
      return (
        b.kind === 'ground' &&
        a.point[0] === b.point[0] &&
        a.point[1] === b.point[1] &&
        a.point[2] === b.point[2]
      )
    case 'menu':
      return b.kind === 'menu' && a.menu === b.menu && a.action === b.action
    case 'panel':
      return b.kind === 'panel' && a.panel === b.panel
    case 'none':
      return b.kind === 'none'
    default:
      return false
  }
}

/** Returns next link session only if `previewTarget` changed (avoids store churn). */
export function withLinkPreviewTarget(
  session: InteractionSession,
  target: HitTarget | undefined,
): InteractionSession | null {
  if (session.kind !== 'link') return null
  if (hitTargetEqual(session.previewTarget, target)) return null
  return { ...session, previewTarget: target }
}
