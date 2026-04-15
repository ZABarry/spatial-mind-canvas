import { createXRStore } from '@react-three/xr'
import type { Object3D } from 'three'
import type { Intersection } from 'three'

/** Visible on bright fog / white void; default XR ray is white. */
const XR_RAY_BLUE = '#1a6bff'
const XR_RAY_OPACITY = 0.52

/** Wrist menu, node action strip, etc. — prefer over graph when distances tie-break. */
function objectIsXrUiSurface(o: Object3D): boolean {
  let x: Object3D | null = o
  while (x) {
    if (x.userData?.xrMenuHit || x.userData?.xrNodeRadial) return true
    x = x.parent
  }
  return false
}

/**
 * Prefer UI hits when two intersections are nearly equidistant (reduces flicker at shallow angles).
 */
function xrPointerCustomSort(
  i1: Intersection,
  _pointerEventsOrder1: number | undefined,
  i2: Intersection,
  _pointerEventsOrder2: number | undefined,
): number {
  void _pointerEventsOrder1
  void _pointerEventsOrder2
  const dd = Math.abs(i1.distance - i2.distance)
  if (dd < 0.038) {
    const m1 = objectIsXrUiSurface(i1.object)
    const m2 = objectIsXrUiSurface(i2.object)
    if (m1 !== m2) return m1 ? -1 : 1
  }
  return i1.distance - i2.distance
}

/**
 * IWER desktop emulation only (`emulate` is disabled in production): initial headset position in meters.
 * Aligns with Meta Quest 3 DevUI defaults (X/Y/Z user position + ~90° vertical FOV) so dev sessions
 * start with a consistent elevated, stepped-back view of the scene. Real headsets ignore this.
 */
const IWER_DEV_HEADSET_POSITION: [number, number, number] = [0, 5, 15]
const IWER_DEV_FOVY_RAD = Math.PI / 2

const rayPointer = {
  rayModel: {
    color: XR_RAY_BLUE,
    opacity: XR_RAY_OPACITY,
    size: 0.0088,
    maxLength: 14,
  },
  cursorModel: {
    color: XR_RAY_BLUE,
    opacity: 0.78,
    size: 0.112,
  },
  minDistance: 0.05,
  customSort: xrPointerCustomSort,
}

export const xrStore = createXRStore({
  /**
   * IWER’s default synthetic room (`office_small`) is a separate compositor layer and can sit in
   * front of the app’s base WebGL layer in dev, yielding a blank grey headset view. Disable SEM so
   * the scene (grid, graph, particles) is what you see in the simulator.
   *
   * `inject: true` (dev only): default injection only matched `hostname === "localhost"`, so
   * `127.0.0.1` and LAN dev URLs skipped IWER. IWER is still skipped when native WebXR exists
   * (e.g. Chrome WebXR Emulator extension). Production builds disable emulation so real headsets
   * use the browser runtime only.
   */
  emulate: import.meta.env.DEV
    ? {
        type: 'metaQuest3',
        syntheticEnvironment: false,
        inject: true,
        headset: { position: IWER_DEV_HEADSET_POSITION },
        fovy: IWER_DEV_FOVY_RAD,
      }
    : false,
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
  /** Optional features that some desktop WebXR emulators handle poorly; not used by this app. */
  meshDetection: false,
  planeDetection: false,
})
