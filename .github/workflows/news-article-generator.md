---
name: "News: Article Generator (Manual)"
description: Manual-only multi-type article generator. For automated per-type generation, use the dedicated news-committee-reports, news-propositions, news-motions, news-week-ahead, news-month-ahead, news-weekly-review, news-monthly-review workflows. For translations, use news-translate workflow.
strict: false  # Allow custom network domain riksdag-regering-ai.onrender.com (trusted MCP server)
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
  workflow_dispatch:
    inputs:
      article_types:
        description: Comma-separated article types (week-ahead,month-ahead,weekly-review,monthly-review,committee-reports,propositions,motions,interpellations,breaking,deep-inspection). Leave empty for day-of-week schedule.
        required: false
      force_generation:
        description: Force generation even if recent articles exist
        type: boolean
        required: false
        default: false
      languages:
        description: 'Core content languages (en,sv | nordic | eu-core | all | custom). Use news-translate workflow for remaining languages, or pass all for single-run generation.'
        required: false
        default: en,sv
      document_ids:
        description: 'Comma-separated Riksdag document IDs for deep-inspection analysis (e.g. H901FiU1,H901JuU25)'
        required: false
      document_urls:
        description: 'Comma-separated URLs to specific documents for deep analysis. Supports riksdagen.se (auto-resolves dok_id), data.riksdagen.se, regeringen.se URLs (fetched via g0v for content analysis), and github.com URLs (fetched as raw content for comparison/reference analysis)'
        required: false
      focus_topic:
        description: 'Specific topic or policy area to focus deep-inspection analysis on (e.g. "cyber security, cyberthreats, ai security, ai future", defence, migration, budget). Multiple related keywords can be comma-separated for richer analysis.'
        required: false
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
  group: gh-aw-news-article-generator-${{ inputs.article_types || 'manual' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

sandbox:
  mcp:
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

# 🧭 Article Generator (Manual)

Manual-only multi-type article generator. Accepts comma-separated article_types input. When `deep-inspection` is among the types, Tier-C 14-artifact gate applies.

## Tier-C (reference-grade) requirements

This workflow imports `../prompts/ext/tier-c-aggregation.md`. Produce **all 14 artifacts** (9 core + 5 Tier-C) and cross-reference sibling analyses. See the extension for the full rules.

## What this workflow does

- **Article type**: `multi`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/<per-type>/`
- **Core languages produced**: `en`, `sv` (remaining 12 languages dispatched to `news-translate`)
- **Two-run model**: Run 1 produces an `analysis-only` PR (14 artifacts per type); Run 2 detects existing analysis and produces an articles PR.

## Time budget

**Run 1 — Analysis mode** (no prior analysis found, ~45 min):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–2 | MCP pre-warm + pre-flight analysis check | 02 / 03 |
| 2–7 | Download data + catalogue | 03 |
| 7–27 | Analysis Pass 1 (methodology read + per-doc analyses + 14 artifacts incl. 5 Tier-C) | 04 / ext |
| 27–38 | Analysis Pass 2 (read-back + improvements) | 04 |
| 38–41 | Analysis Gate (Tier-C extended gate) | 05 |
| 41–45 | Stage analysis, commit, **ONE** `safeoutputs___create_pull_request` (analysis-only) | 07 |

**Run 2 — Article mode** (analysis exists on disk, ~25 min):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–2 | MCP pre-warm + pre-flight check (SKIP_ANALYSIS=true) | 02 / 03 |
| 2–5 | Read all 14 analysis artifacts into context | 06 |
| 5–18 | Article Pass 1 + Pass 2 (EN, SV) | 06 |
| 18–22 | Visual + link validation | 06 |
| 22–25 | Stage articles, commit, **ONE** `safeoutputs___create_pull_request` | 07 |

Trim scope before quality. Never open a second PR within a run — there is no second PR.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's article exists; also forces analysis re-run
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/<type>/` already contains all 9 core artifacts:

- **No analysis found** → Analysis mode: download data, run Pass 1 + Pass 2 + Tier-C Gate (14 artifacts), commit analysis artifacts, open `analysis-only` PR, stop.
- **Analysis found** → Article mode: read existing analysis, generate articles, commit articles, open articles PR + dispatch `news-translate`.

Repeated runs for the same `$ARTICLE_DATE` always use the same analysis folder when `force_generation=false`. Analysis is the primary product — a run never produces nothing.

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, article generation, commit & PR policy) live in the imported modules.
