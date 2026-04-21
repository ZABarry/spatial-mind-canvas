# Spatial Mind Canvas

Quest-first, **local-only** 3D mind mapping in the browser: a calm space for **solo** spatial ideation—ideas, connections, and notes on one device. Ships as a **Vite + React + TypeScript** SPA with **React Three Fiber**, **WebXR** (`@react-three/xr`), **Zustand**, and **IndexedDB** persistence—no backend required. **Collaboration and cloud sync are not the current focus**; see **[docs/product-direction.md](docs/product-direction.md)**.

**Controls and terminology (source of truth):** **[docs/controls.md](docs/controls.md)**.

**Honest scope:** **[docs/feature-status.md](docs/feature-status.md)** (shipped / partial / out of scope). **Research / validation pack:** **[docs/research/research-plan.md](docs/research/research-plan.md)**.

## Features (shipped)

| Area | What you get |
| --- | --- |
| **Graph** | Freeform nodes (multiple shapes), straight **links** (edges) between node centers, multi-select (Ctrl/Cmd+click), drag to move, **cyan link handle** to connect nodes, node collapse/expand, graph focus (dim non-neighbors); optional **parent/child** links with **Add child** and **Branch (3)** quick placement (desktop). |
| **Library & projects** | Create / rename / duplicate / delete projects; **new blank map** or **new from template**; import **JSON** or **ZIP**; export JSON or **ZIP** (full round-trip with media). |
| **Local snapshots** | **Map → Version history**: device-local checkpoints in IndexedDB (not included in JSON/ZIP export); optional “save before restore”. |
| **Persistence** | IndexedDB autosave, debounced saves, manual **Ctrl/Cmd+S** save; Zod-validated schemas; portable `.smc.zip` with `manifest.json`, `project.json`, and `media/` blobs. |
| **Media** | Attach images, PDFs, text, and generic files per node; storage **quota** checks before large writes; thumbnails for images; **PDF.js** first page in the inspector (**PdfCanvas**); markdown-style notes. |
| **Search & navigation** | Fuse.js search palette (**Ctrl/Cmd+K** or **/**), **Focus neighborhood** (**F** dims non-neighbors), **Recenter** (**Home** or **.** — primary node to orbit pivot; not the same as Reset view), bookmarks (save/recall view + optional focus node), **Reset view** (toolbar — full camera reset), **Alt+arrows** to nudge the world. |
| **Layout (optional)** | Toolbar **Layout** actions on **selection**: align (X/Y/Z), distribute (X/Y/Z), radial, flatten plane, normalize spacing, center cluster — **Undo** reverts; ghost preview before commit is not implemented. |
| **World & guides** | **World mode** vs **Travel mode**; **Axis controls** toggle for graph-local X/Y/Z handles at the origin and on nodes (`AxisGuides` — drag an axis to translate the world root or a node along that axis); **WhiteVoid** environment (desktop: **SkyGradient** at the horizon + fog; headset: tuned background/fog), **CalmParticles**. **Settings → Appearance** adjusts horizon/zenith colours, gradient falloff, and particle count/size/colour/opacity/speed for the **desktop** canvas (stored per project). |
| **VR / WebXR** | Enter VR; **`useXrControllerInputBridge`** — assist rays + configurable **sticky** slack per controller; trigger ray → select nodes, finish connections. **`xrSessionGuards`** coordinate graph selection vs world grab. **XrWorldGrab** — **controllers:** squeeze grips; **hands-only:** index–thumb pinch (optional **Workspace pinch off** comfort toggle in Settings). **Hand-primary** sets `xrHandTrackingPrimary`; **Link** stays controller-first (badge in hand mode). **XrWristMenu** — two pages, segmented tray, damped **page slide**; palm or **Y**. **XrNodeContextActions** — primary/secondary/**Delete** tiers; damped reveal. **Head-anchored HTML panels** — settle, then **world-locked** until the comfortable slot drifts enough to **re-home** (not continuous head drift); multi-open **lane nudges**; **Recall panels** re-seeds anchors. **XrPinchWorkspaceCue** — near-pinch + active grab / two-hand rings. **XrStatusHud** — **priority channel** (modals / gestures / panels / idle) to reduce stacked copy. Panels: detail, search, history, bookmarks, settings, help, prompts, confirm; **XrSessionBridge**; locomotion in Settings. **Layout** / **ZIP export** — desktop toolbar (exit VR or Library). |
| **Audio** | Optional **ambient bed** and **interaction cues** via Web Audio (`src/audio/`); **AudioAmbience** respects browser autoplay (starts after a pointer gesture). Enable or tune in Settings alongside comfort options. |
| **UX** | **Guided start** onboarding (checklist + next step; includes Recenter and Undo; **You’re set** ribbon on completion; mirrored in the XR status HUD; dismissible; persists in metadata), **Help** overlay (desktop + VR controls), **Settings** with tabs — **General** (labels, axis handles, floor grid, focus hop), **Appearance** (desktop sky + particles), **VR** (locomotion, comfort, dominant hand, XR debug HUD in dev), **Audio** — and **ConfirmModal** for destructive actions on desktop; **Node quick actions** (desktop) on the primary selection — Rename (inline popover), Add child, Link, Inspect, Delete — with **node detail** for deeper editing. In VR, **XrSettingsPanel** reuses the same form body in world space. Onboarding progress syncs via `useOnboardingProgressSync` and `onboardingModel`. Toolbar shows **save / feedback** hints during autosave and import/snapshot messages. |

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
| `npm run ci` | Quality gate: `typecheck` → `lint` → `test` → `build` (run before merging) |

## Contributing

- **Green bar:** `npm run ci` should pass (typecheck, lint, tests, production build). CI runs the same steps on push/PR via GitHub Actions (see `.github/workflows/ci.yml`).
- **Controls copy** should match **[docs/controls.md](docs/controls.md)**.
- **Product validation:** See **[docs/research/](docs/research/)** for lightweight usability study templates (solo spatial ideation thesis).

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
- **Create**: double-click the ground to place a node.
- **Select**: click a node (Ctrl/Cmd+click to add to selection).
- **Link**: drag from the **cyan link handle** on a selected node; release on another node or on the ground for a new connected node.
- **Move**: drag a node (horizontal plane).
- **Detail**: right-click or double-click a node, or press **Enter** with selection; attach files and notes in the inspector. With one node selected, use **Node quick actions** (panel) to rename, add a connected child, **Branch (3)**, start **Link**, open **Inspect**, or delete.
- **Templates & history**: home screen or **Map → New from template**; **Map → Version history** for local snapshots (see [docs/controls.md](docs/controls.md)).
- **Search**: **Ctrl/Cmd+K** or **/** — pick a result to focus.
- **Focus neighborhood**: **F** dims non-neighbors (toggle intensity via graph focus state).
- **Recenter**: **Home** or **.** — moves the primary selected node to the current orbit pivot (pan the world; different from **Reset view**, which restores the default camera framing).
- **Save**: **Ctrl/Cmd+S** forces a save (autosave also runs).
- **World**: **Alt+Arrow keys** nudge the whole graph; toolbar **Axis controls** for constrained moves along X/Y/Z.
- **Layout**: with multiple nodes selected, use toolbar **Layout** (align, distribute, radial, etc.); **Undo** to revert.
- **Undo/redo**: **Ctrl/Cmd+Z**, **Ctrl/Cmd+Shift+Z**.
- **Delete**: **Backspace** / **Delete** removes selection.
- **New map**: **Ctrl/Cmd+Shift+N**; **Clear map** from toolbar (confirm).
- **Help**: floating **?** button (lower-right) opens a short summary; full reference is **[docs/controls.md](docs/controls.md)** in the repo.
- **VR**: **Enter VR** (immersive session on supported browsers / Quest Browser).

## Quest testing (manual QA)

Use a **HTTPS** preview or production URL. For five core flows (desktop + XR + hands), see **[docs/golden-paths.md](docs/golden-paths.md)**.

- [ ] Enter immersive VR from the toolbar; scene renders (white void, particles, graph).
- [ ] Controllers: ray select nodes; trigger to activate UI affordances where applicable.
- [ ] Create nodes (workflow depends on XR pointer events hitting meshes).
- [ ] **Link in VR**: start a link from **node actions** (Link) or the link handle, then **trigger** on a target node or the ground plane to finish (same semantics as desktop).
- [ ] Toggle **Travel mode** vs **World mode** in the toolbar; move with thumbsticks in travel mode.
- [ ] In **World mode**, squeeze **grip** on a controller (or **pinch** index–thumb with hands only): move the graph with one hand; two hands: scale (pinch separation or grip separation) and opposite forward motion to yaw.
- [ ] **Library / home**: from the wrist menu choose **Library** (returns to the project home and ends the immersive session when the canvas unmounts), or exit VR from the flat toolbar **View** menu if you prefer.
- [ ] **In-headset UI**: flat search, inspector, settings, help, and the desktop onboarding strip are hidden in VR; onboarding milestones still surface as short lines on the **status HUD**. Use the **wrist menu** (page 1: Search, Undo, Recenter, Cancel, Travel/World, Help, **Settings**, Exit; **More…** for Library, History, Bookmarks, Redo, resets, **Recall panels**). Use **node actions** (strip) on a selected node (Child, Link, Inspect, Focus, Recenter; **Delete** separated). HTML panels **spawn with your view** then stay **spatial** in their lane; use **Recall panels** if they drift. **Layout** and **ZIP/JSON export** stay on the **desktop toolbar** — exit VR for those; **version history** and **bookmarks** are also available as in-VR panels from the wrist menu.
- [ ] **Node detail**: select one node, then **Inspect** on **node actions** (or double-click the node on desktop). Title, note, color, attachments, and actions use floating panels in front of you; the OS soft keyboard may appear when focusing fields (DOM Overlay is requested when supported).
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
- **Local snapshots** (version history) stay in the `mapSnapshots` store and are **not** part of JSON or ZIP exports.
- Media files are stored as binary blobs in IndexedDB and referenced from the project manifest; ZIP export includes those blobs for a full round-trip.

## Architecture (short)

- `src/app/App.tsx` — project home vs scene; wraps `SceneCanvas` in **`CanvasMountGate`** so the R3F canvas mounts after the first effect (avoids React Strict Mode double-mount tearing down WebGL/WebXR in dev).
- `src/threeMaterialOnBuildPolyfill.ts` — imported from `main.tsx`; no-op `Material.prototype.onBuild` so IWER / XR dev emulation stays compatible with three.js builds that removed `onBuild`.
- `src/store/rootStore.ts` — app state, graph edits, undo stack, autosave; `src/store/searchIndex.ts` — Fuse search index helpers.
- `src/graph/types.ts` — domain types (`NodeEntity`, edges, bookmarks, `APP_SCHEMA_VERSION`, etc.); `src/graph/defaults.ts` — blank projects, default **UserSettings** (including sky/particle defaults aligned with `SkyGradient` / `CalmParticles`); `src/graph/selectors.ts` — graph queries and **Add child** placement (`nextChildPosition`).
- `src/input/actions.ts` — semantic action union consumed by the store.
- `src/input/tools.ts` — navigation vs travel mode helpers (`NavigationMode` ↔ `InteractionMode`).
- `src/hooks/useDesktopShortcuts.ts` — global desktop keyboard shortcuts (undo/redo, save, search, focus, center on selection, world nudge, etc.).
- `src/input/adapters/useDesktopInputBridge.ts` — desktop input coordination hook (extend for centralized pointer routing).
- `src/input/adapters/useXrControllerInputBridge.ts` — XR controller ray selection, link completion, and graph interaction; imported in `SceneCanvas` as **XrControllerInputBridge** (also aliased as **XrRaycastSelect**).
- `src/input/adapters/useXrHandInputBridge.ts` — **XrHandInputStub** in the canvas sets hand-primary XR mode on the store.
- `src/input/xr/xrSessionGuards.ts` — pure guards (e.g. when to ignore XR graph select, when world grab may start) shared by the controller bridge and **XrWorldGrab**.
- `src/input/xr/handGestures.ts` — hand-tracking UX policy (e.g. when to hide advanced authoring).
- `src/input/xr/handPinchGrasp.ts` — index–thumb distance + hysteresis thresholds for **hand-primary** world grab (consumed by **XrWorldGrab**).
- `src/input/interactionPhase.ts` — high-level interaction phase notes (desktop vs modal vs search).
- `src/input/sessionTypes.ts`, `src/input/sessionMachine.ts` — interaction session **kinds** and pure helpers (link preview deduping, orbit lock); **`interactionSession`** in `rootStore` is the authoritative live gesture state.
- `src/persistence/` — IndexedDB + Zod schemas; `zipBundle.ts` for import/export archives; `snapshotPayload.ts` and `mapSnapshotRepository.ts` validate and store **Map → Version history** checkpoints.
- `src/media/` — quota helpers and image thumbnails.
- `src/audio/` — `webAudioContext`, soft **ambient** bed, and **interaction** cue helpers consumed by the UI layer.
- `src/scene/` — R3F `SceneCanvas`, environment (`WhiteVoid`, `SkyGradient`, `CalmParticles`), graph (`WorldRoot`, `InteractionPlane`, `NodeMeshes`, `EdgeMeshes`, `NodeHandles`, `AxisGuides`, `LinkPreview`, `FloorGrid`, …), shared **interaction** colors/tokens (`src/scene/visual/interactionTokens.ts` — link line, HUD hints, handle styling). WebXR (`src/scene/xr/`: `XrRaycastSelect`, `XrWorldGrab`, `XrPinchWorkspaceCue`, `XrWristMenu`, `XrNodeContextActions`, `anchors/*` — wrist/panel pose smoothing and spawns; **`XrHandMenuAnchor`** is a legacy no-op export; `XrStatusHud`, `XrNodeDetailPanel`, `XrSearchPanel`, `XrMapHistoryPanel`, `XrBookmarksPanel`, `XrSettingsPanel`, `XrHelpHud`, `XrTextPromptHud`, `XrConfirmHud`, `XrSessionBridge`, `xrMenuActions`, `xrGlobalMenuActions`, `palmFacing`, `xrSelectionRefs`). **`xrStore.ts`** configures `@react-three/xr` (blue ray pointer, DOM overlay, no auto `offerSession`); in **dev**, IWER Meta Quest 3 emulation disables the synthetic room layer so the simulator shows the app scene; production uses the device runtime only.
- `src/ui/` — HTML overlays (library, toolbar, inspector, search, structure/bookmarks menus, help, modals, `NodeQuickActions`, `AudioAmbience`); `toolbar/sceneToolbarCommands.ts` backs toolbar and XR menu actions; `onboarding/` holds onboarding state, tests, and **OnboardingProgressRoot**.
- `src/utils/xrController.ts` — controller index helpers for XR gestures.

## License

MIT — see [`LICENSE`](LICENSE).
