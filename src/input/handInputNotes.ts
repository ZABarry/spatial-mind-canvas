/**
 * Hand tracking: many WebXR runtimes map **pinch** to the same `select` event as the controller trigger.
 * Spatial Mind Canvas handles `select` in `XrRaycastSelect` (scene) by raycasting into the graph.
 * For custom pinch thresholds, read `XRHand` joint poses in a `useFrame` and compare fingertip distances.
 */
export {}
