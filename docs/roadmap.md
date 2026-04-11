# Spatial Mind Canvas — Roadmap

This document reconstructs the **product intent**, **technical plan**, **milestones**, and **backlog** from the original build prompt, the Cursor implementation plan, ChatGPT guardrails, and the current [README](../README.md).

---

## Product posture (v1)

| Axis | Stance |
|------|--------|
| Platform | Quest-first WebXR + full desktop (mouse & keyboard) |
| Data | Local-first, single-user; no cloud sync, collaboration, or auth in v1 |
| UX | Calm, minimal, meditative “infinite white mind-space”; native spatial thinking, not flat diagramming pasted into VR |
| Graph | **Freeform by default** — optional structure tools only when explicitly invoked; never auto-run layout in the background |

**Priority order:** (1) UX & interaction quality → (2) Quest + desktop input reliability → (3) aesthetic → (4) persistence & multi-project → (5) clean architecture → (6) Quest-class performance.

**Core loop:** create → connect → enrich → reorganize → explore → reflect.

**Interaction modes:** **World manipulation** (default, “god mode”) vs **Travel mode**; desktop must support all major workflows.

---

## Technical stack (locked)

- **Vite + React + TypeScript** SPA (no Next.js); static deploy to Vercel (`dist/`, SPA rewrites).
- **three.js** via `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`.
- **Zustand** for application state.
- **IndexedDB** (e.g. `idb`) for projects; **Zod** at persistence/import boundaries.
- **Semantic action layer** (`src/input/actions.ts`) — input adapters dispatch typed actions; scene logic does not bind directly to raw device events.

**Architecture direction:** UI / XR / desktop → action dispatcher → graph commands & history → domain → persistence & media (repository interfaces reserved for future remote adapters, not implemented in v1).

**Suggested layout (reference):** `src/app`, `src/scene`, `src/graph`, `src/input`, `src/store`, `src/persistence`, `src/media`, `src/ui`, tests and utils — see repo for actual structure (`rootStore`, `SceneCanvas`, etc.).

---

## Engineering guardrails (pre-code / ongoing)

These amendments apply on top of the base plan:

1. **Graph-local geometry** — Node positions, edge spline control points, structure-tool previews, and bookmarks should live in the graph’s coordinate system under the world root. Avoid storing splines only in world space after the user has rotated/scaled the universe.
2. **Interaction state machine** — Mutually exclusive high-level states (e.g. idle, hovering, placingNode, draggingNode, drawingEdge, grabbingWorld, nodeDetail, travel, modalConfirm) so desktop, controllers, and hand tracking do not conflict.
3. **Export UX** — Prefer a **single downloadable `.zip`** with `manifest.json` for portable backup; JSON-only export can remain as a stepping stone (current README describes JSON `.smc.json`).
4. **Quota-aware media** — Use Storage API `estimate()` where appropriate; warn before large imports; surface quota failures clearly.
5. **Multi-select** — Shift+click (and later lasso/box) so optional structure tools have a natural selection model on desktop.
6. **Label policy on Quest** — Prefer selected / nearby / focus; distance fade or cull; hard budget; “show all labels” non-default or debug-only.
7. **Clear-map semantics** — Clearing the current map should also reset undo/redo, transient interaction (connection draft, placement preview), search state, detail UI, and pending modals where applicable, so the app never sits in a half-cleared state.
8. **Performance budgets** — Define targets (e.g. max visible labels, particle cap, max texture/page resolution for media, frame-time goals for idle vs active editing) and document them; optimize for Quest from the start.
9. **Media cost** — Thumbnails for galleries, lazy full-resolution loads, cap texture resolution on Quest, unload hidden panels.
10. **Secure context early** — WebXR requires HTTPS (or localhost); validate HTTPS preview/deploy paths for Quest testing from Milestone 1 onward.
11. **PDF** — Use PDF.js **display** layer into custom spatial panels; avoid embedding the stock viewer UI.

---

## Data model (summary)

Types should cover at least: **Project**, **Graph**, **Node**, **Edge**, **MediaAttachment**, **Bookmark**, **WorldTransform**, **UserSettings**, **SelectionState**, **HistoryEntry**, **AppSchemaVersion**. Edges support straight vs spline with **control points in graph space**. Projects include metadata, graph, bookmarks, world transform, settings, and schema version for migrations.

