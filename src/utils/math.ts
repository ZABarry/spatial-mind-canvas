import * as THREE from 'three'

export type Vec3 = readonly [number, number, number]
export type Vec4 = readonly [number, number, number, number]

export const v3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z]

export const qIdentity = (): Vec4 => [0, 0, 0, 1]

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function vec3Scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}

export function vec3Distance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

const _qA = new THREE.Quaternion()
const _qB = new THREE.Quaternion()
const _qOut = new THREE.Quaternion()

export function quatSlerp(a: Vec4, b: Vec4, t: number): Vec4 {
  _qA.set(a[0], a[1], a[2], a[3])
  _qB.set(b[0], b[1], b[2], b[3])
  _qOut.copy(_qA).slerp(_qB, t)
  return [_qOut.x, _qOut.y, _qOut.z, _qOut.w]
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
