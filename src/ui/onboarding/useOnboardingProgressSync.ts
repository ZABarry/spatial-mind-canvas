import { useEffect } from 'react'
import { getOnboardingMilestone, shouldShowOnboarding } from './onboardingModel'
import {
  META_ONBOARDING_CORE_COMPLETE,
  META_ONBOARDING_SEEN_SELECTION,
  setMeta,
} from '../../persistence/db'
import { useRootStore } from '../../store/rootStore'

/**
 * Persists onboarding milestones (IndexedDB) for both desktop and XR — DOM banner is hidden in VR.
 */
export function useOnboardingProgressSync() {
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

  useEffect(() => {
    if (!active || primary == null || seenSelection) return
    void setMeta(META_ONBOARDING_SEEN_SELECTION, true)
    useRootStore.setState({ onboardingSeenSelection: true })
  }, [active, primary, seenSelection])

  useEffect(() => {
    if (!active || milestone !== 'complete') return
    void setMeta(META_ONBOARDING_CORE_COMPLETE, true)
    useRootStore.setState({ onboardingCoreComplete: true })
  }, [active, milestone])
}
