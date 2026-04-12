import type { NodeShape } from '../../graph/types'
import { useMemo } from 'react'
import * as THREE from 'three'

/** `s` in {@link useNodeGeometry}; distance from origin to mesh surface along +X / +Y / +Z (axis-aligned bounds). */
export function nodeShapeHalfExtents(shape: NodeShape, size: number): { x: number; y: number; z: number } {
  const s = 0.35 * size
  switch (shape) {
    case 'cube':
      return { x: s * 0.8, y: s * 0.8, z: s * 0.8 }
    case 'capsule':
      return { x: s * 0.7, y: s * 1.3, z: s * 0.7 }
    case 'pill':
      return { x: s * 0.65, y: s * 1.35, z: s * 0.65 }
    case 'tetra':
      return { x: s * 1.4, y: s * 1.4, z: s * 1.4 }
    case 'ring': {
      const R = s * 1.1
      const tube = s * 0.18
      const xz = R + tube
      return { x: xz, y: xz, z: tube }
    }
    case 'diamond':
      return { x: s * 1.2, y: s * 1.2, z: s * 1.2 }
    case 'sphere':
    default:
      return { x: s * 1.2, y: s * 1.2, z: s * 1.2 }
  }
}

export function useNodeGeometry(shape: NodeShape, size: number) {
  return useMemo(() => {
    const s = 0.35 * size
    let g: THREE.BufferGeometry
    switch (shape) {
      case 'cube':
        g = new THREE.BoxGeometry(s * 1.6, s * 1.6, s * 1.6)
        break
      case 'capsule':
        g = new THREE.CapsuleGeometry(s * 0.7, s * 1.2, 6, 12)
        break
      case 'tetra':
        g = new THREE.TetrahedronGeometry(s * 1.4)
        break
      case 'ring':
        g = new THREE.TorusGeometry(s * 1.1, s * 0.18, 12, 48)
        break
      case 'diamond':
        g = new THREE.OctahedronGeometry(s * 1.2)
        break
      case 'pill':
        g = new THREE.CapsuleGeometry(s * 0.65, s * 1.4, 5, 12)
        break
      case 'sphere':
      default:
        g = new THREE.SphereGeometry(s * 1.2, 24, 24)
    }
    return g
  }, [shape, size])
}
