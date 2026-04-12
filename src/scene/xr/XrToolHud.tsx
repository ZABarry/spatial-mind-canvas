import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { Vector3 } from 'three'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

const _dir = new Vector3()
const _up = new Vector3()

/** Small in-scene reminder of the active authoring tool (VR only; head-locked). */
export function XrToolHud() {
  const session = useXR((s) => s.session)
  const toolMode = useRootStore((s) => s.toolMode)
  const nav = useRootStore((s) => s.navigationMode)
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!session || !groupRef.current) return
    camera.getWorldDirection(_dir)
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    groupRef.current.position.copy(camera.position)
    groupRef.current.position.addScaledVector(_dir, 1.4)
    groupRef.current.position.addScaledVector(_up, -0.12)
  })

  if (!session) return null

  const label = `Tool: ${toolMode} · Nav: ${nav}`

  return (
    <group ref={groupRef}>
      <Billboard>
        <Text fontSize={0.06} color="#334155" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
    </group>
  )
}
