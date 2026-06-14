# WebLoop User Guide

WebLoop records a repetitive browser task once and replays it on demand or on a
schedule. This guide walks through a typical "daily report download" workflow.

## 1. Install

```bash
npm install
npm run build
```

Then load the `dist/` folder via `chrome://extensions/` → Developer mode →
**Load unpacked**. Click the WebLoop toolbar icon to open the side panel.

## 2. The side panel at a glance

| Tab | What it's for |
| :--- | :--- |
| **今日 (Today)** | Your tasks and whether they've run today. |
| **录制 (Record)** | Create/edit a task by recording real clicks. |
| **任务 (Tasks)** | Every task: run, edit, pause/enable. |
| **日志 (Logs)** | Run history — the first place to look when something fails. |
| **权限 (Permissions)** | Review and revoke per-site access. |
| **设置 (Settings)** | Notifications, screenshots, retries, and the optional LLM assistant. |

## 3. Record a workflow

1. Open the target page (e.g. your ERP report screen).
2. In the **Record** tab, click **从当前页面开始 (Start from current page)**.
   WebLoop asks for permission to *this site only* — approve it.
3. Click **开始录制 (Start recording)** and perform the task normally: pick dates,
   set filters, click **Query**, hover an export menu, click **Export**.
4. Click **停止录制 (Stop recording)**.

WebLoop captures clicks, inputs, selects, hovers, and downloads, keeping multiple
locators per element (CSS, XPath, stable text, aria-label) so replay survives
small page changes.

## 4. Make it reliable

- **Dynamic dates:** turn a literal date field into `{{yesterday}}`, `{{today}}`,
  `{{month_start}}`, or `{{date:-7}}` using the chips under an input step. Reports
  then always query the right rolling window.
- **Waits:** legacy pages need them. Add **等待文字 (Wait for text)** like
  "查询完成", **等待消失 (Wait until gone)** like "加载中", or
  **页面稳定 (Wait until stable)** after a Query click.
- **整理流程 (Clean up flow):** auto-collapses duplicate hovers, variable-izes
  obvious dates, and inserts stability waits after query/submit clicks.
- **Flow check:** the audit box flags common pitfalls (recorded a "loading…"
  label, an export button that needs a hover first, a literal date, no wait step).

## 5. Test before scheduling

Use **保存并测试 (Save and test)**, or **▶** on a single step to run from there.
The Logs tab shows each step's status, downloaded file name, screenshots, and —
on failure — where and why it stopped.

## 6. Schedule

In the task's run settings choose:

- **手动 (Manual)** — run on demand,
- **每天 (Daily)** / **工作日 (Workdays)** at a time,
- **周期 (Interval)** every N minutes.

WebLoop fires the task via `chrome.alarms`, runs it, and notifies you on success,
failure, or when human action (2FA, CAPTCHA, approval) is required.

## 7. When a step expects a human

Add a **人工接管 (Manual handoff)** step where login, OTP, or approval is needed.
WebLoop pauses and notifies you instead of trying to bypass the control.

## 8. Back up & move tasks

**设置 → 高级 (Settings → Advanced)** → **导出任务备份 / 导入任务备份**
exports/imports all tasks and settings as JSON.

## Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| "未授权当前站点" | Approve the site in the permission prompt or the Permissions tab. |
| Export click does nothing | Add a **悬浮触发 (Hover)** step before it. |
| Query results not ready | Add **等待文字** / **页面稳定** after the Query click. |
| Input value rejected (React/Vue/AntD) | Re-pick the field; WebLoop dispatches native input events. |
| Runs inside an iframe fail | Keep **兼容 iframe** enabled in Settings. |
