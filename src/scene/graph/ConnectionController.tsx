import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'

/**
 * Samples midpoints for expressive edges while shift-dragging a connection from a node.
 * Finish the connection via node pointerUp (target) or InteractionPlane pointerUp (drop).
 */
export function ConnectionController() {
  const draft = useRootStore((s) => s.connectionDraft)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const dispatch = useRootStore((s) => s.dispatch)
  const lastHit = useRef<[number, number, number] | null>(null)

  useEffect(() => {
    if (!draft) return
    const plane = new THREE.Plane()
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const from = useRootStore.getState().project?.graph.nodes[draft.fromNodeId]?.position
    if (from) {
      plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...from))
    } else {
      plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0))
    }

    const onMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      const ok = raycaster.ray.intersectPlane(plane, hit)
      if (!ok) return
      const arr = hit.toArray() as [number, number, number]
      lastHit.current = arr
      const prev = useRootStore.getState().connectionDraft?.pathPoints ?? []
      const last = prev[prev.length - 1]
      if (!last || new THREE.Vector3(...last).distanceTo(hit) > 0.12) {
        dispatch({ type: 'updateConnectionDrag', pathPoints: [...prev, arr] })
      }
    }

    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
    }
  }, [draft, camera, gl, dispatch])

  return null
}
