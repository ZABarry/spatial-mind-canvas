import * as THREE from 'three'

/**
 * World-space interactive panels (Html): comfortable Quest distance, head-relative each frame.
 * Units: meters. Lateral offsets separate panels into visual lanes (left / center / right family).
 */
export const XR_PANEL_HEAD_DISTANCE = 1.32
/** Half-width between strong left vs strong right lanes (~0.4m). */
export const XR_PANEL_LANE_STRIDE = 0.42
/** Between center and full right (e.g. Settings vs Bookmarks). */
export const XR_PANEL_LANE_NEAR_RIGHT = 0.24

export type XrPanelLane = 'left' | 'center' | 'nearRight' | 'right'

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
  opts?: { distance?: number; verticalBias?: number },
): void {
  const distance = opts?.distance ?? XR_PANEL_HEAD_DISTANCE
  const verticalBias = opts?.verticalBias ?? -0.12

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
