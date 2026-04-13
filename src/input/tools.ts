import type { InteractionMode } from '../graph/types'

/** How the user moves in space vs manipulates the graph frame. */
export type NavigationMode = 'world' | 'travel'

export function navigationModeFromInteractionMode(mode: InteractionMode): NavigationMode {
  return mode === 'travel' ? 'travel' : 'world'
}

export function interactionModeFromNavigationMode(nav: NavigationMode): InteractionMode {
  return nav === 'travel' ? 'travel' : 'worldManip'
}
