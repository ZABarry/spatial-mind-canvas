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
  XR_PANEL_REHOME_ENTER_M,
  XR_PANEL_REHOME_LOCK_M,
  XR_PANEL_SETTLE_DURATION_SEC,
  type XrPanelLane,
} from './anchors/xrPanelSpawner'
import { activeLanesFromSnapshot, applyPanelClusterNudge } from './anchors/xrPanelLayout'
import { useRootStore } from '../../store/rootStore'

const _tgtPos = new THREE.Vector3()
const _tgtQuat = new THREE.Quaternion()

/** Face the user smoothly while position is grounded — readable without rigid HUD snap. */
const XR_PANEL_QUAT_LAMBDA = 7.8

/**
 * Head-guided world-space placement for Html panels (Quest). On spawn / recall, panels track the
 * head slot briefly, then **settle** into world space. While settled, the anchor stays put until
 * the comfortable slot drifts far enough — then it **re-homes** calmly (no constant head-glued drift).
 * Orientation keeps facing you. Recall bumps re-seed from the current view.
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
  const detailOpen = useRootStore((s) => s.detailNodeId != null)
  const searchOrHistoryOpen = useRootStore((s) => s.searchOpen || s.mapHistoryOpen)
  const settingsOpen = useRootStore((s) => s.settingsOpen)
  const bookmarksOpen = useRootStore((s) => s.bookmarksPanelOpen)

  const curPos = React.useRef(new THREE.Vector3())
  const curQuat = React.useRef(new THREE.Quaternion())
  const groundPos = React.useRef(new THREE.Vector3())
  const lastGen = React.useRef(-1)
  const settleElapsed = React.useRef(0)
  const rehomeChase = React.useRef(false)

  const activeLanes = React.useMemo(
    () =>
      activeLanesFromSnapshot({
        detailOpen,
        searchOrHistoryOpen,
        settingsOpen,
        bookmarksOpen,
      }),
    [detailOpen, searchOrHistoryOpen, settingsOpen, bookmarksOpen],
  )

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    const laneOpts = panelLanePoseOptions(lane)
    computeHeadAnchoredPanelPose(camera, lane, _tgtPos, _tgtQuat, laneOpts)
    applyPanelClusterNudge(lane, activeLanes, camera, _tgtPos)

    if (lastGen.current !== anchorGeneration) {
      curPos.current.copy(_tgtPos)
      curQuat.current.copy(_tgtQuat)
      groundPos.current.copy(_tgtPos)
      settleElapsed.current = 0
      rehomeChase.current = false
      lastGen.current = anchorGeneration
    } else {
      settleElapsed.current += delta
      const inSettle = settleElapsed.current < XR_PANEL_SETTLE_DURATION_SEC

      if (inSettle) {
        stepPanelGroundPosition(groundPos.current, _tgtPos, delta, true)
        rehomeChase.current = false
      } else {
        const dist = groundPos.current.distanceTo(_tgtPos)
        if (!rehomeChase.current) {
          if (dist > XR_PANEL_REHOME_ENTER_M) {
            rehomeChase.current = true
          }
        } else {
          stepPanelGroundPosition(groundPos.current, _tgtPos, delta, false)
          if (groundPos.current.distanceTo(_tgtPos) < XR_PANEL_REHOME_LOCK_M) {
            rehomeChase.current = false
          }
        }
      }

      const followLambda = inSettle ? XR_PANEL_FOLLOW_LAMBDA_SPAWN : XR_PANEL_FOLLOW_LAMBDA_TRACK
      dampVectorToward(curPos.current, groundPos.current, followLambda, delta)
      dampQuaternionToward(curQuat.current, _tgtQuat, XR_PANEL_QUAT_LAMBDA, delta)
    }

    g.position.copy(curPos.current)
    g.quaternion.copy(curQuat.current)
  })

  return <group ref={groupRef}>{children}</group>
}
