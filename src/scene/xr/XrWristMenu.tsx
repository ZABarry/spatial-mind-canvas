import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { playInteractionCue } from '../../audio/interactionCues'
import { useRootStore } from '../../store/rootStore'
import type { WristButtonKind } from '../visual/interactionTokens'
import { wristMenuButtonColors } from '../visual/interactionTokens'
import { tryHandleXrMenuObject, type XrMenuHit } from './xrMenuActions'
import { buildLeftControllerGlobalMenuMatrix } from './anchors/xrControllerAnchor'
import { composeWristPoseMatrix } from './anchors/xrPalmAnchor'
import { dampMatrix4SE3 } from './anchors/xrSmoothMatrix'
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
const BTN_H = 0.042
const GAP = 0.008
const COLS = 2
const CELL_W = PANEL_W / COLS

type MenuDef = { label: string; hit: XrMenuHit }

function buildMainMenuDefs(modeLabel: string): MenuDef[] {
  return [
    { label: 'Library', hit: { kind: 'cmd', cmd: 'library' } },
    { label: 'Search', hit: { kind: 'cmd', cmd: 'search' } },
    { label: 'History', hit: { kind: 'cmd', cmd: 'mapHistory' } },
    { label: 'Bookmarks', hit: { kind: 'cmd', cmd: 'bookmarks' } },
    { label: 'Settings', hit: { kind: 'cmd', cmd: 'settings' } },
    { label: 'Undo', hit: { kind: 'cmd', cmd: 'undo' } },
    { label: 'Redo', hit: { kind: 'cmd', cmd: 'redo' } },
    { label: 'Reset view', hit: { kind: 'cmd', cmd: 'resetView' } },
    { label: 'Recenter', hit: { kind: 'cmd', cmd: 'recenterSelection' } },
    { label: 'Reset scale', hit: { kind: 'cmd', cmd: 'resetScale' } },
    { label: 'Cancel', hit: { kind: 'cmd', cmd: 'cancel' } },
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
  buttonKind = 'default',
}: {
  label: string
  hit: XrMenuHit
  row: number
  col: number
  rowsTop: number
  buttonKind?: WristButtonKind
}) {
  const [hover, setHover] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  /** Cell centers from left edge of the panel: -PANEL_W/2 + (col + 0.5) * CELL_W */
  const x = -PANEL_W / 2 + (col + 0.5) * CELL_W
  const y = rowsTop - row * (BTN_H + GAP) - BTN_H / 2
  const z = 0.002
  const pal = wristMenuButtonColors(buttonKind)
  const face = pressed ? pal.bgPress : hover ? pal.bgHover : pal.bg

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setPressed(true)
    tryHandleXrMenuObject(e.object)
  }
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setPressed(false)
  }

  const hitW = (CELL_W - GAP * 2) * 1.35
  const hitH = BTN_H * 1.4
  return (
    <group position={[x, y, z]} userData={{ xrMenuHit: hit }}>
      <mesh
        userData={{ xrMenuHit: hit }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHover(false)
          setPressed(false)
        }}
      >
        <planeGeometry args={[hitW, hitH]} />
        <meshBasicMaterial color="#e8eef8" transparent opacity={0.002} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.001]} raycast={() => null}>
        <planeGeometry args={[CELL_W - GAP * 2, BTN_H]} />
        <meshBasicMaterial color={face} side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, 0, 0.001]}
        fontSize={0.014}
        color={pal.text}
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
  const groupRef = React.useRef<THREE.Group>(null)
  const palmHyst = React.useRef<PalmFacingHysteresis>({ visible: false, openStreak: 0 })
  const controllerMenuOpen = React.useRef(false)
  const lastMenuButton = React.useRef(false)
  const prevWristVisible = React.useRef(false)
  const panelInnerRef = React.useRef<THREE.Group>(null)
  const openT = React.useRef(0)
  const smoothedMenuMatrix = React.useRef(new THREE.Matrix4())
  const menuSmoothInit = React.useRef(true)
  const targetMenuMatrix = React.useRef(new THREE.Matrix4())

  const mode = useRootStore((s) => s.interactionMode)

  const modeLabel = mode === 'travel' ? 'Switch to World' : 'Switch to Travel'

  const mainDefs = React.useMemo(() => buildMainMenuDefs(modeLabel), [modeLabel])

  const mainRows = Math.ceil(mainDefs.length / COLS)
  const totalRows = mainRows
  const panelH = totalRows * (BTN_H + GAP) + GAP * 2
  const rowsTop = panelH / 2 - GAP

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    if (!gl.xr.isPresenting) {
      g.visible = false
      prevWristVisible.current = false
      const st0 = useRootStore.getState()
      if (st0.interactionSession.kind === 'menu' && st0.interactionSession.menu === 'global') {
        st0.dispatch({ type: 'setMenuSession', menu: null })
      }
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
    const base = targetMenuMatrix.current

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
          composeWristPoseMatrix(p, q, base)
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
            buildLeftControllerGlobalMenuMatrix(pose, !!ctrl.gripSpace, base)
          }
        }
      }
    }

    g.visible = visible
    if (visible !== prevWristVisible.current) {
      const audio = useRootStore.getState().devicePreferences.audioEnabled
      playInteractionCue('menuToggle', audio)
      if (visible) openT.current = 0
      prevWristVisible.current = visible
      const st = useRootStore.getState()
      if (visible) {
        if (st.interactionSession.kind === 'idle' || st.interactionSession.kind === 'menu') {
          st.dispatch({ type: 'setMenuSession', menu: 'global' })
        }
      } else if (st.interactionSession.kind === 'menu' && st.interactionSession.menu === 'global') {
        st.dispatch({ type: 'setMenuSession', menu: null })
      }
    }
    if (!visible) {
      menuSmoothInit.current = true
      return
    }

    openT.current = Math.min(1, openT.current + delta * 8)
    const inner = panelInnerRef.current
    if (inner) {
      const s = THREE.MathUtils.lerp(0.94, 1, openT.current)
      inner.scale.setScalar(s)
    }

    const sm = smoothedMenuMatrix.current
    if (menuSmoothInit.current) {
      sm.copy(base)
      menuSmoothInit.current = false
    } else {
      dampMatrix4SE3(sm, base, leftHand?.hand ? 10 : 14, delta)
    }

    g.matrixAutoUpdate = false
    g.matrix.copy(sm)
    g.updateMatrixWorld(true)
  })

  return (
    <group ref={groupRef} renderOrder={10}>
      <group ref={panelInnerRef}>
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
            buttonKind={def.label === 'Cancel' || def.label === 'Exit VR' ? 'danger' : 'default'}
          />
        ))}
      </group>
    </group>
  )
}
