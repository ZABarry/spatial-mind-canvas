import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import * as cmds from '../../ui/toolbar/sceneToolbarCommands'
import { useRootStore } from '../../store/rootStore'
import { XrHeadAnchoredGroup } from './XrHeadAnchoredGroup'

export function XrBookmarksPanel() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.bookmarksPanelOpen)
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)

  if (!session || !open || !project) return null

  const close = () => useRootStore.getState().setBookmarksPanelOpen(false)

  return (
    <XrHeadAnchoredGroup lane="right">
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '16px 18px',
            maxWidth: 380,
            maxHeight: '70vh',
            overflow: 'auto',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>Bookmarks</h2>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
            Saved camera + graph framing on this device. Same as the desktop Bookmarks menu.
          </p>
          <button type="button" className="primary" onClick={() => cmds.promptSaveBookmark()} style={{ marginBottom: 12 }}>
            Save current view…
          </button>
          {project.bookmarks.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No saved views yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {project.bookmarks.map((b) => (
                <li
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: 14,
                  }}
                >
                  <button
                    type="button"
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      dispatch({ type: 'recallBookmark', id: b.id })
                      close()
                    }}
                  >
                    {b.label}
                  </button>
                  <button type="button" onClick={() => dispatch({ type: 'removeBookmark', id: b.id })} title="Remove">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 14 }}>
            <button type="button" onClick={close}>
              Close
            </button>
          </div>
        </div>
      </Html>
    </XrHeadAnchoredGroup>
  )
}
