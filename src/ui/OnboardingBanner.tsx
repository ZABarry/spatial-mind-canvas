import { useRootStore } from '../store/rootStore'
import { setMeta } from '../persistence/db'

const steps = [
  'Double-click the ground to place a node, or press N for a node near the origin.',
  'Shift-drag from a node to connect; release on another node or on empty ground for a new linked node.',
  'Drag nodes to move. Press Enter to open the inspector; add notes and files there.',
  'Toolbar: Enter VR when on HTTPS. Toggle World mode (move the graph) vs Travel mode (walk the space). Alt+arrows nudges the world on desktop.',
  'Search with Ctrl+K or /; Focus (F) dims unrelated nodes; Home or . centers the orbit on your selection. Undo/redo: Ctrl/Cmd+Z or the toolbar.',
  'Ctrl+Shift+N creates a new blank map. Clear map clears only this canvas (confirmed). Library lists all local projects.',
]

export function OnboardingBanner() {
  const done = useRootStore((s) => s.onboardingDismissed)
  const step = useRootStore((s) => s.onboardingStep)

  if (done) return null

  return (
    <div className="onboarding panel">
      <strong style={{ display: 'block', marginBottom: 6 }}>Welcome</strong>
      {steps[step]}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            useRootStore.setState({
              onboardingStep: Math.min(step + 1, steps.length - 1),
            })
          }
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => {
            void setMeta('onboardingDismissed', true)
            useRootStore.setState({ onboardingDismissed: true })
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
