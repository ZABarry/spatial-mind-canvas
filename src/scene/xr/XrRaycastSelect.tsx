import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

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
        let o: THREE.Object3D | null = h.object
        while (o) {
          const id = o.userData?.nodeId as string | undefined
          if (id) {
            useRootStore.getState().dispatch({ type: 'selectNodes', ids: [id], additive: false })
            return
          }
          o = o.parent
        }
      }
    },
    [scene, gl],
  )

  return null
}
