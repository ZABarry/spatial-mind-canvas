import type { Dispatch, SetStateAction } from 'react'
import { useRootStore } from '../store/rootStore'
import { ToolbarMenu, type ToolbarMenuId } from './ToolbarMenu'

type BookmarksDropdownProps = {
  openMenu: ToolbarMenuId | null
  setOpenMenu: Dispatch<SetStateAction<ToolbarMenuId | null>>
}

export function BookmarksDropdown({ openMenu, setOpenMenu }: BookmarksDropdownProps) {
  const project = useRootStore((s) => s.project)
  const dispatch = useRootStore((s) => s.dispatch)
  const count = project?.bookmarks.length ?? 0

  const label = count > 0 ? `Bookmarks (${count})` : 'Bookmarks'

  return (
    <ToolbarMenu menuId="bookmarks" openMenu={openMenu} setOpenMenu={setOpenMenu} label={label}>
      <button
        type="button"
        onClick={() => {
          const name = window.prompt('Bookmark this view', 'Saved view')
          if (name?.trim()) dispatch({ type: 'addBookmark', label: name.trim() })
        }}
      >
        Save current view…
      </button>
      {count === 0 ? (
        <p className="toolbar-menu-hint">No saved views yet.</p>
      ) : (
        <ul className="toolbar-menu-list">
          {project!.bookmarks.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="toolbar-menu-list-primary"
                onClick={() => dispatch({ type: 'recallBookmark', id: b.id })}
              >
                {b.label}
              </button>
              <button
                type="button"
                className="toolbar-menu-list-remove"
                title="Remove bookmark"
                onClick={() => dispatch({ type: 'removeBookmark', id: b.id })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </ToolbarMenu>
  )
}
