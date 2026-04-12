import type { Project } from '../graph/types'

export const HISTORY_LIMIT = 80

export type HistoryEntry = {
  undo: () => void
  redo: () => void
}

/** Append one undo step after a completed gesture (before/after full project snapshots). */
export function buildProjectHistoryEntry(
  before: Project,
  after: Project,
  cloneProject: (p: Project) => Project,
  applyProject: (p: Project) => void,
): HistoryEntry {
  return {
    undo: () => applyProject(cloneProject(before)),
    redo: () => applyProject(cloneProject(after)),
  }
}

export function appendPast(
  past: HistoryEntry[],
  entry: HistoryEntry,
): { historyPast: HistoryEntry[]; historyFuture: HistoryEntry[] } {
  return {
    historyPast: [...past, entry].slice(-HISTORY_LIMIT),
    historyFuture: [],
  }
}
