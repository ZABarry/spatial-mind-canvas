import { useEffect, useRef } from 'react'
import { useRootStore } from '../store/rootStore'

/** Very soft ambient bed — disabled when audio off in settings. */
export function AudioAmbience() {
  const enabled = useRootStore((s) => s.project?.settings.audioEnabled ?? true)
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
    const start = () => {
      void ctx.resume()
      try {
        osc.start()
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
      osc.stop()
      void ctx.close()
    }
  }, [enabled])

  return null
}
