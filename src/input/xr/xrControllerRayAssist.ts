import * as THREE from 'three'

/**
 * Lateral offset (m) for parallel assist rays — widens effective targeting without changing aim.
 */
export const XR_ASSIST_LATERAL_OFFSET_M = 0.014

/** Extra distance allowed before dropping sticky preference — slightly forgiving for jitter. */
export const XR_STICKY_TARGET_SLACK_M = 0.048

const _raycaster = new THREE.Raycaster()

function orthonormalBasis(direction: THREE.Vector3): { right: THREE.Vector3; up: THREE.Vector3 } {
  const d = direction.clone().normalize()
  const aux = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const right = new THREE.Vector3().crossVectors(aux, d).normalize()
  const up = new THREE.Vector3().crossVectors(d, right).normalize()
  return { right, up }
}

/**
 * Keep the closest intersection per object (same mesh may be hit by multiple assist rays).
 */
export function mergeIntersectionsByClosestObject(hits: THREE.Intersection[]): THREE.Intersection[] {
  const byUuid = new Map<string, THREE.Intersection>()
  for (const h of hits) {
    const prev = byUuid.get(h.object.uuid)
    if (!prev || h.distance < prev.distance) byUuid.set(h.object.uuid, h)
  }
  return [...byUuid.values()].sort((a, b) => a.distance - b.distance)
}

/**
 * Cast the central ray plus four parallel offsets in the view plane for more forgiving hits.
 */
export function intersectObjectsWithRayAssist(
  sceneRoot: THREE.Object3D,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  near: number,
  far: number,
): THREE.Intersection[] {
  const dir = direction.clone().normalize()
  const { right, up } = orthonormalBasis(dir)
  const s = XR_ASSIST_LATERAL_OFFSET_M
  const origins = [
    origin,
    origin.clone().add(right.clone().multiplyScalar(s)),
    origin.clone().add(right.clone().multiplyScalar(-s)),
    origin.clone().add(up.clone().multiplyScalar(s * 0.88)),
    origin.clone().add(up.clone().multiplyScalar(-s * 0.88)),
  ]
  const all: THREE.Intersection[] = []
  _raycaster.near = near
  _raycaster.far = far
  for (const o of origins) {
    _raycaster.set(o, dir)
    all.push(..._raycaster.intersectObjects(sceneRoot.children, true))
  }
  return mergeIntersectionsByClosestObject(all)
}

export type XrStickyTarget = {
  object: THREE.Object3D
  distance: number
}

/**
 * If the ray wanders slightly, prefer the previous target when it is still hit and nearly as close
 * as the best candidate (reduces flicker between adjacent nodes).
 */
export function applyStickyTargetPreference(
  hits: THREE.Intersection[],
  sticky: XrStickyTarget | null,
  distanceSlackM: number,
): THREE.Intersection[] {
  if (hits.length === 0 || sticky == null) return hits
  let bestIdx = -1
  let bestDist = Infinity
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]!
    let o: THREE.Object3D | null = h.object
    while (o) {
      if (o === sticky.object) {
        const d = h.distance
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
        break
      }
      o = o.parent
    }
  }
  if (bestIdx < 0) return hits
  const stickyHit = hits[bestIdx]!
  const front = hits[0]!
  if (stickyHit.object === front.object && stickyHit.distance === front.distance) return hits
  if (stickyHit.distance <= front.distance + distanceSlackM) {
    const next = [stickyHit, ...hits.filter((_, j) => j !== bestIdx)]
    return next
  }
  return hits
}
