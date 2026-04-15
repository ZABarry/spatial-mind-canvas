import { useRootStore } from '../store/rootStore'
import { MapHistoryPanelBody } from './panels/MapHistoryPanelBody'

export function MapHistoryModal() {
  const open = useRootStore((s) => s.mapHistoryOpen)
  const xrSession = useRootStore((s) => s.xrSessionActive)
  const setOpen = useRootStore((s) => s.setMapHistoryOpen)

  if (!open || xrSession) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        setOpen(false)
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-history-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}
      >
        <MapHistoryPanelBody variant="modal" />
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
