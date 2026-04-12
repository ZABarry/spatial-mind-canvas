import type { Vec3 } from '../utils/math'

/**
 * Semantic hit under a pointer — resolved from scene `userData`, not interpreted in mesh handlers long-term.
 */
export type HitTarget =
  | { kind: 'node'; nodeId: string }
  | { kind: 'node-link-handle'; nodeId: string }
  | { kind: 'edge'; edgeId: string }
  | { kind: 'ground'; point: Vec3 }
  | { kind: 'menu'; menu: 'global' | 'node'; action: string }
  | { kind: 'panel'; panel: 'search' | 'settings' | 'inspector' }
  | { kind: 'none' }

export const noneHit: HitTarget = { kind: 'none' }

/** Build from Three `userData` conventions (see scene meshes). */
export function hitTargetFromUserData(userData: Record<string, unknown> | undefined): HitTarget {
  if (!userData) return noneHit
  const nodeId = userData.nodeId as string | undefined
  if (userData.hitKind === 'node-link-handle' && nodeId) return { kind: 'node-link-handle', nodeId }
  if (nodeId) return { kind: 'node', nodeId }
  const edgeId = userData.edgeId as string | undefined
  if (edgeId) return { kind: 'edge', edgeId }
  return noneHit
}
