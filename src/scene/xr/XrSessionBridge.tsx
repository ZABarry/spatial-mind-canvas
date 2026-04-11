import { useEffect } from 'react'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

/** Syncs immersive XR session presence to the store so HTML modals can defer to world-space UI. */
export function XrSessionBridge() {
  const session = useXR((s) => s.session)
  useEffect(() => {
    useRootStore.setState({ xrSessionActive: !!session })
  }, [session])
  return null
}
