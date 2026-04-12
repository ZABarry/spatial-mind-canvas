import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { NodeEntity } from '../../graph/types'
import { useRootStore } from '../../store/rootStore'
import { LabelBillboard } from './LabelBillboard'
import { nodeShapeHalfExtents } from './nodeGeometry'
import type { Vec3, WorldTransformLike } from '../../utils/math'
import {
  graphLocalDeltaToParentPositionDelta,
  graphPointToWorld,
  NO_XR_COMFORT,
  v3,
  XR_STANDING_GRAPH_OFFSET,
} from '../../utils/math'

const GIZMO_LEN = 0.44
/** Extra length beyond mesh bounds so axis handles stay grabbable (esp. tall capsule / pill). */
const GIZMO_CLEARANCE = 0.12
const GIZMO_RADIUS = 0.021
/** Wider invisible collider so picking the axis is reliable. */
const GIZMO_HIT_RADIUS = GIZMO_RADIUS * 3.0
const EMISSIVE_IDLE = 0.25
const EMISSIVE_HOVER = 0.55
const EMISSIVE_DRAG = 0.75
const AXIS: Array<{ key: 0 | 1 | 2; color: string; label: string; rot: [number, number, number] }> = [
  { key: 0, color: '#e11d48', label: 'X', rot: [0, 0, -Math.PI / 2] },
  { key: 1, color: '#16a34a', label: 'Y', rot: [0, 0, 0] },
  { key: 2, color: '#2563eb', label: 'Z', rot: [Math.PI / 2, 0, 0] },
]

type DragTarget = { kind: 'world' } | { kind: 'node'; nodeId: string }

type DragSession = {
  axis: 0 | 1 | 2
  target: DragTarget
  /** Snapshot at drag start (parent-space world root position for world handles; graph node position for nodes). */
  posStart: Vec3
  pointerId: number
  startClientX: number
  startClientY: number
}

const _vProj0 = new THREE.Vector3()
const _vProj1 = new THREE.Vector3()

const MIN_PX_PER_GRAPH_UNIT = 14

/**
 * Screen-space basis for 1D drag along a graph axis: project anchor and anchor+axisStep,
 * measure pixel delta per graph unit and the axis direction on the canvas.
 */
function computeAxisScreenDragBasis(
  wt: WorldTransformLike,
  comfort: Vec3,
  anchorGraph: Vec3,
  axis: 0 | 1 | 2,
  camera: THREE.Camera,
  dom: HTMLElement,
): { screenDirX: number; screenDirY: number; pixelsPerGraphUnit: number } {
  const w0 = graphPointToWorld(wt, anchorGraph, comfort)
  const e = axis === 0 ? v3(1, 0, 0) : axis === 1 ? v3(0, 1, 0) : v3(0, 0, 1)
  const dWorld = graphLocalDeltaToParentPositionDelta(wt, e)
  const w1: Vec3 = [w0[0] + dWorld[0], w0[1] + dWorld[1], w0[2] + dWorld[2]]

  _vProj0.set(w0[0], w0[1], w0[2]).project(camera)
  _vProj1.set(w1[0], w1[1], w1[2]).project(camera)

  const rect = dom.getBoundingClientRect()
  const sx = (_vProj1.x - _vProj0.x) * 0.5 * rect.width
  const sy = -(_vProj1.y - _vProj0.y) * 0.5 * rect.height
  const len = Math.hypot(sx, sy)

  if (len < 4) {
    return { screenDirX: 1, screenDirY: 0, pixelsPerGraphUnit: MIN_PX_PER_GRAPH_UNIT }
  }

  return {
    screenDirX: sx / len,
    screenDirY: sy / len,
    pixelsPerGraphUnit: Math.max(len, MIN_PX_PER_GRAPH_UNIT),
  }
}

function syncOrbitEnableFromStore(controls: { enableRotate?: boolean } | null) {
  if (!controls || typeof controls.enableRotate !== 'boolean') return
  const st = useRootStore.getState()
  const ik = st.interactionSession.kind
  controls.enableRotate = !(
    ik === 'nodeDrag' || ik === 'link' || st.worldAxisDragActive
  )
}

