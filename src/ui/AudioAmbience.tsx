import { useEffect, useRef } from 'react'
import { useRootStore } from '../store/rootStore'

/** Very soft ambient bed — disabled when audio off in settings. */
export function AudioAmbience() {
  const enabled = useRootStore((s) => s.devicePreferences.audioEnabled)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!enabled) return
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 110
    gain.gain.value = 0.012
    osc.connect(gain)
    gain.connect(ctx.destination)
    let oscStarted = false
    const start = () => {
      void ctx.resume()
      try {
        osc.start()
        oscStarted = true
      } catch {
        /* already started */
      }
    }
    const onFirst = () => {
      start()
      window.removeEventListener('pointerdown', onFirst)
    }
    window.addEventListener('pointerdown', onFirst, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onFirst)
      if (oscStarted) {
        try {
          osc.stop()
        } catch {
          /* already stopped */
        }
      }
      void ctx.close()
    }
  }, [enabled])

  return null
}
