# Contributing

## Development style

WebLoop should remain small, understandable, and dependency-light.

Before adding a feature, check whether it improves one of these outcomes:

- a non-technical user can record a workflow faster;
- a failed workflow is easier to diagnose;
- a common enterprise web component becomes more reliable;
- the default UI becomes simpler;
- future LLM assistance becomes safer and more auditable.

## Commit style

Use semantic commit messages:

- `feat: add screenshot step`
- `fix: replay controlled input values`
- `docs: update roadmap`
- `refactor: simplify step rendering`
- `chore: update extension metadata`

## Local checks

```bash
node --check sidepanel.js
node --check content_script.js
node --check service_worker.js
python -m json.tool manifest.json
```
