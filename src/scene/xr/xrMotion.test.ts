import { describe, expect, it } from 'vitest'
import { dampScalarToward } from './xrMotion'

describe('dampScalarToward', () => {
  it('moves toward target', () => {
    expect(dampScalarToward(0, 1, 10, 0.1)).toBeGreaterThan(0)
    expect(dampScalarToward(0, 1, 10, 0.1)).toBeLessThan(1)
  })
})
