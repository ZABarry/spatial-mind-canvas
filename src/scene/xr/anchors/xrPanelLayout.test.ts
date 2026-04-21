import { describe, expect, it } from 'vitest'
import { activeLanesFromSnapshot } from './xrPanelLayout'

describe('activeLanesFromSnapshot', () => {
  it('returns lanes for each open surface', () => {
    const lanes = activeLanesFromSnapshot({
      detailOpen: true,
      searchOrHistoryOpen: true,
      settingsOpen: false,
      bookmarksOpen: true,
    })
    expect([...lanes].sort()).toEqual(['center', 'left', 'right'].sort())
  })

  it('returns empty when nothing open', () => {
    expect(
      activeLanesFromSnapshot({
        detailOpen: false,
        searchOrHistoryOpen: false,
        settingsOpen: false,
        bookmarksOpen: false,
      }),
    ).toEqual([])
  })
})
