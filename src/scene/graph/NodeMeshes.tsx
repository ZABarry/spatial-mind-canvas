import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphState, NodeEntity, Project } from '../../graph/types'
import { shouldRenderNode } from '../../graph/selectors'
import { NodeAxisGuides } from './AxisGuides'
import { useNodeGeometry } from './nodeGeometry'
import { useRootStore } from '../../store/rootStore'
import { graphPointToWorld, graphUpNormalWorld, worldPointToGraphLocal } from '../../utils/math'
import { xrControllerIndexFromRayOrigin } from '../../utils/xrController'
import { xrLastNodeSelectControllerIndex } from '../xr/xrSelectionRefs'

const _billboardParentQ = new THREE.Quaternion()
const _billboardParentInv = new THREE.Quaternion()

/**
 * Drei's Billboard uses `camera.getWorldQuaternion()`, which in WebXR is wrong for an
 * {@link THREE.ArrayCamera} — labels end up edge-on and appear to spin. Face the first eye camera instead.
 */
function LabelBillboard({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Group>(null)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  useFrame(() => {
    if (!outerRef.current || !innerRef.current) return
    let faceCam: THREE.Camera = camera
    if (gl.xr.isPresenting) {
      const xrCam = gl.xr.getCamera()
      const eyes = (xrCam as THREE.ArrayCamera).cameras
      if (eyes?.[0]) faceCam = eyes[0]
    }
    outerRef.current.updateWorldMatrix(false, false)
    outerRef.current.getWorldQuaternion(_billboardParentQ)
    _billboardParentInv.copy(_billboardParentQ).invert()
    faceCam.getWorldQuaternion(innerRef.current.quaternion).premultiply(_billboardParentInv)
  })

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>{children}</group>
    </group>
  )
}

function NodeItem({
  n,
  graph,
  dim,
  focusSet,
  selected,
  hovered,
  showLabel,
}: {
  n: NodeEntity
  graph: GraphState
  dim: boolean
  focusSet: Set<string> | null
  selected: boolean
  hovered: boolean
  showLabel: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef(false)
  /** WebXR: `getController` index for the hand that started the drag (not dominant-hand order). */
  const xrDragControllerIdx = useRef<number | null>(null)
  const geom = useNodeGeometry(n.shape, n.size)
  const color = useMemo(() => new THREE.Color(n.color), [n.color])

  const opacity = useMemo(() => {
    if (!dim || !focusSet) return 1
    if (focusSet.has(n.id)) return 1
    return 0.12
  }, [dim, focusSet, n.id])

  const emissive = hovered || selected ? 0.35 : 0.12

  const onMove = useCallback(
    (ev: PointerEvent) => {
      const st = useRootStore.getState()
      const proj = st.project
      if (!proj) return
      const wt = proj.worldTransform
      const node = proj.graph.nodes[n.id]
      if (!node) return
      const normalW = graphUpNormalWorld(wt)
      const anchorW = new THREE.Vector3(...graphPointToWorld(wt, node.position))
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normalW, anchorW)
      const raycaster = new THREE.Raycaster()
      const ndc = new THREE.Vector2()
      const rect = gl.domElement.getBoundingClientRect()
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const local = worldPointToGraphLocal(wt, [hit.x, hit.y, hit.z])
        st.dispatch({
          type: 'moveNode',
          nodeId: n.id,
          position: local,
        })
      }
    },
    [camera, gl.domElement, n.id],
  )

  useEffect(() => {
    draggingRef.current = dragging
  }, [dragging])

  useEffect(() => {
    if (!dragging) return
    const el = gl.domElement
    const onUp = () => {
      setDragging(false)
      xrDragControllerIdx.current = null
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, onMove, gl.domElement])

  useFrame(() => {
    if (!draggingRef.current || !gl.xr.isPresenting) return
    const st = useRootStore.getState()
    const proj = st.project
    if (!proj) return
    const wt = proj.worldTransform
    const node = proj.graph.nodes[n.id]
    if (!node) return
    const idx =
      xrDragControllerIdx.current ??
      (() => {
        const dominant = proj.settings.dominantHand
        return dominant === 'left' ? 1 : 0
      })()
    const controller = gl.xr.getController(idx)
    controller.updateMatrixWorld()
    const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld)
    const quat = new THREE.Quaternion().setFromRotationMatrix(controller.matrixWorld)
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat).normalize()
    const normalW = graphUpNormalWorld(wt)
    const anchorW = new THREE.Vector3(...graphPointToWorld(wt, node.position))
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normalW, anchorW)
    const hit = new THREE.Vector3()
    const ray = new THREE.Ray(origin, dir)
    if (!ray.intersectPlane(plane, hit)) return
    const local = worldPointToGraphLocal(wt, [hit.x, hit.y, hit.z])
    st.dispatch({ type: 'moveNode', nodeId: n.id, position: local })
  })

  if (!shouldRenderNode(graph, n.id)) return null

  return (
    <group position={n.position}>
      <mesh
        ref={meshRef}
        geometry={geom}
        userData={{ nodeId: n.id }}
        onPointerOver={(e) => {
          e.stopPropagation()
          useRootStore.getState().dispatch({ type: 'setHover', nodeId: n.id })
        }}
        onPointerOut={() => {
          useRootStore.getState().dispatch({ type: 'setHover' })
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          useRootStore.getState().dispatch({ type: 'openNodeDetail', nodeId: n.id })
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (gl.xr.isPresenting && e.ray) {
            xrDragControllerIdx.current = xrControllerIndexFromRayOrigin(gl, e.ray.origin)
          } else {
            xrDragControllerIdx.current = null
          }
          if (e.shiftKey) {
            useRootStore.getState().dispatch({
              type: 'startConnection',
              fromNodeId: n.id,
              style: 'spline',
              ...(gl.xr.isPresenting && xrDragControllerIdx.current !== null
                ? { xrControllerIndex: xrDragControllerIdx.current }
                : {}),
            })
            return
          }
          const ev = e.nativeEvent as PointerEvent
          const additive = ev.ctrlKey || ev.metaKey
          useRootStore.getState().dispatch({
            type: 'selectNodes',
            ids: [n.id],
            additive: !!additive,
          })
          if (gl.xr.isPresenting && e.ray) {
            xrLastNodeSelectControllerIndex.current = xrControllerIndexFromRayOrigin(gl, e.ray.origin)
          }
          if (e.button === 0 && !n.pinned) setDragging(true)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          setDragging(false)
          xrDragControllerIdx.current = null
          const d = useRootStore.getState().connectionDraft
          if (d) {
            if (d.fromNodeId === n.id) {
              useRootStore.getState().dispatch({ type: 'cancelConnection' })
            } else {
              useRootStore.getState().dispatch({
                type: 'finishConnection',
                targetNodeId: n.id,
              })
            }
          }
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissive}
          roughness={0.45}
          metalness={0.08}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <NodeAxisGuides n={n} />
      {showLabel && (
        <LabelBillboard>
          <Text
            position={[0, 0.55 * n.size + 0.35, 0]}
            fontSize={0.22}
            color="#2a3140"
            anchorX="center"
            anchorY="bottom"
            maxWidth={3}
            outlineWidth={0.02}
            outlineColor="#ffffff"
          >
            {n.title || 'Untitled'}
          </Text>
        </LabelBillboard>
      )}
    </group>
  )
}

