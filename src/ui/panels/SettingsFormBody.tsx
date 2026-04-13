import type { CSSProperties } from 'react'
import type { UserSettings } from '../../graph/types'
import { useRootStore } from '../../store/rootStore'

type Variant = 'desktop' | 'xr'

const modalStyle = (variant: Variant): CSSProperties =>
  variant === 'xr'
    ? {
        width: 400,
        maxWidth: '90vw',
        padding: '20px 24px',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }
    : {}

export function SettingsFormBody({ variant = 'desktop' }: { variant?: Variant }) {
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)
  const devicePreferences = useRootStore((s) => s.devicePreferences)
  const xrDebugHud = useRootStore((s) => s.xrDebugHud)

  if (!project) return null

  const s: UserSettings = project.settings

  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  }

  const checkboxRow: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  }
  const checkboxLabel: CSSProperties = {
    flex: 1,
    minWidth: 0,
    lineHeight: 1.45,
  }

  const sectionTitle = (label: string) => (
    <h3 style={{ margin: '16px 0 8px', fontSize: 14, fontWeight: 600, color: '#374151' }}>{label}</h3>
  )

  return (
    <div style={modalStyle(variant)}>
      <h2 style={{ marginTop: variant === 'xr' ? 0 : undefined }}>Settings</h2>

      {sectionTitle('Map')}
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={s.showAllLabels ?? false}
          onChange={(e) => dispatch({ type: 'patchSettings', patch: { showAllLabels: e.target.checked } })}
        />
        <span style={checkboxLabel}>Show all node labels (heavy on Quest)</span>
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
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={s.worldAxisControls === true}
          onChange={(e) => dispatch({ type: 'patchSettings', patch: { worldAxisControls: e.target.checked } })}
        />
        <span style={checkboxLabel}>World axis drag handles</span>
      </label>
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={s.floorGrid !== false}
          onChange={(e) => dispatch({ type: 'patchSettings', patch: { floorGrid: e.target.checked } })}
        />
        <span style={checkboxLabel}>Floor grid</span>
      </label>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
        Focus hop depth{' '}
        <input
          type="number"
          min={0}
          max={4}
          step={1}
          value={s.focusHopDepth}
          onChange={(e) =>
            dispatch({
              type: 'patchSettings',
              patch: { focusHopDepth: Math.max(0, Math.min(4, Number(e.target.value) || 1)) },
            })
          }
          style={{ width: 48, marginLeft: 8 }}
        />
      </label>
      <p style={{ fontSize: 12, color: '#6b7280' }}>Map options are stored in this project file.</p>

      {sectionTitle('Device & VR')}
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={devicePreferences.locomotionSmooth}
          onChange={(e) =>
            dispatch({ type: 'patchDevicePreferences', patch: { locomotionSmooth: e.target.checked } })
          }
        />
        <span style={checkboxLabel}>Smooth locomotion (VR)</span>
      </label>
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={devicePreferences.comfortVignette}
          onChange={(e) =>
            dispatch({ type: 'patchDevicePreferences', patch: { comfortVignette: e.target.checked } })
          }
        />
        <span style={checkboxLabel}>Comfort vignette</span>
      </label>
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={devicePreferences.preferXrPassthrough ?? false}
          onChange={(e) =>
            dispatch({ type: 'patchDevicePreferences', patch: { preferXrPassthrough: e.target.checked } })
          }
        />
        <span style={checkboxLabel}>Prefer camera passthrough when entering XR (if supported)</span>
      </label>
      <label style={checkboxRow}>
        <input
          type="checkbox"
          style={{ flexShrink: 0, marginTop: 2 }}
          checked={devicePreferences.audioEnabled}
          onChange={(e) =>
            dispatch({ type: 'patchDevicePreferences', patch: { audioEnabled: e.target.checked } })
          }
        />
        <span style={checkboxLabel}>Sound — ambient bed and subtle interaction cues</span>
      </label>
      <label style={{ ...row, marginBottom: 12 }}>
        Dominant hand
        <select
          value={devicePreferences.dominantHand}
          onChange={(e) =>
            dispatch({
              type: 'patchDevicePreferences',
              patch: { dominantHand: e.target.value as 'left' | 'right' },
            })
          }
          aria-describedby="dominant-hand-hint"
        >
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </label>
      <p id="dominant-hand-hint" style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
        Used to bias which controller ray is preferred for selection. Travel sticks stay left move / right turn.
      </p>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
        Move speed{' '}
        <input
          type="number"
          min={0.5}
          max={8}
          step={0.25}
          value={devicePreferences.moveSpeed}
          onChange={(e) =>
            dispatch({
              type: 'patchDevicePreferences',
              patch: { moveSpeed: Math.max(0.5, Math.min(8, Number(e.target.value) || 2)) },
            })
          }
          style={{ width: 72, marginLeft: 8 }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
        Smooth turn speed{' '}
        <input
          type="number"
          min={0.5}
          max={6}
          step={0.1}
          value={devicePreferences.smoothTurnSpeed}
          onChange={(e) =>
            dispatch({
              type: 'patchDevicePreferences',
              patch: { smoothTurnSpeed: Math.max(0.5, Math.min(6, Number(e.target.value) || 2)) },
            })
          }
          style={{ width: 72, marginLeft: 8 }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
        Snap turn (°){' '}
        <input
          type="number"
          min={15}
          max={90}
          step={5}
          value={devicePreferences.snapTurnDegrees}
          onChange={(e) =>
            dispatch({
              type: 'patchDevicePreferences',
              patch: { snapTurnDegrees: Math.max(15, Math.min(90, Number(e.target.value) || 45)) },
            })
          }
          style={{ width: 64, marginLeft: 8 }}
        />
      </label>
      <p style={{ fontSize: 12, color: '#6b7280' }}>Device preferences apply to this browser only and are not embedded in map exports.</p>

      {import.meta.env.DEV ? (
        <label style={checkboxRow}>
          <input
            type="checkbox"
            style={{ flexShrink: 0, marginTop: 2 }}
            checked={xrDebugHud}
            onChange={(e) => useRootStore.setState({ xrDebugHud: e.target.checked })}
          />
          <span style={checkboxLabel}>XR debug HUD (immersive; extra status line)</span>
        </label>
      ) : null}

      <div
        className={variant === 'desktop' ? 'modal-actions' : undefined}
        style={variant === 'xr' ? { marginTop: 12, display: 'flex', justifyContent: 'flex-end' } : undefined}
      >
        <button
          type="button"
          onClick={() => useRootStore.setState({ settingsOpen: false })}
          style={
            variant === 'xr'
              ? {
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  cursor: 'pointer',
                }
              : undefined
          }
        >
          Close
        </button>
      </div>
    </div>
  )
}
