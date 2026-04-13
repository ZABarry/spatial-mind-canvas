import { useState } from 'react'
import { nextChildPosition } from '../graph/selectors'
import { useRootStore } from '../store/rootStore'
import { QuickRenamePopover } from './QuickRenamePopover'

/**
 * Desktop-only contextual actions for the primary selected node (no Help required).
 */
export function NodeQuickActions() {
  const xrSession = useRootStore((s) => s.xrSessionActive)
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const interactionSession = useRootStore((s) => s.interactionSession)
  const dispatch = useRootStore((s) => s.dispatch)
  const [renameOpen, setRenameOpen] = useState(false)

  if (xrSession || !project || !primary) return null
  const node = project.graph.nodes[primary]
  if (!node) return null

  const linkingFromHere =
    interactionSession.kind === 'link' && interactionSession.fromNodeId === primary

  const addChild = () => {
    const beforeIds = new Set(Object.keys(project.graph.nodes))
    dispatch({
      type: 'createNodeAt',
      position: nextChildPosition(project.graph, node),
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

  const startLinkFromSelection = () => {
    dispatch({ type: 'startConnection', fromNodeId: primary })
  }

  const del = () => {
    dispatch({ type: 'deleteNode', id: primary })
    dispatch({ type: 'openNodeDetail', nodeId: null })
  }

  return (
    <div className="panel node-quick-actions" aria-label="Selected node — quick actions">
      <div className="node-quick-actions-header">
        <span className="node-quick-actions-kicker">Quick actions</span>
        <span className="node-quick-actions-title">{node.title || 'Untitled'}</span>
      </div>
      <div className="node-quick-actions-main">
        <button type="button" className="nqa-btn nqa-neutral" onClick={() => setRenameOpen(true)}>
          Rename
        </button>
        <button type="button" className="nqa-btn nqa-neutral" onClick={addChild}>
          Add child
        </button>
        <button
          type="button"
          className="nqa-btn nqa-neutral"
          title="Add three connected children in one step (one undo)"
          onClick={() => dispatch({ type: 'spawnChildBranches', parentId: primary, count: 3 })}
        >
          Branch (3)
        </button>
        <button
          type="button"
          className={linkingFromHere ? 'nqa-btn nqa-link-active' : 'nqa-btn nqa-primary'}
          onClick={startLinkFromSelection}
          disabled={linkingFromHere}
          aria-busy={linkingFromHere}
          title={linkingFromHere ? 'Link in progress — press Esc to cancel' : 'Start a link from this node'}
        >
          {linkingFromHere ? 'Linking…' : 'Link'}
        </button>
        <button type="button" className="nqa-btn nqa-neutral" onClick={() => dispatch({ type: 'openNodeDetail', nodeId: primary })}>
          Inspect
        </button>
      </div>
      <div className="node-quick-actions-sep" aria-hidden />
      <div className="node-quick-actions-danger-wrap">
        <button type="button" className="nqa-btn nqa-danger" onClick={del}>
          Delete
        </button>
      </div>
      {linkingFromHere ? (
        <p className="node-quick-actions-status" role="status">
          Link in progress — aim at another node or the ground, or press Esc to cancel
        </p>
      ) : null}
      {renameOpen ? (
        <QuickRenamePopover
          initialTitle={node.title || ''}
          onSave={(title) => {
            dispatch({ type: 'updateNodeProps', nodeId: primary, patch: { title } })
            setRenameOpen(false)
          }}
          onCancel={() => setRenameOpen(false)}
        />
      ) : null}
    </div>
  )
}
