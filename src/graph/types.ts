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

export type EdgeStyle = 'straight' | 'spline'

export type InteractionMode = 'worldManip' | 'travel' | 'nodeDetail'

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
  /** World-space control points for spline edges (excluding endpoints) */
  controlPoints?: Vec3[]
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

export interface UserSettings {
  locomotionSmooth: boolean
  snapTurnDegrees: number
  comfortVignette: boolean
  audioEnabled: boolean
  dominantHand: 'left' | 'right'
  smoothTurnSpeed: number
  moveSpeed: number
  focusHopDepth: number
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
  style: EdgeStyle
  /** Sampled world points along drag for expressive spline */
  pathPoints: Vec3[]
}

export interface PlacementPreviewState {
  position: Vec3
  parentId?: string
  connectFromId?: string
}
