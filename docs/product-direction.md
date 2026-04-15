# Product direction

## What this is

**Spatial Mind Canvas** is primarily a **solo, local, spatial ideation tool**: a calm **browser-based** 3D / XR canvas for connecting ideas, notes, and media. The immediate goal is **excellent individual thinking**—fast capture, clear structure, and comfortable **Quest-first** WebXR—not a multiplayer or cloud collaboration platform.

For a concise **feature ledger** (shipped vs partial vs out of scope), see **[feature-status.md](feature-status.md)**.

## Local-first now

- Data lives **on the device** (IndexedDB) unless the user **exports** a portable JSON or ZIP.
- **Version history** is implemented as **local snapshots** only—same device, same browser—not sync or shared history.
- **Starter templates** are offline seeds: small graph layouts to speed up new maps.

## Collaboration is deferred

**Multi-user editing, accounts, cloud sync, and shared workspaces are not the current strategy.** They may be explored later as **optional** additions; they are not required to deliver the core value of the product today. Positioning and roadmap language should **not** imply that real-time collaboration or team features ship in the current app.

## Scope we are not building (near term)

- Cloud backends for sync or presence  
- Multiplayer / CRDT / shared sessions  
- User accounts and org permissions  
- AI assistants, enterprise governance, or online “share link” publishing  

These are explicitly **out of scope** until the solo/local experience is excellent end-to-end.

## Success looks like

- **Calm**, readable 3D mind maps with straight **links** between nodes  
- **Trustworthy** local persistence and export  
- **Comfortable** WebXR on standalone headsets, with a clear **hand-tracking–lite** path and **controllers** for full authoring  
- **Fast starts** via templates and light **branch** helpers—not automation of the whole workflow  
