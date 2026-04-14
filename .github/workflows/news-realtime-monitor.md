---
name: News Realtime Monitor
description: Monitors Riksdag and Government for real-time updates and generates breaking news articles in core languages (EN, SV) with Playwright validation. Translations handled by news-translate workflow. Runs twice daily on weekdays, once on weekends.
strict: false  # Allow custom network domain riksdag-regering-ai.onrender.com (trusted MCP server)
on:
  schedule:
    # Run twice during Swedish parliamentary working hours (CET/CEST)
    # 10:00 UTC (11:00 CET) - Mid-morning check
    - cron: '0 10 * * 1-5'
    # 14:00 UTC (15:00 CET) - Afternoon check
    - cron: '0 14 * * 1-5'
    # Weekend: single midday check for government press releases, crisis, urgent documents
    - cron: '0 12 * * 0,6'
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD) for manual backfills. Defaults to today when omitted or scheduled.'
        required: false
      article_types:
        description: 'Comma-separated article types to generate (breaking,committee-reports,propositions,motions,interpellations,week-ahead,month-ahead,weekly-review,monthly-review,deep-inspection). Default: breaking'
        required: false
        default: breaking
      focus:
        description: 'Focus area: votes, debates, questions, all'
        required: false
        default: all
      languages:
        description: 'Core content languages (en,sv | nordic | eu-core | all). Translations handled by news-translate workflow.'
        required: false
        default: en,sv
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts. Default: deep (minimum 15 min analysis, Mermaid diagrams required).'
        required: false
        default: deep

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read
  
timeout-minutes: 45

concurrency:
  group: gh-aw-news-realtime-monitor-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

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
    container: "node:lts-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:
    container: "node:lts-alpine"
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
  playwright:
  repo-memory:
    branch-name: memory/news-generation
    allowed-extensions: [".md", ".json"]
    max-file-size: 51200
    max-file-count: 50
    max-patch-size: 51200

safe-outputs:
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
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
  create-pull-request:
    labels: [agentic-news, analysis-data]
    draft: false
    expires: 14d
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
      echo "🔄 Starting background keep-alive pinger (every 30s, max 15 min)..."
      KEEP_ALIVE_END=$(($(date +%s) + 900))
      while [ "$(date +%s)" -lt "$KEEP_ALIVE_END" ]; do
        curl -sf --max-time 10 -X POST \
          -H "Content-Type: application/json" \
          -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
          "$MCP_URL" -o /dev/null 2>/dev/null || true
        sleep 30
      done &
      KEEP_ALIVE_PID=$!
      echo "Keep-alive PID: $KEEP_ALIVE_PID (auto-exits after 15 min)"

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
  model: claude-opus-4.6
---

# 🔴 Real-Time Riksdag Monitor

You are the **Real-Time Political Monitor** for Riksdagsmonitor. Detect significant parliamentary activity and generate breaking news articles using the **purpose-built TypeScript scripts**.

## 🔧 Workflow Dispatch Parameters

- **article_types** = `${{ github.event.inputs.article_types }}`
- **focus** = `${{ github.event.inputs.focus }}`
- **languages** = `${{ github.event.inputs.languages }}`
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}`

## ⚠️ CRITICAL: Bash Tool Call Format

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "Bash Tool Call Format". Key rule: every `bash` call MUST have both `command` AND `description` parameters. Example: `bash({ command: "date -u '+%Y-%m-%d'", description: "Get current UTC date" })`

## 🛡️ AWF Shell Safety — MANDATORY for Agent-Generated Bash

> **The Agent Workflow Firewall (AWF) blocks dangerous shell expansion patterns.** Fenced bash blocks in init steps run as normal shell, but any command YOU generate via the `bash` tool IS subject to AWF filtering. You MUST follow these rules:

| ❌ BLOCKED pattern | ✅ SAFE alternative |
|---|---|
| `$`+`{VAR}` | `$VAR` (no curly braces) |
| `$`+`{VAR:-default}` | Set default first: `if [ -z "$VAR" ]; then VAR=default; fi` then use `$VAR` |
| `$`+`(command)` | Run as separate command, or use `find -exec` |
| `$`+`(basename $f)` | Use `find -exec basename {} \;` or `ls` |
| `$`+`{PIPESTATUS[0]}` | Use `set -o pipefail` and check `$?` immediately after the pipeline, or avoid pipelines |
| `realtime-` + `$`+`{HHMM}` | `realtime-$HHMM` (no braces) |
| `for f in "$DIR/"*.json; do echo "$`+`(basename $f)"; done` | `find "$DIR" -name "*.json" -exec basename {} \;` |

**Key rules:**
1. **NEVER** use `$`+`{...}` — always use `$VAR` (no curly braces)
2. **NEVER** use `$`+`(...)` command substitution — use pipes or `find -exec`
3. **Use `find -exec`** instead of for-loops with command substitution
4. **Use direct paths** when possible (e.g., `cat analysis/daily/2026-04-07/realtime-1411/synthesis-summary.md`)

## 🔤 UTF-8 Encoding

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "UTF-8 Encoding". Summary: use native UTF-8 (`ö`, `ä`, `å`) — NEVER HTML entities (`&#246;`, `&#228;`). Author: `James Pether Sörling`.


## ⚠️ NON-NEGOTIABLE RULES

1. Every run **MUST** end with exactly one safe output tool call:
   - Articles generated → `safeoutputs___create_pull_request({...})`
   - Analysis artifacts exist but no articles → `safeoutputs___create_pull_request({...})` with analysis-only PR
   - MCP server unreachable AND no analysis artifacts → `safeoutputs___noop({"message": "..."})`
   - Tool unavailable → `safeoutputs___missing_tool({"reason": "..."})`
2. `safeoutputs___create_pull_request` handles branch creation and push. **NEVER** run `git push` or `git checkout -b`.
3. Safe output tools are **always in your tool list**. NEVER search for them via bash.
4. **NEVER** write your own MCP HTTP/JSON-RPC client. Use the scripts or direct tool calls only.
5. Exiting without calling a safe output tool = workflow failure.
6. **ALWAYS** run the full deep political analysis phase (15-20 minutes) before deciding on noop. Analysis is the primary output and must execute every run.

## 🧠 Repo Memory

Uses `memory/news-generation` branch. START: read `memory/news-generation/last-run-news-realtime-monitor.json` + `memory/news-generation/covered-documents/{YYYY-MM-DD}.json`. END: update both + `memory/news-generation/translation-status.json`. Skip already-covered dok_ids.

## ⏱️ Time Budget (45 minutes)

```bash
date +%s > /tmp/start_time.txt
read START_TIME < /tmp/start_time.txt
```

| Phase | Minutes | Action |
|-------|---------|--------|
| Setup | 0–3 | Date check, `get_sync_status()` warm-up |
| Download | 3–6 | Run data download scripts (MCP data fetch) |
| **AI Analysis** | **6–21** | **🚨 MANDATORY 15 min minimum**: Consult methodology guides + templates as needed, create per-file analysis with Mermaid diagrams and evidence tables. Run quality gate bash check. |
| Detect | 21–25 | Query MCP tools for today's activity |
| Generate | 25–33 | Run `generate-news-enhanced.ts` script (core languages by default; supports all 14 languages via `languages=all`) |
| Validate | 33–38 | Run `validate-news-generation.sh` |
| Commit+PR | 38–43 | `git add && git commit`, then `safeoutputs___create_pull_request` |

