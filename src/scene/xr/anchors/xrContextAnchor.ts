import * as THREE from 'three'

const _toUser = new THREE.Vector3()

/**
 * Contextual node action strip ({@link XrNodeContextActions}): offset from node center toward the user.
 * Calm, readable zone — not a tight ring around the node.
 */
export function computeContextualActionOffset(
  nodePosition: THREE.Vector3,
  headPosition: THREE.Vector3,
  nodeSize: number,
  out: THREE.Vector3,
): void {
  _toUser.subVectors(headPosition, nodePosition)
  if (_toUser.lengthSq() < 1e-8) {
    out.set(0, 0.28 + nodeSize * 0.35, 0.52)
    return
  }
  _toUser.normalize()
  out.copy(_toUser).multiplyScalar(0.48 + nodeSize * 0.08)
  out.y += 0.14 + nodeSize * 0.22
}
