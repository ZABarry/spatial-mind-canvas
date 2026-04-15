import * as THREE from 'three'

/**
 * World-space anchor for moving/scaling the graph: controller grip when present,
 * else wrist joint for hand-only pinch grab.
 */
export function getGrabAnchorWorld(
  frame: XRFrame,
  refSpace: XRReferenceSpace,
  src: XRInputSource,
  out: THREE.Vector3,
): boolean {
  if (src.gripSpace) {
    const pose = frame.getPose(src.gripSpace, refSpace)
    if (!pose) return false
    const p = pose.transform.position
    out.set(p.x, p.y, p.z)
    return true
  }
  if (src.hand) {
    const wrist = src.hand.get('wrist')
    if (!wrist || !frame.getJointPose) return false
    const jp = frame.getJointPose.call(frame, wrist, refSpace)
    if (!jp) return false
    const p = jp.transform.position
    out.set(p.x, p.y, p.z)
    return true
  }
  return false
}
