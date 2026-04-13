import { getMasterGain, getSharedAudioContext, resumeAudioContext } from './webAudioContext'

/** Base gain before user `ambientVolume` (0–1) is applied. */
const AMBIENT_BASE_GAIN = 0.026

const AMBIENT_PITCH_MIN = 0.5
const AMBIENT_PITCH_MAX = 2

export interface AmbientBedOptions {
  /** 0–1, default 1 */
  volume?: number
  /** Playback rate; clamped ~0.5–2, default 1 */
  pitch?: number
}

export interface AmbientBedHandle {
  stop: () => void
  setVolume: (v: number) => void
  setPitch: (p: number) => void
}

/** Paul Kellet pink noise — smoother than white for wind-like beds. */
function fillPinkNoiseChannel(data: Float32Array): void {
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    b6 = white * 0.115926
    data[i] = pink * 0.11
  }
}

function createPinkNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  fillPinkNoiseChannel(buffer.getChannelData(0))
  return buffer
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 1
  return Math.max(0, Math.min(1, v))
}

function clampPitch(v: number): number {
  if (Number.isNaN(v)) return 1
  return Math.max(AMBIENT_PITCH_MIN, Math.min(AMBIENT_PITCH_MAX, v))
}

/**
 * Soft band-limited pink noise with slow filter motion — reads as breeze, not a tonal hum.
 */
export function startAmbientBed(opts: AmbientBedOptions = {}): AmbientBedHandle {
  const ctx = getSharedAudioContext()
  const master = getMasterGain()
  const dest = master ?? ctx.destination

  const buffer = createPinkNoiseBuffer(ctx, 7)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const vol = clamp01(opts.volume ?? 1)
  const pit = clampPitch(opts.pitch ?? 1)
  source.playbackRate.value = pit

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 380
  highpass.Q.value = 0.65

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1250
  bandpass.Q.value = 0.55

  const gain = ctx.createGain()
  gain.gain.value = AMBIENT_BASE_GAIN * vol

  const lfoSlow = ctx.createOscillator()
  lfoSlow.type = 'sine'
  lfoSlow.frequency.value = 0.038
  const lfoSlowDepth = ctx.createGain()
  lfoSlowDepth.gain.value = 420

  const lfoFast = ctx.createOscillator()
  lfoFast.type = 'sine'
  lfoFast.frequency.value = 0.11
  const lfoFastDepth = ctx.createGain()
  lfoFastDepth.gain.value = 140

  source.connect(highpass)
  highpass.connect(bandpass)
  bandpass.connect(gain)
  gain.connect(dest)

  lfoSlow.connect(lfoSlowDepth)
  lfoSlowDepth.connect(bandpass.frequency)
  lfoFast.connect(lfoFastDepth)
  lfoFastDepth.connect(bandpass.frequency)

  const nodes: AudioNode[] = [
    source,
    highpass,
    bandpass,
    gain,
    lfoSlow,
    lfoSlowDepth,
    lfoFast,
    lfoFastDepth,
  ]

  let started = false
  const start = () => {
    void ctx.resume()
    try {
      const t = ctx.currentTime
      lfoSlow.start(t)
      lfoFast.start(t)
      source.start(t)
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

  const setVolume = (v: number) => {
    const t = ctx.currentTime
    gain.gain.setValueAtTime(AMBIENT_BASE_GAIN * clamp01(v), t)
  }

  const setPitch = (p: number) => {
    const t = ctx.currentTime
    source.playbackRate.setValueAtTime(clampPitch(p), t)
  }

  return {
    setVolume,
    setPitch,
    stop: () => {
      window.removeEventListener('pointerdown', onFirst)
      if (started) {
        try {
          source.stop()
          lfoSlow.stop()
          lfoFast.stop()
        } catch {
          /* already stopped */
        }
      }
      for (const n of nodes) {
        n.disconnect()
      }
    },
  }
}
