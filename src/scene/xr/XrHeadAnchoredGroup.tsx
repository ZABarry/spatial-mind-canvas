import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import type { XrPanelLane } from './anchors/xrPanelSpawner'
import { computeHeadAnchoredPanelPose } from './anchors/xrPanelSpawner'

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()

/**
 * Head-relative world-space placement for Html panels (Quest). Updates each frame while mounted
 * so panels stay in comfortable reach when the user moves. Lane policy avoids overlap between
 * detail / search / settings / bookmarks — see {@link lateralOffsetForLane}.
 */
export function XrHeadAnchoredGroup({
  lane,
  children,
}: {
  lane: XrPanelLane
  children: React.ReactNode
}) {
  const groupRef = React.useRef<Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    computeHeadAnchoredPanelPose(camera, lane, _pos, _quat)
    g.position.copy(_pos)
    g.quaternion.copy(_quat)
  })

  return <group ref={groupRef}>{children}</group>
}
