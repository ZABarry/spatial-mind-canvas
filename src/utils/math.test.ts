import { describe, it, expect } from 'vitest'
import { graphPointToWorld, worldPointToGraphLocal, v3 } from './math'

describe('graph/world coordinate transforms', () => {
  it('roundtrips local→world→local with uniform scale', () => {
    const wt = {
      position: v3(1, 2, 3),
      quaternion: [0, 0, 0, 1] as const,
      scale: 2,
    }
    const local = v3(4, 0, -1)
    const w = graphPointToWorld(wt, local)
    const back = worldPointToGraphLocal(wt, w)
    expect(back[0]).toBeCloseTo(local[0])
    expect(back[1]).toBeCloseTo(local[1])
    expect(back[2]).toBeCloseTo(local[2])
  })
})
