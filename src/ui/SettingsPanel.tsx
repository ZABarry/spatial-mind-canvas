import { useRootStore } from '../store/rootStore'
import { SettingsFormBody } from './panels/SettingsFormBody'

export function SettingsPanel() {
  const open = useRootStore((s) => s.settingsOpen)
  const project = useRootStore((s) => s.project)

  if (!open || !project) return null

  return (
    <div className="modal-backdrop" onClick={() => useRootStore.setState({ settingsOpen: false })}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <SettingsFormBody variant="desktop" />
      </div>
    </div>
  )
}
