/**
 * Index–thumb pinch for hand-primary world grab (Quest hand tracking).
 * Tight thresholds + hysteresis reduce accidental grabs while pinching UI.
 */
export const PINCH_GRASP_CLOSE_M = 0.036
export const PINCH_GRASP_OPEN_M = 0.052

export type PinchGraspHysteresis = {
  pinched: boolean
}

export function pinchTipDistanceM(
  frame: XRFrame,
  refSpace: XRReferenceSpace,
  hand: XRHand,
): number | null {
  const idx = hand.get('index-finger-tip')
  const th = hand.get('thumb-tip')
  if (!idx || !th) return null
  const getJointPose = frame.getJointPose
  if (!getJointPose) return null
  const a = getJointPose.call(frame, idx, refSpace)
  const b = getJointPose.call(frame, th, refSpace)
  if (!a || !b) return null
  const ax = a.transform.position.x - b.transform.position.x
  const ay = a.transform.position.y - b.transform.position.y
  const az = a.transform.position.z - b.transform.position.z
  return Math.sqrt(ax * ax + ay * ay + az * az)
}

export function updatePinchGraspActive(
  distM: number | null,
  h: PinchGraspHysteresis,
): boolean {
  if (distM == null) {
    h.pinched = false
    return false
  }
  if (!h.pinched && distM <= PINCH_GRASP_CLOSE_M) h.pinched = true
  else if (h.pinched && distM >= PINCH_GRASP_OPEN_M) h.pinched = false
  return h.pinched
}
