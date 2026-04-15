import { useEffect, useState } from 'react'
import { useRootStore } from '../store/rootStore'
import { copyRecenterVsResetShort } from '../scene/xr/productCopy'
import * as tb from './toolbar/sceneToolbarCommands'
import { BookmarksDropdown } from './BookmarksMenu'
import { StructureMenuContent } from './StructureMenu'
import { ToolbarMenu, type ToolbarMenuId } from './ToolbarMenu'
import { MapHistoryModal } from './MapHistoryModal'
import { TemplatePickerModal } from './TemplatePickerModal'

export function MainToolbar() {
  const [openMenu, setOpenMenu] = useState<ToolbarMenuId | null>(null)
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const xrSession = useRootStore((s) => s.xrSessionActive)
  const mode = useRootStore((s) => s.interactionMode)
  const navMode = useRootStore((s) => s.navigationMode)
  const project = useRootStore((s) => s.project)
  const worldAxisControls = project?.settings.worldAxisControls === true
  const floorGridOn = project?.settings.floorGrid !== false
  const saveIndicator = useRootStore((s) => s.saveIndicator)
  const feedbackMessage = useRootStore((s) => s.feedbackMessage)

  useEffect(() => {
    if (!feedbackMessage) return
    const t = window.setTimeout(() => useRootStore.setState({ feedbackMessage: null }), 6000)
    return () => window.clearTimeout(t)
  }, [feedbackMessage])

  useEffect(() => {
    if (saveIndicator !== 'saved' && saveIndicator !== 'error') return
    const t = window.setTimeout(() => useRootStore.setState({ saveIndicator: 'idle' }), 2800)
    return () => window.clearTimeout(t)
  }, [saveIndicator])

  if (xrSession) return null

  return (
    <>
    <MapHistoryModal />
    <TemplatePickerModal open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} />
    <div className="toolbar panel">
      <button
        type="button"
        onClick={() => {
          setOpenMenu(null)
          tb.goLibrary()
        }}
      >
        Library
      </button>

      <div className="toolbar-tools" aria-label="Navigation mode">
        <span className="toolbar-tools-label">Nav</span>
        <button
          type="button"
          className={navMode === 'world' ? 'toggle-on' : undefined}
          onClick={() => tb.setNavigationMode('world')}
          title="World: manipulate the graph in place (no thumbstick locomotion)"
        >
          World
        </button>
        <button
          type="button"
          className={navMode === 'travel' ? 'toggle-on' : undefined}
          onClick={() => tb.setNavigationMode('travel')}
          title="Travel: move and turn through the space with thumbsticks"
        >
          Travel
        </button>
      </div>

      <button type="button" className="primary" onClick={() => void tb.enterVr()}>
        Enter VR
      </button>

      <ToolbarMenu menuId="map" openMenu={openMenu} setOpenMenu={setOpenMenu} label="Map">
        <button type="button" onClick={() => void tb.newBlankMap()}>
          New map
        </button>
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null)
            setTemplatePickerOpen(true)
          }}
        >
          New from template…
        </button>
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null)
            tb.openMapHistory()
          }}
        >
          Version history…
        </button>
        <button type="button" onClick={() => void tb.duplicateMap()}>
          Duplicate map
        </button>
        <button type="button" className="toolbar-menu-danger" onClick={() => tb.requestClearMap()}>
          Clear map…
        </button>
        <button
          type="button"
          onClick={() => tb.exportJson()}
          title="Current map only. Local snapshots are not included."
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => void tb.exportZip()}
          title="Current map and media. Local snapshots are not included."
        >
          Export ZIP
        </button>
      </ToolbarMenu>

      <BookmarksDropdown openMenu={openMenu} setOpenMenu={setOpenMenu} />

      <ToolbarMenu menuId="view" openMenu={openMenu} setOpenMenu={setOpenMenu} label="View">
        <button type="button" onClick={() => tb.toggleTravelWorldMode()}>
          {mode === 'travel' ? 'Toggle: switch to world' : 'Toggle: switch to travel'}
        </button>
        <button
          type="button"
          className={worldAxisControls ? 'toggle-on' : undefined}
          onClick={() => tb.toggleWorldAxisControls()}
        >
          {worldAxisControls ? 'World axis controls on' : 'World axis controls off'}
        </button>
        <button
          type="button"
          className={floorGridOn ? 'toggle-on' : undefined}
          onClick={() => tb.toggleFloorGrid()}
        >
          {floorGridOn ? 'Floor grid on' : 'Floor grid off'}
        </button>
        <button type="button" onClick={() => tb.focusSelection()}>
          Focus neighborhood (F)
        </button>
        <button
          type="button"
          onClick={() => tb.centerViewOnSelection()}
          title="Recenter: align the primary node with the orbit pivot (Home or . )"
        >
          Recenter selection
        </button>
        <button type="button" onClick={() => tb.resetView()} title="Reset view: restore default camera — not Recenter">
          Reset view
        </button>
        <button
          type="button"
          onClick={() => tb.resetWorldScaleToDefault()}
          title="Reset scale: uniform graph scale toward 1 — not Recenter or Reset view"
        >
          Reset scale
        </button>
        <p className="toolbar-menu-hint" title={copyRecenterVsResetShort()}>
          Recenter / Reset view / Reset scale differ — hover this line for detail.
        </p>
      </ToolbarMenu>

      <ToolbarMenu menuId="edit" openMenu={openMenu} setOpenMenu={setOpenMenu} label="Edit">
        <button type="button" onClick={() => tb.undo()}>
          Undo
        </button>
        <button type="button" onClick={() => tb.redo()}>
          Redo
        </button>
        <button type="button" onClick={() => tb.openSearch()}>
          Search…
        </button>
        <p className="toolbar-menu-hint">Shortcuts: ⌘Z / ⌘⇧Z, ⌘K</p>
      </ToolbarMenu>

      <ToolbarMenu menuId="layout" openMenu={openMenu} setOpenMenu={setOpenMenu} label="Layout">
        <StructureMenuContent />
      </ToolbarMenu>

      <button
        id="toolbar-settings-button"
        type="button"
        onClick={() => {
          setOpenMenu(null)
          tb.openSettings()
        }}
      >
        Settings
      </button>

      <span
        className="toolbar-save-hint"
        style={{
          fontSize: 12,
          color: feedbackMessage?.tone === 'error' || saveIndicator === 'error' ? '#b91c1c' : '#64748b',
          marginRight: 10,
          maxWidth: 220,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={feedbackMessage?.text}
      >
        {feedbackMessage?.text
          ? feedbackMessage.text
          : saveIndicator === 'pending'
            ? 'Save pending…'
            : saveIndicator === 'saving'
              ? 'Saving…'
              : saveIndicator === 'saved'
                ? 'Saved'
                : saveIndicator === 'error'
                  ? 'Save failed'
                  : ''}
      </span>
      <span className="toolbar-project-name">{project?.name ?? ''}</span>
    </div>
    </>
  )
}
