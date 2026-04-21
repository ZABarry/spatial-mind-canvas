# Performance budgets (Quest-class targets)

These are **guidelines** for Meta Quest Browser / WebXR on standalone headsets. Desktop can exceed them.

| Area | Target | Implementation notes |
|------|--------|----------------------|
| Visible node labels | Default **32** (settings: `labelBudget`) | Distance-sorted + always show selection/hover; avoid “show all” on device |
| Scene particles | Keep instanced counts modest | See [`CalmParticles`](../src/scene/environment/CalmParticles.tsx) — avoid raising without profiling |
| Line rendering | `Line` from drei may fall back to 1px width on some GL | Prefer fewer edges on screen when possible |
| Post-processing | None in v1 | Fog + simple materials only |
| PDF / images in inspector | First PDF page only; image max display ~280px tall | Full-resolution textures not drawn in 3D yet |
| Axis guides (toolbar **Axis controls**) | Extra meshes/handles at origin and on nodes | Disable on Quest if frame time spikes; prefer moving the whole graph in world mode |
| XR wrist menu | Extra 3D UI (segmented tray + text) when open or palm-visible | Same guidance as labels — open only when needed; hand-tracking palm panel adds pose work each frame |
| XR floating panels (search, map history, bookmarks, settings, node detail, help, text prompt) | World-space HTML; **settle** then **world-lock** with occasional **re-home**; re-seed on open / **Recall panels** | Close when finished; avoid stacking many heavy DOM surfaces; recall if GPU time spikes |
| Frame time | Aim for **≤ 12 ms** GPU frame when editing on Quest | Use Quest Browser remote debugging |

When importing large media, the app checks **storage quota** before writing blobs (`navigator.storage.estimate`).

Adjust budgets in **Settings** (per map): `labelBudget`, `showAllLabels`.

## Instrumentation (dev / QA)

In **development**, enable **Settings → VR → XR debug HUD** while in a headset to show a compact metrics line on the **status HUD** (node/edge counts, label budget vs approximate visible labels, media counts, open panel count, input mode). Use this when validating Quest performance.

### Concrete targets to test against

| Signal | Comfortable band | Investigate if… |
|--------|------------------|-----------------|
| Node count | **&lt; 200** nodes for fluid editing on Quest | Frame drops when panning with many visible meshes |
| Edge count | Scales with nodes; **&lt; 400** edges typical | Line draw cost + intersection tests |
| Visible labels | At or below **label budget** (default 32) | “Show all labels” on device |
| Nodes with attachments | **&gt; 30** nodes with media | Inspector + thumbnails; large PDFs |
| Open XR panels | **≤ 2** heavy panels at once | Stacking search + settings + detail + history |

**Remote debugging:** Chrome/Edge **inspect** Quest Browser → Performance panel; aim for stable frame time while editing.
