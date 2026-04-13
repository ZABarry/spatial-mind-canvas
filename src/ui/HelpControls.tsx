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
                    <strong>Getting started</strong> — A compact <strong>Start here</strong> strip guides place →
                    select → link or child → rename or Inspect; dismiss anytime. It stays out of the way once you finish
                    or dismiss.
                  </li>
                  <li>
                    <strong>Navigate</strong> — Drag to orbit, scroll to zoom.
                  </li>
                  <li>
                    <strong>New node</strong> — Double-click empty ground.
                  </li>
                  <li>
                    <strong>Quick actions</strong> — With a node selected, use the top-left strip (Rename, Add child,
                    Link, Inspect, Delete) for the common loop; <strong>node detail</strong> is for notes, media, and
                    fine edits.
                  </li>
                  <li>
                    <strong>Link</strong> — Drag from the cyan link handle on a selected node. The preview line turns
                    teal when aimed at a valid target node, soft cyan toward empty ground, and warm amber if you aim back
                    at the source (release on the source to cancel).
                  </li>
                  <li>
                    <strong>Sound</strong> — When enabled under <strong>Device &amp; VR</strong>, you get a very soft
                    ambient bed plus short cues for select, link, undo, menus, and confirms (after your first click so
                    the browser allows audio).
                  </li>
                  <li>
                    <strong>Select</strong> — Click a node or edge. <Kbd>Ctrl</Kbd>/<Kbd>⌘</Kbd> + click to add nodes;
                    <Kbd>Shift</Kbd> + click edges to add edges.
                  </li>
                  <li>
                    <strong>Move</strong> — Drag a node (if not pinned).
                  </li>
                  <li>
                    <strong>Inspect (node detail)</strong> — Right-click or double-click a node, or select one and
                    press <Kbd>Enter</Kbd>.
                  </li>
                  <li>
                    <strong>Focus neighborhood</strong> — <Kbd>F</Kbd> dims the graph to neighbors (not the same as
                    Recenter).
                  </li>
                  <li>
                    <strong>Recenter</strong> — <Kbd>Home</Kbd> or <Kbd>.</Kbd> pans so the primary node sits at the
                    orbit pivot (different from <strong>Reset view</strong> in the toolbar).
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
                    <strong>Clear / cancel</strong> — <Kbd>Esc</Kbd> (clears selection, closes panels, cancels an
                    in-progress link, node drag, or world grab)
                  </li>
                </ul>
              </section>

              <section className="help-section" aria-labelledby="help-vr">
                <h3 id="help-vr">VR</h3>
                <ul className="help-list">
                  <li>
                    <strong>Enter VR</strong> — Use the primary <strong>Enter VR</strong> button in the bottom toolbar,
                    then confirm in the headset or browser.
                  </li>
                  <li>
                    <strong>Travel vs world</strong> — <strong>Travel mode</strong> enables thumbstick movement and
                    turning. <strong>World mode</strong> turns off locomotion so you stay put for fine adjustments.
                    This is separate from <strong>camera passthrough</strong> (mixed reality), which you can prefer when
                    entering XR and adjust under <strong>Device &amp; VR</strong> in Settings.
                  </li>
                  <li>
                    <strong>Locomotion options</strong> — Under <strong>Device &amp; VR</strong> in Settings (stored for
                    this browser, not inside map files): smooth or snap turning, move speed, comfort vignette, and
                    dominant hand (biases controller aim; travel sticks stay left move / right turn).
                  </li>
                  <li>
                    <strong>Sound</strong> — Optional ambient bed and soft interaction cues (same toggle as desktop),
                    after a click or trigger so the browser unlocks audio.
                  </li>
                  <li>
                    <strong>Scene</strong> — Point the controller ray and use the trigger to select nodes; in{' '}
                    <strong>World</strong> tool mode, trigger completes or cancels links as described in the in-headset
                    status HUD.
                  </li>
                  <li>
                    <strong>Wrist menu (global)</strong> — On the <strong>left</strong>: with <strong>controllers</strong>,
                    toggle with the <strong>secondary face button</strong> (often Y); with <strong>hand tracking</strong>,
                    turn your palm toward you. Includes Library, Search, Settings, Undo, Redo, <strong>Reset view</strong>,{' '}
                    <strong>Recenter</strong> (same as Home on desktop), <strong>Reset scale</strong>,{' '}
                    <strong>Cancel</strong>, <strong>Switch to Travel / Switch to World</strong>, Help, Exit VR. The{' '}
                    <strong>node radial</strong> holds Child, Link, Inspect, Delete, Focus, and Recenter.{' '}
                    <strong>Layout</strong>, <strong>bookmarks</strong>, and <strong>export</strong> stay on the flat
                    toolbar (exit VR to use them).
                  </li>
                  <li>
                    <strong>Status HUD</strong> — Shows tool mode, navigation mode, selection, active gesture, and
                    recovery hints in front of you. While linking, the hint text shifts toward teal when you aim at a
                    valid target node.
                  </li>
                  <li>
                    <strong>Node radial</strong> — When a node is selected, an arc appears beside it:{' '}
                    <strong>Child</strong>, <strong>Link</strong> (controllers), <strong>Inspect</strong>,{' '}
                    <strong>Delete</strong>, <strong>Focus neighborhood</strong>, <strong>Recenter</strong>.{' '}
                    <strong>Hand-tracking–lite</strong> sessions intentionally disable Link on the radial; use
                    controllers for full Link authoring.
                  </li>
                  <li>
                    <strong>Flat toolbar</strong> — Exit the XR session (or use <strong>Exit VR</strong> in the wrist
                    menu) to use the full HTML toolbar, inspector, and search on the monitor; some actions are also
                    available from the wrist menu while immersed.
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
