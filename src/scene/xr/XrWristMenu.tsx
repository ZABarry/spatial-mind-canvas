import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useRootStore } from '../../store/rootStore'
import { tryHandleXrMenuObject, type XrMenuHit } from './xrMenuActions'
import {
  palmFacingHeadScore,
  updatePalmMenuVisibility,
  type PalmFacingHysteresis,
} from './palmFacing'

/**
 * Quest / OpenXR left controller: secondary face button (Y).
 * If the menu does not toggle, log `gamepad.buttons` in-session and adjust this index (often `4` on Meta).
 */
const LEFT_CONTROLLER_MENU_BUTTON_INDEX = 4

const PANEL_W = 0.52
const BTN_H = 0.032
const GAP = 0.006
const COLS = 2
const CELL_W = PANEL_W / COLS

type MenuDef = { label: string; hit: XrMenuHit }

function buildMainMenuDefs(modeLabel: string): MenuDef[] {
  return [
    { label: 'Library', hit: { kind: 'cmd', cmd: 'library' } },
    { label: 'Search', hit: { kind: 'cmd', cmd: 'search' } },
    { label: 'Settings', hit: { kind: 'cmd', cmd: 'settings' } },
    { label: 'Undo', hit: { kind: 'cmd', cmd: 'undo' } },
    { label: 'Redo', hit: { kind: 'cmd', cmd: 'redo' } },
    { label: 'Reset view', hit: { kind: 'cmd', cmd: 'resetView' } },
    { label: modeLabel, hit: { kind: 'cmd', cmd: 'toggleMode' } },
    { label: 'Help', hit: { kind: 'cmd', cmd: 'help' } },
    { label: 'Exit VR', hit: { kind: 'cmd', cmd: 'exitVr' } },
  ]
}

function MenuButton({
  label,
  hit,
  row,
  col,
  rowsTop,
}: {
  label: string
  hit: XrMenuHit
  row: number
  col: number
  rowsTop: number
}) {
  /** Cell centers from left edge of the panel: -PANEL_W/2 + (col + 0.5) * CELL_W */
  const x = -PANEL_W / 2 + (col + 0.5) * CELL_W
  const y = rowsTop - row * (BTN_H + GAP) - BTN_H / 2
  const z = 0.002
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    tryHandleXrMenuObject(e.object)
  }

  return (
    <group position={[x, y, z]} userData={{ xrMenuHit: hit }}>
      <mesh userData={{ xrMenuHit: hit }} onPointerDown={onPointerDown}>
        <planeGeometry args={[CELL_W - GAP * 2, BTN_H]} />
        <meshBasicMaterial color="#e8eef8" side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, 0, 0.001]}
        fontSize={0.012}
        color="#1c2330"
        anchorX="center"
        anchorY="middle"
        maxWidth={CELL_W - GAP * 4}
        raycast={() => null}
      >
        {label}
      </Text>
    </group>
  )
}

export function XrWristMenu() {
  const gl = useThree((s) => s.gl)
  const groupRef = useRef<THREE.Group>(null)
  const palmHyst = useRef<PalmFacingHysteresis>({ visible: false })
  const controllerMenuOpen = useRef(false)
  const lastMenuButton = useRef(false)

  const mode = useRootStore((s) => s.interactionMode)

  const modeLabel = mode === 'travel' ? 'World mode' : 'Travel mode'

  const mainDefs = useMemo(() => buildMainMenuDefs(modeLabel), [modeLabel])

  const mainRows = Math.ceil(mainDefs.length / COLS)
  const totalRows = mainRows
  const panelH = totalRows * (BTN_H + GAP) + GAP * 2
  const rowsTop = panelH / 2 - GAP

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    if (!gl.xr.isPresenting) {
      g.visible = false
      return
    }
    const frame = gl.xr.getFrame()
    const refSpace = gl.xr.getReferenceSpace()
    const session = gl.xr.getSession()
    if (!frame || !refSpace || !session) {
      g.visible = false
      return
    }

    const sources = [...session.inputSources]
    const leftHand = sources.find((s) => s.handedness === 'left' && s.hand)

    let visible = false
    const base = new THREE.Matrix4()
    const wristOffset = new THREE.Matrix4().makeTranslation(0, 0.09, -0.07)

    if (leftHand?.hand) {
      const wristSpace = leftHand.hand.get('wrist')
      if (wristSpace) {
        const wristPose = frame.getJointPose?.(wristSpace, refSpace)
        if (wristPose) {
          const score = palmFacingHeadScore(frame, refSpace, leftHand.hand, leftHand.handedness)
          visible = updatePalmMenuVisibility(score, palmHyst.current)
          const t = wristPose.transform
          const p = new THREE.Vector3(t.position.x, t.position.y, t.position.z)
          const q = new THREE.Quaternion(
            t.orientation.x,
            t.orientation.y,
            t.orientation.z,
            t.orientation.w,
          )
          base.compose(p, q, new THREE.Vector3(1, 1, 1))
          base.multiply(wristOffset)
        }
      }
    } else {
      const leftCtrl = sources.find(
        (s) => s.handedness === 'left' && !s.hand && s.targetRaySpace && s.gamepad,
      )
      if (leftCtrl?.gamepad) {
        const pressed = !!leftCtrl.gamepad.buttons[LEFT_CONTROLLER_MENU_BUTTON_INDEX]?.pressed
        if (pressed && !lastMenuButton.current) {
          controllerMenuOpen.current = !controllerMenuOpen.current
        }
        lastMenuButton.current = pressed
      } else {
        lastMenuButton.current = false
      }
      visible = controllerMenuOpen.current
      if (visible) {
        const ctrl = sources.find((s) => s.handedness === 'left' && !s.hand)
        const anchorSpace = ctrl?.gripSpace ?? ctrl?.targetRaySpace
        if (ctrl && anchorSpace) {
          const pose = frame.getPose(anchorSpace, refSpace)
          if (pose) {
            const t = pose.transform
            const p = new THREE.Vector3(t.position.x, t.position.y, t.position.z)
            const q = new THREE.Quaternion(
              t.orientation.x,
              t.orientation.y,
              t.orientation.z,
              t.orientation.w,
            )
            base.compose(p, q, new THREE.Vector3(1, 1, 1))
            // Local offset from grip (stable) vs aim ray (drifts with pointing)
            const ctrlOff = ctrl.gripSpace
              ? new THREE.Matrix4().makeTranslation(0, 0.02, -0.1)
              : new THREE.Matrix4().makeTranslation(0.14, 0.04, -0.12)
            base.multiply(ctrlOff)
          }
        }
      }
    }

    g.visible = visible
    if (!visible) return

    g.matrixAutoUpdate = false
    g.matrix.copy(base)
    g.updateMatrixWorld(true)
  })

  return (
    <group ref={groupRef} renderOrder={10}>
      <mesh position={[0, 0, -0.003]} raycast={() => null}>
        <planeGeometry args={[PANEL_W + 0.02, panelH + 0.02]} />
        <meshBasicMaterial color="#f4f6fb" transparent opacity={0.92} side={THREE.DoubleSide} />
      </mesh>

      {mainDefs.map((def, i) => (
        <MenuButton
          key={`m-${i}`}
          label={def.label}
          hit={def.hit}
          row={Math.floor(i / COLS)}
          col={i % COLS}
          rowsTop={rowsTop}
        />
      ))}
    </group>
  )
}
