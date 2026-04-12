import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import {
  graphPointToWorld,
  graphUpNormalWorld,
  worldPointToGraphLocal,
  XR_STANDING_GRAPH_OFFSET,
} from '../../utils/math'
import { xrControllerIndexFromRayOrigin } from '../../utils/xrController'
import { tryHandleXrMenuObject } from '../../scene/xr/xrMenuActions'
import { xrLastNodeSelectControllerIndex } from '../../scene/xr/xrSelectionRefs'

/**
 * Maps XR controller `select` to the same semantic store actions as desktop (selection, link completion).
 */
export function useXrControllerInputBridge() {
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
            const sess = st.interactionSession
            if (sess.kind === 'link') {
              if (id === sess.fromNodeId) {
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
      const sess = st.interactionSession
      const proj = st.project
      if (sess.kind !== 'link' || !proj) return
      const wt = proj.worldTransform
      const comfort = XR_STANDING_GRAPH_OFFSET
      const from = proj.graph.nodes[sess.fromNodeId]?.position
      const normalW = graphUpNormalWorld(wt)
      const ptW = from
        ? new THREE.Vector3(...graphPointToWorld(wt, from, comfort))
        : new THREE.Vector3(0, 0, 0)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normalW, ptW)
      const hitW = new THREE.Vector3()
      const ray = new THREE.Ray(origin, direction)
      if (ray.intersectPlane(plane, hitW)) {
        const local = worldPointToGraphLocal(wt, [hitW.x, hitW.y, hitW.z], comfort)
        st.dispatch({ type: 'finishConnection', dropPosition: local })
      } else {
        st.dispatch({ type: 'cancelConnection' })
      }
    },
    [scene, gl],
  )
}

/** R3F component wrapper so the hook runs inside Canvas. */
export function XrControllerInputBridge() {
  useXrControllerInputBridge()
  return null
}
