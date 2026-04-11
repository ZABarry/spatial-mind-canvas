import { getDb } from '../persistence/db'
import type { MediaStore } from './types'

export function createLocalMediaStore(): MediaStore {
  return {
    async put(blobId, data, meta) {
      const db = await getDb()
      await db.put('media', { meta: { mime: meta.mime, name: meta.name }, data }, blobId)
    },
    async get(blobId) {
      const db = await getDb()
      const v = await db.get('media', blobId)
      if (!v) return undefined
      return { data: v.data, meta: { mime: v.meta.mime, name: v.meta.name } }
    },
    async delete(blobId) {
      const db = await getDb()
      await db.delete('media', blobId)
    },
  }
}
