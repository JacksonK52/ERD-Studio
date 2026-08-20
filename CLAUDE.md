# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ERD Studio — a local-first, single-page ER diagram editor. No backend, no
accounts; the whole app runs in the browser and is distributed as a static
Docker image (nginx serving a Vite build). All persistence is client-side:
localStorage autosave plus explicit save/open of portable `.erd.json`
project files.

## Commands

```bash
npm install
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # tsc -b (type-check) + production build to dist/
npm run preview   # serve the production build locally, http://localhost:4173
npm run lint      # oxlint
```

There is no test suite/runner configured in this repo.

Docker (production distribution path):

```bash
docker compose up --build   # → http://localhost:8080
```

Two-stage `Dockerfile`: `node:22-alpine` builds via `npm ci` + `npm run
build`; the runtime stage is `nginxinc/nginx-unprivileged:alpine` serving
only the built static files (no Node/npm in the final image). Runs as
non-root on port 8080. `docker/nginx.conf` handles SPA fallback routing,
immutable caching for hashed asset filenames, `no-cache` on `index.html`,
gzip, and security headers — note that nginx's `add_header` does not
inherit from a parent block into a `location` that sets its own
`add_header`, so headers must be repeated per-location if you touch this
file. `HEALTHCHECK` hits `/healthz`, not `/`, to stay independent of
`index.html` serving correctly.

## Architecture

**Data model** (`src/types/diagram.ts`): a single `Diagram` object —
`meta`, `tables[]`, `relationships[]`, `notes[]`, `grid`, `viewport` — is
the source of truth for everything: live canvas state, autosave payload,
and `.erd.json` project file contents are all the same shape. Types are
generic/conceptual (e.g. `ColumnType` is `INT`/`VARCHAR`/`UUID`/...), not
tied to any specific database engine.

**State** (`src/store/`):
- `diagramStore.ts` holds the `Diagram` plus undo/redo history. History
  only tracks the *structural* fields (`tables`, `relationships`,
  `notes`) — `grid` and `viewport` are excluded on purpose, so panning or
  toggling grid snap never becomes an undo step. Every structural edit
  goes through `commit(mutate)`, which snapshots pre-mutation state onto
  `past` and clears `future`; a mutator that returns the same diagram
  reference (a no-op/guarded edit — empty rename, duplicate relationship,
  etc.) is treated as "nothing happened" and skipped from history.
- `uiStore.ts` — transient UI state (active tool, focus hints, mini-map
  visibility) that doesn't belong in the diagram model.
- `toastStore.ts` — non-blocking error/info notifications.

**Editing logic** (`src/lib/diagramOperations.ts`) is a set of pure
functions `(diagram, ...args) => Diagram` for every mutation (create/edit
table, add/reorder column, create relationship, move note, ...). Callers
pass these directly as the mutator to `diagramStore.commit()`. Keeping
this logic pure and separate from the store/components is what makes
undo/redo, validation, and export all reuse the same code paths.

**Canvas** (`src/components/Canvas/`) wraps `@xyflow/react` (React Flow):
`DiagramCanvas` is the top-level graph; `TableNode`/`NoteNode` render
diagram entities as nodes; `RelationshipEdge` + `EdgeMarkerDefs` render
crow's-foot relationships. Connection handles encode which table
side/column they belong to via `lib/handleId.ts`; `lib/markerId.ts` maps
cardinality to crow's-foot SVG marker ids; `lib/relationshipRouting.ts`
holds the edge-routing heuristic (which side of a table an edge attaches
to) — this logic is shared between the live canvas *and* export, so a
relationship routes identically on-screen and in exported files.

**Export** (`src/lib/export/`) renders the diagram model directly to
SVG/PNG/PDF — not a canvas screenshot. `svgRenderer.ts` and `layout.ts` do
model→SVG; `rasterize.ts` and `pdfExport.ts` build on that SVG for
PNG/PDF output. Because export reuses `relationshipRouting.ts` and the
same marker/color logic as the live canvas, exported diagrams match what
was on screen.

**Persistence**:
- `lib/autosave.ts` — debounced localStorage autosave + boot-time
  recovery.
- `lib/projectFile.ts` — explicit Save (triggers a download) / Open (file
  picker) for `.erd.json` files.
- `lib/diagramValidation.ts` — all input from outside the running app
  (opened project files, recovered autosave data) is treated as
  untrusted and passed through validation/sanitization before it becomes
  the live `Diagram`, since it may be hand-edited or stale across a
  `formatVersion` bump.

**Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`, no separate config
file needed). Fonts are self-hosted (`@fontsource/inter`,
`@fontsource/jetbrains-mono`) rather than loaded from a CDN, so the app
works fully offline/air-gapped once built.