---

## Milestones (build order)

Each milestone should end with **runnable desktop build**, **lint / typecheck / test green**, and (where relevant) **Quest smoke** on HTTPS.

| # | Name | Scope |
|---|------|--------|
| **M1** | Foundation | Scaffold Vite React-TS, ESLint, Prettier, Vitest; app shell (project home vs scene); infinite white void (fog, soft light, cheap particles); desktop camera; XR bootstrap; IndexedDB persistence skeleton; project library CRUD; new blank map & clear map (with confirmation); `vercel.json` SPA rewrites; README & deploy notes; **HTTPS path for Quest**. |
| **M2** | Graph core | Domain types & commands; node & edge rendering (straight + spline); selection/hover; CRUD nodes/edges; debounced autosave; import/export MVP (JSON; **ZIP + manifest as target**). |
| **M3** | Desktop + VR + modes | Full semantic dispatch + history; desktop shortcuts & connection gestures; Quest controllers (ray, grab, menus); world manipulation vs travel; focus, recenter, reset; node detail & contextual actions (e.g. action ring). |
| **M4** | Hands, media, search, tools | Hand tracking with fallbacks; `MediaStore` + viewers (markdown, images, PDF, generic files); search/focus/dim; collapse/expand; undo/redo; bookmarks; **optional** structure tools on selected clusters (preview → commit, undoable). |
| **M5** | Polish + QA | Onboarding; settings (audio, locomotion, vignette, etc.); ambient audio optional; performance pass; Quest comfort pass; README Quest/desktop QA checklists; deployment verification. |

---

## Backlog / to-do (master)

### Product & UX

- [ ] Enforce freeform defaults; no surprise snapping, auto-layout, or reposition after place unless user invokes a tool.
- [ ] Destructive actions (clear map, delete project, bulk delete) confirmed on **desktop and in VR** with equivalent clarity.
- [ ] Onboarding covers: create node, connect, move world, open node, world vs travel, search/focus, new map, clear map.
- [ ] Bookmarks: save/recall viewpoints or graph states (if not complete).
- [ ] Optional structure tools: align, distribute, radial, branch, flatten, stack, tidy neighborhood, normalize spacing, center cluster — only on selection; preview where practical; undoable.

### Engineering guardrails (from above)

- [ ] Audit graph-local vs world-space for nodes, edge control points, previews, bookmarks.
- [ ] Central interaction state machine (documented in code).
- [ ] IndexedDB quota checks and user-visible failures on large saves/imports.
- [ ] Label budget + distance rules on Quest.
- [ ] Clear-map clears graph **and** history + transient UI state.
- [ ] ZIP export/import with manifest (primary portable format).
- [ ] Written performance budgets (numbers) in repo or this doc.
- [ ] PDF.js integrated as display-only into custom panels.

### Testing & release

- [ ] Unit tests for graph/domain/history (extend Vitest coverage over time).
- [ ] Desktop smoke path (manual or automated where practical).
- [ ] Manual XR QA: follow [README Quest checklist](../README.md#quest-testing-manual-qa); expand to full matrix (controllers + hands + desktop parity).

---

## Definition of done (MVP gate)

The MVP is **done** when all of the following are demonstrably true:

- [ ] Runs locally on desktop with mouse & keyboard for **major** workflows.
- [ ] Deploys to **Vercel** (or equivalent static host) with HTTPS for Quest.
- [ ] Opens in **Quest Browser**; can enter **immersive VR**.
- [ ] Create nodes in 3D; **connect** with paths (including gradient treatment as designed).
- [ ] Move nodes; **manipulate the whole graph** (universe) in world mode.
- [ ] **Open a node** into spatial detail; **browse** attached content.
- [ ] **Search** and **focus** ideas; **collapse/expand** branches as implemented.
- [ ] **Multiple** separate mind maps (projects); **clear current map** and start again.
- [ ] **Save, load, import, export** local projects (format as shipped; ZIP target per roadmap).
- [ ] **Controllers** and **hand tracking** support core flows (within browser capability).

---

## References

- [README — setup, scripts, deployment, testing](../README.md)
- Architecture pointers: `src/store/rootStore.ts`, `src/input/actions.ts`, `src/persistence/`, `src/scene/`, `src/ui/`
