import { useRootStore } from '../store/rootStore'

export function SettingsPanel() {
  const open = useRootStore((s) => s.settingsOpen)
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)

  if (!open || !project) return null

  const s = project.settings

  return (
    <div className="modal-backdrop" onClick={() => useRootStore.setState({ settingsOpen: false })}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={s.locomotionSmooth}
            onChange={(e) =>
              dispatch({ type: 'patchSettings', patch: { locomotionSmooth: e.target.checked } })
            }
          />
          Smooth locomotion (VR)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={s.comfortVignette}
            onChange={(e) =>
              dispatch({ type: 'patchSettings', patch: { comfortVignette: e.target.checked } })
            }
          />
          Comfort vignette
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={s.audioEnabled}
            onChange={(e) => dispatch({ type: 'patchSettings', patch: { audioEnabled: e.target.checked } })}
          />
          Ambient audio
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={s.showAllLabels ?? false}
            onChange={(e) => dispatch({ type: 'patchSettings', patch: { showAllLabels: e.target.checked } })}
          />
          Show all node labels (heavy on Quest)
        </label>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          Label budget (when not showing all){' '}
          <input
            type="number"
            min={8}
            max={200}
            value={s.labelBudget ?? 32}
            onChange={(e) =>
              dispatch({
                type: 'patchSettings',
                patch: { labelBudget: Math.max(8, Math.min(200, Number(e.target.value) || 32)) },
              })
            }
            style={{ width: 64, marginLeft: 8 }}
          />
        </label>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Saved with this map.</p>
        <div className="modal-actions">
          <button type="button" onClick={() => useRootStore.setState({ settingsOpen: false })}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
