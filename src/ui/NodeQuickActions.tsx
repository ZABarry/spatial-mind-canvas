import { useRootStore } from '../store/rootStore'
import * as tb from './toolbar/sceneToolbarCommands'

/**
 * Desktop-only contextual actions for the primary selected node (no Help required).
 */
export function NodeQuickActions() {
  const xrSession = useRootStore((s) => s.xrSessionActive)
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const dispatch = useRootStore((s) => s.dispatch)

  if (xrSession || !project || !primary) return null
  const node = project.graph.nodes[primary]
  if (!node) return null

  const addChild = () => {
    const beforeIds = new Set(Object.keys(project.graph.nodes))
    dispatch({
      type: 'createNodeAt',
      position: [node.position[0] + 1.2 * node.size, node.position[1], node.position[2]],
      parentId: primary,
      connectFromId: primary,
    })
    const after = useRootStore.getState().project
    if (!after) return
    const newId = Object.keys(after.graph.nodes).find((id) => !beforeIds.has(id))
    if (newId) {
      dispatch({ type: 'selectNodes', ids: [newId], additive: false })
    }
  }

  const rename = () => {
    const next = window.prompt('Node title', node.title || 'Untitled')
    if (next === null) return
    dispatch({ type: 'updateNodeProps', nodeId: primary, patch: { title: next } })
  }

  const del = () => {
    dispatch({ type: 'deleteNode', id: primary })
    dispatch({ type: 'openNodeDetail', nodeId: null })
  }

  return (
    <div className="panel node-quick-actions" aria-label="Quick node actions">
      <span className="node-quick-actions-title">{node.title || 'Untitled'}</span>
      <button type="button" onClick={rename}>
        Rename
      </button>
      <button type="button" onClick={addChild}>
        Add child
      </button>
      <button type="button" onClick={() => tb.setToolMode('link')}>
        Link
      </button>
      <button type="button" onClick={() => dispatch({ type: 'openNodeDetail', nodeId: primary })}>
        Inspect
      </button>
      <button type="button" onClick={del}>
        Delete
      </button>
    </div>
  )
}
