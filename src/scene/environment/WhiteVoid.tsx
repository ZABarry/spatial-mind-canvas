import { useXR } from '@react-three/xr'
import {
  DEFAULT_WORLD_BACKGROUND_EXPONENT,
  DEFAULT_WORLD_BACKGROUND_HORIZON,
  DEFAULT_WORLD_BACKGROUND_ZENITH,
} from '../../graph/defaults'
import { useRootStore } from '../../store/rootStore'
import { SkyGradient } from './SkyGradient'

/** Slightly cooler / dimmer in headset so the scene reads less flat-white. */
const XR_BG = '#d6dde8'
const FLAT_FOG_D = 0.012
const XR_FOG_D = 0.026

export function WhiteVoid() {
  const inXr = useXR((s) => !!s.session)
  const worldBg = useRootStore((s) => s.project?.settings)
  const horizon = worldBg?.worldBackgroundHorizon ?? DEFAULT_WORLD_BACKGROUND_HORIZON
  const zenith = worldBg?.worldBackgroundZenith ?? DEFAULT_WORLD_BACKGROUND_ZENITH
  const exponent = worldBg?.worldBackgroundExponent ?? DEFAULT_WORLD_BACKGROUND_EXPONENT
  const bg = inXr ? XR_BG : horizon
  const fogD = inXr ? XR_FOG_D : FLAT_FOG_D

  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[bg, fogD]} />
      {!inXr && <SkyGradient horizon={horizon} zenith={zenith} exponent={exponent} />}
      <hemisphereLight
        intensity={inXr ? 0.5 : 0.68}
        color="#eef3fb"
        groundColor={inXr ? '#c5ccd8' : '#ffffff'}
      />
      <directionalLight position={[8, 14, 6]} intensity={inXr ? 0.38 : 0.44} color="#fff8f0" />
      <directionalLight position={[-6, 4, -10]} intensity={inXr ? 0.21 : 0.18} color="#b8c8e8" />
    </>
  )
}
