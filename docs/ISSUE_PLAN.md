# GitHub Issue Plan

This file converts the product roadmap into implementation-sized GitHub issues.

## Milestone: v0.10 Reliability MVP

### Issue 1 — Improve iframe permission guidance

**Labels:** `compatibility`, `ux`, `priority:p0`

Enterprise systems often place report pages inside one or more iframes. The extension should detect iframe origins and guide users to grant the required host permissions.

Acceptance criteria:

- Detect same-origin and cross-origin iframe presence.
- Show a clear permission hint in the side panel.
- Explain why automation may fail without iframe permission.
- Avoid requesting broad permissions by default.

### Issue 2 — Add resume-from-failed-step

**Labels:** `enhancement`, `reliability`, `priority:p0`

Users should be able to continue a workflow from the failed step after manually fixing login, page state, or a missing element.

Acceptance criteria:

- Run a task from any selected step.
- Preserve run logs with the original start step.
- Show clear UI: "Run from this step".
- Avoid re-running previous form fill steps unless the user chooses to.

### Issue 3 — Add new-tab and popup workflow tracking

**Labels:** `downloads`, `compatibility`, `priority:p0`

Some enterprise systems generate downloads through a new tab, popup window, or intermediate export page.

Acceptance criteria:

- Detect same-origin new tab creation during a run.
- Continue workflow execution in the new tab when configured.
- Link download events to the active workflow run.
- Add a safe timeout and failure message.

### Issue 4 — Add component adapters for custom date pickers

**Labels:** `compatibility`, `forms`, `priority:p0`

Date pickers are a high-frequency failure source in ERP/OA/CRM systems.

Acceptance criteria:

- Add adapters or heuristics for common Ant Design, Element Plus, and jQuery UI date inputs.
- Support `{{today}}`, `{{yesterday}}`, and offset date variables.
- Provide fallback recording guidance when direct input is unreliable.

## Milestone: v0.11 Business Workflow UX

### Issue 5 — Add pre-step and post-step screenshots

**Labels:** `screenshots`, `diagnostics`, `priority:p1`

Screenshots help users diagnose why a workflow failed and provide evidence for completed tasks.

Acceptance criteria:

- Allow screenshots before or after selected steps.
- Save screenshots with task name, step index, and timestamp.
- Link screenshot metadata in run logs.

### Issue 6 — Add task health score

**Labels:** `ux`, `reliability`, `priority:p1`

Users need to know whether a recorded workflow is stable enough for scheduling.

Acceptance criteria:

- Score flows based on fragile selectors, temporary text, missing waits, and download ambiguity.
- Display simple messages: Stable, Needs review, Fragile.
- Provide actionable repair suggestions.

### Issue 7 — Improve editable table and grid support

**Labels:** `compatibility`, `forms`, `priority:p1`

Many back-office systems require editing grid cells or table rows.

Acceptance criteria:

- Support double-click-to-edit flows.
- Support typing into focused grid editors.
- Support Enter/Tab commit behavior.
- Add a specific issue template field for grid libraries.

### Issue 8 — Add modal and confirmation handling

**Labels:** `compatibility`, `ux`, `priority:p1`

Export and submit actions often trigger confirmation dialogs.

Acceptance criteria:

- Detect common modal/dialog containers.
- Allow users to record confirmation clicks.
- Add a wait-for-dialog step.
- Add a clear timeout message when a dialog does not appear.

## Milestone: v0.12 Optional LLM Assistance

### Issue 9 — Add sanitized failure explanation API boundary

**Labels:** `ai`, `privacy`, `priority:p1`

LLM assistance should explain failed runs without uploading sensitive page data by default.

Acceptance criteria:

- Build a sanitized failure payload.
- Exclude raw form values by default.
- Require explicit user configuration and confirmation.
- Support OpenAI-compatible API settings.

### Issue 10 — Add selector repair suggestions

**Labels:** `ai`, `reliability`, `priority:p2`

LLM repair should suggest changes, not silently modify tasks.

Acceptance criteria:

- Generate repair suggestions from sanitized DOM summaries.
- Show proposed selector/text changes before applying.
- Store repair history in run logs.

### Issue 11 — Add natural-language draft workflow generation

**Labels:** `ai`, `enhancement`, `priority:p2`

Users should be able to describe a target workflow and receive a draft flow to review.

Acceptance criteria:

- Convert a goal into editable draft steps.
- Require user validation before saving.
- Avoid direct execution until the draft has been reviewed.

## Milestone: v1.0 Packaging and Launch

### Issue 12 — Prepare Chrome Web Store package

**Labels:** `release`, `docs`, `priority:p1`

Prepare a safe, privacy-forward Chrome Web Store listing.

Acceptance criteria:

- Add listing description.
- Add screenshots and promotional copy.
- Review permissions and optional host permissions.
- Add privacy policy and support email.

### Issue 13 — Add SEO/GEO launch page copy

**Labels:** `marketing`, `docs`, `priority:p1`

Create launch copy for GitHub, website, Product Hunt, Hacker News, Reddit, and AI search engines.

Acceptance criteria:

- Include plain-language use cases.
- Include keyword-focused but non-spammy copy.
- Explain why WebLoop works without LLMs.
- Explain optional AI roadmap.
