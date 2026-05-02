---
name: "News: Translate Articles"
description: Dedicated translation workflow for news articles. Generates high-quality translations for all non-core languages. Dispatched by content workflows or run manually/on schedule to translate untranslated articles.
strict: false
imports:
  - ../prompts/00-base-contract.md
  - ../prompts/01-bash-and-shell-safety.md
  - ../prompts/02-mcp-access.md
  - ../prompts/07-commit-and-pr.md
on:
  schedule:
    # Run translation catch-up twice daily after main content workflows
    - cron: "0 11 * * 1-5"
    - cron: "0 17 * * 1-5"
    # Weekend catch-up
    - cron: "0 14 * * 0,6"
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD). Defaults to today.'
        required: false
      article_type:
        description: 'Article type to translate (propositions, motions, committee-reports, week-ahead, month-ahead, weekly-review, monthly-review, breaking, evening-analysis, deep-inspection, interpellations). Leave empty to scan for all untranslated articles.'
        required: false
      languages:
        description: 'Target languages (da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh | nordic-extra | eu-extra | cjk | rtl | all-extra). Default: all-extra (all except en,sv)'
        required: false
        default: all-extra
      source_language:
        description: 'Source language to translate from (default: en)'
        required: false
        default: en
      analysis_depth:
        description: 'Analysis depth to apply during translation quality validation (standard, deep, comprehensive). Mirrors the source article depth.'
        required: false
        default: standard

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 60

concurrency:
  group: gh-aw-news-translate-${{ inputs.article_type || 'batch' }}-${{ inputs.article_date || 'today' }}
  job-discriminator: ${{ inputs.article_type || 'batch' }}-${{ inputs.article_date || 'today' }}
  cancel-in-progress: true

features:
  mcp-gateway: true

sandbox:
  mcp:
    keepalive-interval: 300 # gh-aw mcp-gateway `keepaliveInterval` — 5-min HTTP MCP ping (overrides upstream default `1500s`) to keep `riksdag-regering` (HTTP) and other HTTP-backed MCPs warm for the full 60-min job. Pairs with `engine.mcp.session-timeout: 1h` below, which now governs MCP gateway session lifetime (gh-aw v0.71.3, default 6h). The PR deadline is now ~agent minute 42 (hard 45) — see prompts/07-commit-and-pr.md §Deadline enforcement.

runtimes:
  node:
    version: "25"

network:
  allowed:
    - node
    # Minimal Docker Hub hosts for node:25-alpine pulls used by SCB + World Bank MCP servers
    # (replaces the broader `containers` ecosystem identifier to keep least-privilege egress)
    - docker.io
    - registry-1.docker.io
    - auth.docker.io
    - production.cloudflare.docker.com
    - github
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - www.scb.se
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - regeringen.se
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - raw.githubusercontent.com
    - hack23.github.io
    - defaults

mcp-servers:
  riksdag-regering:
    url: https://riksdag-regering-ai.onrender.com/mcp
    allowed: ["*"]
  scb:
    container: "node:25-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:
    container: "node:25-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "worldbank-mcp@1.0.1"]
    allowed: ["*"]

tools:
  startup-timeout: 180
  timeout: 120
  github:
    toolsets:
      - all
  agentic-workflows: true
  bash: true
  edit:
  web-fetch:
  cache-memory:
    key: news-${{ github.workflow }}-${{ inputs.article_date || 'today' }}
    retention-days: 14

safe-outputs:
  threat-detection:
    continue-on-error: true
  report-failure-as-issue: false
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - www.scb.se
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - raw.githubusercontent.com
    - hack23.github.io
  max-patch-size: 4096
  create-pull-request:
    labels: [agentic-news, translation]
    draft: false
    expires: 14d
    max: 1
    if-no-changes: warn       # Don't fail when nothing changed (resilience)
    fallback-as-issue: true   # If org disables Actions PR creation, fall back to an issue with branch link
  add-comment: {}

