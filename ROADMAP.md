# Roadmap

WebLoop is a lightweight browser workflow recorder for repetitive web tasks. The roadmap prioritizes reliability and usability before optional AI features.

## Phase 1 — Stable local MVP

Goal: make the default workflow simple and usable without LLMs.

- Keep the extension dependency-light and loadable as an unpacked Chrome MV3 extension.
- Preserve the first-run path: record once, test once, schedule, notify.
- Improve recording reliability for common business pages.
- Support forms, filters, selects, hover menus, downloads, screenshots, and notifications.
- Add local flow cleanup and step-level reliability checks.
- Keep advanced RPA actions hidden until users need them.

## Phase 2 — Enterprise web compatibility

Goal: handle more real intranet and legacy web app edge cases.

- Improve iframe permission guidance and frame targeting.
- Add dedicated adapters for Ant Design, Element Plus, jQuery UI, and legacy date pickers.
- Improve editable table/grid support.
- Add modal/dialog confirmation handling.
- Add resume-from-failed-step.
- Add pre-step and post-step screenshots.
- Add new-tab and popup download tracking.

## Phase 3 — Operations and persistence

Goal: make workflows maintainable for daily business use.

- Add versioned task import/export schema.
- Add run history filters and searchable logs.
- Add file naming templates and download directory presets.
- Add webhook notifications.
- Add task health score and stale-selector warnings.
- Add a native desktop companion for file movement, archive, rename, unzip, and browser startup.

## Phase 4 — Optional LLM assistance

Goal: make AI useful without making AI mandatory.

- Explain failed runs from logs and screenshots.
- Suggest selector repairs from sanitized DOM context.
- Generate a draft flow from a natural-language goal.
- Review a workflow before scheduling.
- Require user confirmation before applying any AI-generated repair.
- Never execute arbitrary remote JavaScript returned by an LLM.

## Phase 5 — Team and business version

Goal: support small teams and enterprise deployments.

- Shared task templates.
- Audit logs.
- Workspace-level settings.
- Role-based access for task editing.
- Admin deployment documentation.
- Enterprise privacy and data retention controls.

## Non-goals

- Become a full RPA IDE.
- Replace UiPath, Power Automate, Automa, or Browserflow directly.
- Execute arbitrary remote JavaScript.
- Bypass authentication, CAPTCHA, 2FA, or compliance controls.
- Depend on LLMs for the core automation path.
