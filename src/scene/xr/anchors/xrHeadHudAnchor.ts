import * as THREE from 'three'

/**
 * Camera-local **−Z** offset magnitude (meters): how far **in front** of the headset the HUD sits
 * (Three.js camera looks down −Z).
 */
export const XR_HEAD_HUD_DISTANCE = 1.35

/**
 * Camera-local **+Y** offset (meters): pushes the ribbon toward the **top** of the field of view.
 * Uses the headset’s axes (not world Y) so the HUD stays pinned when you tilt or roll.
 */
export const XR_HEAD_HUD_LOCAL_Y = 0.34

/** @deprecated Renamed to {@link XR_HEAD_HUD_LOCAL_Y} — kept for any external references. */
export const XR_HEAD_HUD_VERTICAL_BIAS = XR_HEAD_HUD_LOCAL_Y

const _local = new THREE.Vector3()

/**
 * Pins `group` to the headset like a visor-mounted layer: same **orientation** as the camera
 * and an offset in **camera space** (−Z = forward into the scene, +Y = up in the view).
 */
export function applyHeadHudAnchor(group: THREE.Object3D, camera: THREE.Camera): void {
  _local.set(0, XR_HEAD_HUD_LOCAL_Y, -XR_HEAD_HUD_DISTANCE)
  _local.applyQuaternion(camera.quaternion)
  group.position.copy(camera.position).add(_local)
  group.quaternion.copy(camera.quaternion)
}
