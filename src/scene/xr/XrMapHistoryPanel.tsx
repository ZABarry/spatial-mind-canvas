import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { MapHistoryPanelBody } from '../../ui/panels/MapHistoryPanelBody'
import { useRootStore } from '../../store/rootStore'
import { XrHeadAnchoredGroup } from './XrHeadAnchoredGroup'

export function XrMapHistoryPanel() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.mapHistoryOpen)

  if (!session || !open) return null

  return (
    <XrHeadAnchoredGroup lane="center">
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <MapHistoryPanelBody variant="xr" onRequestClose={() => useRootStore.getState().setMapHistoryOpen(false)} />
      </Html>
    </XrHeadAnchoredGroup>
  )
}
