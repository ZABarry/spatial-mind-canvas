import { Billboard, Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useMemo, useRef, useState } from 'react'
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
import { COPY_CONTROLLERS_FOR_LINK } from './productCopy'

type ActionBtn = {
  label: string
  intent: RadialIntent
  disabled?: boolean
  footnote?: string
  onPress: () => void
}

const CHIP_W = 0.14
const CHIP_H = 0.065
const GAP = 0.02
const DEPTH = 0.018

/**
 * Contextual node actions for VR — billboard strip toward the user (replaces arc radial).
 * Graph transform is applied so the strip stays on the node after pan/scale.
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
  const _off = useRef(new THREE.Vector3())

  const buttons: ActionBtn[] = useMemo(
    () => [
      { label: 'Child', intent: 'child', onPress: () => runNodeAddChild() },
      ...(hideLink
        ? ([
            {
              label: 'Link',
              intent: 'link' as const,
              disabled: true,
              footnote: COPY_CONTROLLERS_FOR_LINK,
              onPress: () => {},
            },
          ] as ActionBtn[])
        : ([{ label: 'Link', intent: 'link', onPress: () => runNodeStartLink() }] as ActionBtn[])),
      { label: 'Inspect', intent: 'inspect', onPress: () => runNodeInspect() },
      { label: 'Delete', intent: 'delete', onPress: () => runNodeDelete() },
      { label: 'Focus', intent: 'focus', onPress: () => runNodeFocus() },
      { label: 'Recenter', intent: 'recenter', onPress: () => runNodeRecenter() },
    ],
    [hideLink],
  )

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

  useFrame(() => {
    const g = anchorRef.current
    if (!g || !project || !primary) return
    const n = project.graph.nodes[primary]
    if (!n) return
    const nodeWorld = new THREE.Vector3().fromArray(
      graphPointToWorld(project.worldTransform, n.position, XR_STANDING_GRAPH_OFFSET),
    )
    computeContextualActionOffset(nodeWorld, camera.position, n.size, _off.current)
    g.position.copy(nodeWorld).add(_off.current)
  })

  if (!inXr || !project || !primary) return null
  const n = project.graph.nodes[primary]
  if (!n) return null

  const totalW = buttons.length * CHIP_W + (buttons.length - 1) * GAP
  const startX = -totalW / 2 + CHIP_W / 2

  return (
    <group ref={anchorRef}>
      <Billboard>
        <group userData={{ xrNodeRadial: true }}>
          {buttons.map((b, i) => {
            const x = startX + i * (CHIP_W + GAP)
            const isH = hovered === b.label
            const isP = pressed === b.label
            const pal = radialIntentColors(b.intent)
            const col = b.disabled ? pal.base : isP ? pal.press : isH ? pal.hover : pal.base
            const scale = isP ? 0.94 : isH ? 1.04 : 1

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
              <group key={b.label} position={[x, 0, 0]} userData={{ xrNodeRadial: true }}>
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
                  <boxGeometry args={[CHIP_W * 1.15, CHIP_H * 1.2, DEPTH]} />
                  <meshStandardMaterial
                    color={col}
                    emissive={col}
                    emissiveIntensity={b.disabled ? 0.05 : isH || isP ? 0.28 : 0.12}
                    roughness={0.45}
                    metalness={0.08}
                    transparent={b.disabled}
                    opacity={b.disabled ? 0.55 : 1}
                  />
                </mesh>
                <Text
                  position={[0, 0, DEPTH * 0.6]}
                  fontSize={0.026}
                  color={b.disabled ? '#94a3b8' : pal.label}
                  anchorX="center"
                  anchorY="middle"
                  maxWidth={CHIP_W * 1.1}
                  raycast={() => null}
                >
                  {b.label}
                </Text>
                {b.footnote ? (
                  <Text
                    position={[0, -0.048, DEPTH * 0.6]}
                    fontSize={0.015}
                    color="#94a3b8"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={CHIP_W * 1.3}
                    raycast={() => null}
                  >
                    {b.footnote}
                  </Text>
                ) : null}
              </group>
            )
          })}
        </group>
      </Billboard>
    </group>
  )
}
