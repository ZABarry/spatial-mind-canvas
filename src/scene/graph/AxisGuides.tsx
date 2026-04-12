import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { NodeEntity } from '../../graph/types'
import { useRootStore } from '../../store/rootStore'
import type { Vec3, WorldTransformLike } from '../../utils/math'
import {
  graphAxisDirectionParent,
  graphLocalDeltaToParentPositionDelta,
  graphPointToWorld,
  NO_XR_COMFORT,
  worldPointToGraphLocal,
  v3,
  XR_STANDING_GRAPH_OFFSET,
} from '../../utils/math'

const GIZMO_LEN = 0.44
const GIZMO_RADIUS = 0.034
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
  /** Snapshot at drag start */
  posStart: Vec3
  /** Ray/axis solve: graph units along axis from `posStart` at pointer-down (see `solveRayAxisGraphDelta`). */
  deltaStart: number
  pointerId: number
}

const _hit = new THREE.Vector3()
const _ndc = new THREE.Vector2()
const _raycaster = new THREE.Raycaster()
const _lo = new THREE.Vector3()
const _ld = new THREE.Vector3()
const _w = new THREE.Vector3()

/**
 * Closest-point parameter `t` on world line `graphPointToWorld(posStart)+t*ld` to camera ray,
 * where `ld` is world displacement per 1 graph unit along `axis`. `t` is added to posStart[axis].
 */
function solveRayAxisGraphDelta(
  clientX: number,
  clientY: number,
  camera: THREE.Camera,
  dom: HTMLElement,
  wt: WorldTransformLike,
  comfort: Vec3,
  posStart: Vec3,
  axis: 0 | 1 | 2,
): number | null {
  const rect = dom.getBoundingClientRect()
  _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
  _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
  _raycaster.setFromCamera(_ndc, camera)
  const ro = _raycaster.ray.origin
  const rd = _raycaster.ray.direction

  const e = axis === 0 ? v3(1, 0, 0) : axis === 1 ? v3(0, 1, 0) : v3(0, 0, 1)
  const ldArr = graphLocalDeltaToParentPositionDelta(wt, e)
  _ld.set(ldArr[0], ldArr[1], ldArr[2])

  const loArr = graphPointToWorld(wt, posStart, comfort)
  _lo.set(loArr[0], loArr[1], loArr[2])

  _w.subVectors(ro, _lo)
  const uu = _ld.dot(_ld)
  const uv = _ld.dot(rd)
  const vv = 1
  const uw = _ld.dot(_w)
  const vw = rd.dot(_w)

  const det = uu * vv - uv * uv
  if (Math.abs(det) < 1e-22) return null

  return (uw * vv - uv * vw) / det
}

function buildDragPlane(
  wt: WorldTransformLike,
  anchorGraph: Vec3,
  axis: 0 | 1 | 2,
  camera: THREE.Camera,
  comfort: Vec3,
): THREE.Plane {
  const anchorW = new THREE.Vector3(...graphPointToWorld(wt, anchorGraph, comfort))
  const axisW = graphAxisDirectionParent(wt, axis)
  const towardCam = new THREE.Vector3().subVectors(camera.position, anchorW)
  if (towardCam.lengthSq() < 1e-10) towardCam.set(0, 1, 0)
  else towardCam.normalize()
  let n = new THREE.Vector3().crossVectors(axisW, towardCam)
  if (n.lengthSq() < 1e-8) {
    n = new THREE.Vector3().crossVectors(axisW, new THREE.Vector3(0, 1, 0))
  }
  n.normalize()
  return new THREE.Plane().setFromNormalAndCoplanarPoint(n, anchorW)
}

function pointerToWorldOnPlane(
  clientX: number,
  clientY: number,
  camera: THREE.Camera,
  dom: HTMLElement,
  plane: THREE.Plane,
): Vec3 | null {
  const rect = dom.getBoundingClientRect()
  _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
  _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
  _raycaster.setFromCamera(_ndc, camera)
  if (!_raycaster.ray.intersectPlane(plane, _hit)) return null
  return [_hit.x, _hit.y, _hit.z]
}

