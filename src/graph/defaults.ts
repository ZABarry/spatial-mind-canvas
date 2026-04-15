import { nanoid } from 'nanoid'
import type { DevicePreferences, GraphState, Project, UserSettings, WorldTransform } from './types'
import { APP_SCHEMA_VERSION } from './types'
import { qIdentity, v3 } from '../utils/math'

/** Defaults for `UserSettings` flat-view sky; kept in sync with `SkyGradient`. */
export const DEFAULT_WORLD_BACKGROUND_HORIZON = '#ffffff'
export const DEFAULT_WORLD_BACKGROUND_ZENITH = '#b8cfe8'
export const DEFAULT_WORLD_BACKGROUND_EXPONENT = 0.42

/** Defaults for `CalmParticles` — keep in sync with shader tuning. */
export const DEFAULT_PARTICLES_COUNT = 560
export const DEFAULT_PARTICLES_SIZE = 1.8
/** Match zenith by default so particles read as part of the sky. */
export const DEFAULT_PARTICLES_COLOR = DEFAULT_WORLD_BACKGROUND_ZENITH
export const DEFAULT_PARTICLES_OPACITY = 0.72
export const DEFAULT_PARTICLES_SPEED = 0.6

export function defaultDevicePreferences(): DevicePreferences {
  return {
    locomotionSmooth: false,
    snapTurnDegrees: 45,
    comfortVignette: false,
    audioEnabled: true,
    ambientVolume: 1,
    ambientPitch: 1,
    dominantHand: 'right',
    smoothTurnSpeed: 1.2,
    moveSpeed: 2,
    preferXrPassthrough: false,
    xrDisableHandWorldGrab: false,
  }
}

export function defaultUserSettings(): UserSettings {
  return {
    ...defaultDevicePreferences(),
    worldAxisControls: true,
    floorGrid: true,
    focusHopDepth: 1,
    worldBackgroundHorizon: DEFAULT_WORLD_BACKGROUND_HORIZON,
    worldBackgroundZenith: DEFAULT_WORLD_BACKGROUND_ZENITH,
    worldBackgroundExponent: DEFAULT_WORLD_BACKGROUND_EXPONENT,
    particlesCount: DEFAULT_PARTICLES_COUNT,
    particlesSize: DEFAULT_PARTICLES_SIZE,
    particlesColor: DEFAULT_PARTICLES_COLOR,
    particlesOpacity: DEFAULT_PARTICLES_OPACITY,
    particlesSpeed: DEFAULT_PARTICLES_SPEED,
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