function useAxisPointerDrag(
  target: DragTarget,
  opts?: {
    onDragStart?: (axis: 0 | 1 | 2) => void
    onDragEnd?: () => void
  },
) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as { enableRotate?: boolean } | null
  const sessionRef = useRef<DragSession | null>(null)

  const applyMove = useCallback(
    (clientX: number, clientY: number) => {
      const s = sessionRef.current
      if (!s) return
      const st = useRootStore.getState()
      const proj = st.project
      if (!proj) return
      const wt = proj.worldTransform
      const comfort = gl.xr.isPresenting ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT

      let anchorGraph: Vec3
      if (s.target.kind === 'world') {
        anchorGraph = v3(0, 0, 0)
      } else {
        const n = proj.graph.nodes[s.target.nodeId]
        if (!n || n.pinned) return
        anchorGraph = [n.position[0], n.position[1], n.position[2]]
      }

      const basis = computeAxisScreenDragBasis(wt, comfort, anchorGraph, s.axis, camera, gl.domElement)
      const along =
        (clientX - s.startClientX) * basis.screenDirX + (clientY - s.startClientY) * basis.screenDirY
      const da = along / basis.pixelsPerGraphUnit

      if (s.target.kind === 'world') {
        const ld =
          s.axis === 0 ? v3(da, 0, 0) : s.axis === 1 ? v3(0, da, 0) : v3(0, 0, da)
        const parentD = graphLocalDeltaToParentPositionDelta(wt, ld)
        const newPos: Vec3 = [
          s.posStart[0] + parentD[0],
          s.posStart[1] + parentD[1],
          s.posStart[2] + parentD[2],
        ]
        st.dispatch({ type: 'setWorldPosition', position: newPos })
      } else {
        const node = proj.graph.nodes[s.target.nodeId]
        if (!node) return
        const ax = s.axis
        const v = s.posStart[ax] + da
        const np =
          ax === 0
            ? v3(v, s.posStart[1], s.posStart[2])
            : ax === 1
              ? v3(s.posStart[0], v, s.posStart[2])
              : v3(s.posStart[0], s.posStart[1], v)
        st.dispatch({ type: 'moveNode', nodeId: s.target.nodeId, position: np })
      }
    },
    [camera, gl],
  )

  const end = useCallback(() => {
    sessionRef.current = null
  }, [])

  const onPointerDown = useCallback(
    (axis: 0 | 1 | 2, e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const ev = e.nativeEvent
      ev.preventDefault()

      const st = useRootStore.getState()
      if (st.interactionSession.kind === 'link') return
      const proj = st.project
      if (!proj) return
      const wt = proj.worldTransform

      if (target.kind === 'node') {
        const node = proj.graph.nodes[target.nodeId]
        if (!node || node.pinned) return
      }

      let posStart: Vec3
      if (target.kind === 'world') {
        posStart = [wt.position[0], wt.position[1], wt.position[2]]
      } else {
        const n = proj.graph.nodes[target.nodeId]
        if (!n) return
        posStart = [n.position[0], n.position[1], n.position[2]]
      }

      sessionRef.current = {
        axis,
        target,
        posStart,
        pointerId: ev.pointerId,
        startClientX: ev.clientX,
        startClientY: ev.clientY,
      }

      if (target.kind === 'node') {
        st.dispatch({ type: 'setNodeDragActive', active: true, nodeId: target.nodeId })
      } else {
        st.dispatch({ type: 'setWorldAxisDragActive', active: true })
      }
      syncOrbitEnableFromStore(controls)
      opts?.onDragStart?.(axis)
      gl.domElement.setPointerCapture?.(ev.pointerId)

      const onMove = (pe: PointerEvent) => {
        if (pe.pointerId !== sessionRef.current?.pointerId) return
        applyMove(pe.clientX, pe.clientY)
      }
      const onUp = (pe: PointerEvent) => {
        if (pe.pointerId !== sessionRef.current?.pointerId) return
        if (gl.domElement.hasPointerCapture?.(pe.pointerId)) {
          gl.domElement.releasePointerCapture(pe.pointerId)
        }
        gl.domElement.removeEventListener('pointermove', onMove, { capture: true })
        gl.domElement.removeEventListener('pointerup', onUp, { capture: true })
        gl.domElement.removeEventListener('pointercancel', onUp, { capture: true })
        end()
        if (target.kind === 'node') {
          useRootStore.getState().dispatch({ type: 'setNodeDragActive', active: false })
        } else {
          useRootStore.getState().dispatch({ type: 'setWorldAxisDragActive', active: false })
        }
        syncOrbitEnableFromStore(controls)
        opts?.onDragEnd?.()
      }
      gl.domElement.addEventListener('pointermove', onMove, { capture: true })
      gl.domElement.addEventListener('pointerup', onUp, { capture: true })
      gl.domElement.addEventListener('pointercancel', onUp, { capture: true })
    },
    [applyMove, controls, end, gl, opts, target],
  )

  return onPointerDown
}

