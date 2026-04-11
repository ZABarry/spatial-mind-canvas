import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let workerConfigured = false

export function PdfCanvas({ data }: { data: ArrayBuffer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!workerConfigured) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      workerConfigured = true
    }
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    void (async () => {
      try {
        const task = pdfjs.getDocument({ data: new Uint8Array(data) }).promise
        const pdf = await task
        const page = await pdf.getPage(1)
        const scale = 1.2
        const viewport = page.getViewport({ scale })
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        const renderTask = page.render({ canvasContext: ctx, viewport, canvas })
        await renderTask.promise
        if (cancelled) return
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'PDF error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [data])

  if (err) return <p style={{ color: '#b91c1c', fontSize: 13 }}>{err}</p>
  return <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: 8, background: '#f8fafc' }} />
}
