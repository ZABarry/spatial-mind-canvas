import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MapSnapshotRecord } from './snapshotPayload'

const DB_NAME = 'spatial-mind-canvas'
const DB_VERSION = 2

export interface SpatialMindDB extends DBSchema {
  projects: {
    key: string
    value: string
  }
  media: {
    key: string
    value: { meta: { mime: string; name: string }; data: ArrayBuffer }
  }
  meta: {
    key: string
    value: unknown
  }
  /** Local version history per project; excluded from JSON/ZIP export. */
  mapSnapshots: {
    key: string
    value: MapSnapshotRecord
    indexes: { byProject: string }
  }
}

let dbPromise: Promise<IDBPDatabase<SpatialMindDB>> | null = null

export function getDb(): Promise<IDBPDatabase<SpatialMindDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SpatialMindDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects')
        }
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media')
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains('mapSnapshots')) {
          const snap = db.createObjectStore('mapSnapshots', { keyPath: 'id' })
          snap.createIndex('byProject', 'projectId')
        }
      },
    })
  }
  return dbPromise
}

export const META_LAST_PROJECT = 'lastProjectId'
export const META_DEVICE_PREFS = 'devicePreferences'

/** User hid the onboarding strip (persistent). */
export const META_ONBOARDING_DISMISSED = 'onboardingDismissed'
/** Core guided path finished (persistent). */
export const META_ONBOARDING_CORE_COMPLETE = 'onboardingCoreComplete'
/** User reached “select a node” once (persistent). */
export const META_ONBOARDING_SEEN_SELECTION = 'onboardingSeenSelection'
/** Guided path: user used Recenter at least once while onboarding (persistent). */
export const META_ONBOARDING_DID_RECENTER = 'onboardingDidRecenter'
/** Guided path: user used Undo at least once while onboarding (persistent). */
export const META_ONBOARDING_DID_UNDO = 'onboardingDidUndo'

/** @deprecated Legacy key — still read in bootstrap for migration. */
export const META_ONBOARDING_LEGACY_DONE = 'onboardingDone'

export async function getMeta(key: string): Promise<unknown> {
  const db = await getDb()
  return db.get('meta', key)
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('meta', value, key)
}
