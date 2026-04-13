import { nanoid } from 'nanoid'
import type { MapSnapshotPayload, MapSnapshotRecord } from './snapshotPayload'
import { MapSnapshotPayloadSchema } from './snapshotPayload'
import { getDb } from './db'

export const MAX_SNAPSHOTS_PER_PROJECT = 25

export type { MapSnapshotRecord } from './snapshotPayload'

export function createMapSnapshotRepository() {
  return {
    async create(projectId: string, payload: MapSnapshotPayload, label?: string): Promise<MapSnapshotRecord> {
      const parsed = MapSnapshotPayloadSchema.safeParse(payload)
      if (!parsed.success) throw new Error('Invalid snapshot payload')
      const db = await getDb()
      const id = nanoid()
      const createdAt = Date.now()
      const rec: MapSnapshotRecord = {
        id,
        projectId,
        createdAt,
        label: label?.trim() || undefined,
        payload: parsed.data,
      }
      const tx = db.transaction('mapSnapshots', 'readwrite')
      await tx.store.put(rec)
      await tx.done
      await trimOldSnapshots(projectId)
      return rec
    },

    async listByProject(projectId: string): Promise<MapSnapshotRecord[]> {
      const db = await getDb()
      const tx = db.transaction('mapSnapshots', 'readonly')
      const list = await tx.store.index('byProject').getAll(projectId)
      await tx.done
      list.sort((a, b) => b.createdAt - a.createdAt)
      return list
    },

    async get(id: string): Promise<MapSnapshotRecord | undefined> {
      const db = await getDb()
      return db.get('mapSnapshots', id)
    },

    async delete(id: string): Promise<void> {
      const db = await getDb()
      await db.delete('mapSnapshots', id)
    },

    async deleteAllForProject(projectId: string): Promise<void> {
      const db = await getDb()
      const tx = db.transaction('mapSnapshots', 'readwrite')
      const list = await tx.store.index('byProject').getAll(projectId)
      for (const r of list) {
        await tx.store.delete(r.id)
      }
      await tx.done
    },
  }
}

async function trimOldSnapshots(projectId: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('mapSnapshots', 'readwrite')
  const store = tx.store
  const list = await store.index('byProject').getAll(projectId)
  if (list.length <= MAX_SNAPSHOTS_PER_PROJECT) {
    await tx.done
    return
  }
  list.sort((a, b) => a.createdAt - b.createdAt)
  const remove = list.length - MAX_SNAPSHOTS_PER_PROJECT
  for (let i = 0; i < remove; i++) {
    await store.delete(list[i].id)
  }
  await tx.done
}

export type MapSnapshotRepository = ReturnType<typeof createMapSnapshotRepository>

/** Shared repository instance (IndexedDB-backed). */
export const mapSnapshots = createMapSnapshotRepository()
