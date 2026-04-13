import type { Project } from '../../graph/types'

/** Matches `createNodeDefaults` default title — rename detection for onboarding. */
export const DEFAULT_NEW_NODE_TITLE = 'Idea'

export type OnboardingMilestoneId = 'create' | 'select' | 'linkOrChild' | 'renameOrInspect' | 'complete'

export type OnboardingSurface = 'desktop' | 'xr_controller' | 'xr_hand'

export interface OnboardingInputs {
  project: Project | null
  primaryNodeId: string | null
  detailNodeId: string | null
  seenSelection: boolean
}

function hasAnyNode(project: Project | null): boolean {
  return !!project && Object.keys(project.graph.nodes).length > 0
}

export function hasLinkOrChild(project: Project | null): boolean {
  if (!project) return false
  if (Object.keys(project.graph.edges).length > 0) return true
  return Object.values(project.graph.nodes).some((n) => n.parentId != null)
}

function hasRenamedOrInspected(project: Project | null, detailNodeId: string | null): boolean {
  if (detailNodeId != null) return true
  if (!project) return false
  return Object.values(project.graph.nodes).some((n) => n.title.trim() !== DEFAULT_NEW_NODE_TITLE)
}

/** Ordered milestone for the core success path (pure). */
export function getOnboardingMilestone(input: OnboardingInputs): OnboardingMilestoneId {
  const { project, primaryNodeId, detailNodeId, seenSelection } = input
  if (!hasAnyNode(project)) return 'create'
  const passSelect = seenSelection || primaryNodeId != null
  if (!passSelect) return 'select'
  if (!hasLinkOrChild(project)) return 'linkOrChild'
  if (!hasRenamedOrInspected(project, detailNodeId)) return 'renameOrInspect'
  return 'complete'
}

export interface OnboardingCue {
  milestone: OnboardingMilestoneId
  headline: string
  subline?: string
}

/**
 * Next action-first cue for onboarding. Caller hides UI when milestone is `complete`
 * or when the user has dismissed / finished core flow in metadata.
 */
export function getOnboardingCue(milestone: OnboardingMilestoneId, surface: OnboardingSurface): OnboardingCue | null {
  if (milestone === 'complete') return null

  switch (milestone) {
    case 'create':
      if (surface === 'desktop') {
        return {
          milestone,
          headline: 'Place your first node',
          subline: 'Double-click empty ground.',
        }
      }
      if (surface === 'xr_hand') {
        return {
          milestone,
          headline: 'Place your first node',
          subline: 'Use the radial — Child — or point and confirm where the scene allows.',
        }
      }
      return {
        milestone,
        headline: 'Place your first node',
        subline: 'Aim at the ground plane and use trigger to place when placement is active.',
      }
    case 'select':
      return {
        milestone,
        headline: 'Select a node',
        subline:
          surface === 'desktop'
            ? 'Click a node. Quick actions appear on the left.'
            : surface === 'xr_hand'
              ? 'Pinch or trigger on a node to select.'
              : 'Point at a node and pull the trigger.',
      }
    case 'linkOrChild':
      if (surface === 'xr_hand') {
        return {
          milestone,
          headline: 'Branch the map',
          subline: 'Radial — Child — adds a linked node. Full Link flow uses controllers.',
        }
      }
      return {
        milestone,
        headline: 'Connect the map',
        subline:
          surface === 'desktop'
            ? 'Quick actions: Add child, or Link and finish on another node or the ground.'
            : 'Node radial: Child or Link — then aim and confirm.',
      }
    case 'renameOrInspect':
      return {
        milestone,
        headline: 'Name or open detail',
        subline:
          surface === 'desktop'
            ? 'Quick actions: Rename or Inspect (Enter also opens detail).'
            : 'Radial — Inspect — or rename from flat UI after exit.',
      }
    default:
      return null
  }
}

export function shouldShowOnboarding(dismissed: boolean, coreComplete: boolean): boolean {
  return !dismissed && !coreComplete
}
