import { describe, expect, it } from 'vitest'
import type { InteractionSession } from '../../input/sessionTypes'
import {
  interactionTokens,
  isValidLinkNodeTarget,
  linkLineAppearance,
  nodeMeshEmissive,
  radialIntentColors,
  wristMenuButtonColors,
} from './interactionTokens'

const idle: InteractionSession = { kind: 'idle' }

describe('nodeMeshEmissive', () => {
  it('returns base intensity when idle', () => {
    expect(nodeMeshEmissive({ nodeId: 'a', selected: false, hovered: false, session: idle }).intensity).toBe(0.12)
  })

  it('increases on hover', () => {
    expect(nodeMeshEmissive({ nodeId: 'a', selected: false, hovered: true, session: idle }).intensity).toBe(0.32)
  })

  it('selected beats hover', () => {
    expect(nodeMeshEmissive({ nodeId: 'a', selected: true, hovered: true, session: idle }).intensity).toBe(0.38)
  })

  it('link source uses stronger accent', () => {
    const s: InteractionSession = { kind: 'link', pointerId: 'p', fromNodeId: 'a' }
    const r = nodeMeshEmissive({ nodeId: 'a', selected: false, hovered: false, session: s })
    expect(r.intensity).toBeGreaterThan(0.4)
    expect(r.emissiveBlendHex).toBe(interactionTokens.link)
  })

  it('valid other node gets success blend', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'p',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'b' },
    }
    const r = nodeMeshEmissive({ nodeId: 'b', selected: false, hovered: false, session: s })
    expect(r.emissiveBlendHex).toBe(interactionTokens.success)
  })

  it('self-node preview uses warning blend', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'p',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'a' },
    }
    const r = nodeMeshEmissive({ nodeId: 'a', selected: false, hovered: false, session: s })
    expect(r.emissiveBlendHex).toBe(interactionTokens.warning)
  })
})

describe('linkLineAppearance', () => {
  it('defaults when not linking', () => {
    const a = linkLineAppearance(idle, 'x')
    expect(a.color).toBe(interactionTokens.link)
  })

  it('valid node target uses success tone', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'p',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'b' },
    }
    expect(linkLineAppearance(s, 'a').color).toBe(interactionTokens.successSoft)
  })

  it('ground uses soft link', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'p',
      fromNodeId: 'a',
      previewTarget: { kind: 'ground', point: [0, 0, 0] },
    }
    expect(linkLineAppearance(s, 'a').color).toBe(interactionTokens.linkSoft)
  })

  it('self link uses warning', () => {
    const s: InteractionSession = {
      kind: 'link',
      pointerId: 'p',
      fromNodeId: 'a',
      previewTarget: { kind: 'node', nodeId: 'a' },
    }
    expect(linkLineAppearance(s, 'a').color).toBe(interactionTokens.warning)
  })
})

describe('isValidLinkNodeTarget', () => {
  it('true only for different node', () => {
    expect(isValidLinkNodeTarget({ kind: 'node', nodeId: 'b' }, 'a')).toBe(true)
    expect(isValidLinkNodeTarget({ kind: 'node', nodeId: 'a' }, 'a')).toBe(false)
  })
})

describe('radialIntentColors', () => {
  it('delete uses danger label tone', () => {
    expect(radialIntentColors('delete').label).toContain('7f')
  })
})

describe('wristMenuButtonColors', () => {
  it('danger differs from default', () => {
    expect(wristMenuButtonColors('danger').bg).not.toBe(wristMenuButtonColors('default').bg)
  })
})
