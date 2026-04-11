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
})
