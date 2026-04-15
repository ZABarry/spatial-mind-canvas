import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import {
  computeHeadAnchoredPanelPose,
  dampPanelAnchorPose,
  panelLanePoseOptions,
  XR_PANEL_FOLLOW_LAMBDA,
  type XrPanelLane,
} from './anchors/xrPanelSpawner'
import { useRootStore } from '../../store/rootStore'

const _tgtPos = new THREE.Vector3()
const _tgtQuat = new THREE.Quaternion()

/**
 * Head-guided world-space placement for Html panels (Quest). Spawns from the current head pose,
 * then **softly damps** toward each frame’s head-anchored target so panels feel spatial, not
 * rigidly glued to the camera. Use **Recall panels** from the wrist menu (More page) to snap
 * anchors if a panel feels lost.
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
  const anchorGeneration = useRootStore((s) => s.xrPanelAnchorGeneration)

  const curPos = React.useRef(new THREE.Vector3())
  const curQuat = React.useRef(new THREE.Quaternion())
  const lastGen = React.useRef(-1)

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    const laneOpts = panelLanePoseOptions(lane)
    computeHeadAnchoredPanelPose(camera, lane, _tgtPos, _tgtQuat, laneOpts)

    if (lastGen.current !== anchorGeneration) {
      curPos.current.copy(_tgtPos)
      curQuat.current.copy(_tgtQuat)
      lastGen.current = anchorGeneration
    } else {
      dampPanelAnchorPose(curPos.current, curQuat.current, _tgtPos, _tgtQuat, XR_PANEL_FOLLOW_LAMBDA, delta)
    }

    g.position.copy(curPos.current)
    g.quaternion.copy(curQuat.current)
  })

  return <group ref={groupRef}>{children}</group>
}
