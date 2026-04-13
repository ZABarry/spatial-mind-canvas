import { useOnboardingProgressSync } from './useOnboardingProgressSync'

/** Mount with the scene so onboarding milestones persist in VR (banner is desktop-only). */
export function OnboardingProgressRoot() {
  useOnboardingProgressSync()
  return null
}
