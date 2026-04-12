/**
 * Nearest WebXR controller index for the last node selection in immersive mode
 * (raycast `select` and mesh pointer selection). Lets the other controller start a link drag without Shift.
 */
export const xrLastNodeSelectControllerIndex = { current: null as number | null }
