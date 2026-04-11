import { useRootStore } from '../store/rootStore'

export function BookmarksMenu() {
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)

  if (!project || project.bookmarks.length === 0) return null

  return (
    <details className="panel" style={{ padding: '6px 10px', cursor: 'pointer' }}>
      <summary style={{ listStyle: 'none', fontSize: 13 }}>Bookmarks ({project.bookmarks.length})</summary>
      <ul
        style={{
          margin: '8px 0 0',
          padding: 0,
          maxHeight: 200,
          overflowY: 'auto',
          fontSize: 13,
          listStyle: 'none',
        }}
      >
        {project.bookmarks.map((b) => (
          <li
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <button
              type="button"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', flex: 1 }}
              onClick={() => dispatch({ type: 'recallBookmark', id: b.id })}
            >
              {b.label}
            </button>
            <button
              type="button"
              style={{ fontSize: 11, color: '#b91c1c' }}
              onClick={() => dispatch({ type: 'removeBookmark', id: b.id })}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
