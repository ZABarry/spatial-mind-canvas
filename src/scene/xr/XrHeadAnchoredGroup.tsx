import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import {
  computeHeadAnchoredPanelPose,
  dampQuaternionToward,
  dampVectorToward,
  panelLanePoseOptions,
  stepPanelGroundPosition,
  XR_PANEL_FOLLOW_LAMBDA_SPAWN,
  XR_PANEL_FOLLOW_LAMBDA_TRACK,
  XR_PANEL_SETTLE_DURATION_SEC,
  type XrPanelLane,
} from './anchors/xrPanelSpawner'
import { useRootStore } from '../../store/rootStore'

const _tgtPos = new THREE.Vector3()
const _tgtQuat = new THREE.Quaternion()

/** Face the user smoothly while position is grounded — readable without rigid HUD snap. */
const XR_PANEL_QUAT_LAMBDA = 7.8

/**
 * Head-guided world-space placement for Html panels (Quest). On spawn / recall, panels track the
 * head slot briefly, then **ground** in world space: the anchor lags the ideal slot when you move
 * a little (stable) and catches up when you walk or turn enough. Orientation keeps facing you.
 * **Recall panels** re-seeds all lanes from the current view.
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
  const groundPos = React.useRef(new THREE.Vector3())
  const lastGen = React.useRef(-1)
  const settleElapsed = React.useRef(0)

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    const laneOpts = panelLanePoseOptions(lane)
    computeHeadAnchoredPanelPose(camera, lane, _tgtPos, _tgtQuat, laneOpts)

    if (lastGen.current !== anchorGeneration) {
      curPos.current.copy(_tgtPos)
      curQuat.current.copy(_tgtQuat)
      groundPos.current.copy(_tgtPos)
      settleElapsed.current = 0
      lastGen.current = anchorGeneration
    } else {
      settleElapsed.current += delta
      const inSettle = settleElapsed.current < XR_PANEL_SETTLE_DURATION_SEC
      stepPanelGroundPosition(groundPos.current, _tgtPos, delta, inSettle)
      const followLambda = inSettle ? XR_PANEL_FOLLOW_LAMBDA_SPAWN : XR_PANEL_FOLLOW_LAMBDA_TRACK
      dampVectorToward(curPos.current, groundPos.current, followLambda, delta)
      dampQuaternionToward(curQuat.current, _tgtQuat, XR_PANEL_QUAT_LAMBDA, delta)
    }

    g.position.copy(curPos.current)
    g.quaternion.copy(curQuat.current)
  })

  return <group ref={groupRef}>{children}</group>
}
