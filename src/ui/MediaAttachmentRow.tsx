import { useEffect, useState } from 'react'
import type { MediaAttachment } from '../graph/types'
import { useRootStore } from '../store/rootStore'
import { PdfCanvas } from './PdfCanvas'

export function MediaAttachmentRow({ att }: { att: MediaAttachment }) {
  const media = useRootStore((s) => s.media)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [pdfBuf, setPdfBuf] = useState<ArrayBuffer | null>(null)

  useEffect(() => {
    if (!media) return
    let url: string | null = null
    let cancelled = false
    void (async () => {
      if (att.kind === 'image') {
        const id = att.thumbnailBlobId ?? att.blobId
        const got = await media.get(id)
        if (!got || cancelled) return
        const mime =
          id === att.thumbnailBlobId ? 'image/jpeg' : att.mimeType || got.meta.mime
        url = URL.createObjectURL(new Blob([got.data], { type: mime }))
        setBlobUrl(url)
        setPdfBuf(null)
        return
      }
      const got = await media.get(att.blobId)
      if (!got || cancelled) return
      url = URL.createObjectURL(new Blob([got.data], { type: att.mimeType || got.meta.mime }))
      setBlobUrl(url)
      if (att.kind === 'pdf') setPdfBuf(got.data)
      else setPdfBuf(null)
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [att.id, att.blobId, att.thumbnailBlobId, att.kind, att.mimeType, media])

  return (
    <li style={{ marginBottom: 12, listStyle: 'none' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
        {att.filename} ({att.kind})
      </div>
      {att.kind === 'image' && blobUrl && (
        <img
          src={blobUrl}
          alt=""
          style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, objectFit: 'contain' }}
        />
      )}
      {att.kind === 'pdf' && pdfBuf && <PdfCanvas data={pdfBuf} />}
      {att.kind !== 'image' && att.kind !== 'pdf' && blobUrl && (
        <a href={blobUrl} download={att.filename} style={{ fontSize: 14 }}>
          Open / download
        </a>
      )}
    </li>
  )
}
