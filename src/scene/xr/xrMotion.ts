/**
 * Shared damped motion helpers for XR micro-interactions (menus, panel recall, node actions).
 */

/** Exponential approach: current → target. */
export function dampScalarToward(
  current: number,
  target: number,
  lambda: number,
  deltaSec: number,
): number {
  const t = 1 - Math.exp(-lambda * deltaSec)
  return current + (target - current) * t
}
