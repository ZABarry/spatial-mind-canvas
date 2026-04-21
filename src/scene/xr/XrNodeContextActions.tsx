import { Billboard, Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Group } from 'three'
import { hideAdvancedAuthoringForHandTracking } from '../../input/xr/handGestures'
import { useRootStore } from '../../store/rootStore'
import { graphPointToWorld, XR_STANDING_GRAPH_OFFSET } from '../../utils/math'
import type { RadialIntent } from '../visual/interactionTokens'
import { radialIntentColors } from '../visual/interactionTokens'
import { computeContextualActionOffset } from './anchors/xrContextAnchor'
import {
  runNodeAddChild,
  runNodeDelete,
  runNodeFocus,
  runNodeInspect,
  runNodeRecenter,
  runNodeStartLink,
} from './xrNodeMenuActions'
import { COPY_CONTROLLERS_FOR_LINK, COPY_LINK_CONTROLLERS_BADGE } from './productCopy'
import { dampScalarToward } from './xrMotion'

type ActionBtn = {
  label: string
  intent: RadialIntent
  tier: 'primary' | 'secondary' | 'destructive'
  disabled?: boolean
  footnote?: string
  onPress: () => void
}

const CHIP_PRIMARY_W = 0.156
const CHIP_PRIMARY_H = 0.076
const CHIP_SECONDARY_W = 0.128
const CHIP_SECONDARY_H = 0.06
const CHIP_DELETE_W = 0.1
const CHIP_DELETE_H = 0.092
const GAP_P = 0.02
const GAP_S = 0.016
const DEPTH = 0.018
const PRIMARY_ROW_Y = 0.078
const SECONDARY_ROW_Y = -0.064
/** Destructive control sits in a separated column (not another “chip in the row”). */
const DELETE_COLUMN_X = 0.34
const PLATE_Z = -0.006

/**
 * Contextual node actions for VR — layered strip (primary / secondary / delete) with distance-aware scale.
 */
