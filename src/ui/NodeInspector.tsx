import ReactMarkdown from 'react-markdown'
import { useRootStore } from '../store/rootStore'
import { MediaAttachmentRow } from './MediaAttachmentRow'

export function NodeInspector() {
  const id = useRootStore((s) => s.detailNodeId)
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)

  const node = id && project ? project.graph.nodes[id] : undefined

  if (!id || !project || !node) return null

  return (
    <div className="inspector panel" key={id}>
      <button
        type="button"
        onClick={() => dispatch({ type: 'openNodeDetail', nodeId: null })}
        style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        Close
      </button>
      <h3>Node</h3>
      <label style={{ fontSize: 12, color: '#6b7280' }}>Title</label>
      <input
        key={`t-${id}`}
        defaultValue={node.title}
        style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #d8e0ec' }}
        onBlur={(e) =>
          dispatch({
            type: 'updateNodeProps',
            nodeId: id,
            patch: { title: e.target.value },
          })
        }
      />
      <label style={{ fontSize: 12, color: '#6b7280' }}>Note (markdown)</label>
      <textarea
        key={`n-${id}`}
        defaultValue={node.note}
        onBlur={(e) =>
          dispatch({
            type: 'updateNodeProps',
            nodeId: id,
            patch: { note: e.target.value },
          })
        }
      />
      <div style={{ marginTop: 12, fontSize: 14 }}>
        <ReactMarkdown>{node.note || '*No note*'}</ReactMarkdown>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'createNodeAt',
              position: [node.position[0] + 1.2, node.position[1], node.position[2]],
              parentId: id,
              connectFromId: id,
            })
          }
        >
          Child node
        </button>
        <button type="button" onClick={() => dispatch({ type: 'toggleCollapse', nodeId: id })}>
          Toggle collapse
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'deleteNode', id })
            dispatch({ type: 'openNodeDetail', nodeId: null })
          }}
        >
          Delete
        </button>
        <label style={{ cursor: 'pointer' }}>
          Add file
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) dispatch({ type: 'attachMedia', nodeId: id, file: f })
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {node.mediaIds.length > 0 && (
        <ul style={{ fontSize: 13, marginTop: 12, paddingLeft: 0 }}>
          {node.mediaIds.map((mid) => {
            const m = project.mediaManifest[mid]
            return m ? <MediaAttachmentRow key={mid} att={m} /> : null
          })}
        </ul>
      )}
    </div>
  )
}
