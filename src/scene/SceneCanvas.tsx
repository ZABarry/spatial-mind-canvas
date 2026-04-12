import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { XR, NotInXR, XROrigin, useXR } from '@react-three/xr'
import type { ReactNode } from 'react'
import { useRef } from 'react'
import type { Group } from 'three'
import { WhiteVoid } from './environment/WhiteVoid'
import { CalmParticles } from './environment/CalmParticles'
import { CenterViewEffect } from './CenterViewEffect'
import { DESKTOP_INITIAL_CAMERA_POSITION } from './desktopCameraDefaults'
import { ResetViewEffect } from './ResetViewEffect'
import { WorldRoot } from './graph/WorldRoot'
import { xrStore } from './xrStore'
import { useRootStore } from '../store/rootStore'
import { useXRControllerLocomotion } from '@react-three/xr'
import { XrSessionBridge } from './xr/XrSessionBridge'
import { XrConfirmHud } from './xr/XrConfirmHud'
import { XrControllerInputBridge } from '../input/adapters/useXrControllerInputBridge'
import { XrWorldGrab } from './xr/XrWorldGrab'
import { XrWristMenu } from './xr/XrWristMenu'
import { XrNodeDetailPanel } from './xr/XrNodeDetailPanel'
import { XrSearchPanel } from './xr/XrSearchPanel'
import { XrSettingsPanel } from './xr/XrSettingsPanel'
import { XrTextPromptHud } from './xr/XrTextPromptHud'
import { XrHelpHud } from './xr/XrHelpHud'
import { XrNodeRadial } from './xr/XrNodeRadial'
import { XrToolHud } from './xr/XrToolHud'
import { XrHandInputStub } from '../input/adapters/useXrHandInputBridge'

function OrbitIfFlat() {
  const session = useXR((s) => s.session)
  const nodeDragActive = useRootStore((s) => s.nodeDragActive)
  return (
    <OrbitControls
      makeDefault
      enabled={!session}
      enableRotate={!nodeDragActive}
      minDistance={2}
      maxDistance={160}
      enableDamping
      dampingFactor={0.08}
    />
  )
}

function TravelLocomotion({ children }: { children?: ReactNode }) {
  const nav = useRootStore((s) => s.navigationMode)
  const dev = useRootStore((s) => s.devicePreferences)
  const ref = useRef<Group>(null)
  const hand = dev.dominantHand === 'left' ? 'right' : 'left'

  useXRControllerLocomotion(
    ref,
    nav === 'travel'
      ? {
          speed: dev.moveSpeed,
        }
      : false,
    nav === 'travel'
      ? dev.locomotionSmooth
        ? { type: 'smooth', speed: dev.smoothTurnSpeed }
        : { type: 'snap', degrees: dev.snapTurnDegrees }
      : false,
    hand,
  )

  return <XROrigin ref={ref}>{children}</XROrigin>
}

export function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: DESKTOP_INITIAL_CAMERA_POSITION, fov: 50 }}
      gl={{ antialias: true, localClippingEnabled: true }}
      dpr={[1, 2]}
    >
      <XR store={xrStore}>
        <XrSessionBridge />
        <WhiteVoid />
        <CalmParticles />
        <TravelLocomotion>
          <XrNodeDetailPanel />
          <XrSearchPanel />
          <XrSettingsPanel />
        </TravelLocomotion>
        <XrControllerInputBridge />
        <XrHandInputStub />
        <XrNodeRadial />
        <XrToolHud />
        <XrWorldGrab />
        <XrConfirmHud />
        <XrTextPromptHud />
        <XrHelpHud />
        <XrWristMenu />
        <WorldRoot />
        <CenterViewEffect />
        <ResetViewEffect />
        <NotInXR>
          <OrbitIfFlat />
        </NotInXR>
      </XR>
    </Canvas>
  )
}
