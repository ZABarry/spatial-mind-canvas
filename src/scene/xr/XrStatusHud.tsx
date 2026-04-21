import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { useXR } from '@react-three/xr'
import { getInteractionPhase } from '../../input/interactionPhase'
import { useRootStore } from '../../store/rootStore'
import {
  getOnboardingCue,
  getOnboardingMilestone,
  shouldShowOnboarding,
} from '../../ui/onboarding/onboardingModel'
import { interactionTokens, isValidLinkNodeTarget } from '../visual/interactionTokens'
import { formatSceneMetricsLine } from '../sceneMetrics'
import { applyHeadHudAnchor } from './anchors/xrHeadHudAnchor'
import { computeXrHudGuidance, hasOpenFloatingPanel } from './xrHudGuidance'

/**
 * In-VR status: tool, navigation mode, selection, active gesture, and recovery hints.
 * Pose is head-locked via {@link applyHeadHudAnchor} (camera-local offset + headset orientation).
 * {@link Billboard} keeps troika text facing the view ray for readability.
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
  const onboardingDidRecenter = useRootStore((s) => s.onboardingDidRecenter)
  const onboardingDidUndo = useRootStore((s) => s.onboardingDidUndo)
  const mapHistoryOpen = useRootStore((s) => s.mapHistoryOpen)
  const bookmarksPanelOpen = useRootStore((s) => s.bookmarksPanelOpen)
  const saveIndicator = useRootStore((s) => s.saveIndicator)
  const feedbackMessage = useRootStore((s) => s.feedbackMessage)
  const xrGrabAffordance = useRootStore((s) => s.xrGrabAffordance)
  const xrDisableHandGrab = useRootStore((s) => s.devicePreferences.xrDisableHandWorldGrab === true)
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
      return 'Travel · sticks move/strafe & turn · Y: wrist menu'
    }
    if (handPrimary) {
      if (xrDisableHandGrab) {
        return 'Hand · pinch select · palm menu · workspace pinch off (Settings) · controllers: Link & precision'
      }
      return 'Hand · pinch select · palm menu · pinch grab workspace · Child/Inspect on strip · controllers: Link'
    }
    return 'World · trigger · grip · Y · node actions strip'
  }, [nav, handPrimary, xrDisableHandGrab])

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
      const sess = interactionSession
      const pt = sess.previewTarget
      const from = sess.fromNodeId
      if (isValidLinkNodeTarget(pt, from)) return 'Linking: release trigger to connect'
      if (pt?.kind === 'ground') return 'Linking: release trigger to place a new node and connect'
      if (pt?.kind === 'node' && pt.nodeId === from) return 'Linking: invalid — aim at another node or ground'
      return 'Linking: aim at another node, ground, or cancel (Esc / wrist)'
    }
    if (interactionSession.kind === 'nodeDrag') return 'Dragging node'
    if (interactionSession.kind === 'worldGrab') {
      if (xrGrabAffordance === 'grab2') {
        return 'Workspace · two hands — spread/pinch scales · opposite slide turns · release to finish'
      }
      return 'Workspace · move — release grip/pinch to finish · wrist Cancel if stuck'
    }
    if (interactionSession.kind === 'menu') {
      return interactionSession.menu === 'global' ? 'Wrist menu' : 'Node actions'
    }
    return null
  }, [interactionSession, xrGrabAffordance])

  const recoveryHint = useMemo(() => {
    if (confirmDialog) return 'Dialog open — complete or cancel (flat UI if needed)'
    if (textPromptDialog) return 'Prompt open — submit or Esc'
    if (searchOpen) return 'Search open — close from wrist Cancel'
    if (mapHistoryOpen) return 'Version history open — Close'
    if (bookmarksPanelOpen) return 'Bookmarks open — Close'
    if (detailNodeId) return 'Node detail open — close panel to resume'
    if (settingsOpen) return 'Settings open — close to resume'
    if (xrHelpOpen) return 'Help open — close button or wrist Cancel'
    return null
  }, [
    confirmDialog,
    textPromptDialog,
    searchOpen,
    mapHistoryOpen,
    bookmarksPanelOpen,
    detailNodeId,
    settingsOpen,
    xrHelpOpen,
  ])

  const floatingPanelOpen = hasOpenFloatingPanel({
    searchOpen,
    detailNodeId,
    settingsOpen,
    mapHistoryOpen,
    bookmarksPanelOpen,
    xrHelpOpen,
  })

  const onboardingRows = useMemo(() => {
    if (!shouldShowOnboarding(onboardingDismissed, onboardingCoreComplete)) return []
    if (interactionSession.kind !== 'idle') return []
    if (floatingPanelOpen || confirmDialog || textPromptDialog) return []
    const m = getOnboardingMilestone({
      project,
      primaryNodeId: primary ?? null,
      detailNodeId,
      seenSelection: onboardingSeenSelection,
      didRecenter: onboardingDidRecenter,
      didUndo: onboardingDidUndo,
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
    onboardingDidRecenter,
    onboardingDidUndo,
    project,
    primary,
    detailNodeId,
    interactionSession.kind,
    handPrimary,
    floatingPanelOpen,
    confirmDialog,
    textPromptDialog,
  ])

  const persistHint = useMemo(() => {
    if (feedbackMessage) return feedbackMessage.text
    if (saveIndicator === 'pending') return 'Save: pending changes…'
    if (saveIndicator === 'saving') return 'Save: writing…'
    if (saveIndicator === 'saved') return 'Save: stored'
    if (saveIndicator === 'error') return 'Save: failed — check storage'
    return null
  }, [feedbackMessage, saveIndicator])

  const hudGuidance = useMemo(
    () =>
      computeXrHudGuidance({
        confirmDialog,
        textPromptDialog,
        interactionSession,
        floatingPanelOpen,
      }),
    [confirmDialog, textPromptDialog, interactionSession, floatingPanelOpen],
  )

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
      ? `${formatSceneMetricsLine(project, {
          searchOpen,
          mapHistoryOpen,
          bookmarksPanelOpen,
          detailNodeId,
          settingsOpen,
          xrHelpOpen,
          confirmDialog,
          textPromptDialog,
          xrHandTrackingPrimary: handPrimary,
        })} · phase=${phase} · dom=${dominantHand}`
      : null

  const pinchWarmHint = useMemo(() => {
    if (!handPrimary || nav !== 'world' || xrDisableHandGrab) return null
    if (interactionSession.kind !== 'idle') return null
    if (xrGrabAffordance !== 'pinchNear') return null
    return 'Pinch a little closer to grab the workspace'
  }, [handPrimary, nav, xrDisableHandGrab, interactionSession.kind, xrGrabAffordance])

  const idleNudge = useMemo(() => {
    if (primary != null) return null
    if (interactionSession.kind !== 'idle') return null
    if (nav === 'travel') return null
    return handPrimary ? 'Nothing selected — pinch a node to begin' : 'Nothing selected — aim and pull trigger'
  }, [primary, interactionSession.kind, nav, handPrimary])

  const quietIdle =
    hudGuidance.density === 'full' &&
    interactionSession.kind === 'idle' &&
    !recoveryHint &&
    !sessionHint &&
    !pinchWarmHint &&
    !confirmDialog &&
    !textPromptDialog &&
    onboardingRows.length === 0 &&
    feedbackMessage == null

  const rows = useMemo(() => {
    const g = hudGuidance
    const tertiarySize = quietIdle ? 0.024 : 0.026
    const tertiaryColor = quietIdle ? '#7c8ca3' : '#64748b'
    const r: { text: string; size: number; color: string; maxW?: number }[] = []

    if (g.baseLines >= 1) {
      r.push({ text: line1, size: quietIdle ? 0.032 : 0.034, color: '#334155' })
    }
    if (g.baseLines >= 2) {
      r.push({ text: line2, size: quietIdle ? 0.03 : 0.032, color: '#475569' })
    }
    if (g.baseLines >= 3 && g.showModeLine) {
      r.push({ text: line3, size: tertiarySize, color: tertiaryColor, maxW: 2.55 })
    }

    if (g.showIdleNudge && idleNudge && onboardingRows.length === 0 && !quietIdle) {
      r.push({ text: idleNudge, size: 0.022, color: '#94a3b8', maxW: 2.55 })
    }
    if (g.showOnboarding) {
      for (const o of onboardingRows) {
        r.push(o)
      }
    }
    if (g.showPinchWarm && pinchWarmHint) {
      r.push({ text: pinchWarmHint, size: 0.023, color: '#0d9488', maxW: 2.55 })
    }
    if (g.showSessionHint && sessionHint) {
      const hintColor =
        interactionSession.kind === 'link'
          ? linkHudColor
          : interactionSession.kind === 'menu'
            ? '#64748b'
            : '#475569'
      r.push({ text: sessionHint, size: 0.025, color: hintColor, maxW: 2.55 })
    }
    if (g.showRecovery && recoveryHint) {
      r.push({ text: recoveryHint, size: 0.024, color: '#b45309', maxW: 2.55 })
    }
    if (g.showPersist && persistHint) {
      const c =
        feedbackMessage?.tone === 'error' || saveIndicator === 'error'
          ? '#b91c1c'
          : feedbackMessage?.tone === 'success' || saveIndicator === 'saved'
            ? '#0f766e'
            : '#64748b'
      r.push({ text: persistHint, size: 0.023, color: c, maxW: 2.55 })
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
    pinchWarmHint,
    sessionHint,
    recoveryHint,
    persistHint,
    feedbackMessage,
    saveIndicator,
    lineDbg,
    linkHudColor,
    interactionSession.kind,
    quietIdle,
    hudGuidance,
  ])

  useFrame(() => {
    if (!session || !groupRef.current) return
    applyHeadHudAnchor(groupRef.current, camera)
  })

  if (!session) return null

  let y = 0.08
  const gap = quietIdle ? 0.034 : hudGuidance.density === 'minimal' ? 0.036 : 0.042
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
