import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { NodeDetailForm } from '../../ui/panels/NodeDetailForm'
import { XrHeadAnchoredGroup } from './XrHeadAnchoredGroup'

/** Node inspector while immersive (replaces flat DOM inspector). Head-relative left lane — see xrPanelSpawner. */
export function XrNodeDetailPanel() {
  const session = useXR((s) => s.session)
  const id = useRootStore((s) => s.detailNodeId)
  const project = useRootStore((s) => s.project)

  const node = id && project ? project.graph.nodes[id] : undefined

  if (!session || !id || !project || !node) return null

  return (
    <XrHeadAnchoredGroup lane="left">
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <NodeDetailForm id={id} node={node} project={project} variant="xr" />
      </Html>
    </XrHeadAnchoredGroup>
  )
}
