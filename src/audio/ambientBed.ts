import { getMasterGain, getSharedAudioContext, resumeAudioContext } from './webAudioContext'

export interface AmbientBedHandle {
  stop: () => void
}

/**
 * Very soft sine ambient — same spirit as original AudioAmbience.
 */
export function startAmbientBed(): AmbientBedHandle {
  const ctx = getSharedAudioContext()
  const master = getMasterGain()
  const dest = master ?? ctx.destination

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 110
  gain.gain.value = 0.012
  osc.connect(gain)
  gain.connect(dest)

  let started = false
  const start = () => {
    void ctx.resume()
    try {
      osc.start()
      started = true
    } catch {
      /* already started */
    }
  }

  const onFirst = () => {
    void resumeAudioContext()
    start()
    window.removeEventListener('pointerdown', onFirst)
  }
  window.addEventListener('pointerdown', onFirst, { once: true })

  return {
    stop: () => {
      window.removeEventListener('pointerdown', onFirst)
      if (started) {
        try {
          osc.stop()
        } catch {
          /* already stopped */
        }
      }
      osc.disconnect()
      gain.disconnect()
    },
  }
}
