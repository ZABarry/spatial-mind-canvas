import { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'

/** Replaces `window.prompt` while immersive (bookmark name, etc.). */
export function XrTextPromptHud() {
  const session = useXR((s) => s.session)
  const dialog = useRootStore((s) => s.textPromptDialog)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session && dialog) inputRef.current?.focus()
  }, [session, dialog])

  if (!session || !dialog) return null

  const fieldKey = `${dialog.title}:${dialog.defaultValue}`

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
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') useRootStore.setState({ textPromptDialog: null })
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>{dialog.title}</h3>
          <input
            key={fieldKey}
            ref={inputRef}
            type="text"
            defaultValue={dialog.defaultValue}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 16,
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim()
                const fn = dialog.onSubmit
                useRootStore.setState({ textPromptDialog: null })
                fn(v)
              }
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => useRootStore.setState({ textPromptDialog: null })}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                const v = inputRef.current?.value.trim() ?? ''
                const fn = dialog.onSubmit
                useRootStore.setState({ textPromptDialog: null })
                fn(v)
              }}
              style={{ padding: '8px 14px', borderRadius: 8 }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Html>
  )
}
