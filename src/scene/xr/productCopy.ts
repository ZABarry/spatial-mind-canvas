/** Centralized UX copy for XR + shared surfaces (hand-tracking limits, recovery terms). */

export const COPY_HAND_TRACKING_LITE =
  'Hand-tracking mode: Child & Inspect on node actions; controllers are required for full Link authoring.'

export const COPY_CONTROLLERS_FOR_LINK =
  'Controllers — use Child to branch without Link, or pair controllers for Link.'

/** Shown near the disabled Link control in hand mode (short line). */
export const COPY_LINK_CONTROLLERS_BADGE = 'Controllers'

export const COPY_WRIST_VS_RADIAL =
  'Wrist menu: two pages with a short page slide — workflow first (Search, Undo, Recenter, Cancel, Travel/World, Help, Settings, Exit) + More for Library, history, recovery. Node actions: tiered strip with Delete separated.'

export const COPY_WORLD_VS_TRAVEL_SHORT =
  'World: edit the graph in place. Travel: move through space with the thumbsticks.'

export function copyRecenterVsResetShort(): string {
  return 'Recenter: align the primary node with your view pivot. Reset view: camera framing. Reset scale: graph size.'
}

/** VR help overlay — one topic per line; keep in sync with XrHelpHud. */
export const XR_HELP_TIPS: readonly string[] = [
  'Travel vs world — Travel: left stick moves/strafes, right stick turns (dominant hand in Settings biases aim only). World: no locomotion; trigger selects; grip or hand pinch moves/scales the graph when not in a menu or modal.',
  'Recovery — Reset view: default camera framing. Recenter: orbit pivot to primary selection. Reset scale: graph scale to 1. Cancel: closes panels, help, and in-progress gestures.',
  'Scene — Trigger selects nodes. With a link active, aim at another node or the plane to finish; aim at the source node to cancel. Controllers use the trigger; hand tracking uses the pointer.',
  'Panels — Search, detail, settings, etc. use left/center/right lanes: they open in a comfortable zone, then settle as workspace surfaces (not face-glued). Wrist menu → More… → Recall panels if a panel feels lost.',
  'Wrist menu — Y (controllers) or palm toward you (hands). Page 1: Search, Undo, Recenter, Cancel, Travel/World, Help, Settings, More…, Exit VR (full width). Page 2: Library, History, Bookmarks, Redo, Reset view, Reset scale, Recall panels, Back.',
  'Node actions — Primary: Child, Link (controllers), Inspect. Secondary: Focus, Recenter. Delete is separated to the side. Hand mode: Link shows a Controllers badge; Child and Inspect stay available.',
  'Hand mode — Select, wrist menu, optional pinch workspace grab (World mode; can disable in Settings), node actions, Cancel. Controllers remain the authoring path for Link and precision edits.',
  'Passthrough — Prefer camera passthrough when entering XR under Device & VR in Settings.',
  'World grab — World mode: controllers squeeze grip; hands: index–thumb pinch (hand-local cue + status when relevant). One hand: move. Two: scale and gentle yaw (thresholds reduce accidental coupling). Blocked while linking, dragging, or using wrist/menu/node-actions/modals.',
]
