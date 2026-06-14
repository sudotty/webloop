# Permissions & Privacy Model

WebLoop is built so a security-conscious team can adopt it without an InfoSec
review blocking on "this extension can read all my data." It can't — by design.

## Principles

1. **Local-first.** Tasks, settings, run logs, screenshots metadata, and any LLM
   configuration live in `chrome.storage.local`. Nothing is uploaded to a WebLoop
   server (there is no WebLoop server).
2. **Just-in-time host access.** WebLoop ships with **no** host permissions
   granted. It requests access to a single origin (`https://host/*`) only when you
   start recording or running a task on that site.
3. **Revocable.** Every granted site is listed in the in-app **Permissions** tab
   and can be revoked with one click (`chrome.permissions.remove`).
4. **No remote code execution.** WebLoop never injects or evaluates arbitrary
   JavaScript returned by an LLM. AI assistance is advisory only.

## Baseline permissions (manifest `permissions`)

These are capabilities, not data access. None of them grant the ability to read
page content on their own — that requires a per-site host grant.

| Permission | Why WebLoop needs it |
| :--- | :--- |
| `storage` | Persist tasks, settings, and logs locally. |
| `sidePanel` | Render the WebLoop UI in Chrome's side panel. |
| `scripting` + `activeTab` | Inject the recorder/replayer **only** into sites you authorize. |
| `tabs` + `windows` | Open a task's start URL and follow same-site tabs it spawns. |
| `downloads` | Detect when an exported file finishes downloading; save screenshots. |
| `notifications` | Alert you on success, failure, or when human action is needed. |
| `alarms` | Fire scheduled tasks (daily / workdays / interval). |
| `webNavigation` | Know when a page has finished loading before acting on it. |

## Host permissions (`optional_host_permissions`)

Declared as **optional** and requested at runtime, one origin at a time:

- `http://*/*`, `https://*/*` — requested per-site, never granted wholesale.
- `https://api.openai.com/*`, `https://api.deepseek.com/*` — only relevant if you
  explicitly enable the optional LLM assistant and pick that provider.

## What leaves the browser

- **By default: nothing.** The entire record → replay → schedule → notify loop
  runs locally.
- **Only if you enable the optional LLM assistant**, and only when a run fails,
  WebLoop may send a sanitized snippet of DOM/log context to the provider *you*
  configured (your endpoint, your API key) to suggest a repair. The API key is
  stored locally and never shared with anyone but that provider.

## Reviewing & revoking access

Open the extension → **权限 / Permissions** tab to:

- see exactly which sites are authorized,
- authorize the current page,
- revoke any site instantly,
- read the rationale for each baseline permission.
