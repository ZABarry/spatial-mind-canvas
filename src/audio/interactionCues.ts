import { getMasterGain, getSharedAudioContext, resumeAudioContext } from './webAudioContext'

export type InteractionCueKind =
  | 'select'
  | 'linkStart'
  | 'linkComplete'
  | 'cancel'
  | 'undo'
  | 'redo'
  | 'confirmOpen'
  | 'confirmAccept'
  | 'destructiveConfirm'
  | 'menuToggle'

/**
 * Short synthesized cues — soft, non-spatial, gated by caller (`audioEnabled`).
 */
export function playInteractionCue(kind: InteractionCueKind, audioEnabled: boolean): void {
  if (!audioEnabled) return
  const ctx = getSharedAudioContext()
  if (ctx.state === 'suspended') return

  const master = getMasterGain()
  const dest = master ?? ctx.destination
  const now = ctx.currentTime
  const g = ctx.createGain()
  g.gain.value = 0
  g.connect(dest)

  const env = (peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(peak, now + attack)
    g.gain.exponentialRampToValueAtTime(0.0008, now + attack + decay)
  }

  switch (kind) {
    case 'select': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(220, now)
      o.frequency.exponentialRampToValueAtTime(275, now + 0.05)
      o.connect(g)
      env(0.03, 0.008, 0.09)
      o.start(now)
      o.stop(now + 0.13)
      break
    }
    case 'linkStart': {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.setValueAtTime(330, now)
      o.frequency.exponentialRampToValueAtTime(440, now + 0.05)
      o.connect(g)
      env(0.05, 0.008, 0.1)
      o.start(now)
      o.stop(now + 0.14)
      break
    }
    case 'linkComplete': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(523, now)
      o.frequency.exponentialRampToValueAtTime(659, now + 0.06)
      o.connect(g)
      env(0.055, 0.005, 0.1)
      o.start(now)
      o.stop(now + 0.15)
      break
    }
    case 'cancel': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(300, now)
      o.frequency.exponentialRampToValueAtTime(180, now + 0.08)
      o.connect(g)
      env(0.04, 0.004, 0.1)
      o.start(now)
      o.stop(now + 0.14)
      break
    }
    case 'undo': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(392, now)
      o.frequency.exponentialRampToValueAtTime(330, now + 0.05)
      o.connect(g)
      env(0.042, 0.005, 0.08)
      o.start(now)
      o.stop(now + 0.12)
      break
    }
    case 'redo': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(330, now)
      o.frequency.exponentialRampToValueAtTime(392, now + 0.05)
      o.connect(g)
      env(0.042, 0.005, 0.08)
      o.start(now)
      o.stop(now + 0.12)
      break
    }
    case 'confirmOpen': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(220, now)
      o.connect(g)
      env(0.035, 0.01, 0.12)
      o.start(now)
      o.stop(now + 0.16)
      break
    }
    case 'confirmAccept': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(350, now)
      o.frequency.exponentialRampToValueAtTime(440, now + 0.04)
      o.connect(g)
      env(0.04, 0.006, 0.09)
      o.start(now)
      o.stop(now + 0.13)
      break
    }
    case 'destructiveConfirm': {
      const o = ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.setValueAtTime(200, now)
      o.frequency.exponentialRampToValueAtTime(165, now + 0.07)
      o.connect(g)
      env(0.048, 0.008, 0.14)
      o.start(now)
      o.stop(now + 0.18)
      break
    }
    case 'menuToggle': {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(880, now)
      o.connect(g)
      env(0.028, 0.002, 0.035)
      o.start(now)
      o.stop(now + 0.06)
      break
    }
    default:
      g.disconnect()
  }

  oCleanup(g, now + 0.25)
}

function oCleanup(g: GainNode, end: number) {
  const ctx = g.context as AudioContext
  window.setTimeout(() => {
    try {
      g.disconnect()
    } catch {
      /* noop */
    }
  }, Math.max(0, (end - ctx.currentTime) * 1000 + 80))
}

/** Call after user gesture so cues can play (AudioContext resume). */
export function primeInteractionAudio(): void {
  void resumeAudioContext()
}

/** Classify confirm button for soft vs caution tone. */
export function confirmAcceptCueKind(title: string, message: string): 'destructiveConfirm' | 'confirmAccept' {
  const t = `${title} ${message}`.toLowerCase()
  if (t.includes('delete') || t.includes('clear this map') || t.includes('remove all')) {
    return 'destructiveConfirm'
  }
  return 'confirmAccept'
}
