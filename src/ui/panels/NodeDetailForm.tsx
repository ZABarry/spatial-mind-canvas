import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { nextChildPosition } from '../../graph/selectors'
import {
  NODE_LABEL_OUTLINE_DEFAULT,
  NODE_LABEL_TEXT_DEFAULT,
  NODE_SHAPES,
  type NodeEntity,
  type NodeShape,
  type Project,
} from '../../graph/types'
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
        maxHeight: '85vh',
        overflow: 'auto',
        padding: 12,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        fontSize: 14,
        color: '#1c2330',
      }
    : {}

const colorSwatchStyle: CSSProperties = {
  width: '100%',
  height: 28,
  padding: 0,
  border: '1px solid #d8e0ec',
  borderRadius: 6,
  cursor: 'pointer',
  flexShrink: 0,
}

const fieldLabelStyle: CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  display: 'block',
  marginBottom: 4,
  fontWeight: 500,
}

const compactInputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #d8e0ec',
  boxSizing: 'border-box',
}

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
  const mediaAttach = useRootStore((s) => s.mediaAttach)
  const attachmentsRef = useRef<HTMLDivElement>(null)
  const prevMediaAttach = useRef(useRootStore.getState().mediaAttach)

  const attachForNode = mediaAttach?.nodeId === id ? mediaAttach : null
  const attaching =
    !!attachForNode && (attachForNode.phase === 'reading' || attachForNode.phase === 'processing')
  const attachError = attachForNode?.phase === 'error' ? attachForNode.errorMessage : null

  useEffect(() => {
    const prev = prevMediaAttach.current
    prevMediaAttach.current = mediaAttach
    if (
      prev?.nodeId === id &&
      (prev.phase === 'reading' || prev.phase === 'processing') &&
      mediaAttach === null
    ) {
      attachmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [mediaAttach, id])

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
      <h3 style={{ marginTop: 0 }}>Node detail</h3>
      {variant === 'desktop' ? (
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748b', lineHeight: 1.35 }}>
          Notes, media, and appearance. Rename, link, and delete stay on the canvas.
        </p>
      ) : null}
      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px', color: '#374151' }}>Appearance</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div>
          <label htmlFor={`${id}-color-node`} style={fieldLabelStyle}>
            Color
          </label>
          <input
            id={`${id}-color-node`}
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
            style={colorSwatchStyle}
          />
        </div>
        <div>
          <label htmlFor={`${id}-color-text`} style={fieldLabelStyle}>
            Text
          </label>
          <input
            id={`${id}-color-text`}
            type="color"
            value={colorInputHex(node.labelTextColor || NODE_LABEL_TEXT_DEFAULT)}
            onChange={(e) =>
              dispatch({
                type: 'updateNodeProps',
                nodeId: id,
                patch: { labelTextColor: e.target.value },
              })
            }
            aria-label="Node title text color"
            style={colorSwatchStyle}
          />
        </div>
        <div>
          <label htmlFor={`${id}-color-outline`} style={fieldLabelStyle}>
            Outline
          </label>
          <input
            id={`${id}-color-outline`}
            type="color"
            value={colorInputHex(node.labelOutlineColor || NODE_LABEL_OUTLINE_DEFAULT)}
            onChange={(e) =>
              dispatch({
                type: 'updateNodeProps',
                nodeId: id,
                patch: { labelOutlineColor: e.target.value },
              })
            }
            aria-label="Node title outline color"
            style={colorSwatchStyle}
          />
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.15fr)',
          gap: 8,
          marginBottom: 8,
          alignItems: 'end',
        }}
      >
        <div>
          <label htmlFor={`${id}-shape`} style={fieldLabelStyle}>
            Shape
          </label>
          <select
            id={`${id}-shape`}
            value={node.shape}
            onChange={(e) =>
              dispatch({
                type: 'updateNodeProps',
                nodeId: id,
                patch: { shape: e.target.value as NodeShape },
              })
            }
            style={{ ...compactInputStyle, marginBottom: 0, background: '#fff' }}
          >
            {NODE_SHAPES.map((s) => (
              <option key={s} value={s}>
                {shapeLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-title`} style={fieldLabelStyle}>
            Title
          </label>
          <input
            id={`${id}-title`}
            key={`t-${id}`}
            defaultValue={node.title}
            style={{ ...compactInputStyle, marginBottom: 0 }}
            onBlur={(e) =>
              dispatch({
                type: 'updateNodeProps',
                nodeId: id,
                patch: { title: e.target.value },
              })
            }
          />
        </div>
      </div>
      <label htmlFor={`${id}-note`} style={{ ...fieldLabelStyle, marginBottom: 4 }}>
        Note (markdown)
      </label>
      <textarea
        id={`${id}-note`}
        className="node-detail-field-textarea"
        key={`n-${id}`}
        defaultValue={node.note}
        onBlur={(e) =>
          dispatch({
            type: 'updateNodeProps',
            nodeId: id,
            patch: { note: e.target.value },
          })
        }
        style={variant === 'xr' ? { minHeight: 72 } : undefined}
      />
      {node.note.trim() ? (
        <div className="node-detail-note-preview">
          <ReactMarkdown>{node.note}</ReactMarkdown>
        </div>
      ) : null}
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
        <label
          style={{ cursor: attaching ? 'not-allowed' : 'pointer', opacity: attaching ? 0.65 : 1 }}
          aria-disabled={attaching || undefined}
        >
          Add file
          <input
            id={`${id}-attach-file`}
            type="file"
            disabled={attaching}
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && !attaching) dispatch({ type: 'attachMedia', nodeId: id, file: f })
              e.target.value = ''
            }}
          />
        </label>
      </div>
      <div
        aria-busy={attaching || undefined}
        aria-live="polite"
        style={{ marginTop: 8, minHeight: attachForNode ? undefined : 0 }}
      >
        {attachForNode && attachForNode.phase !== 'error' ? (
          <p style={{ margin: 0, fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center' }}>
            <span className="node-detail-media-spinner" aria-hidden />
            {attachForNode.phase === 'reading'
              ? `Reading ${attachForNode.filename}…`
              : `Saving ${attachForNode.filename}…`}
          </p>
        ) : null}
        {attachError ? (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#b91c1c' }} role="alert">
            {attachError}
          </p>
        ) : null}
      </div>
      <div ref={attachmentsRef}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '12px 0 4px', color: '#374151' }}>Attached files</p>
        {node.mediaIds.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>None yet — use Add file above.</p>
        ) : (
          <ul style={{ fontSize: 13, marginTop: 6, paddingLeft: 0 }}>
            {node.mediaIds.map((mid) => {
              const m = project.mediaManifest[mid]
              return m ? <MediaAttachmentRow key={mid} att={m} /> : null
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
