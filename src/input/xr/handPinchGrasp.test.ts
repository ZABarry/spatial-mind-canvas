import { describe, expect, it } from 'vitest'
import {
  PINCH_GRASP_CLOSE_M,
  PINCH_GRASP_OPEN_M,
  updatePinchGraspActive,
  type PinchGraspHysteresis,
} from './handPinchGrasp'

describe('updatePinchGraspActive', () => {
  it('opens below close threshold and clears on null distance', () => {
    const h: PinchGraspHysteresis = { pinched: false }
    expect(updatePinchGraspActive(PINCH_GRASP_CLOSE_M - 0.001, h)).toBe(true)
    expect(h.pinched).toBe(true)
    expect(updatePinchGraspActive(null, h)).toBe(false)
    expect(h.pinched).toBe(false)
  })

  it('uses hysteresis between close and open thresholds', () => {
    const h: PinchGraspHysteresis = { pinched: true }
    expect(updatePinchGraspActive((PINCH_GRASP_CLOSE_M + PINCH_GRASP_OPEN_M) / 2, h)).toBe(true)
    expect(updatePinchGraspActive(PINCH_GRASP_OPEN_M + 0.001, h)).toBe(false)
  })
})
