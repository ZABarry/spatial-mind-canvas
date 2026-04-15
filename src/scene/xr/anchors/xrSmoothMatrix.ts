import * as THREE from 'three'

const _p = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _p2 = new THREE.Vector3()
const _q2 = new THREE.Quaternion()
const _s2 = new THREE.Vector3()

/**
 * Exponential damping for rigid transforms (position + rotation; uniform scale preserved).
 * Reduces controller micro-jitter on the global menu without heavy lag.
 */
export function dampMatrix4SE3(
  current: THREE.Matrix4,
  target: THREE.Matrix4,
  lambda: number,
  delta: number,
): void {
  const t = 1 - Math.exp(-lambda * delta)
  current.decompose(_p, _q, _s)
  target.decompose(_p2, _q2, _s2)
  _p.lerp(_p2, t)
  _q.slerp(_q2, t)
  current.compose(_p, _q, _s)
}
