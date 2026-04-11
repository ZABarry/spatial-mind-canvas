import { useCallback } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'

/**
 * Large invisible plane for double-click create and clearing selection on empty ground.
 */
export function InteractionPlane() {
  const dispatch = useRootStore((s) => s.dispatch)

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const d = useRootStore.getState().connectionDraft
      if (!d) return
      e.stopPropagation()
      const p = e.point
      dispatch({
        type: 'finishConnection',
        dropPosition: [p.x, p.y, p.z],
      })
    },
    [dispatch],
  )

  const onDoubleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      const p = e.point
      dispatch({
        type: 'createNodeAt',
        position: [p.x, p.y, p.z],
      })
    },
    [dispatch],
  )

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <planeGeometry args={[400, 400]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}
