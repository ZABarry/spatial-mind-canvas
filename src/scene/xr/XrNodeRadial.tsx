import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useCallback, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'
import { hideAdvancedAuthoringForHandTracking } from '../../input/xr/handGestures'
import type { RadialIntent } from '../visual/interactionTokens'
import { radialIntentColors } from '../visual/interactionTokens'
import {
  runNodeAddChild,
  runNodeDelete,
  runNodeFocus,
  runNodeInspect,
  runNodeRecenter,
  runNodeStartLink,
} from './xrNodeMenuActions'

type RadialBtn = {
  label: string
  intent: RadialIntent
  disabled?: boolean
  footnote?: string
  onPress: () => void
}

const BTN_W = 0.22
const BTN_H = 0.11
const HIT_PAD = 1.35
const ARC_R = 0.44
const START_ANGLE = Math.PI * 0.58

/**
 * Contextual authoring for the selected node (VR). Node-specific only — wrist menu stays global.
 */
export function XrNodeRadial() {
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const handLite = useRootStore((s) => s.xrHandTrackingPrimary)
  const inXr = useRootStore((s) => s.xrSessionActive)
  const hideLink = hideAdvancedAuthoringForHandTracking(handLite)
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  const buttons: RadialBtn[] = useMemo(
    () => [
      { label: 'Child', intent: 'child', onPress: () => runNodeAddChild() },
      ...(hideLink
        ? ([
            {
              label: 'Link',
              intent: 'link' as const,
              disabled: true,
              footnote: 'Full Link on controllers',
              onPress: () => {},
            },
          ] as RadialBtn[])
        : ([{ label: 'Link', intent: 'link', onPress: () => runNodeStartLink() }] as RadialBtn[])),
      { label: 'Inspect', intent: 'inspect', onPress: () => runNodeInspect() },
      { label: 'Delete', intent: 'delete', onPress: () => runNodeDelete() },
      { label: 'Focus', intent: 'focus', onPress: () => runNodeFocus() },
      { label: 'Recenter', intent: 'recenter', onPress: () => runNodeRecenter() },
    ],
    [hideLink],
  )

  const beginRadialMenu = useCallback(() => {
    const st = useRootStore.getState()
    if (st.interactionSession.kind === 'idle' || st.interactionSession.kind === 'menu') {
      st.dispatch({ type: 'setMenuSession', menu: 'node' })
    }
  }, [])

  const endRadialMenu = useCallback(() => {
    const st = useRootStore.getState()
    if (st.interactionSession.kind === 'menu' && st.interactionSession.menu === 'node') {
      st.dispatch({ type: 'setMenuSession', menu: null })
    }
  }, [])

  if (!inXr || !project || !primary) return null
  const n = project.graph.nodes[primary]
  if (!n) return null

  const y = 0.55 * n.size + 0.52
  const nBtns = buttons.length
  const sweep = Math.PI * 1.05
  const step = nBtns > 1 ? sweep / (nBtns - 1) : 0

  return (
    <group position={n.position as unknown as [number, number, number]} userData={{ xrNodeRadial: true }}>
      <group position={[0, y, 0]}>
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[ARC_R * 0.55, ARC_R * 1.12, 48]} />
          <meshBasicMaterial
            color="#e8eef8"
            transparent
            opacity={0.35}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {buttons.map((b, i) => {
          const ang = START_ANGLE - i * step
          const x = Math.cos(ang) * ARC_R
          const z = Math.sin(ang) * ARC_R
          const isH = hovered === b.label
          const isP = pressed === b.label
          const pal = radialIntentColors(b.intent)
          const col = b.disabled ? pal.base : isP ? pal.press : isH ? pal.hover : pal.base
          const scale = isP ? 0.94 : isH ? 1.06 : 1

          const onDown = (e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation()
            if (!b.disabled) setPressed(b.label)
            beginRadialMenu()
          }
          const onUp = (e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation()
            setPressed(null)
            if (!b.disabled) b.onPress()
            endRadialMenu()
          }

          return (
            <group key={b.label} position={[x, 0, z]} userData={{ xrNodeRadial: true }}>
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
                <boxGeometry args={[BTN_W * HIT_PAD, BTN_H * HIT_PAD, 0.05]} />
                <meshStandardMaterial
                  color={col}
                  emissive={col}
                  emissiveIntensity={b.disabled ? 0.05 : isH || isP ? 0.32 : 0.14}
                  roughness={0.42}
                  metalness={0.1}
                  transparent={b.disabled}
                  opacity={b.disabled ? 0.55 : 1}
                />
              </mesh>
              <Text
                position={[0, 0, 0.03]}
                fontSize={0.035}
                color={b.disabled ? '#94a3b8' : pal.label}
                anchorX="center"
                anchorY="middle"
                maxWidth={BTN_W * 1.2}
                raycast={() => null}
              >
                {b.label}
              </Text>
              {b.footnote ? (
                <Text
                  position={[0, -0.05, 0.03]}
                  fontSize={0.018}
                  color="#94a3b8"
                  anchorX="center"
                  anchorY="middle"
                  maxWidth={BTN_W * 1.4}
                  raycast={() => null}
                >
                  {b.footnote}
                </Text>
              ) : null}
            </group>
          )
        })}
      </group>
    </group>
  )
}
