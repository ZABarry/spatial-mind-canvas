import { useRef } from 'react'
import { useXR } from '@react-three/xr'
import type { Group } from 'three'
import { NodeMeshes } from './NodeMeshes'
import { EdgeMeshes } from './EdgeMeshes'
import { WorldAxisGuides } from './AxisGuides'
import { FloorGrid } from './FloorGrid'
import { InteractionPlane } from './InteractionPlane'
import { LinkPreview } from './LinkPreview'
import { NodeHandles } from './NodeHandles'
import { useRootStore } from '../../store/rootStore'
import { NO_XR_COMFORT, vec3Add, XR_STANDING_GRAPH_OFFSET } from '../../utils/math'

export function WorldRoot() {
  const groupRef = useRef<Group>(null)
  const wt = useRootStore((s) => s.project?.worldTransform)
  const showFloorGrid = useRootStore((s) => s.project?.settings.floorGrid !== false)
  const inXr = useXR((s) => !!s.session)
  const comfort = inXr ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT

  if (!wt) return null

  const position = vec3Add(wt.position, comfort) as unknown as [number, number, number]

  return (
    <group
      ref={groupRef}
      position={position}
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
      <LinkPreview />
      <NodeHandles />
      <WorldAxisGuides />
      {showFloorGrid ? <FloorGrid /> : null}
      <InteractionPlane />
      <NodeMeshes />
      <EdgeMeshes />
    </group>
  )
}
