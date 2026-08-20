# ERD Studio

A minimal, local-first ER diagram editor for developers. No accounts, no
backend, no cloud storage — the whole app runs in your browser and ships
as a single Docker image.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

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
  model rather than a screenshot, so exports match what's on screen
- **Keyboard shortcuts** — a full shortcut set, with a `?` help overlay
  for discoverability
- **Accessibility** — every interactive element has an accessible name,
  full keyboard operability, visible focus indicators

## Quick start

### Docker (recommended)

```bash
docker compose up --build
```

Open **http://localhost:8080**. `docker compose down` to stop it.

Without compose:

```bash
docker build -t erd-studio .
docker run --rm -p 8080:8080 erd-studio
```

No database, no configuration, no accounts — build the image, start the
container, open the browser. Everything after that lives in your
browser: autosave to local storage, explicit save/open to portable
`.erd.json` files, and export to SVG/PNG/PDF, all client-side.

### Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # type-check (tsc -b) + production build to dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

## Tech stack

- **React 19 + TypeScript**, built with **Vite**
- **[@xyflow/react](https://github.com/xyflow/xyflow)** (React Flow) as
  the canvas/graph engine
- **Zustand** for the diagram model + undo/redo history store
- **Tailwind CSS v4** for styling
- Self-hosted **Inter** (UI) and **JetBrains Mono** (schema/table
  content) fonts via `@fontsource` — no external CDN, so the app works
  on air-gapped/private networks once served

## Architecture

The whole app is driven by a single `Diagram` object (`meta`, `tables`,
`relationships`, `notes`, `grid`, `viewport`) that is the source of
truth for the live canvas, autosave payload, and `.erd.json` project
files alike.

```
src/
  types/diagram.ts            Diagram/Table/Column/Relationship/Note model
  store/diagramStore.ts       Diagram state + undo/redo history
  store/uiStore.ts            Transient UI state (active tool, focus hints, mini-map)
  store/toastStore.ts         Non-blocking error/info notifications
  lib/diagramOperations.ts    Pure diagram-editing functions (tables, columns, relationships, notes)
  lib/diagramValidation.ts    Sanitizes untrusted diagram JSON (project files, autosave)
  lib/projectFile.ts          Save (download) / open (file picker) for project files
  lib/autosave.ts             Debounced localStorage autosave + boot-time recovery
  lib/relationshipRouting.ts  Shared edge-side heuristic (live canvas + export)
  lib/handleId.ts             Encode/decode connection-handle ids (side + column)
  lib/markerId.ts             Crow's-foot marker id/url helpers
  lib/colors.ts                Shared swatch palette for tables/notes
  lib/export/                  Model-to-SVG renderer + PNG/PDF generation
  components/Canvas/          Canvas layer (React Flow wrapper, TableNode, NoteNode, RelationshipEdge, markers)
  components/Toolbar/         Editor UI (toolbar, zoom controls, export menu)
  components/common/          Shared UI (inline-editable text, color swatch picker, toasts, shortcuts help)
```

Editing logic lives in `lib/diagramOperations.ts` as pure functions
`(diagram, ...args) => Diagram`, one per mutation. The Zustand store's
`commit()` snapshots pre-mutation state for undo/redo and skips history
entries for no-op edits. Keeping this logic pure and separate from the
store/components is what lets undo/redo, validation, and export all
reuse the same code paths — a relationship, for instance, routes
identically on-screen and in an exported file because both use
`lib/relationshipRouting.ts`.

## Docker image

Two-stage `Dockerfile`:

1. **Build** (`node:22-alpine`) — `npm ci` + `npm run build`; discarded
   after this stage, so none of Node, npm, or `node_modules` ends up in
   the final image.
2. **Runtime** (`nginxinc/nginx-unprivileged:alpine`) — just the built
   static files plus nginx. Runs as a non-root user and listens on port
   8080 rather than the usual privileged port 80.

`docker/nginx.conf` handles SPA-style serving, long-lived immutable
caching for hashed asset filenames, a `no-cache` policy on `index.html`
specifically, gzip, and baseline security headers. `HEALTHCHECK` polls a
dedicated `/healthz` endpoint so container health doesn't depend on
`index.html` serving correctly.

## Contributing

Issues and pull requests are welcome. There's no automated test suite
yet — please check `npm run build` and `npm run lint` pass, and
exercise the change in the browser, before opening a PR.

## License

[MIT](LICENSE)
