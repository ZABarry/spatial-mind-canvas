import { createWithEqualityFn } from 'zustand/traditional'
import { nanoid } from 'nanoid'
import type { AppAction } from '../input/actions'
import { withLinkPreviewTarget } from '../input/sessionMachine'
import { idleSession, type InteractionSession } from '../input/sessionTypes'
import { canBeginWorldGrab } from '../input/xr/xrSessionGuards'
import {
  interactionModeFromNavigationMode,
  navigationModeFromInteractionMode,
  type NavigationMode,
} from '../input/tools'
import type { Bookmark, DevicePreferences, InteractionMode, Project, SelectionState } from '../graph/types'
import {
  createBlankProject,
  defaultDevicePreferences,
  defaultUserSettings,
  defaultWorldTransform,
  emptyGraph,
} from '../graph/defaults'
import { addEdge, addNode, createNodeDefaults, patchNode, removeEdge, removeNode } from '../graph/mutations'
import { neighborIdsByEdges } from '../graph/selectors'
import { spawnChildBranchPositions } from '../graph/branching'
import { getTemplate, type TemplateId } from '../graph/templates'
import * as layoutTools from '../graph/layout/tools'
import type { Vec3, Vec4 } from '../utils/math'
import { vec3Add, v3 } from '../utils/math'
import {
  createIndexedDbProjectRepository,
  type ProjectRepository,
} from '../persistence/projectRepository'
import { ProjectSchema } from '../persistence/schemas'
import { mapSnapshots } from '../persistence/mapSnapshotRepository'
import { applyMapSnapshotPayload, buildMapSnapshotPayload } from '../persistence/snapshotPayload'
import { buildProjectZip, estimateZipUncompressedSize, parseProjectZip } from '../persistence/zipBundle'
import { checkSpaceForBytes, warnIfStorageAlmostFull } from '../media/quota'
import { buildImageThumbnailJpeg } from '../media/imageThumbnail'
import { createLocalMediaStore } from '../media/localMediaStore'
import type { MediaStore } from '../media/types'
import {
  getMeta,
  META_DEVICE_PREFS,
  META_LAST_PROJECT,
  META_ONBOARDING_CORE_COMPLETE,
  META_ONBOARDING_DID_RECENTER,
  META_ONBOARDING_DID_UNDO,
  META_ONBOARDING_DISMISSED,
  META_ONBOARDING_LEGACY_DONE,
  META_ONBOARDING_SEEN_SELECTION,
  setMeta,
} from '../persistence/db'
import type { MediaAttachment } from '../graph/types'
import {
  appendPast,
  buildProjectHistoryEntry,
  type HistoryEntry,
} from '../input/historyTransactions'
import { playInteractionCue } from '../audio/interactionCues'
import { rebuildSearchIndex, shouldRebuildSearchIndex } from './searchIndex'

export type AppView = 'home' | 'scene'

/** In-flight / failed node file attach — drives detail-panel upload UI. */
export type MediaAttachState =
  | null
  | {
      nodeId: string
      filename: string
      phase: 'reading' | 'processing' | 'error'
      errorMessage?: string
    }

