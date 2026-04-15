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

const PANEL_W = 0.54
const BTN_H = 0.046
const GAP = 0.009
const COLS = 2
const CELL_W = PANEL_W / COLS
/** Subtle tilt reads as a wrist-facing surface, not a flat HUD slab. */
const PANEL_SURFACE_TILT_X = 0.07

/** Tray + shadow sit behind raised buttons so layers read clearly in headset. */
const PANEL_TRAY_Z = -0.005
const PANEL_SHADOW_Z = -0.012
const PANEL_SHADOW_PAD = 0.024
const BTN_BORDER_Z = 0.0012
const BTN_FACE_Z = 0.0032
const BTN_LABEL_Z = 0.0055
const BTN_BORDER_INSET = 0.0018

type MenuDef = { label: string; hit: XrMenuHit }

/** Page 1 — workflow first; Settings before More; Exit isolated (full width). */
function buildPrimaryMenuDefs(modeLabel: string): MenuDef[] {
  return [
    { label: 'Search', hit: { kind: 'cmd', cmd: 'search' } },
    { label: 'Undo', hit: { kind: 'cmd', cmd: 'undo' } },
    { label: 'Recenter', hit: { kind: 'cmd', cmd: 'recenterSelection' } },
    { label: 'Cancel', hit: { kind: 'cmd', cmd: 'cancel' } },
    { label: modeLabel, hit: { kind: 'cmd', cmd: 'toggleMode' } },
    { label: 'Help', hit: { kind: 'cmd', cmd: 'help' } },
    { label: 'Settings', hit: { kind: 'cmd', cmd: 'settings' } },
    { label: 'Exit VR', hit: { kind: 'cmd', cmd: 'exitVr' } },
  ]
}

/** Page 2 — library, history, layout tuning, recovery (no duplicate Settings). */
function buildSecondaryMenuDefs(): MenuDef[] {
  return [
    { label: 'Library', hit: { kind: 'cmd', cmd: 'library' } },
    { label: 'History', hit: { kind: 'cmd', cmd: 'mapHistory' } },
    { label: 'Bookmarks', hit: { kind: 'cmd', cmd: 'bookmarks' } },
    { label: 'Redo', hit: { kind: 'cmd', cmd: 'redo' } },
    { label: 'Reset view', hit: { kind: 'cmd', cmd: 'resetView' } },
    { label: 'Reset scale', hit: { kind: 'cmd', cmd: 'resetScale' } },
    { label: 'Recall panels', hit: { kind: 'cmd', cmd: 'recallPanels' } },
  ]
}

