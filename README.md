# WebLoop

**Record repetitive browser workflows once. Run them anytime.**

WebLoop is a lightweight **Chrome browser automation extension** for repetitive web tasks: form filling, filter selection, button clicking, hover menus, scheduled runs, Excel/PDF/CSV downloads, screenshots, and browser notifications.

It is built for real enterprise web work: legacy web systems, intranet portals, ERP/OA/CRM pages, reporting dashboards, admin consoles, finance portals, insurance systems, operations back offices, and other pages where users still repeat the same manual browser workflow every day.

WebLoop works without LLMs. Optional AI/LLM support is planned as an assistive layer for failure explanation, selector repair, and workflow review. The core automation path remains deterministic, local, and usable without any model API key.

## What WebLoop does

```text
Open page -> Record actions -> Clean up flow -> Test once -> Schedule -> Notify on result
```

Common workflows:

- Fill a date range, select a branch or department, click Query, export Excel, and notify when done.
- Complete recurring web forms in an intranet system.
- Open a hover menu, click an export action, wait for file download, and capture a screenshot.
- Run a daily, workday, or interval-based browser workflow without writing scripts.
- Keep evidence with screenshots and run logs when a workflow succeeds or fails.

## Why this project exists

Many business teams still depend on web apps that have no stable API and cannot be changed quickly. The repeated task is usually simple, but the cost is real:

- open the same page every morning;
- fill the same date, region, status, branch, or report type;
- click through slow enterprise UI;
- wait for tables to load;
- download Excel, CSV, or PDF files;
- capture proof for audit or handoff;
- notice when the process fails.

Generic RPA tools are often powerful but heavy. WebLoop focuses on one practical use case: **simple browser workflow recording and replay for repetitive web tasks**.

## Core features

| Feature | Purpose |
|---|---|
| Side-panel UI | Keep the automation assistant next to the page being automated. |
| Auto recording | Capture clicks, inputs, selects, checkbox/radio changes, hover triggers, and downloads. |
| Manual repair | Add or edit steps when a workflow needs precision. |
| Dynamic date variables | Use `{{today}}`, `{{yesterday}}`, `{{month_start}}`, `{{last_month_end}}`, and offset dates. |
| Scheduling | Run manually, daily, on workdays, or every N minutes. |
| Download monitoring | Track Chrome downloads and report success or failure. |
| Screenshots | Save evidence for success, failure, and manual diagnosis. |
| Notifications | Send browser-level success, failure, and human-handoff alerts. |
| Flow cleanup | Add local reliability checks and remove obvious recording noise. |
| LLM-ready settings | Prepare for optional AI repair without requiring LLMs for normal use. |

## Supported workflow actions

- Click element
- Double-click element
- Fill field
- Clear field
- Select dropdown
- Multi-select filter
- Check option
- Uncheck option
- Hover trigger
- Scroll page
- Wait for element
- Wait for text
- Wait for text to disappear
- Wait for page stability
- Wait for seconds
- Wait for download
- Capture screenshot
- Press key
- Human handoff

## Installation for local development

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository directory.
5. Open a target web page and click the WebLoop extension icon.

No build step is required for the current MVP.

## Recommended first workflow

1. Open the target enterprise web page.
2. Open the WebLoop side panel.
3. Click **Start from current page**.
4. Click **Start recording**.
5. Perform the workflow once: fill fields, choose filters, query data, hover export menus, download files, or submit forms.
6. Stop recording.
7. Review and clean up the flow.
8. Save and run a test.
9. Enable daily, workday, or interval scheduling.

## Example use cases

### Report download automation

```text
Set date to {{yesterday}}
Select branch = Tokyo
Click Query
Wait for table to stabilize
Hover Export
Click Excel
Wait for download
Notify success or failure
```

### Intranet form automation

```text
Open internal form
Fill recurring fields
Select status
Click Submit
Wait for text: Saved successfully
Capture screenshot
Notify completion
```

### Back-office filter automation

```text
Open CRM/OA/ERP page
Select region, owner, date range, and state
Click Search
Wait for loading text to disappear
Capture screenshot
```

## Design principles

WebLoop should stay small and understandable:

1. The default path must remain simple: record, test, schedule, notify.
2. Advanced RPA actions should be available only when users need them.
3. Workflows should be observable: users must know which step is running and why a step failed.
4. Enterprise data should stay local by default.
5. LLMs should assist, not silently control sensitive web apps.

## LLM strategy

WebLoop is **LLM-ready, not LLM-dependent**.

Planned AI features:

- explain failed runs from logs and screenshots;
- suggest selector repairs;
- summarize a sanitized DOM snapshot;
- generate a draft flow from a natural-language goal;
- review a workflow before scheduling.

Non-goals for AI:

- no arbitrary remote JavaScript execution;
- no silent clicking through sensitive pages;
- no default upload of page content;
- no CAPTCHA, 2FA, or compliance bypass.

## Privacy and security

WebLoop is designed for enterprise pages and intranet workflows. The default architecture stores tasks, logs, and settings locally in the browser. Optional LLM integrations should only send sanitized data after explicit user configuration.

See [PRIVACY.md](./PRIVACY.md) and [SECURITY.md](./SECURITY.md).

## Development checks

```bash
npm run check
python -m json.tool manifest.json
```

Equivalent direct checks:

```bash
node --check sidepanel.js
node --check content_script.js
node --check service_worker.js
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) and [docs/ISSUE_PLAN.md](./docs/ISSUE_PLAN.md).

## Keywords

Chrome extension, browser automation, browser workflow recorder, web automation, no-code browser automation, lightweight RPA, web RPA, form filling automation, enterprise web automation, intranet automation, ERP automation, OA automation, CRM automation, Excel download automation, scheduled browser workflows, AI-ready browser agent.

## Status

Current version: `0.9.0`.

WebLoop is an early MVP. It is usable without LLMs and intentionally dependency-light.
