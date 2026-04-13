import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { SettingsFormBody } from '../../ui/panels/SettingsFormBody'

export function XrSettingsPanel() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.settingsOpen)
  const project = useRootStore((s) => s.project)

  if (!session || !open || !project) return null

  return (
    <group position={[0.44, 1.38, -0.62]}>
      <Html transform occlude={false} style={{ pointerEvents: 'auto' }}>
        <div
          className="settings-form-xr"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-dialog-title"
        >
          <SettingsFormBody variant="xr" />
        </div>
      </Html>
    </group>
  )
}