function computeVisibleLabels(
  project: Project,
  camera: THREE.Camera,
  sel: string[],
  hoverId: string | undefined,
): Set<string> {
  const wt = project.worldTransform
  const settings = project.settings
  const budget = settings.labelBudget ?? 32
  const showAll = settings.showAllLabels ?? false
  const nodes = Object.values(project.graph.nodes)
  const camPos = camera.position

  const next = new Set<string>()
  if (showAll) {
    nodes.forEach((n) => next.add(n.id))
    return next
  }
  for (const id of sel) next.add(id)
  if (hoverId) next.add(hoverId)

  const scored = nodes.map((n) => {
    const w = graphPointToWorld(wt, n.position)
    const d = new THREE.Vector3(...w).distanceTo(camPos)
    return { id: n.id, d }
  })
  scored.sort((a, b) => a.d - b.d)
  for (const { id } of scored) {
    if (next.size >= budget) break
    next.add(id)
  }
  return next
}

export function NodeMeshes() {
  const project = useRootStore((s) => s.project)
  const focusDim = useRootStore((s) => s.focusDim)
  const focusSet = useRootStore((s) => s.focusSet)
  const sel = useRootStore((s) => s.selection.nodeIds)
  const hoverId = useRootStore((s) => s.hover.nodeId)
  const camera = useThree((s) => s.camera)
  const [labelVisible, setLabelVisible] = useState<Set<string>>(new Set())
  const lastKey = useRef('')

  useFrame(() => {
    if (!project) return
    const { selection, hover } = useRootStore.getState()
    const next = computeVisibleLabels(project, camera, selection.nodeIds, hover.nodeId)
    const key = [...next].sort().join(',')
    if (key !== lastKey.current) {
      lastKey.current = key
      setLabelVisible(next)
    }
  })

  if (!project) return null
  const graph = project.graph
  const nodes = Object.values(graph.nodes)

  return (
    <>
      {nodes.map((n) => (
        <NodeItem
          key={n.id}
          n={n}
          graph={graph}
          dim={focusDim && !!focusSet && focusSet.size > 0}
          focusSet={focusSet}
          selected={sel.includes(n.id)}
          hovered={hoverId === n.id}
          showLabel={labelVisible.has(n.id)}
        />
      ))}
    </>
  )
}
