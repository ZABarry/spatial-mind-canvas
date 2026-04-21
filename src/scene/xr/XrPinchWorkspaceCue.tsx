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
const _cueColor = new THREE.Color()

/**
 * Hand-local cue near the pinch: warm ring when close to grab threshold; stronger ring when
 * workspace grab is active; outer amber ring for two-hand scale/yaw.
 */
export function XrPinchWorkspaceCue() {
  const gl = useThree((s) => s.gl)
  const groupRef = React.useRef<THREE.Group>(null)
  const meshRef = React.useRef<THREE.Mesh>(null)
  const meshOuterRef = React.useRef<THREE.Mesh>(null)
  const pinchBySource = React.useRef(new Map<XRInputSource, PinchGraspHysteresis>())
  const pulse = React.useRef(0)

  const handPrimary = useRootStore((s) => s.xrHandTrackingPrimary)
  const nav = useRootStore((s) => s.navigationMode)
  const disabled = useRootStore((s) => s.devicePreferences.xrDisableHandWorldGrab === true)
  const afford = useRootStore((s) => s.xrGrabAffordance)

  useFrame((_, delta) => {
    const g = groupRef.current
    const ring = meshRef.current
    const outer = meshOuterRef.current
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
    let midFound = false
    for (const src of session.inputSources) {
      if (!src.hand) continue
      const dist = pinchTipDistanceM(frame, refSpace, src.hand)
      let hyst = pinchBySource.current.get(src)
      if (!hyst) {
        hyst = { pinched: false }
        pinchBySource.current.set(src, hyst)
      }
      const pinching = updatePinchGraspActive(dist, hyst)
      const nearGrasp = isPinchApproachingGrasp(dist, pinching)
      const grabActive = afford === 'grab1' || afford === 'grab2'
      if (
        (nearGrasp || grabActive) &&
        pinchIndexThumbMidpointWorld(frame, refSpace, src.hand, _vec)
      ) {
        _tmp.set(_vec.x, _vec.y, _vec.z)
        g.position.copy(_tmp)
        midFound = true
        const breathe = 0.96 + Math.sin(pulse.current) * 0.04
        if (ring) {
          let s: number
          let opacity: number
          if (grabActive) {
            s = afford === 'grab2' ? 1.14 : 1.08
            opacity = afford === 'grab2' ? 0.58 : 0.5
            _cueColor.set(afford === 'grab2' ? '#f59e0b' : '#14b8a6')
          } else {
            s = breathe
            opacity = 0.32
            _cueColor.set('#0d9488')
          }
          ring.scale.setScalar(s)
          const mat = ring.material as THREE.MeshBasicMaterial
          mat.color.copy(_cueColor)
          mat.opacity = opacity
        }
        if (outer) {
          outer.visible = afford === 'grab2'
          if (afford === 'grab2') {
            outer.scale.setScalar(1.28 + Math.sin(pulse.current * 0.9) * 0.02)
            const om = outer.material as THREE.MeshBasicMaterial
            om.opacity = 0.28
          }
        }
        show = true
        break
      }
    }
    g.visible = show && midFound
  })

  if (!handPrimary) return null
  return (
    <group ref={groupRef} renderOrder={6}>
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.034, 0.0034, 10, 28]} />
        <meshBasicMaterial color="#0d9488" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh ref={meshOuterRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.048, 0.0024, 10, 28]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </group>
  )
}
