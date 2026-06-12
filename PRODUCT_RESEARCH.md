# Product Research Notes

## Positioning

WebLoop is a lightweight browser workflow recorder for repetitive web tasks.

The product should not compete head-on with full workflow builders such as Automa, Browserflow, Bardeen, Power Automate, or UiPath. Those tools are broader and more complex. WebLoop should win on simplicity, local execution, observability, and practical enterprise-web reliability.

## User pain points

Typical users are operations, finance, customer support, back-office staff, analysts, and founders who repeatedly interact with web systems that have no usable API.

Common tasks:

- fill the same form every day;
- query reports with dynamic dates;
- apply filters and export Excel/PDF/CSV;
- operate intranet systems with iframe-heavy pages;
- click hover-only export menus;
- handle slow loading states;
- keep screenshots as evidence;
- receive success or failure notifications.

## Product principles

1. Default simple, advanced optional.
2. Deterministic execution first, LLM assistance later.
3. Record by doing, repair by pointing.
4. Every failure should explain where and why it failed.
5. Screenshots and logs are product features, not debugging extras.
6. Do not bypass security controls.
7. Keep permissions scoped to the sites users choose.

## Common failure modes

- Element text changes from stable label to temporary loading text.
- Export button appears only after hover.
- Input values are not accepted by React/Vue/AntD/Element controlled components.
- Query runs before the page finishes loading.
- The report opens a same-site new tab before downloading.
- The task fails inside iframe content.
- A modal confirmation appears after clicking export or submit.
- Session expires and requires human login.

## Differentiation

WebLoop should feel like a focused assistant, not an automation IDE:

```text
Record once -> Test once -> Schedule -> Notify
```

The core value is not having the most actions. The core value is making repetitive web work safe, observable, and understandable for non-technical office users.
