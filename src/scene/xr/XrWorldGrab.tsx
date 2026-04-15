import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import {
  isPinchApproachingGrasp,
  pinchTipDistanceM,
  updatePinchGraspActive,
  type PinchGraspHysteresis,
} from '../../input/xr/handPinchGrasp'
import { canBeginWorldGrab } from '../../input/xr/xrSessionGuards'
import { useRootStore } from '../../store/rootStore'
import { getGrabAnchorWorld } from './anchors/xrGrabAnchor'

const TRANSLATE_SENS = 2.2
const ROT_TWIST_SENS = 1.85
const SCALE_CLAMP = { min: 0.94, max: 1.06 } as const

function handednessOrder(src: XRInputSource): number {
  if (src.handedness === 'left') return 0
  if (src.handedness === 'right') return 1
  return 2
}

/**
 * World mode: squeeze **grip** on controllers, or **index–thumb pinch** when hand-tracking–primary,
 * to move / scale / yaw the graph. One input: translate. Two inputs: pinch separation scales;
 * opposite motion along view forward yaws. See `handPinchGrasp` — not full precision authoring.
 */
export function XrWorldGrab() {
  const gl = useThree((s) => s.gl)
  const lastPos = useRef(new Map<XRInputSource, THREE.Vector3>())
  const lastPairDist = useRef<number | null>(null)
  const da = useRef(new THREE.Vector3())
  const db = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const pinchBySource = useRef(new Map<XRInputSource, PinchGraspHysteresis>())
  const tmpAnchor = useRef(new THREE.Vector3())
  const affordRef = useRef<'idle' | 'pinchNear' | 'grab1' | 'grab2'>('idle')

  const setGrabAffordance = (next: 'idle' | 'pinchNear' | 'grab1' | 'grab2') => {
    if (affordRef.current === next) return
    affordRef.current = next
    useRootStore.setState({ xrGrabAffordance: next })
  }

  useXRInputSourceEvent(
    'all',
    'squeezestart',
    (e: XRInputSourceEvent) => {
      const st = useRootStore.getState()
      const ik = st.interactionSession.kind
      if (ik !== 'worldGrab' && !canBeginWorldGrab(st)) return
      const frame = e.frame
      const refSpace = gl.xr.getReferenceSpace()
      if (!refSpace) return
      const p = tmpAnchor.current
      if (!getGrabAnchorWorld(frame, refSpace, e.inputSource, p)) return
      const wasEmpty = lastPos.current.size === 0
      lastPos.current.set(e.inputSource, p.clone())
      if (wasEmpty) st.dispatch({ type: 'beginWorldGrab' })
      if (lastPos.current.size < 2) lastPairDist.current = null
    },
    [gl],
  )

  useXRInputSourceEvent(
    'all',
    'squeezeend',
    (e: XRInputSourceEvent) => {
      const st = useRootStore.getState()
      lastPos.current.delete(e.inputSource)
      if (lastPos.current.size < 2) lastPairDist.current = null
      if (lastPos.current.size === 0) st.dispatch({ type: 'endWorldGrab' })
    },
    [],
  )

  useFrame(() => {
    if (!gl.xr.isPresenting) {
      setGrabAffordance('idle')
      return
    }
    const frame = gl.xr.getFrame()
    const refSpace = gl.xr.getReferenceSpace()
    const xrSession = gl.xr.getSession()
    if (!frame || !refSpace || !xrSession) return

    let st = useRootStore.getState()
    const active = new Set(xrSession.inputSources)

    let removedStale = false
    for (const src of [...lastPos.current.keys()]) {
      if (!active.has(src)) {
        lastPos.current.delete(src)
        pinchBySource.current.delete(src)
        removedStale = true
      }
    }
    if (removedStale && lastPos.current.size < 2) lastPairDist.current = null
    if (removedStale && lastPos.current.size === 0) {
      const s0 = useRootStore.getState()
      if (s0.interactionSession.kind === 'worldGrab') s0.dispatch({ type: 'endWorldGrab' })
    }

    /** Hand-primary: pinch toggles grab (controllers use squeeze events above). */
    if (
      st.xrHandTrackingPrimary &&
      st.navigationMode === 'world' &&
      !st.devicePreferences.xrDisableHandWorldGrab
    ) {
      for (const src of xrSession.inputSources) {
        if (!src.hand) continue
        const dist = pinchTipDistanceM(frame, refSpace, src.hand)
        let hyst = pinchBySource.current.get(src)
        if (!hyst) {
          hyst = { pinched: false }
          pinchBySource.current.set(src, hyst)
        }
        const pinching = updatePinchGraspActive(dist, hyst)
        const had = lastPos.current.has(src)

        if (pinching && !had) {
          st = useRootStore.getState()
          const ik = st.interactionSession.kind
          if (ik !== 'worldGrab' && !canBeginWorldGrab(st)) continue
          const p = tmpAnchor.current
          if (!getGrabAnchorWorld(frame, refSpace, src, p)) continue
          const wasEmpty = lastPos.current.size === 0
          lastPos.current.set(src, p.clone())
          if (wasEmpty) st.dispatch({ type: 'beginWorldGrab' })
          if (lastPos.current.size < 2) lastPairDist.current = null
        } else if (!pinching && had) {
          lastPos.current.delete(src)
          if (lastPos.current.size < 2) lastPairDist.current = null
          if (lastPos.current.size === 0) useRootStore.getState().dispatch({ type: 'endWorldGrab' })
        }
      }
    }

    st = useRootStore.getState()
    const ik = st.interactionSession.kind

    let afford: 'idle' | 'pinchNear' | 'grab1' | 'grab2' = 'idle'
    if (ik === 'worldGrab') {
      afford = lastPos.current.size >= 2 ? 'grab2' : 'grab1'
    } else if (
      st.xrHandTrackingPrimary &&
      st.navigationMode === 'world' &&
      !st.devicePreferences.xrDisableHandWorldGrab
    ) {
      for (const src of xrSession.inputSources) {
        if (!src.hand) continue
        const dist = pinchTipDistanceM(frame, refSpace, src.hand)
        let hyst = pinchBySource.current.get(src)
        if (!hyst) {
          hyst = { pinched: false }
          pinchBySource.current.set(src, hyst)
        }
        const pinching = updatePinchGraspActive(dist, hyst)
        if (isPinchApproachingGrasp(dist, pinching)) {
          afford = 'pinchNear'
          break
        }
      }
    }
    setGrabAffordance(afford)

    if (st.navigationMode !== 'world' || ik !== 'worldGrab') return

    const sources = [...lastPos.current.keys()]
    if (sources.length === 0) return

    const pairedPos: { src: XRInputSource; pos: THREE.Vector3 }[] = []
    const p = tmpAnchor.current
    for (const src of sources) {
      if (!getGrabAnchorWorld(frame, refSpace, src, p)) continue
      pairedPos.push({ src, pos: p.clone() })
    }

    if (pairedPos.length >= 2) {
      const paired = [...pairedPos].sort((x, y) => handednessOrder(x.src) - handednessOrder(y.src))
      const left = paired[0]!
      const right = paired[1]!
      const a = left.pos
      const b = right.pos
      const dist = a.distanceTo(b)

      if (lastPairDist.current != null && lastPairDist.current > 1e-5) {
        let ratio = lastPairDist.current / dist
        ratio = Math.max(SCALE_CLAMP.min, Math.min(SCALE_CLAMP.max, ratio))
        if (Math.abs(ratio - 1) > 0.0045) {
          st.dispatch({ type: 'scaleWorldLive', factor: ratio })
        }
      }
      lastPairDist.current = dist

      const oldA = lastPos.current.get(left.src)
      const oldB = lastPos.current.get(right.src)
      if (oldA && oldB) {
        da.current.subVectors(a, oldA)
        db.current.subVectors(b, oldB)
        const vp = frame.getViewerPose(refSpace)
        if (vp) {
          const o = vp.transform.orientation
          const q = new THREE.Quaternion(o.x, o.y, o.z, o.w)
          forward.current.set(0, 0, -1).applyQuaternion(q)
          forward.current.y = 0
          if (forward.current.lengthSq() > 1e-8) {
            forward.current.normalize()
            const twist =
              (da.current.dot(forward.current) - db.current.dot(forward.current)) * ROT_TWIST_SENS
            if (Math.abs(twist) > 0.0055) {
              st.dispatch({ type: 'rotateWorldLive', axis: [0, 1, 0], radians: twist })
            }
          }
        }
      }

      lastPos.current.set(left.src, a.clone())
      lastPos.current.set(right.src, b.clone())
      return
    }

    if (pairedPos.length === 1) {
      const { src, pos: newP } = pairedPos[0]!
      const old = lastPos.current.get(src)
      if (!old) return
      const d = new THREE.Vector3().subVectors(newP, old)
      st.dispatch({
        type: 'translateWorldLive',
        delta: [d.x * TRANSLATE_SENS, d.y * TRANSLATE_SENS, d.z * TRANSLATE_SENS],
      })
      lastPos.current.set(src, newP.clone())
    }
  })

  return null
}
