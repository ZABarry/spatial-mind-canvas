import * as THREE from 'three'

/**
 * Palm “open” thresholds — conservative: harder to open accidentally than pre-rebuild.
 * Tune on Quest if the menu is stubborn or still flickers.
 */
/** Combined score above this → arm dwell toward visible. */
export const PALM_FACE_OPEN_THRESHOLD = 0.32
/** Below this → transition to hidden (hysteresis close). */
export const PALM_FACE_CLOSE_THRESHOLD = 0.18
/** Consecutive frames above OPEN threshold before showing menu (reduces wrist-noise triggers). */
export const PALM_FACE_OPEN_DWELL_FRAMES = 5

export type PalmFacingHysteresis = {
  visible: boolean
  /** Frames in a row with score >= PALM_FACE_OPEN_THRESHOLD while not yet visible. */
  openStreak: number
}

const tmpQ = new THREE.Quaternion()
const tmpHeadUp = new THREE.Vector3()

/**
 * Palmar outward normal (out of the skin), without flipping toward the head — flipping hid
 * dorsal vs palmar and let a wrist tilt look like “palm toward eyes”.
 *
 * Uses index & pinky metacarpals with wrist so the normal is perpendicular to the palm plane;
 * handedness fixes OpenXR chirality.
 */
function palmarNormalFromJoints(
  wrist: THREE.Vector3,
  indexPos: THREE.Vector3,
  pinkyPos: THREE.Vector3,
  handedness: XRHandedness,
): THREE.Vector3 | null {
  const toIndex = new THREE.Vector3().subVectors(indexPos, wrist)
  const toPinky = new THREE.Vector3().subVectors(pinkyPos, wrist)
  if (toIndex.lengthSq() < 1e-8 || toPinky.lengthSq() < 1e-8) return null

  const n = new THREE.Vector3().crossVectors(toIndex, toPinky)
  if (n.lengthSq() < 1e-8) return null
  n.normalize()
  if (handedness === 'right') n.negate()
  return n
}

/**
 * Hand-tracking wrist menu: palm must face the viewer (true palmar side) and present with an
 * upward tilt toward the eyes — not merely wrist extension with the back/side of the hand
 * toward the headset.
 *
 * Score blends “toward eyes” and “up in head space” so both are required at threshold time.
 */
export function palmFacingHeadScore(
  frame: XRFrame,
  refSpace: XRReferenceSpace,
  hand: XRHand,
  handedness: XRHandedness,
): number | null {
  const wristSpace = hand.get('wrist')
  const indexSpace = hand.get('index-finger-metacarpal')
  const pinkySpace = hand.get('pinky-finger-metacarpal')
  const midSpace = hand.get('middle-finger-metacarpal')
  if (!wristSpace || !indexSpace || !midSpace) return null

  const getJointPose = frame.getJointPose
  if (!getJointPose) return null
  const wristPose = getJointPose.call(frame, wristSpace, refSpace)
  const indexPose = getJointPose.call(frame, indexSpace, refSpace)
  const midPose = getJointPose.call(frame, midSpace, refSpace)
  const pinkyPose = pinkySpace ? getJointPose.call(frame, pinkySpace, refSpace) : null
  if (!wristPose || !indexPose || !midPose) return null

  const wp = wristPose.transform.position
  const wrist = new THREE.Vector3(wp.x, wp.y, wp.z)

  const ip = indexPose.transform.position
  const indexPos = new THREE.Vector3(ip.x, ip.y, ip.z)

  let palmar: THREE.Vector3 | null = null
  if (pinkyPose) {
    const pp = pinkyPose.transform.position
    const pinkyPos = new THREE.Vector3(pp.x, pp.y, pp.z)
    palmar = palmarNormalFromJoints(wrist, indexPos, pinkyPos, handedness)
  }
  if (!palmar) {
    const mp = midPose.transform.position
    const midPos = new THREE.Vector3(mp.x, mp.y, mp.z)
    const toMid = new THREE.Vector3().subVectors(midPos, wrist)
    const toIndex = new THREE.Vector3().subVectors(indexPos, wrist)
    if (toMid.lengthSq() < 1e-8 || toIndex.lengthSq() < 1e-8) return null
    const n = new THREE.Vector3().crossVectors(toMid, toIndex)
    if (n.lengthSq() < 1e-8) return null
    n.normalize()
    if (handedness === 'right') n.negate()
    palmar = n
  }

  const vp = frame.getViewerPose(refSpace)
  if (!vp) return null
  const hp = vp.transform.position
  const head = new THREE.Vector3(hp.x, hp.y, hp.z)
  const toHead = new THREE.Vector3().subVectors(head, wrist).normalize()
  if (toHead.lengthSq() < 1e-8) return null

  const o = vp.transform.orientation
  tmpQ.set(o.x, o.y, o.z, o.w)
  tmpHeadUp.set(0, 1, 0).applyQuaternion(tmpQ).normalize()

  const towardEyes = palmar.dot(toHead)
  if (towardEyes <= 0) return null

  const towardUp = palmar.dot(tmpHeadUp)

  /**
   * Require a clear upward component of the palmar normal (open “showing the palm” pose).
   * Slightly negative values still fail the blend so pure wrist-curl / back-of-hand poses drop out.
   */
  const upWeight = THREE.MathUtils.clamp((towardUp + 0.08) / 0.55, 0, 1)
  const score = towardEyes * (0.22 + 0.78 * upWeight)
  return Math.max(0, Math.min(1, score))
}

export function updatePalmMenuVisibility(
  score: number | null,
  hysteresis: PalmFacingHysteresis,
): boolean {
  if (score == null) {
    hysteresis.visible = false
    hysteresis.openStreak = 0
    return false
  }
  if (!hysteresis.visible) {
    if (score >= PALM_FACE_OPEN_THRESHOLD) {
      hysteresis.openStreak += 1
      if (hysteresis.openStreak >= PALM_FACE_OPEN_DWELL_FRAMES) {
        hysteresis.visible = true
        hysteresis.openStreak = 0
      }
    } else {
      hysteresis.openStreak = 0
    }
  } else if (score <= PALM_FACE_CLOSE_THRESHOLD) {
    hysteresis.visible = false
    hysteresis.openStreak = 0
  }
  return hysteresis.visible
}
