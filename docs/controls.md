# Controls and terminology (source of truth)

This document is the **authoritative** reference for input, recovery actions, and naming. The in-app **Help** overlay is a short summary; behavior matches this file for the **current** implementation.

## Terminology

| Term | Meaning |
| --- | --- |
| **Link** | A connection between two nodes (edge). The UI says **Link**, not “connect”. |
| **Inspect** | Open **node detail** (inspector) for deeper editing: notes, media, tags, shape, etc. |
| **Node detail** | The full inspector panel for one node (same action as **Inspect** on desktop/XR). |
| **World mode** (nav) | **Navigation mode** = adjust the graph in place; no thumbstick locomotion. Paired with **interaction** “world manip” for moving/scaling the world. |
| **Travel mode** (nav) | **Navigation mode** = thumbstick move and turn in XR. Distinct from **World** above. |
| **Recenter** | Pan the world so the **primary** selected node aligns with the orbit pivot (desktop: **Home** or **.**). Not the same as **Reset view**. |
| **Reset view** | Toolbar / wrist menu: restore default **camera** framing (and related view reset). |
| **Reset scale** | Toolbar / wrist: reset **world graph scale** toward default (uniform scale), not the same as Recenter or Reset view. |
| **Hand-tracking–lite** | WebXR session with **hands only** (no tracked gamepad controllers). **Link** on the node radial is disabled; Child and Inspect remain. Controllers are the full authoring path for Link. |

## Desktop

- **Navigate** — Drag to orbit, scroll to zoom.
- **New node** — Double-click empty ground.
- **Select** — Click node/edge; **Ctrl/Cmd+click** add nodes; **Shift+click** edges to add edges to selection.
- **Quick actions** (one node selected) — Rename, **Add child**, **Branch (3)** (three children, one undo), **Link**, **Inspect**, Delete.
- **Link** — Drag from the **cyan link handle** on the selected node; release on a target node or empty ground.
- **Inspect / node detail** — Right-click or double-click a node, or select one and press **Enter**.
- **Focus neighborhood** — **F** dims non-neighbors (not Recenter).
- **Recenter** — **Home** or **.** (primary node to orbit pivot).
- **Delete** — **Delete** / **Backspace** on selection.
- **Undo / redo** — **Ctrl/Cmd+Z**, **Ctrl/Cmd+Shift+Z**.
- **Save** — **Ctrl/Cmd+S** (autosave also runs).
- **Search** — **Ctrl/Cmd+K** or **/**.
- **New blank map** — **Ctrl/Cmd+Shift+N**.
- **Pan world** — **Alt** + arrow keys.
- **Escape** — Clear/cancel: selection, panels, in-progress link, node drag, world grab (see recovery below).

### Map menu (toolbar)

- **Version history** — Local snapshots of the **current map** (IndexedDB). Not included in export.
- **New from template** — Creates a **new** saved project from a starter layout.
- **Export JSON / ZIP** — **Current map** (and media for ZIP) only. **Snapshots are not included.**

## XR controllers

- **Enter VR** — Toolbar primary button; confirm in headset/browser.
- **Select** — Ray and **trigger** on nodes (and to complete gestures per HUD).
- **Travel vs World** (nav) — **Travel** = thumbstick locomotion; **World** = stay put for fine graph work (see terminology).
- **Wrist menu (left)** — Controllers: **secondary face button** (often Y). Global: Library, Search, Settings, Undo, Redo, **Reset view**, **Recenter**, **Reset scale**, **Cancel**, switch Travel/World, Help, Exit VR.
- **Node radial** — **Child**, **Link**, **Inspect**, Delete, Focus, Recenter (exact set as implemented).
- **World grab** — **World** mode: squeeze **grip** to move graph; two-hand scale with both grips.
- **Layout, bookmarks, export** — Primarily on the **flat** toolbar; exit VR or use Library as implemented.

## Hand-tracking–lite

- **Menu** — Palm toward you (left hand) to open the wrist menu (when hands-only session is active).
- **Link** — Disabled on the radial with a short cue; use **controllers** for full Link authoring.
- **Child / Inspect** — Available on the radial per current implementation.
- **Status HUD** — Shows mode expectations for hand-primary sessions.

## Recovery actions

| Action | What it does |
| --- | --- |
| **Undo / Redo** | One logical graph/world edit step (including some gestures that commit on release). |
| **Cancel** (wrist) | Clears in-progress link, placement, or similar; pairs with **Esc** on desktop. |
| **Reset view** | Camera/view framing reset (not graph content). |
| **Recenter** | Align primary selection with orbit pivot / framing (see terminology). |
| **Reset scale** | World scale multiplier toward default. |
| **Escape** (desktop) | Broad cancel + clear selection and close panels/search as implemented. |

## Local snapshots (version history)

- **Create / restore** from **Map → Version history** while editing a map.
- Stored only in **this browser’s IndexedDB**, keyed by project. **Not** in JSON/ZIP export.
- **Restore** can optionally create a **Before restore** snapshot first (recommended default).
- Old snapshots are **dropped automatically** when the per-map cap is exceeded (see README).

## Known limitations

- **Hand tracking** is a reduced authoring mode; precision graph work and **Link** favor controllers.
- **Export / layout / bookmarks** may require exiting VR for the full desktop toolbar.
- **Performance** — Large graphs and “show all labels” can stress standalone headsets; use label budget.
- **Collaboration, accounts, and cloud sync** are **not** part of the current product (see [product-direction.md](product-direction.md)).
