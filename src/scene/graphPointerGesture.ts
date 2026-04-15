/**
 * R3F canvas `onPointerMissed` runs when a `click` raycast hits nothing. After `pointerup`
 * ends node drag, orbit can re-enable before `click`, so the ray may miss the node and
 * clear selection spuriously. We record a desktop node press and ignore that one miss when
 * the click lands near the same screen position.
 */
let nodePressAnchor: { x: number; y: number; t: number } | null = null

export function recordNodePressAnchor(ev: Pick<PointerEvent, 'clientX' | 'clientY'>) {
  nodePressAnchor = { x: ev.clientX, y: ev.clientY, t: performance.now() }
}

export function clearNodePressAnchor() {
  nodePressAnchor = null
}

/** @returns true if this miss should not clear selection (anchor consumed). */
export function consumeSpuriousCanvasMissAfterNodePress(e: Pick<MouseEvent, 'clientX' | 'clientY'>): boolean {
  const a = nodePressAnchor
  nodePressAnchor = null
  if (!a) return false
  if (performance.now() - a.t > 500) return false
  const d = Math.hypot(e.clientX - a.x, e.clientY - a.y)
  return d < 14
}
