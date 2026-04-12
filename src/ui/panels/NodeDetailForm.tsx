import type { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import { nextChildPosition } from '../../graph/selectors'
import { NODE_SHAPES, type NodeEntity, type NodeShape, type Project } from '../../graph/types'
import { useRootStore } from '../../store/rootStore'
import { MediaAttachmentRow } from '../MediaAttachmentRow'

const DEFAULT_NODE_HEX = '#7eb8da'

function colorInputHex(css: string): string {
  const t = css.trim()
  if (/^#[0-9A-Fa-f]{6}$/i.test(t)) return t.toLowerCase()
  const m = t.match(/^#([0-9A-Fa-f]{3})$/i)
  if (m) {
    const x = m[1]!
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`.toLowerCase()
  }
  return DEFAULT_NODE_HEX
}

function shapeLabel(s: NodeShape): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type PanelVariant = 'desktop' | 'xr'

const panelStyle = (variant: PanelVariant): CSSProperties =>
  variant === 'xr'
    ? {
        width: 400,
        maxHeight: '72vh',
        overflow: 'auto',
        padding: 16,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        fontSize: 14,
        color: '#1c2330',
      }
    : {}

export function NodeDetailForm({
  id,
  node,
  project,
  variant = 'desktop',
}: {
  id: string
  node: NodeEntity
  project: Project
  variant?: PanelVariant
}) {
  const dispatch = useRootStore((s) => s.dispatch)

  return (
    <div style={panelStyle(variant)}>
      {variant === 'desktop' ? (
        <button
          type="button"
          onClick={() => dispatch({ type: 'openNodeDetail', nodeId: null })}
          style={{ float: 'right', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          Close
        </button>
      ) : (
        <button
          type="button"
          onClick={() => dispatch({ type: 'openNodeDetail', nodeId: null })}
          style={{
            float: 'right',
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          Close
        </button>
      )}
      <h3 style={{ marginTop: 0 }}>Node</h3>
      <p style={{ fontSize: 12, fontWeight: 600, margin: '8px 0 6px', color: '#374151' }}>Appearance</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Color</label>
        <input
          type="color"
          value={colorInputHex(node.color)}
          onChange={(e) =>
            dispatch({
              type: 'updateNodeProps',
              nodeId: id,
              patch: { color: e.target.value },
            })
          }
          aria-label="Node color"
          style={{ width: 40, height: 32, padding: 0, border: '1px solid #d8e0ec', borderRadius: 6, cursor: 'pointer' }}
        />
      </div>
      <label style={{ fontSize: 12, color: '#6b7280' }}>Shape</label>
      <select
        value={node.shape}
        onChange={(e) =>
          dispatch({
            type: 'updateNodeProps',
            nodeId: id,
            patch: { shape: e.target.value as NodeShape },
          })
        }
        style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 8, border: '1px solid #d8e0ec', background: '#fff' }}
      >
        {NODE_SHAPES.map((s) => (
          <option key={s} value={s}>
            {shapeLabel(s)}
          </option>
        ))}
      </select>
      <label style={{ fontSize: 12, color: '#6b7280' }}>Title</label>
      <input
        key={`t-${id}`}
        defaultValue={node.title}
        style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #d8e0ec', boxSizing: 'border-box' }}
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
        style={{ width: '100%', minHeight: variant === 'xr' ? 100 : undefined, boxSizing: 'border-box' }}
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
              position: nextChildPosition(project.graph, node),
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