function useAxisPointerDrag(
  /** Graph-space point at the gizmo center (world origin for world handles; the node’s position for node handles). */
  dragAnchorGraph: Vec3,
  target: DragTarget,
  opts?: {
    onDragStart?: (axis: 0 | 1 | 2) => void
    onDragEnd?: () => void
  },
) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
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
      const w = pointerToWorldOnPlane(clientX, clientY, camera, gl.domElement, s.plane)
      if (!w) return
      const pNowLocal = worldPointToGraphLocal(wt, w, comfort)
      const da = pNowLocal[s.axis] - s.pStartLocal[s.axis]

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
        if (!node || node.pinned) return
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
      const st = useRootStore.getState()
      if (st.connectionDraft) return
      const proj = st.project
      if (!proj) return
      const wt = proj.worldTransform
      const ev = e.nativeEvent
      const comfort = gl.xr.isPresenting ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT

      if (target.kind === 'node') {
        const node = proj.graph.nodes[target.nodeId]
        if (!node || node.pinned) return
      }

      const plane = buildDragPlane(wt, dragAnchorGraph, axis, camera, comfort)
      const w = pointerToWorldOnPlane(ev.clientX, ev.clientY, camera, gl.domElement, plane)
      if (!w) return

      const pStartLocal = worldPointToGraphLocal(wt, w, comfort)
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
        pStartLocal,
        plane,
        pointerId: ev.pointerId,
      }
      if (target.kind === 'node') {
        st.dispatch({ type: 'setNodeDragActive', active: true, nodeId: target.nodeId })
      } else {
        st.dispatch({ type: 'setWorldAxisDragActive', active: true })
      }
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
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
        gl.domElement.removeEventListener('pointercancel', onUp)
        end()
        if (target.kind === 'node') {
          useRootStore.getState().dispatch({ type: 'setNodeDragActive', active: false })
        } else {
          useRootStore.getState().dispatch({ type: 'setWorldAxisDragActive', active: false })
        }
        opts?.onDragEnd?.()
      }
      gl.domElement.addEventListener('pointermove', onMove)
      gl.domElement.addEventListener('pointerup', onUp)
      gl.domElement.addEventListener('pointercancel', onUp)
    },
    [applyMove, camera, dragAnchorGraph, end, gl, opts, target],
  )

  return onPointerDown
}

function AxisTriplet({
  /** Parent-local offset for the gizmo mesh (node handles sit at the node’s origin). */
  groupPosition,
  /** Graph-space anchor for drag planes and ray math. */
  dragAnchorGraph,
  target,
}: {
  groupPosition: Vec3
  dragAnchorGraph: Vec3
  target: DragTarget
}) {
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

  const onPointerDown = useAxisPointerDrag(dragAnchorGraph, target, dragOpts)

  return (
    <group position={groupPosition}>
      {AXIS.map(({ key, color, label, rot }) => {
        const emphasis = dragAxis === key || hovered === key
        const emissive = dragAxis === key ? EMISSIVE_DRAG : emphasis ? EMISSIVE_HOVER : EMISSIVE_IDLE
        return (
          <group key={key} rotation={rot}>
            <mesh
              position={[0, GIZMO_LEN * 0.5, 0]}
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
              <cylinderGeometry args={[GIZMO_RADIUS, GIZMO_RADIUS, GIZMO_LEN, 10]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.4} />
            </mesh>
            <Text
              position={[0, GIZMO_LEN + 0.12, 0]}
              fontSize={0.16}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#ffffff"
            >
              {label}
            </Text>
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
  return <AxisTriplet groupPosition={o} dragAnchorGraph={o} target={{ kind: 'world' }} />
}

/** Per-node axis handles (same graph-local axes as the world gizmo). Render inside a group already at the node position. */
export function NodeAxisGuides({ n }: { n: NodeEntity }) {
  const on = useRootStore((s) => s.project?.settings.worldAxisControls === true)
  if (!on) return null
  const o = v3(0, 0, 0)
  return (
    <AxisTriplet
      groupPosition={o}
      dragAnchorGraph={n.position}
      target={{ kind: 'node', nodeId: n.id }}
    />
  )
}
