import { nextChildPosition } from '../../graph/selectors'
import type { StructureToolName } from '../../input/actions'
import { useRootStore } from '../../store/rootStore'
import * as cmds from '../../ui/toolbar/sceneToolbarCommands'
import { xrLastNodeSelectControllerIndex } from './xrSelectionRefs'

/** Contextual node actions (VR strip / future surfaces) — not on the global wrist panel. */
export function runNodeInspect() {
  cmds.openInspect()
}

export function runNodeAddChild() {
  const st = useRootStore.getState()
  const p = st.project
  const id = st.selection.primaryNodeId
  if (!p || !id) return
  const node = p.graph.nodes[id]
  if (!node) return
  const beforeIds = new Set(Object.keys(p.graph.nodes))
  st.dispatch({
    type: 'createNodeAt',
    position: nextChildPosition(p.graph, node),
    parentId: id,
    connectFromId: id,
  })
  const after = useRootStore.getState().project
  if (!after) return
  const newId = Object.keys(after.graph.nodes).find((nid) => !beforeIds.has(nid))
  if (newId) st.dispatch({ type: 'selectNodes', ids: [newId], additive: false })
}

export function runNodeDelete() {
  const st = useRootStore.getState()
  const id = st.selection.primaryNodeId
  if (!id) return
  st.dispatch({ type: 'deleteNode', id })
  st.dispatch({ type: 'openNodeDetail', nodeId: null })
}

export function runNodeFocus() {
  cmds.focusSelection()
}

export function runNodeRecenter() {
  cmds.centerViewOnSelection()
}

export function runNodeStartLink() {
  const st = useRootStore.getState()
  const id = st.selection.primaryNodeId
  if (!id) return
  const idx = xrLastNodeSelectControllerIndex.current
  st.dispatch({
    type: 'startConnection',
    fromNodeId: id,
    ...(idx != null ? { xrControllerIndex: idx } : {}),
  })
}

export function runNodeStructureTool(tool: StructureToolName) {
  cmds.runStructureTool(tool)
}

export function runRecallBookmark(id: string) {
  cmds.recallBookmark(id)
}
