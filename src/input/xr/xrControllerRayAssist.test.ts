import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  applyStickyTargetPreference,
  mergeIntersectionsByClosestObject,
} from './xrControllerRayAssist'

function ix(mesh: THREE.Mesh, distance: number): THREE.Intersection {
  return {
    object: mesh,
    distance,
    point: new THREE.Vector3(),
  } as THREE.Intersection
}

describe('mergeIntersectionsByClosestObject', () => {
  it('keeps the nearest hit per object', () => {
    const o = new THREE.Mesh()
    const a = ix(o, 2)
    const b = ix(o, 1.5)
    const m = mergeIntersectionsByClosestObject([a, b])
    expect(m).toHaveLength(1)
    expect(m[0]!.distance).toBe(1.5)
  })

  it('sorts by distance across objects', () => {
    const o1 = new THREE.Mesh()
    const o2 = new THREE.Mesh()
    const hits = [ix(o2, 3), ix(o1, 1)]
    const m = mergeIntersectionsByClosestObject(hits)
    expect(m[0]!.object).toBe(o1)
    expect(m[1]!.object).toBe(o2)
  })
})

describe('applyStickyTargetPreference', () => {
  it('promotes sticky hit when within slack of the front hit', () => {
    const stickyObj = new THREE.Mesh()
    const other = new THREE.Mesh()
    const hits = [ix(other, 1.0), ix(stickyObj, 1.03)]
    const out = applyStickyTargetPreference(hits, { object: stickyObj, distance: 1.03 }, 0.05)
    expect(out[0]!.object).toBe(stickyObj)
  })

  it('leaves order when sticky is far behind', () => {
    const stickyObj = new THREE.Mesh()
    const other = new THREE.Mesh()
    const hits = [ix(other, 1.0), ix(stickyObj, 1.2)]
    const out = applyStickyTargetPreference(hits, { object: stickyObj, distance: 1.2 }, 0.05)
    expect(out[0]!.object).toBe(other)
  })
})
