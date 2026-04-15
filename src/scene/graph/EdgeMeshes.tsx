import { Line } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import * as THREE from 'three'
import type { EdgeEntity, GraphState } from '../../graph/types'
import { useRootStore } from '../../store/rootStore'
import { clearNodePressAnchor } from '../graphPointerGesture'

function edgePoints(graph: GraphState, e: EdgeEntity): THREE.Vector3[] {
  const a = graph.nodes[e.sourceId]?.position
  const b = graph.nodes[e.targetId]?.position
  if (!a || !b) return []
  return [new THREE.Vector3(...a), new THREE.Vector3(...b)]
}

export function EdgeMeshes() {
  const inXr = useXR((s) => !!s.session)
  const project = useRootStore((s) => s.project)
  const focusDim = useRootStore((s) => s.focusDim)
  const focusSet = useRootStore((s) => s.focusSet)
  const selE = useRootStore((s) => s.selection.edgeIds)
  const hoverE = useRootStore((s) => s.hover.edgeId)
  /** While drafting a link, thick screen-space edges often win the raycast over node meshes — block hits so pointerup reaches nodes. */
  const interactionSession = useRootStore((s) => s.interactionSession)
  const linkDraft = interactionSession.kind === 'link'
  const linkFromId = linkDraft ? interactionSession.fromNodeId : null

  if (!project) return null
  const graph = project.graph
  const edges = Object.values(graph.edges)

  return (
    <>
      {edges.map((e) => {
        const pts = edgePoints(graph, e)
        if (pts.length < 2) return null
        const c0 = graph.nodes[e.sourceId]?.color ?? '#88aacc'
        const c1 = graph.nodes[e.targetId]?.color ?? '#aaccee'
        const colors = pts.map((_, i, arr) => {
          const t = i / Math.max(1, arr.length - 1)
          const ca = new THREE.Color(c0)
          const cb = new THREE.Color(c1)
          return ca.lerp(cb, t)
        })
        const dim =
          focusDim && focusSet && focusSet.size > 0
            ? !focusSet.has(e.sourceId) && !focusSet.has(e.targetId)
            : false
        const baseOpacity = dim ? 0.08 : selE.includes(e.id) || hoverE === e.id ? 1 : 0.75
        const linkingBackdrop =
          linkDraft && linkFromId && e.sourceId !== linkFromId && e.targetId !== linkFromId
        const lineOpacity = linkingBackdrop ? baseOpacity * 0.22 : baseOpacity
        /** Drei `Line` uses Line2/LineSegments2; screen-space raycast needs `raycaster.camera`, which is often null in XR — use world units there instead. */
        const lineWidth = inXr
          ? Math.max(0.008, e.thickness * 0.012)
          : Math.max(1, e.thickness * 1.5)
        return (
          <group key={e.id} userData={{ edgeId: e.id }}>
            <Line
              points={pts}
              vertexColors={colors}
              lineWidth={lineWidth}
              worldUnits={inXr}
              transparent
              opacity={lineOpacity}
              depthWrite={false}
              {...(linkDraft ? { raycast: () => {} } : {})}
              onPointerOver={(ev) => {
                ev.stopPropagation()
                useRootStore.getState().dispatch({ type: 'setHover', edgeId: e.id })
              }}
              onPointerOut={() => useRootStore.getState().dispatch({ type: 'setHover' })}
              onPointerDown={(ev) => {
                ev.stopPropagation()
                clearNodePressAnchor()
                useRootStore.getState().dispatch({
                  type: 'selectEdges',
                  ids: [e.id],
                  additive: ev.shiftKey,
                })
              }}
            />
          </group>
        )
      })}
    </>
  )
}
