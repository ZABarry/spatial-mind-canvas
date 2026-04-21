import * as THREE from 'three'
import type { XrPanelLane } from './xrPanelSpawner'

/** Which floating Html panels are currently open (lanes may overlap e.g. search + detail). */
export type XrPanelLayoutSnapshot = {
  detailOpen: boolean
  searchOrHistoryOpen: boolean
  settingsOpen: boolean
  bookmarksOpen: boolean
}

export function activeLanesFromSnapshot(s: XrPanelLayoutSnapshot): XrPanelLane[] {
  const lanes: XrPanelLane[] = []
  if (s.detailOpen) lanes.push('left')
  if (s.searchOrHistoryOpen) lanes.push('center')
  if (s.settingsOpen) lanes.push('nearRight')
  if (s.bookmarksOpen) lanes.push('right')
  return lanes
}

const _up = new THREE.Vector3()
const _right = new THREE.Vector3()

/**
 * When multiple panels are open, nudge along camera up/right so stacks feel intentional (meters).
 */
export function applyPanelClusterNudge(
  lane: XrPanelLane,
  active: XrPanelLane[],
  camera: THREE.Camera,
  position: THREE.Vector3,
): void {
  if (active.length < 2) return

  _right.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize()
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize()

  const set = new Set(active)
  const has = (l: XrPanelLane) => set.has(l)

  let y = 0
  let x = 0

  if (has('left') && has('center')) {
    if (lane === 'left') y += 0.045
    if (lane === 'center') y -= 0.055
  }
  if (has('center') && has('nearRight')) {
    if (lane === 'center') x -= 0.035
    if (lane === 'nearRight') x += 0.035
  }
  if (has('nearRight') && has('right')) {
    if (lane === 'nearRight') y += 0.04
    if (lane === 'right') y -= 0.05
  }
  if (active.length >= 3) {
    if (lane === 'left') y += 0.02
    if (lane === 'right') y -= 0.02
  }

  position.addScaledVector(_up, y)
  position.addScaledVector(_right, x)
}
