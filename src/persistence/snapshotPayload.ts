import { z } from 'zod'
import { defaultUserSettings } from '../graph/defaults'
import type { Project, UserSettings } from '../graph/types'
import {
  BookmarkSchema,
  GraphStateSchema,
  MediaAttachmentSchema,
  WorldTransformSchema,
} from './schemas'

/** Map-facing settings stored in a snapshot (no device/locomotion replacement on restore). */
export const MapSnapshotSettingsSchema = z.object({
  focusHopDepth: z.number(),
  labelBudget: z.number().optional(),
  showAllLabels: z.boolean().optional(),
  worldAxisControls: z.boolean().optional(),
  floorGrid: z.boolean().optional(),
  preferXrPassthrough: z.boolean().optional(),
  worldBackgroundHorizon: z.string().optional(),
  worldBackgroundZenith: z.string().optional(),
  worldBackgroundExponent: z.number().optional(),
  particlesCount: z.number().optional(),
  particlesSize: z.number().optional(),
  particlesColor: z.string().optional(),
  particlesOpacity: z.number().optional(),
  particlesSpeed: z.number().optional(),
})

export const MapSnapshotPayloadSchema = z.object({
  graph: GraphStateSchema,
  bookmarks: z.array(BookmarkSchema),
  worldTransform: WorldTransformSchema,
  mediaManifest: z.record(z.string(), MediaAttachmentSchema),
  mapSettings: MapSnapshotSettingsSchema,
})

export type MapSnapshotPayload = z.infer<typeof MapSnapshotPayloadSchema>

export interface MapSnapshotRecord {
  id: string
  projectId: string
  createdAt: number
  label?: string
  payload: MapSnapshotPayload
}

export function buildMapSnapshotPayload(project: Project): MapSnapshotPayload {
  const s = project.settings
  const d = defaultUserSettings()
  return MapSnapshotPayloadSchema.parse({
    graph: structuredClone(project.graph),
    bookmarks: structuredClone(project.bookmarks),
    worldTransform: structuredClone(project.worldTransform),
    mediaManifest: structuredClone(project.mediaManifest),
    mapSettings: {
      focusHopDepth: s.focusHopDepth,
      labelBudget: s.labelBudget,
      showAllLabels: s.showAllLabels,
      worldAxisControls: s.worldAxisControls,
      floorGrid: s.floorGrid,
      preferXrPassthrough: s.preferXrPassthrough,
      worldBackgroundHorizon: s.worldBackgroundHorizon ?? d.worldBackgroundHorizon,
      worldBackgroundZenith: s.worldBackgroundZenith ?? d.worldBackgroundZenith,
      worldBackgroundExponent: s.worldBackgroundExponent ?? d.worldBackgroundExponent,
      particlesCount: s.particlesCount ?? d.particlesCount,
      particlesSize: s.particlesSize ?? d.particlesSize,
      particlesColor: s.particlesColor ?? d.particlesColor,
      particlesOpacity: s.particlesOpacity ?? d.particlesOpacity,
      particlesSpeed: s.particlesSpeed ?? d.particlesSpeed,
    },
  })
}

/** Restores graph, bookmarks, world, media manifest, and map settings; keeps project id, name, createdAt, lastOpenedAt. */
export function applyMapSnapshotPayload(project: Project, payload: MapSnapshotPayload): Project {
  const ms = payload.mapSettings
  const d = defaultUserSettings()
  const settings: UserSettings = {
    ...project.settings,
    focusHopDepth: ms.focusHopDepth,
    labelBudget: ms.labelBudget,
    showAllLabels: ms.showAllLabels,
    worldAxisControls: ms.worldAxisControls,
    floorGrid: ms.floorGrid,
    preferXrPassthrough: ms.preferXrPassthrough,
    worldBackgroundHorizon: ms.worldBackgroundHorizon ?? d.worldBackgroundHorizon,
    worldBackgroundZenith: ms.worldBackgroundZenith ?? d.worldBackgroundZenith,
    worldBackgroundExponent: ms.worldBackgroundExponent ?? d.worldBackgroundExponent,
    particlesCount: ms.particlesCount ?? d.particlesCount,
    particlesSize: ms.particlesSize ?? d.particlesSize,
    particlesColor: ms.particlesColor ?? d.particlesColor,
    particlesOpacity: ms.particlesOpacity ?? d.particlesOpacity,
    particlesSpeed: ms.particlesSpeed ?? d.particlesSpeed,
  }
  return {
    ...project,
    graph: structuredClone(payload.graph),
    bookmarks: structuredClone(payload.bookmarks),
    worldTransform: structuredClone(payload.worldTransform),
    mediaManifest: structuredClone(payload.mediaManifest),
    settings,
    updatedAt: Date.now(),
  }
}
