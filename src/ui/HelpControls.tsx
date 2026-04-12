import { useEffect, useState, type ReactNode } from 'react'

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        background: '#e8eef8',
        border: '1px solid #c9d6ea',
        color: '#1c2330',
      }}
    >
      {children}
    </kbd>
  )
}

export function HelpControls() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="help-control-btn panel"
        aria-label="Help: desktop and VR controls"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        title="Help"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-1.05-3.85c.1-.97.45-1.38 1.12-1.95.55-.47 1.18-1 1.18-2.05 0-1.66-1.34-2.75-3-2.75-1.55 0-2.75 1.05-2.95 2.45a.75.75 0 1 0 1.48.2c.1-.65.57-1.15 1.47-1.15.85 0 1.5.55 1.5 1.25 0 .55-.3.85-.77 1.25-.75.62-1.43 1.35-1.43 2.8v.25a.75.75 0 0 0 1.5 0v-.15c0-.65.25-.95.85-1.45Z"
            fill="currentColor"
          />
          <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <div
          className="modal-backdrop help-modal-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="help-title">Controls</h2>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
              Reference for the canvas on desktop and in VR.
            </p>

            <div className="help-columns">
              <section className="help-section" aria-labelledby="help-desktop">
                <h3 id="help-desktop">Desktop</h3>
                <ul className="help-list">
                  <li>
                    <strong>Navigate</strong> — Drag to orbit, scroll to zoom.
                  </li>
                  <li>
                    <strong>New node</strong> — Double-click empty ground, or <Kbd>N</Kbd> at the origin.
                  </li>
                  <li>
                    <strong>Connect</strong> — <Kbd>Shift</Kbd> + drag from a node; release on another node or empty
                    ground.
                  </li>
                  <li>
                    <strong>Select</strong> — Click a node or edge. <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd> + click to add nodes;
                    <Kbd>Shift</Kbd> + click edges to add edges.
                  </li>
                  <li>
                    <strong>Move</strong> — Drag a node (if not pinned).
                  </li>
                  <li>
                    <strong>Node detail</strong> — Double-click a node, or select one and press <Kbd>Enter</Kbd>.
                  </li>
                  <li>
                    <strong>Focus</strong> — <Kbd>F</Kbd>
                  </li>
                  <li>
                    <strong>Delete</strong> — <Kbd>Delete</Kbd> or <Kbd>Backspace</Kbd>
                  </li>
                  <li>
                    <strong>Undo / redo</strong> — <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd>+<Kbd>Z</Kbd>,{' '}
                    <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Z</Kbd>
                  </li>
                  <li>
                    <strong>Save</strong> — <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd>+<Kbd>S</Kbd>
                  </li>
                  <li>
                    <strong>Search</strong> — <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd>+<Kbd>K</Kbd> or <Kbd>/</Kbd>
                  </li>
                  <li>
                    <strong>Pan world</strong> — <Kbd>Alt</Kbd> + arrow keys
                  </li>
                  <li>
                    <strong>Clear / cancel</strong> — <Kbd>Esc</Kbd> (clears selection, closes panels, cancels
                    connection)
                  </li>
                </ul>
              </section>

              <section className="help-section" aria-labelledby="help-vr">
                <h3 id="help-vr">VR</h3>
                <ul className="help-list">
                  <li>
                    <strong>Enter VR</strong> — Open the <strong>View</strong> menu in the toolbar, choose{' '}
                    <strong>Enter VR</strong>, then confirm in the headset or browser.
                  </li>
                  <li>
                    <strong>Travel vs world</strong> — <strong>Travel mode</strong> enables thumbstick movement and
                    turning. <strong>World mode</strong> turns off locomotion so you stay put for fine adjustments.
                  </li>
                  <li>
                    <strong>Locomotion options</strong> — In Settings: smooth or snap turning, move speed, comfort
                    vignette, and dominant hand (affects which controller drives movement/turning).
                  </li>
                  <li>
                    <strong>Scene</strong> — Point the controller or hand ray and use the trigger (or pinch) to select
                    nodes and edges, drag nodes, and complete connections. With <strong>one node selected</strong>, pull
                    the <strong>other</strong> controller’s trigger to <strong>start a new link</strong> (like{' '}
                    <Kbd>Shift</Kbd>+drag on desktop).
                  </li>
                  <li>
                    <strong>Wrist menu</strong> — On the <strong>left</strong> side: with <strong>controllers</strong>,
                    toggle the floating panel with the <strong>secondary face button</strong> (often Y); with{' '}
                    <strong>hand tracking</strong>, turn your palm toward you to show it. Raycast buttons for Library,
                    Settings, export, undo/redo, travel/world mode, axis toggle, focus, structure tools, bookmarks, and
                    more.
                  </li>
                  <li>
                    <strong>Flat toolbar</strong> — You can exit VR from <strong>View → Enter VR</strong> (or leave
                    the session) to use the full HTML toolbar, inspector, and search on the monitor; some actions are
                    also available from the wrist menu while immersed.
                  </li>
                </ul>
              </section>
            </div>

            <div className="modal-actions">
              <button type="button" className="primary" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
