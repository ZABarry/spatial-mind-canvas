import { useXR } from '@react-three/xr'
import { SkyGradient } from './SkyGradient'

/** Match horizon / fog so distance blends to white, not a flat gray. */
const FLAT_BG = '#ffffff'
/** Slightly cooler / dimmer in headset so the scene reads less flat-white. */
const XR_BG = '#d6dde8'
const FLAT_FOG_D = 0.012
const XR_FOG_D = 0.026

export function WhiteVoid() {
  const inXr = useXR((s) => !!s.session)
  const bg = inXr ? XR_BG : FLAT_BG
  const fogD = inXr ? XR_FOG_D : FLAT_FOG_D

  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, fogD]} />
      {!inXr && <SkyGradient />}
      <hemisphereLight
        intensity={inXr ? 0.62 : 0.85}
        color="#eef3fb"
        groundColor={inXr ? '#c5ccd8' : '#ffffff'}
      />
      <directionalLight position={[8, 14, 6]} intensity={inXr ? 0.48 : 0.55} color="#fff8f0" />
      <directionalLight position={[-6, 4, -10]} intensity={inXr ? 0.26 : 0.22} color="#b8c8e8" />
    </>
  )
}
