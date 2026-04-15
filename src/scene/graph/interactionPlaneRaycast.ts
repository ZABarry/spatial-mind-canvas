import * as THREE from 'three'
import type { Project } from '../../graph/types'
import type { Vec3 } from '../../utils/math'
import { graphPointToWorld } from '../../utils/math'

const _sphere = new THREE.Sphere()
const _target = new THREE.Vector3()

/**
 * True if some node’s bounding sphere lies **farther along the ray** than `minDistance` (the ground
 * hit distance). Used to suppress the interaction ground plane so rays that pass through the floor
 * can still pick nodes below it.
 */
export function hasGraphNodeBeyondDistanceAlongRay(
  ray: THREE.Ray,
  minDistance: number,
  project: Project,
  comfort: Vec3,
): boolean {
  const wt = project.worldTransform
  const scale = wt.scale
  for (const n of Object.values(project.graph.nodes)) {
    const [x, y, z] = graphPointToWorld(wt, n.position, comfort)
    const radius = Math.max(0.05, n.size * scale * 0.72)
    _sphere.center.set(x, y, z)
    _sphere.radius = radius
    if (ray.intersectSphere(_sphere, _target)) {
      const td = ray.origin.distanceTo(_target)
      if (td > minDistance + 1e-4) {
        return true
      }
    }
  }
  return false
}
