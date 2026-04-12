import { useEffect } from 'react'
import { useRootStore } from '../store/rootStore'

export function useDesktopShortcuts() {
  const dispatch = useRootStore((s) => s.dispatch)
  const searchOpen = useRootStore((s) => s.searchOpen)
  const project = useRootStore((s) => s.project)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          ;(t as HTMLInputElement).blur()
        }
        return
      }

      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) dispatch({ type: 'redo' })
        else dispatch({ type: 'undo' })
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void useRootStore.getState().saveNow()
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        void useRootStore.getState().newBlankProject()
        return
      }
      if (mod && (e.key === 'k' || e.key === '/')) {
        e.preventDefault()
        dispatch({ type: 'setSearchOpen', open: !searchOpen })
        return
      }

      if (e.key === 'Escape') {
        dispatch({ type: 'cancelActiveInteraction' })
        dispatch({ type: 'clearSelection' })
        dispatch({ type: 'openNodeDetail', nodeId: null })
        dispatch({ type: 'setSearchOpen', open: false })
        dispatch({ type: 'setToolMode', mode: 'select' })
        return
      }
      if (!mod && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
        dispatch({ type: 'setToolMode', mode: 'select' })
        return
      }
      if (!mod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        dispatch({ type: 'setToolMode', mode: 'create' })
        return
      }
      if (!mod && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        dispatch({ type: 'setToolMode', mode: 'link' })
        return
      }
      if (!mod && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault()
        dispatch({ type: 'setToolMode', mode: 'inspect' })
        return
      }
      if (e.key === 'Enter') {
        const id = useRootStore.getState().selection.primaryNodeId
        if (id) dispatch({ type: 'openNodeDetail', nodeId: id })
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        dispatch({ type: 'deleteSelection' })
        return
      }
      if (e.key === 'f' || e.key === 'F') {
        dispatch({ type: 'focusSelection' })
        return
      }
      if (e.key === 'Home') {
        if (!project) return
        e.preventDefault()
        dispatch({ type: 'centerViewOnSelection' })
        return
      }
      if (e.key === '.' && !mod) {
        if (!project) return
        e.preventDefault()
        dispatch({ type: 'centerViewOnSelection' })
        return
      }
      if (e.altKey && project) {
        const step = 0.35
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          dispatch({ type: 'translateWorld', delta: [-step, 0, 0] })
          return
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          dispatch({ type: 'translateWorld', delta: [step, 0, 0] })
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          dispatch({ type: 'translateWorld', delta: [0, 0, -step] })
          return
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          dispatch({ type: 'translateWorld', delta: [0, 0, step] })
          return
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, searchOpen, project])
}
