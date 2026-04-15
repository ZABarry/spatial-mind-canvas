/**
 * R3F canvas `onPointerMissed` runs when a `click` raycast hits nothing. After `pointerup`,
 * orbit damping can move the camera before the synthetic `click`, so the ray misses the node
 * even when the cursor barely moved — selection was already set on `pointerdown`.
 *
 * We (1) suppress the **next** canvas miss once after a node press, and (2) keep a loose
 * screen-space anchor as a fallback when that flag was already cleared.
 */
let nodePressAnchor: { x: number; y: number; t: number } | null = null
/** True after `recordNodePressAnchor` until the next `onPointerMissed` or `clearNodePressAnchor`. */
let suppressNextCanvasMissClear = false

const ANCHOR_MAX_AGE_MS = 900
const ANCHOR_MAX_DISTANCE_PX = 48

export function recordNodePressAnchor(ev: Pick<PointerEvent, 'clientX' | 'clientY'>) {
  nodePressAnchor = { x: ev.clientX, y: ev.clientY, t: performance.now() }
  suppressNextCanvasMissClear = true
}

export function clearNodePressAnchor() {
  nodePressAnchor = null
  suppressNextCanvasMissClear = false
}

/** @returns true if this miss should not clear selection (anchor consumed). */
export function consumeSpuriousCanvasMissAfterNodePress(e: Pick<MouseEvent, 'clientX' | 'clientY'>): boolean {
  if (suppressNextCanvasMissClear) {
    suppressNextCanvasMissClear = false
    nodePressAnchor = null
    return true
  }
  const a = nodePressAnchor
  nodePressAnchor = null
  if (!a) return false
  if (performance.now() - a.t > ANCHOR_MAX_AGE_MS) return false
  const d = Math.hypot(e.clientX - a.x, e.clientY - a.y)
  return d < ANCHOR_MAX_DISTANCE_PX
}
