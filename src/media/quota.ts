/** Browser storage quota helpers for local-first media. */

export function formatBytes(n: number): string {
  if (n < 1024) return `${Math.round(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  return { usage, quota }
}

/** Returns an error message if adding `extraBytes` would exceed a safe fraction of quota. */
export async function checkSpaceForBytes(extraBytes: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const est = await getStorageEstimate()
  if (!est) return { ok: true }
  const { usage, quota } = est
  if (quota <= 0) return { ok: true }
  const headroom = quota - usage
  const safe = quota * 0.92
  if (usage + extraBytes > safe) {
    return {
      ok: false,
      message: `Not enough storage (${formatBytes(usage)} / ${formatBytes(quota)} used). Free space or remove large attachments.`,
    }
  }
  if (extraBytes > headroom * 0.98) {
    return {
      ok: false,
      message: `This file is too large for remaining storage (~${formatBytes(headroom)} free).`,
    }
  }
  return { ok: true }
}

let storageQuotaWarned = false

/** Logs once per page load when usage exceeds ~90% of quota (autosave path). */
export async function warnIfStorageAlmostFull(): Promise<void> {
  const est = await getStorageEstimate()
  if (!est || est.quota <= 0 || storageQuotaWarned) return
  if (est.usage / est.quota > 0.9) {
    storageQuotaWarned = true
    console.warn(
      `[spatial-mind-canvas] Browser storage is over 90% full (${formatBytes(est.usage)} / ${formatBytes(est.quota)}). Export or delete projects to avoid save failures.`,
    )
  }
}
