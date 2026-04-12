import { useEffect } from 'react'

/**
 * Desktop adapter: normalized pointer/keyboard intents will route through the session machine here.
 * Today, mesh handlers and `useDesktopShortcuts` dispatch `AppAction`s; this hook is the extension point.
 */
export function useDesktopInputBridge() {
  useEffect(() => {
    return undefined
  }, [])
}