| **HARD DEADLINE** | **43–45** | 🚨 If no safe output called yet, IMMEDIATELY call `safeoutputs___noop` with reason "Time limit reached before completion" |
> ⚠️ **Analysis phase is 15 minutes minimum** — this is NOT negotiable. PR #1452 demonstrated that < 10 min produces unacceptable analysis (plain prose, no Mermaid diagrams, no evidence tables). The AI MUST consult methodology guides and templates as needed and produce publication-quality output matching [SWOT.md](../../SWOT.md) formatting standard.

**Hard cutoffs** — check elapsed time before EVERY phase:
```bash
# Restore START_TIME if available so this snippet is safe to run standalone
if [ -f /tmp/gh-aw/agent/timing.env ]; then
  . /tmp/gh-aw/agent/timing.env
fi
# Fallback: if START_TIME is still unset, initialize it to "now" to avoid huge elapsed times
if [ -z "$START_TIME" ]; then
  date +%s > /tmp/start_time.txt
  read START_TIME < /tmp/start_time.txt
fi

date +%s > /tmp/now_time.txt
read AW_NOW < /tmp/now_time.txt
ELAPSED=$(( AW_NOW - START_TIME ))
echo "⏱️ Elapsed: $((ELAPSED / 60))m $((ELAPSED % 60))s"
```
- `>= 35 min` → Stop generating, commit what you have, create PR immediately
- `>= 40 min` → STOP ALL WORK, call safe output tool (`safeoutputs___noop` or `safeoutputs___create_pull_request`) IMMEDIATELY — do NOT run any more bash commands
- **CRITICAL**: If you have not called a safe output tool and time is running out, call `safeoutputs___noop` immediately. Failing to call a safe output tool causes a workflow failure.

## Step 1: Date Validation & MANDATORY MCP Health Check

```bash
echo "=== Workflow Start - Date Validation ==="
date +%s > /tmp/start_time.txt
read START_TIME < /tmp/start_time.txt
echo "START_TIME=$START_TIME" > /tmp/gh-aw/agent/timing.env
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
date +"%Z: %A %Y-%m-%d %H:%M:%S"
echo "============================"
```

Then verify MCP connectivity — ALWAYS check data freshness first with the MANDATORY MCP Health Gate:

> **The step-level pre-warm (6 attempts × 20s) already mitigates Render.com cold starts.** This in-prompt gate is a lightweight verification — NOT a full retry loop. Do NOT spend more than 90 seconds here.
>
> **📖 Full MCP architecture, tool names, and calling conventions:** See `SHARED_PROMPT_PATTERNS.md` → "MCP Architecture & Tool Reference" section. Tool names are EXACT: riksdag tools use underscores (`get_sync_status`), World Bank uses hyphens (`get-economic-data`), SCB uses underscores (`search_tables`).

```
get_sync_status({})
```
1. Call `get_sync_status({})` — retry up to **3×** (20s wait between each, not 45s — the server is already warm from the step-level pre-warm)
2. If you get **"unknown tool"** or **"0 tools registered"** errors after 3 attempts, run a quick diagnostic:
```bash
echo "🔍 MCP Quick Diagnostic"
echo "Direct MCP server:" && curl -sf --max-time 15 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' "https://riksdag-regering-ai.onrender.com/mcp" 2>/dev/null | head -c 200 || echo "UNREACHABLE"
```
3. After 3 failures → `safeoutputs___noop({"message": "MCP server unavailable after 3 attempts — step-level pre-warm also failed"})` — do NOT fabricate content
4. **ALL content MUST come from live MCP data.** Never use cached articles, stale data, or AI-fabricated content.
5. **⏱️ Do NOT spend more than 2 minutes on MCP warmup** — proceed to analysis immediately once `get_sync_status` succeeds.

If data is stale (> 48 hours), add disclaimer. Use riksdag-regering-mcp (32 tools for Swedish parliament data). For ad-hoc queries, use `scripts/mcp-query-cli.ts` — NEVER implement custom MCP client code (PROHIBITION).

Tools with date params: `get_calendar_events` (from/tom — **⚠️ known intermittent issue: may return HTML instead of JSON; use `search_dokument` as fallback**), `search_dokument` (from_date/to_date), `search_regering` (dateFrom/dateTo). Other tools (`search_voteringar`, `get_betankanden`, `get_motioner`, `get_propositioner`, `search_anforanden`) require post-query filter by datum.

## 📅 Riksmöte (Parliamentary Session) Calculation

- Month ≥ September: `rm = "{year}/{nextYear's last 2 digits}"` (e.g., Oct 2026 → "2026/27")
- Month < September: `rm = "{prevYear}/{year's last 2 digits}"` (e.g., Feb 2026 → "2025/26")

## Step 1.5: Download Data Using Scripts

**Scripts are used ONLY for downloading data. ALL analysis is done by the AI (you) using methodologies and templates.**

> 🚨 **Scripts must be set up correctly to work in the agentic workflow.** Always source `mcp-setup.sh` first.
> If scripts fail to download data, you MUST diagnose and fix the scripts so they work.
> If you cannot fix the scripts, use direct MCP tool calls as fallback to download data.

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "$ARTICLE_DATE" ]; then
  # Prefer manual workflow_dispatch input when provided, otherwise default to today (UTC)
  if [ -n "${{ github.event.inputs.article_date }}" ]; then
    ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  else
    date -u +%Y-%m-%d > /tmp/today.txt
    read ARTICLE_DATE < /tmp/today.txt
  fi
fi
# UNIQUE RUN ID: Set HHMM timestamp ONCE for this run — persist to env file so all bash blocks use the same value
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
echo "HHMM=$HHMM" > /tmp/hhmm.env
ARTICLE_TYPE="realtime-$HHMM"
echo "📥 Downloading data for $ARTICLE_DATE (run: $ARTICLE_TYPE)..."
# CRITICAL: Source mcp-setup.sh to set MCP_SERVER_URL and MCP_AUTH_TOKEN for the AWF gateway
# Scripts download data only — analysis is done by AI afterwards
set -o pipefail
source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=$MCP_SERVER_URL" && npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 2>&1 | tee /tmp/pipeline-output.log
PIPE_EXIT=$?
set +o pipefail
if [ "$PIPE_EXIT" -ne 0 ]; then
  echo "❌ Data download script failed with exit code $PIPE_EXIT — agent MUST diagnose and fix"
  tail -30 /tmp/pipeline-output.log
  npx tsc --noEmit scripts/pre-article-analysis.ts 2>&1 | head -20 || true
