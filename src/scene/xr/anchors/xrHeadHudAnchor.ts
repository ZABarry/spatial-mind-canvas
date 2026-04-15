import * as THREE from 'three'

/** Meters: informational HUD ribbon distance (aligned with XrStatusHud). */
export const XR_HEAD_HUD_DISTANCE = 1.35
/** Slight vertical bias below eye line for readable text. */
export const XR_HEAD_HUD_VERTICAL_BIAS = -0.22

const _dir = new THREE.Vector3()
const _up = new THREE.Vector3()

/**
 * Places a group in front of the camera for head-anchored informational UI.
 * Matches {@link XrStatusHud} framing so HUD layers stay coherent.
 */
export function applyHeadHudAnchor(group: THREE.Object3D, camera: THREE.Camera): void {
  camera.getWorldDirection(_dir)
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
  group.position.copy(camera.position)
  group.position.addScaledVector(_dir, XR_HEAD_HUD_DISTANCE)
  group.position.addScaledVector(_up, XR_HEAD_HUD_VERTICAL_BIAS)
}