steps:
  - name: News pre-warm & pre-flight (composite)
    uses: ./.github/actions/news-prewarm
  - name: Pre-flight content PR dependency check
    env:
      GH_TOKEN: ${{ github.token }}
      GITHUB_TOKEN: ${{ github.token }}
      ARTICLE_DATE_INPUT: ${{ github.event.inputs.article_date }}
      GH_REPOSITORY: ${{ github.repository }}
    run: |
      ARTICLE_DATE="$ARTICLE_DATE_INPUT"
      if [ -z "$ARTICLE_DATE" ]; then
        ARTICLE_DATE=$(date -u '+%Y-%m-%d')
      fi
      CONTENT_BRANCH_PREFIX="news/content/$ARTICLE_DATE/"
      GH_ERROR_LOG=$(mktemp)
      JQ_ERROR_LOG=$(mktemp)
      chmod 600 "$GH_ERROR_LOG" "$JQ_ERROR_LOG"
      trap 'rm -f "$GH_ERROR_LOG" "$JQ_ERROR_LOG"' EXIT
      OPEN_CONTENT_PRS=0

      set +e
      PR_LIST_JSON=$(gh pr list --repo "$GH_REPOSITORY" --base main --state open --limit 200 --json headRefName 2>"$GH_ERROR_LOG")
      GH_EXIT_CODE=$?
      set -e
      if [ "$GH_EXIT_CODE" -ne 0 ] || [ -z "$PR_LIST_JSON" ]; then
        echo "⚠ Unable to query open content PRs for $ARTICLE_DATE (gh exit code: $GH_EXIT_CODE)."
        if [ -s "$GH_ERROR_LOG" ]; then
          echo "gh error:"
          sed 's/^/  /' "$GH_ERROR_LOG"
        fi
        echo "   Could not determine whether today's date has open content PRs — deferring today and looking for older articles to translate."
        echo "TODAY_DEFERRED=true" >> "$GITHUB_ENV"
        exit 0
      fi

      set +e
      OPEN_CONTENT_PRS=$(printf '%s' "$PR_LIST_JSON" | jq -r --arg prefix "$CONTENT_BRANCH_PREFIX" '[.[] | select(.headRefName | startswith($prefix))] | length' 2>"$JQ_ERROR_LOG")
      JQ_EXIT_CODE=$?
      set -e
      if [ "$JQ_EXIT_CODE" -ne 0 ] || ! [[ "$OPEN_CONTENT_PRS" =~ ^[0-9]+$ ]]; then
        echo "⚠ Unable to parse content PR count for $ARTICLE_DATE (jq exit code: $JQ_EXIT_CODE)."
        if [ -s "$JQ_ERROR_LOG" ]; then
          echo "jq error:"
          sed 's/^/  /' "$JQ_ERROR_LOG"
        fi
        OPEN_CONTENT_PRS=0
        echo "   Parse error — agent will look for older articles to translate."
        echo "TODAY_DEFERRED=true" >> "$GITHUB_ENV"
        exit 0
      fi

      if [ "$OPEN_CONTENT_PRS" -gt 0 ]; then
        echo "⏸ $OPEN_CONTENT_PRS content PRs still open for $ARTICLE_DATE — today deferred"
        echo "   Agent will look for older articles needing translation."
        echo "TODAY_DEFERRED=true" >> "$GITHUB_ENV"
        exit 0
      fi
      echo "✅ No open content PRs for $ARTICLE_DATE — proceeding with translation"

  - name: Pre-flight source article check
    env:
      ARTICLE_DATE_INPUT: ${{ github.event.inputs.article_date }}
    run: |
      ARTICLE_DATE="$ARTICLE_DATE_INPUT"
      if [ -z "$ARTICLE_DATE" ]; then
        ARTICLE_DATE=$(date -u '+%Y-%m-%d')
      fi
      EN_SOURCE_COUNT=$(ls news/$ARTICLE_DATE-*-en.html 2>/dev/null | wc -l)
      if [ "$EN_SOURCE_COUNT" -eq 0 ]; then
        echo "⚠ No EN source articles found for $ARTICLE_DATE"
        echo "   Agent will scan older dates for untranslated articles."
        echo "TODAY_NO_SOURCES=true" >> "$GITHUB_ENV"
        exit 0
      fi
      echo "✅ Found $EN_SOURCE_COUNT EN source article(s) for $ARTICLE_DATE — proceeding with translation"

