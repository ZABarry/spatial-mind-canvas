import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { useRootStore, runSearchQuery } from '../../store/rootStore'

type Variant = 'desktop' | 'xr'

const wrapStyle = (variant: Variant): CSSProperties =>
  variant === 'xr'
    ? {
        width: 380,
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }
    : {}

export function SearchPanelBody({ variant = 'desktop' }: { variant?: Variant }) {
  const dispatch = useRootStore((s) => s.dispatch)
  const q = useRootStore((s) => s.searchQuery)

  const ids = useMemo(() => runSearchQuery(q), [q])

  return (
    <div style={wrapStyle(variant)}>
      <input
        autoFocus
        placeholder="Search ideas…"
        value={q}
        onChange={(e) => {
          dispatch({ type: 'search', query: e.target.value })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') dispatch({ type: 'setSearchOpen', open: false })
        }}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: '1px solid #d8e0ec',
          boxSizing: 'border-box',
          fontSize: 15,
        }}
      />
      <div
        style={{
          marginTop: 10,
          maxHeight: variant === 'xr' ? '50vh' : 220,
          overflow: 'auto',
          fontSize: 13,
        }}
      >
        {ids
          .filter((id) => !id.startsWith('media:'))
          .map((id) => (
            <button
              key={id}
              type="button"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 4,
              }}
              onClick={() => {
                dispatch({ type: 'jumpToNode', nodeId: id })
                dispatch({ type: 'selectNodes', ids: [id] })
                dispatch({ type: 'setSearchOpen', open: false })
              }}
            >
              {useRootStore.getState().project?.graph.nodes[id]?.title ?? id}
            </button>
          ))}
      </div>
      {variant === 'xr' && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'setSearchOpen', open: false })}
          style={{
            marginTop: 12,
            alignSelf: 'flex-end',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      )}
    </div>
  )
}
