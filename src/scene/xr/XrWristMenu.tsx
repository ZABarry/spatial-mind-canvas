import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useXR } from '@react-three/xr'
import { STRUCTURE_MENU_TOOLS } from '../../ui/structureMenuTools'
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
const BTN_H = 0.022
const GAP = 0.004
const COLS = 2
const CELL_W = PANEL_W / COLS

type MenuDef = { label: string; hit: XrMenuHit }

function buildMainMenuDefs(
  modeLabel: string,
  passthroughLabel: string,
  axisOn: boolean,
  floorGridOn: boolean,
): MenuDef[] {
  return [
    { label: 'Library', hit: { kind: 'cmd', cmd: 'library' } },
    { label: 'Settings', hit: { kind: 'cmd', cmd: 'settings' } },
    { label: 'New map', hit: { kind: 'cmd', cmd: 'newMap' } },
    { label: 'Duplicate', hit: { kind: 'cmd', cmd: 'duplicate' } },
    { label: 'Clear map…', hit: { kind: 'cmd', cmd: 'clearMap' } },
    { label: 'Export JSON', hit: { kind: 'cmd', cmd: 'exportJson' } },
    { label: 'Export ZIP', hit: { kind: 'cmd', cmd: 'exportZip' } },
    { label: 'Save view…', hit: { kind: 'cmd', cmd: 'saveBookmark' } },
    { label: modeLabel, hit: { kind: 'cmd', cmd: 'toggleMode' } },
    { label: passthroughLabel, hit: { kind: 'cmd', cmd: 'togglePassthrough' } },
    { label: axisOn ? 'Axis on' : 'Axis off', hit: { kind: 'cmd', cmd: 'toggleAxis' } },
    { label: floorGridOn ? 'Floor grid on' : 'Floor grid off', hit: { kind: 'cmd', cmd: 'toggleFloorGrid' } },
    { label: 'Focus', hit: { kind: 'cmd', cmd: 'focus' } },
    { label: 'Reset view', hit: { kind: 'cmd', cmd: 'resetView' } },
    { label: 'Undo', hit: { kind: 'cmd', cmd: 'undo' } },
    { label: 'Redo', hit: { kind: 'cmd', cmd: 'redo' } },
    { label: 'Search', hit: { kind: 'cmd', cmd: 'search' } },
    { label: 'Inspect', hit: { kind: 'cmd', cmd: 'inspect' } },
    { label: 'Help', hit: { kind: 'cmd', cmd: 'help' } },
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
  const x = (col + 0.5) * CELL_W - PANEL_W / 2 + CELL_W / 2
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
        fontSize={0.011}
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
  const axisOn = useRootStore((s) => s.project?.settings.worldAxisControls === true)
  const floorGridOn = useRootStore((s) => s.project?.settings.floorGrid !== false)
  const bookmarks = useRootStore((s) => s.project?.bookmarks ?? [])
  const xrSessionMode = useXR((s) => s.mode)

  const modeLabel = mode === 'travel' ? 'World mode' : 'Travel mode'
  const passthroughLabel =
    xrSessionMode === 'immersive-ar' ? 'Use VR backdrop' : 'Use camera passthrough'

  const mainDefs = useMemo(
    () => buildMainMenuDefs(modeLabel, passthroughLabel, axisOn === true, floorGridOn),
    [modeLabel, passthroughLabel, axisOn, floorGridOn],
  )

  const mainRows = Math.ceil(mainDefs.length / COLS)
  const structureRows = Math.ceil(STRUCTURE_MENU_TOOLS.length / COLS)
  const bookmarkRows = Math.ceil(Math.min(bookmarks.length, 8) / COLS)
  const totalRows = mainRows + structureRows + bookmarkRows
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
          const score = palmFacingHeadScore(frame, refSpace, leftHand.hand)
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
        const ctrl = sources.find((s) => s.handedness === 'left' && s.targetRaySpace && !s.hand)
        if (ctrl?.targetRaySpace) {
          const pose = frame.getPose(ctrl.targetRaySpace, refSpace)
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
            const ctrlOff = new THREE.Matrix4().makeTranslation(0.14, 0.04, -0.12)
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

      {STRUCTURE_MENU_TOOLS.map((tool, i) => (
        <MenuButton
          key={tool.id}
          label={tool.label}
          hit={{ kind: 'structure', tool: tool.id }}
          row={mainRows + Math.floor(i / COLS)}
          col={i % COLS}
          rowsTop={rowsTop}
        />
      ))}

      {bookmarks.slice(0, 8).map((b, i) => (
        <MenuButton
          key={b.id}
          label={b.label.length > 18 ? `${b.label.slice(0, 16)}…` : b.label}
          hit={{ kind: 'recallBookmark', id: b.id }}
          row={mainRows + structureRows + Math.floor(i / COLS)}
          col={i % COLS}
          rowsTop={rowsTop}
        />
      ))}
    </group>
  )
}
