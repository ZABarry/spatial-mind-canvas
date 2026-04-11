import { useRef } from 'react'
import type { Group } from 'three'
import { NodeMeshes } from './NodeMeshes'
import { EdgeMeshes } from './EdgeMeshes'
import { WorldAxisGuides } from './AxisGuides'
import { InteractionPlane } from './InteractionPlane'
import { ConnectionController } from './ConnectionController'
import { useRootStore } from '../../store/rootStore'

export function WorldRoot() {
  const groupRef = useRef<Group>(null)
  const wt = useRootStore((s) => s.project?.worldTransform)

  if (!wt) return null

  return (
    <group
      ref={groupRef}
      position={wt.position as unknown as [number, number, number]}
      quaternion={
        [wt.quaternion[0], wt.quaternion[1], wt.quaternion[2], wt.quaternion[3]] as [
          number,
          number,
          number,
          number,
        ]
      }
      scale={[wt.scale, wt.scale, wt.scale]}
    >
      <ConnectionController />
      <WorldAxisGuides />
      <InteractionPlane />
      <NodeMeshes />
      <EdgeMeshes />
    </group>
  )
}
