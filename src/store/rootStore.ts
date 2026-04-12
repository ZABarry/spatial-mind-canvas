import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { AppAction } from '../input/actions'
import type { Bookmark, EdgeStyle, InteractionMode, Project, SelectionState } from '../graph/types'
import { createBlankProject, defaultWorldTransform, emptyGraph } from '../graph/defaults'
import { addEdge, addNode, createNodeDefaults, patchNode, removeEdge, removeNode } from '../graph/mutations'
import { neighborIdsByEdges } from '../graph/selectors'
import * as layoutTools from '../graph/layout/tools'
import type { Vec3, Vec4 } from '../utils/math'
import { vec3Add, v3 } from '../utils/math'
import {
  createIndexedDbProjectRepository,
  type ProjectRepository,
} from '../persistence/projectRepository'
import { ProjectSchema } from '../persistence/schemas'
import { buildProjectZip, estimateZipUncompressedSize, parseProjectZip } from '../persistence/zipBundle'
import { checkSpaceForBytes, warnIfStorageAlmostFull } from '../media/quota'
import { buildImageThumbnailJpeg } from '../media/imageThumbnail'
import { createLocalMediaStore } from '../media/localMediaStore'
import type { MediaStore } from '../media/types'
import { getMeta, META_LAST_PROJECT, setMeta } from '../persistence/db'
import type { MediaAttachment } from '../graph/types'
import Fuse from 'fuse.js'

const HISTORY_LIMIT = 80

type HistoryEntry = {
  undo: () => void
  redo: () => void
}

export type AppView = 'home' | 'scene'

