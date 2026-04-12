import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

const DB_NAME = 'spatial-mind-canvas'
const DB_VERSION = 1

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
}

let dbPromise: Promise<IDBPDatabase<SpatialMindDB>> | null = null

export function getDb(): Promise<IDBPDatabase<SpatialMindDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SpatialMindDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects')
        }
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media')
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
      },
    })
  }
  return dbPromise
}

export const META_LAST_PROJECT = 'lastProjectId'
export const META_ONBOARDING = 'onboardingDone'
export const META_DEVICE_PREFS = 'devicePreferences'

export async function getMeta(key: string): Promise<unknown> {
  const db = await getDb()
  return db.get('meta', key)
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('meta', value, key)
}
