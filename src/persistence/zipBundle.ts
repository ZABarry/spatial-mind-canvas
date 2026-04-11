import { unzipSync, zipSync } from 'fflate'
import type { Project } from '../graph/types'
import type { MediaStore } from '../media/types'

const MANIFEST = 'manifest.json'
const PROJECT = 'project.json'

const utf8 = new TextEncoder()

/** UTF-8 bytes for JSON text. Use global Uint8Array so fflate's zipSync treats entries as files (not nested dirs). */
function jsonToUtf8Bytes(json: string): Uint8Array {
  return new Uint8Array(utf8.encode(json))
}

export type ZipManifest = {
  version: 1
  projectFile: string
  /** Maps MediaAttachment.blobId → path inside zip */
  mediaBlobs: Record<string, string>
}

/** Sum of uncompressed entry sizes (for quota checks before import). */
export function estimateZipUncompressedSize(data: Uint8Array): number {
  try {
    const u = unzipSync(data)
    return Object.values(u).reduce((sum, arr) => sum + arr.byteLength, 0)
  } catch {
    return data.byteLength
  }
}

export async function buildProjectZip(project: Project, media: MediaStore): Promise<Uint8Array> {
  const mediaBlobs: Record<string, string> = {}
  const files: Record<string, Uint8Array> = {}
  files[PROJECT] = jsonToUtf8Bytes(JSON.stringify(project, null, 2))

  for (const att of Object.values(project.mediaManifest)) {
    const got = await media.get(att.blobId)
    if (!got) continue
    const path = `media/${att.blobId}.bin`
    mediaBlobs[att.blobId] = path
    files[path] = new Uint8Array(got.data)
  }

  const manifest: ZipManifest = {
    version: 1,
    projectFile: PROJECT,
    mediaBlobs,
  }
  files[MANIFEST] = jsonToUtf8Bytes(JSON.stringify(manifest, null, 2))

  return zipSync(files, { level: 6 })
}

export type ParseZipResult =
  | { ok: true; project: Project }
  | { ok: false; error: string }

export async function parseProjectZip(data: Uint8Array, media: MediaStore): Promise<ParseZipResult> {
  let unzipped: Record<string, Uint8Array>
  try {
    unzipped = unzipSync(data)
  } catch {
    return { ok: false, error: 'Invalid ZIP file' }
  }

  const manRaw = unzipped[MANIFEST]
  const projRaw = unzipped[PROJECT]
  if (!manRaw || !projRaw) {
    return { ok: false, error: 'Missing manifest or project.json in archive' }
  }

  let manifest: ZipManifest
  try {
    manifest = JSON.parse(new TextDecoder().decode(manRaw)) as ZipManifest
  } catch {
    return { ok: false, error: 'Invalid manifest.json' }
  }

  const projText = new TextDecoder().decode(unzipped[manifest.projectFile] ?? projRaw)
  let project: Project
  try {
    project = JSON.parse(projText) as Project
  } catch {
    return { ok: false, error: 'Invalid project JSON' }
  }

  for (const [blobId, zipPath] of Object.entries(manifest.mediaBlobs ?? {})) {
    const chunk = unzipped[zipPath]
    if (!chunk) continue
    const copy = new ArrayBuffer(chunk.byteLength)
    new Uint8Array(copy).set(chunk)
    await media.put(blobId, copy, { mime: 'application/octet-stream', name: zipPath })
  }

  return { ok: true, project }
}
