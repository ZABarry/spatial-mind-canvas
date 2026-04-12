import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useXRInputSourceEvent } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { xrControllerIndexFromRayOrigin } from '../../utils/xrController'
import { xrLastNodeSelectControllerIndex } from './xrSelectionRefs'

/**
 * When a node is selected with one controller, pressing the trigger on the other controller
 * starts drawing a link (same as Shift+drag on desktop). Path samples follow the linking hand.
 */
export function XrTwoHandLink() {
  const gl = useThree((s) => s.gl)

  useXRInputSourceEvent(
    'all',
    'selectstart',
    (event: XRInputSourceEvent) => {
      if (!gl.xr.isPresenting) return
      const st = useRootStore.getState()
      if (st.connectionDraft) return
      const proj = st.project
      if (!proj) return

      const primary =
        st.selection.primaryNodeId ??
        (st.selection.nodeIds.length === 1 ? st.selection.nodeIds[0] : undefined)
      if (!primary || !proj.graph.nodes[primary]) return

      const input = event.inputSource
      const frame = event.frame
      const refSpace = gl.xr.getReferenceSpace()
      if (!refSpace || !input.targetRaySpace) return
      const pose = frame.getPose(input.targetRaySpace, refSpace)
      if (!pose) return
      const t = pose.transform
      const origin = new THREE.Vector3(t.position.x, t.position.y, t.position.z)
      const xrControllerIndex = xrControllerIndexFromRayOrigin(gl, origin)
      if (xrControllerIndex === xrLastNodeSelectControllerIndex.current) return

      st.dispatch({
        type: 'startConnection',
        fromNodeId: primary,
        style: 'spline',
        xrControllerIndex,
      })
    },
    [gl],
  )

  return null
}
