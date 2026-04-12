# Performance budgets (Quest-class targets)

These are **guidelines** for Meta Quest Browser / WebXR on standalone headsets. Desktop can exceed them.

| Area | Target | Implementation notes |
|------|--------|----------------------|
| Visible node labels | Default **32** (settings: `labelBudget`) | Distance-sorted + always show selection/hover; avoid “show all” on device |
| Scene particles | Keep instanced counts modest | See `CalmParticles` — avoid raising without profiling |
| Line rendering | `Line` from drei may fall back to 1px width on some GL | Prefer fewer edges on screen when possible |
| Post-processing | None in v1 | Fog + simple materials only |
| PDF / images in inspector | First PDF page only; image max display ~280px tall | Full-resolution textures not drawn in 3D yet |
| Axis guides (toolbar **Axis controls**) | Extra meshes/handles at origin and on nodes | Disable on Quest if frame time spikes; prefer moving the whole graph in world mode |
| Frame time | Aim for **≤ 12 ms** GPU frame when editing on Quest | Use Quest Browser remote debugging |

When importing large media, the app checks **storage quota** before writing blobs (`navigator.storage.estimate`).

Adjust budgets in **Settings** (per map): `labelBudget`, `showAllLabels`.
