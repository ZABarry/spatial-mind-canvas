import { Text } from '@react-three/drei'
import { useRootStore } from '../../store/rootStore'

/** Small in-scene reminder of the active authoring tool (VR). */
export function XrToolHud() {
  const toolMode = useRootStore((s) => s.toolMode)
  const nav = useRootStore((s) => s.navigationMode)

  const label = `Tool: ${toolMode} · Nav: ${nav}`

  return (
    <group position={[0, 1.35, -1.6]}>
      <Text fontSize={0.06} color="#334155" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}
