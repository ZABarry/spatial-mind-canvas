import type { Project } from '../graph/types'

/** Upper-bound style estimate for visible labels (matches label budget; not distance-sorted). */
export function estimateVisibleLabelCount(project: Project): {
  budget: number
  approxVisible: number
  showAll: boolean
} {
  const settings = project.settings
  const budget = settings.labelBudget ?? 32
  const showAll = settings.showAllLabels ?? false
  const n = Object.keys(project.graph.nodes).length
  if (showAll) return { budget, approxVisible: n, showAll: true }
  return { budget, approxVisible: Math.min(budget, n), showAll: false }
}

export function countMediaAttachments(project: Project): number {
  return Object.keys(project.mediaManifest).length
}

export function countNodesWithMedia(project: Project): number {
  return Object.values(project.graph.nodes).filter((n) => n.mediaIds.length > 0).length
}

/** Overlays that compete for attention / GPU in XR (rough panel load). */
export function countOpenScenePanels(st: {
  searchOpen: boolean
  mapHistoryOpen: boolean
  bookmarksPanelOpen: boolean
  detailNodeId: string | null
  settingsOpen: boolean
  xrHelpOpen: boolean
  confirmDialog: unknown
  textPromptDialog: unknown
}): number {
  let n = 0
  if (st.searchOpen) n++
  if (st.mapHistoryOpen) n++
  if (st.bookmarksPanelOpen) n++
  if (st.detailNodeId) n++
  if (st.settingsOpen) n++
  if (st.xrHelpOpen) n++
  if (st.confirmDialog) n++
  if (st.textPromptDialog) n++
  return n
}

export function formatSceneMetricsLine(
  project: Project | null,
  st: Parameters<typeof countOpenScenePanels>[0] & { xrHandTrackingPrimary: boolean },
): string {
  if (!project) return 'no project'
  const nodes = Object.keys(project.graph.nodes).length
  const edges = Object.keys(project.graph.edges).length
  const { approxVisible, budget, showAll } = estimateVisibleLabelCount(project)
  const panels = countOpenScenePanels(st)
  const media = countMediaAttachments(project)
  const nodesWithMedia = countNodesWithMedia(project)
  const mode = st.xrHandTrackingPrimary ? 'hand' : 'controller'
  return `nodes=${nodes} edges=${edges} labels~${approxVisible}/${budget}${showAll ? ' (all)' : ''} media=${media} nodesWithFiles=${nodesWithMedia} panels=${panels} input=${mode}`
}
