/**
 * IWER’s DevUI (`@iwer/devui`, used by `@react-three/xr` device emulation) still hits a WebGL path
 * that calls `Material.prototype.onBuild`, which was removed in newer three.js releases. Without a
 * no-op, the emulator throws every frame and the console floods with errors.
 */
import { Material } from 'three'

const proto = Material.prototype as Material & {
  onBuild?: (this: Material, ...args: unknown[]) => void
}

if (typeof proto.onBuild !== 'function') {
  proto.onBuild = function () {}
}