function AxisTriplet({
  /** Parent-local offset for the gizmo mesh (node handles sit at the node’s origin). */
  groupPosition,
  target,
  /** Per-axis arrow length from origin; defaults to uniform `GIZMO_LEN`. */
  axisLens,
}: {
  groupPosition: Vec3
  target: DragTarget
  axisLens?: [number, number, number]
}) {
  const lens = axisLens ?? [GIZMO_LEN, GIZMO_LEN, GIZMO_LEN]
  const gl = useThree((s) => s.gl)
  const [hovered, setHovered] = useState<0 | 1 | 2 | null>(null)
  const [dragAxis, setDragAxis] = useState<0 | 1 | 2 | null>(null)

  const axisCursor =
    dragAxis != null ? 'grabbing' : hovered != null ? 'grab' : ''

  useEffect(() => {
    const el = gl.domElement
    /* R3F: axis gizmo hover/drag cursor on the WebGL canvas — not mutating `gl`, only its DOM surface. */
    // eslint-disable-next-line react-hooks/immutability -- canvas.style is the supported way to sync pointer cursor with R3F
    el.style.cursor = axisCursor
    return () => {
      el.style.cursor = ''
    }
  }, [gl, axisCursor])

  const dragOpts = useMemo(
    () => ({
      onDragStart: (axis: 0 | 1 | 2) => {
        setDragAxis(axis)
      },
      onDragEnd: () => {
        setDragAxis(null)
      },
    }),
    [],
  )

  const onPointerDown = useAxisPointerDrag(target, dragOpts)

  return (
    <group position={groupPosition}>
      {AXIS.map(({ key, color, label, rot }) => {
        const len = lens[key]
        const emphasis = dragAxis === key || hovered === key
        const emissive = dragAxis === key ? EMISSIVE_DRAG : emphasis ? EMISSIVE_HOVER : EMISSIVE_IDLE
        return (
          <group key={key} rotation={rot}>
            <mesh
              position={[0, len * 0.5, 0]}
              userData={{ axisHandle: key, axisTarget: target.kind }}
              onPointerDown={(e) => onPointerDown(key, e)}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(key)
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                setHovered(null)
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <cylinderGeometry args={[GIZMO_HIT_RADIUS, GIZMO_HIT_RADIUS, len, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh position={[0, len * 0.5, 0]} raycast={() => null}>
              <cylinderGeometry args={[GIZMO_RADIUS, GIZMO_RADIUS, len, 10]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.4} />
            </mesh>
            <group position={[0, len + 0.12, 0]}>
              <LabelBillboard>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.16}
                  color={color}
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.02}
                  outlineColor="#ffffff"
                >
                  {label}
                </Text>
              </LabelBillboard>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/** X/Y/Z handles at graph origin; dragging a handle translates the world root along that graph axis. */
export function WorldAxisGuides() {
  const on = useRootStore((s) => s.project?.settings.worldAxisControls === true)
  if (!on) return null
  const o = v3(0, 0, 0)
  return <AxisTriplet groupPosition={o} target={{ kind: 'world' }} />
}

/** Per-node axis handles (same graph-local axes as the world gizmo). Render inside a group already at the node position. */
export function NodeAxisGuides({ n }: { n: NodeEntity }) {
  const on = useRootStore((s) => s.project?.settings.worldAxisControls === true)
  if (!on) return null
  const o = v3(0, 0, 0)
  const half = nodeShapeHalfExtents(n.shape, n.size)
  const axisLens: [number, number, number] = [
    Math.max(GIZMO_LEN, half.x + GIZMO_CLEARANCE),
    Math.max(GIZMO_LEN, half.y + GIZMO_CLEARANCE),
    Math.max(GIZMO_LEN, half.z + GIZMO_CLEARANCE),
  ]
  return (
    <AxisTriplet
      groupPosition={o}
      target={{ kind: 'node', nodeId: n.id }}
      axisLens={axisLens}
    />
  )
}
