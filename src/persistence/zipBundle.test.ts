import { describe, it, expect } from 'vitest'
import { buildProjectZip, parseProjectZip } from './zipBundle'
import type { MediaStore } from '../media/types'
import { createBlankProject } from '../graph/defaults'
import type { MediaAttachment } from '../graph/types'

class MemoryMedia implements MediaStore {
  private store = new Map<string, { data: ArrayBuffer; meta: { mime: string; name: string } }>()
  async put(blobId: string, data: ArrayBuffer, meta: { mime: string; name: string }) {
    this.store.set(blobId, { data, meta })
  }
  async get(blobId: string) {
    return this.store.get(blobId)
  }
  async delete(blobId: string) {
    this.store.delete(blobId)
  }
}

describe('zipBundle', () => {
  it('round-trips project JSON and media blobs', async () => {
    const mediaA = new MemoryMedia()
    const blobId = 'blob-test-1'
    const payload = new TextEncoder().encode('hello-zip').buffer
    await mediaA.put(blobId, payload, { mime: 'text/plain', name: 'hello.txt' })

    const att: MediaAttachment = {
      id: 'att1',
      kind: 'text',
      filename: 'hello.txt',
      mimeType: 'text/plain',
      byteSize: payload.byteLength,
      blobId,
      createdAt: 1,
    }

    const p = createBlankProject('Zip test')
    p.mediaManifest = { [att.id]: att }

    const zipBytes = await buildProjectZip(p, mediaA)
    expect(zipBytes.byteLength).toBeGreaterThan(20)

    const mediaB = new MemoryMedia()
    const parsed = await parseProjectZip(zipBytes, mediaB)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.project.name).toBe('Zip test')
    expect(parsed.project.mediaManifest[att.id]?.blobId).toBe(blobId)

    const got = await mediaB.get(blobId)
    expect(got).toBeDefined()
    expect(new TextDecoder().decode(new Uint8Array(got!.data))).toBe('hello-zip')
  })

  it('rejects invalid zip bytes', async () => {
    const m = new MemoryMedia()
    const r = await parseProjectZip(new Uint8Array([1, 2, 3]), m)
    expect(r.ok).toBe(false)
  })
})