export function XrNodeContextActions() {
  const { camera } = useThree()
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const handLite = useRootStore((s) => s.xrHandTrackingPrimary)
  const inXr = useRootStore((s) => s.xrSessionActive)
  const hideLink = hideAdvancedAuthoringForHandTracking(handLite)
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const anchorRef = useRef<Group>(null)
  const contentRef = useRef<Group>(null)
  const appearRef = useRef(0)
  const _off = useRef(new THREE.Vector3())

  const buttons: ActionBtn[] = useMemo(
    () => [
      { label: 'Child', intent: 'child', tier: 'primary', onPress: () => runNodeAddChild() },
      ...(hideLink
        ? ([
            {
              label: 'Link',
              intent: 'link' as const,
              tier: 'primary' as const,
              disabled: true,
              footnote: COPY_CONTROLLERS_FOR_LINK,
              onPress: () => {},
            },
          ] as ActionBtn[])
        : ([{ label: 'Link', intent: 'link', tier: 'primary', onPress: () => runNodeStartLink() }] as ActionBtn[])),
      { label: 'Inspect', intent: 'inspect', tier: 'primary', onPress: () => runNodeInspect() },
      { label: 'Focus', intent: 'focus', tier: 'secondary', onPress: () => runNodeFocus() },
      { label: 'Recenter', intent: 'recenter', tier: 'secondary', onPress: () => runNodeRecenter() },
      { label: 'Delete', intent: 'delete', tier: 'destructive', onPress: () => runNodeDelete() },
    ],
    [hideLink],
  )

  const primaryActions = useMemo(() => buttons.filter((b) => b.tier === 'primary'), [buttons])
  const secondaryActions = useMemo(() => buttons.filter((b) => b.tier === 'secondary'), [buttons])
  const deleteAction = useMemo(() => buttons.find((b) => b.tier === 'destructive'), [buttons])

  const beginContextMenu = useCallback(() => {
    const st = useRootStore.getState()
    if (st.interactionSession.kind === 'idle' || st.interactionSession.kind === 'menu') {
      st.dispatch({ type: 'setMenuSession', menu: 'node' })
    }
  }, [])

  const endContextMenu = useCallback(() => {
    const st = useRootStore.getState()
    if (st.interactionSession.kind === 'menu' && st.interactionSession.menu === 'node') {
      st.dispatch({ type: 'setMenuSession', menu: null })
    }
  }, [])

  useEffect(() => {
    appearRef.current = 0
  }, [primary])

  useFrame((_, delta) => {
    const g = anchorRef.current
    const inner = contentRef.current
    if (!g || !project || !primary) return
    const n = project.graph.nodes[primary]
    if (!n) return
    const nodeWorld = new THREE.Vector3().fromArray(
      graphPointToWorld(project.worldTransform, n.position, XR_STANDING_GRAPH_OFFSET),
    )
    computeContextualActionOffset(nodeWorld, camera.position, n.size, _off.current)
    g.position.copy(nodeWorld).add(_off.current)

    const dist = g.position.distanceTo(camera.position)
    const distScale = THREE.MathUtils.clamp(dist * 0.2, 0.82, 1.22)
    appearRef.current = dampScalarToward(appearRef.current, 1, 9.2, delta)
    const ease = 1 - (1 - appearRef.current) ** 2.35
    const s = Math.max(0.25, ease) * distScale
    if (inner) inner.scale.setScalar(s)
  })

  const renderChip = (
    b: ActionBtn,
    i: number,
    rowY: number,
    startX: number,
    chipW: number,
    chipH: number,
    gap: number,
  ) => {
    const x = startX + i * (chipW + gap)
    const isH = hovered === b.label
    const isP = pressed === b.label
    const pal = radialIntentColors(b.intent)
    const col = b.disabled ? pal.base : isP ? pal.press : isH ? pal.hover : pal.base
    const scale = isP ? 0.92 : isH ? 1.05 : 1
    const em =
      b.tier === 'secondary'
        ? b.disabled
          ? 0.04
          : isP
            ? 0.22
            : isH
              ? 0.15
              : 0.07
        : b.disabled
          ? 0.04
          : isP
            ? 0.34
            : isH
              ? 0.34
              : b.tier === 'primary' && (b.intent === 'child' || b.intent === 'inspect' || b.intent === 'link')
                ? 0.2
                : 0.15

    const onDown = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      if (!b.disabled) setPressed(b.label)
      beginContextMenu()
    }
    const onUp = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setPressed(null)
      if (!b.disabled) b.onPress()
      endContextMenu()
    }

    return (
      <group key={b.label} position={[x, rowY, 0]} userData={{ xrNodeRadial: true }}>
        <mesh
          scale={scale}
          userData={{ xrNodeRadial: true }}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerOver={(e) => {
            e.stopPropagation()
            if (!b.disabled) setHovered(b.label)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHovered(null)
            setPressed(null)
          }}
        >
          <boxGeometry args={[chipW * 1.12, chipH * 1.15, DEPTH]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={em}
            roughness={b.tier === 'destructive' ? 0.35 : 0.45}
            metalness={0.06}
            transparent={b.disabled}
            opacity={b.disabled ? 0.5 : 1}
          />
        </mesh>
        <Text
          position={[0, 0, DEPTH * 0.55]}
          fontSize={
            b.tier === 'secondary'
              ? 0.02
              : b.tier === 'primary' && (b.intent === 'child' || b.intent === 'inspect' || b.intent === 'link')
                ? 0.03
                : b.tier === 'primary'
                  ? 0.028
                  : 0.022
          }
          color={b.disabled ? '#94a3b8' : pal.label}
          anchorX="center"
          anchorY="middle"
          maxWidth={chipW * 1.05}
          raycast={() => null}
        >
          {b.label}
        </Text>
        {b.disabled && b.footnote ? (
          <group position={[chipW * 0.38, chipH * 0.34, DEPTH * 0.55]}>
            <mesh raycast={() => null}>
              <planeGeometry args={[0.072, 0.024]} />
              <meshBasicMaterial color="#475569" transparent opacity={0.92} />
            </mesh>
            <Text
              position={[0, 0, 0.0015]}
              fontSize={0.012}
              color="#f1f5f9"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              {COPY_LINK_CONTROLLERS_BADGE}
            </Text>
          </group>
        ) : null}
        {b.footnote && !b.disabled ? (
          <Text
            position={[0, -0.045, DEPTH * 0.55]}
            fontSize={0.014}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            maxWidth={chipW * 1.3}
            raycast={() => null}
          >
            {b.footnote}
          </Text>
        ) : null}
      </group>
    )
  }

  if (!inXr || !project || !primary) return null
  const n = project.graph.nodes[primary]
  if (!n) return null

  const pw = primaryActions.length * CHIP_PRIMARY_W + (primaryActions.length - 1) * GAP_P
  const pStart = -pw / 2 + CHIP_PRIMARY_W / 2
  const sw = secondaryActions.length * CHIP_SECONDARY_W + (secondaryActions.length - 1) * GAP_S
  const sStart = -sw / 2 + CHIP_SECONDARY_W / 2
  const plateW = pw + 0.05
  const plateH = PRIMARY_ROW_Y - SECONDARY_ROW_Y + CHIP_PRIMARY_H * 0.65 + 0.04
  const plateY = (PRIMARY_ROW_Y + SECONDARY_ROW_Y) * 0.5

  return (
    <group ref={anchorRef}>
      <group ref={contentRef}>
        <Billboard>
          <group userData={{ xrNodeRadial: true }}>
            <mesh position={[0, plateY, PLATE_Z]} raycast={() => null}>
              <planeGeometry args={[plateW, plateH]} />
              <meshStandardMaterial
                color="#e8eef8"
                emissive="#cbd5e1"
                emissiveIntensity={0.06}
                roughness={0.55}
                metalness={0.02}
                transparent
                opacity={0.44}
              />
            </mesh>
            {primaryActions.map((b, i) =>
              renderChip(b, i, PRIMARY_ROW_Y, pStart, CHIP_PRIMARY_W, CHIP_PRIMARY_H, GAP_P),
            )}
            {secondaryActions.map((b, i) =>
              renderChip(b, i, SECONDARY_ROW_Y, sStart, CHIP_SECONDARY_W, CHIP_SECONDARY_H, GAP_S),
            )}
            <mesh position={[DELETE_COLUMN_X * 0.52, plateY, PLATE_Z * 0.5]} raycast={() => null}>
              <planeGeometry args={[0.004, plateH * 0.78]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.55} />
            </mesh>
            {deleteAction
              ? renderChip(
                  deleteAction,
                  0,
                  (PRIMARY_ROW_Y + SECONDARY_ROW_Y) / 2,
                  DELETE_COLUMN_X,
                  CHIP_DELETE_W,
                  CHIP_DELETE_H,
                  GAP_S,
                )
              : null}
          </group>
        </Billboard>
      </group>
    </group>
  )
}
