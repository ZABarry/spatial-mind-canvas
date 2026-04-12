import { useEffect } from 'react'
import { useRootStore } from '../store/rootStore'
import { useDesktopShortcuts } from '../hooks/useDesktopShortcuts'
import { useDesktopInputBridge } from '../input/adapters/useDesktopInputBridge'
import { SceneCanvas } from '../scene/SceneCanvas'
import { ProjectHome } from '../ui/ProjectHome'
import { MainToolbar } from '../ui/MainToolbar'
import { SearchPalette } from '../ui/SearchPalette'
import { NodeInspector } from '../ui/NodeInspector'
import { OnboardingBanner } from '../ui/OnboardingBanner'
import { SettingsPanel } from '../ui/SettingsPanel'
import { ConfirmModal } from '../ui/ConfirmModal'
import { AudioAmbience } from '../ui/AudioAmbience'
import { HelpControls } from '../ui/HelpControls'
import { NodeQuickActions } from '../ui/NodeQuickActions'

export function App() {
  const ready = useRootStore((s) => s.ready)
  const view = useRootStore((s) => s.view)
  const bootstrap = useRootStore((s) => s.bootstrap)
  const xrSession = useRootStore((s) => s.xrSessionActive)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useDesktopShortcuts()
  useDesktopInputBridge()

  if (!ready) {
    return (
      <div className="app-root" style={{ padding: 24 }}>
        Preparing your canvas…
      </div>
    )
  }

  return (
    <div className="app-root">
      <ConfirmModal />
      {view === 'home' ? (
        <ProjectHome />
      ) : (
        <>
          <AudioAmbience />
          <div className="scene-wrap">
            <SceneCanvas />
            <MainToolbar />
            {!xrSession && (
              <>
                <SearchPalette />
                <NodeQuickActions />
                <NodeInspector />
                <OnboardingBanner />
                <SettingsPanel />
                <HelpControls />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
