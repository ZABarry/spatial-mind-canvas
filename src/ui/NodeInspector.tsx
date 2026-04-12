import { useRootStore } from '../store/rootStore'
import { NodeDetailForm } from './panels/NodeDetailForm'

export function NodeInspector() {
  const id = useRootStore((s) => s.detailNodeId)
  const project = useRootStore((s) => s.project)

  const node = id && project ? project.graph.nodes[id] : undefined

  if (!id || !project || !node) return null

  return (
    <div className="inspector panel" key={id}>
      <NodeDetailForm id={id} node={node} project={project} variant="desktop" />
    </div>
  )
}
