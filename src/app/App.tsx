import { useEffect } from 'react'
import { useRootStore } from '../store/rootStore'
import { useDesktopShortcuts } from '../hooks/useDesktopShortcuts'
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

export function App() {
  const ready = useRootStore((s) => s.ready)
  const view = useRootStore((s) => s.view)
  const bootstrap = useRootStore((s) => s.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useDesktopShortcuts()

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
            <SearchPalette />
            <NodeInspector />
            <OnboardingBanner />
            <SettingsPanel />
            <HelpControls />
          </div>
        </>
      )}
    </div>
  )
}
