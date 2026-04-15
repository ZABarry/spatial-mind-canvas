import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { MapHistoryPanelBody } from '../../ui/panels/MapHistoryPanelBody'
import { useRootStore } from '../../store/rootStore'

export function XrMapHistoryPanel() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.mapHistoryOpen)

  if (!session || !open) return null

  return (
    <group position={[0, 1.38, -0.62]}>
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <MapHistoryPanelBody variant="xr" onRequestClose={() => useRootStore.getState().setMapHistoryOpen(false)} />
      </Html>
    </group>
  )
}
