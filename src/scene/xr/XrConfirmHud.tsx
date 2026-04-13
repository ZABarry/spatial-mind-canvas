import { Html } from '@react-three/drei'
import { useEffect } from 'react'
import { useXR } from '@react-three/xr'
import { confirmAcceptCueKind, playInteractionCue } from '../../audio/interactionCues'
import { useRootStore } from '../../store/rootStore'

/** Confirmation UI visible inside immersive XR (DOM overlay is not always available). */
export function XrConfirmHud() {
  const session = useXR((s) => s.session)
  const dialog = useRootStore((s) => s.confirmDialog)

  useEffect(() => {
    if (!session || !dialog) return
    const a = useRootStore.getState().devicePreferences.audioEnabled
    if (a) playInteractionCue('confirmOpen', true)
  }, [session, dialog])

  if (!session || !dialog) return null

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
            maxWidth: 400,
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{dialog.title}</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#4b5563' }}>{dialog.message}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => useRootStore.setState({ confirmDialog: null })}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                const fn = dialog.onConfirm
                const a = useRootStore.getState().devicePreferences.audioEnabled
                playInteractionCue(confirmAcceptCueKind(dialog.title, dialog.message), a)
                useRootStore.setState({ confirmDialog: null })
                fn()
              }}
              style={{ padding: '8px 14px', borderRadius: 8 }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Html>
  )
}
