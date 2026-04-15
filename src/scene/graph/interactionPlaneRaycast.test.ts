import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createBlankProject } from '../../graph/defaults'
import { addNode, createNodeDefaults } from '../../graph/mutations'
import { v3, NO_XR_COMFORT } from '../../utils/math'
import { hasGraphNodeBeyondDistanceAlongRay } from './interactionPlaneRaycast'

describe('hasGraphNodeBeyondDistanceAlongRay', () => {
  it('is true when a node lies farther along the ray than the given distance (below-floor case)', () => {
    let p = createBlankProject()
    p = { ...p, graph: addNode(p.graph, { ...createNodeDefaults(v3(0, -1.2, 0)), size: 0.5 }).graph }
    const ray = new THREE.Ray(new THREE.Vector3(0, 8, 0), new THREE.Vector3(0, -1, 0).normalize())
    const groundDist = 7.5
    expect(hasGraphNodeBeyondDistanceAlongRay(ray, groundDist, p, NO_XR_COMFORT)).toBe(true)
  })

  it('is false when all nodes are closer than the given distance along the ray', () => {
    let p = createBlankProject()
    p = { ...p, graph: addNode(p.graph, { ...createNodeDefaults(v3(0, 4, 0)), size: 0.3 }).graph }
    const ray = new THREE.Ray(new THREE.Vector3(0, 8, 0), new THREE.Vector3(0, -1, 0).normalize())
    const groundDist = 7.5
    expect(hasGraphNodeBeyondDistanceAlongRay(ray, groundDist, p, NO_XR_COMFORT)).toBe(false)
  })
})
