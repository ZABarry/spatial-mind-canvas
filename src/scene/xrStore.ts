import { createXRStore } from '@react-three/xr'

/** Visible on bright fog / white void; default XR ray is white. */
const XR_RAY_BLUE = '#1a6bff'
const XR_RAY_OPACITY = 0.5

const rayPointer = {
  rayModel: {
    color: XR_RAY_BLUE,
    opacity: XR_RAY_OPACITY,
  },
}

export const xrStore = createXRStore({
  controller: {
    rayPointer,
  },
  hand: {
    rayPointer,
  },
  /** Improves soft-keyboard behavior for Html `<input>` / `<textarea>` while immersive (browser support varies). */
  domOverlay: true,
  /**
   * Avoid auto `navigator.xr.offerSession` after exit (defaults to immersive-ar when supported),
   * which races with explicit VR/MR switches and can feel like passthrough is tied to other toggles.
   */
  offerSession: false,
})
