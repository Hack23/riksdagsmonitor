---
name: "News: Government Propositions"
description: Generates government propositions analysis articles in core languages (EN, SV). Translations for remaining 12 languages are handled by the dedicated news-translate workflow via dispatch-workflow. Single article type per run.
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
on:
  schedule: daily around 5:00 on weekdays
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
  group: gh-aw-news-propositions-${{ inputs.article_date || 'today' }}
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

# 📜 Government Propositions

Generates deep political intelligence articles on Swedish government propositions in core languages (EN, SV). Translations dispatched to `news-translate`.

## What this workflow does

- **Article type**: `propositions`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/propositions/`
- **Core languages produced**: `en`, `sv` (remaining 12 languages dispatched to `news-translate`)
- **Two-run model**: Run 1 produces an `analysis-only` PR; Run 2 (next scheduled run, same day) detects existing analysis and produces an articles PR.

## Time budget

> 🔴 **CRITICAL — safeoutputs MCP idle timeout (~30 min)**: The `safeoutputs` MCP server runs a Streamable-HTTP session that expires after **~30–35 minutes of idle time** (confirmed in run [24820030825](https://github.com/Hack23/riksdagsmonitor/actions/runs/24820030825) where all `create_pull_request` calls at minute ~32 failed with `session not found`, losing 37 files of completed analysis work). `sandbox.mcp.keepalive-interval: 300` keeps TCP connections alive but does **NOT** refresh the server-side session. **Your first and only `safeoutputs___*` call MUST happen by minute 28 at the latest.** This is a harder deadline than the ~60-minute Copilot-API token window described in `00-base-contract.md §Session keepalive requirement` and overrides the generic 48-min deadline in `07-commit-and-pr.md §Deadline enforcement` for this workflow.
>
> **AI-FIRST within the compressed budget**: Pass 2 is still mandatory (AI FIRST principle, §"5. 🔴 AI FIRST Quality Principle" in repo custom instructions). Under the tightened ~28-min Run 1 budget, prefer **scope compression over iteration skipping** — reduce the **download/manifest scope** if needed (for example, fewer `dok_id` entries in `data-download-manifest.md`), but maintain **1:1 per-document coverage** for every `dok_id` that remains in the manifest (required by `05-analysis-gate.md` check 2) and always perform a full read-back-and-improve Pass 2 on whatever artifacts exist. For scheduled runs treat `analysis_depth` as `standard` in practice even if the input defaults to `deep`; reserve `deep`/`comprehensive` for manual `workflow_dispatch` backfills where a human can monitor for a longer-session environment. A smaller manifest with complete per-document coverage and genuine iteration is always strictly better than a broader manifest that cannot clear the Analysis Gate or never reaches GitHub.

**Run 1 — Analysis mode** (no prior analysis found, ~28 min — produces all 23 artifacts):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–2 | MCP pre-warm + pre-flight analysis check | 02 / 03 |
| 2–6 | Download data + catalogue | 03 |
| 6–18 | Analysis Pass 1 (methodology read + per-doc analyses + **all 23 artifacts**: Family A 9 + B 2 + C 5 + D 7) | 04 |
| 18–24 | Analysis Pass 2 (read-back + improvements on all 22 text files) | 04 |
| 24–25 | Analysis Gate (checks 1–8) | 05 |
| 25–28 | Stage analysis, commit, **ONE** `safeoutputs___create_pull_request` (analysis-only) — **HARD DEADLINE minute 28** | 07 |

**Run 2 — Article mode** (analysis exists on disk, ~28 min):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–2 | MCP pre-warm + pre-flight check (SKIP_ANALYSIS=true) | 02 / 03 |
| 2–6 | Read all 23 analysis artifacts into context (Families A+B+C+D) | 06 |
| 6–18 | Article Pass 1 + Pass 2 (EN, SV) | 06 |
| 18–22 | Visual + link validation | 06 |
| 22–28 | Stage articles, commit, **ONE** `safeoutputs___create_pull_request` — **HARD DEADLINE minute 28** | 07 |

Trim scope before quality. Never open a second PR within a run — there is no second PR. **If you reach minute 25 without staging, stop all remaining analysis/article work, commit whatever exists on disk (include `[early-pr]` in the commit message), and call `safeoutputs___create_pull_request` immediately** — a partial-but-delivered PR is infinitely better than losing all work to a `session not found` error.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's article exists; also forces analysis re-run
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/propositions/` already contains all **23 required artifacts** (Families A+B+C+D):

- **No analysis found** → Analysis mode: download data, run Pass 1 + Pass 2 + Gate, commit analysis artifacts, open `analysis-only` PR, stop.
- **Analysis found** → Article mode: read existing analysis, generate articles, commit articles, open articles PR + dispatch `news-translate`.

Repeated runs for the same `$ARTICLE_DATE` always use the same analysis folder when `force_generation=false`. Analysis is the primary product — a run never produces nothing.

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, article generation, commit & PR policy) live in the imported modules.
