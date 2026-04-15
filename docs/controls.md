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
| **Hand-tracking–lite** | WebXR session with **hands only** (no tracked gamepad controllers). **Link** on **node actions** is disabled; Child and Inspect remain. Pinch grab moves/scales the **world** in World mode (not node-precision authoring). Controllers are the full authoring path for Link and heavy edits. |

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

### Settings

Opened from the toolbar (desktop) or the **wrist menu** in VR. Tabs: **General**, **Appearance**, **VR**, **Audio**. Settings are stored on the **current project**.

- **General** — Show all labels / label budget, world axis drag handles, floor grid, focus hop depth.
- **Appearance** — **Desktop canvas only:** horizon/zenith colours and gradient falloff for the sky (`SkyGradient`), plus ambient **CalmParticles** (count, size, colour, opacity, speed; count **0** turns particles off). Advanced controls are grouped under **Advanced appearance**.
- **VR** — Locomotion (smooth vs snap turn, move speed, etc.), comfort (vignette), dominant hand, optional passthrough preference, optional XR debug HUD in dev.
- **Audio** — Enable ambient/interaction audio and levels where exposed.

In VR, the settings panel is a world-space **HTML** surface (`XrSettingsPanel`); **Escape** closes it when focused. Panels spawn in **left / center / near-right / right** lanes: they **track the head slot briefly**, then **settle** as a stable world pose (orientation still eases to face you). Opening a panel in VR **re-seeds** its anchor from the current view. If a panel feels lost, use **wrist menu → More… → Recall panels** to re-anchor all lanes.

## XR controllers

- **Enter VR** — Toolbar primary button; confirm in headset/browser.
- **Select** — Ray and **trigger** on nodes (and to complete gestures per HUD).
- **Travel vs World** (nav) — **Travel** = thumbstick locomotion; **World** = stay put for fine graph work (see terminology).
- **Wrist menu (left)** — Controllers: **secondary face button** (often Y). **Page 1:** Search, Undo, Recenter, Cancel, switch Travel/World, Help, **Settings**, **More…**, **Exit VR** (full-width row). **Page 2:** Library, History, Bookmarks, Redo, Reset view, Reset scale, **Recall panels** (full-width), **« Back**.
- **Node actions** — Primary row **Child**, **Link**, **Inspect**; secondary **Focus**, **Recenter**; **Delete** in a **separated column** (not mixed into the primary row). Billboard toward you; distance-aware scale; subtle plate behind the cluster. Hand mode: **Link** shows a **Controllers** badge — use tracked controllers for reliable Link.
- **World grab** — **World** mode: controllers squeeze **grip**; hands-only: **index–thumb pinch** on each hand. One hand: translate. Two: pinch/grip separation scales; opposite forward motion yaws (thresholds reduce accidental scale vs yaw coupling). A subtle **ring near the pinch** can appear when a grab is almost armed (hand-primary).
- **Layout, bookmarks, export** — Primarily on the **flat** toolbar; exit VR or use Library as implemented.

## Hand-tracking–lite

- **Menu** — Palm toward you (left hand) to open the wrist menu (when hands-only session is active). Uses a short dwell + stricter palm score so casual wrist motion does not open it.
- **World grab** — Pinch index–thumb (both hands for scale/yaw) in World mode; same guard rules as controller grips (blocked during menus/modals/link). Optional **Settings → VR → Disable hand pinch for moving/scaling workspace** if you want controllers only for workspace moves (locks hand workspace manipulation, not UI).
- **Link** — Disabled on **node actions** with a short cue; use **controllers** for full Link authoring.
- **Child / Inspect** — Available on the strip per current implementation.
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
| **Recall panels** (VR wrist, page 2) | Re-snap floating HTML panels to a comfortable pose in front of you. |

## Local snapshots (version history)

- **Create / restore** from **Map → Version history** while editing a map.
- Stored only in **this browser’s IndexedDB**, keyed by project. **Not** in JSON/ZIP export.
- **Restore** can optionally create a **Before restore** snapshot first (recommended default).
- Old snapshots are **dropped automatically** when the per-map cap is exceeded (see README).

## Known limitations

- **Hand tracking** is a reduced authoring mode; precision graph work and **Link** favor controllers.
- **Export / layout** use the **desktop toolbar** (exit VR or return to Library). **Bookmarks** and **version history** also have **in-VR panels** from the wrist menu.
- **Performance** — Large graphs and “show all labels” can stress standalone headsets; use label budget and see [performance.md](performance.md) for QA targets.
- **Collaboration, accounts, and cloud sync** are **not** part of the current product (see [product-direction.md](product-direction.md)).

See **[feature-status.md](feature-status.md)** for a fuller shipped / partial / out-of-scope ledger.
