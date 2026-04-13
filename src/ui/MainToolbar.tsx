import { useState } from 'react'
import { useRootStore } from '../store/rootStore'
import * as tb from './toolbar/sceneToolbarCommands'
import { BookmarksDropdown } from './BookmarksMenu'
import { StructureMenuContent } from './StructureMenu'
import { ToolbarMenu, type ToolbarMenuId } from './ToolbarMenu'

export function MainToolbar() {
  const [openMenu, setOpenMenu] = useState<ToolbarMenuId | null>(null)
  const xrSession = useRootStore((s) => s.xrSessionActive)
  const mode = useRootStore((s) => s.interactionMode)
  const navMode = useRootStore((s) => s.navigationMode)
  const project = useRootStore((s) => s.project)
  const worldAxisControls = project?.settings.worldAxisControls === true
  const floorGridOn = project?.settings.floorGrid !== false

  if (xrSession) return null

  return (
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
        >
          World
        </button>
        <button
          type="button"
          className={navMode === 'travel' ? 'toggle-on' : undefined}
          onClick={() => tb.setNavigationMode('travel')}
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
        <button type="button" onClick={() => void tb.duplicateMap()}>
          Duplicate map
        </button>
        <button type="button" className="toolbar-menu-danger" onClick={() => tb.requestClearMap()}>
          Clear map…
        </button>
        <button type="button" onClick={() => tb.exportJson()}>
          Export JSON
        </button>
        <button type="button" onClick={() => void tb.exportZip()}>
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
          Focus selection
        </button>
        <button type="button" onClick={() => tb.resetView()}>
          Reset view
        </button>
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
        type="button"
        onClick={() => {
          setOpenMenu(null)
          tb.openSettings()
        }}
      >
        Settings
      </button>

      <span className="toolbar-project-name">{project?.name ?? ''}</span>
    </div>
  )
}
