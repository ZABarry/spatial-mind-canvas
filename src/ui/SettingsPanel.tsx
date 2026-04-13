import { useEffect, useLayoutEffect, useRef } from 'react'
import { useRootStore } from '../store/rootStore'
import { SettingsFormBody } from './panels/SettingsFormBody'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableRoots(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && !el.closest('[hidden]'),
  )
}

export function SettingsPanel() {
  const open = useRootStore((s) => s.settingsOpen)
  const project = useRootStore((s) => s.project)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!open || !project) return
    const active = document.activeElement
    previousFocusRef.current = active instanceof HTMLElement ? active : null
    return () => {
      const prev = previousFocusRef.current
      if (prev && prev !== document.body && document.body.contains(prev)) {
        prev.focus()
        return
      }
      const opener = document.getElementById('toolbar-settings-button')
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [open, project])

  useEffect(() => {
    if (!open || !project) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        useRootStore.setState({ settingsOpen: false })
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, project])

  useEffect(() => {
    if (!open || !project || !dialogRef.current) return
    const root = dialogRef.current
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const list = getFocusableRoots(root)
      if (list.length === 0) return
      const first = list[0]!
      const last = list[list.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [open, project])

  if (!open || !project) return null

  return (
    <div
      className="modal-backdrop settings-modal-backdrop"
      role="presentation"
      onClick={() => useRootStore.setState({ settingsOpen: false })}
    >
      <div
        ref={dialogRef}
        className="modal settings-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsFormBody variant="desktop" />
      </div>
    </div>
  )
}
