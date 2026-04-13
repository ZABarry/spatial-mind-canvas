import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  DEFAULT_PARTICLES_COLOR,
  DEFAULT_PARTICLES_COUNT,
  DEFAULT_PARTICLES_OPACITY,
  DEFAULT_PARTICLES_SIZE,
  DEFAULT_PARTICLES_SPEED,
  defaultUserSettings,
} from '../../graph/defaults'
import { useRootStore } from '../../store/rootStore'

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

varying float vAlpha;

void main() {
  vec3 s = position;

  float fall = mix(0.1, 0.24, s.z);
  float span = 90.0;
  float halfSpan = span * 0.5;
  float vy = fall * 3.15;
  float y = mod((s.y - 0.5) * span - uTime * vy + span * 3.0, span) - halfSpan;

  float t = uTime;
  float driftX =
    sin(t * 0.41 + s.x * 12.9898) * 1.5 +
    sin(t * 0.86 + s.z * 7.23) * 0.58;
  float driftZ =
    cos(t * 0.37 + s.y * 9.1556) * 1.42 +
    cos(t * 0.64 + s.x * 8.901) * 0.52;

  float x = (s.x - 0.5) * 132.0 + driftX * 4.0;
  float z = (s.z - 0.5) * 132.0 + driftZ * 4.0;

  float pulseA = sin(t * (0.38 + s.x * 0.52) + s.y * 40.8407) * 0.5 + 0.5;
  float pulseB = sin(t * (0.62 + s.z * 0.48) + s.x * 31.4159) * 0.5 + 0.5;
  float pulseC = sin(t * 0.28 + s.z * 18.8496) * 0.5 + 0.5;
  vAlpha = mix(0.045, 0.4, pulseA * pulseB) * mix(0.55, 1.0, pulseC);

  vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);
  float sz = uSize * mix(0.72, 1.28, fract(s.x * 17.0 + s.z * 3.7));
  float dist = max(-mvPosition.z, 0.001);
  gl_PointSize = sz * uPixelRatio * (280.0 / dist);
  if (gl_PointSize < 1.15) gl_PointSize = 1.15;
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.18, 0.49, d);
  float a = vAlpha * soft * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`

function CalmParticlesInner({ particleCount }: { particleCount: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const { clock, gl } = useThree()

  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(particleCount * 3)
    let seed = 1234567
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = rnd()
      pos[i * 3 + 1] = rnd()
      pos[i * 3 + 2] = rnd()
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(DEFAULT_PARTICLES_COLOR) },
        uOpacity: { value: DEFAULT_PARTICLES_OPACITY },
        uSize: { value: DEFAULT_PARTICLES_SIZE },
        uPixelRatio: { value: gl.getPixelRatio() },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    })

    return { geometry: g, material: m }
  }, [particleCount, gl])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame(() => {
    const m = pointsRef.current?.material as THREE.ShaderMaterial | undefined
    if (!m?.uniforms) return
    const d = defaultUserSettings()
    const set = useRootStore.getState().project?.settings
    const speed = set?.particlesSpeed ?? d.particlesSpeed ?? DEFAULT_PARTICLES_SPEED
    m.uniforms.uTime.value = clock.elapsedTime * speed
    m.uniforms.uPixelRatio.value = gl.getPixelRatio()
    m.uniforms.uSize.value = set?.particlesSize ?? d.particlesSize ?? DEFAULT_PARTICLES_SIZE
    m.uniforms.uOpacity.value = set?.particlesOpacity ?? d.particlesOpacity ?? DEFAULT_PARTICLES_OPACITY
    const col = set?.particlesColor ?? d.particlesColor ?? DEFAULT_PARTICLES_COLOR
    m.uniforms.uColor.value.set(col)
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      raycast={() => null}
    />
  )
}

/** Ambient snow-like motes; count/size/colour/opacity/speed from project settings. */
export function CalmParticles() {
  const particleCount = useRootStore((s) => {
    const d = defaultUserSettings()
    const raw = s.project?.settings?.particlesCount ?? d.particlesCount ?? DEFAULT_PARTICLES_COUNT
    return Math.max(0, Math.min(3000, raw))
  })
  if (particleCount === 0) return null
  return <CalmParticlesInner particleCount={particleCount} />
}
