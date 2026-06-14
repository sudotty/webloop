# Contributing

## Project layout

```text
src/sidepanel/      React + TypeScript side-panel UI (built by Vite)
  components/        shared components + per-view components
  lib/              pure helpers (format, steps, audit, variables, permissions)
  store.tsx         app state, polling, live updates
  actions.ts        recording / picking / task operations
  api.ts            typed chrome.runtime message client (RR_* contract)
src/types.ts         shared data model
service_worker.js    deterministic background runner (plain JS, copied to dist/)
content_script.js    page recorder/replayer (plain JS, copied to dist/)
scripts/postbuild.mjs assembles dist/ after the Vite build
```

The **side panel** uses React; the **automation core** stays plain JavaScript and
is copied into `dist/` verbatim so it remains easy to audit.

## Development setup

```bash
npm install
npm run dev        # Vite dev server for the side panel
npm run typecheck  # tsc --noEmit
npm run build      # produces dist/ (load this as an unpacked extension)
```

## Development style

WebLoop should remain small, understandable, and minimal-dependency.

Before adding a feature, check whether it improves one of these outcomes:

- a non-technical user can record a workflow faster;
- a failed workflow is easier to diagnose;
- a common enterprise web component becomes more reliable;
- the default UI becomes simpler;
- future LLM assistance becomes safer and more auditable.

## Commit style

Use semantic commit messages:

- `feat: add screenshot step`
- `fix: replay controlled input values`
- `docs: update roadmap`
- `refactor: simplify step rendering`
- `chore: update extension metadata`

## Local checks

```bash
npm run typecheck                 # type-check the side panel
npm run build                     # full build into dist/
node --check content_script.js    # syntax-check the automation core
node --check service_worker.js
python -m json.tool manifest.json
```
