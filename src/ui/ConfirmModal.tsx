import { useRootStore } from '../store/rootStore'

export function ConfirmModal() {
  const dialog = useRootStore((s) => s.confirmDialog)
  const xrSession = useRootStore((s) => s.xrSessionActive)
  const setDialog = (v: typeof dialog) => useRootStore.setState({ confirmDialog: v })

  if (!dialog || xrSession) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => setDialog(null)}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{dialog.title}</h2>
        <p style={{ margin: 0, color: '#4a5568' }}>{dialog.message}</p>
        <div className="modal-actions">
          <button type="button" onClick={() => setDialog(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            style={{
              background: '#3d5a80',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onClick={() => {
              dialog.onConfirm()
              setDialog(null)
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
