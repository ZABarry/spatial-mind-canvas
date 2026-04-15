import type { DevicePreferences, InteractionMode, NodeShape, UserSettings } from '../graph/types'
import type { HitTarget } from './hitTargets'
import type { NavigationMode } from './tools'
import type { Vec3, Vec4 } from '../utils/math'

export type AppAction =
  | { type: 'noop' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'selectNodes'; ids: string[]; additive?: boolean }
  | { type: 'selectEdges'; ids: string[]; additive?: boolean }
  | { type: 'clearSelection' }
  | { type: 'setHover'; nodeId?: string; edgeId?: string }
  | { type: 'setInteractionMode'; mode: InteractionMode }
  | { type: 'setNavigationMode'; mode: NavigationMode }
  | { type: 'createNodeAt'; position: Vec3; parentId?: string; connectFromId?: string; shape?: NodeShape }
  /** Desktop: add several child nodes in one undo step (quick branch). */
  | { type: 'spawnChildBranches'; parentId: string; count: number }
  | { type: 'moveNode'; nodeId: string; position: Vec3 }
  | { type: 'deleteSelection' }
  | { type: 'deleteNode'; id: string }
  | { type: 'deleteEdge'; id: string }
  | { type: 'connectNodes'; fromId: string; toId: string }
  | { type: 'startConnection'; fromNodeId: string; xrControllerIndex?: number }
  | { type: 'finishConnection'; targetNodeId?: string; dropPosition?: Vec3 }
  | { type: 'cancelConnection' }
  /** Update hover/preview target while drafting a link (session must be `link`). */
  | { type: 'setLinkPreviewTarget'; target: HitTarget | undefined }
  /** Abort link, node drag, or world grab without committing a new history frame (drag/grab restore start snapshot). */
  | { type: 'cancelActiveInteraction' }
  | { type: 'openNodeDetail'; nodeId: string | null }
  | { type: 'updateNodeProps'; nodeId: string; patch: Record<string, unknown> }
  | { type: 'toggleCollapse'; nodeId: string }
  | { type: 'setWorldTransform'; position: Vec3; quaternion: Vec4; scale: number }
  /** Live world translation (no undo frame); use for drag like `moveNode`. */
  | { type: 'setWorldPosition'; position: Vec3 }
  | { type: 'translateWorld'; delta: Vec3 }
  | { type: 'rotateWorld'; axis: Vec3; radians: number }
  | { type: 'scaleWorld'; factor: number }
  /** XR world grab: live updates without history until `endWorldGrab`. */
  | { type: 'translateWorldLive'; delta: Vec3 }
  | { type: 'rotateWorldLive'; axis: Vec3; radians: number }
  | { type: 'scaleWorldLive'; factor: number }
  | { type: 'beginWorldGrab' }
  | { type: 'endWorldGrab' }
  | { type: 'resetWorld' }
  | { type: 'focusSelection' }
  /** Pan the world so the primary selected node aligns with the orbit target (desktop) or world origin. */
  | { type: 'centerViewOnSelection' }
  | { type: 'setFocusDim'; dim: boolean }
  | { type: 'addBookmark'; label: string }
  | { type: 'removeBookmark'; id: string }
  | { type: 'recallBookmark'; id: string }
  | { type: 'search'; query: string }
  | { type: 'jumpToNode'; nodeId: string }
  | { type: 'structureTool'; tool: StructureToolName; options?: Record<string, number> }
  | { type: 'setPlacementPreview'; preview: { position: Vec3; parentId?: string; connectFromId?: string } | null }
  | { type: 'attachMedia'; nodeId: string; file: File }
  | { type: 'setSearchOpen'; open: boolean }
  | { type: 'patchSettings'; patch: Partial<UserSettings> }
  | { type: 'patchDevicePreferences'; patch: Partial<DevicePreferences> }
  /** VR: snap head-relative panel anchors to the current comfortable pose (recovery). */
  | { type: 'bumpXrPanelAnchors' }
  /** Desktop: disable orbit rotation while dragging nodes so the camera does not spin. */
  | { type: 'setNodeDragActive'; active: boolean; nodeId?: string; pointerId?: string }
  /** VR: wrist panel or node contextual menu — blocks world grab; does not replace link/drag/worldGrab. */
  | { type: 'setMenuSession'; menu: 'global' | 'node' | null }
  /** Desktop: disable orbit rotation while dragging world origin axis handles. */
  | { type: 'setWorldAxisDragActive'; active: boolean }

export type StructureToolName =
  | 'alignX'
  | 'alignY'
  | 'alignZ'
  | 'distributeX'
  | 'distributeY'
  | 'distributeZ'
  | 'radial'
  | 'flatten'
  | 'stackX'
  | 'stackY'
  | 'stackZ'
  | 'normalizeSpacing'
  | 'centerCluster'
