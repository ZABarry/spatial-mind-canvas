import * as THREE from 'three'

/**
 * Offset from wrist joint (meters, wrist local space): lift toward fingers and push
 * **forward** so the board floats in open space in front of the hand, not on the tracker.
 */
const _wristOffset = new THREE.Matrix4().makeTranslation(0, 0.11, -0.2)

/**
 * Palm-open global menu: offset from wrist joint so the board sits above the palm,
 * readable when the palm faces the user.
 */
export function multiplyPalmMenuOffsetFromWrist(base: THREE.Matrix4): THREE.Matrix4 {
  return base.multiply(_wristOffset)
}

export function composeWristPoseMatrix(
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  out: THREE.Matrix4,
): THREE.Matrix4 {
  out.compose(position, quaternion, new THREE.Vector3(1, 1, 1))
  return multiplyPalmMenuOffsetFromWrist(out)
}