export interface RootState {
  ready: boolean
  view: AppView
  project: Project | null
  projectIndex: Array<{ id: string; name: string; updatedAt: number; lastOpenedAt: number }>
  selection: SelectionState
  hover: { nodeId?: string; edgeId?: string }
  interactionMode: InteractionMode
  connectionDraft: {
    fromNodeId: string
    style: EdgeStyle
    pathPoints: Vec3[]
    /** WebXR: controller index from the hand that started the gesture (see `xrControllerIndexFromRayOrigin`). */
    xrControllerIndex?: number
  } | null
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
  onboardingStep: number
  settingsOpen: boolean
  confirmDialog: { title: string; message: string; onConfirm: () => void } | null
  /** Text prompt for VR (e.g. bookmark name); replaces `window.prompt` while immersive. */
  textPromptDialog: { title: string; defaultValue: string; onSubmit: (value: string) => void } | null
  /** In-headset help overlay (replaces floating Help button DOM). */
  xrHelpOpen: boolean
  /** Set from WebXR session inside canvas — hides flat HTML modals while immersive. */
  xrSessionActive: boolean
  /** Bumped when `centerViewOnSelection` runs; canvas reads orbit target and applies `translateWorld`. */
  centerViewTick: number
  /** Bumped on `resetWorld`; canvas restores desktop orbit camera to its initial pose. */
  resetViewTick: number
  /** True while a node is pointer-dragged (desktop); orbit controls disable rotation. */
  nodeDragActive: boolean
  historyPast: HistoryEntry[]
  historyFuture: HistoryEntry[]
  /** XR + app */
  repo: ProjectRepository | null
  media: MediaStore | null
  dispatch: (a: AppAction) => void
  bootstrap: () => Promise<void>
  openProject: (id: string) => Promise<void>
  goHome: () => void
  newBlankProject: () => Promise<void>
  duplicateCurrentProject: () => Promise<void>
  renameProject: (id: string, name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearCurrentMap: () => void
  exportProject: () => void
  exportProjectZip: () => Promise<void>
  importProject: (file: File) => Promise<void>
  saveNow: () => Promise<void>
}

function cloneProject(p: Project): Project {
  return structuredClone(p)
}

let fuse: Fuse<{ id: string; text: string }> | null = null

function rebuildSearchIndex(project: Project) {
  const items: { id: string; text: string }[] = []
  for (const n of Object.values(project.graph.nodes)) {
    items.push({
      id: n.id,
      text: [n.title, n.shortDescription, n.note, ...n.tags].join('\n'),
    })
  }
  for (const m of Object.values(project.mediaManifest)) {
    items.push({ id: `media:${m.id}`, text: m.filename })
  }
  fuse = new Fuse(items, { keys: ['text'], threshold: 0.35 })
}

/** Search index only tracks node text/tags and media filenames — skip hot paths (e.g. VR edge drawing). */
function shouldRebuildSearchIndex(a: AppAction): boolean {
  switch (a.type) {
    case 'createNodeAt':
    case 'deleteNode':
    case 'deleteSelection':
    case 'updateNodeProps':
    case 'attachMedia':
    case 'undo':
    case 'redo':
    case 'finishConnection':
      return true
    default:
      return false
  }
}

export const useRootStore = create<RootState>((set, get) => {
  function commit(_label: string, mutator: (p: Project) => void) {
    const state = get()
    if (!state.project) return
    const before = cloneProject(state.project)
    const draft = cloneProject(state.project)
    mutator(draft)
    draft.updatedAt = Date.now()
    const after = draft
    set({ project: after })
    const entry: HistoryEntry = {
      undo: () => set({ project: cloneProject(before) }),
      redo: () => set({ project: cloneProject(after) }),
    }
    set((s) => ({
      historyPast: [...s.historyPast, entry].slice(-HISTORY_LIMIT),
      historyFuture: [],
    }))
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
        a.type === 'setSearchOpen'
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
        last.undo()
        set({ historyPast: past.slice(0, -1), historyFuture: [last, ...get().historyFuture] })
        break
      }
      case 'redo': {
        const fut = get().historyFuture
        const first = fut[0]
        if (!first) break
        first.redo()
        set({ historyFuture: fut.slice(1), historyPast: [...get().historyPast, first] })
        break
      }
      case 'selectNodes': {
        const sel = get().selection
        const next = a.additive ? { ...sel, nodeIds: [...new Set([...sel.nodeIds, ...a.ids])] } : { ...sel, nodeIds: a.ids, edgeIds: [] }
        set({ selection: { ...next, primaryNodeId: a.ids[0] ?? next.primaryNodeId } })
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
        set({ interactionMode: a.mode })
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
              style: 'straight',
            })
            p.graph = e.graph
          }
        })
        break
      }
      case 'moveNode': {
        const p = get().project
        if (!p) break
        set({
          project: {
            ...p,
            graph: patchNode(p.graph, a.nodeId, { position: a.position }),
            updatedAt: Date.now(),
          },
        })
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
            style: a.style,
            controlPoints: a.controlPoints,
          })
          p.graph = res.graph
        })
        break
      }
      case 'startConnection':
        set({
          connectionDraft: {
            fromNodeId: a.fromNodeId,
            style: a.style,
            pathPoints: [],
            ...(a.xrControllerIndex !== undefined ? { xrControllerIndex: a.xrControllerIndex } : {}),
          },
        })
        break
      case 'updateConnectionDrag':
        set((s) =>
          s.connectionDraft
            ? { connectionDraft: { ...s.connectionDraft, pathPoints: a.pathPoints } }
            : {},
        )
        break
      case 'finishConnection': {
        const draft = get().connectionDraft
        if (!draft || !get().project) {
          set({ connectionDraft: null })
          break
        }
        const fromId = draft.fromNodeId
        /** Interior control points (excluding endpoints) */
        const mids = draft.pathPoints
        const style: EdgeStyle = mids.length >= 1 ? 'spline' : 'straight'
        if (a.targetNodeId) {
          dispatch({
            type: 'connectNodes',
            fromId,
            toId: a.targetNodeId,
            style,
            controlPoints: style === 'spline' ? mids : undefined,
          })
        } else if (a.dropPosition) {
          commit('connect+node', (p) => {
            const base = createNodeDefaults(a.dropPosition!)
            const { graph, node } = addNode(p.graph, base)
            p.graph = graph
            const e = addEdge(p.graph, {
              sourceId: fromId,
              targetId: node.id,
              style,
              controlPoints: style === 'spline' ? mids : undefined,
            })
            p.graph = e.graph
          })
        }
        set({ connectionDraft: null })
        break
      }
      case 'cancelConnection':
        set({ connectionDraft: null })
        break
      case 'openNodeDetail':
        set({ detailNodeId: a.nodeId })
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
        set({ centerViewTick: get().centerViewTick + 1 })
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
        void (async () => {
          const buf = await a.file.arrayBuffer()
          const space = await checkSpaceForBytes(buf.byteLength)
          if (!space.ok) {
            window.alert(space.message)
            return
          }
          const blobId = nanoid()
          await mediaStore.put(blobId, buf, { mime: a.file.type || 'application/octet-stream', name: a.file.name })
          const kind: MediaAttachment['kind'] = a.file.type.startsWith('image/')
            ? 'image'
            : a.file.type === 'application/pdf'
              ? 'pdf'
              : a.file.type.startsWith('text/')
                ? 'text'
                : 'generic'
          let thumbnailBlobId: string | undefined
          if (kind === 'image') {
            const thumb = await buildImageThumbnailJpeg(buf, a.file.type || 'image/jpeg')
            if (thumb) {
              const tid = nanoid()
              await mediaStore.put(tid, thumb, { mime: 'image/jpeg', name: `${a.file.name}.thumb.jpg` })
              thumbnailBlobId = tid
            }
          }
          const att: MediaAttachment = {
            id: nanoid(),
            kind,
            filename: a.file.name,
            mimeType: a.file.type || 'application/octet-stream',
            byteSize: buf.byteLength,
            blobId,
            createdAt: Date.now(),
            thumbnailBlobId,
          }
          commit('media', (p) => {
            p.mediaManifest = { ...p.mediaManifest, [att.id]: att }
            const n = p.graph.nodes[a.nodeId]
            if (n) {
              p.graph = patchNode(p.graph, a.nodeId, { mediaIds: [...n.mediaIds, att.id] })
            }
          })
        })()
        break
      }
      case 'setSearchOpen':
        set((s) => ({
          searchOpen: a.open,
          searchQuery: a.open ? s.searchQuery : '',
        }))
        break
      case 'setNodeDragActive':
        set({ nodeDragActive: a.active })
        break
      case 'patchSettings':
        commit('settings', (p) => {
          p.settings = { ...p.settings, ...a.patch }
        })
        break
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
    connectionDraft: null,
    placementPreview: null,
    focusDim: false,
    focusSet: null,
    searchOpen: false,
    searchQuery: '',
    searchHighlight: new Set(),
    detailNodeId: null,
    onboardingDismissed: false,
    onboardingStep: 0,
    settingsOpen: false,
    confirmDialog: null,
    textPromptDialog: null,
    xrHelpOpen: false,
    xrSessionActive: false,
    centerViewTick: 0,
    resetViewTick: 0,
    nodeDragActive: false,
    historyPast: [],
    historyFuture: [],
    repo: null,
    media: null,
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
      const onboard = (await getMeta('onboardingDismissed')) as boolean | undefined
      set({
        repo,
        media,
        projectIndex: index,
        ready: true,
        onboardingDismissed: !!onboard,
        onboardingStep: 0,
      })
      if (lastId && ids.includes(lastId)) {
        const pr = await repo.get(lastId)
        if (pr) {
          pr.lastOpenedAt = Date.now()
          await repo.save(pr)
          rebuildSearchIndex(pr)
          set({ project: pr, view: 'scene', projectIndex: index.map((x) => (x.id === pr.id ? { ...x, lastOpenedAt: pr.lastOpenedAt } : x)) })
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
      })
    },
    goHome: () => {
      void get().saveNow()
      set({ view: 'home', project: null, textPromptDialog: null, xrHelpOpen: false })
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
      await repo.delete(id)
      const cur = get().project
      if (cur?.id === id) {
        set({ project: null, view: 'home' })
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
        focusSet: null,
        focusDim: false,
        connectionDraft: null,
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
      })
      if (repo) void repo.save(cleared)
    },
    exportProject: () => {
      const p = get().project
      if (!p) return
      const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
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
      const bytes = await buildProjectZip(p, media)
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
          window.alert(space.message)
          return
        }
        const parsed = await parseProjectZip(u8, media)
        if (!parsed.ok) {
          window.alert(parsed.error)
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
          window.alert('Imported ZIP project failed schema validation')
          return
        }
        await repo.save(valid.data as Project)
        rebuildSearchIndex(valid.data as Project)
        await setMeta(META_LAST_PROJECT, (valid.data as Project).id)
        set({
          project: valid.data as Project,
          view: 'scene',
          projectIndex: await buildIndex(repo),
        })
        return
      }
      const text = new TextDecoder().decode(buf)
      const parsed = ProjectSchema.safeParse(JSON.parse(text))
      if (!parsed.success) return
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
      })
    },
    saveNow: async () => {
      const repo = get().repo
      const p = get().project
      if (!repo || !p) return
      p.updatedAt = Date.now()
      await repo.save(p)
      set({ projectIndex: await buildIndex(repo) })
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
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null
    const repo = useRootStore.getState().repo
    const proj = useRootStore.getState().project
    if (repo && proj) {
      void warnIfStorageAlmostFull()
      const copy = cloneProject(proj)
      copy.updatedAt = Date.now()
      void repo.save(copy)
    }
  }, 500)
})

export function runSearchQuery(query: string): string[] {
  if (!fuse || !query.trim()) return []
  return fuse.search(query).map((r) => r.item.id)
}
