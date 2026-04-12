import type { StructureToolName } from '../../input/actions'
import * as cmds from '../../ui/toolbar/sceneToolbarCommands'

/** Contextual node actions (radial / future hand menus) — not on the global wrist panel. */
export function runNodeInspect() {
  cmds.openInspect()
}

export function runNodeStructureTool(tool: StructureToolName) {
  cmds.runStructureTool(tool)
}

export function runRecallBookmark(id: string) {
  cmds.recallBookmark(id)
}
