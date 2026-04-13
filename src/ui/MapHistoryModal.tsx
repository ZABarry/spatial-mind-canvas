import { useEffect, useState } from 'react'
import { mapSnapshots, MAX_SNAPSHOTS_PER_PROJECT } from '../persistence/mapSnapshotRepository'
import type { MapSnapshotRecord } from '../persistence/snapshotPayload'
import { useRootStore } from '../store/rootStore'

export function MapHistoryModal() {
  const open = useRootStore((s) => s.mapHistoryOpen)
  const project = useRootStore((s) => s.project)
  const setOpen = useRootStore((s) => s.setMapHistoryOpen)
  const createMapSnapshot = useRootStore((s) => s.createMapSnapshot)
  const restoreMapSnapshot = useRootStore((s) => s.restoreMapSnapshot)
  const [list, setList] = useState<MapSnapshotRecord[]>([])
  const [pendingRestore, setPendingRestore] = useState<MapSnapshotRecord | null>(null)
  const [saveBefore, setSaveBefore] = useState(true)

  useEffect(() => {
    if (!open || !project) return
    void mapSnapshots.listByProject(project.id).then(setList)
  }, [open, project?.id, project])

  if (!open || !project) return null

  const refresh = () => {
    void mapSnapshots.listByProject(project.id).then(setList)
  }

  const onCreate = () => {
    const label = window.prompt('Snapshot label (optional)', '') ?? ''
    void (async () => {
      await createMapSnapshot(label.trim() || undefined)
      refresh()
    })()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        setOpen(false)
        setPendingRestore(null)
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-history-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}
      >
        <h2 id="map-history-title">Version history</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
          Local snapshots for this map only. They stay in this browser and are{' '}
          <strong>not</strong> included in JSON or ZIP export.
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
          Up to {MAX_SNAPSHOTS_PER_PROJECT} snapshots per map; oldest are removed when you exceed the limit.
        </p>

        {pendingRestore ? (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', color: '#374151' }}>
              Restore snapshot from{' '}
              <strong>{new Date(pendingRestore.createdAt).toLocaleString()}</strong>
              {pendingRestore.label ? ` — “${pendingRestore.label}”` : ''}? Current map content will be replaced.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveBefore}
                onChange={(e) => setSaveBefore(e.target.checked)}
              />
              Save current map as a snapshot first
            </label>
            <div className="modal-actions" style={{ marginTop: 0 }}>
              <button type="button" onClick={() => setPendingRestore(null)}>
                Back
              </button>
              <button
                type="button"
                className="primary"
                style={{
                  background: '#3d5a80',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  void (async () => {
                    await restoreMapSnapshot(pendingRestore.id, { saveBeforeRestore: saveBefore })
                    refresh()
                    setPendingRestore(null)
                  })()
                }}
              >
                Restore
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <button type="button" className="primary" onClick={onCreate}>
                Create snapshot
              </button>
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                maxHeight: 280,
                overflow: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            >
              {list.length === 0 ? (
                <li style={{ padding: 16, color: '#9ca3af', fontSize: 14 }}>No snapshots yet.</li>
              ) : (
                list.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.label || 'Snapshot'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button type="button" onClick={() => setPendingRestore(r)}>
                      Restore…
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        )}

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setPendingRestore(null)
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
