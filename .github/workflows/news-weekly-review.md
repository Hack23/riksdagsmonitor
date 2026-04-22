---
name: "News: Weekly Review"
description: Generates weekly review retrospective articles in core languages (EN, SV). Translations handled by news-translate workflow. Runs Saturdays to review the past week.
strict: false
imports:
  - ../prompts/00-base-contract.md
  - ../prompts/01-bash-and-shell-safety.md
  - ../prompts/02-mcp-access.md
  - ../prompts/03-data-download.md
  - ../prompts/04-analysis-pipeline.md
  - ../prompts/05-analysis-gate.md
  - ../prompts/06-article-generation.md
  - ../prompts/07-commit-and-pr.md
  - ../prompts/ext/tier-c-aggregation.md
on:
  schedule: weekly on saturday around 9:00
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD) for manual backfills. Defaults to today when omitted or scheduled.'
        required: false
      force_generation:
        description: Force generation even if recent articles exist
        type: boolean
        required: false
        default: false
      languages:
        description: 'Core languages for content generation (en,sv | nordic | eu-core | all). Translations for remaining languages are handled by the dedicated news-translate workflow.'
        required: false
        default: en,sv
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts.'
        required: false
        default: deep

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 55

concurrency:
  group: gh-aw-news-weekly-review-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

sandbox:
  agent: awf
  mcp:
    port: 8080
    keepalive-interval: 300 # 5m ping to keep MCP connections alive; Copilot API token expires ~60min so PR must be created within 25min of agent start

runtimes:
  node:
    version: "25"

network:
  allowed:
    - node
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

safe-outputs:
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
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - raw.githubusercontent.com
    - hack23.github.io
  max-patch-size: 4096
  create-pull-request:
    labels: [agentic-news, analysis-data]
    draft: false
    expires: 14d
    max: 1
  add-comment: {}
  dispatch-workflow:
    workflows: [news-translate]
    max: 1

steps:
  - name: Setup Node.js
    uses: actions/setup-node@6044e13b5dc448c55e2357c09f80417699197238 # v6.2.0
    with:
      node-version: '25'

  - name: Install dependencies
    run: |
      npm ci --prefer-offline --no-audit

  - name: Pre-warm MCP server (Render.com cold start mitigation)
    run: |
      echo "🔥 Pre-warming riksdag-regering MCP server via MCP protocol..."
      MCP_URL="https://riksdag-regering-ai.onrender.com/mcp"
      WARM=false
      for i in 1 2 3 4 5 6; do
        RESP=$(curl -sf --max-time 30 -X POST \
          -H "Content-Type: application/json" \
          -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
          "$MCP_URL" 2>/dev/null) || true
        if echo "$RESP" | grep -q '"tools"'; then
          TOOL_COUNT=$(echo "$RESP" | grep -o '"name"' | wc -l)
          echo "✅ MCP server responded on attempt $i with $TOOL_COUNT tools registered"
          WARM=true
          break
        fi
        echo "⏳ Attempt $i/6 — server may be cold-starting, waiting 20s..."
        sleep 20
      done
      if [ "$WARM" = "false" ]; then
        echo "⚠️ MCP server did not respond after 6 attempts — agent will retry via in-prompt health gate"
      fi

  - name: Pre-flight external endpoint reachability check (runs before MCP Gateway)
    run: |
      echo "🔍 Network Diagnostics — $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
      echo "═══════════════════════════════════════════"
      echo ""
      echo "📡 DNS Resolution Tests:"
      for domain in riksdag-regering-ai.onrender.com api.scb.se api.worldbank.org data.riksdagen.se www.riksdagen.se www.regeringen.se; do
        if nslookup "$domain" >/dev/null 2>&1; then
          IP=$(nslookup "$domain" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | head -1 | awk '{print $2}')
          echo "  ✅ $domain → $IP"
        else
          echo "  ❌ $domain — DNS FAILED"
        fi
      done
      echo ""
      echo "🌐 HTTPS Connectivity Tests:"
      for url in \
        "https://riksdag-regering-ai.onrender.com/mcp" \
        "https://api.scb.se/OV0104/v2beta" \
        "https://api.worldbank.org/v2/country/SE?format=json" \
        "https://data.riksdagen.se/dokumentlista/?sok=test&doktyp=bet&utformat=json&a=1" \
      ; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
        DOMAIN=$(echo "$url" | sed 's|https://||' | cut -d/ -f1)
        if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
          echo "  ✅ $DOMAIN → HTTP $HTTP_CODE"
        elif [ "$HTTP_CODE" = "000" ]; then
          echo "  ❌ $DOMAIN → TIMEOUT/UNREACHABLE"
        else
          echo "  ⚠️ $DOMAIN → HTTP $HTTP_CODE"
        fi
      done
      echo ""
      echo "🔌 MCP Server Tool Count:"
      TOOL_RESP=$(curl -sf --max-time 15 -X POST \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
        "https://riksdag-regering-ai.onrender.com/mcp" 2>/dev/null) || TOOL_RESP=""
      if echo "$TOOL_RESP" | grep -q '"tools"'; then
        TOOL_COUNT=$(echo "$TOOL_RESP" | grep -o '"name"' | wc -l)
        echo "  ✅ riksdag-regering MCP: $TOOL_COUNT tools registered"
      else
        echo "  ❌ riksdag-regering MCP: No tools response (server may still be starting)"
      fi
      echo ""
      echo "═══════════════════════════════════════════"

engine:
  id: copilot
  model: claude-opus-4.7
---

# 📊 Weekly Review

Retrospective 7-day political intelligence review synthesising every article-type from the past week. Tier-C reference-grade output (14 artifacts). Core languages EN, SV.

## Tier-C (reference-grade) requirements

This workflow imports `../prompts/ext/tier-c-aggregation.md`. Produce **all 14 artifacts** (9 core + 5 Tier-C) and cross-reference sibling analyses. See the extension for the full rules.

## What this workflow does

- **Article type**: `weekly-review`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/weekly-review/`
- **Core languages produced**: `en`, `sv` (remaining 12 languages dispatched to `news-translate`)
- **One pull request per run** containing analysis + articles + visualisation data.

## Time budget (60 min, minimum 45 min of real work)

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–2 | MCP pre-warm + `get_sync_status` | 02 |
| 2–6 | Download data + catalogue | 03 |
| 6–25 | Analysis Pass 1 (methodology read + per-doc analyses + 9 artifacts) | 04 |
| 25–35 | Analysis Pass 2 (read-back + improvements) | 04 |
| 35–37 | Analysis Gate | 05 |
| 37–48 | Article Pass 1 + Pass 2 (EN, SV) | 06 |
| 48–55 | Visual + link validation | 06 |
| 55–60 | Stage, commit, **ONE** `safeoutputs___create_pull_request` | 07 |

Trim scope before quality. Never open a second PR to "save" partial work — there is no second PR.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's article exists (analysis is always refreshed regardless)
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

## Dedup & analysis-only path

If articles for `$ARTICLE_DATE` + `weekly-review` already exist **and** `force_generation=false`:

- Still run the full analysis pipeline (modules 03 → 04 → 05).
- Commit the analysis.
- Open the single PR with title `📊 Analysis Only — Weekly Review — $ARTICLE_DATE` and label `analysis-only`.

Analysis is the primary product — a run never "does nothing" just because articles exist.

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, article generation, commit & PR policy) live in the imported modules.
