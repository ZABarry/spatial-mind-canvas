import {
  getOnboardingCue,
  getOnboardingMilestone,
  shouldShowOnboarding,
} from './onboarding/onboardingModel'
import { META_ONBOARDING_DISMISSED, setMeta } from '../persistence/db'
import { useRootStore } from '../store/rootStore'

export function OnboardingBanner() {
  const dismissed = useRootStore((s) => s.onboardingDismissed)
  const coreComplete = useRootStore((s) => s.onboardingCoreComplete)
  const seenSelection = useRootStore((s) => s.onboardingSeenSelection)
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const detailNodeId = useRootStore((s) => s.detailNodeId)

  const active = shouldShowOnboarding(dismissed, coreComplete)
  const milestone = getOnboardingMilestone({
    project,
    primaryNodeId: primary ?? null,
    detailNodeId,
    seenSelection,
  })
  const cue = active ? getOnboardingCue(milestone, 'desktop') : null

  if (!active || !cue || milestone === 'complete') return null

  return (
    <div className="onboarding panel">
      <strong style={{ display: 'block', marginBottom: 6 }}>Start here</strong>
      <p style={{ margin: '0 0 6px', lineHeight: 1.45 }}>{cue.headline}</p>
      {cue.subline ? (
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{cue.subline}</p>
      ) : null}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            void setMeta(META_ONBOARDING_DISMISSED, true)
            useRootStore.setState({ onboardingDismissed: true })
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
