# ERD Studio

A minimal, local-first ER diagram editor for developers — built per `masterplan.md`.
No accounts, no cloud storage, no backend database. Runs entirely in the browser,
distributed as a single Docker image.

## Status: Phase 8 of 8 — Docker Distribution

This repo was built phase by phase, following the masterplan's own
development plan (`masterplan.md` § 22).

| Phase | Scope | Status |
|---|---|---|
| 1 | Canvas foundation — pan, zoom, grid, selection, toolbar shell, undo/redo foundation | ✅ done |
| 2 | Tables — create/edit/move/delete tables & columns | ✅ done |
| 3 | Relationships — column-to-column, crow's foot, cardinality | ✅ done |
| 4 | Notes & visual organization — notes, colors, multi-select, mini-map | ✅ done |
| 5 | Local persistence — autosave, save/open project files | ✅ done |
| 6 | Export — SVG, PNG, PDF | ✅ done |
| 7 | Developer experience — shortcuts, polish, accessibility | ✅ done |
| 8 | Docker distribution — production image | ✅ done |

All 8 phases from the masterplan are complete.

## Running with Docker

```bash
docker compose up --build
```

Then open **http://localhost:8080**. `docker compose down` to stop it.

Without compose:

```bash
docker build -t erd-studio .
docker run --rm -p 8080:8080 erd-studio
```

No database, no configuration, no accounts — obtain the image, start the
container, open the browser, see the blank canvas (masterplan §20's
deployment goals). Everything after that lives in your browser: autosave
to local storage, explicit save/open to portable `.erd.json` files, and
export to SVG/PNG/PDF, all client-side.

### How the image is built

Two-stage `Dockerfile`:
1. **Build** (`node:22-alpine`) — `npm ci` + `npm run build`, discarded
   after this stage; none of Node, npm, or `node_modules` ends up in the
   final image.
2. **Runtime** (`nginxinc/nginx-unprivileged:alpine`) — just the built
   static files plus nginx. Runs as a non-root user out of the box and
   listens on port 8080 rather than the usual privileged port 80.

`docker/nginx.conf` handles SPA-style serving, long-lived immutable
caching for hashed asset filenames, a `no-cache` policy on `index.html`
specifically (since it's what references the current hashed filenames),
gzip, and a couple of baseline security headers.

### Container health

`HEALTHCHECK` polls a dedicated `/healthz` endpoint (not `/`, so it stays
cheap and doesn't depend on `index.html` serving correctly to be a useful
liveness signal). `docker ps` shows the container's health status
directly; `docker-compose.yml` wires the same check through for `docker
compose ps`.

### A note on verification

I don't have Docker available in the environment I built this in, so I
could not run `docker build`/`docker run` on the final image directly.
What I *could* verify, and did:
- `npm ci` (exactly what the Dockerfile runs, not `npm install`) succeeds
  cleanly against the committed lockfile.
- I installed a real nginx binary locally and ran the actual
  `docker/nginx.conf` against a real production build — not just a
  syntax check. That caught a genuine bug (nginx's `add_header` doesn't
  inherit into a location block that sets its own `add_header`, which
  was silently dropping the security headers on `/` and on every asset)
  before fixing it, then reloaded the app in a real browser through that
  nginx instance and confirmed it works: creating a table, editing
  columns, undo/redo, and self-hosted fonts loading correctly through
  `/assets/`, all with zero console errors.
- What I could *not* verify directly: the `node:22-alpine` build stage
  itself, and `nginxinc/nginx-unprivileged`'s exact tag availability on
  Docker Hub (my network access here is limited to package registries,
  not container registries). Both are extremely standard, widely-used
  images, but if `docker compose up --build` hits an image-pull or
  build-stage issue on your machine, that stage is the one I'd want to
  know about.

## Features

- **Canvas** — pan, zoom, dot grid with snap-to-grid, toggleable
  mini-map, box-select
- **Tables** — create, rename, move, delete; columns with generic types,
  PK/FK/nullable/unique metadata, drag-to-reorder; optional accent color
- **Relationships** — drag from any column to any other (including
  self-references) to connect them; proper crow's-foot notation; inline
  cardinality editing; automatic cleanup when a table/column is deleted
- **Notes** — resizable sticky notes with optional color, for annotating
  a diagram
- **Multi-select** — mix tables and notes in one selection, move or
  delete them together as a single undo step
- **Persistence** — autosaves to the browser continuously; explicit
  Save/Open to portable `.erd.json` files; validates untrusted input
  (files, autosave data) rather than trusting it
- **Export** — SVG, PNG, and PDF, rendered directly from the diagram
  model rather than a screenshot
- **Keyboard shortcuts** — full set from masterplan §10, with a `?`
  help overlay for discoverability
- **Accessibility** — every interactive element has an accessible name,
  full keyboard operability, visible focus indicators

## Tech stack

- **React 19 + TypeScript**, built with **Vite**
- **@xyflow/react** (React Flow) as the canvas/graph engine
- **Zustand** for the diagram model + undo/redo history store
- **Tailwind CSS v4** for styling
- Self-hosted **Inter** (UI) and **JetBrains Mono** (schema/table content)
  fonts via `@fontsource` — no external CDN, so the app works on
  air-gapped/private networks once served

## Architecture

```
src/
  types/diagram.ts        Diagram/Table/Column/Relationship/Note model (masterplan §16)
  store/diagramStore.ts   Diagram state + undo/redo history (masterplan §15)
  store/uiStore.ts        Transient UI state (active tool, focus hints, mini-map)
  store/toastStore.ts     Non-blocking error/info notifications
  lib/diagramOperations.ts  Pure diagram-editing functions (tables, columns, relationships, notes)
  lib/diagramValidation.ts  Sanitizes untrusted diagram JSON (project files, autosave)
  lib/projectFile.ts       Save (download) / open (file picker) for project files
  lib/autosave.ts          Debounced localStorage autosave + boot-time recovery
  lib/relationshipRouting.ts  Shared edge-side heuristic (live canvas + export)
  lib/handleId.ts          Encode/decode connection-handle ids (side + column)
  lib/markerId.ts          Crow's-foot marker id/url helpers
  lib/colors.ts            Shared swatch palette for tables/notes
  lib/useClickOutside.ts   Popover dismiss-on-outside-click hook
  lib/useDeferredFocus.ts  Focus-after-creation hook (avoids a native-event race)
  lib/useKeyboardShortcuts.ts  Shared shortcut-registration hook (masterplan §10)
  lib/shortcutRegistry.ts  Display metadata for the shortcuts help overlay
  lib/export/              Model-to-SVG renderer + PNG/PDF generation (masterplan §19)
  components/Canvas/      Canvas layer (React Flow wrapper, TableNode, NoteNode, RelationshipEdge, markers)
  components/Toolbar/     Editor UI (toolbar, zoom controls, export menu)
  components/common/      Shared UI (inline-editable text, color swatch picker, toasts, shortcuts help)
```

## Running locally (development)

```bash
npm install
npm run dev
```

Open http://localhost:5173. This runs the app directly with Vite, no
Docker required — useful for development. See "Running with Docker"
above for the production deployment path.

## Build

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```
