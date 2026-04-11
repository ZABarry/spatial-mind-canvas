import type { Vec3 } from '../../utils/math'
import { vec3Add, v3 } from '../../utils/math'

export function alignAxis(
  positions: Vec3[],
  axis: 0 | 1 | 2,
  mode: 'min' | 'max' | 'center' | 'average',
): Vec3[] {
  if (positions.length === 0) return []
  const coords = positions.map((p) => p[axis])
  let ref: number
  if (mode === 'min') ref = Math.min(...coords)
  else if (mode === 'max') ref = Math.max(...coords)
  else if (mode === 'average') ref = coords.reduce((a, b) => a + b, 0) / coords.length
  else ref = (Math.min(...coords) + Math.max(...coords)) / 2

  return positions.map((p) => {
    const c = [...p] as [number, number, number]
    c[axis] = ref
    return c as unknown as Vec3
  })
}

export function distributeAlongAxis(positions: Vec3[], axis: 0 | 1 | 2): Vec3[] {
  if (positions.length < 3) return positions
  const sorted = [...positions].sort((a, b) => a[axis] - b[axis])
  const min = sorted[0]![axis]
  const max = sorted[sorted.length - 1]![axis]
  const step = (max - min) / (sorted.length - 1)
  return sorted.map((p, i) => {
    const c = [...p] as [number, number, number]
    c[axis] = min + step * i
    return c as unknown as Vec3
  })
}

export function radialLayout(center: Vec3, count: number, radius: number, planeNormal: Vec3): Vec3[] {
  const out: Vec3[] = []
  const nx = planeNormal[0]
  const ny = planeNormal[1]
  const nz = planeNormal[2]
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
  const n = [nx / len, ny / len, nz / len] as const
  const u = Math.abs(n[2]) < 0.9 ? v3(0, 0, 1) : v3(0, 1, 0)
  const ux = u[1] * n[2] - u[2] * n[1]
  const uy = u[2] * n[0] - u[0] * n[2]
  const uz = u[0] * n[1] - u[1] * n[0]
  const ulen = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1
  const uu = [ux / ulen, uy / ulen, uz / ulen] as Vec3
  const vx =
    n[1] * uu[2] - n[2] * uu[1]
  const vy =
    n[2] * uu[0] - n[0] * uu[2]
  const vz =
    n[0] * uu[1] - n[1] * uu[0]
  const vlen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1
  const vv = [vx / vlen, vy / vlen, vz / vlen] as Vec3

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2
    const x = center[0] + radius * (Math.cos(t) * uu[0] + Math.sin(t) * vv[0])
    const y = center[1] + radius * (Math.cos(t) * uu[1] + Math.sin(t) * vv[1])
    const z = center[2] + radius * (Math.cos(t) * uu[2] + Math.sin(t) * vv[2])
    out.push([x, y, z])
  }
  return out
}

export function flattenToPlane(positions: Vec3[], planePoint: Vec3, planeNormal: Vec3): Vec3[] {
  const nx = planeNormal[0]
  const ny = planeNormal[1]
  const nz = planeNormal[2]
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
  const n = [nx / len, ny / len, nz / len] as const
  return positions.map((p) => {
    const dx = p[0] - planePoint[0]
    const dy = p[1] - planePoint[1]
    const dz = p[2] - planePoint[2]
    const dist = dx * n[0] + dy * n[1] + dz * n[2]
    return [p[0] - dist * n[0], p[1] - dist * n[1], p[2] - dist * n[2]] as Vec3
  })
}

export function stackAlongAxis(positions: Vec3[], axis: 0 | 1 | 2, spacing: number): Vec3[] {
  if (positions.length === 0) return []
  const sorted = [...positions].sort((a, b) => a[axis] - b[axis])
  const base = sorted[0]![axis]
  return sorted.map((p, i) => {
    const c = [...p] as [number, number, number]
    c[axis] = base + i * spacing
    return c as unknown as Vec3
  })
}

export function normalizeSpacing(positions: Vec3[], axis: 0 | 1 | 2): Vec3[] {
  return distributeAlongAxis(positions, axis)
}

export function centerClusterAround(parent: Vec3, positions: Vec3[]): Vec3[] {
  if (positions.length === 0) return []
  const cx = positions.reduce((s, p) => s + p[0], 0) / positions.length
  const cy = positions.reduce((s, p) => s + p[1], 0) / positions.length
  const cz = positions.reduce((s, p) => s + p[2], 0) / positions.length
  const delta: Vec3 = [parent[0] - cx, parent[1] - cy, parent[2] - cz]
  return positions.map((p) => vec3Add(p, delta))
}
