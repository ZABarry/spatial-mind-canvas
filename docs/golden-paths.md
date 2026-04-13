# Golden paths — manual QA

These five flows define the core product. Verify after meaningful interaction changes.

## 0. First-run onboarding (desktop + XR)

**Expected**

1. **Desktop** — A **Start here** strip shows one short action-first cue (place → select → link or child → rename or Inspect). **Dismiss** hides it; completing the path hides it and persists.
2. **VR** — The same milestones appear as compact lines on the **status HUD** (no floating HTML strip). Dismiss/progress syncs with desktop via app metadata.

**Checklist**

- [ ] No long multi-step text carousel; cues match real graph/selection state.

## 1. Desktop: create node → link node → inspect node

**Expected**

1. **Create** — Double-click empty ground; a new node appears.
2. **Link** — Drag from the cyan link handle on a selected node; complete on a second node or on empty ground (creates a connected node).
3. **Inspect** — Right-click or double-click a node, or select one and press Enter; quick actions can also open **node detail**; fields show and close without corrupting the graph.

**Checklist**

- [ ] Orbit/zoom still work when not dragging.
- [ ] Undo removes one logical gesture at a time.

## 2. Desktop: select node → add child → rename

**Expected**

1. Select a node (click).
2. **Add child** — Quick actions → Add child; a new node appears connected; selection moves to the child (or remains consistent).
3. **Rename** — Quick actions → Rename; inline popover saves title without opening full **node detail**.

**Checklist**

- [ ] Escape cancels rename popover without saving (if focused in popover).
- [ ] Map saves (autosave) after edits.
- [ ] While **Link** is in progress from quick actions, status copy references Esc to cancel.

## 3. XR controller: select node → open radial → link → complete

**Expected**

1. Enter VR with controllers.
2. Select a node with the trigger.
3. Use the **node radial** beside the selection (Child, Link, Inspect, etc.).
4. Tap **Link**, aim at another node or ground, trigger to complete (ghost line while drafting).

**Checklist**

- [ ] Status HUD shows tool/nav and a hint while linking.
- [ ] Wrist menu stays global (Library, recovery, mode switch); node-specific actions stay on the radial.

## 4. XR controller: cancel → recenter → reset scale/view

**Expected**

1. Start an interaction (e.g. link draft); **Cancel** on the wrist menu clears it.
2. **Recenter** — **Wrist menu → Recenter** or **node radial → Recenter** (centers the orbit on the primary selection, same as desktop Home/.).
3. **Reset scale** / **Reset view** — World scale or camera framing moves toward defaults without breaking the session.

**Checklist**

- [ ] World grab (grip) does not fire during link/node drag.

## 5. Hand tracking: select → open menu → place node or child → inspect

**Expected**

1. Session uses hands only (no gamepad controllers); `xrHandTrackingPrimary` UX applies.
2. **Global menu** — Palm toward you (or left secondary button on controller fallback) opens wrist menu.
3. **Selection** — Pinch/ray select works for basic selection.
4. **Node radial** — Child / Inspect available; **Link** is disabled with a short “controllers” cue.
5. **Inspect** — Opens **node detail** in XR.

**Checklist**

- [ ] Status HUD states hand-mode expectations (Child & Inspect; controllers for full Link).
- [ ] Controller-based sessions still behave as in paths 3–4.

## Known limitations

- **Hand tracking** is a lite mode: complex linking and precision graph edits may be hidden or reduced; controllers remain the full authoring path.
- **Export / layout / bookmarks** may require exiting VR to use the flat HTML toolbar (see Help).
- **Performance** — “Show all labels” and large graphs can stress standalone headsets; use label budget.
