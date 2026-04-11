export interface MediaStore {
  put(blobId: string, data: ArrayBuffer, meta: { mime: string; name: string }): Promise<void>
  get(blobId: string): Promise<{ data: ArrayBuffer; meta: { mime: string; name: string } } | undefined>
  delete(blobId: string): Promise<void>
}
