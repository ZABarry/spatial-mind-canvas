# Spatial Mind Canvas

Quest-first, local-only 3D mind mapping in the browser: an infinite calm white space for ideas, connections, and notes. Ships as a **Vite + React + TypeScript** SPA with **React Three Fiber**, **WebXR** (`@react-three/xr`), **Zustand**, and **IndexedDB** persistence—no backend required for v1.

## Features (shipped)

| Area | What you get |
| --- | --- |
| **Graph** | Freeform nodes (multiple shapes), straight and spline edges with graph-local control points, multi-select (Ctrl/Cmd+click), drag to move, Shift+drag to connect, node collapse/expand, graph focus (dim non-neighbors). |
| **Library & projects** | Create / rename / duplicate / delete projects; new blank map; import **JSON** or **ZIP**; export JSON or **ZIP** (full round-trip with media). |
| **Persistence** | IndexedDB autosave, debounced saves, manual **Ctrl/Cmd+S** save; Zod-validated schemas; portable `.smc.zip` with `manifest.json`, `project.json`, and `media/` blobs. |
| **Media** | Attach images, PDFs, text, and generic files per node; storage **quota** checks before large writes; thumbnails for images; **PDF.js** first page in the inspector (**PdfCanvas**); markdown-style notes. |
| **Search & navigation** | Fuse.js search palette (**Ctrl/Cmd+K** or **/**), focus selection (**F**), **center on selection** (**Home** or **.** moves the primary node to the orbit pivot), bookmarks (save/recall view + optional focus node), **Reset view** (toolbar — full camera reset), **Alt+arrows** to nudge the world. |
| **Layout (optional)** | Toolbar **Layout** actions on **selection**: align (X/Y/Z), distribute (X/Y/Z), radial, flatten plane, normalize spacing, center cluster — **Undo** reverts; ghost preview before commit is not implemented. |
| **World & guides** | **World mode** vs **Travel mode**; **Axis controls** toggle for graph-local X/Y/Z handles at the origin and on nodes; **WhiteVoid** environment (desktop: **SkyGradient** at the horizon + fog; headset: tuned background/fog), **CalmParticles**. |
| **VR / WebXR** | Enter VR; controller/hand **XrRaycastSelect** (trigger or pinch → select, drag, finish connections); **XrTwoHandLink** — with one node selected, pull the **other** controller’s trigger to start a new link (same gesture family as Shift+drag on desktop). **XrWorldGrab** — squeeze grips for world move and two-hand scale. **XrWristMenu** — floating commands panel: **hand tracking** shows it when the **left palm faces you** (hysteresis); **controllers** toggle with the **left secondary face button** (Y on typical Quest layouts). Ray **select** hits menu buttons (Library, Settings, export, undo/redo, structure tools, bookmarks, mode/axis toggles, etc.). Dedicated world-space panels: **XrNodeDetailPanel**, **XrSearchPanel**, **XrSettingsPanel**, **XrHelpHud**; **XrTextPromptHud** for in-VR text (e.g. bookmark names). **XrConfirmHud** for destructive confirms; **XrSessionBridge**; locomotion / vignette / smooth movement in Settings. |
| **UX** | Onboarding banner, **Help** overlay (desktop + VR controls), Settings (labels, locomotion, audio, comfort), **ConfirmModal** for destructive actions on desktop. |

## Prerequisites

- Node.js 20+ recommended
- **HTTPS** (or `localhost`) for WebXR — Quest Browser requires a secure context for immersive sessions

## Local setup

```bash
cd spatial-mind-canvas
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unit tests) |

## Deployment (Vercel)

This is a static SPA. Build output is `dist/`.

1. Push the repo to GitHub (see [Git](#git) below).
2. Import the repo in [Vercel](https://vercel.com) — framework **Vite**, output **`dist`**.
3. `vercel.json` rewrites all routes to `index.html` for SPA routing.

CLI:

```bash
npm i -g vercel
cd spatial-mind-canvas
vercel
```

Use a **HTTPS** deployment URL on Quest.

## Desktop testing (quick)

- **Library**: create / rename / duplicate / delete projects; import **JSON or ZIP**.
- **Scene**: double-click ground to create a node; **N** adds a node near the origin.
- **Select**: click node (Ctrl/Cmd+click to add to selection).
- **Connect**: **Shift**+drag from a node; release on another node or on the ground for a new connected node.
- **Move**: drag a node (horizontal plane).
- **Detail**: double-click a node or press **Enter** with selection; attach files and notes in the inspector.
- **Search**: **Ctrl/Cmd+K** or **/** — pick a result to focus.
- **Focus**: **F** dims non-neighbors (toggle intensity via graph focus state).
- **Center on selection**: **Home** or **.** — moves the primary selected node to the current orbit pivot (pan the world; different from **Reset view**, which restores the default camera framing).
- **Save**: **Ctrl/Cmd+S** forces a save (autosave also runs).
- **World**: **Alt+Arrow keys** nudge the whole graph; toolbar **Axis controls** for constrained moves along X/Y/Z.
- **Layout**: with multiple nodes selected, use toolbar **Layout** (align, distribute, radial, etc.); **Undo** to revert.
- **Undo/redo**: **Ctrl/Cmd+Z**, **Ctrl/Cmd+Shift+Z**.
- **Delete**: **Backspace** / **Delete** removes selection.
- **New map**: **Ctrl/Cmd+Shift+N**; **Clear map** from toolbar (confirm).
- **Help**: floating **?** button (lower-right) opens control reference.
- **VR**: **Enter VR** (immersive session on supported browsers / Quest Browser).

## Quest testing (manual QA)

Use a **HTTPS** preview or production URL.

- [ ] Enter immersive VR from the toolbar; scene renders (white void, particles, graph).
- [ ] Controllers: ray select nodes; trigger to activate UI affordances where applicable.
- [ ] Create nodes (workflow depends on XR pointer events hitting meshes).
- [ ] **Two-hand link**: select a node with one controller, then **trigger on the other** controller to start a connection; complete by selecting a target node or ground (matches **XrTwoHandLink**).
- [ ] Toggle **Travel mode** vs **World mode** in the toolbar; move with thumbsticks in travel mode.
- [ ] In **World mode**, squeeze **grip** on a controller: move the graph with one hand; squeeze **both** grips and move hands closer/farther to scale the graph.
- [ ] **Library / home**: from the wrist menu choose **Library** (returns to the project home and ends the immersive session when the canvas unmounts), or exit VR from the flat toolbar **View** menu if you prefer.
- [ ] **In-headset UI**: flat search, inspector, settings, help, and onboarding are hidden in VR. Use the **wrist menu** for **Search**, **Settings**, **Inspect** (with one node selected), **Help**, and **Save view** (bookmark name uses an in-VR prompt instead of `window.prompt`).
- [ ] **Node detail**: select one node, then **Inspect** on the wrist menu (or double-click the node on desktop). Title, note, color, attachments, and actions use floating panels in front of you; the OS soft keyboard may appear when focusing fields (DOM Overlay is requested when supported).
- [ ] Comfort: open **Settings** from the wrist menu and toggle smooth locomotion, vignette, dominant hand, move speed, and label options (vignette is minimal in v1).
- [ ] Performance: keep node count reasonable; watch frame time in Quest Browser remote debugging if needed.

## Performance checklist (Quest)

- Prefer fewer, larger labels; avoid huge node counts in one view.
- Line rendering uses `Line` from drei (screen-space width may fall back to 1px on some GL implementations).
- No heavy post-processing; fog + simple materials only.
- Ambient audio is optional and starts after first pointer gesture (browser autoplay policy).

## Git

```bash
cd spatial-mind-canvas
git init
git add .
git commit -m "feat: spatial mind canvas MVP"
```

Create a GitHub repository, then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

Or with GitHub CLI: `gh repo create spatial-mind-canvas --public --source=. --remote=origin --push`

## Data & export

- Projects and metadata live in IndexedDB (`spatial-mind-canvas` database).
- **Primary portable backup:** **Export ZIP** (toolbar) — `.smc.zip` with `manifest.json`, `project.json`, and `media/` blobs. **Import JSON / ZIP** on the home screen accepts `.zip` or `.json`.
- **Export JSON** (toolbar) downloads a single `.smc.json` (no embedded media blobs); useful for quick text backup or debugging.
- Media files are stored as binary blobs in IndexedDB and referenced from the project manifest; ZIP export includes those blobs for a full round-trip.

## Architecture (short)

- `src/store/rootStore.ts` — app state, graph edits, undo stack, autosave, search index.
- `src/graph/types.ts` — domain types (`NodeEntity`, edges, bookmarks, `APP_SCHEMA_VERSION`, etc.).
- `src/input/actions.ts` — semantic action union consumed by the store.
- `src/input/interactionPhase.ts` — high-level interaction phase notes (desktop vs modal vs search).
- `src/persistence/` — IndexedDB + Zod schemas; `zipBundle.ts` for import/export archives.
- `src/media/` — quota helpers and image thumbnails.
- `src/scene/` — R3F `SceneCanvas`, environment (`WhiteVoid`, `SkyGradient`, `CalmParticles`), graph (`WorldRoot`, `InteractionPlane`, `NodeMeshes`, `ConnectionController`, …), WebXR (`src/scene/xr/`: `XrRaycastSelect`, `XrTwoHandLink`, `XrWorldGrab`, `XrWristMenu`, `XrNodeDetailPanel`, `XrSearchPanel`, `XrSettingsPanel`, `XrHelpHud`, `XrTextPromptHud`, `XrConfirmHud`, `XrSessionBridge`, `xrMenuActions`, `palmFacing`, `xrSelectionRefs`), `xrStore.ts`.
- `src/ui/` — HTML overlays (library, toolbar, inspector, search, structure/bookmarks menus, help, modals); `toolbar/sceneToolbarCommands.ts` backs toolbar and XR menu actions.
- `src/utils/xrController.ts` — controller index helpers for XR gestures.

## License

MIT (add a `LICENSE` file if you need a formal license for your org).
