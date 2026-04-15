import { useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'
import { NO_XR_COMFORT, worldPointToGraphLocal, XR_STANDING_GRAPH_OFFSET } from '../../utils/math'
import { clearNodePressAnchor } from '../graphPointerGesture'

/** True when this event’s closest hit is the ground plane (not a node/edge in front of it). */
function isPrimaryHitGround(e: ThreeEvent<MouseEvent | PointerEvent>) {
  const top = e.intersections[0]
  return top?.object.userData?.hitKind === 'ground'
}

/**
 * Large invisible plane for double-click create and clearing selection on empty ground.
 */
export function InteractionPlane() {
  const dispatch = useRootStore((s) => s.dispatch)
  const gl = useThree((s) => s.gl)

  const onPointerDown = useCallback(() => {
    clearNodePressAnchor()
  }, [])

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const st = useRootStore.getState()
      if (st.interactionSession.kind !== 'link' || !st.project) return
      const proj = st.project
      e.stopPropagation()
      const p = e.point
      const comfort = gl.xr.isPresenting ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT
      const local = worldPointToGraphLocal(proj.worldTransform, [p.x, p.y, p.z], comfort)
      dispatch({
        type: 'finishConnection',
        dropPosition: local,
      })
    },
    [dispatch, gl],
  )

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isPrimaryHitGround(e)) return
      const st = useRootStore.getState()
      if (st.interactionSession.kind !== 'idle') return
      if (st.selection.nodeIds.length === 0 && st.selection.edgeIds.length === 0) return
      e.stopPropagation()
      dispatch({ type: 'clearSelection' })
    },
    [dispatch],
  )

  const onDoubleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isPrimaryHitGround(e)) return
      e.stopPropagation()
      const proj = useRootStore.getState().project
      if (!proj) return
      const p = e.point
      const comfort = gl.xr.isPresenting ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT
      const local = worldPointToGraphLocal(proj.worldTransform, [p.x, p.y, p.z], comfort)
      dispatch({
        type: 'createNodeAt',
        position: local,
      })
    },
    [dispatch, gl],
  )

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        userData={{ hitKind: 'ground' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  )
}
