import { playInteractionCue } from '../../audio/interactionCues'
import * as cmds from '../../ui/toolbar/sceneToolbarCommands'
import { useRootStore } from '../../store/rootStore'
import { xrStore } from '../xrStore'

/** Wrist menu and global XR HUD — no node-specific actions. */
export type XrGlobalMenuCommand =
  | 'library'
  | 'search'
  | 'settings'
  | 'mapHistory'
  | 'bookmarks'
  | 'undo'
  | 'redo'
  | 'resetView'
  | 'recenterSelection'
  | 'resetScale'
  | 'cancel'
  | 'toggleMode'
  | 'help'
  | 'exitVr'
  /** Re-snap floating HTML panels to a comfortable pose in front of you. */
  | 'recallPanels'

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
    case 'mapHistory':
      cmds.openMapHistory()
      break
    case 'bookmarks':
      cmds.openBookmarksPanel()
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
    case 'recallPanels': {
      const st = useRootStore.getState()
      st.dispatch({ type: 'bumpXrPanelAnchors' })
      playInteractionCue('select', st.devicePreferences.audioEnabled)
      break
    }
  }
}
