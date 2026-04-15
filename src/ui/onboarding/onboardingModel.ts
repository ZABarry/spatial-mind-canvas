import type { Project } from '../../graph/types'
import { COPY_CONTROLLERS_FOR_LINK, COPY_HAND_TRACKING_LITE } from '../../scene/xr/productCopy'

/** Matches `createNodeDefaults` default title — rename detection for onboarding. */
export const DEFAULT_NEW_NODE_TITLE = 'Idea'

export type OnboardingMilestoneId =
  | 'create'
  | 'select'
  | 'linkOrChild'
  | 'renameOrInspect'
  | 'recenter'
  | 'undo'
  | 'complete'

export type OnboardingSurface = 'desktop' | 'xr_controller' | 'xr_hand'

export interface OnboardingInputs {
  project: Project | null
  primaryNodeId: string | null
  detailNodeId: string | null
  seenSelection: boolean
  didRecenter: boolean
  didUndo: boolean
}

/** Ordered labels for checklist UI (same order as milestone resolution). */
export const ONBOARDING_STEP_LABELS: { id: OnboardingMilestoneId; label: string }[] = [
  { id: 'create', label: 'Place a node' },
  { id: 'select', label: 'Select it' },
  { id: 'linkOrChild', label: 'Add a child or link' },
  { id: 'renameOrInspect', label: 'Rename or open detail' },
  { id: 'recenter', label: 'Recenter on your idea' },
  { id: 'undo', label: 'Try undo' },
]

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

/** Ordered milestone for the guided success path (pure). */
export function getOnboardingMilestone(input: OnboardingInputs): OnboardingMilestoneId {
  const { project, primaryNodeId, detailNodeId, seenSelection, didRecenter, didUndo } = input
  if (!hasAnyNode(project)) return 'create'
  const passSelect = seenSelection || primaryNodeId != null
  if (!passSelect) return 'select'
  if (!hasLinkOrChild(project)) return 'linkOrChild'
  if (!hasRenamedOrInspected(project, detailNodeId)) return 'renameOrInspect'
  if (!didRecenter) return 'recenter'
  if (!didUndo) return 'undo'
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
          subline: 'Node actions — Child — or use placement when the scene allows.',
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
          subline: COPY_CONTROLLERS_FOR_LINK,
        }
      }
      return {
        milestone,
        headline: 'Connect the map',
        subline:
          surface === 'desktop'
            ? 'Quick actions: Add child, or Link and finish on another node or the ground.'
            : 'Node actions: Child or Link — then aim and confirm.',
      }
    case 'renameOrInspect':
      return {
        milestone,
        headline: 'Name or open detail',
        subline:
          surface === 'desktop'
            ? 'Quick actions: Rename or Inspect (Enter also opens detail).'
            : 'Node actions — Inspect — or rename after exiting VR if needed.',
      }
    case 'recenter':
      return {
        milestone,
        headline: 'Recenter your view',
        subline:
          surface === 'desktop'
            ? 'Press Home or . — brings the primary node to your orbit focus (not Reset view).'
            : 'Wrist menu — Recenter — aligns the selected node (different from Reset view).',
      }
    case 'undo':
      return {
        milestone,
        headline: 'Undo a change',
        subline:
          surface === 'desktop'
            ? '⌘Z / Ctrl+Z — rolls back one editing step.'
            : 'Wrist menu — Undo — or use the same recovery as desktop.',
      }
    default:
      return null
  }
}

export function shouldShowOnboarding(dismissed: boolean, coreComplete: boolean): boolean {
  return !dismissed && !coreComplete
}

/** Whether a milestone step is done for checklist styling (pure). */
export function isOnboardingStepDone(
  milestone: OnboardingMilestoneId,
  input: OnboardingInputs,
): boolean {
  const order: OnboardingMilestoneId[] = [
    'create',
    'select',
    'linkOrChild',
    'renameOrInspect',
    'recenter',
    'undo',
    'complete',
  ]
  const current = getOnboardingMilestone(input)
  const curIdx = order.indexOf(current)
  const stepIdx = order.indexOf(milestone)
  if (milestone === 'complete') return current === 'complete'
  return stepIdx < curIdx || current === 'complete'
}

export function getHandTrackingOnboardingNote(): string {
  return COPY_HAND_TRACKING_LITE
}
