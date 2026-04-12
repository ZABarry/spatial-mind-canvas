import type { StructureToolName } from '../input/actions'

export const STRUCTURE_MENU_TOOLS: ReadonlyArray<{ id: StructureToolName; label: string }> = [
  { id: 'alignX', label: 'Align X' },
  { id: 'alignY', label: 'Align Y' },
  { id: 'alignZ', label: 'Align Z' },
  { id: 'distributeX', label: 'Distribute X' },
  { id: 'distributeY', label: 'Distribute Y' },
  { id: 'distributeZ', label: 'Distribute Z' },
  { id: 'radial', label: 'Radial' },
  { id: 'flatten', label: 'Flatten plane' },
  { id: 'normalizeSpacing', label: 'Normalize spacing' },
  { id: 'centerCluster', label: 'Center on primary' },
]
