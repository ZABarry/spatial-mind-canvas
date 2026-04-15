/**
 * Hand tracking: many WebXR runtimes map **pinch** to the same `select` event as the controller trigger.
 * Spatial Mind Canvas handles `select` in **XrControllerInputBridge** (`useXrControllerInputBridge.ts`; re-exported as **XrRaycastSelect**) by raycasting into the graph.
 * **World grab** uses separate index–thumb distance thresholds — see `handPinchGrasp.ts` and `XrWorldGrab`.
 */
export {}
