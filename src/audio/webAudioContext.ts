/** Shared Web Audio context for ambient bed + UI cues (single graph, low CPU). */

let ctxRef: AudioContext | null = null
let masterGainRef: GainNode | null = null

export function getSharedAudioContext(): AudioContext {
  if (!ctxRef) {
    ctxRef = new AudioContext()
    const g = ctxRef.createGain()
    g.gain.value = 0.55
    g.connect(ctxRef.destination)
    masterGainRef = g
  }
  return ctxRef
}

export function getMasterGain(): GainNode | null {
  return masterGainRef
}

export async function resumeAudioContext(): Promise<void> {
  const c = ctxRef
  if (c?.state === 'suspended') await c.resume()
}
