import type { NodeShape } from '../../graph/types'
import { useMemo } from 'react'
import * as THREE from 'three'

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
