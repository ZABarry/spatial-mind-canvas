import { useMemo } from 'react'
import { useRootStore, runSearchQuery } from '../store/rootStore'

export function SearchPalette() {
  const open = useRootStore((s) => s.searchOpen)
  const dispatch = useRootStore((s) => s.dispatch)
  const q = useRootStore((s) => s.searchQuery)

  const ids = useMemo(() => runSearchQuery(q), [q])

  if (!open) return null

  return (
    <div className="search-palette panel">
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
      />
      <div style={{ marginTop: 10, maxHeight: 220, overflow: 'auto', fontSize: 13 }}>
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
                padding: '6px 4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => {
                dispatch({ type: 'jumpToNode', nodeId: id })
                dispatch({ type: 'selectNodes', ids: [id] })
              }}
            >
              {useRootStore.getState().project?.graph.nodes[id]?.title ?? id}
            </button>
          ))}
      </div>
    </div>
  )
}
