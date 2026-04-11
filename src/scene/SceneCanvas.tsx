import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { XR, NotInXR, XROrigin, useXR } from '@react-three/xr'
import { useRef } from 'react'
import type { Group } from 'three'
import { WhiteVoid } from './environment/WhiteVoid'
import { CalmParticles } from './environment/CalmParticles'
import { WorldRoot } from './graph/WorldRoot'
import { xrStore } from './xrStore'
import { useRootStore } from '../store/rootStore'
import { useXRControllerLocomotion } from '@react-three/xr'
import { XrSessionBridge } from './xr/XrSessionBridge'
import { XrConfirmHud } from './xr/XrConfirmHud'
import { XrRaycastSelect } from './xr/XrRaycastSelect'
import { XrWorldGrab } from './xr/XrWorldGrab'

function OrbitIfFlat() {
  const session = useXR((s) => s.session)
  return (
    <OrbitControls
      makeDefault
      enabled={!session}
      minDistance={2}
      maxDistance={160}
      enableDamping
      dampingFactor={0.08}
    />
  )
}

function TravelLocomotion() {
  const mode = useRootStore((s) => s.interactionMode)
  const settings = useRootStore((s) => s.project?.settings)
  const ref = useRef<Group>(null)
  const hand = settings?.dominantHand === 'left' ? 'right' : 'left'

  useXRControllerLocomotion(
    ref,
    mode === 'travel'
      ? {
          speed: settings?.moveSpeed ?? 2,
        }
      : false,
    mode === 'travel'
      ? settings?.locomotionSmooth
        ? { type: 'smooth', speed: settings.smoothTurnSpeed }
        : { type: 'snap', degrees: settings?.snapTurnDegrees ?? 45 }
      : false,
    hand,
  )

  return <XROrigin ref={ref} />
}

export function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 5, 16], fov: 50 }}
      gl={{ antialias: true, localClippingEnabled: true }}
      dpr={[1, 2]}
    >
      <XR store={xrStore}>
        <XrSessionBridge />
        <WhiteVoid />
        <CalmParticles />
        <TravelLocomotion />
        <XrRaycastSelect />
        <XrWorldGrab />
        <XrConfirmHud />
        <WorldRoot />
        <NotInXR>
          <OrbitIfFlat />
        </NotInXR>
      </XR>
    </Canvas>
  )
}
