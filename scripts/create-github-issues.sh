#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-sudotty/webloop}"

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"
  gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body"
}

create_issue "compat: improve iframe permission guidance" "compatibility,ux,priority:p0" "Detect iframe origins and guide users to grant host permissions without requesting broad access by default."
create_issue "feat: resume workflow from failed step" "enhancement,reliability,priority:p0" "Allow users to continue a workflow from the failed step after manual correction."
create_issue "feat: track new-tab and popup download workflows" "downloads,compatibility,priority:p0" "Support workflows where export opens a new tab or popup before download starts."
create_issue "compat: add custom date picker adapters" "compatibility,forms,priority:p0" "Improve Ant Design, Element Plus, jQuery UI, and legacy date picker support."
create_issue "feat: add pre-step and post-step screenshots" "screenshots,diagnostics,priority:p1" "Capture screenshots before or after selected workflow steps for evidence and diagnosis."
create_issue "feat: add task health score" "ux,reliability,priority:p1" "Score recorded workflows based on selector stability, waits, temporary text, and download ambiguity."
create_issue "compat: improve editable table and grid support" "compatibility,forms,priority:p1" "Support double-click-to-edit, typing into grid editors, and Enter/Tab commit behavior."
create_issue "compat: add modal and confirmation handling" "compatibility,ux,priority:p1" "Detect common modal dialogs and allow recorded confirmation steps."
create_issue "ai: add sanitized failure explanation boundary" "ai,privacy,priority:p1" "Create a privacy-preserving payload for optional LLM failure explanation."
create_issue "ai: add selector repair suggestions" "ai,reliability,priority:p2" "Suggest selector/text repairs from sanitized DOM summaries with user confirmation."
create_issue "ai: generate draft workflows from natural language" "ai,enhancement,priority:p2" "Convert a user goal into editable draft workflow steps, without direct execution."
create_issue "release: prepare Chrome Web Store package" "release,docs,priority:p1" "Prepare listing copy, screenshots, privacy policy, permissions review, and support information."
create_issue "docs: add SEO and GEO launch copy" "marketing,docs,priority:p1" "Prepare launch copy for GitHub, website, Product Hunt, HN, Reddit, and AI search engines."
