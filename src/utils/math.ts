import * as THREE from 'three'

export type Vec3 = readonly [number, number, number]
export type Vec4 = readonly [number, number, number, number]

/** Matches `WorldTransform` in graph types — kept here to avoid circular imports. */
export type WorldTransformLike = {
  position: Vec3
  quaternion: Vec4
  scale: number
}

const _m = new THREE.Matrix4()
const _inv = new THREE.Matrix4()
const _vec = new THREE.Vector3()
const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _normal = new THREE.Vector3()

/** No extra translation (desktop / non-immersive). */
export const NO_XR_COMFORT: Vec3 = [0, 0, 0]

/**
 * While standing in WebXR, graph data stays near y≈0 (desktop “floor” plane). The headset looks
 * forward, so content at the origin sits outside the vertical FOV (effectively “underfoot”). This
 * world-space offset lifts and pulls the rendered world so the map sits in front at a readable height.
 */
export const XR_STANDING_GRAPH_OFFSET: Vec3 = [0, 1.35, -1.75]

/** Graph-local point → world (same space as `e.point` from R3F events). */
export function graphPointToWorld(
  wt: WorldTransformLike,
  p: Vec3,
  comfort: Vec3 = NO_XR_COMFORT,
): Vec3 {
  _pos.set(
    wt.position[0] + comfort[0],
    wt.position[1] + comfort[1],
    wt.position[2] + comfort[2],
  )
  _quat.set(wt.quaternion[0], wt.quaternion[1], wt.quaternion[2], wt.quaternion[3])
  const s = wt.scale
  _scale.set(s, s, s)
  _m.compose(_pos, _quat, _scale)
  _vec.set(p[0], p[1], p[2]).applyMatrix4(_m)
  return [_vec.x, _vec.y, _vec.z]
}

/** World-space point → graph-local (under world root). */
export function worldPointToGraphLocal(
  wt: WorldTransformLike,
  w: Vec3,
  comfort: Vec3 = NO_XR_COMFORT,
): Vec3 {
  _pos.set(
    wt.position[0] + comfort[0],
    wt.position[1] + comfort[1],
    wt.position[2] + comfort[2],
  )
  _quat.set(wt.quaternion[0], wt.quaternion[1], wt.quaternion[2], wt.quaternion[3])
  const s = wt.scale
  _scale.set(s, s, s)
  _m.compose(_pos, _quat, _scale)
  _inv.copy(_m).invert()
  _vec.set(w[0], w[1], w[2]).applyMatrix4(_inv)
  return [_vec.x, _vec.y, _vec.z]
}

/** Unit +Y in graph space, expressed as a world-space normal (for drag / hit planes). */
export function graphUpNormalWorld(wt: WorldTransformLike): THREE.Vector3 {
  _quat.set(wt.quaternion[0], wt.quaternion[1], wt.quaternion[2], wt.quaternion[3])
  return _normal.set(0, 1, 0).applyQuaternion(_quat).normalize()
}

/** Graph-local axis unit (0=x, 1=y, 2=z) rotated to parent/scene space — direction only, not scaled. */
export function graphAxisDirectionParent(wt: WorldTransformLike, axis: 0 | 1 | 2): THREE.Vector3 {
  _quat.set(wt.quaternion[0], wt.quaternion[1], wt.quaternion[2], wt.quaternion[3])
  const ax = axis === 0 ? 1 : 0
  const ay = axis === 1 ? 1 : 0
  const az = axis === 2 ? 1 : 0
  return _vec.set(ax, ay, az).applyQuaternion(_quat).normalize()
}

/**
 * Small displacement in graph-local coordinates → delta for `worldTransform.position` (parent space),
 * respecting rotation and uniform scale of the world root.
 */
export function graphLocalDeltaToParentPositionDelta(wt: WorldTransformLike, localDelta: Vec3): Vec3 {
  const s = wt.scale
  _quat.set(wt.quaternion[0], wt.quaternion[1], wt.quaternion[2], wt.quaternion[3])
  _vec.set(localDelta[0] * s, localDelta[1] * s, localDelta[2] * s)
  _vec.applyQuaternion(_quat)
  return [_vec.x, _vec.y, _vec.z]
}

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
