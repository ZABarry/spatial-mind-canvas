import type { Project } from '../graph/types'
import { ProjectSchema } from './schemas'
import { getDb } from './db'

export interface ProjectRepository {
  listIds(): Promise<string[]>
  get(id: string): Promise<Project | undefined>
  save(project: Project): Promise<void>
  delete(id: string): Promise<void>
}

function parseProject(raw: string): Project | undefined {
  try {
    const json: unknown = JSON.parse(raw)
    const r = ProjectSchema.safeParse(json)
    if (!r.success) return undefined
    return r.data as Project
  } catch {
    return undefined
  }
}

export function createIndexedDbProjectRepository(): ProjectRepository {
  return {
    async listIds() {
      const db = await getDb()
      return db.getAllKeys('projects') as Promise<string[]>
    },
    async get(id) {
      const db = await getDb()
      const raw = await db.get('projects', id)
      if (!raw || typeof raw !== 'string') return undefined
      return parseProject(raw)
    },
    async save(project) {
      const db = await getDb()
      await db.put('projects', JSON.stringify(project), project.id)
    },
    async delete(id) {
      const db = await getDb()
      await db.delete('projects', id)
    },
  }
}
