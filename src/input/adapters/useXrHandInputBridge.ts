import { useFrame, useThree } from '@react-three/fiber'
import { useRootStore } from '../../store/rootStore'

/**
 * Tracks hand-only XR sessions and exposes `xrHandTrackingPrimary` on the store for scoped UX.
 * Selection and menus use the same ray stack as controllers; advanced authoring is gated elsewhere.
 */
export function useXrHandInputBridge() {
  const gl = useThree((s) => s.gl)

  useFrame(() => {
    if (!gl.xr.isPresenting) {
      if (useRootStore.getState().xrHandTrackingPrimary) {
        useRootStore.setState({ xrHandTrackingPrimary: false })
      }
      return
    }
    const session = gl.xr.getSession()
    if (!session) return
    const sources = [...session.inputSources]
    const hasHand = sources.some((s) => s.hand)
    const hasCtrl = sources.some((s) => !s.hand && s.gamepad)
    const primary = hasHand && !hasCtrl
    const cur = useRootStore.getState().xrHandTrackingPrimary
    if (cur !== primary) useRootStore.setState({ xrHandTrackingPrimary: primary })
  })
}

export function XrHandInputStub() {
  useXrHandInputBridge()
  return null
}
