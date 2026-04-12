import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'
import {
  graphPointToWorld,
  graphUpNormalWorld,
  NO_XR_COMFORT,
  vec3Distance,
  worldPointToGraphLocal,
  XR_STANDING_GRAPH_OFFSET,
} from '../../utils/math'

/**
 * Renders nothing; samples link path points into `connectionDraft` while a link session is active.
 * Gesture ownership lives in the input/session layer — this component only follows store draft state.
 */
export function LinkPreview() {
  const draft = useRootStore((s) => s.connectionDraft)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const dispatch = useRootStore((s) => s.dispatch)

  useFrame(() => {
    if (!gl.xr.isPresenting) return
    const st = useRootStore.getState()
    const d = st.connectionDraft
    const proj = st.project
    if (!d || !proj) return
    const wt = proj.worldTransform
    const comfort = XR_STANDING_GRAPH_OFFSET
    const idx =
      d.xrControllerIndex ??
      (() => {
        const dominant = useRootStore.getState().devicePreferences.dominantHand
        return dominant === 'left' ? 1 : 0
      })()
    const controller = gl.xr.getController(idx)
    controller.updateMatrixWorld()
    const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld)
    const quat = new THREE.Quaternion().setFromRotationMatrix(controller.matrixWorld)
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat).normalize()
    const from = proj.graph.nodes[d.fromNodeId]?.position
    const normalW = graphUpNormalWorld(wt)
    const ptW = from
      ? new THREE.Vector3(...graphPointToWorld(wt, from, comfort))
      : new THREE.Vector3(0, 0, 0)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normalW, ptW)
    const hitW = new THREE.Vector3()
    const ray = new THREE.Ray(origin, dir)
    if (!ray.intersectPlane(plane, hitW)) return
    const local = worldPointToGraphLocal(wt, [hitW.x, hitW.y, hitW.z], comfort)
    const prev = d.pathPoints
    const last = prev[prev.length - 1]
    if (!last || vec3Distance(local, last) > 0.12) {
      useRootStore.getState().dispatch({ type: 'updateConnectionDrag', pathPoints: [...prev, local] })
    }
  })

  useEffect(() => {
    if (!draft || gl.xr.isPresenting) return
    const el = gl.domElement
    const plane = new THREE.Plane()
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hitW = new THREE.Vector3()

    const onMove = (ev: PointerEvent) => {
      const st = useRootStore.getState()
      const proj = st.project
      const d = st.connectionDraft
      if (!proj || !d) return
      const wt = proj.worldTransform
      const from = proj.graph.nodes[d.fromNodeId]?.position
      const normalW = graphUpNormalWorld(wt)
      const ptW = from
        ? new THREE.Vector3(...graphPointToWorld(wt, from, NO_XR_COMFORT))
        : new THREE.Vector3(0, 0, 0)
      plane.setFromNormalAndCoplanarPoint(normalW, ptW)

      const rect = el.getBoundingClientRect()
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      const ok = raycaster.ray.intersectPlane(plane, hitW)
      if (ok === null) return
      const local = worldPointToGraphLocal(wt, [hitW.x, hitW.y, hitW.z], NO_XR_COMFORT)
      const prev = st.connectionDraft?.pathPoints ?? []
      const last = prev[prev.length - 1]
      if (!last || vec3Distance(local, last) > 0.12) {
        dispatch({ type: 'updateConnectionDrag', pathPoints: [...prev, local] })
      }
    }

    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
    }
  }, [draft, camera, gl, gl.xr.isPresenting, dispatch])

  return null
}
