import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { NodeDetailForm } from '../../ui/panels/NodeDetailForm'

/** Node inspector in front of the user while immersive (replaces flat DOM inspector). */
export function XrNodeDetailPanel() {
  const session = useXR((s) => s.session)
  const id = useRootStore((s) => s.detailNodeId)
  const project = useRootStore((s) => s.project)

  const node = id && project ? project.graph.nodes[id] : undefined

  if (!session || !id || !project || !node) return null

  return (
    <group position={[-0.42, 1.38, -0.62]}>
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <NodeDetailForm id={id} node={node} project={project} variant="xr" />
      </Html>
    </group>
  )
}
