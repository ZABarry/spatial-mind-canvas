import { useEffect } from 'react'

/**
 * Desktop adapter: mesh handlers and `useDesktopShortcuts` dispatch `AppAction`s.
 * Ghost edge preview lives in `LinkPreview`; extend this hook when centralizing pointer routing.
 */
export function useDesktopInputBridge() {
  useEffect(() => undefined, [])
}
