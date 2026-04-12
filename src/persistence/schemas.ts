import { z } from 'zod'

const vec3 = z.tuple([z.number(), z.number(), z.number()])
const vec4 = z.tuple([z.number(), z.number(), z.number(), z.number()])

export const WorldTransformSchema = z.object({
  position: vec3,
  quaternion: vec4,
  scale: z.number(),
})

export const UserSettingsSchema = z.object({
  locomotionSmooth: z.boolean(),
  snapTurnDegrees: z.number(),
  comfortVignette: z.boolean(),
  audioEnabled: z.boolean(),
  dominantHand: z.enum(['left', 'right']),
  smoothTurnSpeed: z.number(),
  moveSpeed: z.number(),
  focusHopDepth: z.number(),
  labelBudget: z.number().optional(),
  showAllLabels: z.boolean().optional(),
  worldAxisControls: z.boolean().optional(),
  floorGrid: z.boolean().optional(),
  preferXrPassthrough: z.boolean().optional(),
})

export const MediaAttachmentSchema = z.object({
  id: z.string(),
  kind: z.enum(['image', 'pdf', 'text', 'generic', 'note']),
  filename: z.string(),
  mimeType: z.string(),
  byteSize: z.number(),
  blobId: z.string(),
  createdAt: z.number(),
  thumbnailBlobId: z.string().optional(),
})

export const NodeEntitySchema = z.object({
  id: z.string(),
  title: z.string(),
  shortDescription: z.string(),
  note: z.string(),
  color: z.string(),
  shape: z.enum(['sphere', 'cube', 'capsule', 'tetra', 'ring', 'diamond', 'pill']),
  size: z.number(),
  position: vec3,
  tags: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
  collapsed: z.boolean(),
  pinned: z.boolean(),
  mediaIds: z.array(z.string()),
  parentId: z.string().optional(),
})

/** Accepts legacy spline data; normalizes to straight edges with no control points. */
export const EdgeEntitySchema = z
  .object({
    id: z.string(),
    sourceId: z.string(),
    targetId: z.string(),
    label: z.string(),
    style: z.enum(['straight', 'spline']),
    controlPoints: z.array(vec3).optional(),
    thickness: z.number(),
    directed: z.boolean(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .transform((e) => ({
    id: e.id,
    sourceId: e.sourceId,
    targetId: e.targetId,
    label: e.label,
    style: 'straight' as const,
    thickness: e.thickness,
    directed: e.directed,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }))

export const GraphStateSchema = z.object({
  nodes: z.record(z.string(), NodeEntitySchema),
  edges: z.record(z.string(), EdgeEntitySchema),
})

export const BookmarkSchema = z.object({
  id: z.string(),
  label: z.string(),
  worldTransform: WorldTransformSchema,
  focusedNodeId: z.string().optional(),
  createdAt: z.number(),
})

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastOpenedAt: z.number(),
  graph: GraphStateSchema,
  bookmarks: z.array(BookmarkSchema),
  worldTransform: WorldTransformSchema,
  settings: UserSettingsSchema,
  mediaManifest: z.record(z.string(), MediaAttachmentSchema),
  schemaVersion: z.number(),
})

export type ProjectParsed = z.infer<typeof ProjectSchema>
