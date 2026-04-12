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
  const project = useRootStore((s) => s.project)
  const worldAxisControls = project?.settings.worldAxisControls === true

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
        <button type="button" className="primary" onClick={() => void tb.enterVr()}>
          Enter VR
        </button>
        <button type="button" onClick={() => tb.toggleTravelWorldMode()}>
          {mode === 'travel' ? 'Switch to world mode' : 'Switch to travel mode'}
        </button>
        <button
          type="button"
          className={worldAxisControls ? 'primary' : undefined}
          onClick={() => tb.toggleWorldAxisControls()}
        >
          {worldAxisControls ? 'World axis controls on' : 'World axis controls off'}
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
