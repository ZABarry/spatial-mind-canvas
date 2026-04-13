import { useEffect, useRef } from 'react'
import { startAmbientBed } from '../audio/ambientBed'
import { useRootStore } from '../store/rootStore'

/** Soft ambient bed + shared Web Audio graph for interaction cues (see `interactionCues.ts`). */
export function AudioAmbience() {
  const enabled = useRootStore((s) => s.devicePreferences.audioEnabled)
  const bedRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    if (!enabled) return
    const h = startAmbientBed()
    bedRef.current = h
    return () => {
      h.stop()
      bedRef.current = null
    }
  }, [enabled])

  return null
}
