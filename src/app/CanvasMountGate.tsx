import { useEffect, useState, type ReactNode } from 'react'

/**
 * React Strict Mode (dev) mounts, unmounts, then remounts children. A first-mount R3F canvas
 * creates a WebGL context that is destroyed on unmount, which tears down WebXR. Defer mounting
 * until after the initial effect so the canvas survives Strict Mode.
 */
export function CanvasMountGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    queueMicrotask(() => setReady(true))
  }, [])
  if (!ready) return null
  return <>{children}</>
}
