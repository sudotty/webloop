# Architecture

WebLoop is a Chrome Manifest V3 extension with a side-panel UI and a deterministic workflow runner.

## Components

```text
sidepanel.html/css/js
  -> user interface, recording controls, task editor, logs, settings

content_script.js
  -> page recording, element fingerprinting, replay actions, DOM interaction

service_worker.js
  -> task scheduling, run state, downloads, notifications, screenshots, storage

chrome.storage.local
  -> tasks, settings, logs, LLM configuration
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
