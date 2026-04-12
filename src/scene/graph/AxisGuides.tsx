import { useCallback, useRef } from 'react'
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
  pStartLocal: Vec3
  plane: THREE.Plane
  pointerId: number
}

const _hit = new THREE.Vector3()
const _ndc = new THREE.Vector2()
const _raycaster = new THREE.Raycaster()

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

function useAxisPointerDrag(anchorGraph: Vec3, target: DragTarget) {
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

      const plane = buildDragPlane(wt, anchorGraph, axis, camera, comfort)
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
      }
      ;(e.target as HTMLElement).setPointerCapture?.(ev.pointerId)

      const onMove = (pe: PointerEvent) => {
        if (pe.pointerId !== sessionRef.current?.pointerId) return
        applyMove(pe.clientX, pe.clientY)
      }
      const onUp = (pe: PointerEvent) => {
        if (pe.pointerId !== sessionRef.current?.pointerId) return
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
        gl.domElement.removeEventListener('pointercancel', onUp)
        end()
        if (target.kind === 'node') {
          useRootStore.getState().dispatch({ type: 'setNodeDragActive', active: false })
        }
      }
      gl.domElement.addEventListener('pointermove', onMove)
      gl.domElement.addEventListener('pointerup', onUp)
      gl.domElement.addEventListener('pointercancel', onUp)
    },
    [anchorGraph, applyMove, camera, end, gl, target],
  )

  return onPointerDown
}

function AxisTriplet({ anchorGraph, target }: { anchorGraph: Vec3; target: DragTarget }) {
  const onPointerDown = useAxisPointerDrag(anchorGraph, target)

  return (
    <group position={anchorGraph}>
      {AXIS.map(({ key, color, label, rot }) => (
        <group key={key} rotation={rot}>
          <mesh
            position={[0, GIZMO_LEN * 0.5, 0]}
            userData={{ axisHandle: key, axisTarget: target.kind }}
            onPointerDown={(e) => onPointerDown(key, e)}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <cylinderGeometry args={[GIZMO_RADIUS, GIZMO_RADIUS, GIZMO_LEN, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.4} />
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
      ))}
    </group>
  )
}

/** X/Y/Z handles at graph origin; dragging a handle translates the world root along that graph axis. */
export function WorldAxisGuides() {
  const on = useRootStore((s) => s.project?.settings.worldAxisControls === true)
  if (!on) return null
  return <AxisTriplet anchorGraph={v3(0, 0, 0)} target={{ kind: 'world' }} />
}

/** Per-node axis handles (same graph-local axes as the world gizmo). Render inside a group already at the node position. */
export function NodeAxisGuides({ n }: { n: NodeEntity }) {
  const on = useRootStore((s) => s.project?.settings.worldAxisControls === true)
  if (!on) return null
  return <AxisTriplet anchorGraph={v3(0, 0, 0)} target={{ kind: 'node', nodeId: n.id }} />
}
