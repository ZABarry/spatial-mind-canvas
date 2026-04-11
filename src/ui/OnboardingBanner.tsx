import { useRootStore } from '../store/rootStore'
import { setMeta } from '../persistence/db'

const steps = [
  'Double-click the ground to place a node. Press N for a node at the origin.',
  'Shift-drag from a node to connect; release on another node or empty space.',
  'Drag nodes to rearrange. Use the toolbar for VR, travel mode, search, and undo.',
  'Library keeps all maps local. Clear map removes only the current canvas.',
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