fi
# Verify data was actually downloaded
find analysis/data/ -name "*.json" -type f 2>/dev/null | wc -l > /tmp/data_count.txt
read DATA_JSON_COUNT < /tmp/data_count.txt
echo "📊 JSON data files downloaded: $DATA_JSON_COUNT"
# Relocate pipeline artifacts: pre-article-analysis.ts writes to analysis/daily/$DATE/ (unscoped)
# but this workflow needs them under analysis/daily/$DATE/realtime-$HHMM/
UNSCOPED_DIR="analysis/daily/$ARTICLE_DATE"
SCOPED_DIR="$UNSCOPED_DIR/$ARTICLE_TYPE"
if [ -d "$UNSCOPED_DIR" ]; then
  mkdir -p "$SCOPED_DIR"
  if find "$UNSCOPED_DIR" -maxdepth 1 -type f -name "*.md" | grep -q .; then
    find "$UNSCOPED_DIR" -maxdepth 1 -type f -name "*.md" -exec mv -f {} "$SCOPED_DIR/" \;
    echo "📁 Moved pipeline *.md artifacts → $SCOPED_DIR (root cleaned to prevent merge conflicts)"
  fi
  if [ -d "$UNSCOPED_DIR/documents" ]; then
    mkdir -p "$SCOPED_DIR/documents"
    find "$UNSCOPED_DIR/documents" -mindepth 1 -maxdepth 1 -exec mv {} "$SCOPED_DIR/documents/" \;
    rmdir "$UNSCOPED_DIR/documents" 2>/dev/null || true
    echo "📁 Moved pipeline documents/ contents → $SCOPED_DIR/documents (root cleaned to prevent merge conflicts)"
  fi
fi
ls -la "$SCOPED_DIR/" 2>/dev/null || echo "⚠️ No output directory"
if [ "$DATA_JSON_COUNT" -eq 0 ]; then
  echo "🚨 ZERO data downloaded. Agent MUST fix scripts or use direct MCP tool calls."
fi
```

### 🔧 If Scripts Downloaded 0 Data

> Fix scripts or fall back to direct MCP tool calls. Never proceed without data.

1. **Read error log**: `cat /tmp/pipeline-output.log | tail -30`
2. **Check MCP setup**: `echo "MCP_SERVER_URL=$MCP_SERVER_URL"` — must be `http://host.docker.internal:80/mcp/riksdag-regering`
3. **Fix script issues**: read source with `view`, fix with `edit`, re-run
4. **If script fix fails**: use direct MCP tools (`search_dokument`, `get_propositioner`, etc.), save to `analysis/data/documents/{type}/`

### 🚨🚨🚨 MANDATORY: AI Must Analyse ALL Data Using Methods & Templates (15 min minimum)

> **THIS IS YOUR PRIMARY JOB.** Minimum 15 minutes. For every document, read methodology upfront then apply ALL 6 analytical lenses. Templates require structured tables, color-coded Mermaid diagrams, dok_id evidence citations — cannot be done in < 15 minutes. PR #1452 proved < 10 min = REJECTED.

**MUST do (no exceptions):**

1. **Read upfront**: `analysis/methodologies/ai-driven-analysis-guide.md` + `analysis/templates/per-file-political-intelligence.md`
2. **Consult as needed**: `political-swot-framework.md`, `political-risk-methodology.md`, `political-threat-framework.md`, `political-classification-guide.md`, `political-style-guide.md`; templates: `synthesis-summary.md`, `risk-assessment.md`, `swot-analysis.md` (needs Context table + evidence tables with dok_id/confidence/impact + Mermaid SWOT Quadrant), `stakeholder-impact.md`, `significance-scoring.md`
3. **For EVERY document**: create `{dok_id}-analysis.md` with ALL 6 analytical lenses, ≥1 color-coded Mermaid with `style` directives, evidence citations with dok_id/vote counts/party names
4. **Create/rewrite ALL 7 synthesis files** in `analysis/daily/$ARTICLE_DATE/realtime-$HHMM/` — exact template structure, no `[REQUIRED]` placeholders
5. **Run quality gate** (Step D above). Fix ALL failures before continuing.
6. **Commit data AND analysis**: `git add analysis/data/ "analysis/daily/$ARTICLE_DATE/realtime-$HHMM/"` (AWF: use `$VAR` not `$VAR`)

> ❌ FAILURE MODES: skipping analysis; plain prose without tables/diagrams; stubs with 0 evidence citations; missing dok_id; missing color-coded Mermaid; `[REQUIRED]` placeholders; SWOT without evidence tables; < 15 min analysis.

### 🔄 Data Lookback Fallback

> Never produce empty/stub analysis. If no data for today, look back (up to 7 days) to find unanalyzed data.

```bash
if [ -z "$ARTICLE_DATE" ]; then
  if [ -n "${{ github.event.inputs.article_date }}" ]; then
    ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  else
    date -u +%Y-%m-%d > /tmp/today.txt
    read ARTICLE_DATE < /tmp/today.txt
  fi
fi
ORIGINAL_ARTICLE_DATE="$ARTICLE_DATE"
MANIFEST_PATH="analysis/daily/$ARTICLE_DATE/data-download-manifest.md"
DATE_DOCS_ANALYZED=0
if [ -f "$MANIFEST_PATH" ]; then
  grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" 2>/dev/null | grep -oE '[0-9]+' | head -1 > /tmp/docs_a3.txt || echo 0 > /tmp/docs_a3.txt
read DATE_DOCS_ANALYZED < /tmp/docs_a3.txt
DATE_DOCS_ANALYZED=$DATE_DOCS_ANALYZED
fi
[ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
echo "📄 Docs analyzed for $ARTICLE_DATE: $DATE_DOCS_ANALYZED"
if [ "$DATE_DOCS_ANALYZED" -eq 0 ]; then
  echo "⚠️ Activating 7-day lookback fallback..."
  DATA_DATE=""
  for DAYS_BACK in 1 2 3 4 5 6 7; do
    date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null > /tmp/lookback.txt || echo "" > /tmp/lookback.txt
    read LOOKBACK_DATE < /tmp/lookback.txt
    [ -z "$LOOKBACK_DATE" ] && continue
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    [ -f "$MANIFEST_PATH" ] && grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" 2>/dev/null | grep -oE '[0-9]+' | head -1 > /tmp/docs_a3.txt || echo 0 > /tmp/docs_a3.txt
read DATE_DOCS_ANALYZED < /tmp/docs_a3.txt
DATE_DOCS_ANALYZED=$DATE_DOCS_ANALYZED
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then DATA_DATE="$LOOKBACK_DATE"; break; fi
    source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 2>/dev/null || true
    DATE_DOCS_ANALYZED=0
    [ -f "$MANIFEST_PATH" ] && grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" 2>/dev/null | grep -oE '[0-9]+' | head -1 > /tmp/docs_a3.txt || echo 0 > /tmp/docs_a3.txt
read DATE_DOCS_ANALYZED < /tmp/docs_a3.txt
DATE_DOCS_ANALYZED=$DATE_DOCS_ANALYZED
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then DATA_DATE="$LOOKBACK_DATE"; break; fi
  done
  if [ -n "$DATA_DATE" ] && [ "$DATA_DATE" != "$ORIGINAL_ARTICLE_DATE" ]; then
    SRC_DIR="analysis/daily/$DATA_DATE/realtime-$HHMM"
    DST_DIR="analysis/daily/$ORIGINAL_ARTICLE_DATE/realtime-$HHMM"
    if [ -d "$SRC_DIR" ]; then
      mkdir -p "$DST_DIR"; cp -r "$SRC_DIR"/* "$DST_DIR/" 2>/dev/null || true
    fi
    ARTICLE_DATE="$ORIGINAL_ARTICLE_DATE"
  elif [ -n "$DATA_DATE" ]; then
    ARTICLE_DATE="$DATA_DATE"
  fi
  echo "🗓️ Analysis date: $ARTICLE_DATE"
  if [ -n "$GITHUB_ENV" ]; then echo "ARTICLE_DATE=$ARTICLE_DATE" >> "$GITHUB_ENV"; fi
fi
npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null > /tmp/pending.json || echo \'{"pendingAnalysis":0}\' > /tmp/pending.json
PENDING=0
if [ -f /tmp/pending.json ]; then
  grep -o \'"pendingAnalysis":[0-9]*\' /tmp/pending.json 2>/dev/null | grep -o \'[0-9]*$\' > /tmp/pending_count.txt 2>/dev/null || echo 0 > /tmp/pending_count.txt
  read PENDING < /tmp/pending_count.txt
fi
[ -z "$PENDING" ] && PENDING=0
echo "📊 Pending analyses: $PENDING"
```