engine:
  id: copilot
  model: claude-sonnet-4.6
  mcp:
    session-timeout: 1h # gh-aw v0.71.3 — keeps MCP gateway sessions alive for the full 60-min job (default would be 6h; we cap at 1h to free gateway resources sooner). See https://github.com/github/gh-aw/issues/29353.
---

# 🌐 News Translate

Dedicated translation workflow. Consumes completed EN/SV articles and produces translations in the remaining 12 languages. Never generates original analysis.

## Pipeline

Translation is a pure-derivative workflow:

1. Scan `news/` for articles in the source language (default `en`) missing translations for target languages.
2. For each candidate, read the source HTML in full.
3. Translate into every requested target language, preserving Schema.org markup, `dok_id` references, Swedish political terminology, and RTL layout for `ar` / `he`.
4. Stage, commit, and call `safeoutputs___create_pull_request` **exactly once** covering every translation produced.

## Inputs

- `article_date` (optional, default = today)
- `article_type` (optional — restrict to one type; omit to scan all)
- `languages` (default `all-extra` = all 12 non-core languages)
- `source_language` (default `en`)
- `analysis_depth` (default `standard` — mirrors source article depth for validation thoroughness)

## Rules specific to this workflow

- No original analysis. Never produce files under `analysis/daily/`.
- Validate every translation against the source with `scripts/validate-news-translations.ts` before commit.
- Keep the PR under the safe-outputs 100-file cap. If more translations are pending than fit in one PR, translate the highest-priority batch and leave the rest for the next scheduled run.
- **Per-language idempotency, not workflow-level no-op**:
  - A target language is skipped *for that language only* when **all three** of the following hold:
    1. its translation file already exists and is non-empty,
    2. a **deterministic source-revision signal** shows the source has not changed since that translation was last produced (for example, the source file's latest git commit timestamp / commit SHA via `git log -1 --format=%ct -- <path>`, or a content hash / validator-produced source signature — **never** filesystem mtimes, which are unstable on CI runners after `actions/checkout`), and
    3. `scripts/validate-news-translations.ts` passes for that language.
  - When **all** target languages satisfy the three conditions above, the run does **not** exit. It enters **translation-improvement mode**: re-run the validator across every translation, use the same deterministic source-revision signal when deciding whether any language needs a refresh, fix any drift / regressions / SEO metadata gaps the validator flags, refresh stale `dateModified`, and commit the resulting changes.
  - `safeoutputs___noop` is only allowed under the conditions in `07-commit-and-pr.md §No-op policy`. "All translations already exist and are valid" is **never** a noop trigger; it is an improvement trigger.

## Time budget

> 🟢 **MCP gateway session timeout — gh-aw v0.71.3**: The workflow declares `engine.mcp.session-timeout: 1h`, which keeps MCP gateway sessions (including `safeoutputs`) alive for the full 60-min job. Timer A starts before the agent while host-side setup/sandbox/MCP initialization is still running, so **plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. The operative constraint is Timer A (job `timeout-minutes: 60`) and Timer B (~60-min Copilot API session) — not the legacy ~30-min idle drop.

**Single run** (target ~40 agent minutes in a 60-min job, hard deadline 45 agent minutes for the PR call):

| Minutes | Phase |
|---------|-------|
| 0–3 | MCP pre-warm + date resolution |
| 3–6 | Scan untranslated articles; build prioritised work list, cap at safe-outputs 100-file budget |
| 6–34 | Translate + validate in priority order (highest-value types first); trim batch size before quality |
| 34–40 | Final validation with `scripts/validate-news-translations.ts`, stage scoped files, commit |
| 40–42 | **One** `safeoutputs___create_pull_request` call — **HARD DEADLINE agent minute 45** |

If a batch cannot finish under this budget, commit the translations completed so far and call `safeoutputs___create_pull_request` with label `partial`; the next scheduled run picks up the remaining languages. A partial PR is always better than losing the whole batch to Timer A.

All non-workflow-specific rules are in the imported modules — do not restate them here.
