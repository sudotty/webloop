# Privacy

WebLoop is designed for enterprise and intranet workflows where page content may contain sensitive business data.

## Default behavior

- Workflow definitions are stored locally in Chrome storage.
- Run logs are stored locally in Chrome storage.
- Screenshots are saved through the browser download system.
- The extension does not upload page content by default.
- LLM settings are optional and disabled by default.

## Optional LLM usage

Future LLM features should use sanitized DOM summaries and failure logs, not full business pages.

Users should explicitly enable any external API integration and understand what data may be sent.

## Human handoff

WebLoop should not bypass CAPTCHA, 2FA, security prompts, or anti-fraud systems. These cases should stop the workflow and request human action.
