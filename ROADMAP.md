# Roadmap

WebLoop is a lightweight, local-first browser workflow recorder for repetitive
web tasks. The roadmap prioritizes **reliability and usability** before optional
AI features. Status is tracked openly so you can see what works today and what's
coming next.

Legend: ✅ Done · 🚧 In progress · ⏳ Planned

---

## ✅ Shipped — v0.9 (MVP foundation)

The core record → replay → schedule → notify loop works today, with no LLM
required.

- ✅ **No-code recording** of clicks, inputs, selects, hovers, double-clicks,
  checkboxes/radios, multi-select, scroll, key presses, and downloads.
- ✅ **Deterministic replay** with multi-locator elements (CSS, XPath, stable
  text, aria-label) and per-step confidence scoring.
- ✅ **Dynamic date variables** — `{{today}}`, `{{yesterday}}`, `{{month_start}}`,
  `{{last_month_end}}`, `{{date:-7}}`.
- ✅ **Reliability steps** — wait for text / text-gone / element / page-stable,
  plus a flow "clean up" pass and a static flow audit.
- ✅ **Scheduling** — manual, daily, workdays, or interval triggers.
- ✅ **Screenshots & notifications** on success, failure, or human handoff.
- ✅ **Human-in-the-loop** handoff steps for 2FA / CAPTCHA / approvals.
- ✅ **Local-first storage**; task backup import/export.
- ✅ **Per-site permissions panel** — review, authorize, and revoke host access.
- ✅ **Optional LLM connectivity** (OpenAI / Anthropic / Gemini / DeepSeek /
  Ollama / Groq), disabled by default.
- ✅ **React + TypeScript + Vite** side panel; plain-JS deterministic core.

---

## 🚧 v0.10 — Reliability MVP (next)

Goal: handle the real intranet/legacy edge cases that break naive recorders.
Tracked in [`docs/ISSUE_PLAN.md`](docs/ISSUE_PLAN.md).

- 🚧 Improve **iframe** detection and permission guidance.
- ⏳ **Resume from failed step** after manual correction.
- ⏳ Track **new-tab / popup** download workflows.
- ⏳ **Date-picker adapters** for Ant Design, Element Plus, jQuery UI, legacy.

## ⏳ v0.11 — Business workflow UX

- ⏳ Pre-step and post-step **screenshots**.
- ⏳ **Task health score** (Stable / Needs review / Fragile).
- ⏳ Editable **table/grid** support (double-click edit, Enter/Tab commit).
- ⏳ **Modal / confirmation dialog** handling.

## ⏳ v0.12 — Optional, safe AI assistance

AI stays advisory and privacy-preserving. WebLoop never executes remote code.

- ⏳ Sanitized **failure-explanation** boundary (no raw form values by default).
- ⏳ **Selector repair suggestions** — proposed, never auto-applied.
- ⏳ **Natural-language → draft workflow**, reviewed before saving.

## ⏳ v1.0 — Packaging & launch

- ⏳ Chrome Web Store package (listing, screenshots, privacy review).
- ⏳ SEO/GEO launch copy for GitHub, Product Hunt, HN, Reddit, AI search.

## ⏳ Beyond 1.0 — Teams & operations

- ⏳ Encrypted **team sync** of workflow templates.
- ⏳ **Audit logs**, workspace settings, role-based task editing.
- ⏳ **Webhook** notifications and cross-app orchestration.
- ⏳ Native desktop companion for file move/rename/unzip and browser startup.

---

## Non-goals

- Becoming a full RPA IDE or replacing UiPath / Power Automate / Automa.
- Executing arbitrary remote JavaScript.
- Bypassing authentication, CAPTCHA, 2FA, or compliance controls.
- Depending on an LLM for the core automation path.
