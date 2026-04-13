import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NEW_NODE_TITLE,
  getOnboardingCue,
  getOnboardingMilestone,
  hasLinkOrChild,
} from './onboardingModel'
import { APP_SCHEMA_VERSION, NODE_LABEL_OUTLINE_DEFAULT, NODE_LABEL_TEXT_DEFAULT, type Project } from '../../graph/types'
import { defaultUserSettings, defaultWorldTransform, emptyGraph } from '../../graph/defaults'

function minimalProject(overrides: Partial<Project['graph']> & { nodes?: Project['graph']['nodes'] }): Project {
  const g = emptyGraph()
  const nodes = overrides.nodes ?? g.nodes
  const edges = overrides.edges ?? g.edges
  return {
    id: 't',
    name: 't',
    description: '',
    createdAt: 0,
    updatedAt: 0,
    lastOpenedAt: 0,
    graph: { nodes, edges },
    bookmarks: [],
    mediaManifest: {},
    worldTransform: defaultWorldTransform(),
    settings: defaultUserSettings(),
    schemaVersion: APP_SCHEMA_VERSION,
  }
}

describe('getOnboardingMilestone', () => {
  it('starts at create when graph is empty', () => {
    const p = minimalProject({})
    expect(getOnboardingMilestone({ project: p, primaryNodeId: null, detailNodeId: null, seenSelection: false })).toBe(
      'create',
    )
  })

  it('asks for select when nodes exist but no selection recorded', () => {
    const p = minimalProject({
      nodes: {
        a: {
          id: 'a',
          title: DEFAULT_NEW_NODE_TITLE,
          shortDescription: '',
          note: '',
          color: '#fff',
          labelTextColor: NODE_LABEL_TEXT_DEFAULT,
          labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
          shape: 'diamond',
          size: 1,
          position: [0, 0, 0],
          tags: [],
          createdAt: 0,
          updatedAt: 0,
          collapsed: false,
          pinned: false,
          mediaIds: [],
        },
      },
    })
    expect(getOnboardingMilestone({ project: p, primaryNodeId: null, detailNodeId: null, seenSelection: false })).toBe(
      'select',
    )
  })

  it('advances past select when primary is set', () => {
    const p = minimalProject({
      nodes: {
        a: {
          id: 'a',
          title: DEFAULT_NEW_NODE_TITLE,
          shortDescription: '',
          note: '',
          color: '#fff',
          labelTextColor: NODE_LABEL_TEXT_DEFAULT,
          labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
          shape: 'diamond',
          size: 1,
          position: [0, 0, 0],
          tags: [],
          createdAt: 0,
          updatedAt: 0,
          collapsed: false,
          pinned: false,
          mediaIds: [],
        },
      },
    })
    expect(getOnboardingMilestone({ project: p, primaryNodeId: 'a', detailNodeId: null, seenSelection: false })).toBe(
      'linkOrChild',
    )
  })

  it('detects linkOrChild via parentId', () => {
    const p = minimalProject({
      nodes: {
        a: {
          id: 'a',
          title: DEFAULT_NEW_NODE_TITLE,
          shortDescription: '',
          note: '',
          color: '#fff',
          labelTextColor: NODE_LABEL_TEXT_DEFAULT,
          labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
          shape: 'diamond',
          size: 1,
          position: [0, 0, 0],
          tags: [],
          createdAt: 0,
          updatedAt: 0,
          collapsed: false,
          pinned: false,
          mediaIds: [],
        },
        b: {
          id: 'b',
          title: DEFAULT_NEW_NODE_TITLE,
          shortDescription: '',
          note: '',
          color: '#fff',
          labelTextColor: NODE_LABEL_TEXT_DEFAULT,
          labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
          shape: 'diamond',
          size: 1,
          position: [1, 0, 0],
          tags: [],
          createdAt: 0,
          updatedAt: 0,
          collapsed: false,
          pinned: false,
          mediaIds: [],
          parentId: 'a',
        },
      },
    })
    expect(hasLinkOrChild(p)).toBe(true)
    expect(
      getOnboardingMilestone({ project: p, primaryNodeId: 'b', detailNodeId: null, seenSelection: true }),
    ).toBe('renameOrInspect')
  })

  it('completes when a title is non-default', () => {
    const p = minimalProject({
      nodes: {
        a: {
          id: 'a',
          title: 'Hello',
          shortDescription: '',
          note: '',
          color: '#fff',
          labelTextColor: NODE_LABEL_TEXT_DEFAULT,
          labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
          shape: 'diamond',
          size: 1,
          position: [0, 0, 0],
          tags: [],
          createdAt: 0,
          updatedAt: 0,
          collapsed: false,
          pinned: false,
          mediaIds: [],
        },
        b: {
          id: 'b',
          title: DEFAULT_NEW_NODE_TITLE,
          shortDescription: '',
          note: '',
          color: '#fff',
          labelTextColor: NODE_LABEL_TEXT_DEFAULT,
          labelOutlineColor: NODE_LABEL_OUTLINE_DEFAULT,
          shape: 'diamond',
          size: 1,
          position: [1, 0, 0],
          tags: [],
          createdAt: 0,
          updatedAt: 0,
          collapsed: false,
          pinned: false,
          mediaIds: [],
          parentId: 'a',
        },
      },
    })
    expect(getOnboardingMilestone({ project: p, primaryNodeId: 'b', detailNodeId: null, seenSelection: true })).toBe(
      'complete',
    )
  })
})

describe('getOnboardingCue', () => {
  it('returns null for complete milestone', () => {
    expect(getOnboardingCue('complete', 'desktop')).toBeNull()
  })

  it('returns desktop copy for create', () => {
    const c = getOnboardingCue('create', 'desktop')
    expect(c?.headline).toMatch(/place/i)
  })
})
