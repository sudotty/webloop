# Changelog

## Unreleased

### Side panel rebuilt on React + TypeScript + Vite
- Migrate the entire side-panel UI from a single 1,285-line vanilla file to a
  typed, component-based React app (`src/sidepanel/**`) with a Vite build.
- Keep the deterministic automation core (`service_worker.js`,
  `content_script.js`) as plain JavaScript, copied into `dist/` verbatim.
- Add a typed `RR_*` message client and a shared data model (`src/types.ts`).

### New: Permissions panel & transparent permission model
- Add a **Permissions** tab to review authorized sites, authorize the current
  site, and revoke any site with one click.
- Document a per-permission rationale ([`docs/PERMISSIONS.md`](docs/PERMISSIONS.md));
  host access stays just-in-time and per-site.

### UX & polish
- Unify the UI language (remove leaked English fragments from the Chinese UI).
- Add a toolbar/store icon to the manifest and tighten the store description.

### Docs
- Add [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md); update README (EN/zh-CN/ja),
  architecture, and contributing for the new build flow.

## 0.9.0

- Rename product positioning to WebLoop.
- Add lightweight browser workflow recorder branding.
- Support stronger interaction actions: double-click, clear field, checkbox/radio control, multi-select, scroll, screenshot, key press, and human handoff.
- Improve input replay for controlled components.
- Keep LLM integration optional and disabled by default.
