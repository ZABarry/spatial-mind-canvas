import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

const TRANSLATE_SENS = 2.2
const ROT_TWIST_SENS = 2.4
const SCALE_CLAMP = { min: 0.94, max: 1.06 } as const

function handednessOrder(src: XRInputSource): number {
  if (src.handedness === 'left') return 0
  if (src.handedness === 'right') return 1
  return 2
}

/**
 * Squeeze (grip) on controllers to move/scale/rotate the world root in worldManip mode.
 * One hand: translate. Two hands: horizontal separation scales (hands apart = zoom out),
 * and opposite motion along view forward (one hand toward you, one away) yaws the world.
 */
export function XrWorldGrab() {
  const gl = useThree((s) => s.gl)
  const lastPos = useRef(new Map<XRInputSource, THREE.Vector3>())
  const lastPairDist = useRef<number | null>(null)
  const da = useRef(new THREE.Vector3())
  const db = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())

  useXRInputSourceEvent(
    'all',
    'squeezestart',
    (e: XRInputSourceEvent) => {
      const st = useRootStore.getState()
      if (st.connectionDraft || st.navigationMode !== 'world') return
      const frame = e.frame
      const refSpace = gl.xr.getReferenceSpace()
      const grip = e.inputSource.gripSpace
      if (!refSpace || !grip) return
      const pose = frame.getPose(grip, refSpace)
      if (!pose) return
      const p = pose.transform.position
      const wasEmpty = lastPos.current.size === 0
      lastPos.current.set(e.inputSource, new THREE.Vector3(p.x, p.y, p.z))
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
    const st = useRootStore.getState()
    if (!gl.xr.isPresenting || st.navigationMode !== 'world' || st.connectionDraft) return
    const frame = gl.xr.getFrame()
    const refSpace = gl.xr.getReferenceSpace()
    if (!frame || !refSpace) return

    const sources = [...lastPos.current.keys()]
    if (sources.length === 0) return

    const pairedPos: { src: XRInputSource; pos: THREE.Vector3 }[] = []
    for (const src of sources) {
      const grip = src.gripSpace
      if (!grip) continue
      const pose = frame.getPose(grip, refSpace)
      if (!pose) continue
      const p = pose.transform.position
      pairedPos.push({ src, pos: new THREE.Vector3(p.x, p.y, p.z) })
    }

    if (pairedPos.length >= 2) {
      const paired = [...pairedPos].sort((x, y) => handednessOrder(x.src) - handednessOrder(y.src))
      const left = paired[0]!
      const right = paired[1]!
      const a = left.pos
      const b = right.pos
      const dist = a.distanceTo(b)

      if (lastPairDist.current != null && lastPairDist.current > 1e-5) {
        // Hands apart → smaller factor → zoom out; together → zoom in
        let ratio = lastPairDist.current / dist
        ratio = Math.max(SCALE_CLAMP.min, Math.min(SCALE_CLAMP.max, ratio))
        if (Math.abs(ratio - 1) > 0.002) {
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
            if (Math.abs(twist) > 0.001) {
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
