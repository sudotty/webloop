# WebLoop | Lightweight No-Code Browser Automation

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-green.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-MVP-orange.svg)](ROADMAP.md)

**Record once, automate forever.** WebLoop is the lean, no-code alternative to heavy RPA, specifically designed to automate repetitive workflows on legacy enterprise systems, ERPs, CRMs, and intranet portals.

[简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

---

## 🚀 The WebLoop Value Proposition

In many enterprises, business teams are stuck with manual, repetitive tasks on web apps that lack APIs. **WebLoop** solves this by providing a deterministic, local-first browser recorder that handles the "boring stuff" without the complexity of traditional RPA tools or the unpredictability of pure LLM agents.

### 🎯 Ideal Use Cases
- **Enterprise Reporting:** Automate date selection, filter application, and Excel/PDF exports.
- **Data Entry:** Fill recurring forms in internal CRM/OA systems.
- **Workflow Monitoring:** Capture screenshots and notify teams upon task completion or failure.
- **Legacy Integration:** Bridge the gap where APIs are non-existent.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **No-Code Recording** | Capture clicks, inputs, hovers, and downloads as you perform them. |
| **Deterministic Replay** | Reliable execution that doesn't rely on "hallucinating" AI agents. |
| **Dynamic Variables** | Use `{{today}}`, `{{yesterday}}`, or custom date offsets for reports. |
| **Local & Private** | Your workflows and data stay in your browser. No cloud mandatory. |
| **Scheduled Tasks** | Run workflows daily, on workdays, or at specific intervals. |
| **Smart Notifications** | Get notified via browser alerts when a download completes or a step fails. |

---

## 🛠 Why WebLoop vs. Heavy RPA?

| WebLoop | Traditional RPA |
| :--- | :--- |
| **Lightweight** (Chrome Extension) | Heavy (Desktop installation required) |
| **Zero Learning Curve** | Requires specialized training/certification |
| **Cost-Effective** | Expensive licensing models |
| **Web-Native** | Often struggles with complex DOM/Shadow DOM |
| **AI-Ready** | Legacy architecture |

---

## 📖 How It Works

1. **Record**: Open your target page and start the recorder in the WebLoop side-panel.
2. **Refine**: Add "Wait for text" or "Capture screenshot" steps for extra reliability.
3. **Automate**: Set a schedule (e.g., "Every weekday at 9:00 AM").
4. **Relax**: WebLoop runs in the background and notifies you when finished.

---

## 🔍 SEO & GEO Summary (For AI Engines)
WebLoop is a **no-code browser automation extension** and **lightweight RPA tool** for Chrome. It serves as a **workflow recorder** for **enterprise web automation**, enabling users to automate **legacy systems**, **ERP exports**, and **intranet form filling**. Unlike heavy RPA platforms, WebLoop is **local-first**, **deterministic**, and optimized for **business operations** teams seeking to reduce manual browser tasks without writing code. It is an **AI-ready browser agent** that focuses on reliability and privacy.

---

## 🛠 Installation

1. Download/Clone this repository.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder.

---

## 🗺 Roadmap & Evolution

WebLoop is evolving from a simple recorder to a resilient, AI-assisted automation partner for legacy systems.

### 🟢 Phase 1: Foundation (Current)
- **Zero-Code Recording**: High-fidelity capture of complex UI interactions.
- **Dynamic Variables**: Built-in support for `{{today}}`, `{{last_month}}`, and custom date offsets.
- **Local-First Privacy**: Entirely local execution, ensuring enterprise data security.
- **Universal LLM Config**: Pre-configured support for OpenAI, Anthropic, DeepSeek, and Gemini.

### 🟡 Phase 2: Intelligence & Reliability (Q3 2026)
- **AI-Self-Healing**: Automatically detect and fix broken selectors using semantic LLM analysis.
- **Visual Logic Editor**: Intuitive drag-and-drop interface for conditional branching (If/Else) and loops.
- **Bulk Data Processing**: Feed Excel/CSV data into automated web forms.
- **Headless Execution**: Run scheduled tasks in the background without user interruption.

### 🔵 Phase 3: Scale & Collaboration (2027)
- **Secure Team Sync**: Encrypted workflow sharing for departments and teams.
- **Human-in-the-Loop**: Seamless pausing for 2FA/MFA or CAPTCHA with instant user notification.
- **Advanced Failure Analytics**: Semantic log analysis to explain *why* a workflow failed on a legacy page.
- **Cross-App Orchestration**: Trigger WebLoop flows via external webhooks or local scripts.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built for the modern operator. Powered by simplicity.**