### Per-File Analysis & Daily Synthesis (done by AI, not scripts)

> Scripts download data and produce **stub files only**. The AI agent MUST **replace ALL stubs** with real analysis following methods and templates. This is your PRIMARY job — do NOT skip it.

#### 🚨 Per-File Analysis Protocol (BLOCKING — must complete before Step 2)

After data is downloaded, you MUST complete ALL of these steps before proceeding to event detection:

**Step A — Read templates and methodologies** (FIRST, before writing anything):
1. Follow the organization-wide **SHARED_PROMPT_PATTERNS Step 2 + Step 3** exactly: read **all 6 methodology guides** and **all 8 analysis templates** defined there (in `analysis/methodologies/` and `analysis/templates/`) **before writing any analysis**. Do NOT subset or skip any required document.
2. After completing SHARED_PROMPT_PATTERNS Steps 2–3, (re)read these **news-monitor-specific assets**:
   - `view analysis/templates/per-file-political-intelligence.md` — read FULLY, note the required structure
   - `view analysis/methodologies/ai-driven-analysis-guide.md` — read the "BAD vs GOOD" examples
   - `view analysis/methodologies/political-swot-framework.md` — understand evidence tables

**Step B — Create real per-file analyses** (for EVERY document):
1. List all downloaded documents: `find analysis/daily/$ARTICLE_DATE/documents/ -name "*.json" -type f` (⚠️ AWF: use `$VAR` not `$VAR`, never use `$(cmd)`)
2. For EACH JSON file:
   a. Read it with `view` — extract dok_id, titel, datum, parti, organ
   b. Apply ALL 6 analytical lenses (classification, SWOT, risk, Political Threat Taxonomy, stakeholders, forward indicators)
   c. Write or rewrite the per-file analysis markdown so that its filename matches the `*-analysis.md` convention (for example `{dok_id}-analysis.md`) and follows the per-file template EXACTLY
   d. Include ≥1 color-coded Mermaid diagram with `style` directives and REAL data
   e. Include structured evidence tables with dok_id, confidence, impact columns
   f. SWOT quadrants must have REAL entries — NOT "_No strengths identified_"
   g. Stakeholder perspectives must cite SPECIFIC data — NOT generic boilerplate like "this document requires assessment"

**Step C — Rewrite daily synthesis files** (ALL 7 files must match templates):
1. Read each template: `view analysis/templates/{template}.md`
2. Rewrite each daily file to match its template EXACTLY
3. Every claim must cite real data (dok_id, vote counts, party names)

**Step D — Run quality gate** (BLOCKING — must pass before proceeding):

> ⚠️ AWF Safety: use `$VAR` not `$VAR`, avoid `$(cmd)`, use `find -exec basename {} \;` instead of `$(basename $f)`.

```bash
if [ -z "$ARTICLE_DATE" ]; then
  if [ -n "${{ github.event.inputs.article_date }}" ]; then
    ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  else
    date -u +%Y-%m-%d > /tmp/today.txt
    read ARTICLE_DATE < /tmp/today.txt
  fi
fi
[ -f /tmp/hhmm.env ] && . /tmp/hhmm.env
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/realtime-$HHMM"
QUALITY_PASS=true; FAIL_COUNT=0
echo "=== Quality Gate: $ANALYSIS_DIR ==="
# Count files (AWF-safe: pipe to file)
find "$ANALYSIS_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l > /tmp/daily_count.txt
read DAILY_COUNT < /tmp/daily_count.txt
find "$ANALYSIS_DIR/documents" -name "*-analysis.md" -type f 2>/dev/null | wc -l > /tmp/perfile_count.txt
read PERFILE_COUNT < /tmp/perfile_count.txt
echo "Daily: $DAILY_COUNT | Per-file: $PERFILE_COUNT"
for f in "$ANALYSIS_DIR"/*.md; do
  [ ! -f "$f" ] && continue
  grep -c '```mermaid' "$f" 2>/dev/null > /tmp/mc.txt || echo 0 > /tmp/mc.txt
  read MC < /tmp/mc.txt
  [ "$MC" -eq 0 ] && { echo "❌ $f: NO Mermaid"; QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT+1)); }
  grep -q '```mermaid' "$f" 2>/dev/null && grep -c 'style.*fill:#' "$f" 2>/dev/null > /tmp/sc.txt || echo 0 > /tmp/sc.txt
  read SC < /tmp/sc.txt && [ "$SC" -eq 0 ] && { echo "❌ $f: no color styles"; QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT+1)); }
