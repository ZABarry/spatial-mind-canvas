import { useRootStore } from '../store/rootStore'

const tools = [
  { id: 'alignX' as const, label: 'Align X' },
  { id: 'alignY' as const, label: 'Align Y' },
  { id: 'alignZ' as const, label: 'Align Z' },
  { id: 'distributeX' as const, label: 'Distribute X' },
  { id: 'distributeY' as const, label: 'Distribute Y' },
  { id: 'distributeZ' as const, label: 'Distribute Z' },
  { id: 'radial' as const, label: 'Radial' },
  { id: 'flatten' as const, label: 'Flatten plane' },
  { id: 'normalizeSpacing' as const, label: 'Normalize spacing' },
  { id: 'centerCluster' as const, label: 'Center on primary' },
] as const

export function StructureMenu() {
  const dispatch = useRootStore((s) => s.dispatch)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#6b7280' }} title="Applies to selected nodes. Use Undo to revert. Ghost preview is not implemented yet.">
        Layout
      </span>
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          style={{ fontSize: 12, padding: '4px 8px' }}
          onClick={() => dispatch({ type: 'structureTool', tool: t.id })}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
