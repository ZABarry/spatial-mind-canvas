import { useEffect, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'

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
  const rootRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current
      if (!root?.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [isOpen, setOpenMenu])

  return (
    <details ref={rootRef} className="toolbar-menu" open={isOpen}>
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
