import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useRootStore } from '../../store/rootStore'
import { useXR } from '@react-three/xr'
import { hideAdvancedAuthoringForHandTracking } from '../../input/xr/handGestures'
import { runNodeInspect } from './xrNodeMenuActions'

/**
 * Contextual actions for the selected node (VR controllers).
 */
export function XrNodeRadial() {
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const handLite = useRootStore((s) => s.xrHandTrackingPrimary)
  const inXr = useXR((s) => !!s.session)
  const hideLink = hideAdvancedAuthoringForHandTracking(handLite)

  if (!inXr || !project || !primary) return null
  const n = project.graph.nodes[primary]
  if (!n) return null

  const y = 0.55 * n.size + 0.5
  const inspectX = hideLink ? 0 : -0.75 * n.size

  const onAct =
    (fn: () => void) =>
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      fn()
    }

  return (
    <group position={n.position as unknown as [number, number, number]}>
      {!hideLink ? (
        <>
          <mesh
            position={[0.75 * n.size, y, 0]}
            onPointerDown={onAct(() =>
              useRootStore.getState().dispatch({ type: 'startConnection', fromNodeId: n.id }),
            )}
          >
            <boxGeometry args={[0.22, 0.1, 0.04]} />
            <meshStandardMaterial color="#5ad4ff" />
          </mesh>
          <Text position={[0.75 * n.size, y, 0.03]} fontSize={0.05} color="#0f172a" anchorX="center" anchorY="middle">
            Link
          </Text>
        </>
      ) : null}
      <mesh position={[inspectX, y, 0]} onPointerDown={onAct(() => runNodeInspect())}>
        <boxGeometry args={[0.24, 0.1, 0.04]} />
        <meshStandardMaterial color="#c4b5fd" />
      </mesh>
      <Text position={[inspectX, y, 0.03]} fontSize={0.045} color="#0f172a" anchorX="center" anchorY="middle">
        Inspect
      </Text>
    </group>
  )
}
