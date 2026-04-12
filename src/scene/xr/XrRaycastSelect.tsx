import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import {
  graphPointToWorld,
  graphUpNormalWorld,
  worldPointToGraphLocal,
} from '../../utils/math'
import { xrControllerIndexFromRayOrigin } from '../../utils/xrController'
import { tryHandleXrMenuObject } from './xrMenuActions'
import { xrLastNodeSelectControllerIndex } from './xrSelectionRefs'

/**
 * Maps XR "select" (controller trigger / hand pinch where supported) to graph selection.
 * Complements mesh pointer events; ensures a baseline when WebXR does not emit DOM-like pointers.
 */
export function XrRaycastSelect() {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)

  useXRInputSourceEvent(
    'all',
    'select',
    (event: XRInputSourceEvent) => {
      if (!gl.xr.isPresenting) return
      const frame = event.frame
      const input = event.inputSource
      const refSpace = gl.xr.getReferenceSpace()
      if (!refSpace || !input.targetRaySpace) return
      const pose = frame.getPose(input.targetRaySpace, refSpace)
      if (!pose) return
      const t = pose.transform
      const origin = new THREE.Vector3(t.position.x, t.position.y, t.position.z)
      const q = new THREE.Quaternion(
        t.orientation.x,
        t.orientation.y,
        t.orientation.z,
        t.orientation.w,
      )
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(q).normalize()
      const raycaster = new THREE.Raycaster(origin, direction)
      raycaster.near = 0.05
      raycaster.far = 500
      const hits = raycaster.intersectObjects(scene.children, true)
      for (const h of hits) {
        if (tryHandleXrMenuObject(h.object)) return
        let o: THREE.Object3D | null = h.object
        while (o) {
          const id = o.userData?.nodeId as string | undefined
          if (id) {
            const st = useRootStore.getState()
            const draft = st.connectionDraft
            if (draft) {
              if (id === draft.fromNodeId) {
                st.dispatch({ type: 'cancelConnection' })
              } else {
                st.dispatch({ type: 'finishConnection', targetNodeId: id })
              }
            } else {
              st.dispatch({ type: 'selectNodes', ids: [id], additive: false })
              xrLastNodeSelectControllerIndex.current = xrControllerIndexFromRayOrigin(gl, origin)
            }
            return
          }
          o = o.parent
        }
      }

      const st = useRootStore.getState()
      const draft = st.connectionDraft
      const proj = st.project
      if (!draft || !proj) return
      const wt = proj.worldTransform
      const from = proj.graph.nodes[draft.fromNodeId]?.position
      const normalW = graphUpNormalWorld(wt)
      const ptW = from
        ? new THREE.Vector3(...graphPointToWorld(wt, from))
        : new THREE.Vector3(0, 0, 0)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normalW, ptW)
      const hitW = new THREE.Vector3()
      const ray = new THREE.Ray(origin, direction)
      if (ray.intersectPlane(plane, hitW)) {
        const local = worldPointToGraphLocal(wt, [hitW.x, hitW.y, hitW.z])
        st.dispatch({ type: 'finishConnection', dropPosition: local })
      } else {
        st.dispatch({ type: 'cancelConnection' })
      }
    },
    [scene, gl],
  )

  return null
}
