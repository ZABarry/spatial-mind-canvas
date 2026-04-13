import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { Vector3 } from 'three'
import { useXR } from '@react-three/xr'
import { getInteractionPhase } from '../../input/interactionPhase'
import { useRootStore } from '../../store/rootStore'

const _dir = new Vector3()
const _up = new Vector3()

/**
 * In-VR status: navigation mode, selection, and recovery hints.
 */
export function XrStatusHud() {
  const session = useXR((s) => s.session)
  const nav = useRootStore((s) => s.navigationMode)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const project = useRootStore((s) => s.project)
  const xrDebugHud = useRootStore((s) => s.xrDebugHud)
  const handPrimary = useRootStore((s) => s.xrHandTrackingPrimary)
  const interactionSession = useRootStore((s) => s.interactionSession)
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()

  const title = primary && project?.graph.nodes[primary]?.title
  const line1 = `Nav: ${nav}`
  const line2 = primary
    ? `Selected: ${title?.trim() || 'Untitled'}`
    : 'Nothing selected'
  const line3 =
    nav === 'travel'
      ? 'L stick: move · R stick: turn · Y: menu'
      : 'Grip: move/scale graph · Y: menu · Wrist: recenter & reset'

  const sessionHint =
    interactionSession.kind === 'link'
      ? 'Linking: aim at node or ground · same node cancels'
      : interactionSession.kind === 'nodeDrag'
        ? 'Dragging node'
        : interactionSession.kind === 'worldGrab'
          ? 'Moving world'
          : null

  const st = useRootStore.getState()
  const phase = getInteractionPhase({
    confirmDialog: st.confirmDialog,
    searchOpen: st.searchOpen,
    detailNodeId: st.detailNodeId,
    placementPreview: st.placementPreview,
    interactionMode: st.interactionMode,
    hover: st.hover,
    interactionSession: st.interactionSession,
  })
  const line4 =
    import.meta.env.DEV && xrDebugHud
      ? `dbg: phase=${phase} · handPrimary=${handPrimary ? 'y' : 'n'}`
      : null

  useFrame(() => {
    if (!session || !groupRef.current) return
    camera.getWorldDirection(_dir)
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    groupRef.current.position.copy(camera.position)
    groupRef.current.position.addScaledVector(_dir, 1.35)
    groupRef.current.position.addScaledVector(_up, -0.22)
  })

  if (!session) return null

  return (
    <group ref={groupRef}>
      <Billboard>
        <Text fontSize={0.036} color="#334155" anchorX="center" anchorY="top" position={[0, 0.07, 0]}>
          {line1}
        </Text>
        <Text fontSize={0.034} color="#475569" anchorX="center" anchorY="top" position={[0, 0.02, 0]}>
          {line2}
        </Text>
        <Text fontSize={0.028} color="#64748b" anchorX="center" anchorY="top" position={[0, -0.04, 0]} maxWidth={2.4}>
          {line3}
        </Text>
        {sessionHint ? (
          <Text
            fontSize={0.026}
            color="#0ea5e9"
            anchorX="center"
            anchorY="top"
            position={[0, -0.085, 0]}
            maxWidth={2.5}
          >
            {sessionHint}
          </Text>
        ) : null}
        {line4 ? (
          <Text
            fontSize={0.024}
            color="#94a3b8"
            anchorX="center"
            anchorY="top"
            position={[0, sessionHint ? -0.125 : -0.09, 0]}
            maxWidth={2.6}
          >
            {line4}
          </Text>
        ) : null}
      </Billboard>
    </group>
  )
}
