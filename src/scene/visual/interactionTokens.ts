import type { HitTarget } from '../../input/hitTargets'
import type { InteractionSession } from '../../input/sessionTypes'

/** Calm “white void” interaction palette — shared by 3D and CSS. */
export const interactionTokens = {
  accent: '#3d5a80',
  link: '#5ad4ff',
  linkSoft: '#7ec8e8',
  success: '#5eb8a8',
  successSoft: '#8ec9bc',
  warning: '#c9a882',
  danger: '#c97b88',
  dangerSoft: '#e8b4bc',
  neutralFg: '#1c2330',
  neutralMuted: '#64748b',
  surface: '#f4f6fb',
  surfaceHover: '#e8eef8',
  /** XR contextual UI / wrist plate */
  uiPlate: '#eef2f9',
  uiPlateHover: '#e2e9f5',
  uiPlatePress: '#d8e0ef',
} as const

export type NodeMeshAccent =
  | 'neutral'
  | 'hover'
  | 'selected'
  | 'linkSource'
  | 'linkTargetValid'
  | 'linkTargetInvalid'

export interface NodeMeshEmissive {
  /** Multiplier on top of node base color as emissive tint */
  intensity: number
  /** Optional hex to lerp emissive toward (success / active link) */
  emissiveBlendHex?: string
  /** 0–1 how much emissiveBlendHex vs node color */
  blendAmount?: number
}

const BASE = 0.12
const HOVER = 0.32
const SELECTED = 0.38
const LINK_SOURCE = 0.48
const LINK_TARGET_VALID = 0.42
const LINK_TARGET_INVALID = 0.28

/**
 * Emissive feedback for a node body during normal interaction + link drafting.
 */
export function nodeMeshEmissive(opts: {
  nodeId: string
  selected: boolean
  hovered: boolean
  session: InteractionSession
}): NodeMeshEmissive {
  const { nodeId, selected, hovered, session } = opts

  if (session.kind === 'link') {
    const from = session.fromNodeId
    const preview = session.previewTarget

    if (nodeId === from) {
      const invalid =
        preview?.kind === 'node' && preview.nodeId === from
          ? true
          : preview?.kind === 'node-link-handle' && preview.nodeId === from
      if (invalid) {
        return {
          intensity: LINK_TARGET_INVALID,
          emissiveBlendHex: interactionTokens.warning,
          blendAmount: 0.45,
        }
      }
      return {
        intensity: LINK_SOURCE,
        emissiveBlendHex: interactionTokens.link,
        blendAmount: 0.35,
      }
    }

    if (preview?.kind === 'node' && preview.nodeId === nodeId && preview.nodeId !== from) {
      return {
        intensity: LINK_TARGET_VALID,
        emissiveBlendHex: interactionTokens.success,
        blendAmount: 0.5,
      }
    }
  }

  if (selected) {
    return { intensity: SELECTED }
  }
  if (hovered) {
    return { intensity: HOVER }
  }
  return { intensity: BASE }
}

export interface LinkLineAppearance {
  color: string
  opacity: number
}

/**
 * Ghost link segment: color reflects valid target, ground drop, or invalid self-link.
 */
export function linkLineAppearance(
  session: InteractionSession,
  fromNodeId: string,
): LinkLineAppearance {
  if (session.kind !== 'link') {
    return { color: interactionTokens.link, opacity: 0.85 }
  }
  const t = session.previewTarget

  if (t?.kind === 'node' && t.nodeId !== fromNodeId) {
    return { color: interactionTokens.successSoft, opacity: 0.92 }
  }
  if (t?.kind === 'ground') {
    return { color: interactionTokens.linkSoft, opacity: 0.78 }
  }
  if (
    (t?.kind === 'node' && t.nodeId === fromNodeId) ||
    (t?.kind === 'node-link-handle' && t.nodeId === fromNodeId)
  ) {
    return { color: interactionTokens.warning, opacity: 0.75 }
  }
  return { color: interactionTokens.link, opacity: 0.82 }
}

/** Whether link draft is aimed at a valid completion (another node). */
export function isValidLinkNodeTarget(hit: HitTarget | undefined, fromNodeId: string): boolean {
  return hit?.kind === 'node' && hit.nodeId !== fromNodeId
}

export type RadialIntent = 'child' | 'link' | 'inspect' | 'delete' | 'focus' | 'recenter' | 'neutral'

export function radialIntentColors(intent: RadialIntent): {
  base: string
  hover: string
  press: string
  label: string
} {
  switch (intent) {
    case 'child':
      return {
        base: '#d8f0e6',
        hover: '#c0e8d8',
        press: '#a8dcc8',
        label: interactionTokens.neutralFg,
      }
    case 'link':
      return {
        base: '#d4eef8',
        hover: '#bfe4f4',
        press: '#a8d8ec',
        label: interactionTokens.neutralFg,
      }
    case 'inspect':
      return {
        base: '#e8e4fc',
        hover: '#dcd8f8',
        press: '#d0caf4',
        label: interactionTokens.neutralFg,
      }
    case 'delete':
      return {
        base: '#fce8ec',
        hover: '#f8dce2',
        press: '#f0ccd4',
        label: '#7f1d2d',
      }
    case 'focus':
      return {
        base: '#faf6e8',
        hover: '#f5edd4',
        press: '#ede4c4',
        label: interactionTokens.neutralFg,
      }
    case 'recenter':
      return {
        base: '#e8ecf2',
        hover: '#dde2ea',
        press: '#d0d6e2',
        label: interactionTokens.neutralFg,
      }
    default:
      return {
        base: interactionTokens.uiPlate,
        hover: interactionTokens.uiPlateHover,
        press: interactionTokens.uiPlatePress,
        label: interactionTokens.neutralFg,
      }
  }
}

export type WristButtonKind = 'default' | 'danger' | 'warning'

export function wristMenuButtonColors(kind: WristButtonKind): {
  bg: string
  bgHover: string
  bgPress: string
  text: string
} {
  switch (kind) {
    case 'danger':
      return {
        bg: '#fceef0',
        bgHover: '#f8e0e4',
        bgPress: '#efd0d6',
        text: '#7f1d2d',
      }
    case 'warning':
      return {
        bg: '#faf6ef',
        bgHover: '#f5ecd8',
        bgPress: '#ede4cc',
        text: '#6b4f2a',
      }
    default:
      return {
        bg: '#ffffff',
        bgHover: '#f1f5f9',
        bgPress: '#e2e8f0',
        text: '#0f172a',
      }
  }
}
