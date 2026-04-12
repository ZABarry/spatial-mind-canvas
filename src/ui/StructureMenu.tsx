import { useRootStore } from '../store/rootStore'
import { STRUCTURE_MENU_TOOLS } from './structureMenuTools'

/** Layout tools for the toolbar Layout menu (selected nodes; Undo reverts). */
export function StructureMenuContent() {
  const dispatch = useRootStore((s) => s.dispatch)
  return (
    <>
      <p
        className="toolbar-menu-hint"
        title="Applies to selected nodes. Ghost preview is not implemented yet."
      >
        Selected nodes only — use Undo to revert.
      </p>
      <div className="toolbar-menu-button-grid">
        {STRUCTURE_MENU_TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dispatch({ type: 'structureTool', tool: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
    </>
  )
}
