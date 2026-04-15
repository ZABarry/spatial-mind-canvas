import { describe, expect, it } from 'vitest'
import {
  PALM_FACE_CLOSE_THRESHOLD,
  PALM_FACE_OPEN_DWELL_FRAMES,
  PALM_FACE_OPEN_THRESHOLD,
  updatePalmMenuVisibility,
  type PalmFacingHysteresis,
} from './palmFacing'

describe('updatePalmMenuVisibility', () => {
  it('requires dwell frames before opening', () => {
    const h: PalmFacingHysteresis = { visible: false, openStreak: 0 }
    const score = PALM_FACE_OPEN_THRESHOLD + 0.01
    for (let i = 0; i < PALM_FACE_OPEN_DWELL_FRAMES - 1; i++) {
      expect(updatePalmMenuVisibility(score, h)).toBe(false)
      expect(h.visible).toBe(false)
    }
    expect(updatePalmMenuVisibility(score, h)).toBe(true)
    expect(h.visible).toBe(true)
  })

  it('closes when score drops below close threshold', () => {
    const h: PalmFacingHysteresis = { visible: true, openStreak: 0 }
    expect(updatePalmMenuVisibility(PALM_FACE_CLOSE_THRESHOLD - 0.02, h)).toBe(false)
    expect(h.visible).toBe(false)
  })
})
