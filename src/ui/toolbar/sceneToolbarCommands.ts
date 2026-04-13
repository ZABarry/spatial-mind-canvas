import { xrStore } from '../../scene/xrStore'
import { useRootStore } from '../../store/rootStore'
import type { StructureToolName } from '../../input/actions'
import type { NavigationMode } from '../../input/tools'

export function goLibrary() {
  useRootStore.getState().goHome()
}

export function newBlankMap() {
  void useRootStore.getState().newBlankProject()
}

export function duplicateMap() {
  void useRootStore.getState().duplicateCurrentProject()
}

export function requestClearMap() {
  useRootStore.setState({
    confirmDialog: {
      title: 'Clear this map',
      message:
        'Remove all nodes, edges, and bookmarks from the current map? The project stays; only content is cleared.',
      onConfirm: () => useRootStore.getState().clearCurrentMap(),
    },
  })
}

export function exportJson() {
  useRootStore.getState().exportProject()
}

export function exportZip() {
  void useRootStore.getState().exportProjectZip()
}

export function enterVr() {
  const st = useRootStore.getState()
  const preferPt = st.devicePreferences.preferXrPassthrough === true
  void (async () => {
    try {
      if (preferPt && (await navigator.xr?.isSessionSupported('immersive-ar'))) {
        await xrStore.enterAR()
        return
      }
      await xrStore.enterVR()
    } catch (e) {
      console.error('Enter VR failed:', e)
    }
  })()
}

/** Toggle between opaque VR and mixed (camera) reality; independent of travel vs world manipulation mode. */
export function toggleCameraPassthrough() {
  const session = xrStore.getState().session
  if (session == null) return

  const nextMode: XRSessionMode =
    session.environmentBlendMode === 'opaque' ? 'immersive-ar' : 'immersive-vr'

  void (async () => {
    try {
      await new Promise<void>((resolve, reject) => {
        const t = window.setTimeout(() => reject(new Error('XR session end timed out')), 12_000)
        const onEnd = () => {
          clearTimeout(t)
          resolve()
        }
        session.addEventListener('end', onEnd, { once: true })
        session.end()
      })
      if (nextMode === 'immersive-ar') {
        const arOk = (await navigator.xr?.isSessionSupported('immersive-ar')) ?? false
        if (!arOk) return
        await xrStore.enterAR()
        return
      }
      await xrStore.enterVR()
    } catch (e) {
      console.error(e)
    }
  })()
}

export function toggleTravelWorldMode() {
  const st = useRootStore.getState()
  const mode = st.interactionMode
  st.dispatch({ type: 'setInteractionMode', mode: mode === 'travel' ? 'worldManip' : 'travel' })
}

export function setNavigationMode(mode: NavigationMode) {
  useRootStore.getState().dispatch({ type: 'setNavigationMode', mode })
}

export function toggleWorldAxisControls() {
  const st = useRootStore.getState()
  const on = st.project?.settings.worldAxisControls === true
  st.dispatch({ type: 'patchSettings', patch: { worldAxisControls: !on } })
}

export function toggleFloorGrid() {
  const st = useRootStore.getState()
  const on = st.project?.settings.floorGrid !== false
  st.dispatch({ type: 'patchSettings', patch: { floorGrid: !on } })
}

export function focusSelection() {
  useRootStore.getState().dispatch({ type: 'focusSelection' })
}

export function resetView() {
  useRootStore.getState().dispatch({ type: 'resetWorld' })
}

export function centerViewOnSelection() {
  useRootStore.getState().dispatch({ type: 'centerViewOnSelection' })
}

/** Sets world graph scale multiplier back to 1 (undo stack may still apply). */
export function resetWorldScaleToDefault() {
  const st = useRootStore.getState()
  const p = st.project
  if (!p) return
  const s = p.worldTransform.scale
  if (s <= 0) return
  st.dispatch({ type: 'scaleWorld', factor: 1 / s })
}

/** Close drafts, panels, and search — recovery from a stuck interaction. */
export function cancelInteraction() {
  const st = useRootStore.getState()
  st.dispatch({ type: 'cancelActiveInteraction' })
  st.dispatch({ type: 'openNodeDetail', nodeId: null })
  st.dispatch({ type: 'setPlacementPreview', preview: null })
  st.dispatch({ type: 'setSearchOpen', open: false })
}

export function undo() {
  useRootStore.getState().dispatch({ type: 'undo' })
}

export function redo() {
  useRootStore.getState().dispatch({ type: 'redo' })
}

export function openSearch() {
  useRootStore.getState().dispatch({ type: 'setSearchOpen', open: true })
}

export function openSettings() {
  useRootStore.setState({ settingsOpen: true })
}

export function runStructureTool(tool: StructureToolName) {
  useRootStore.getState().dispatch({ type: 'structureTool', tool })
}

export function promptSaveBookmark() {
  const st = useRootStore.getState()
  if (st.xrSessionActive) {
    useRootStore.setState({
      textPromptDialog: {
        title: 'Bookmark this view',
        defaultValue: 'Saved view',
        onSubmit: (name) => {
          if (name) useRootStore.getState().dispatch({ type: 'addBookmark', label: name })
        },
      },
    })
    return
  }
  const name = window.prompt('Bookmark this view', 'Saved view')
  if (name?.trim()) useRootStore.getState().dispatch({ type: 'addBookmark', label: name.trim() })
}

/** Open node inspector for exactly one selected node (wrist menu in VR). */
export function openInspect() {
  const st = useRootStore.getState()
  if (st.selection.nodeIds.length !== 1) return
  const id = st.selection.nodeIds[0]
  if (id && st.project?.graph.nodes[id]) {
    st.dispatch({ type: 'openNodeDetail', nodeId: id })
  }
}

export function openXrHelp() {
  useRootStore.setState({ xrHelpOpen: true })
}

export function recallBookmark(id: string) {
  useRootStore.getState().dispatch({ type: 'recallBookmark', id })
}

export function removeBookmark(id: string) {
  useRootStore.getState().dispatch({ type: 'removeBookmark', id })
}
