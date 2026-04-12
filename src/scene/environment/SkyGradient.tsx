import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
varying vec3 vWorldPosition;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPosition = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
precision highp float;
varying vec3 vWorldPosition;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform float uExponent;

void main() {
  vec3 dir = normalize(vWorldPosition);
  float t = clamp(dir.y, 0.0, 1.0);
  t = pow(t, uExponent);
  vec3 col = mix(uHorizon, uZenith, t);
  gl_FragColor = vec4(col, 1.0);
}
`

type SkyGradientProps = {
  /** Horizon color (360° at eye level). */
  horizon?: string
  /** Color straight above. */
  zenith?: string
  /** Controls how quickly the gradient moves off the horizon (higher = stays whiter lower). */
  exponent?: number
}

export function SkyGradient({
  horizon = '#ffffff',
  zenith = '#b8cfe8',
  exponent = 0.72,
}: SkyGradientProps) {
  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new THREE.Color(horizon) },
      uZenith: { value: new THREE.Color(zenith) },
      uExponent: { value: exponent },
    }),
    [horizon, zenith, exponent],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [uniforms],
  )

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh renderOrder={-1000} frustumCulled={false} material={material}>
      <sphereGeometry args={[520, 48, 32]} />
    </mesh>
  )
}
