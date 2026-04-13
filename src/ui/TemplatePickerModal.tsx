import { STARTER_TEMPLATES } from '../graph/templates'
import { useRootStore } from '../store/rootStore'

export function TemplatePickerModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const newProjectFromTemplate = useRootStore((s) => s.newProjectFromTemplate)

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tpl-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        <h2 id="tpl-title">New map from template</h2>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
          Starts a new saved project. Your current map is unchanged unless you switch back in the library.
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STARTER_TEMPLATES.filter((t) => t.showInPicker).map((t) => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              <button
                type="button"
                className="panel"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#fafbfc',
                }}
                onClick={() => {
                  void (async () => {
                    await newProjectFromTemplate(t.id)
                    onClose()
                  })()
                }}
              >
                <strong style={{ display: 'block' }}>{t.title}</strong>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{t.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
