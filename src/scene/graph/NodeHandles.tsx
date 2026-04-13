import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useXR } from '@react-three/xr'
import { hideAdvancedAuthoringForHandTracking } from '../../input/xr/handGestures'
import { useRootStore } from '../../store/rootStore'
import { interactionTokens } from '../visual/interactionTokens'

/**
 * Visible affordances on the primary selected node (e.g. link handle).
 */
export function NodeHandles() {
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const handLite = useRootStore((s) => s.xrHandTrackingPrimary)
  const session = useRootStore((s) => s.interactionSession)
  const inXr = useXR((s) => !!s.session)
  const hideLink = inXr && hideAdvancedAuthoringForHandTracking(handLite)
  const [hover, setHover] = useState(false)
  const haloRef = useRef<THREE.MeshBasicMaterial>(null)

  const n = project && primary ? project.graph.nodes[primary] : null
  const showLinkHandle = !hideLink
  const linkActive = !!(n && session.kind === 'link' && session.fromNodeId === n.id)
  const r = n ? 0.14 * n.size : 0
  const hitR = r * 1.55
  const emissiveBoost = hover ? 0.12 : 0
  const baseEmissive = 0.32 + emissiveBoost + (linkActive ? 0.18 : 0)

  /** Must run unconditionally — early returns below would skip hooks on some renders. */
  useFrame(() => {
    const m = haloRef.current
    if (!m) return
    if (!linkActive) {
      m.opacity = hover ? 0.2 : 0.12
      return
    }
    const pulse = Math.sin(performance.now() / 280) * 0.06 + 0.14
    m.opacity = pulse + (hover ? 0.06 : 0)
  })

  if (!project || !primary || !n) return null

  return (
    <group position={n.position}>
      {showLinkHandle ? (
        <group position={[0.55 * n.size + r, 0, 0]}>
          <mesh
            userData={{ nodeId: n.id, hitKind: 'node-link-handle' }}
            onPointerDown={(e) => {
              e.stopPropagation()
              useRootStore.getState().dispatch({
                type: 'startConnection',
                fromNodeId: n.id,
              })
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHover(true)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setHover(false)
            }}
          >
            <sphereGeometry args={[hitR, 20, 20]} />
            <meshStandardMaterial
              color={interactionTokens.link}
              transparent
              opacity={0.04}
              depthWrite={false}
            />
          </mesh>
          <mesh raycast={() => null} scale={1.42}>
            <sphereGeometry args={[r, 16, 16]} />
            <meshBasicMaterial
              ref={haloRef}
              color={interactionTokens.link}
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh raycast={() => null}>
            <sphereGeometry args={[r, 16, 16]} />
            <meshStandardMaterial
              color={interactionTokens.link}
              emissive={interactionTokens.link}
              emissiveIntensity={baseEmissive}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}
