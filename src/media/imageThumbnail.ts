/** Downscale image data to a small JPEG for inspector lists (Quest-friendly). */

export async function buildImageThumbnailJpeg(data: ArrayBuffer, mime: string): Promise<ArrayBuffer | null> {
  if (typeof createImageBitmap === 'undefined') return null
  try {
    const blob = new Blob([data], { type: mime || 'image/jpeg' })
    const bmp = await createImageBitmap(blob)
    const max = 256
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0, w, h)
    return await new Promise<ArrayBuffer | null>((resolve) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            resolve(null)
            return
          }
          void b.arrayBuffer().then(resolve)
        },
        'image/jpeg',
        0.82,
      )
    })
  } catch {
    return null
  }
}
