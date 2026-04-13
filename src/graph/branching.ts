import type { GraphState, NodeEntity } from './types'
import type { Vec3 } from '../utils/math'
import { countDirectChildren } from './selectors'

const CHILD_STACK_Y = 0.85

/** Positions for several new children in a shallow fan from `parent` (desktop quick-branch). */
export function spawnChildBranchPositions(graph: GraphState, parent: NodeEntity, count: number): Vec3[] {
  if (count < 1) return []
  const s = parent.size
  const [px, py, pz] = parent.position
  const base = countDirectChildren(graph, parent.id)
  const radius = 1.35 * s
  const out: Vec3[] = []
  for (let i = 0; i < count; i++) {
    const siblingIndex = base + i
    const t = (i - (count - 1) / 2) * 0.62
    const x = px + Math.sin(t) * radius + 0.35 * s
    const z = pz + Math.cos(t) * 0.45 * radius
    const y = py + siblingIndex * CHILD_STACK_Y * s * 0.55
    out.push([x, y, z])
  }
  return out
}
