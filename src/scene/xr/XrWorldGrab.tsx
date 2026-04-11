import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

const TRANSLATE_SENS = 2.2
const SCALE_CLAMP = { min: 0.94, max: 1.06 } as const

/**
 * Squeeze (grip) on controllers to move/scale the world root in worldManip mode.
 * One hand: translate. Two hands: pinch distance scales (multiplicative per frame, clamped).
 */
export function XrWorldGrab() {
  const gl = useThree((s) => s.gl)
  const lastPos = useRef(new Map<XRInputSource, THREE.Vector3>())
  const lastPairDist = useRef<number | null>(null)

  useXRInputSourceEvent(
    'all',
    'squeezestart',
    (e: XRInputSourceEvent) => {
      const st = useRootStore.getState()
      if (st.connectionDraft || st.interactionMode !== 'worldManip') return
      const frame = e.frame
      const refSpace = gl.xr.getReferenceSpace()
      const grip = e.inputSource.gripSpace
      if (!refSpace || !grip) return
      const pose = frame.getPose(grip, refSpace)
      if (!pose) return
      const p = pose.transform.position
      lastPos.current.set(e.inputSource, new THREE.Vector3(p.x, p.y, p.z))
      if (lastPos.current.size < 2) lastPairDist.current = null
    },
    [gl],
  )

  useXRInputSourceEvent(
    'all',
    'squeezeend',
    (e: XRInputSourceEvent) => {
      lastPos.current.delete(e.inputSource)
      if (lastPos.current.size < 2) lastPairDist.current = null
    },
    [],
  )

  useFrame(() => {
    const st = useRootStore.getState()
    if (!gl.xr.isPresenting || st.interactionMode !== 'worldManip' || st.connectionDraft) return
    const frame = gl.xr.getFrame()
    const refSpace = gl.xr.getReferenceSpace()
    if (!frame || !refSpace) return

    const sources = [...lastPos.current.keys()]
    if (sources.length === 0) return

    const positions: THREE.Vector3[] = []
    for (const src of sources) {
      const grip = src.gripSpace
      if (!grip) continue
      const pose = frame.getPose(grip, refSpace)
      if (!pose) continue
      const p = pose.transform.position
      positions.push(new THREE.Vector3(p.x, p.y, p.z))
    }

    if (positions.length >= 2) {
      const a = positions[0]!
      const b = positions[1]!
      const dist = a.distanceTo(b)
      if (lastPairDist.current != null && lastPairDist.current > 1e-5) {
        let ratio = dist / lastPairDist.current
        ratio = Math.max(SCALE_CLAMP.min, Math.min(SCALE_CLAMP.max, ratio))
        if (Math.abs(ratio - 1) > 0.002) {
          st.dispatch({ type: 'scaleWorld', factor: ratio })
        }
      }
      lastPairDist.current = dist
      for (let i = 0; i < sources.length && i < positions.length; i++) {
        lastPos.current.set(sources[i]!, positions[i]!)
      }
      return
    }

    if (positions.length === 1 && sources.length === 1) {
      const src = sources[0]!
      const newP = positions[0]!
      const old = lastPos.current.get(src)
      if (!old) return
      const d = new THREE.Vector3().subVectors(newP, old)
      st.dispatch({
        type: 'translateWorld',
        delta: [d.x * TRANSLATE_SENS, d.y * TRANSLATE_SENS, d.z * TRANSLATE_SENS],
      })
      lastPos.current.set(src, newP.clone())
    }
  })

  return null
}
