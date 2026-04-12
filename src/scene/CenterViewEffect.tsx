import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { useRootStore } from '../store/rootStore'
import { graphPointToWorld, NO_XR_COMFORT, XR_STANDING_GRAPH_OFFSET } from '../utils/math'
import type { Vec3 } from '../utils/math'

type OrbitLike = { target?: { x: number; y: number; z: number } } | null

/**
 * Applies `translateWorld` so the primary selected node moves to the current orbit pivot (or origin),
 * matching the same comfort offset as {@link WorldRoot}.
 */
export function CenterViewEffect() {
  const lastTick = useRef(0)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as OrbitLike

  useFrame(() => {
    const tick = useRootStore.getState().centerViewTick
    if (tick === lastTick.current) return
    lastTick.current = tick

    const st = useRootStore.getState()
    const p = st.project
    if (!p) return
    const primary = st.selection.primaryNodeId ?? st.selection.nodeIds[0]
    if (!primary) return
    const node = p.graph.nodes[primary]
    if (!node) return

    const comfort = st.xrSessionActive ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT
    const cur = graphPointToWorld(p.worldTransform, node.position, comfort)
    const tx = controls?.target?.x ?? 0
    const ty = controls?.target?.y ?? 0
    const tz = controls?.target?.z ?? 0
    const delta: Vec3 = [tx - cur[0], ty - cur[1], tz - cur[2]]
    const len = Math.hypot(delta[0], delta[1], delta[2])
    if (len < 1e-9) return

    if (gl.xr.isPresenting) {
      // No orbit target in XR; align to world origin so the node sits in front of the rig.
      const d2: Vec3 = [-cur[0], -cur[1], -cur[2]]
      if (Math.hypot(d2[0], d2[1], d2[2]) < 1e-9) return
      st.dispatch({ type: 'translateWorld', delta: d2 })
      return
    }

    st.dispatch({ type: 'translateWorld', delta })
  })

  return null
}
