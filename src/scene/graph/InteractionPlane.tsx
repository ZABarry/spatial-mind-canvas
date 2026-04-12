import { useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'
import { worldPointToGraphLocal } from '../../utils/math'

/**
 * Large invisible plane for double-click create and clearing selection on empty ground.
 */
export function InteractionPlane() {
  const dispatch = useRootStore((s) => s.dispatch)

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const st = useRootStore.getState()
      const d = st.connectionDraft
      const proj = st.project
      if (!d || !proj) return
      e.stopPropagation()
      const p = e.point
      const local = worldPointToGraphLocal(proj.worldTransform, [p.x, p.y, p.z])
      dispatch({
        type: 'finishConnection',
        dropPosition: local,
      })
    },
    [dispatch],
  )

  const onDoubleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const proj = useRootStore.getState().project
      if (!proj) return
      const p = e.point
      const local = worldPointToGraphLocal(proj.worldTransform, [p.x, p.y, p.z])
      dispatch({
        type: 'createNodeAt',
        position: local,
      })
    },
    [dispatch],
  )

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  )
}
