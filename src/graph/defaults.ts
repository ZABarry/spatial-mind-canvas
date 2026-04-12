import { nanoid } from 'nanoid'
import type { GraphState, Project, UserSettings, WorldTransform } from './types'
import { APP_SCHEMA_VERSION } from './types'
import { qIdentity, v3 } from '../utils/math'

export function defaultUserSettings(): UserSettings {
  return {
    worldAxisControls: false,
    floorGrid: true,
    locomotionSmooth: false,
    snapTurnDegrees: 45,
    comfortVignette: false,
    audioEnabled: true,
    dominantHand: 'right',
    smoothTurnSpeed: 1.2,
    moveSpeed: 2,
    focusHopDepth: 1,
    preferXrPassthrough: false,
  }
}

export function defaultWorldTransform(): WorldTransform {
  return {
    position: v3(0, 0, 0),
    quaternion: qIdentity(),
    scale: 1,
  }
}

export function emptyGraph(): GraphState {
  return { nodes: {}, edges: {} }
}

export function createBlankProject(name = 'Untitled map'): Project {
  const now = Date.now()
  return {
    id: nanoid(),
    name,
    description: '',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    graph: emptyGraph(),
    bookmarks: [],
    worldTransform: defaultWorldTransform(),
    settings: defaultUserSettings(),
    mediaManifest: {},
    schemaVersion: APP_SCHEMA_VERSION,
  }
}
