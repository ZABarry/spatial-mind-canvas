import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { SearchPanelBody } from '../../ui/panels/SearchPanelBody'
import { XrHeadAnchoredGroup } from './XrHeadAnchoredGroup'

export function XrSearchPanel() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.searchOpen)

  if (!session || !open) return null

  return (
    <XrHeadAnchoredGroup lane="center">
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <SearchPanelBody variant="xr" />
      </Html>
    </XrHeadAnchoredGroup>
  )
}
