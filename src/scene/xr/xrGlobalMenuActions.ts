import * as cmds from '../../ui/toolbar/sceneToolbarCommands'
import { xrStore } from '../xrStore'

/** Wrist menu and global XR HUD — no node-specific actions. */
export type XrGlobalMenuCommand =
  | 'library'
  | 'search'
  | 'settings'
  | 'undo'
  | 'redo'
  | 'resetView'
  | 'recenterSelection'
  | 'resetScale'
  | 'cancel'
  | 'toggleMode'
  | 'help'
  | 'exitVr'

export function runXrGlobalMenuCommand(cmd: XrGlobalMenuCommand) {
  switch (cmd) {
    case 'library':
      cmds.goLibrary()
      break
    case 'search':
      cmds.openSearch()
      break
    case 'settings':
      cmds.openSettings()
      break
    case 'undo':
      cmds.undo()
      break
    case 'redo':
      cmds.redo()
      break
    case 'resetView':
      cmds.resetView()
      break
    case 'recenterSelection':
      cmds.centerViewOnSelection()
      break
    case 'resetScale':
      cmds.resetWorldScaleToDefault()
      break
    case 'cancel':
      cmds.cancelInteraction()
      break
    case 'toggleMode':
      cmds.toggleTravelWorldMode()
      break
    case 'help':
      cmds.openXrHelp()
      break
    case 'exitVr': {
      const session = xrStore.getState().session
      session?.end()
      break
    }
  }
}
