import { useFrame, useThree } from '@react-three/fiber'
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
uniform vec3 uCameraPosition;
uniform vec4 uLineColor;
uniform float uCell;
uniform float uFadeNear;
uniform float uFadeFar;

void main() {
  vec2 c = vWorldPosition.xz / uCell;
  vec2 grid = abs(fract(c - 0.5) - 0.5) / fwidth(c);
  float line = min(grid.x, grid.y);
  float intensity = 1.0 - smoothstep(0.0, 1.5, line);

  float dist = distance(vWorldPosition.xz, uCameraPosition.xz);
  float falloff = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);

  float alpha = uLineColor.a * intensity * falloff;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(uLineColor.xyz, alpha);
}
`

/** World-space XZ floor grid; lines only (clear background), distance-faded from the camera. */
export function FloorGrid() {
  const camera = useThree((s) => s.camera)

  const uniforms = useMemo(
    () => ({
      uCameraPosition: { value: new THREE.Vector3() },
      uLineColor: { value: new THREE.Vector4(0.72, 0.74, 0.78, 0.5) },
      uCell: { value: 1.0 },
      uFadeNear: { value: 2.0 },
      uFadeFar: { value: 85.0 },
    }),
    [],
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        fog: false,
        polygonOffset: true,
        polygonOffsetFactor: -0.5,
        polygonOffsetUnits: -0.5,
      }),
    [uniforms],
  )

  useEffect(() => () => material.dispose(), [material])

  useFrame(() => {
    material.uniforms.uCameraPosition.value.copy(camera.position)
  })

  return (
    <mesh
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.03, 0]}
      frustumCulled={false}
      renderOrder={-80}
    >
      <planeGeometry args={[400, 400, 1, 1]} />
    </mesh>
  )
}
