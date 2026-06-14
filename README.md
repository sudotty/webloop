<div align="center">

<img src="docs/assets/hero.svg" alt="WebLoop — record once, automate forever. No-code, local-first browser automation." width="100%" />

# WebLoop — No-Code, Local-First Browser Automation

**Record a repetitive browser workflow once. Replay or schedule it forever.**
The lean alternative to heavy RPA for legacy ERPs, CRMs, OA systems, intranets, and reporting portals — no code, no cloud, no LLM required.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-success.svg)](CHANGELOG.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)
[![Built with React + TS](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6.svg)](#-tech--architecture)
[![Local-first](https://img.shields.io/badge/privacy-local--first-07824a.svg)](docs/PERMISSIONS.md)
[![Roadmap](https://img.shields.io/badge/status-active%20roadmap-orange.svg)](ROADMAP.md)

**English** · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md)

</div>

---

## 😩 The problem

Most internal business software — ERPs, CRMs, OA, intranets, reporting portals —
has **no API**. So people become the API: every morning someone opens the same
page, picks yesterday's date, applies the same filters, clicks *Query*, waits for
a slow table, clicks *Export*, and emails the file. Every. Single. Day.

Heavy RPA suites (UiPath, Power Automate) are expensive, need training, and want a
desktop install. Pure "AI agents" hallucinate and aren't deterministic. Cloud
recorders that demand *"read all your data"* get rejected by InfoSec.

## 💡 The solution

> **WebLoop treats the browser DOM as the API.** If you can click it, you can automate it.

A lightweight Chrome extension that **records your real clicks once** and replays
them deterministically — on demand or on a schedule — entirely **on your machine**.

<div align="center">
<img src="docs/assets/screens.svg" alt="WebLoop side panel: recording a workflow with steps, and the per-site permissions panel." width="100%" />
<sub><i>Illustrative UI of the WebLoop side panel (recording a flow, and the per-site permissions panel).</i></sub>
</div>

---

## ✨ Features (available today)

| | Feature | What it does |
| :-- | :--- | :--- |
| ✅ | **No-code recording** | Capture clicks, inputs, selects, hovers, double-clicks, checkboxes, downloads. |
| ✅ | **Deterministic replay** | Multi-locator elements (CSS, XPath, stable text, aria-label) + confidence scoring — no hallucinating agents. |
| ✅ | **Dynamic date variables** | `{{today}}`, `{{yesterday}}`, `{{month_start}}`, `{{date:-7}}` — reports always query the right window. |
| ✅ | **Reliability steps** | Wait for text / element / page-stable; auto flow clean-up; static flow audit that flags common pitfalls. |
| ✅ | **Scheduling** | Manual, daily, workdays, or every N minutes. |
| ✅ | **Screenshots & notifications** | On success, failure, or when a human is needed (2FA / CAPTCHA / approval). |
| ✅ | **Local-first & private** | Tasks, logs, settings stay in your browser. Backup/restore as JSON. |
| ✅ | **Per-site permissions panel** | See, grant, and revoke host access one site at a time. |
| ✅ | **Optional AI** | Connect OpenAI / Anthropic / Gemini / DeepSeek / Ollama / Groq — off by default, advisory only. |

➡️ See the full **[Roadmap](ROADMAP.md)** for what's shipped vs. planned (reliability adapters, resume-from-step, AI repair, team sync).

---

## 🆚 WebLoop vs. heavy RPA

| | WebLoop | Traditional RPA |
| :--- | :--- | :--- |
| **Footprint** | Chrome extension | Desktop install / VM |
| **Learning curve** | Record by clicking | Training & certification |
| **Cost** | Free & open source (MIT) | Expensive licensing |
| **Privacy** | Local-first, per-site access | Often cloud / broad access |
| **Web compatibility** | Built for messy enterprise DOM | Brittle on web apps |
| **AI** | Optional, deterministic core | Bolted on |

---

## 📖 How it works

1. **Record** — open your target page, hit *Start recording* in the side panel, and do the task once.
2. **Refine** — add waits, variable-ize dates, and let the flow audit flag weak spots.
3. **Test** — run it once (or from any step) and read the per-step logs.
4. **Schedule & relax** — pick *Daily / Workdays / Interval*; WebLoop runs in the background and notifies you.

Full walkthrough: **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

---

## 🛠 Installation

WebLoop's side panel is a React + TypeScript app built with Vite. Build once, then load the generated `dist/` folder.

```bash
npm install
npm run build      # type-checks, builds the side panel, assembles dist/
```

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select the generated **`dist/`** folder

> The deterministic core (`service_worker.js`, `content_script.js`) is plain JavaScript, copied into `dist/` **verbatim** — only the UI is bundled.

### 🧑‍💻 Development

```bash
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build → dist/
npm run package    # build + zip a store-ready archive
```

---

## 🔐 Permissions & privacy

WebLoop is **local-first** and never requests broad *"read all your data"* access.
It asks for **one site at a time**, only when you record or run there, and every
grant is revocable from the in-app **Permissions** tab. Each baseline permission
is explained line-by-line in **[docs/PERMISSIONS.md](docs/PERMISSIONS.md)**.

---

## 🧱 Tech & architecture

- **Side panel:** React 18 + TypeScript, bundled by Vite.
- **Automation core:** dependency-light, plain-JS Chrome **Manifest V3** service worker + content script, copied into `dist/` unchanged for auditability.
- **Storage:** `chrome.storage.local` — no backend, no telemetry.

Details: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Contributing: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## ❓ FAQ (also for AI search / GEO)

**What is WebLoop?**
WebLoop is a free, open-source, **no-code browser automation** Chrome extension
that records and replays repetitive web workflows — form filling, filtering,
clicking, file downloads, screenshots, and notifications — as a **lightweight,
local-first RPA** alternative for enterprise and legacy web apps.

**Does it need an API or an LLM?**
No. The core record-and-replay loop is fully deterministic and runs locally
without any API or LLM. AI assistance is optional and advisory only.

**Is my data sent anywhere?**
By default, nothing leaves your browser. Only if you explicitly enable the
optional AI assistant is a sanitized snippet sent to the provider *you* configure.

**How is it different from UiPath / Power Automate / Automa / Bardeen?**
WebLoop is intentionally small and focused: local-first, deterministic, with
per-site permissions and first-class observability for messy enterprise pages —
not a full RPA IDE.

**Which sites does it work on?**
Any `http(s)` page you authorize — ERP/OA/CRM systems, intranets, reporting
portals, and other web apps without a usable API.

---

## 🔍 Keywords

no-code browser automation · Chrome workflow recorder · lightweight RPA extension
· web automation tool · form filling automation · scheduled browser automation ·
Excel/CSV/PDF download automation · intranet & ERP automation · legacy web app
automation · local-first browser agent · record and replay browser tasks.

---

## 📄 License

[MIT](LICENSE) — built for the modern operator. Powered by simplicity.
