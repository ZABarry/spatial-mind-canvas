import * as THREE from 'three'

/**
 * WebXR controller indices are connection order, not left/right.
 * Map a world-space ray origin (from the pointer event that hit the mesh) to the nearest controller.
 */
export function xrPointerIdFromControllerIndex(index: number): string {
  return `xr-controller-${index}`
}

export function xrControllerIndexFromPointerId(pointerId: string): number | null {
  const m = /^xr-controller-(\d+)$/.exec(pointerId)
  return m ? parseInt(m[1]!, 10) : null
}

export function xrControllerIndexFromRayOrigin(gl: THREE.WebGLRenderer, rayOrigin: THREE.Vector3): number {
  const v = new THREE.Vector3()
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < 8; i++) {
    const c = gl.xr.getController(i)
    c.updateMatrixWorld()
    c.getWorldPosition(v)
    const d = v.distanceToSquared(rayOrigin)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
}
