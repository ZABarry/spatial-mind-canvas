import { useMemo, useRef, useState, useEffect } from 'react'
import { Text, Billboard } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { GraphState, NodeEntity } from '../../graph/types'
import { shouldRenderNode } from '../../graph/selectors'
import { useNodeGeometry } from './nodeGeometry'
import { useRootStore } from '../../store/rootStore'

function NodeItem({
  n,
  graph,
  dim,
  focusSet,
  selected,
  hovered,
}: {
  n: NodeEntity
  graph: GraphState
  dim: boolean
  focusSet: Set<string> | null
  selected: boolean
  hovered: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const [dragging, setDragging] = useState(false)
  const geom = useNodeGeometry(n.shape, n.size)
  const color = useMemo(() => new THREE.Color(n.color), [n.color])

  const opacity = useMemo(() => {
    if (!dim || !focusSet) return 1
    if (focusSet.has(n.id)) return 1
    return 0.12
  }, [dim, focusSet, n.id])

  const emissive = hovered || selected ? 0.35 : 0.12

  useEffect(() => {
    if (!dragging) return
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -n.position[1])
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()

    const onMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(plane, hit)) {
        useRootStore.getState().dispatch({
          type: 'moveNode',
          nodeId: n.id,
          position: [hit.x, hit.y, hit.z],
        })
      }
    }
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, camera, gl, n.id, n.position])

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
          if (e.shiftKey) {
            useRootStore.getState().dispatch({
              type: 'startConnection',
              fromNodeId: n.id,
              style: 'spline',
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
          if (e.button === 0 && !n.pinned) setDragging(true)
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
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
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
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
      </Billboard>
    </group>
  )
}

export function NodeMeshes() {
  const project = useRootStore((s) => s.project)
  const focusDim = useRootStore((s) => s.focusDim)
  const focusSet = useRootStore((s) => s.focusSet)
  const sel = useRootStore((s) => s.selection.nodeIds)
  const hoverId = useRootStore((s) => s.hover.nodeId)

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
        />
      ))}
    </>
  )
}
