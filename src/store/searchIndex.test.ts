import { describe, expect, it } from 'vitest'
import { rebuildSearchIndex, runSearchQuery, shouldRebuildSearchIndex } from './searchIndex'
import { APP_SCHEMA_VERSION, type Project } from '../graph/types'
import { defaultUserSettings, defaultWorldTransform, emptyGraph } from '../graph/defaults'

function tinyProject(): Project {
  const g = emptyGraph()
  return {
    id: 'p',
    name: 'p',
    description: '',
    createdAt: 0,
    updatedAt: 0,
    lastOpenedAt: 0,
    graph: g,
    bookmarks: [],
    mediaManifest: {},
    worldTransform: defaultWorldTransform(),
    settings: defaultUserSettings(),
    schemaVersion: APP_SCHEMA_VERSION,
  }
}

describe('searchIndex', () => {
  it('rebuilds and finds node text', () => {
    const p = tinyProject()
    p.graph.nodes['n1'] = {
      id: 'n1',
      title: 'Alpha topic',
      shortDescription: '',
      note: '',
      color: '#fff',
      labelTextColor: '#111',
      labelOutlineColor: '#000',
      shape: 'diamond',
      size: 1,
      position: [0, 0, 0],
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      collapsed: false,
      pinned: false,
      mediaIds: [],
    }
    rebuildSearchIndex(p)
    expect(runSearchQuery('Alpha')).toContain('n1')
  })

  it('flags graph-changing actions for index rebuild', () => {
    expect(shouldRebuildSearchIndex({ type: 'createNodeAt', position: [0, 0, 0] })).toBe(true)
    expect(shouldRebuildSearchIndex({ type: 'setHover', nodeId: 'x' })).toBe(false)
  })
})
