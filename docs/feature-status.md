# Feature status ledger

Honest snapshot of what ships today vs what is partial, deferred, or out of scope. Use this for planning and contributor expectations — not a marketing checklist.

| Area | Status | Notes |
|------|--------|--------|
| Solo graph editing (nodes, links, move, delete) | **Shipped** | Core loop in desktop + XR controllers. |
| Local IndexedDB projects + autosave | **Shipped** | Debounced save; manual save shortcut. |
| Import/export JSON + ZIP (with media) | **Shipped** | Snapshots excluded from export by design. |
| Local map snapshots (version history) | **Shipped** | IndexedDB only; desktop modal + XR panel from wrist menu. |
| Search (Fuse) | **Shipped** | |
| Bookmarks (saved view + graph framing) | **Shipped** | Desktop menu + XR panel; naming uses `window.prompt` on desktop, in-headset prompt in VR. |
| Layout / structure tools | **Shipped** | Desktop toolbar; not duplicated in XR wrist menu (advanced / lower frequency). |
| WebXR (Quest-class) | **Shipped** | Travel vs world nav, wrist menu, node radial, world grab, in-scene panels. |
| Hand-tracking–lite | **Partial** | Child, Inspect, menus; **Link** disabled — controllers remain the precision authoring path. |
| VR ↔ desktop parity | **Partial** | High-frequency actions on wrist + radial; layout, full export UX, and some tooling remain desktop-first by intent. |
| Collaboration / accounts / cloud sync | **Out of scope** | See [product-direction.md](product-direction.md). |
| AI features / enterprise workflows | **Out of scope** | |
| Ghost preview before layout commit | **Not started** | Undo covers layout; preview called out as future in README. |

## Known limitations (short)

- **Performance:** Large graphs + “show all labels” can stress standalone headsets — use label budget; see [performance.md](performance.md).
- **Hand tracking:** Reduced authoring; full **Link** flow expects controllers.
- **Data:** Everything is local to the browser unless the user exports.
