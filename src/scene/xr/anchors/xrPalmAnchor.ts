import * as THREE from 'three'

const _wristOffset = new THREE.Matrix4().makeTranslation(0, 0.09, -0.07)

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
