import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import { XR_HELP_TIPS } from './productCopy'

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
            {XR_HELP_TIPS.map((t) => (
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
