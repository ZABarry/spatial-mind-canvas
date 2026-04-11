import { xrStore } from '../scene/xrStore'
import { useRootStore } from '../store/rootStore'
import { StructureMenu } from './StructureMenu'
import { BookmarksMenu } from './BookmarksMenu'

export function MainToolbar() {
  const goHome = useRootStore((s) => s.goHome)
  const mode = useRootStore((s) => s.interactionMode)
  const dispatch = useRootStore((s) => s.dispatch)
  const newBlank = useRootStore((s) => s.newBlankProject)
  const exportProject = useRootStore((s) => s.exportProject)
  const exportProjectZip = useRootStore((s) => s.exportProjectZip)
  const clearMap = useRootStore((s) => s.clearCurrentMap)
  const duplicate = useRootStore((s) => s.duplicateCurrentProject)
  const project = useRootStore((s) => s.project)
  const worldAxisControls = project?.settings.worldAxisControls === true

  return (
    <div className="toolbar panel">
      <button type="button" onClick={() => goHome()}>
        Library
      </button>
      <button type="button" onClick={() => void newBlank()}>
        New map
      </button>
      <button type="button" onClick={() => void duplicate()}>
        Duplicate map
      </button>
      <button
        type="button"
        onClick={() =>
          useRootStore.setState({
            confirmDialog: {
              title: 'Clear this map',
              message:
                'Remove all nodes, edges, and bookmarks from the current map? The project stays; only content is cleared.',
              onConfirm: () => clearMap(),
            },
          })
        }
      >
        Clear map
      </button>
      <button type="button" onClick={() => exportProject()}>
        Export JSON
      </button>
      <button type="button" onClick={() => void exportProjectZip()}>
        Export ZIP
      </button>
      <button
        type="button"
        onClick={() => {
          const label = window.prompt('Bookmark this view', 'Saved view')
          if (label?.trim()) dispatch({ type: 'addBookmark', label: label.trim() })
        }}
      >
        Save bookmark
      </button>
      <BookmarksMenu />
      <button type="button" className="primary" onClick={() => void xrStore.enterVR()}>
        Enter VR
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'setInteractionMode', mode: mode === 'travel' ? 'worldManip' : 'travel' })}
      >
        {mode === 'travel' ? 'World mode' : 'Travel mode'}
      </button>
      <button
        type="button"
        className={worldAxisControls ? 'primary' : undefined}
        onClick={() =>
          dispatch({
            type: 'patchSettings',
            patch: { worldAxisControls: !worldAxisControls },
          })
        }
      >
        {worldAxisControls ? 'Axis controls on' : 'Axis controls'}
      </button>
      <button type="button" onClick={() => dispatch({ type: 'undo' })}>
        Undo
      </button>
      <button type="button" onClick={() => dispatch({ type: 'redo' })}>
        Redo
      </button>
      <button type="button" onClick={() => dispatch({ type: 'setSearchOpen', open: true })}>
        Search
      </button>
      <button type="button" onClick={() => dispatch({ type: 'focusSelection' })}>
        Focus
      </button>
      <button type="button" onClick={() => dispatch({ type: 'resetWorld' })}>
        Reset view
      </button>
      <button
        type="button"
        onClick={() => useRootStore.setState({ settingsOpen: true })}
      >
        Settings
      </button>
      <StructureMenu />
      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
        {project?.name ?? ''}
      </span>
    </div>
  )
}
