import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import {
  isPinchApproachingGrasp,
  pinchIndexThumbMidpointWorld,
  pinchTipDistanceM,
  updatePinchGraspActive,
  type PinchGraspHysteresis,
} from '../../input/xr/handPinchGrasp'
import { useRootStore } from '../../store/rootStore'

const _vec = { x: 0, y: 0, z: 0 }
const _tmp = new THREE.Vector3()

/**
 * Subtle in-world ring near the pinch midpoint when a pinch is close to the workspace grab
 * threshold (hand-primary, World nav). Complements {@link XrStatusHud} copy cues.
 */
export function XrPinchWorkspaceCue() {
  const gl = useThree((s) => s.gl)
  const groupRef = React.useRef<THREE.Group>(null)
  const meshRef = React.useRef<THREE.Mesh>(null)
  const pinchBySource = React.useRef(new Map<XRInputSource, PinchGraspHysteresis>())
  const pulse = React.useRef(0)

  const handPrimary = useRootStore((s) => s.xrHandTrackingPrimary)
  const nav = useRootStore((s) => s.navigationMode)
  const disabled = useRootStore((s) => s.devicePreferences.xrDisableHandWorldGrab === true)

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    pulse.current = (pulse.current + delta * 4.2) % (Math.PI * 2)
    if (!gl.xr.isPresenting || !handPrimary || nav !== 'world' || disabled) {
      g.visible = false
      return
    }
    const frame = gl.xr.getFrame()
    const refSpace = gl.xr.getReferenceSpace()
    const session = gl.xr.getSession()
    if (!frame || !refSpace || !session) {
      g.visible = false
      return
    }

    let show = false
    for (const src of session.inputSources) {
      if (!src.hand) continue
      const dist = pinchTipDistanceM(frame, refSpace, src.hand)
      let hyst = pinchBySource.current.get(src)
      if (!hyst) {
        hyst = { pinched: false }
        pinchBySource.current.set(src, hyst)
      }
      const pinching = updatePinchGraspActive(dist, hyst)
      if (isPinchApproachingGrasp(dist, pinching) && pinchIndexThumbMidpointWorld(frame, refSpace, src.hand, _vec)) {
        _tmp.set(_vec.x, _vec.y, _vec.z)
        g.position.copy(_tmp)
        const breathe = 0.96 + Math.sin(pulse.current) * 0.04
        const ring = meshRef.current
        if (ring) ring.scale.setScalar(breathe)
        show = true
        break
      }
    }
    g.visible = show
  })

  if (!handPrimary) return null
  return (
    <group ref={groupRef} renderOrder={6}>
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.034, 0.0034, 10, 28]} />
        <meshBasicMaterial color="#0d9488" transparent opacity={0.32} depthWrite={false} />
      </mesh>
    </group>
  )
}
