import { useRootStore } from '../store/rootStore'

export function ProjectHome() {
  const index = useRootStore((s) => s.projectIndex)
  const openProject = useRootStore((s) => s.openProject)
  const newBlank = useRootStore((s) => s.newBlankProject)
  const importProject = useRootStore((s) => s.importProject)
  const renameProject = useRootStore((s) => s.renameProject)
  const duplicateCurrentProject = useRootStore((s) => s.duplicateCurrentProject)
  const deleteProject = useRootStore((s) => s.deleteProject)

  return (
    <div className="project-home">
      <h1>Spatial Mind Canvas</h1>
      <p style={{ margin: 0, color: '#5a6578' }}>
        Local, calm 3D mind maps. Your projects stay on this device.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="panel"
          style={{ padding: '10px 16px', cursor: 'pointer', border: 'none' }}
          onClick={() => void newBlank()}
        >
          New blank map
        </button>
        <label
          className="panel"
          style={{ padding: '10px 16px', cursor: 'pointer', display: 'inline-block' }}
        >
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importProject(f)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      <div className="project-list">
        {index.map((p) => (
          <div key={p.id} className="project-row" onClick={() => void openProject(p.id)}>
            <div>
              <strong>{p.name}</strong>
              <div style={{ fontSize: 12, color: '#7a8699', marginTop: 4 }}>
                Updated {new Date(p.updatedAt).toLocaleString()} · Opened{' '}
                {new Date(p.lastOpenedAt).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt('Rename', p.name)
                  if (name) void renameProject(p.id, name)
                }}
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    await openProject(p.id)
                    await duplicateCurrentProject()
                  })()
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() =>
                  useRootStore.setState({
                    confirmDialog: {
                      title: 'Delete map',
                      message: `Delete “${p.name}”? This cannot be undone.`,
                      onConfirm: () => void deleteProject(p.id),
                    },
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {index.length === 0 && (
          <p style={{ color: '#7a8699' }}>No saved maps yet. Create a new blank map to begin.</p>
        )}
      </div>
    </div>
  )
}
