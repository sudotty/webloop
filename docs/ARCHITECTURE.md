# Architecture

WebLoop is a Chrome Manifest V3 extension with a React side-panel UI and a
deterministic, plain-JavaScript workflow runner.

## Components

```text
src/sidepanel/** (React + TypeScript, built by Vite -> dist/)
  -> user interface, recording controls, task editor, logs, permissions, settings
  -> talks to the background only through the typed RR_* message client (api.ts)

content_script.js  (plain JS, copied verbatim to dist/)
  -> page recording, element fingerprinting, replay actions, DOM interaction

service_worker.js  (plain JS, copied verbatim to dist/)
  -> task scheduling, run state, downloads, notifications, screenshots, storage

chrome.storage.local
  -> tasks, settings, logs, LLM configuration
```

## Build pipeline

```text
npm run build
  -> tsc --noEmit                 type-check the side panel
  -> vite build                   bundle src/sidepanel -> dist/sidepanel.html + assets
  -> scripts/postbuild.mjs        copy manifest.json, service_worker.js,
                                  content_script.js, icons/ into dist/ unchanged
```

Only the side panel is bundled. The automation core is intentionally left as
plain JavaScript and copied byte-for-byte so it stays auditable and the recorded
file path (`content_script.js`, injected via `chrome.scripting`) never changes.

## Side-panel data flow

```text
React views ──▶ actions.ts ──▶ api.send('RR_*') ──▶ service_worker.js
     ▲                                                     │
     └──── store (poll 1.8s + RR_STATE_CHANGED) ◀──────────┘
```

## Execution model

```text
idle -> scheduled -> opening -> running_step -> waiting -> validating -> success | failed | human_handoff
```

## Element strategy

Each recorded element should keep multiple hints:

- CSS selector
- XPath
- stable text
- aria-label/title/name
- frame path when available
- element role and tag
- nearby text

Replay should try stable selectors first, then text and heuristics.

## Privacy model

The default execution path is local. No page content is uploaded unless the user explicitly configures an optional LLM provider in a future release.
