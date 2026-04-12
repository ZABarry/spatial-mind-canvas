import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { SearchPanelBody } from '../../ui/panels/SearchPanelBody'

export function XrSearchPanel() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.searchOpen)

  if (!session || !open) return null

  return (
    <group position={[0, 1.38, -0.62]}>
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <SearchPanelBody variant="xr" />
      </Html>
    </group>
  )
}
