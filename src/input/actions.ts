import type { EdgeStyle, InteractionMode, NodeShape, UserSettings } from '../graph/types'
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
  | { type: 'createNodeAt'; position: Vec3; parentId?: string; connectFromId?: string; shape?: NodeShape }
  | { type: 'moveNode'; nodeId: string; position: Vec3 }
  | { type: 'deleteSelection' }
  | { type: 'deleteNode'; id: string }
  | { type: 'deleteEdge'; id: string }
  | { type: 'connectNodes'; fromId: string; toId: string; style: EdgeStyle; controlPoints?: Vec3[] }
  | { type: 'startConnection'; fromNodeId: string; style: EdgeStyle; xrControllerIndex?: number }
  | { type: 'updateConnectionDrag'; pathPoints: Vec3[] }
  | { type: 'finishConnection'; targetNodeId?: string; dropPosition?: Vec3 }
  | { type: 'cancelConnection' }
  | { type: 'openNodeDetail'; nodeId: string | null }
  | { type: 'updateNodeProps'; nodeId: string; patch: Record<string, unknown> }
  | { type: 'toggleCollapse'; nodeId: string }
  | { type: 'setWorldTransform'; position: Vec3; quaternion: Vec4; scale: number }
  /** Live world translation (no undo frame); use for drag like `moveNode`. */
  | { type: 'setWorldPosition'; position: Vec3 }
  | { type: 'translateWorld'; delta: Vec3 }
  | { type: 'rotateWorld'; axis: Vec3; radians: number }
  | { type: 'scaleWorld'; factor: number }
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
  /** Desktop: disable orbit rotation while dragging nodes so the camera does not spin. */
  | { type: 'setNodeDragActive'; active: boolean }

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
