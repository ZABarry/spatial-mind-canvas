/** Centralized UX copy for XR + shared surfaces (hand-tracking limits, recovery terms). */

export const COPY_HAND_TRACKING_LITE =
  'Hand-tracking mode: Child & Inspect on node actions; controllers are required for full Link authoring.'

export const COPY_CONTROLLERS_FOR_LINK =
  'Link needs tracked controllers for reliable aiming — use Child to branch without Link.'

export const COPY_WRIST_VS_RADIAL =
  'Wrist menu: global actions (Library, Undo, Reset view, Recenter…). Node actions: actions for the selected node.'

export const COPY_WORLD_VS_TRAVEL_SHORT =
  'World: edit the graph in place. Travel: move through space with the thumbsticks.'

export function copyRecenterVsResetShort(): string {
  return 'Recenter: align the primary node with your view pivot. Reset view: camera framing. Reset scale: graph size.'
}
