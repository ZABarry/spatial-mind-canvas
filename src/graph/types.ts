import type { Vec3, Vec4 } from '../utils/math'

export const APP_SCHEMA_VERSION = 1

export type NodeShape =
  | 'sphere'
  | 'cube'
  | 'capsule'
  | 'tetra'
  | 'ring'
  | 'diamond'
  | 'pill'

/** All variants; keep in sync with geometry in `scene/graph/nodeGeometry.tsx`. */
export const NODE_SHAPES = [
  'sphere',
  'cube',
  'capsule',
  'tetra',
  'ring',
  'diamond',
  'pill',
] as const satisfies readonly NodeShape[]

/** Edges are straight segments between connected node centers. */
export type EdgeStyle = 'straight'

/** Legacy combined mode; prefer `NavigationMode` + `ToolMode` in new input code. */
export type InteractionMode = 'worldManip' | 'travel'

export interface MediaAttachment {
  id: string
  kind: 'image' | 'pdf' | 'text' | 'generic' | 'note'
  filename: string
  mimeType: string
  byteSize: number
  blobId: string
  createdAt: number
  thumbnailBlobId?: string
}

export interface NodeEntity {
  id: string
  title: string
  shortDescription: string
  note: string
  color: string
  shape: NodeShape
  /** Visual scale multiplier */
  size: number
  position: Vec3
  tags: string[]
  createdAt: number
  updatedAt: number
  collapsed: boolean
  pinned: boolean
  mediaIds: string[]
  /** Set when created as child; used for collapse/branch layout */
  parentId?: string
}

export interface EdgeEntity {
  id: string
  sourceId: string
  targetId: string
  label: string
  style: EdgeStyle
  thickness: number
  directed: boolean
  createdAt: number
  updatedAt: number
}

export interface GraphState {
  nodes: Record<string, NodeEntity>
  edges: Record<string, EdgeEntity>
}

export interface Bookmark {
  id: string
  label: string
  worldTransform: WorldTransform
  focusedNodeId?: string
  createdAt: number
}

export interface WorldTransform {
  position: Vec3
  quaternion: Vec4
  /** Uniform scale of the entire graph */
  scale: number
}

/**
 * Headset / input preferences — stored in app metadata, not in map JSON, so switching maps does not
 * change locomotion or comfort. (Legacy `UserSettings` may still contain these until migrated.)
 */
export interface DevicePreferences {
  locomotionSmooth: boolean
  snapTurnDegrees: number
  comfortVignette: boolean
  audioEnabled: boolean
  dominantHand: 'left' | 'right'
  smoothTurnSpeed: number
  moveSpeed: number
  preferXrPassthrough?: boolean
}

export interface UserSettings {
  locomotionSmooth: boolean
  snapTurnDegrees: number
  comfortVignette: boolean
  audioEnabled: boolean
  dominantHand: 'left' | 'right'
  smoothTurnSpeed: number
  moveSpeed: number
  focusHopDepth: number
  /** Max labels to show by distance when `showAllLabels` is false (default applied in UI). */
  labelBudget?: number
  /** Debug / power-user: draw every node label (expensive on Quest). */
  showAllLabels?: boolean
  /** Show X/Y/Z handles at world origin and on nodes; drag a handle to move along that axis only. */
  worldAxisControls?: boolean
  /** Floor plane grid in the scene view; default on when unset. */
  floorGrid?: boolean
  /**
   * When entering XR from the app toolbar, start in mixed (camera) reality if the device supports it;
   * otherwise falls back to immersive VR. In-headset passthrough is toggled separately from travel/world mode.
   */
  preferXrPassthrough?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
  graph: GraphState
  bookmarks: Bookmark[]
  worldTransform: WorldTransform
  settings: UserSettings
  /** Media metadata keyed by attachment id */
  mediaManifest: Record<string, MediaAttachment>
  schemaVersion: number
}

export interface SelectionState {
  nodeIds: string[]
  edgeIds: string[]
  primaryNodeId?: string
}

export interface ConnectionDraftState {
  fromNodeId: string
  /** WebXR: controller index for the ray that started this connection */
  xrControllerIndex?: number
}

export interface PlacementPreviewState {
  position: Vec3
  parentId?: string
  connectFromId?: string
}
