import { useEffect, useRef } from 'react'
import { type AmbientBedHandle, startAmbientBed } from '../audio/ambientBed'
import { useRootStore } from '../store/rootStore'

/** Soft ambient bed + shared Web Audio graph for interaction cues (see `interactionCues.ts`). */
export function AudioAmbience() {
  const enabled = useRootStore((s) => s.devicePreferences.audioEnabled)
  const ambientVolume = useRootStore((s) => s.devicePreferences.ambientVolume)
  const ambientPitch = useRootStore((s) => s.devicePreferences.ambientPitch)
  const bedRef = useRef<AmbientBedHandle | null>(null)

  useEffect(() => {
    if (!enabled) return
    const h = startAmbientBed({ volume: ambientVolume, pitch: ambientPitch })
    bedRef.current = h
    return () => {
      h.stop()
      bedRef.current = null
    }
    // Volume/pitch while enabled are applied in the effects below; only restart when audio is toggled on.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    bedRef.current?.setVolume(ambientVolume)
  }, [enabled, ambientVolume])

  useEffect(() => {
    if (!enabled) return
    bedRef.current?.setPitch(ambientPitch)
  }, [enabled, ambientPitch])

  return null
}
