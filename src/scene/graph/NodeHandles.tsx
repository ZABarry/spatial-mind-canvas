import { useXR } from '@react-three/xr'
import { hideAdvancedAuthoringForHandTracking } from '../../input/xr/handGestures'
import { useRootStore } from '../../store/rootStore'

/**
 * Visible affordances on the primary selected node (e.g. link handle).
 */
export function NodeHandles() {
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const handLite = useRootStore((s) => s.xrHandTrackingPrimary)
  const inXr = useXR((s) => !!s.session)
  const hideLink = inXr && hideAdvancedAuthoringForHandTracking(handLite)

  if (!project || !primary) return null
  const n = project.graph.nodes[primary]
  if (!n) return null

  const showLinkHandle = !hideLink

  const r = 0.14 * n.size

  return (
    <group position={n.position}>
      {showLinkHandle ? (
        <mesh
          position={[0.55 * n.size + r, 0, 0]}
          userData={{ nodeId: n.id, hitKind: 'node-link-handle' }}
          onPointerDown={(e) => {
            e.stopPropagation()
            useRootStore.getState().dispatch({
              type: 'startConnection',
              fromNodeId: n.id,
            })
          }}
        >
          <sphereGeometry args={[r, 16, 16]} />
          <meshStandardMaterial
            color="#5ad4ff"
            emissive="#1a6a88"
            emissiveIntensity={0.35}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      ) : null}
    </group>
  )
}
