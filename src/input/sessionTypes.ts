import type { WorldTransform } from '../graph/types'
import type { Vec3 } from '../utils/math'
import type { HitTarget } from './hitTargets'

/**
 * Multi-step interactions — all gestures that span press/move/release should map here.
 */
export type InteractionSession =
  | { kind: 'idle' }
  | { kind: 'nodeDrag'; pointerId: string; nodeId: string; start: Vec3; current: Vec3 }
  | { kind: 'link'; pointerId: string; fromNodeId: string; previewTarget?: HitTarget }
  | { kind: 'worldGrab'; pointerIds: string[]; startWorld: WorldTransform }
  | { kind: 'menu'; menu: 'global' | 'node' }

export const idleSession: InteractionSession = { kind: 'idle' }
