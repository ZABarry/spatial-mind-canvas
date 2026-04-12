import * as THREE from 'three'
import type { StructureToolName } from '../../input/actions'
import * as cmds from '../../ui/toolbar/sceneToolbarCommands'

/** Attached to menu hit meshes; walked upward like `nodeId`. */
export type XrMenuHit =
  | { kind: 'cmd'; cmd: XrMenuCommand }
  | { kind: 'structure'; tool: StructureToolName }
  | { kind: 'recallBookmark'; id: string }

export type XrMenuCommand =
  | 'library'
  | 'newMap'
  | 'duplicate'
  | 'clearMap'
  | 'exportJson'
  | 'exportZip'
  | 'toggleMode'
  | 'toggleAxis'
  | 'focus'
  | 'resetView'
  | 'undo'
  | 'redo'
  | 'search'
  | 'settings'
  | 'saveBookmark'
  | 'inspect'
  | 'help'

export function runXrMenuHit(hit: XrMenuHit) {
  switch (hit.kind) {
    case 'cmd':
      runCommand(hit.cmd)
      break
    case 'structure':
      cmds.runStructureTool(hit.tool)
      break
    case 'recallBookmark':
      cmds.recallBookmark(hit.id)
      break
  }
}

function runCommand(cmd: XrMenuCommand) {
  switch (cmd) {
    case 'library':
      cmds.goLibrary()
      break
    case 'newMap':
      cmds.newBlankMap()
      break
    case 'duplicate':
      cmds.duplicateMap()
      break
    case 'clearMap':
      cmds.requestClearMap()
      break
    case 'exportJson':
      cmds.exportJson()
      break
    case 'exportZip':
      cmds.exportZip()
      break
    case 'toggleMode':
      cmds.toggleTravelWorldMode()
      break
    case 'toggleAxis':
      cmds.toggleWorldAxisControls()
      break
    case 'focus':
      cmds.focusSelection()
      break
    case 'resetView':
      cmds.resetView()
      break
    case 'undo':
      cmds.undo()
      break
    case 'redo':
      cmds.redo()
      break
    case 'search':
      cmds.openSearch()
      break
    case 'settings':
      cmds.openSettings()
      break
    case 'saveBookmark':
      cmds.promptSaveBookmark()
      break
    case 'inspect':
      cmds.openInspect()
      break
    case 'help':
      cmds.openXrHelp()
      break
  }
}

/** Returns true if a menu hit was handled (stop raycast propagation). */
export function tryHandleXrMenuObject(object: THREE.Object3D): boolean {
  let o: THREE.Object3D | null = object
  while (o) {
    const hit = o.userData?.xrMenuHit as XrMenuHit | undefined
    if (hit) {
      runXrMenuHit(hit)
      return true
    }
    o = o.parent
  }
  return false
}
