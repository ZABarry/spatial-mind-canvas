import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useRootStore } from '../../store/rootStore'
import { hideAdvancedAuthoringForHandTracking } from '../../input/xr/handGestures'
import {
  runNodeAddChild,
  runNodeDelete,
  runNodeFocus,
  runNodeInspect,
  runNodeRecenter,
  runNodeStartLink,
} from './xrNodeMenuActions'

type RadialBtn = { label: string; color: string; onPress: () => void }

/**
 * Contextual authoring for the selected node (VR controllers). Node-specific only — wrist menu stays global.
 */
export function XrNodeRadial() {
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const handLite = useRootStore((s) => s.xrHandTrackingPrimary)
  const inXr = useRootStore((s) => s.xrSessionActive)
  const hideLink = hideAdvancedAuthoringForHandTracking(handLite)

  if (!inXr || !project || !primary) return null
  const n = project.graph.nodes[primary]
  if (!n) return null

  const y = 0.55 * n.size + 0.5
  const w = 0.26
  const gap = 0.06

  const buttons: RadialBtn[] = [
    { label: 'Child', color: '#34d399', onPress: () => runNodeAddChild() },
    ...(hideLink ? [] : ([{ label: 'Link', color: '#5ad4ff', onPress: () => runNodeStartLink() }] as RadialBtn[])),
    { label: 'Inspect', color: '#c4b5fd', onPress: () => runNodeInspect() },
    { label: 'Delete', color: '#fb7185', onPress: () => runNodeDelete() },
    { label: 'Focus', color: '#fcd34d', onPress: () => runNodeFocus() },
    { label: 'Recenter', color: '#94a3b8', onPress: () => runNodeRecenter() },
  ]

  const totalW = buttons.length * w + (buttons.length - 1) * gap
  const startX = -totalW / 2 + w / 2

  const onAct =
    (fn: () => void) =>
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      fn()
    }

  return (
    <group position={n.position as unknown as [number, number, number]}>
      {buttons.map((b, i) => {
        const x = startX + i * (w + gap)
        return (
          <group key={b.label} position={[x, y, 0]}>
            <mesh onPointerDown={onAct(b.onPress)}>
              <boxGeometry args={[w * 0.85, 0.1, 0.04]} />
              <meshStandardMaterial color={b.color} />
            </mesh>
            <Text position={[0, 0, 0.03]} fontSize={0.038} color="#0f172a" anchorX="center" anchorY="middle">
              {b.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
