import { nanoid } from 'nanoid'
import type { Project } from './types'
import { APP_SCHEMA_VERSION } from './types'
import { createBlankProject, defaultWorldTransform, emptyGraph } from './defaults'
import { defaultUserSettings } from './defaults'
import { addEdge, addNode } from './mutations'
import { v3 } from '../utils/math'

export type TemplateId = 'blank' | 'brainstorm' | 'problem-solution' | 'goals-tasks' | 'concept-map'

export interface StarterTemplate {
  id: TemplateId
  title: string
  description: string
  /** When false, UI may still offer “blank” via existing new-map flow. */
  showInPicker: boolean
  build: () => Project
}

function baseMeta(name: string, description: string): Omit<Project, 'graph' | 'bookmarks' | 'worldTransform' | 'mediaManifest'> {
  const now = Date.now()
  return {
    id: nanoid(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    settings: defaultUserSettings(),
    schemaVersion: APP_SCHEMA_VERSION,
  }
}

function brainstormMap(): Project {
  const meta = baseMeta('Brainstorm', 'Central topic with a few starter ideas')
  let graph = emptyGraph()
  const h = addNode(graph, {
    title: 'Topic',
    shortDescription: '',
    note: '',
    color: '#6b9bd1',
    shape: 'sphere',
    size: 1.1,
    position: v3(0, 0, 0),
    tags: [],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  })
  graph = h.graph
  const hubId = h.node.id
  const ideas = ['Idea A', 'Idea B', 'Idea C', 'Idea D']
  const positions: [number, number, number][] = [
    [-2.2, 0.4, 0.5],
    [2.2, 0.4, 0.5],
    [-1.6, 0.4, -1.8],
    [1.6, 0.4, -1.8],
  ]
  for (let i = 0; i < ideas.length; i++) {
    const n = addNode(graph, {
      title: ideas[i],
      shortDescription: '',
      note: '',
      color: '#8eb8d8',
      shape: 'diamond',
      size: 1,
      position: positions[i],
      tags: [],
      collapsed: false,
      pinned: false,
      mediaIds: [],
      parentId: hubId,
    })
    graph = n.graph
    const e = addEdge(graph, { sourceId: hubId, targetId: n.node.id })
    graph = e.graph
  }
  return { ...meta, graph, bookmarks: [], worldTransform: defaultWorldTransform(), mediaManifest: {} }
}

function problemSolutionMap(): Project {
  const meta = baseMeta('Problem / Solution', 'Two pillars with a connecting link')
  let graph = emptyGraph()
  const left = addNode(graph, {
    title: 'Problem',
    shortDescription: '',
    note: 'What needs solving?',
    color: '#c9a27a',
    shape: 'cube',
    size: 1,
    position: v3(-1.8, 0, 0),
    tags: [],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  })
  graph = left.graph
  const right = addNode(graph, {
    title: 'Solution',
    shortDescription: '',
    note: 'What would fix it?',
    color: '#7eb88f',
    shape: 'cube',
    size: 1,
    position: v3(1.8, 0, 0),
    tags: [],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  })
  graph = right.graph
  const e = addEdge(graph, { sourceId: left.node.id, targetId: right.node.id })
  graph = e.graph
  return { ...meta, graph, bookmarks: [], worldTransform: defaultWorldTransform(), mediaManifest: {} }
}

function goalsTasksMap(): Project {
  const meta = baseMeta('Goals & tasks', 'A goal node with starter tasks')
  let graph = emptyGraph()
  const root = addNode(graph, {
    title: 'Goal',
    shortDescription: '',
    note: '',
    color: '#9b8bc9',
    shape: 'capsule',
    size: 1,
    position: v3(0, 0, 0),
    tags: ['goal'],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  })
  graph = root.graph
  const rid = root.node.id
  const tasks = ['Task 1', 'Task 2', 'Task 3']
  for (let i = 0; i < tasks.length; i++) {
    const n = addNode(graph, {
      title: tasks[i],
      shortDescription: '',
      note: '',
      color: '#b0a8d8',
      shape: 'pill',
      size: 0.95,
      position: v3(1.4 + i * 0.15, 0.5 + i * 0.9, 0.3),
      tags: [],
      collapsed: false,
      pinned: false,
      mediaIds: [],
      parentId: rid,
    })
    graph = n.graph
    const e = addEdge(graph, { sourceId: rid, targetId: n.node.id })
    graph = e.graph
  }
  return { ...meta, graph, bookmarks: [], worldTransform: defaultWorldTransform(), mediaManifest: {} }
}

function conceptMapStarter(): Project {
  const meta = baseMeta('Concept map', 'Hub and related concepts')
  let graph = emptyGraph()
  const center = addNode(graph, {
    title: 'Main concept',
    shortDescription: '',
    note: '',
    color: '#7eb8da',
    shape: 'sphere',
    size: 1.05,
    position: v3(0, 0, 0),
    tags: [],
    collapsed: false,
    pinned: false,
    mediaIds: [],
  })
  graph = center.graph
  const cid = center.node.id
  const labels = ['Related A', 'Related B', 'Related C']
  const pos: [number, number, number][] = [
    [-2, 0.2, 1],
    [2.1, 0.2, 0.2],
    [0, 0.2, -2.2],
  ]
  for (let i = 0; i < labels.length; i++) {
    const n = addNode(graph, {
      title: labels[i],
      shortDescription: '',
      note: '',
      color: '#a8c8e8',
      shape: 'tetra',
      size: 1,
      position: pos[i],
      tags: [],
      collapsed: false,
      pinned: false,
      mediaIds: [],
    })
    graph = n.graph
    const e = addEdge(graph, { sourceId: cid, targetId: n.node.id })
    graph = e.graph
  }
  return { ...meta, graph, bookmarks: [], worldTransform: defaultWorldTransform(), mediaManifest: {} }
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'blank',
    title: 'Blank map',
    description: 'Empty canvas',
    showInPicker: true,
    build: () => createBlankProject('Untitled map'),
  },
  {
    id: 'brainstorm',
    title: 'Simple brainstorm',
    description: 'Center topic plus four ideas',
    showInPicker: true,
    build: brainstormMap,
  },
  {
    id: 'problem-solution',
    title: 'Problem / solution',
    description: 'Two linked pillars',
    showInPicker: true,
    build: problemSolutionMap,
  },
  {
    id: 'goals-tasks',
    title: 'Goals & tasks',
    description: 'One goal with three tasks',
    showInPicker: true,
    build: goalsTasksMap,
  },
  {
    id: 'concept-map',
    title: 'Concept map',
    description: 'Hub with three related nodes',
    showInPicker: true,
    build: conceptMapStarter,
  },
]

export function getTemplate(id: TemplateId): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id)
}