done
for f in "$ANALYSIS_DIR"/*.md "$ANALYSIS_DIR"/documents/*-analysis.md; do
  [ ! -f "$f" ] && continue
  grep -c '\[REQUIRED\]' "$f" 2>/dev/null > /tmp/rc.txt || echo 0 > /tmp/rc.txt
  read RC < /tmp/rc.txt
  [ "$RC" -gt 0 ] && { echo "❌ $f: $RC [REQUIRED] placeholders"; QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT+1)); }
done
SWOT_FILE="$ANALYSIS_DIR/swot-analysis.md"
if [ -f "$SWOT_FILE" ]; then
  grep -c '|.*dok_id\||.*Evidence' "$SWOT_FILE" 2>/dev/null > /tmp/tc_count.txt || echo 0 > /tmp/tc_count.txt
  read TC < /tmp/tc_count.txt
  [ "$TC" -eq 0 ] && { echo "❌ swot-analysis.md: no evidence tables"; QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT+1)); }
fi
STUB_COUNT=0
for f in "$ANALYSIS_DIR"/documents/*-analysis.md; do
  [ ! -f "$f" ] && continue
  SS=0
  grep -cE '_No (strengths|weaknesses|opportunities|threats) identified_' "$f" 2>/dev/null > /tmp/es.txt || echo 0 > /tmp/es.txt
  read ES < /tmp/es.txt
  [ "$ES" -ge 2 ] && SS=$((SS+2))
  grep -c 'this document requires assessment' "$f" 2>/dev/null > /tmp/bs.txt || echo 0 > /tmp/bs.txt
  read BS < /tmp/bs.txt
  [ "$BS" -ge 2 ] && SS=$((SS+2))
  grep -c '```mermaid' "$f" 2>/dev/null > /tmp/mc.txt || echo 0 > /tmp/mc.txt
  read MC < /tmp/mc.txt; [ "$MC" -eq 0 ] && SS=$((SS+1))
  grep -c '^|' "$f" 2>/dev/null > /tmp/tc2.txt || echo 0 > /tmp/tc2.txt
  read TC < /tmp/tc2.txt
  [ "$TC" -lt 2 ] && SS=$((SS+1))
  [ "$SS" -ge 3 ] && { echo "❌ $f: stub (score=$SS)"; STUB_COUNT=$((STUB_COUNT+1)); QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT+1)); }
done
if [ -d "$ANALYSIS_DIR/documents" ]; then
  find "$ANALYSIS_DIR/documents" -name "*.json" -type f 2>/dev/null | wc -l > /tmp/jc.txt
  read JC < /tmp/jc.txt
  find "$ANALYSIS_DIR/documents" -name "*-analysis.md" -type f 2>/dev/null | wc -l > /tmp/ac.txt
  read AC < /tmp/ac.txt
  [ "$JC" -gt 0 ] && [ "$AC" -lt "$JC" ] && { echo "❌ $AC/$JC analyses"; QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT+1)); }
fi
if [ "$QUALITY_PASS" = "true" ]; then
  echo "✅ Quality gate PASSED"
else
  echo "❌ Quality gate FAILED ($FAIL_COUNT failures) — fix then re-run. Templates: analysis/templates/"
  [ "$STUB_COUNT" -gt 0 ] && echo "🚨 $STUB_COUNT stubs — replace with evidence-based analysis"
fi
```

> 🚨 **BLOCKING**: Fix all failures before proceeding. Read `analysis/templates/<template>.md`, rewrite failing files, re-run gate.

### 🔴 MANDATORY: Batch Analysis Enrichment (Prevents Empty "0 Documents Analyzed" Files)

> **Root Cause**: The `pre-article-analysis.ts` script filters documents by exact date match. When no documents match the exact analysis date, batch files report "0 documents analyzed" — this violates `ai-driven-analysis-guide.md` quality requirements.

**After per-file analysis and quality gate, check if batch files are empty and enrich them:**

1. Check `synthesis-summary.md` — if it reports "0 documents analyzed" but per-document analyses exist in `documents/`, aggregate the per-doc findings into all 9 batch files
2. If NO per-doc analyses exist AND batch files show "0 documents analyzed", use MCP tools directly (`search_dokument`, `get_propositioner`, `get_betankanden`, `search_anforanden`) to find recent parliamentary activity and create meaningful analysis
3. Each enriched batch file MUST include: ≥1 Mermaid diagram, structured tables, evidence citations, confidence labels
4. **NEVER commit batch files that report "0 documents analyzed" when analysis data is available**
5. See `ai-driven-analysis-guide.md` "Deep-Inspection Batch Analysis Enrichment Protocol (v4.1)" for full requirements

### 🚨 MANDATORY: Commit Data AND Analysis

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Verify data was downloaded** — `find analysis/data/ -name "*.json" -type f | wc -l` must be > 0
2. **Verify analysis was created** — every downloaded document has a `-analysis.md` file
3. **Verify daily synthesis files follow templates** — no `[REQUIRED]` placeholders, Mermaid diagrams with real data
4. **ALWAYS commit data AND analysis together**:

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "$ARTICLE_DATE" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  if [ -z "$ARTICLE_DATE" ]; then
  date -u +%Y-%m-%d > /tmp/today.txt
  read ARTICLE_DATE < /tmp/today.txt
fi
fi
[ -f /tmp/hhmm.env ] && . /tmp/hhmm.env
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/realtime-$HHMM"
ANALYSIS_COUNT=0
if [ -d "$ANALYSIS_DIR" ]; then
  find "$ANALYSIS_DIR" -type f 2>/dev/null | wc -l > /tmp/analysis_count.txt
  read ANALYSIS_COUNT < /tmp/analysis_count.txt
fi
if [ "$ANALYSIS_COUNT" -gt 0 ]; then
  echo "📊 Found $ANALYSIS_COUNT analysis artifacts in $ANALYSIS_DIR — these MUST be committed (do NOT use safeoutputs___noop)"
else
  echo "📊 Found 0 analysis artifacts — safeoutputs___noop is allowed (no files to commit)"
fi
```

> **🚨 CRITICAL RULE: Never call `safeoutputs___noop` if analysis artifacts exist.** If the pre-article analysis pipeline produced ANY output files in `analysis/daily/YYYY-MM-DD/realtime-HHMM/`, you MUST commit them via `safeoutputs___create_pull_request` — even if no articles are generated. Use an analysis-only PR with title: `📊 Analysis Only - Realtime Monitor - {date} {HHMM}` and label `analysis-only`. Only use `safeoutputs___noop` if the analysis pipeline produced ZERO output files (truly nothing to analyze).

## Step 2: Detect Significant Events

Query for recent parliamentary activity — use **direct MCP tool calls** (the framework routes them automatically).

Replace `<today>` with today's date in `YYYY-MM-DD` format (from `date +%Y-%m-%d`). Replace `<yesterday>` with the previous day's date in `YYYY-MM-DD` format (from `date -d "yesterday" +%Y-%m-%d`). Replace `<rm>` with the riksmöte value calculated above.

**Use a lookback window** — query from `<yesterday>` to catch late-day publications from the previous day that may have been missed by the last run:

```
get_calendar_events({ from: "<today>", tom: "<today>", limit: 50 })
search_dokument({ from_date: "<yesterday>", to_date: "<today>", limit: 30 })
search_voteringar({ rm: "<rm>", limit: 20 })
search_anforanden({ rm: "<rm>", limit: 20 })
search_regering({ dateFrom: "<yesterday>", dateTo: "<today>", limit: 30 })
get_propositioner({ rm: "<rm>", limit: 20 })
get_betankanden({ rm: "<rm>", limit: 20 })
```

### ⚠️ Calendar API Fallback

The Riksdag calendar API (`get_calendar_events`) is known to intermittently return HTML instead of JSON. If the calendar call returns an error, empty results with an `error` field, or HTML content:

1. **Do NOT treat the calendar failure as "no events"** — other data sources may still have significant content.
2. **Use `search_dokument` as a document-based proxy** to detect recently published committee reports and propositions (these indicate active parliamentary work even when the calendar is unavailable):
   ```
   search_dokument({ from_date: "<today>", to_date: "<today>", limit: 50, doktyp: "bet" })
   search_dokument({ from_date: "<today>", to_date: "<today>", limit: 30, doktyp: "prop" })
   ```
   > Note: This does NOT replace the calendar's session-timing data. It provides publication signals as context for whether parliament is active.
3. **Flag the API error** in any noop message so it can be investigated:
   ```
   safeoutputs___noop({ "message": "... calendar (API error: returned HTML instead of JSON) ..." })
   ```
4. Continue evaluating all other data sources normally — the calendar is supplementary, not blocking.

### Significance Assessment — AI-Driven Severity Classification

Apply three-tier severity classification to ALL detected events. This classification determines whether to generate articles and what depth of analysis to apply.

**HIGH** (generate breaking article with deep analysis):
- Close votes (margin ≤ 5 seats) or unexpected vote outcomes
- Cross-party coalitions forming (parties voting against their usual block)
- New government propositions on high-priority topics (defense, migration, economy, justice, social policy)
- Major committee reports with significant policy changes (especially those approving government proposals)
- Government crisis indicators (VU, confidence motion, minister resignation)
- SOU reports on major policy areas
- Budget amendments or extraordinary fiscal measures
- Legislation strengthening criminal law, social services, or national security

**MEDIUM** (generate update article with standard analysis):
- Regular committee reports (betänkanden) rejecting motions
- Committee reports approving government proposals (even if routine procedure)
- New government propositions on any policy area
- Opposition motions on significant policy areas
- Scheduled debates with notable party positions
- Ministerial interpellations from multiple parties
- Cross-party cooperation announcements

**LOW** (skip, use noop):
- Routine procedural votes with no policy substance
- Standard meetings with no new developments
- Previously covered topics within last 6 hours (check workflow-state.json)
- Scheduling announcements without policy substance

**Severity scoring formula** (score 1–10, capped at 10):
- +3 if coalition majority at risk
- +2 if > 3 parties involved
- +2 if budget/fiscal implications
- +2 if defense/security policy
- +2 if criminal justice or social welfare reform
- +1 if involves named minister
- +1 if committee report approves (not just rejects) a government proposal
- -2 if similar topic covered in last 6 hours

Map raw score to tier: **≥ 7 = HIGH** | **4–6 = MEDIUM** | **≤ 3 = LOW**

### No-Events Early Exit

If no HIGH or MEDIUM events found:

1. **First check if analysis artifacts exist** in `analysis/daily/YYYY-MM-DD/realtime-HHMM/`:
```bash
# Idempotent: prefer resolved/input date, then fall back to today
if [ -z "$ARTICLE_DATE" ]; then
  if [ -n "${{ github.event.inputs.article_date }}" ]; then
    ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  else
    date -u +%Y-%m-%d > /tmp/today.txt
read ARTICLE_DATE < /tmp/today.txt
  fi
fi
[ -f /tmp/hhmm.env ] && . /tmp/hhmm.env
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/realtime-$HHMM"
find "$ANALYSIS_DIR" -type f 2>/dev/null | wc -l > /tmp/analysis_count.txt
read ANALYSIS_COUNT < /tmp/analysis_count.txt
echo "Analysis artifacts: $ANALYSIS_COUNT files in $ANALYSIS_DIR"
```

2. **If analysis artifacts exist** (ANALYSIS_COUNT > 0): Commit them and create an analysis-only PR:
```bash
git add "$ANALYSIS_DIR"/
git commit -m "📊 Analysis artifacts - Realtime Monitor $HHMM - $ARTICLE_DATE"
```
Then call `safeoutputs___create_pull_request` with title `📊 Analysis Only - Realtime Monitor $HHMM - {date}`, body including actual query stats, and labels `["analysis-only", "realtime-monitor"]`.

3. **If NO analysis artifacts exist**: call noop with actual values:
```
safeoutputs___noop({ "message": "No significant events on <today>. Votes (<lastVoteDate>), props (<propCount>), bets (<betCount>), gov (<govCount>), calendar (<calendarStatus>). Max severity=<maxScore> (<HIGH threshold ≥7). Analysis produced 0 files. Next check 2-4h." })
```

**Stop here only if no analysis artifacts exist.**

### 🔬 Step 2b: Read ALL Analysis Files (MANDATORY — before article generation)

> 🔴 NON-NEGOTIABLE: `cat` every analysis `.md` BEFORE generating HTML. See SHARED_PROMPT_PATTERNS.md §"MANDATORY PRE-ARTICLE ANALYSIS READING".

```bash
[ -f /tmp/hhmm.env ] && . /tmp/hhmm.env
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
ANALYSIS_BASE="analysis/daily/$ARTICLE_DATE/realtime-$HHMM"
echo "📖 Reading all analysis from $ANALYSIS_BASE..."
if [ -d "$ANALYSIS_BASE" ]; then
  for f in "$ANALYSIS_BASE"/*.md "$ANALYSIS_BASE/documents"/*.md; do
    [ -f "$f" ] && cat "$f" && echo ""
  done
  echo "✅ Done reading — these MUST drive article content"
else
  echo "⚠️ No analysis at $ANALYSIS_BASE"
fi
```

## Step 3: Generate Articles Using Purpose-Built Script

**🚨 ALWAYS use the TypeScript generation script — it handles MCP queries, HTML templating, all 14 languages, translation, and article quality internally.**

```bash
ARTICLE_TYPES_INPUT="${{ github.event.inputs.article_types }}"
[ -z "$ARTICLE_TYPES_INPUT" ] && ARTICLE_TYPES_INPUT="breaking"
export ARTICLE_TYPES_INPUT
LANGUAGES_INPUT="${{ github.event.inputs.languages }}"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="en,sv"
case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac
export LANG_ARG
source /tmp/gh-aw/agent/timing.env 2>/dev/null || true
if [ -z "$START_TIME" ]; then
  date +%s > /tmp/start_time.txt
  read START_TIME < /tmp/start_time.txt
fi
date +%s > /tmp/now_time.txt
read AW_NOW < /tmp/now_time.txt
ELAPSED=$(( AW_NOW - START_TIME ))
if [ "$ELAPSED" -ge 2100 ]; then
  echo "⏱️ Time budget exceeded ($ELAPSEDs >= 35min) — skipping generation"
  SCRIPT_EXIT=0; NEW_ARTICLES=""
else
  timeout 1200 bash -lc 'source scripts/mcp-setup.sh && npx tsx scripts/generate-news-enhanced.ts --types="$ARTICLE_TYPES_INPUT" --languages="$LANG_ARG" --skip-existing'
  SCRIPT_EXIT=$?
  TIMED_OUT=false
  [ "$SCRIPT_EXIT" -eq 124 ] && { echo "⚠️ Script timed out — proceeding with generated content"; TIMED_OUT=true; }
  echo "Script exit: $SCRIPT_EXIT"
  date +%Y-%m-%d > /tmp/today.txt
  read TODAY < /tmp/today.txt
  git status --porcelain -- news/ 2>/dev/null | awk '{print $2}' | grep "$TODAY-" > /tmp/new_articles.txt || true
  NEW_ARTICLES=""
  [ -s /tmp/new_articles.txt ] && NEW_ARTICLES="generated"
  [ -z "$NEW_ARTICLES" ] && echo "No new articles." || { cat /tmp/new_articles.txt; [ "$TIMED_OUT" = true ] && SCRIPT_EXIT=0; }
fi
```

- If `$NEW_ARTICLES` is non-empty → proceed to Step 4 (validate)
- If empty AND `$SCRIPT_EXIT` is 0 (script ran successfully but found no significant events) → call `safeoutputs___noop`
- If empty AND `$SCRIPT_EXIT` is non-zero (script error) → see Fallback below

### Fallback: Manual Generation (ONLY if script fails with error AND no articles created)

> **Before declaring script failure, verify MCP is live in the same shell:**
> ```bash
> source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=$MCP_SERVER_URL"
> ```
> Expected output: `MCP_SERVER_URL=http://host.docker.internal:80/mcp/riksdag-regering`
> If the value is blank or "unset", `mcp-setup.sh` failed to read the gateway key — check `GH_AW_MCP_CONFIG`. If set correctly, retry the full script command.

If the script genuinely fails after verifying MCP, generate articles manually ONE language at a time:
1. Check elapsed time — if >= 38 minutes, stop and call noop with summary
2. Write HTML to `news/YYYY-MM-DD-breaking-HHMM-{lang}.html` (HHMM = time of this run, ensures uniqueness across multiple daily runs)
3. Use `<link rel="stylesheet" href="../styles.css">` — NO embedded `<style>` tags
4. Include language switcher, article-top-nav, Schema.org NewsArticle, hreflang tags
5. Use `dir="rtl"` for Arabic (ar) and Hebrew (he)

> 🚫 **NEVER use bash heredoc (`cat > file << 'EOF'`) to write article HTML.** Heredoc truncates large content and causes silent failures.
>
> ✅ **Build the file incrementally** with multiple small `printf` appends (no heredoc, no size limits):
> ```bash
> [ -f /tmp/hhmm.env ] && . /tmp/hhmm.env
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
> FILE="news/$ARTICLE_DATE-breaking-$HHMM-en.html"
> printf '%s\n' '<!DOCTYPE html>' > "$FILE"
> printf '%s\n' '<html lang="en">' >> "$FILE"
> printf '%s\n' '<head><link rel="stylesheet" href="../styles.css"></head>' >> "$FILE"
> printf '%s\n' '<body>' >> "$FILE"
> # ... append each section separately ...
> printf '%s\n' '</body></html>' >> "$FILE"
> ```

## Step 3b: AI Title, Meta Description & Analysis References

> 🚨 MANDATORY. See SHARED_PROMPT_PATTERNS.md §"AI-DRIVEN TITLE & META DESCRIPTION GENERATION" and §"ANALYSIS FILE GITHUB REFERENCES".

1. **Titles**: `[Active Verb] + [Specific Actor] + [Concrete Action]`. ❌ BANNED: "Breaking News: Latest Updates"
2. **Meta descriptions** (150-160 chars): summarize key intelligence. ❌ BANNED: starting with "Analysis of N documents"
3. **Add analysis references** HTML block (class="analysis-references") before footer, linking to `analysis/daily/$ARTICLE_DATE/realtime-$HHMM/` files. **Verify**:
```bash
for FILE in news/$ARTICLE_DATE-*breaking*-*.html news/$ARTICLE_DATE-*realtime*-*.html; do
  [ -f "$FILE" ] && ! grep -q 'class="analysis-references"' "$FILE" && echo "🔴 MISSING: $FILE"
done
```
4. **Update metadata**: `<title>`, `<meta name="description">`, `og:title`, `og:description`, `<h1>` all match AI title/description.

## Step 3c: AI Content Quality Enforcement (v4.0 — MANDATORY)

> See SHARED_PROMPT_PATTERNS.md §"AI ARTICLE CONTENT GENERATION" v4.0. Breaking news MUST rewrite ALL stub content.

1. **Intelligence-grade lede**: specific development + key actor + quantified impact (SEK amounts, seat counts) + urgency
2. **Unique "Why It Matters"** per document — specific to content. ❌ BANNED: `"Touches on {X} policy..."`
3. **"Winners & Losers"** — named parties/ministers/sectors with evidence. ❌ BANNED: `"The political landscape remains fluid..."`
4. **Key Takeaways** — 3-5 bullets with confidence labels and dok_id citations
5. **Replace ALL `AI_MUST_REPLACE` markers** — ZERO markers in committed HTML
6. **Visualization data** — voting data: Chart.js vote distribution; budget/defense: include allocation data

## Step 4: Validate & Translate

```bash
UNTRANSLATED=0
for article in news/*-{en,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  [ -f "$article" ] && grep -q 'data-translate="true"' "$article" && { echo "NEEDS TRANSLATION: $article"; UNTRANSLATED=$((UNTRANSLATED+1)); }
done
[ "$UNTRANSLATED" -gt 0 ] && echo "WARNING: $UNTRANSLATED articles need translation"
```

Translate `<span data-translate="true" lang="sv">text</span>` to target language and remove wrapper. Keep party abbreviations (S, M, SD, V, MP, C, L, KD) untranslated.

```bash
source /tmp/gh-aw/agent/timing.env 2>/dev/null || true
if [ -z "$START_TIME" ]; then
  date +%s > /tmp/start_time.txt
  read START_TIME < /tmp/start_time.txt
fi
date +%s > /tmp/now_time.txt
read AW_NOW < /tmp/now_time.txt
ELAPSED=$(( AW_NOW - START_TIME ))
if [ "$ELAPSED" -ge 2100 ]; then
  echo "⏱️ Time budget (35min) exceeded — skipping validation"
  VALIDATION_EXIT=0
else
  timeout 300 bash scripts/validate-news-generation.sh
  VALIDATION_EXIT=$?
  if [ "$VALIDATION_EXIT" -eq 124 ]; then
    echo "⚠️ Validation timed out — proceeding"
    VALIDATION_EXIT=0
  fi
  if [ "$VALIDATION_EXIT" -ne 0 ]; then
    echo "Validation issues found — fix what you can, proceed if time allows"
  fi
fi
```

## 🛡️ File Ownership Contract

Content workflows: only create/modify **EN and SV** files (`news/YYYY-MM-DD-*-en.html`, `*-sv.html`). Validate with `npx tsx scripts/validate-file-ownership.ts content`. Fix violations: `git restore --staged --worktree -- <file>` (tracked) or `rm <file>` (untracked).

### Branch Naming Convention

Branch: `news/content/{YYYY-MM-DD}/breaking`. `safeoutputs___create_pull_request` handles this automatically.

## Step 5: Commit & Create PR

### HOW SAFE PR CREATION WORKS

⚠️ DO NOT use `git push` — the safe output tool handles publishing. Commit locally, then use the tool.

```bash
# Stage articles and analysis — scoped to this run's time-stamped folder to prevent overwriting other runs
[ -f /tmp/hhmm.env ] && . /tmp/hhmm.env
if [ -z "$HHMM" ]; then
  date -u +%H%M > /tmp/hhmm_val.txt
  read HHMM < /tmp/hhmm_val.txt
fi
# CRITICAL: Stage only this workflow's articles and metadata, NOT all of news/
git add news/*realtime*.html news/*breaking*.html news/*monitor*.html 2>/dev/null || true
git add news/metadata/ 2>/dev/null || true
[ -z "$ARTICLE_DATE" ] && { date -u +%Y-%m-%d > /tmp/today.txt; read ARTICLE_DATE < /tmp/today.txt; }
git add "analysis/daily/$ARTICLE_DATE/realtime-$HHMM/" || true
git add analysis/weekly/ || true
git add analysis/data/ || true
# Enforce safe-outputs 100-file PR limit
git diff --cached --name-only 2>/dev/null | wc -l > /tmp/staged_count.txt
read STAGED_COUNT < /tmp/staged_count.txt
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Staged $STAGED_COUNT files exceeds 100-file PR limit. Removing bulk data."
  git reset HEAD -- analysis/data/ 2>/dev/null || true
  git diff --cached --name-only 2>/dev/null | wc -l > /tmp/staged_count.txt
read STAGED_COUNT < /tmp/staged_count.txt
fi
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Still $STAGED_COUNT files. Removing weekly analysis."
  git reset HEAD -- analysis/weekly/ 2>/dev/null || true
  git diff --cached --name-only 2>/dev/null | wc -l > /tmp/staged_count.txt
read STAGED_COUNT < /tmp/staged_count.txt
fi
echo "📊 Final staged file count: $STAGED_COUNT"
git commit -m "🔴 Breaking $HHMM: {headline} - $ARTICLE_DATE"
```

Then **immediately** call (as a direct tool call, NOT via bash):
```
safeoutputs___create_pull_request({
  "title": "🔴 Breaking: {headline} - {date}",
  "body": "## Breaking News\n\nArticles: {count}\nLanguages: {list}\nSources: riksdag-regering-mcp",
  "labels": ["automated-news", "breaking-news", "needs-editorial-review"]
})
```

## Required Skills

Consult as needed — do NOT read all files upfront:
- **Skills:** `.github/skills/editorial-standards/SKILL.md`, `.github/skills/swedish-political-system/SKILL.md`, `.github/skills/legislative-monitoring/SKILL.md`, `.github/skills/riksdag-regering-mcp/SKILL.md`, `.github/skills/language-expertise/SKILL.md`, `.github/skills/gh-aw-safe-outputs/SKILL.md`
- **Analysis:** `scripts/prompts/v2/political-analysis.md`, `per-file-intelligence-analysis.md`, `stakeholder-perspectives.md`, `quality-criteria.md`
- **Methodology:** `analysis/methodologies/ai-driven-analysis-guide.md` (v5.0) + `analysis/templates/per-file-political-intelligence.md`

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Article Type Isolation

> 🚨 **This workflow writes analysis ONLY to `analysis/daily/$ARTICLE_DATE/realtime-$HHMM/`**. NEVER write to the parent date directory or another article type's folder. See SHARED_PROMPT_PATTERNS.md "Article Type Isolation" section.

### Standardised Analysis Depth Gate

> **Default: `deep`**. See SHARED_PROMPT_PATTERNS.md §"Standardised Analysis Depth Gate" for full table. Summary: standard=10min/≥1 Mermaid/≥2 risks; **deep=15min/≥2 Mermaid/≥4 risks** (default); comprehensive=20min/≥3 Mermaid/≥6 risks.

**8 mandatory stakeholder groups**: Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion — each analyzed with specific evidence (dok_id, vote counts, named politicians).

> Read `analysis_depth` input first (default: `deep`). Breaking news profile: SWOT=quick 1-paragraph, Dashboard=not required, AI iterations: 1 (standard)/2 (deep)/3 (comprehensive).

### Phase 1 — Event Detection & Significance Scoring
1. Fetch real-time MCP data based on `article_types` input
2. Score each event for newsworthiness; only generate articles for significant events
3. Build initial outlines per article type

### Phase 2 — Depth Enhancement (per `analysis_depth`)
When `analysis_depth` is `deep` or `comprehensive`:
1. Add **Quick SWOT** paragraph for each major article
2. Add **Activity Summary** — concise trend summary as prose or Markdown bullet list/table
3. **Quality Gate**: word count ≥ 400, no identical why-it-matters, all Swedish text translated

### Phase 3 — Final Quality Gate Before PR
```bash
npx tsx scripts/fix-analysis-references.ts --date "$ARTICLE_DATE" --rewrite
```
Run `bash scripts/validate-news-generation.sh` before committing.

### Non-EN/SV Article Requirements:
- ALL h1/h2/h3 MUST be in target language; ALL body paragraphs MUST be in target language
- Meta keywords translated; ZERO `data-translate="true"` spans in final output
- RTL (ar, he): `dir="rtl"` on `<html>`; CJK (ja, ko, zh): native script only
- Nordic (da, no, fi): language-specific parliamentary terms; EU (de, fr, es, nl): formal register
- Localized headings: use `CONTENT_LABELS[lang].whyItMatters`, `.whatToWatch`, `.keyTakeaways`, `.politicalContext` from `scripts/data-transformers/constants/content-labels-part1.ts`
- Post-generation: run `npx tsx scripts/validate-news-translations.ts`; fix files with >3 English phrases in non-EN versions
- Party abbreviations (S, M, SD, V, MP, C, L, KD) NEVER translated; ZERO TOLERANCE for language mixing

## Error Handling

| Scenario | Cause | Fix |
|----------|-------|-----|
| Tool not found | MCP server not initialized | Run `source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=$MCP_SERVER_URL"` — source and npx MUST be chained with `&&` on one line; expected output: `MCP_SERVER_URL=http://host.docker.internal:80/mcp/riksdag-regering` |
| Empty results | No significant events detected in monitoring window | Check if analysis artifacts exist — if yes, commit them and create analysis-only PR; if no, call `safeoutputs___noop` |
| Calendar API error | Riksdag calendar API returns HTML instead of JSON (known intermittent issue) | Use `search_dokument` with date params as fallback; flag error in noop message; do NOT treat as "no events" — evaluate all other sources |
| Timeout | MCP server response exceeds `timeout-minutes` | Reduce query scope or increase timeout |
| Script timeout | Generation script exceeds 20-minute limit | Proceed with whatever was generated; the `timeout 1200` wrapper kills the script |
| Stale data | `hoursSinceSync > 48` from `get_sync_status()` | Add disclaimer noting data staleness; proceed with cached data |
| Time running out | Elapsed >= 35 minutes | IMMEDIATELY call `safeoutputs___noop` or `safeoutputs___create_pull_request` — do NOT start new work |

⚠️ **CRITICAL SAFETY NET**: Before EVERY bash block and EVERY tool call, mentally check: "Am I running out of time?" If more than 35 minutes have elapsed since workflow start, stop all work and call a safe output tool IMMEDIATELY.

🎯 **Now begin: Check date, warm up MCP with `get_sync_status()`, detect events, generate articles with the script, and call a safe output tool.**