function MenuButton({
  label,
  hit,
  row,
  col,
  rowsTop,
  buttonKind = 'default',
  onLocal,
  spanCols = 1,
}: {
  label: string
  hit?: XrMenuHit
  row: number
  col: number
  rowsTop: number
  buttonKind?: WristButtonKind
  /** Bypasses global menu routing (e.g. More / Back). */
  onLocal?: () => void
  /** 2 = full panel width (single row control). */
  spanCols?: 1 | 2
}) {
  const [hover, setHover] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)
  /** Cell centers from left edge of the panel: -PANEL_W/2 + (col + 0.5) * CELL_W */
  const x =
    spanCols === 2 ? 0 : -PANEL_W / 2 + (col + 0.5) * CELL_W
  const y = rowsTop - row * (BTN_H + GAP) - BTN_H / 2
  const z = 0
  const pal = wristMenuButtonColors(buttonKind)
  const face = pressed ? pal.bgPress : hover ? pal.bgHover : pal.bg
  const bw = spanCols === 2 ? PANEL_W - GAP * 4 : CELL_W - GAP * 2
  const bh = BTN_H
  const borderColor =
    buttonKind === 'danger'
      ? pressed
        ? '#c49aa4'
        : hover
          ? '#d4aeb8'
          : '#e0bcc4'
      : pressed
        ? '#7c8ca3'
        : hover
          ? '#8b9bb0'
          : '#9ca8ba'

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setPressed(true)
    if (onLocal) {
      onLocal()
      return
    }
    if (hit) tryHandleXrMenuObject(e.object)
  }
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setPressed(false)
  }

  const hitW = (spanCols === 2 ? bw : CELL_W - GAP * 2) * 1.2
  const hitH = BTN_H * 1.4
  return (
    <group position={[x, y, z]} userData={hit ? { xrMenuHit: hit } : {}}>
      <mesh
        userData={hit ? { xrMenuHit: hit } : {}}
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
      {/* Rim slightly larger than face — reads as depth vs tray */}
      <mesh position={[0, 0, BTN_BORDER_Z]} raycast={() => null}>
        <planeGeometry args={[bw + BTN_BORDER_INSET * 2, bh + BTN_BORDER_INSET * 2]} />
        <meshBasicMaterial color={borderColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, BTN_FACE_Z]} raycast={() => null}>
        <planeGeometry args={[bw, bh]} />
        <meshBasicMaterial color={face} side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, 0, BTN_LABEL_Z]}
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

  const [menuPage, setMenuPage] = React.useState(0)
  const primaryDefs = React.useMemo(() => buildPrimaryMenuDefs(modeLabel), [modeLabel])
  const secondaryDefs = React.useMemo(() => buildSecondaryMenuDefs(), [])

  const primaryGrid = React.useMemo(() => primaryDefs.slice(0, 6), [primaryDefs])
  const primarySettings = primaryDefs[6]
  const primaryExit = primaryDefs[7]

  const totalRows = menuPage === 0 ? 5 : 5
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
      if (visible) {
        openT.current = 0
        setMenuPage(0)
      }
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

    openT.current = Math.min(1, openT.current + delta * 7.2)
    const inner = panelInnerRef.current
    if (inner) {
      const s = THREE.MathUtils.lerp(0.9, 1, 1 - (1 - openT.current) ** 2)
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
      <group ref={panelInnerRef} rotation={[PANEL_SURFACE_TILT_X, 0, 0]}>
        <mesh position={[0, 0, PANEL_SHADOW_Z]} raycast={() => null}>
          <planeGeometry args={[PANEL_W + PANEL_SHADOW_PAD, panelH + PANEL_SHADOW_PAD]} />
          <meshBasicMaterial color="#64748b" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, PANEL_TRAY_Z]} raycast={() => null}>
          <planeGeometry args={[PANEL_W + 0.02, panelH + 0.02]} />
          <meshBasicMaterial color="#b8c5d8" side={THREE.DoubleSide} />
        </mesh>

        {menuPage === 0 ? (
          <>
            {primaryGrid.map((def, i) => (
              <MenuButton
                key={`p-${def.label}-${i}`}
                label={def.label}
                hit={def.hit}
                row={Math.floor(i / COLS)}
                col={i % COLS}
                rowsTop={rowsTop}
                buttonKind={def.label === 'Cancel' ? 'danger' : 'default'}
              />
            ))}
            {primarySettings ? (
              <MenuButton
                key="settings"
                label={primarySettings.label}
                hit={primarySettings.hit}
                row={3}
                col={0}
                rowsTop={rowsTop}
                buttonKind="default"
              />
            ) : null}
            <MenuButton
              key="more"
              label="More…"
              row={3}
              col={1}
              rowsTop={rowsTop}
              buttonKind="default"
              onLocal={() => setMenuPage(1)}
            />
            {primaryExit ? (
              <MenuButton
                key="exit-vr"
                label={primaryExit.label}
                hit={primaryExit.hit}
                row={4}
                col={0}
                rowsTop={rowsTop}
                spanCols={2}
                buttonKind="danger"
              />
            ) : null}
          </>
        ) : (
          <>
            {secondaryDefs.slice(0, 6).map((def, i) => (
              <MenuButton
                key={`s-${def.label}-${i}`}
                label={def.label}
                hit={def.hit}
                row={Math.floor(i / COLS)}
                col={i % COLS}
                rowsTop={rowsTop}
              />
            ))}
            {secondaryDefs[6] ? (
              <MenuButton
                key="recall"
                label={secondaryDefs[6].label}
                hit={secondaryDefs[6].hit}
                row={3}
                col={0}
                rowsTop={rowsTop}
                spanCols={2}
                buttonKind="default"
              />
            ) : null}
            <MenuButton
              key="back"
              label="« Back"
              row={4}
              col={0}
              rowsTop={rowsTop}
              spanCols={2}
              buttonKind="default"
              onLocal={() => setMenuPage(0)}
            />
          </>
        )}
      </group>
    </group>
  )
}
