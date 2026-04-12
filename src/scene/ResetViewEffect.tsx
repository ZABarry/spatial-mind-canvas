import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { useRootStore } from '../store/rootStore'
import { DESKTOP_INITIAL_CAMERA_POSITION } from './desktopCameraDefaults'

type OrbitControlsLike = {
  target: { set: (x: number, y: number, z: number) => void }
  update: () => void
} | null

/**
 * When `resetWorld` runs, restores the flat (non-XR) orbit camera to its initial position and pivot.
 */
export function ResetViewEffect() {
  const lastTick = useRef(0)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsLike

  useFrame(() => {
    const tick = useRootStore.getState().resetViewTick
    if (tick === lastTick.current) return

    if (useRootStore.getState().xrSessionActive) {
      lastTick.current = tick
      return
    }

    if (!controls?.target) return

    lastTick.current = tick
    const [x, y, z] = DESKTOP_INITIAL_CAMERA_POSITION
    camera.position.set(x, y, z)
    controls.target.set(0, 0, 0)
    controls.update()
  })

  return null
}
