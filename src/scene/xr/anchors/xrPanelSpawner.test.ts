import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  computeHeadAnchoredPanelPose,
  dampPanelAnchorPose,
  lateralOffsetForLane,
  XR_PANEL_LANE_STRIDE,
} from './xrPanelSpawner'

describe('lateralOffsetForLane', () => {
  it('maps lanes to signed lateral meters', () => {
    expect(lateralOffsetForLane('left')).toBe(-XR_PANEL_LANE_STRIDE)
    expect(lateralOffsetForLane('center')).toBe(0)
    expect(lateralOffsetForLane('right')).toBe(XR_PANEL_LANE_STRIDE)
    expect(lateralOffsetForLane('nearRight')).toBeGreaterThan(0)
    expect(lateralOffsetForLane('nearRight')).toBeLessThan(XR_PANEL_LANE_STRIDE)
  })
})

describe('computeHeadAnchoredPanelPose', () => {
  it('separates left vs right panel positions', () => {
    const cam = new THREE.PerspectiveCamera(50, 1, 0.01, 100)
    cam.position.set(0, 1.6, 0.2)
    cam.lookAt(0, 1.5, -2)
    cam.updateMatrixWorld()

    const pl = new THREE.Vector3()
    const ql = new THREE.Quaternion()
    const pr = new THREE.Vector3()
    const qr = new THREE.Quaternion()
    computeHeadAnchoredPanelPose(cam, 'left', pl, ql)
    computeHeadAnchoredPanelPose(cam, 'right', pr, qr)

    expect(pl.distanceTo(pr)).toBeGreaterThan(0.5)
  })
})

describe('dampPanelAnchorPose', () => {
  it('moves current toward target over time', () => {
    const curP = new THREE.Vector3(0, 0, 0)
    const curQ = new THREE.Quaternion()
    const tgtP = new THREE.Vector3(1, 0, 0)
    const tgtQ = new THREE.Quaternion()
    dampPanelAnchorPose(curP, curQ, tgtP, tgtQ, 10, 0.1)
    expect(curP.x).toBeGreaterThan(0)
    expect(curP.x).toBeLessThan(1)
  })
})
