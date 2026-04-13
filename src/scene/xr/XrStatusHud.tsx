import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Vector3 } from 'three'
import { useXR } from '@react-three/xr'
import { getInteractionPhase } from '../../input/interactionPhase'
import { useRootStore } from '../../store/rootStore'
import {
  getOnboardingCue,
  getOnboardingMilestone,
  shouldShowOnboarding,
} from '../../ui/onboarding/onboardingModel'
import { interactionTokens } from '../visual/interactionTokens'

const _dir = new Vector3()
const _up = new Vector3()

/**
 * In-VR status: tool, navigation mode, selection, active gesture, and recovery hints.
 */
export function XrStatusHud() {
  const session = useXR((s) => s.session)
  const nav = useRootStore((s) => s.navigationMode)
  const interactionMode = useRootStore((s) => s.interactionMode)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const project = useRootStore((s) => s.project)
  const xrDebugHud = useRootStore((s) => s.xrDebugHud)
  const handPrimary = useRootStore((s) => s.xrHandTrackingPrimary)
  const interactionSession = useRootStore((s) => s.interactionSession)
  const dominantHand = useRootStore((s) => s.devicePreferences.dominantHand)
  const searchOpen = useRootStore((s) => s.searchOpen)
  const detailNodeId = useRootStore((s) => s.detailNodeId)
  const settingsOpen = useRootStore((s) => s.settingsOpen)
  const xrHelpOpen = useRootStore((s) => s.xrHelpOpen)
  const confirmDialog = useRootStore((s) => s.confirmDialog)
  const textPromptDialog = useRootStore((s) => s.textPromptDialog)
  const onboardingDismissed = useRootStore((s) => s.onboardingDismissed)
  const onboardingCoreComplete = useRootStore((s) => s.onboardingCoreComplete)
  const onboardingSeenSelection = useRootStore((s) => s.onboardingSeenSelection)
  const groupRef = useRef<Group>(null)
  const { camera } = useThree()

  const toolLabel = interactionMode === 'travel' ? 'Travel' : 'World'
  const title = primary && project?.graph.nodes[primary]?.title

  const line1 = `Tool: ${toolLabel} · Nav: ${nav}`
  const line2 = primary
    ? `Selected: ${title?.trim() || 'Untitled'}`
    : 'Nothing selected'

  const line3 = useMemo(() => {
    if (nav === 'travel') {
      return 'Left stick: move/strafe · Right stick: turn · Y: wrist menu · Dominant hand (Settings) biases aim'
    }
    if (handPrimary) {
      return 'Hand mode: pinch/select · palm opens menu · Radial: Child & Inspect — controllers: full Link'
    }
    return 'Trigger: select/confirm · Grip: move/scale graph (not during menus) · Y: wrist menu · Radial: node actions'
  }, [nav, handPrimary])

  const linkHudColor = useMemo(() => {
    if (interactionSession.kind !== 'link') return interactionTokens.link
    const pt = interactionSession.previewTarget
    if (pt?.kind === 'node' && pt.nodeId !== interactionSession.fromNodeId) {
      return interactionTokens.success
    }
    return interactionTokens.link
  }, [interactionSession])

  const sessionHint = useMemo(() => {
    if (interactionSession.kind === 'link') {
      return 'Linking: aim at another node (teal), ground, or same node to cancel'
    }
    if (interactionSession.kind === 'nodeDrag') return 'Dragging node'
    if (interactionSession.kind === 'worldGrab')
      return 'Moving/scaling world — release grips to finish · wrist Cancel if stuck'
    if (interactionSession.kind === 'menu') {
      return interactionSession.menu === 'global' ? 'Wrist menu' : 'Node radial'
    }
    return null
  }, [interactionSession])

  const recoveryHint = useMemo(() => {
    if (confirmDialog) return 'Dialog open — complete or cancel (flat UI if needed)'
    if (textPromptDialog) return 'Prompt open — submit or Esc'
    if (searchOpen) return 'Search open — close from wrist Cancel'
    if (detailNodeId) return 'Node detail open — close panel to resume'
    if (settingsOpen) return 'Settings open — close to resume'
    if (xrHelpOpen) return 'Help open — close button or wrist Cancel'
    return null
  }, [confirmDialog, textPromptDialog, searchOpen, detailNodeId, settingsOpen, xrHelpOpen])

  const onboardingRows = useMemo(() => {
    if (!shouldShowOnboarding(onboardingDismissed, onboardingCoreComplete)) return []
    if (interactionSession.kind !== 'idle') return []
    const m = getOnboardingMilestone({
      project,
      primaryNodeId: primary ?? null,
      detailNodeId,
      seenSelection: onboardingSeenSelection,
    })
    if (m === 'complete') return []
    const surface = handPrimary ? 'xr_hand' : 'xr_controller'
    const cue = getOnboardingCue(m, surface)
    if (!cue) return []
    const rows: { text: string; size: number; color: string; maxW?: number }[] = [
      { text: `Start: ${cue.headline}`, size: 0.024, color: '#0d9488', maxW: 2.55 },
    ]
    if (cue.subline) {
      rows.push({ text: cue.subline, size: 0.021, color: '#64748b', maxW: 2.55 })
    }
    return rows
  }, [
    onboardingDismissed,
    onboardingCoreComplete,
    onboardingSeenSelection,
    project,
    primary,
    detailNodeId,
    interactionSession.kind,
    handPrimary,
  ])

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
  const lineDbg =
    import.meta.env.DEV && xrDebugHud
      ? `dbg: phase=${phase} · dom=${dominantHand} · handOnly=${handPrimary ? 'y' : 'n'}`
      : null

  const idleNudge = useMemo(() => {
    if (primary != null) return null
    if (interactionSession.kind !== 'idle') return null
    if (nav === 'travel') return null
    return handPrimary ? 'Nothing selected — pinch a node to begin' : 'Nothing selected — aim and pull trigger'
  }, [primary, interactionSession.kind, nav, handPrimary])

  const rows = useMemo(() => {
    const r: { text: string; size: number; color: string; maxW?: number }[] = [
      { text: line1, size: 0.034, color: '#334155' },
      { text: line2, size: 0.032, color: '#475569' },
      { text: line3, size: 0.026, color: '#64748b', maxW: 2.55 },
    ]
    if (idleNudge && onboardingRows.length === 0) {
      r.push({ text: idleNudge, size: 0.022, color: '#94a3b8', maxW: 2.55 })
    }
    for (const o of onboardingRows) {
      r.push(o)
    }
    if (sessionHint) {
      const hintColor =
        interactionSession.kind === 'link'
          ? linkHudColor
          : interactionSession.kind === 'menu'
            ? '#64748b'
            : '#475569'
      r.push({ text: sessionHint, size: 0.025, color: hintColor, maxW: 2.55 })
    }
    if (recoveryHint) {
      r.push({ text: recoveryHint, size: 0.024, color: '#b45309', maxW: 2.55 })
    }
    if (lineDbg) {
      r.push({ text: lineDbg, size: 0.022, color: '#94a3b8', maxW: 2.6 })
    }
    return r
  }, [
    line1,
    line2,
    line3,
    idleNudge,
    onboardingRows,
    sessionHint,
    recoveryHint,
    lineDbg,
    linkHudColor,
    interactionSession.kind,
  ])

  useFrame(() => {
    if (!session || !groupRef.current) return
    camera.getWorldDirection(_dir)
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    groupRef.current.position.copy(camera.position)
    groupRef.current.position.addScaledVector(_dir, 1.35)
    groupRef.current.position.addScaledVector(_up, -0.22)
  })

  if (!session) return null

  let y = 0.08
  const gap = 0.042
  return (
    <group ref={groupRef}>
      <Billboard>
        {rows.map((row, i) => {
          const posY = y
          y -= gap + row.size * 1.15
          return (
            <Text
              key={`hud-${i}`}
              fontSize={row.size}
              color={row.color}
              anchorX="center"
              anchorY="top"
              position={[0, posY, 0]}
              maxWidth={row.maxW}
            >
              {row.text}
            </Text>
          )
        })}
      </Billboard>
    </group>
  )
}
