import { useEffect, useLayoutEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  DEFAULT_PARTICLES_COLOR,
  DEFAULT_PARTICLES_COUNT,
  DEFAULT_PARTICLES_OPACITY,
  DEFAULT_PARTICLES_SIZE,
  DEFAULT_PARTICLES_SPEED,
  DEFAULT_WORLD_BACKGROUND_EXPONENT,
  DEFAULT_WORLD_BACKGROUND_HORIZON,
  DEFAULT_WORLD_BACKGROUND_ZENITH,
} from '../../graph/defaults'
import type { UserSettings } from '../../graph/types'
import { useRootStore } from '../../store/rootStore'

type Variant = 'desktop' | 'xr'

const TABS = ['general', 'appearance', 'vr', 'audio'] as const
type TabId = (typeof TABS)[number]

function tabLabel(id: TabId): string {
  switch (id) {
    case 'general':
      return 'General'
    case 'appearance':
      return 'Appearance'
    case 'vr':
      return 'VR'
    case 'audio':
      return 'Audio'
  }
}

function nextTab(current: TabId, delta: number): TabId {
  const i = TABS.indexOf(current)
  return TABS[(i + delta + TABS.length) % TABS.length]!
}

export function SettingsFormBody({ variant = 'desktop' }: { variant?: Variant }) {
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)
  const devicePreferences = useRootStore((s) => s.devicePreferences)
  const xrDebugHud = useRootStore((s) => s.xrDebugHud)

  const [tab, setTab] = useState<TabId>('general')

  const close = () => useRootStore.setState({ settingsOpen: false })

  useEffect(() => {
    if (variant !== 'xr') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [variant])

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      document.getElementById('settings-tab-general')?.focus()
    })
  }, [])

  if (!project) return null

  const s: UserSettings = project.settings

  const onTabKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, currentId: TabId) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const n = nextTab(currentId, 1)
      setTab(n)
      document.getElementById(`settings-tab-${n}`)?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const n = nextTab(currentId, -1)
      setTab(n)
      document.getElementById(`settings-tab-${n}`)?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      setTab('general')
      document.getElementById('settings-tab-general')?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      setTab('audio')
      document.getElementById('settings-tab-audio')?.focus()
    }
  }

  return (
    <>
      <header className="settings-modal-header">
        <h2 id="settings-dialog-title">Settings</h2>
        <button
          type="button"
          className="settings-modal-header-close"
          aria-label="Close settings"
          onClick={close}
        >
          ×
        </button>
      </header>

      <div className="settings-tablist" role="tablist" aria-label="Settings sections">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`settings-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`settings-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className="settings-tab"
            onKeyDown={(e) => onTabKeyDown(e, id)}
            onClick={() => {
              setTab(id)
              document.getElementById(`settings-tab-${id}`)?.focus()
            }}
          >
            {tabLabel(id)}
          </button>
        ))}
      </div>

      <div className="settings-modal-scroll">
        <section
          role="tabpanel"
          id="settings-panel-general"
          aria-labelledby="settings-tab-general"
          hidden={tab !== 'general'}
        >
          <h3 className="settings-section-title">Map</h3>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={s.showAllLabels ?? false}
              onChange={(e) => dispatch({ type: 'patchSettings', patch: { showAllLabels: e.target.checked } })}
            />
            <span className="settings-checkbox-label">Show all node labels (heavy on Quest)</span>
          </label>
          <label className="settings-field">
            Label budget (when not showing all){' '}
            <input
              type="number"
              className="settings-input-narrow"
              min={8}
              max={200}
              value={s.labelBudget ?? 32}
              onChange={(e) =>
                dispatch({
                  type: 'patchSettings',
                  patch: { labelBudget: Math.max(8, Math.min(200, Number(e.target.value) || 32)) },
                })
              }
            />
          </label>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={s.worldAxisControls === true}
              onChange={(e) => dispatch({ type: 'patchSettings', patch: { worldAxisControls: e.target.checked } })}
            />
            <span className="settings-checkbox-label">World axis drag handles</span>
          </label>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={s.floorGrid !== false}
              onChange={(e) => dispatch({ type: 'patchSettings', patch: { floorGrid: e.target.checked } })}
            />
            <span className="settings-checkbox-label">Floor grid</span>
          </label>
          <label className="settings-field">
            Focus hop depth{' '}
            <input
              type="number"
              className="settings-input-tiny"
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
            />
          </label>
          <p className="settings-section-hint">Map options are stored in this project file.</p>
        </section>

        <section
          role="tabpanel"
          id="settings-panel-appearance"
          aria-labelledby="settings-tab-appearance"
          hidden={tab !== 'appearance'}
        >
          <p className="settings-section-hint" style={{ marginTop: 0 }}>
            Sky and particles affect the desktop canvas view.
          </p>

          <details className="settings-advanced-details">
            <summary className="settings-advanced-summary">Advanced appearance</summary>

            <div>
              <div className="settings-section-title">World background (desktop)</div>
              <div className="settings-colors-row">
                <label>
                  Horizon
                  <input
                    type="color"
                    value={s.worldBackgroundHorizon ?? DEFAULT_WORLD_BACKGROUND_HORIZON}
                    onChange={(e) =>
                      dispatch({ type: 'patchSettings', patch: { worldBackgroundHorizon: e.target.value } })
                    }
                    aria-label="Sky horizon color"
                  />
                </label>
                <label>
                  Zenith
                  <input
                    type="color"
                    value={s.worldBackgroundZenith ?? DEFAULT_WORLD_BACKGROUND_ZENITH}
                    onChange={(e) =>
                      dispatch({ type: 'patchSettings', patch: { worldBackgroundZenith: e.target.value } })
                    }
                    aria-label="Sky zenith color"
                  />
                </label>
              </div>
              <label className="settings-slider-row">
                Gradient falloff{' '}
                <span className="settings-value-muted">
                  {(s.worldBackgroundExponent ?? DEFAULT_WORLD_BACKGROUND_EXPONENT).toFixed(2)}
                </span>
                <input
                  type="range"
                  className="settings-range"
                  min={0.35}
                  max={2.2}
                  step={0.01}
                  value={s.worldBackgroundExponent ?? DEFAULT_WORLD_BACKGROUND_EXPONENT}
                  onChange={(e) =>
                    dispatch({
                      type: 'patchSettings',
                      patch: {
                        worldBackgroundExponent: Math.round(Number(e.target.value) * 100) / 100,
                      },
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="settings-btn-secondary"
                onClick={() =>
                  dispatch({
                    type: 'patchSettings',
                    patch: {
                      worldBackgroundHorizon: DEFAULT_WORLD_BACKGROUND_HORIZON,
                      worldBackgroundZenith: DEFAULT_WORLD_BACKGROUND_ZENITH,
                      worldBackgroundExponent: DEFAULT_WORLD_BACKGROUND_EXPONENT,
                    },
                  })
                }
              >
                Reset background to default
              </button>
            </div>

            <div>
              <div className="settings-section-title">Ambient particles</div>
              <label className="settings-field">
                Count (0 = off){' '}
                <input
                  type="number"
                  className="settings-input-medium"
                  min={0}
                  max={3000}
                  step={20}
                  value={s.particlesCount ?? DEFAULT_PARTICLES_COUNT}
                  onChange={(e) =>
                    dispatch({
                      type: 'patchSettings',
                      patch: {
                        particlesCount: Math.max(0, Math.min(3000, Number(e.target.value) || 0)),
                      },
                    })
                  }
                />
              </label>
              <label className="settings-slider-row">
                Size{' '}
                <span className="settings-value-muted">{(s.particlesSize ?? DEFAULT_PARTICLES_SIZE).toFixed(1)}</span>
                <input
                  type="range"
                  className="settings-range"
                  min={1}
                  max={16}
                  step={0.1}
                  value={s.particlesSize ?? DEFAULT_PARTICLES_SIZE}
                  onChange={(e) =>
                    dispatch({
                      type: 'patchSettings',
                      patch: { particlesSize: Math.round(Number(e.target.value) * 10) / 10 },
                    })
                  }
                />
              </label>
              <div className="settings-colors-row">
                <label>
                  Colour
                  <input
                    type="color"
                    value={s.particlesColor ?? DEFAULT_PARTICLES_COLOR}
                    onChange={(e) => dispatch({ type: 'patchSettings', patch: { particlesColor: e.target.value } })}
                    aria-label="Particle colour"
                  />
                </label>
              </div>
              <label className="settings-slider-row">
                Opacity{' '}
                <span className="settings-value-muted">
                  {(s.particlesOpacity ?? DEFAULT_PARTICLES_OPACITY).toFixed(2)}
                </span>
                <input
                  type="range"
                  className="settings-range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={s.particlesOpacity ?? DEFAULT_PARTICLES_OPACITY}
                  onChange={(e) =>
                    dispatch({
                      type: 'patchSettings',
                      patch: { particlesOpacity: Math.round(Number(e.target.value) * 100) / 100 },
                    })
                  }
                />
              </label>
              <label className="settings-slider-row">
                Speed{' '}
                <span className="settings-value-muted">
                  {(s.particlesSpeed ?? DEFAULT_PARTICLES_SPEED).toFixed(2)}×
                </span>
                <input
                  type="range"
                  className="settings-range"
                  min={0}
                  max={3}
                  step={0.05}
                  value={s.particlesSpeed ?? DEFAULT_PARTICLES_SPEED}
                  onChange={(e) =>
                    dispatch({
                      type: 'patchSettings',
                      patch: { particlesSpeed: Math.round(Number(e.target.value) * 100) / 100 },
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="settings-btn-secondary"
                onClick={() =>
                  dispatch({
                    type: 'patchSettings',
                    patch: {
                      particlesCount: DEFAULT_PARTICLES_COUNT,
                      particlesSize: DEFAULT_PARTICLES_SIZE,
                      particlesColor: DEFAULT_PARTICLES_COLOR,
                      particlesOpacity: DEFAULT_PARTICLES_OPACITY,
                      particlesSpeed: DEFAULT_PARTICLES_SPEED,
                    },
                  })
                }
              >
                Reset particles to default
              </button>
            </div>
          </details>
        </section>

        <section
          role="tabpanel"
          id="settings-panel-vr"
          aria-labelledby="settings-tab-vr"
          hidden={tab !== 'vr'}
        >
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={devicePreferences.locomotionSmooth}
              onChange={(e) =>
                dispatch({ type: 'patchDevicePreferences', patch: { locomotionSmooth: e.target.checked } })
              }
            />
            <span className="settings-checkbox-label">Smooth locomotion (VR)</span>
          </label>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={devicePreferences.comfortVignette}
              onChange={(e) =>
                dispatch({ type: 'patchDevicePreferences', patch: { comfortVignette: e.target.checked } })
              }
            />
            <span className="settings-checkbox-label">Comfort vignette</span>
          </label>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={devicePreferences.preferXrPassthrough ?? false}
              onChange={(e) =>
                dispatch({ type: 'patchDevicePreferences', patch: { preferXrPassthrough: e.target.checked } })
              }
            />
            <span className="settings-checkbox-label">Prefer camera passthrough when entering XR (if supported)</span>
          </label>
          <label className="settings-field-inline">
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
          <p id="dominant-hand-hint" className="settings-muted" style={{ margin: '0 0 12px', lineHeight: 1.4 }}>
            Used to bias which controller ray is preferred for selection. Travel sticks stay left move / right turn.
          </p>
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={devicePreferences.xrDisableHandWorldGrab === true}
              onChange={(e) =>
                dispatch({
                  type: 'patchDevicePreferences',
                  patch: { xrDisableHandWorldGrab: e.target.checked },
                })
              }
            />
            <span className="settings-checkbox-label">
              Workspace pinch off (comfort) — hand mode won’t grab move/scale; use controllers
            </span>
          </label>
          <p className="settings-muted" style={{ margin: '0 0 12px', lineHeight: 1.4 }}>
            Use when accidental workspace grabs get in the way. Controllers still use grips for workspace moves. Link and precision edits stay controller-first in hand mode.
          </p>
          <label className="settings-field">
            Move speed{' '}
            <input
              type="number"
              className="settings-input-medium"
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
            />
          </label>
          <label className="settings-field">
            Smooth turn speed{' '}
            <input
              type="number"
              className="settings-input-medium"
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
            />
          </label>
          <label className="settings-field">
            Snap turn (°){' '}
            <input
              type="number"
              className="settings-input-narrow"
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
            />
          </label>
          <p className="settings-section-hint">
            Device preferences apply to this browser only and are not embedded in map exports.
          </p>
          {import.meta.env.DEV ? (
            <label className="settings-checkbox-row">
              <input
                type="checkbox"
                checked={xrDebugHud}
                onChange={(e) => useRootStore.setState({ xrDebugHud: e.target.checked })}
              />
              <span className="settings-checkbox-label">XR debug HUD (immersive; extra status line)</span>
            </label>
          ) : null}
        </section>

        <section
          role="tabpanel"
          id="settings-panel-audio"
          aria-labelledby="settings-tab-audio"
          hidden={tab !== 'audio'}
        >
          <label className="settings-checkbox-row">
            <input
              type="checkbox"
              checked={devicePreferences.audioEnabled}
              onChange={(e) =>
                dispatch({ type: 'patchDevicePreferences', patch: { audioEnabled: e.target.checked } })
              }
            />
            <span className="settings-checkbox-label">Sound — ambient bed and subtle interaction cues</span>
          </label>
          <label
            className={`settings-slider-row${!devicePreferences.audioEnabled ? ' settings-audio-dim' : ''}`}
          >
            Ambient bed volume{' '}
            <span className="settings-muted">{Math.round(devicePreferences.ambientVolume * 100)}%</span>
            <input
              type="range"
              className="settings-range"
              min={0}
              max={1}
              step={0.01}
              value={devicePreferences.ambientVolume}
              disabled={!devicePreferences.audioEnabled}
              onChange={(e) =>
                dispatch({
                  type: 'patchDevicePreferences',
                  patch: { ambientVolume: Math.max(0, Math.min(1, Number(e.target.value) || 0)) },
                })
              }
            />
          </label>
          <label
            className={`settings-slider-row${!devicePreferences.audioEnabled ? ' settings-audio-dim' : ''}`}
          >
            Ambient bed pitch{' '}
            <span className="settings-muted">{devicePreferences.ambientPitch.toFixed(2)}×</span>
            <input
              type="range"
              className="settings-range"
              min={0.5}
              max={2}
              step={0.01}
              value={devicePreferences.ambientPitch}
              disabled={!devicePreferences.audioEnabled}
              onChange={(e) =>
                dispatch({
                  type: 'patchDevicePreferences',
                  patch: {
                    ambientPitch: Math.max(0.5, Math.min(2, Number(e.target.value) || 1)),
                  },
                })
              }
            />
          </label>
        </section>
      </div>

      <footer className="settings-modal-footer">
        <button type="button" className="settings-btn-primary" onClick={close}>
          Done
        </button>
      </footer>
    </>
  )
}
