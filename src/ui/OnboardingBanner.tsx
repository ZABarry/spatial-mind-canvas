import { useEffect } from 'react'
import {
  getOnboardingCue,
  getOnboardingMilestone,
  isOnboardingStepDone,
  ONBOARDING_STEP_LABELS,
  shouldShowOnboarding,
} from './onboarding/onboardingModel'
import { META_ONBOARDING_DISMISSED, setMeta } from '../persistence/db'
import { useRootStore } from '../store/rootStore'

export function OnboardingBanner() {
  const dismissed = useRootStore((s) => s.onboardingDismissed)
  const coreComplete = useRootStore((s) => s.onboardingCoreComplete)
  const seenSelection = useRootStore((s) => s.onboardingSeenSelection)
  const didRecenter = useRootStore((s) => s.onboardingDidRecenter)
  const didUndo = useRootStore((s) => s.onboardingDidUndo)
  const celebration = useRootStore((s) => s.onboardingCelebration)
  const project = useRootStore((s) => s.project)
  const primary = useRootStore((s) => s.selection.primaryNodeId)
  const detailNodeId = useRootStore((s) => s.detailNodeId)

  const active = shouldShowOnboarding(dismissed, coreComplete)
  const input = {
    project,
    primaryNodeId: primary ?? null,
    detailNodeId,
    seenSelection,
    didRecenter,
    didUndo,
  }
  const milestone = getOnboardingMilestone(input)
  const cue = active ? getOnboardingCue(milestone, 'desktop') : null

  useEffect(() => {
    if (!celebration) return
    const t = window.setTimeout(() => {
      useRootStore.setState({ onboardingCelebration: false })
    }, 10000)
    return () => window.clearTimeout(t)
  }, [celebration])

  if (celebration && !dismissed) {
    return (
      <div className="onboarding panel" style={{ borderColor: '#5eb8a8' }}>
        <strong style={{ display: 'block', marginBottom: 6, color: '#0f766e' }}>You’re set</strong>
        <p style={{ margin: 0, lineHeight: 1.45, fontSize: 14 }}>
          You’ve walked the core loop: ideas, links, focus, and recovery. Explore freely — Help and docs have the full
          reference.
        </p>
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => useRootStore.setState({ onboardingCelebration: false })}>
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!active || !cue || milestone === 'complete') return null

  return (
    <div className="onboarding panel">
      <strong style={{ display: 'block', marginBottom: 6 }}>Guided start</strong>
      <ol
        style={{
          margin: '0 0 10px',
          paddingLeft: 18,
          fontSize: 11,
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        {ONBOARDING_STEP_LABELS.map((step) => (
          <li
            key={step.id}
            style={{
              textDecoration: isOnboardingStepDone(step.id, input) ? 'line-through' : undefined,
              color: isOnboardingStepDone(step.id, input) ? '#94a3b8' : '#475569',
            }}
          >
            {step.label}
          </li>
        ))}
      </ol>
      <p style={{ margin: '0 0 6px', lineHeight: 1.45, fontWeight: 600 }}>{cue.headline}</p>
      {cue.subline ? (
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{cue.subline}</p>
      ) : null}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            void setMeta(META_ONBOARDING_DISMISSED, true)
            useRootStore.setState({ onboardingDismissed: true, onboardingCelebration: false })
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
