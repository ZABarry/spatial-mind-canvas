import * as THREE from 'three'

/**
 * World-space interactive panels (Html): comfortable Quest distance, head-relative with
 * **soft damping** so panels feel spatial rather than rigidly camera-glued.
 * Units: meters. Lateral offsets separate panels into visual lanes (left / center / right family).
 */
export const XR_PANEL_HEAD_DISTANCE = 1.32
/** Half-width between strong left vs strong right lanes (~0.4m). */
export const XR_PANEL_LANE_STRIDE = 0.42
/** Between center and full right (e.g. Settings vs Bookmarks). */
export const XR_PANEL_LANE_NEAR_RIGHT = 0.24

/** Exponential damping for panel follow (higher = snappier; lower = more world-stable). */
export const XR_PANEL_FOLLOW_LAMBDA = 7.2

export type XrPanelLane = 'left' | 'center' | 'nearRight' | 'right'

export type PanelLanePoseOptions = {
  distance: number
  verticalBias: number
}

/**
 * Per-lane tuning: distance / vertical bias so stacked panels don’t visually collide and
 * primary surfaces sit at comfortable heights.
 */
export function panelLanePoseOptions(lane: XrPanelLane): PanelLanePoseOptions {
  switch (lane) {
    case 'left':
      return { distance: 1.28, verticalBias: -0.07 }
    case 'center':
      return { distance: 1.34, verticalBias: -0.11 }
    case 'nearRight':
      return { distance: 1.3, verticalBias: -0.09 }
    case 'right':
      return { distance: 1.36, verticalBias: -0.13 }
    default:
      return { distance: XR_PANEL_HEAD_DISTANCE, verticalBias: -0.12 }
  }
}

/**
 * Lanes (policy — see XrHeadAnchoredGroup):
 * - Node detail: left
 * - Search / map history: center (mutually exclusive in practice)
 * - Settings: nearRight
 * - Bookmarks: right
 */
export function lateralOffsetForLane(lane: XrPanelLane): number {
  switch (lane) {
    case 'left':
      return -XR_PANEL_LANE_STRIDE
    case 'center':
      return 0
    case 'nearRight':
      return XR_PANEL_LANE_NEAR_RIGHT
    case 'right':
      return XR_PANEL_LANE_STRIDE
    default:
      return 0
  }
}

const _forward = new THREE.Vector3()
const _up = new THREE.Vector3()
const _right = new THREE.Vector3()
const _pos = new THREE.Vector3()

/**
 * Pose for a head-relative panel: in front of the user, facing them, with lateral lane offset.
 * Mutates `position` and `quaternion` out-params only.
 */
export function computeHeadAnchoredPanelPose(
  camera: THREE.Camera,
  lane: XrPanelLane,
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  opts?: PanelLanePoseOptions,
): void {
  const o = opts ?? panelLanePoseOptions(lane)
  const distance = o.distance
  const verticalBias = o.verticalBias

  camera.getWorldDirection(_forward)
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize()
  _right.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize()

  const lateral = lateralOffsetForLane(lane)
  _pos.copy(camera.position)
  _pos.addScaledVector(_forward, distance)
  _pos.addScaledVector(_up, verticalBias)
  _pos.addScaledVector(_right, lateral)

  position.copy(_pos)
  quaternion.copy(camera.quaternion)
}

/**
 * Exponential damping toward the target head-anchored pose (reduces jitter vs per-frame snap).
 */
export function dampPanelAnchorPose(
  currentPos: THREE.Vector3,
  currentQuat: THREE.Quaternion,
  targetPos: THREE.Vector3,
  targetQuat: THREE.Quaternion,
  lambda: number,
  delta: number,
): void {
  const t = 1 - Math.exp(-lambda * delta)
  currentPos.lerp(targetPos, t)
  currentQuat.slerp(targetQuat, t)
  currentQuat.normalize()
}
