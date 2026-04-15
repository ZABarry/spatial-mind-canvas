import * as THREE from 'three'

const _ctrlOffGrip = new THREE.Matrix4().makeTranslation(0, 0.02, -0.1)
const _ctrlOffRay = new THREE.Matrix4().makeTranslation(0.14, 0.04, -0.12)

/**
 * Mount the global menu board on the left controller: stable offset from grip when available,
 * fallback offset from aim ray (more drift when pointing).
 */
export function multiplyLeftControllerMenuOffset(
  base: THREE.Matrix4,
  hasGripSpace: boolean,
): THREE.Matrix4 {
  return base.multiply(hasGripSpace ? _ctrlOffGrip : _ctrlOffRay)
}

/**
 * Builds the full menu transform from controller grip/target ray pose in reference space.
 */
export function buildLeftControllerGlobalMenuMatrix(
  pose: XRPose,
  hasGripSpace: boolean,
  out: THREE.Matrix4,
): THREE.Matrix4 {
  const t = pose.transform
  const p = new THREE.Vector3(t.position.x, t.position.y, t.position.z)
  const q = new THREE.Quaternion(
    t.orientation.x,
    t.orientation.y,
    t.orientation.z,
    t.orientation.w,
  )
  out.compose(p, q, new THREE.Vector3(1, 1, 1))
  return multiplyLeftControllerMenuOffset(out, hasGripSpace)
}
