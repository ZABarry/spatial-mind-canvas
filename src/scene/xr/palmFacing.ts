import * as THREE from 'three'

/**
 * Palm “open” thresholds — tune on Quest Browser if the menu is hard to trigger or flickers.
 * Raise OPEN / CLOSE together if the panel appears too often; lower if it rarely appears.
 */
/** Palm normal · direction-to-head above this → transition to visible (hysteresis open). */
export const PALM_FACE_OPEN_THRESHOLD = 0.42
/** Below this → transition to hidden (hysteresis close). */
export const PALM_FACE_CLOSE_THRESHOLD = 0.26

export type PalmFacingHysteresis = {
  visible: boolean
}

/**
 * True when the left palm plane faces the viewer (head). Uses wrist + metacarpal joints
 * to build a stable palm normal; axis handedness can vary by runtime — tune thresholds above on device.
 */
export function palmFacingHeadScore(
  frame: XRFrame,
  refSpace: XRReferenceSpace,
  hand: XRHand,
): number | null {
  const wristSpace = hand.get('wrist')
  const midSpace = hand.get('middle-finger-metacarpal')
  const indexSpace = hand.get('index-finger-metacarpal')
  if (!wristSpace || !midSpace || !indexSpace) return null

  const getJointPose = frame.getJointPose
  if (!getJointPose) return null
  const wristPose = getJointPose.call(frame, wristSpace, refSpace)
  const midPose = getJointPose.call(frame, midSpace, refSpace)
  const indexPose = getJointPose.call(frame, indexSpace, refSpace)
  if (!wristPose || !midPose || !indexPose) return null

  const wp = wristPose.transform.position
  const mp = midPose.transform.position
  const ip = indexPose.transform.position
  const wrist = new THREE.Vector3(wp.x, wp.y, wp.z)

  const toMid = new THREE.Vector3(mp.x - wp.x, mp.y - wp.y, mp.z - wp.z)
  const toIndex = new THREE.Vector3(ip.x - wp.x, ip.y - wp.y, ip.z - wp.z)
  if (toMid.lengthSq() < 1e-8 || toIndex.lengthSq() < 1e-8) return null

  const palmNormal = new THREE.Vector3().crossVectors(toMid, toIndex).normalize()
  if (palmNormal.lengthSq() < 1e-8) return null

  const vp = frame.getViewerPose(refSpace)
  if (!vp) return null
  const hp = vp.transform.position
  const head = new THREE.Vector3(hp.x, hp.y, hp.z)
  const toHead = new THREE.Vector3().subVectors(head, wrist).normalize()
  if (toHead.lengthSq() < 1e-8) return null

  if (palmNormal.dot(toHead) < 0) palmNormal.negate()
  return Math.max(0, Math.min(1, palmNormal.dot(toHead)))
}

export function updatePalmMenuVisibility(
  score: number | null,
  hysteresis: PalmFacingHysteresis,
): boolean {
  if (score == null) {
    hysteresis.visible = false
    return false
  }
  if (!hysteresis.visible && score >= PALM_FACE_OPEN_THRESHOLD) hysteresis.visible = true
  else if (hysteresis.visible && score <= PALM_FACE_CLOSE_THRESHOLD) hysteresis.visible = false
  return hysteresis.visible
}
