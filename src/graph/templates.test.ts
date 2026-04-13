import { describe, expect, it } from 'vitest'
import { ProjectSchema } from '../persistence/schemas'
import { STARTER_TEMPLATES } from './templates'

describe('starter templates', () => {
  it('each template builds a valid Project', () => {
    for (const t of STARTER_TEMPLATES) {
      const p = t.build()
      const r = ProjectSchema.safeParse(p)
      expect(r.success, t.id).toBe(true)
    }
  })

  it('non-blank templates have at least one node', () => {
    for (const t of STARTER_TEMPLATES) {
      if (t.id === 'blank') continue
      const p = t.build()
      expect(Object.keys(p.graph.nodes).length).toBeGreaterThan(0)
    }
  })
})
