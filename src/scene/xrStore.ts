import { createXRStore } from '@react-three/xr'

/** Visible on bright fog / white void; default XR ray is white. */
const XR_RAY_BLUE = '#1a6bff'
const XR_RAY_OPACITY = 0.5

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
  },
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
