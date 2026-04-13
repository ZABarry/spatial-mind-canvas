import { useEffect, useRef, useState } from 'react'
import type { MediaAttachment } from '../graph/types'
import { useRootStore } from '../store/rootStore'
import { PdfCanvas } from './PdfCanvas'

export function MediaAttachmentRow({ att }: { att: MediaAttachment }) {
  const media = useRootStore((s) => s.media)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  /** Full-resolution blob URL for images (preview may use thumbnail). */
  const [fullBlobUrl, setFullBlobUrl] = useState<string | null>(null)
  const [pdfBuf, setPdfBuf] = useState<ArrayBuffer | null>(null)
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    if (!media) return
    objectUrlsRef.current = []
    const track = (u: string) => {
      objectUrlsRef.current.push(u)
      return u
    }
    let cancelled = false
    void (async () => {
      if (att.kind === 'image') {
        const previewId = att.thumbnailBlobId ?? att.blobId
        const previewGot = await media.get(previewId)
        if (!previewGot || cancelled) return
        const previewMime =
          previewId === att.thumbnailBlobId ? 'image/jpeg' : att.mimeType || previewGot.meta.mime
        const previewUrl = track(URL.createObjectURL(new Blob([previewGot.data], { type: previewMime })))
        if (cancelled) return
        setBlobUrl(previewUrl)

        if (previewId === att.blobId) {
          setFullBlobUrl(previewUrl)
          setPdfBuf(null)
          return
        }
        const fullGot = await media.get(att.blobId)
        if (!fullGot || cancelled) return
        const fullUrl = track(
          URL.createObjectURL(new Blob([fullGot.data], { type: att.mimeType || fullGot.meta.mime })),
        )
        if (cancelled) return
        setFullBlobUrl(fullUrl)
        setPdfBuf(null)
        return
      }
      setFullBlobUrl(null)
      const got = await media.get(att.blobId)
      if (!got || cancelled) return
      const url = track(URL.createObjectURL(new Blob([got.data], { type: att.mimeType || got.meta.mime })))
      setBlobUrl(url)
      if (att.kind === 'pdf') setPdfBuf(got.data)
      else setPdfBuf(null)
    })()
    return () => {
      cancelled = true
      for (const u of objectUrlsRef.current) URL.revokeObjectURL(u)
      objectUrlsRef.current = []
      setBlobUrl(null)
      setFullBlobUrl(null)
    }
  }, [att.id, att.blobId, att.thumbnailBlobId, att.kind, att.mimeType, media])

  return (
    <li style={{ marginBottom: 12, listStyle: 'none' }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
        {att.filename} ({att.kind})
      </div>
      {att.kind === 'image' && blobUrl && (
        <>
          <img
            src={blobUrl}
            alt=""
            style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, objectFit: 'contain' }}
          />
          {fullBlobUrl && (
            <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
              <a href={fullBlobUrl} target="_blank" rel="noopener noreferrer">
                View full size
              </a>
              <a href={fullBlobUrl} download={att.filename}>
                Download
              </a>
            </div>
          )}
        </>
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
