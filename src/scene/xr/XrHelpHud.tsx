import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

const tips = [
  'Travel vs world — Travel: left stick moves/strafes, right stick turns (dominant hand in Settings biases aim only). World: no locomotion; trigger selects; grip or hand pinch moves/scales the graph when not in a menu or modal.',
  'Recovery — Reset view: default camera framing. Recenter: orbit pivot to primary selection. Reset scale: graph scale to 1. Cancel: closes panels, help, and in-progress gestures.',
  'Scene — Trigger selects nodes. With a link active, aim at another node or the plane to finish; aim at the source node to cancel. Controllers use the trigger; hand tracking uses the pointer.',
  'Panels — Search, detail, settings, etc. use left/center/right lanes; they ease toward your view (not a rigid HUD). Use wrist menu → More… → Recall panels if a panel feels lost.',
  'Wrist menu — Y (controllers) or palm toward you (hands). Page 1: Search, Undo, Recenter, Cancel, Travel/World, Help, Exit VR, More…. Page 2: Library, History, Bookmarks, Settings, Redo, Reset view, Reset scale, Recall panels, Back.',
  'Node actions — Primary row: Child, Link (controllers), Inspect. Secondary: Focus, Recenter. Delete sits below. Hand-tracking–lite: Link shows a controllers badge; Child and Inspect stay available.',
  'Hand-tracking–lite — Select, wrist menu, optional pinch workspace grab (World mode; can disable in Settings), node actions, Cancel. Controllers remain the full authoring path for Link and precision edits.',
  'Passthrough — Prefer camera passthrough when entering XR under Device & VR in Settings.',
  'World grab — World mode: controllers squeeze grip; hands-only: index–thumb pinch (arming hint on status ribbon). One hand: move graph. Two: scale and gentle yaw. Blocked while linking, dragging, or using wrist/menu/node-actions/modals.',
]

export function XrHelpHud() {
  const session = useXR((s) => s.session)
  const open = useRootStore((s) => s.xrHelpOpen)

  if (!session || !open) return null

  return (
    <Html fullscreen style={{ pointerEvents: 'auto' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,18,24,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '20px 24px',
            maxWidth: 480,
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>VR controls</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            {tips.map((t) => (
              <li key={t} style={{ marginBottom: 8 }}>
                {t}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              className="primary"
              onClick={() => useRootStore.setState({ xrHelpOpen: false })}
              style={{ padding: '8px 14px', borderRadius: 8 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Html>
  )
}