export interface RootState {
  ready: boolean
  view: AppView
  project: Project | null
  projectIndex: Array<{ id: string; name: string; updatedAt: number; lastOpenedAt: number }>
  selection: SelectionState
  hover: { nodeId?: string; edgeId?: string }
  interactionMode: InteractionMode
  navigationMode: NavigationMode
  /** Authoritative live gesture state (link, node drag, world grab). */
  interactionSession: InteractionSession
  /** Snapshot at pointer-down for one undo step on drag release. */
  pendingNodeDrag: { before: Project; nodeId: string } | null
  /** Snapshot at XR squeeze-start for one undo step when grab ends. */
  worldGrabBefore: Project | null
  /** Headset / locomotion — persisted in IndexedDB meta, not in map files. */
  devicePreferences: DevicePreferences
  placementPreview: {
    position: Vec3
    parentId?: string
    connectFromId?: string
  } | null
  focusDim: boolean
  focusSet: Set<string> | null
  searchOpen: boolean
  searchQuery: string
  searchHighlight: Set<string>
  detailNodeId: string | null
  onboardingDismissed: boolean
  onboardingCoreComplete: boolean
  onboardingSeenSelection: boolean
  /** Guided path: Recenter step (IndexedDB meta). */
  onboardingDidRecenter: boolean
  /** Guided path: Undo step (IndexedDB meta). */
  onboardingDidUndo: boolean
  /** One-shot “first success” ribbon after guided path completes. */
  onboardingCelebration: boolean
  settingsOpen: boolean
  /** Desktop: version history modal (local snapshots). */
  mapHistoryOpen: boolean
  /** XR: bookmarks list panel (world-space HTML). */
  bookmarksPanelOpen: boolean
  /** Autosave / manual save feedback for the toolbar and XR HUD. */
  saveIndicator: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  /** Short non-blocking copy for snapshot / import / export outcomes. */
  feedbackMessage: { text: string; tone: 'success' | 'error' | 'info'; at: number } | null
  confirmDialog: { title: string; message: string; onConfirm: () => void } | null
  /** Text prompt for VR (e.g. bookmark name); replaces `window.prompt` while immersive. */
  textPromptDialog: { title: string; defaultValue: string; onSubmit: (value: string) => void } | null
  /** In-headset help overlay (replaces floating Help button DOM). */
  xrHelpOpen: boolean
  /** Set from WebXR session inside canvas — hides flat HTML modals while immersive. */
  xrSessionActive: boolean
  /** True when the session has hand input without tracked gamepad controllers (hand-tracking lite UX). */
  xrHandTrackingPrimary: boolean
  /** Dev-only: show extra XR HUD diagnostics (toggled from Settings). */
  xrDebugHud: boolean
  /** Bumped when `centerViewOnSelection` runs; canvas reads orbit target and applies `translateWorld`. */
  centerViewTick: number
  /** Bumped on `resetWorld`; canvas restores desktop orbit camera to its initial pose. */
  resetViewTick: number
  /** True while dragging world origin X/Y/Z handles (desktop); orbit rotation disabled. */
  worldAxisDragActive: boolean
  historyPast: HistoryEntry[]
  historyFuture: HistoryEntry[]
  /** XR + app */
  repo: ProjectRepository | null
  media: MediaStore | null
  /** Set while a file is being attached to a node, or after a failed attach. */
  mediaAttach: MediaAttachState
  dispatch: (a: AppAction) => void
  bootstrap: () => Promise<void>
  openProject: (id: string) => Promise<void>
  goHome: () => void
  newBlankProject: () => Promise<void>
  newProjectFromTemplate: (templateId: TemplateId) => Promise<void>
  duplicateCurrentProject: () => Promise<void>
  renameProject: (id: string, name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearCurrentMap: () => void
  exportProject: () => void
  exportProjectZip: () => Promise<void>
  importProject: (file: File) => Promise<void>
  saveNow: () => Promise<void>
  setMapHistoryOpen: (open: boolean) => void
  setBookmarksPanelOpen: (open: boolean) => void
  createMapSnapshot: (label?: string) => Promise<void>
  restoreMapSnapshot: (snapshotId: string, options: { saveBeforeRestore: boolean }) => Promise<void>
}

function cloneProject(p: Project): Project {
  return structuredClone(p)
}

/** Map-only settings for JSON/ZIP export (device prefs live in app metadata). */
function mapOnlySettings(s: Project['settings']): Project['settings'] {
  const d = defaultUserSettings()
  return {
    ...d,
    focusHopDepth: s.focusHopDepth,
    labelBudget: s.labelBudget,
    showAllLabels: s.showAllLabels,
    worldAxisControls: s.worldAxisControls,
    floorGrid: s.floorGrid,
    worldBackgroundHorizon: s.worldBackgroundHorizon ?? d.worldBackgroundHorizon,
    worldBackgroundZenith: s.worldBackgroundZenith ?? d.worldBackgroundZenith,
    worldBackgroundExponent: s.worldBackgroundExponent ?? d.worldBackgroundExponent,
    particlesCount: s.particlesCount ?? d.particlesCount,
    particlesSize: s.particlesSize ?? d.particlesSize,
    particlesColor: s.particlesColor ?? d.particlesColor,
    particlesOpacity: s.particlesOpacity ?? d.particlesOpacity,
    particlesSpeed: s.particlesSpeed ?? d.particlesSpeed,
  }
}

function finalizeWorldGrab(get: () => RootState, set: (partial: Partial<RootState>) => void) {
  const beforeSnap = get().worldGrabBefore
  const after = get().project
  if (beforeSnap && after) {
    const before = cloneProject(beforeSnap)
    const afterP = cloneProject(after)
    const entry = buildProjectHistoryEntry(before, afterP, cloneProject, (p) => set({ project: p }))
    const st = get()
    set({
      worldGrabBefore: null,
      interactionSession: idleSession,
      ...appendPast(st.historyPast, entry),
    })
  } else {
    set({ worldGrabBefore: null, interactionSession: idleSession })
  }
}

/**
 * Zustand root store — domains: project lifecycle, graph editing (`dispatch`), XR/UI overlays,
 * persistence (IndexedDB + autosave), onboarding metadata, local snapshots, search index (see `./searchIndex`).
 */
export const useRootStore = createWithEqualityFn<RootState>((set, get) => {
  function commit(_label: string, mutator: (p: Project) => void) {
    const state = get()
    if (!state.project) return
    const before = cloneProject(state.project)
    const draft = cloneProject(state.project)
    mutator(draft)
    draft.updatedAt = Date.now()
    const after = draft
    set({ project: after })
    const entry = buildProjectHistoryEntry(before, after, cloneProject, (p) => set({ project: p }))
    set((s) => appendPast(s.historyPast, entry))
  }

  /**
   * All graph and UI mutations flow through here. For mutually exclusive modes, see
   * `getInteractionPhase` in `../input/interactionPhase.ts` (idle, drawingEdge, nodeDetail, etc.).
   */
  function dispatch(a: AppAction) {
    const st = get()
    if (!st.project && a.type !== 'noop') {
      if (
        a.type === 'undo' ||
        a.type === 'redo' ||
        a.type === 'setHover' ||
        a.type === 'setSearchOpen' ||
        a.type === 'patchDevicePreferences' ||
        a.type === 'setMenuSession'
      ) {
        /* allow */
      } else return
    }

    switch (a.type) {
      case 'noop':
        break
      case 'undo': {
        const past = get().historyPast
        const last = past[past.length - 1]
        if (!last) break
        const audio = get().devicePreferences.audioEnabled
        last.undo()
        const stAfter = get()
        const nextPast = past.slice(0, -1)
        const nextFut = [last, ...stAfter.historyFuture]
        const ob = get()
        const patch: Partial<RootState> = { historyPast: nextPast, historyFuture: nextFut }
        if (!ob.onboardingDismissed && !ob.onboardingCoreComplete && !ob.onboardingDidUndo) {
          patch.onboardingDidUndo = true
          void setMeta(META_ONBOARDING_DID_UNDO, true)
        }
        set(patch)
        if (audio) playInteractionCue('undo', true)
        break
      }
      case 'redo': {
        const fut = get().historyFuture
        const first = fut[0]
        if (!first) break
        const audio = get().devicePreferences.audioEnabled
        first.redo()
        set({ historyFuture: fut.slice(1), historyPast: [...get().historyPast, first] })
        if (audio) playInteractionCue('redo', true)
        break
      }
      case 'selectNodes': {
        const sel = get().selection
        const prevPrimary = sel.primaryNodeId
        const audio = get().devicePreferences.audioEnabled
        const next = a.additive ? { ...sel, nodeIds: [...new Set([...sel.nodeIds, ...a.ids])] } : { ...sel, nodeIds: a.ids, edgeIds: [] }
        set({ selection: { ...next, primaryNodeId: a.ids[0] ?? next.primaryNodeId } })
        const newPrimary = get().selection.primaryNodeId
        if (audio && newPrimary && newPrimary !== prevPrimary) {
          playInteractionCue('select', true)
        }
        break
      }
      case 'selectEdges': {
        const sel = get().selection
        const next = a.additive ? { ...sel, edgeIds: [...new Set([...sel.edgeIds, ...a.ids])] } : { ...sel, edgeIds: a.ids, nodeIds: [] }
        set({ selection: next })
        break
      }
      case 'clearSelection':
        set({ selection: { nodeIds: [], edgeIds: [] }, detailNodeId: null })
        break
      case 'setHover':
        set({ hover: { nodeId: a.nodeId, edgeId: a.edgeId } })
        break
      case 'setInteractionMode':
        if (a.mode === 'travel') finalizeWorldGrab(get, set)
        set({
          interactionMode: a.mode,
          navigationMode: navigationModeFromInteractionMode(a.mode),
        })
        break
      case 'setNavigationMode':
        if (a.mode === 'travel') finalizeWorldGrab(get, set)
        set({
          navigationMode: a.mode,
          interactionMode: interactionModeFromNavigationMode(a.mode),
        })
        break
      case 'createNodeAt': {
        commit('createNode', (p) => {
          const base = createNodeDefaults(a.position, a.shape)
          const { graph, node } = addNode(p.graph, {
            ...base,
            parentId: a.parentId,
          })
          p.graph = graph
          if (a.connectFromId) {
            const e = addEdge(p.graph, {
              sourceId: a.connectFromId,
              targetId: node.id,
            })
            p.graph = e.graph
          }
        })
        break
      }
      case 'spawnChildBranches': {
        const p0 = get().project
        if (!p0) break
        const parent = p0.graph.nodes[a.parentId]
        if (!parent || a.count < 1) break
        let lastId: string | undefined
        commit('spawnChildBranches', (p) => {
          const par = p.graph.nodes[a.parentId]
          if (!par) return
          const posList = spawnChildBranchPositions(p.graph, par, a.count)
          for (const pos of posList) {
            const base = createNodeDefaults(pos)
            const { graph, node } = addNode(p.graph, {
              ...base,
              parentId: par.id,
            })
            p.graph = graph
            const e = addEdge(p.graph, { sourceId: par.id, targetId: node.id })
            p.graph = e.graph
            lastId = node.id
          }
        })
        if (lastId) {
          set({
            selection: { nodeIds: [lastId], edgeIds: [], primaryNodeId: lastId },
          })
        }
        break
      }
      case 'moveNode': {
        const p = get().project
        if (!p) break
        const nextProject: Project = {
          ...p,
          graph: patchNode(p.graph, a.nodeId, { position: a.position }),
          updatedAt: Date.now(),
        }
        const sess = get().interactionSession
        if (sess.kind === 'nodeDrag' && sess.nodeId === a.nodeId) {
          set({
            project: nextProject,
            interactionSession: { ...sess, current: a.position },
          })
        } else {
          set({ project: nextProject })
        }
        break
      }
      case 'deleteNode': {
        commit('deleteNode', (p) => {
          p.graph = removeNode(p.graph, a.id)
        })
        break
      }
      case 'deleteEdge': {
        commit('deleteEdge', (p) => {
          p.graph = removeEdge(p.graph, a.id)
        })
        break
      }
      case 'deleteSelection': {
        commit('deleteSelection', (p) => {
          let g = p.graph
          for (const id of get().selection.nodeIds) {
            g = removeNode(g, id)
          }
          for (const id of get().selection.edgeIds) {
            g = removeEdge(g, id)
          }
          p.graph = g
        })
        set({ selection: { nodeIds: [], edgeIds: [] }, detailNodeId: null })
        break
      }
      case 'connectNodes': {
        commit('connect', (p) => {
          const res = addEdge(p.graph, {
            sourceId: a.fromId,
            targetId: a.toId,
          })
          p.graph = res.graph
        })
        break
      }
      case 'startConnection': {
        const pointerId =
          a.xrControllerIndex !== undefined ? `xr-controller-${a.xrControllerIndex}` : 'mouse'
        const audio = get().devicePreferences.audioEnabled
        set({
          interactionSession: {
            kind: 'link',
            pointerId,
            fromNodeId: a.fromNodeId,
            ...(a.xrControllerIndex !== undefined ? { xrControllerIndex: a.xrControllerIndex } : {}),
          },
        })
        if (audio) playInteractionCue('linkStart', true)
        break
      }
      case 'finishConnection': {
        const sess = get().interactionSession
        if (sess.kind !== 'link' || !get().project) {
          set({ interactionSession: idleSession })
          break
        }
        const fromId = sess.fromNodeId
        const audio = get().devicePreferences.audioEnabled
        let completed = false
        if (a.targetNodeId) {
          dispatch({
            type: 'connectNodes',
            fromId,
            toId: a.targetNodeId,
          })
          completed = true
        } else if (a.dropPosition) {
          commit('connect+node', (p) => {
            const base = createNodeDefaults(a.dropPosition!)
            const { graph, node } = addNode(p.graph, base)
            p.graph = graph
            const e = addEdge(p.graph, {
              sourceId: fromId,
              targetId: node.id,
            })
            p.graph = e.graph
          })
          completed = true
        }
        set({ interactionSession: idleSession })
        if (completed && audio) playInteractionCue('linkComplete', true)
        break
      }
      case 'cancelConnection':
        if (get().interactionSession.kind === 'link') {
          const audio = get().devicePreferences.audioEnabled
          set({ interactionSession: idleSession })
          if (audio) playInteractionCue('cancel', true)
        }
        break
      case 'setLinkPreviewTarget': {
        const sess = get().interactionSession
        const next = withLinkPreviewTarget(sess, a.target)
        if (next) set({ interactionSession: next })
        break
      }
      case 'cancelActiveInteraction': {
        const sess = get().interactionSession
        if (sess.kind === 'menu') {
          set({ interactionSession: idleSession })
          break
        }
        if (sess.kind === 'link') {
          const audio = get().devicePreferences.audioEnabled
          set({ interactionSession: idleSession })
          if (audio) playInteractionCue('cancel', true)
          break
        }
        if (sess.kind === 'nodeDrag') {
          const pending = get().pendingNodeDrag
          if (pending && pending.nodeId === sess.nodeId) {
            set({
              project: cloneProject(pending.before),
              interactionSession: idleSession,
              pendingNodeDrag: null,
            })
          } else {
            set({ interactionSession: idleSession, pendingNodeDrag: null })
          }
          break
        }
        if (sess.kind === 'worldGrab') {
          const snap = get().worldGrabBefore
          if (snap) {
            set({
              project: cloneProject(snap),
              worldGrabBefore: null,
              interactionSession: idleSession,
            })
          } else {
            set({ interactionSession: idleSession, worldGrabBefore: null })
          }
          break
        }
        break
      }
      case 'setMenuSession': {
        const cur = get().interactionSession
        if (a.menu === null) {
          if (cur.kind === 'menu') set({ interactionSession: idleSession })
          break
        }
        if (cur.kind === 'idle' || cur.kind === 'menu') {
          set({ interactionSession: { kind: 'menu', menu: a.menu } })
        }
        break
      }
      case 'openNodeDetail':
        set({ detailNodeId: a.nodeId, ...(a.nodeId === null ? { mediaAttach: null } : {}) })
        break
      case 'updateNodeProps': {
        commit('editNode', (p) => {
          p.graph = patchNode(p.graph, a.nodeId, a.patch as Partial<import('../graph/types').NodeEntity>)
        })
        break
      }
      case 'toggleCollapse': {
        commit('collapse', (p) => {
          const n = p.graph.nodes[a.nodeId]
          if (!n) return
          p.graph = patchNode(p.graph, a.nodeId, { collapsed: !n.collapsed })
        })
        break
      }
      case 'setWorldTransform': {
        commit('world', (p) => {
          p.worldTransform = {
            position: a.position,
            quaternion: a.quaternion,
            scale: a.scale,
          }
        })
        break
      }
      case 'setWorldPosition': {
        const p = get().project
        if (!p) break
        set({
          project: {
            ...p,
            worldTransform: { ...p.worldTransform, position: a.position },
            updatedAt: Date.now(),
          },
        })
        break
      }
      case 'translateWorld': {
        commit('worldT', (p) => {
          p.worldTransform.position = vec3Add(p.worldTransform.position, a.delta)
        })
        break
      }
      case 'rotateWorld': {
        commit('worldR', (p) => {
          const axis = a.axis
          const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2) || 1
          const nx = axis[0] / len
          const ny = axis[1] / len
          const nz = axis[2] / len
          const half = a.radians * 0.5
          const sin = Math.sin(half)
          const dq: Vec4 = [nx * sin, ny * sin, nz * sin, Math.cos(half)]
          const q0 = p.worldTransform.quaternion
          const q1 = dq
          const w1 = q0[3] * q1[3] - q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2]
          const x1 =
            q0[0] * q1[3] + q0[3] * q1[0] + q0[1] * q1[2] - q0[2] * q1[1]
          const y1 =
            q0[1] * q1[3] + q0[3] * q1[1] + q0[2] * q1[0] - q0[0] * q1[2]
          const z1 =
            q0[2] * q1[3] + q0[3] * q1[2] + q0[0] * q1[1] - q0[1] * q1[0]
          p.worldTransform.quaternion = [x1, y1, z1, w1]
        })
        break
      }
      case 'scaleWorld': {
        commit('worldS', (p) => {
          p.worldTransform.scale = Math.max(0.05, Math.min(40, p.worldTransform.scale * a.factor))
        })
        break
      }
      case 'translateWorldLive': {
        const p = get().project
        if (!p) break
        set({
          project: {
            ...p,
            worldTransform: {
              ...p.worldTransform,
              position: vec3Add(p.worldTransform.position, a.delta),
            },
            updatedAt: Date.now(),
          },
        })
        break
      }
      case 'rotateWorldLive': {
        const p = get().project
        if (!p) break
        const axis = a.axis
        const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2) || 1
        const nx = axis[0] / len
        const ny = axis[1] / len
        const nz = axis[2] / len
        const half = a.radians * 0.5
        const sin = Math.sin(half)
        const dq: Vec4 = [nx * sin, ny * sin, nz * sin, Math.cos(half)]
        const q0 = p.worldTransform.quaternion
        const q1 = dq
        const w1 = q0[3] * q1[3] - q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2]
        const x1 = q0[0] * q1[3] + q0[3] * q1[0] + q0[1] * q1[2] - q0[2] * q1[1]
        const y1 = q0[1] * q1[3] + q0[3] * q1[1] + q0[2] * q1[0] - q0[0] * q1[2]
        const z1 = q0[2] * q1[3] + q0[3] * q1[2] + q0[0] * q1[1] - q0[1] * q1[0]
        set({
          project: {
            ...p,
            worldTransform: {
              ...p.worldTransform,
              quaternion: [x1, y1, z1, w1],
            },
            updatedAt: Date.now(),
          },
        })
        break
      }
      case 'scaleWorldLive': {
        const p = get().project
        if (!p) break
        set({
          project: {
            ...p,
            worldTransform: {
              ...p.worldTransform,
              scale: Math.max(0.05, Math.min(40, p.worldTransform.scale * a.factor)),
            },
            updatedAt: Date.now(),
          },
        })
        break
      }
      case 'beginWorldGrab': {
        const st = get()
        if (!st.project || st.worldGrabBefore) break
        if (!canBeginWorldGrab(st)) break
        const wt = { ...st.project.worldTransform }
        set({
          worldGrabBefore: cloneProject(st.project),
          interactionSession: {
            kind: 'worldGrab',
            pointerIds: [],
            startWorld: wt,
          },
        })
        break
      }
      case 'endWorldGrab':
        finalizeWorldGrab(get, set)
        break
      case 'resetWorld':
        commit('resetW', (p) => {
          p.worldTransform = defaultWorldTransform()
        })
        set({ resetViewTick: get().resetViewTick + 1 })
        break
      case 'setFocusDim':
        set({ focusDim: a.dim })
        break
      case 'focusSelection': {
        const p = get().project
        if (!p) break
        const primary = get().selection.primaryNodeId ?? get().selection.nodeIds[0]
        if (!primary) break
        const depth = p.settings.focusHopDepth
        const setIds = neighborIdsByEdges(p.graph, [primary], depth)
        set({ focusSet: setIds, focusDim: true })
        break
      }
      case 'centerViewOnSelection': {
        const p = get().project
        if (!p) break
        const primary = get().selection.primaryNodeId ?? get().selection.nodeIds[0]
        if (!primary || !p.graph.nodes[primary]) break
        const st = get()
        const patch: Partial<RootState> = { centerViewTick: st.centerViewTick + 1 }
        if (!st.onboardingDismissed && !st.onboardingCoreComplete && !st.onboardingDidRecenter) {
          patch.onboardingDidRecenter = true
          void setMeta(META_ONBOARDING_DID_RECENTER, true)
        }
        set(patch)
        break
      }
      case 'addBookmark': {
        commit('bookmark', (p) => {
          const b: Bookmark = {
            id: nanoid(),
            label: a.label,
            worldTransform: { ...p.worldTransform },
            focusedNodeId: get().selection.primaryNodeId,
            createdAt: Date.now(),
          }
          p.bookmarks = [...p.bookmarks, b]
        })
        break
      }
      case 'removeBookmark': {
        commit('removeBookmark', (p) => {
          p.bookmarks = p.bookmarks.filter((x) => x.id !== a.id)
        })
        break
      }
      case 'recallBookmark': {
        const p = get().project
        if (!p) break
        const b = p.bookmarks.find((x) => x.id === a.id)
        if (!b) break
        set({
          project: {
            ...p,
            worldTransform: { ...b.worldTransform },
            updatedAt: Date.now(),
          },
          selection: b.focusedNodeId
            ? {
                nodeIds: [b.focusedNodeId],
                edgeIds: [],
                primaryNodeId: b.focusedNodeId,
              }
            : get().selection,
          detailNodeId: null,
          mediaAttach: null,
        })
        break
      }
      case 'search':
        set({ searchQuery: a.query })
        break
      case 'jumpToNode': {
        set({ searchOpen: false, searchHighlight: new Set([a.nodeId]) })
        break
      }
      case 'structureTool': {
        const p = get().project
        const sel = [...get().selection.nodeIds]
        if (!p || sel.length < 1) break
        commit('layout', (proj) => {
          const valid = sel.filter((id) => proj.graph.nodes[id])
          if (valid.length === 0) return
          const parentId = get().selection.primaryNodeId
          const parentPos = parentId ? proj.graph.nodes[parentId]?.position : undefined

          const applyPairs = (ids: string[], positions: Vec3[]) => {
            ids.forEach((id, i) => {
              const pos = positions[i]
              if (pos && proj.graph.nodes[id]) proj.graph = patchNode(proj.graph, id, { position: pos })
            })
          }

          const positions = valid.map((id) => proj.graph.nodes[id]!.position)

          switch (a.tool) {
            case 'alignX':
              applyPairs(valid, layoutTools.alignAxis(positions, 0, 'center'))
              break
            case 'alignY':
              applyPairs(valid, layoutTools.alignAxis(positions, 1, 'center'))
              break
            case 'alignZ':
              applyPairs(valid, layoutTools.alignAxis(positions, 2, 'center'))
              break
            case 'distributeX': {
              const axis = 0
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.distributeAlongAxis(pts, axis))
              break
            }
            case 'distributeY': {
              const axis = 1
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.distributeAlongAxis(pts, axis))
              break
            }
            case 'distributeZ': {
              const axis = 2
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.distributeAlongAxis(pts, axis))
              break
            }
            case 'radial': {
              const c = parentPos ?? positions[0]!
              applyPairs(valid, layoutTools.radialLayout(c, valid.length, 2, v3(0, 1, 0)))
              break
            }
            case 'flatten':
              applyPairs(
                valid,
                layoutTools.flattenToPlane(positions, positions[0]!, v3(0, 1, 0)),
              )
              break
            case 'stackX': {
              const axis = 0
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.stackAlongAxis(pts, axis, a.options?.spacing ?? 1))
              break
            }
            case 'stackY': {
              const axis = 1
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.stackAlongAxis(pts, axis, a.options?.spacing ?? 1))
              break
            }
            case 'stackZ': {
              const axis = 2
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.stackAlongAxis(pts, axis, a.options?.spacing ?? 1))
              break
            }
            case 'normalizeSpacing': {
              const axis = 0
              const sorted = [...valid].sort(
                (ida, idb) =>
                  proj.graph.nodes[ida]!.position[axis] - proj.graph.nodes[idb]!.position[axis],
              )
              const pts = sorted.map((id) => proj.graph.nodes[id]!.position)
              applyPairs(sorted, layoutTools.normalizeSpacing(pts, axis))
              break
            }
            case 'centerCluster':
              if (parentPos) applyPairs(valid, layoutTools.centerClusterAround(parentPos, positions))
              break
            default:
              break
          }
        })
        break
      }
      case 'setPlacementPreview':
        set({ placementPreview: a.preview })
        break
      case 'attachMedia': {
        const mediaStore = get().media
        const proj = get().project
        if (!mediaStore || !proj) break
        const { nodeId, file } = a
        const filename = file.name
        void (async () => {
          set({ mediaAttach: { nodeId, filename, phase: 'reading' } })
          try {
            const buf = await file.arrayBuffer()
            set({ mediaAttach: { nodeId, filename, phase: 'processing' } })
            const space = await checkSpaceForBytes(buf.byteLength)
            if (!space.ok) {
              set({
                mediaAttach: { nodeId, filename, phase: 'error', errorMessage: space.message },
              })
              return
            }
            const blobId = nanoid()
            await mediaStore.put(blobId, buf, { mime: file.type || 'application/octet-stream', name: filename })
            const kind: MediaAttachment['kind'] = file.type.startsWith('image/')
              ? 'image'
              : file.type === 'application/pdf'
                ? 'pdf'
                : file.type.startsWith('text/')
                  ? 'text'
                  : 'generic'
            let thumbnailBlobId: string | undefined
            if (kind === 'image') {
              const thumb = await buildImageThumbnailJpeg(buf, file.type || 'image/jpeg')
              if (thumb) {
                const tid = nanoid()
                await mediaStore.put(tid, thumb, { mime: 'image/jpeg', name: `${filename}.thumb.jpg` })
                thumbnailBlobId = tid
              }
            }
            const att: MediaAttachment = {
              id: nanoid(),
              kind,
              filename,
              mimeType: file.type || 'application/octet-stream',
              byteSize: buf.byteLength,
              blobId,
              createdAt: Date.now(),
              thumbnailBlobId,
            }
            set({ mediaAttach: null })
            commit('media', (p) => {
              p.mediaManifest = { ...p.mediaManifest, [att.id]: att }
              const n = p.graph.nodes[nodeId]
              if (n) {
                p.graph = patchNode(p.graph, nodeId, { mediaIds: [...n.mediaIds, att.id] })
              }
            })
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to attach file'
            set({ mediaAttach: { nodeId, filename, phase: 'error', errorMessage } })
          }
        })()
        break
      }
      case 'setSearchOpen':
        set((s) => ({
          searchOpen: a.open,
          searchQuery: a.open ? s.searchQuery : '',
        }))
        break
      case 'setWorldAxisDragActive':
        set({ worldAxisDragActive: a.active })
        break
      case 'setNodeDragActive': {
        const sel = get().selection
        const nodeId =
          a.active && a.nodeId !== undefined
            ? a.nodeId
            : a.active
              ? (sel.primaryNodeId ?? sel.nodeIds[0] ?? null)
              : null
        const proj = get().project

        if (!a.active) {
          const pending = get().pendingNodeDrag
          const cur = get().project
          if (pending && cur) {
            const before = pending.before
            const after = cloneProject(cur)
            const entry = buildProjectHistoryEntry(before, after, cloneProject, (p) => set({ project: p }))
            set((s) => ({
              interactionSession: idleSession,
              pendingNodeDrag: null,
              ...appendPast(s.historyPast, entry),
            }))
          } else {
            // Do not clear `link` / `worldGrab` — node meshes always dispatch `setNodeDragActive(false)` on pointerup.
            set((s) => ({
              ...(s.interactionSession.kind === 'nodeDrag' ? { interactionSession: idleSession } : {}),
              pendingNodeDrag: null,
            }))
          }
          break
        }

        if (!nodeId || !proj) break

        const pos = proj.graph.nodes[nodeId]?.position
        const p0 = pos ?? v3(0, 0, 0)
        const nextPending = { before: cloneProject(proj), nodeId }
        set({
          interactionSession: {
            kind: 'nodeDrag',
            pointerId: a.pointerId ?? 'primary',
            nodeId,
            start: [p0[0], p0[1], p0[2]],
            current: [p0[0], p0[1], p0[2]],
          },
          pendingNodeDrag: nextPending,
        })
        break
      }
      case 'patchSettings':
        commit('settings', (p) => {
          p.settings = { ...p.settings, ...a.patch }
        })
        break
      case 'patchDevicePreferences': {
        const next = { ...get().devicePreferences, ...a.patch }
        set({ devicePreferences: next })
        void setMeta(META_DEVICE_PREFS, next)
        break
      }
      default:
        break
    }

    const proj = get().project
    if (proj && shouldRebuildSearchIndex(a)) rebuildSearchIndex(proj)
  }

  return {
    ready: false,
    view: 'home',
    project: null,
    projectIndex: [],
    selection: { nodeIds: [], edgeIds: [] },
    hover: {},
    interactionMode: 'worldManip',
    navigationMode: 'world',
    interactionSession: idleSession,
    pendingNodeDrag: null,
    worldGrabBefore: null,
    devicePreferences: defaultDevicePreferences(),
    placementPreview: null,
    focusDim: false,
    focusSet: null,
    searchOpen: false,
    searchQuery: '',
    searchHighlight: new Set(),
    detailNodeId: null,
    onboardingDismissed: false,
    onboardingCoreComplete: false,
    onboardingSeenSelection: false,
    onboardingDidRecenter: false,
    onboardingDidUndo: false,
    onboardingCelebration: false,
    settingsOpen: false,
    mapHistoryOpen: false,
    bookmarksPanelOpen: false,
    saveIndicator: 'idle',
    feedbackMessage: null,
    confirmDialog: null,
    textPromptDialog: null,
    xrHelpOpen: false,
    xrSessionActive: false,
    xrHandTrackingPrimary: false,
    xrDebugHud: false,
    centerViewTick: 0,
    resetViewTick: 0,
    worldAxisDragActive: false,
    historyPast: [],
    historyFuture: [],
    repo: null,
    media: null,
    mediaAttach: null,
    dispatch,
    bootstrap: async () => {
      const repo = createIndexedDbProjectRepository()
      const media = createLocalMediaStore()
      const ids = await repo.listIds()
      const index: RootState['projectIndex'] = []
      for (const id of ids) {
        const pr = await repo.get(id)
        if (pr)
          index.push({
            id: pr.id,
            name: pr.name,
            updatedAt: pr.updatedAt,
            lastOpenedAt: pr.lastOpenedAt,
          })
      }
      index.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      const lastId = (await getMeta(META_LAST_PROJECT)) as string | undefined
      const dismissed =
        ((await getMeta(META_ONBOARDING_DISMISSED)) as boolean | undefined) ??
        ((await getMeta(META_ONBOARDING_LEGACY_DONE)) as boolean | undefined)
      const coreDone = (await getMeta(META_ONBOARDING_CORE_COMPLETE)) as boolean | undefined
      const seenSel = (await getMeta(META_ONBOARDING_SEEN_SELECTION)) as boolean | undefined
      const didRe = (await getMeta(META_ONBOARDING_DID_RECENTER)) as boolean | undefined
      const didUn = (await getMeta(META_ONBOARDING_DID_UNDO)) as boolean | undefined
      const rawDev = (await getMeta(META_DEVICE_PREFS)) as Partial<DevicePreferences> | undefined
      const devicePreferences = { ...defaultDevicePreferences(), ...rawDev }
      set({
        repo,
        media,
        projectIndex: index,
        ready: true,
        onboardingDismissed: !!dismissed,
        onboardingCoreComplete: !!coreDone,
        onboardingSeenSelection: !!seenSel,
        onboardingDidRecenter: !!didRe,
        onboardingDidUndo: !!didUn,
        devicePreferences,
      })
      if (lastId && ids.includes(lastId)) {
        const pr = await repo.get(lastId)
        if (pr) {
          pr.lastOpenedAt = Date.now()
          await repo.save(pr)
          rebuildSearchIndex(pr)
          set({ project: pr, view: 'scene', projectIndex: index.map((x) => (x.id === pr.id ? { ...x, lastOpenedAt: pr.lastOpenedAt } : x)) })
          set({ interactionSession: idleSession })
        }
      }
    },
    openProject: async (id) => {
      const repo = get().repo
      if (!repo) return
      const pr = await repo.get(id)
      if (!pr) return
      pr.lastOpenedAt = Date.now()
      pr.updatedAt = Date.now()
      await repo.save(pr)
      await setMeta(META_LAST_PROJECT, pr.id)
      rebuildSearchIndex(pr)
      set({
        project: pr,
        view: 'scene',
        selection: { nodeIds: [], edgeIds: [] },
        projectIndex: (await buildIndex(repo)),
        interactionSession: idleSession,
        mediaAttach: null,
      })
    },
    goHome: () => {
      void get().saveNow()
      set({
        view: 'home',
        project: null,
        mediaAttach: null,
        textPromptDialog: null,
        xrHelpOpen: false,
        mapHistoryOpen: false,
        bookmarksPanelOpen: false,
        feedbackMessage: null,
        interactionSession: idleSession,
        worldAxisDragActive: false,
        pendingNodeDrag: null,
        worldGrabBefore: null,
      })
    },
    newBlankProject: async () => {
      const repo = get().repo
      if (!repo) return
      const pr = createBlankProject('New mind map')
      await repo.save(pr)
      await setMeta(META_LAST_PROJECT, pr.id)
      rebuildSearchIndex(pr)
      set({
        project: pr,
        view: 'scene',
        selection: { nodeIds: [], edgeIds: [] },
        projectIndex: await buildIndex(repo),
        mediaAttach: null,
      })
    },
    newProjectFromTemplate: async (templateId) => {
      const repo = get().repo
      const t = getTemplate(templateId)
      if (!repo || !t) return
      const pr = t.build()
      await repo.save(pr)
      await setMeta(META_LAST_PROJECT, pr.id)
      rebuildSearchIndex(pr)
      set({
        project: pr,
        view: 'scene',
        selection: { nodeIds: [], edgeIds: [] },
        projectIndex: await buildIndex(repo),
        interactionSession: idleSession,
        mediaAttach: null,
      })
    },
    setMapHistoryOpen: (open) => set({ mapHistoryOpen: open, ...(open ? { bookmarksPanelOpen: false } : {}) }),
    setBookmarksPanelOpen: (open: boolean) =>
      set({ bookmarksPanelOpen: open, ...(open ? { mapHistoryOpen: false } : {}) }),
    createMapSnapshot: async (label) => {
      const p = get().project
      if (!p) return
      const payload = buildMapSnapshotPayload(p)
      try {
        await mapSnapshots.create(p.id, payload, label)
        set({
          feedbackMessage: { text: 'Snapshot saved', tone: 'success', at: Date.now() },
        })
      } catch {
        set({
          feedbackMessage: { text: 'Could not save snapshot', tone: 'error', at: Date.now() },
        })
      }
    },
    restoreMapSnapshot: async (snapshotId, options) => {
      const repo = get().repo
      let cur = get().project
      if (!repo || !cur) return
      const rec = await mapSnapshots.get(snapshotId)
      if (!rec || rec.projectId !== cur.id) return
      if (options.saveBeforeRestore) {
        await mapSnapshots.create(cur.id, buildMapSnapshotPayload(cur), 'Before restore')
      }
      cur = get().project
      if (!cur) return
      const next = applyMapSnapshotPayload(cur, rec.payload)
      rebuildSearchIndex(next)
      set({
        project: next,
        selection: { nodeIds: [], edgeIds: [] },
        detailNodeId: null,
        mediaAttach: null,
        historyPast: [],
        historyFuture: [],
        placementPreview: null,
        mapHistoryOpen: false,
      })
      await repo.save(next)
      set({
        projectIndex: await buildIndex(repo),
        feedbackMessage: { text: 'Map restored from snapshot', tone: 'success', at: Date.now() },
      })
    },
    duplicateCurrentProject: async () => {
      const repo = get().repo
      const cur = get().project
      if (!repo || !cur) return
      const copy = cloneProject(cur)
      copy.id = nanoid()
      copy.name = `${cur.name} (copy)`
      const t = Date.now()
      copy.createdAt = t
      copy.updatedAt = t
      copy.lastOpenedAt = t
      await repo.save(copy)
      await setMeta(META_LAST_PROJECT, copy.id)
      rebuildSearchIndex(copy)
      set({
        project: copy,
        projectIndex: await buildIndex(repo),
        interactionSession: idleSession,
        mediaAttach: null,
      })
    },
    renameProject: async (id, name) => {
      const repo = get().repo
      if (!repo) return
      const pr = await repo.get(id)
      if (!pr) return
      pr.name = name
      pr.updatedAt = Date.now()
      await repo.save(pr)
      set((s) => ({
        project: s.project?.id === id ? { ...s.project, name } : s.project,
        projectIndex: s.projectIndex.map((x) => (x.id === id ? { ...x, name, updatedAt: pr.updatedAt } : x)),
      }))
    },
    deleteProject: async (id) => {
      const repo = get().repo
      if (!repo) return
      await mapSnapshots.deleteAllForProject(id)
      await repo.delete(id)
      const cur = get().project
      if (cur?.id === id) {
        set({ project: null, view: 'home', mediaAttach: null })
        await setMeta(META_LAST_PROJECT, '')
      }
      set({ projectIndex: await buildIndex(repo) })
    },
    clearCurrentMap: () => {
      const cur = get().project
      const repo = get().repo
      if (!cur) return
      const cleared: Project = {
        ...cur,
        graph: emptyGraph(),
        bookmarks: [],
        worldTransform: defaultWorldTransform(),
        mediaManifest: {},
        updatedAt: Date.now(),
      }
      rebuildSearchIndex(cleared)
      set({
        project: cleared,
        selection: { nodeIds: [], edgeIds: [] },
        detailNodeId: null,
        mediaAttach: null,
        focusSet: null,
        focusDim: false,
        placementPreview: null,
        searchOpen: false,
        searchQuery: '',
        searchHighlight: new Set(),
        historyPast: [],
        historyFuture: [],
        confirmDialog: null,
        textPromptDialog: null,
        xrHelpOpen: false,
        hover: {},
        navigationMode: 'world',
        interactionSession: idleSession,
        pendingNodeDrag: null,
        worldGrabBefore: null,
        worldAxisDragActive: false,
      })
      if (repo) void repo.save(cleared)
    },
    exportProject: () => {
      const p = get().project
      if (!p) return
      const out = cloneProject(p)
      out.settings = mapOnlySettings(p.settings)
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${p.name.replace(/[^\w-]+/g, '_')}.smc.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    exportProjectZip: async () => {
      const p = get().project
      const media = get().media
      if (!p || !media) return
      const out = cloneProject(p)
      out.settings = mapOnlySettings(p.settings)
      const bytes = await buildProjectZip(out, media)
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${p.name.replace(/[^\w-]+/g, '_')}.smc.zip`
      a.click()
      URL.revokeObjectURL(url)
    },
    importProject: async (file) => {
      const repo = get().repo
      const media = get().media
      if (!repo || !media) return
      const buf = await file.arrayBuffer()
      const u8 = new Uint8Array(buf)
      const looksZip = file.name.endsWith('.zip') || (u8[0] === 0x50 && u8[1] === 0x4b)
      if (looksZip) {
        const approx = estimateZipUncompressedSize(u8)
        const space = await checkSpaceForBytes(approx)
        if (!space.ok) {
          set({ feedbackMessage: { text: space.message, tone: 'error', at: Date.now() } })
          return
        }
        const parsed = await parseProjectZip(u8, media)
        if (!parsed.ok) {
          set({ feedbackMessage: { text: parsed.error, tone: 'error', at: Date.now() } })
          return
        }
        const data = parsed.project
        data.id = nanoid()
        const t = Date.now()
        data.createdAt = t
        data.updatedAt = t
        data.lastOpenedAt = t
        const valid = ProjectSchema.safeParse(data)
        if (!valid.success) {
          set({
            feedbackMessage: { text: 'Imported ZIP failed schema validation', tone: 'error', at: Date.now() },
          })
          return
        }
        await repo.save(valid.data as Project)
        rebuildSearchIndex(valid.data as Project)
        await setMeta(META_LAST_PROJECT, (valid.data as Project).id)
        set({
          project: valid.data as Project,
          view: 'scene',
          projectIndex: await buildIndex(repo),
          interactionSession: idleSession,
          mediaAttach: null,
          feedbackMessage: { text: 'Imported map from ZIP', tone: 'success', at: Date.now() },
        })
        return
      }
      const text = new TextDecoder().decode(buf)
      const parsed = ProjectSchema.safeParse(JSON.parse(text))
      if (!parsed.success) {
        set({
          feedbackMessage: { text: 'Imported JSON failed validation', tone: 'error', at: Date.now() },
        })
        return
      }
      const data = parsed.data as Project
      data.id = nanoid()
      const t = Date.now()
      data.createdAt = t
      data.updatedAt = t
      data.lastOpenedAt = t
      await repo.save(data)
      rebuildSearchIndex(data)
      await setMeta(META_LAST_PROJECT, data.id)
      set({
        project: data,
        view: 'scene',
        projectIndex: await buildIndex(repo),
        interactionSession: idleSession,
        mediaAttach: null,
        feedbackMessage: { text: 'Imported map from JSON', tone: 'success', at: Date.now() },
      })
    },
    saveNow: async () => {
      const repo = get().repo
      const p = get().project
      if (!repo || !p) return
      set({ saveIndicator: 'saving' })
      p.updatedAt = Date.now()
      try {
        await repo.save(p)
        set({ projectIndex: await buildIndex(repo), saveIndicator: 'saved' })
      } catch {
        set({ saveIndicator: 'error' })
      }
    },
  }
})

async function buildIndex(repo: ProjectRepository) {
  const ids = await repo.listIds()
  const index: RootState['projectIndex'] = []
  for (const id of ids) {
    const pr = await repo.get(id)
    if (pr)
      index.push({
        id: pr.id,
        name: pr.name,
        updatedAt: pr.updatedAt,
        lastOpenedAt: pr.lastOpenedAt,
      })
  }
  index.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
  return index
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
useRootStore.subscribe((s, p) => {
  if (!s.ready || !s.project || s.project === p.project) return
  useRootStore.setState({ saveIndicator: 'pending' })
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null
    const repo = useRootStore.getState().repo
    const proj = useRootStore.getState().project
    if (repo && proj) {
      void warnIfStorageAlmostFull()
      const copy = cloneProject(proj)
      copy.updatedAt = Date.now()
      useRootStore.setState({ saveIndicator: 'saving' })
      void repo
        .save(copy)
        .then(() => {
          useRootStore.setState({ saveIndicator: 'saved' })
        })
        .catch(() => {
          useRootStore.setState({ saveIndicator: 'error' })
        })
    }
  }, 500)
})

export { runSearchQuery } from './searchIndex'
