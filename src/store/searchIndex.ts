import Fuse from 'fuse.js'
import type { AppAction } from '../input/actions'
import type { Project } from '../graph/types'

let fuse: Fuse<{ id: string; text: string }> | null = null

export function rebuildSearchIndex(project: Project) {
  const items: { id: string; text: string }[] = []
  for (const n of Object.values(project.graph.nodes)) {
    items.push({
      id: n.id,
      text: [n.title, n.shortDescription, n.note, ...n.tags].join('\n'),
    })
  }
  for (const m of Object.values(project.mediaManifest)) {
    items.push({ id: `media:${m.id}`, text: m.filename })
  }
  fuse = new Fuse(items, { keys: ['text'], threshold: 0.35 })
}

/** Search index only tracks node text/tags and media filenames — skip hot paths (e.g. VR edge drawing). */
export function shouldRebuildSearchIndex(a: AppAction): boolean {
  switch (a.type) {
    case 'createNodeAt':
    case 'spawnChildBranches':
    case 'deleteNode':
    case 'deleteSelection':
    case 'updateNodeProps':
    case 'attachMedia':
    case 'undo':
    case 'redo':
    case 'finishConnection':
      return true
    default:
      return false
  }
}

export function runSearchQuery(query: string): string[] {
  if (!fuse || !query.trim()) return []
  return fuse.search(query).map((r) => r.item.id)
}
