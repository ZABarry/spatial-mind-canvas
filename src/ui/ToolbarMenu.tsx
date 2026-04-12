import type { Dispatch, ReactNode, SetStateAction } from 'react'

export type ToolbarMenuId = 'map' | 'bookmarks' | 'view' | 'edit' | 'layout'

type ToolbarMenuProps = {
  menuId: ToolbarMenuId
  openMenu: ToolbarMenuId | null
  setOpenMenu: Dispatch<SetStateAction<ToolbarMenuId | null>>
  label: ReactNode
  children: ReactNode
}

export function ToolbarMenu({ menuId, openMenu, setOpenMenu, label, children }: ToolbarMenuProps) {
  const isOpen = openMenu === menuId
  return (
    <details className="toolbar-menu" open={isOpen}>
      <summary
        className="toolbar-menu-summary"
        onClick={(e) => {
          e.preventDefault()
          setOpenMenu((prev) => (prev === menuId ? null : menuId))
        }}
      >
        {label}
      </summary>
      <div className="toolbar-menu-body">{children}</div>
    </details>
  )
}
