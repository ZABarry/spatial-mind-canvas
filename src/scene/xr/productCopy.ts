/** Centralized UX copy for XR + shared surfaces (hand-tracking limits, recovery terms). */

export const COPY_HAND_TRACKING_LITE =
  'Hand-tracking mode: Child & Inspect on node actions; controllers are required for full Link authoring.'

export const COPY_CONTROLLERS_FOR_LINK =
  'Controllers — use Child to branch without Link, or pair controllers for Link.'

/** Shown near the disabled Link control in hand mode (short line). */
export const COPY_LINK_CONTROLLERS_BADGE = 'Controllers'

export const COPY_WRIST_VS_RADIAL =
  'Wrist menu: two pages — workflow first (Search, Undo, Recenter, Cancel, Travel/World, Help, Settings, Exit) + More for Library, history, recovery. Node actions: primary/secondary cluster with Delete separated.'

export const COPY_WORLD_VS_TRAVEL_SHORT =
  'World: edit the graph in place. Travel: move through space with the thumbsticks.'

export function copyRecenterVsResetShort(): string {
  return 'Recenter: align the primary node with your view pivot. Reset view: camera framing. Reset scale: graph size.'
}
