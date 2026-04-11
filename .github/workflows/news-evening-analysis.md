---
name: News Evening Analysis
description: Generates comprehensive evening analysis articles in core languages (EN, SV) with Playwright validation. Translations handled by news-translate workflow. On Saturdays, produces a weekly wrap-up reviewing the full parliamentary week.
strict: false  # Allow custom network domain riksdag-regering-ai.onrender.com (trusted MCP server)
on:
  schedule:
    # Run weekday evenings at 18:00 UTC (19:00 CET)
    - cron: '0 18 * * 1-5'
    # Saturday: weekly wrap-up summarizing the full parliamentary week
    - cron: '0 16 * * 6'
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD) for manual backfills. Defaults to today when omitted or scheduled.'
        required: false
      coverage_depth:
        description: 'Coverage depth: standard, deep, comprehensive'
        required: false
        default: standard
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts.'
        required: false
        default: deep
      languages:
        description: 'Core content languages (en,sv | nordic | eu-core | all). Translations handled by news-translate workflow.'
        required: false
        default: en,sv
      lookback_hours:
        description: 'Hours to look back for activity (default: 12)'
        required: false
        default: '12'

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read
  
timeout-minutes: 45

concurrency:
  group: gh-aw-news-evening-analysis-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

network:
  allowed:
    - node
    - github.com
    - api.github.com
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
    - hack23.github.io
    - default

mcp-servers:
  riksdag-regering:
    url: https://riksdag-regering-ai.onrender.com/mcp
  scb:
    command: npx
    args: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
  world-bank:
    command: npx
    args: ["-y", "worldbank-mcp@1.0.1"]

tools:
  github:
    toolsets:
      - all
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
    - github.com
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
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

engine:
  id: copilot
  model: claude-opus-4.6
---

# 🌆 Evening Parliamentary Analysis

You are the **Evening Political Analyst** for Riksdagsmonitor. Generate comprehensive analysis of the day's parliamentary and government activity. On Saturdays, produce a **weekly wrap-up** instead.

## 🔧 Workflow Dispatch Parameters

- **coverage_depth** = `${{ github.event.inputs.coverage_depth }}` — Controls article **content scope**: how many topics and how broad the coverage (e.g., `comprehensive` on Saturdays for weekly wrap-up).
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}` — Controls **AI analysis quality**: SWOT complexity, stakeholder count, dashboard charts, and iteration count per the editorial framework.
- **languages** = `${{ github.event.inputs.languages }}`
- **lookback_hours** = `${{ github.event.inputs.lookback_hours }}`

> **Note:** `coverage_depth` and `analysis_depth` are distinct inputs. `coverage_depth` determines *what* to cover (breadth); `analysis_depth` determines *how deeply* to analyze it (quality). They default independently — adjust each based on the article's needs.

## ⚠️ CRITICAL: Bash Tool Call Format

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "Bash Tool Call Format". Key rule: every `bash` call MUST have both `command` AND `description` parameters. Example: `bash({ command: "date -u '+%Y-%m-%d'", description: "Get current UTC date" })`

## 🛡️ AWF Shell Safety

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "AWF Shell Safety". Summary: use `$VAR` not `$`+`{VAR}`, use `find -exec` not `$(...)`, set defaults with `if/then` before using `$VAR`.

## 🔤 UTF-8 Encoding

> **Full reference:** See `SHARED_PROMPT_PATTERNS.md` → "UTF-8 Encoding". Summary: use native UTF-8 (`ö`, `ä`, `å`) — NEVER HTML entities (`&#246;`, `&#228;`). Author: `James Pether Sörling`.


## ⚠️ NON-NEGOTIABLE RULES

1. Every run **MUST** end with exactly one safe output tool call:
   - Articles generated → `safeoutputs___create_pull_request({...})`
   - No significant activity → `safeoutputs___noop({"message": "..."})`
   - Tool unavailable → `safeoutputs___missing_tool({"reason": "..."})`
   - MCP data unavailable → `safeoutputs___missing_data({"reason": "..."})`
2. `safeoutputs___create_pull_request` handles branch creation and push. **NEVER** run `git push` or `git checkout -b`.
3. **🚨 NEVER search for safe output tools via bash.** `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___missing_tool`, and `safeoutputs___missing_data` are **always available as direct tool calls** in your tool list. NEVER run `ls /tmp/gh-aw/`, `ls /home/runner/.copilot/`, or any bash command to "find" them.
4. **NEVER** write your own MCP HTTP/JSON-RPC client. Use the scripts or direct tool calls only.
5. Exiting without calling a safe output tool = **workflow failure**. If anything goes wrong at any point, call `safeoutputs___noop` immediately.

## 🧠 Repo Memory

Uses `memory/news-generation` branch. START: read `memory/news-generation/last-run-news-evening-analysis.json` + `memory/news-generation/covered-documents/{YYYY-MM-DD}.json`. END: update both + `memory/news-generation/translation-status.json`. Skip already-covered dok_ids.

## ⏱️ Time Budget (45 minutes)

```bash
START_TIME=$(date +%s)
```

| Phase | Minutes | Action |
|-------|---------|--------|
| Setup | 0–3 | Date check, `get_sync_status()`, determine day type |
| Download | 3–6 | Run `populate-analysis-data.ts` + `pre-article-analysis.ts` (script-driven data download) |
| **AI Analysis** | **6–21** | **🚨 MANDATORY 15 min minimum**: Consult methodology guides + templates as needed, create per-file analysis with Mermaid diagrams and evidence tables. Run quality gate bash check. |
| Data | 21–25 | Query additional MCP tools for parliamentary activity |
| Generate | 25–33 | Run generation script OR manual synthesis (see Step 3) |
| Validate | 33–38 | Translate, validate, commit |
| PR | 38–43 | `safeoutputs___create_pull_request` |

> ⚠️ **Analysis phase is 15 minutes minimum** — this is NOT negotiable. Every analysis file must contain color-coded Mermaid diagrams, structured evidence tables with dok_id citations, and follow the corresponding template structure exactly.

**Hard cutoffs** — check elapsed time before each phase:
- `>= 35 min` → Stop generating, commit what you have, create PR immediately
- `>= 43 min` → STOP ALL WORK, call safe output immediately

## Required Skills

Consult as needed — do NOT read all files upfront:
- **Skills:** `.github/skills/editorial-standards/SKILL.md`, `.github/skills/swedish-political-system/SKILL.md`, `.github/skills/legislative-monitoring/SKILL.md`, `.github/skills/riksdag-regering-mcp/SKILL.md`, `.github/skills/language-expertise/SKILL.md`, `.github/skills/gh-aw-safe-outputs/SKILL.md`
- **Analysis:** `scripts/prompts/v2/political-analysis.md`, `per-file-intelligence-analysis.md`, `quality-criteria.md`
- **Methodology:** `analysis/methodologies/ai-driven-analysis-guide.md` (v5.0) + `analysis/templates/per-file-political-intelligence.md`

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Article Type Isolation

> 🚨 **This workflow writes analysis ONLY to `analysis/daily/$ARTICLE_DATE/evening-analysis/`**. NEVER write to the parent date directory or another article type's folder. See SHARED_PROMPT_PATTERNS.md "Article Type Isolation" section.

### Standardised Analysis Depth Gate

> ⚠️ **Default is `deep`** — not `standard`. Analysis must always produce publication-quality output with Mermaid diagrams and evidence tables.

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap | Mermaid diagrams | Risk matrix (L×I) | Forward indicators | Min. analysis time |
|-------|--------------|-------------------|--------|---------|-----------------|-------------------|-------------------|-------------------|
| standard | 1-2 | ≥5 (of 8 groups) | ≥1 | optional | ≥1 color-coded | ≥2 risks scored | ≥2 with triggers | 10 minutes |
| deep | 2-3 | ≥7 (of 8 groups) | ≥2 | required | ≥2 color-coded | ≥4 risks scored | ≥3 with triggers | 15 minutes |
| comprehensive | 3+ | all 8 groups | ≥3 | required | ≥3 color-coded | ≥6 risks scored | ≥5 with triggers | 20 minutes |

**The 8 mandatory stakeholder groups are**: Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion. Every group MUST be analyzed with specific evidence (dok_id, vote counts, named politicians).

**Minimum requirement for ALL depths**: Every analysis file must contain at least 1 color-coded Mermaid diagram, structured evidence tables with dok_id citations, quantified risk matrix with numeric L×I scores, forward indicators with specific triggers/timelines, confidence labels on all analytical claims, and follow the corresponding template structure exactly. Plain prose without tables/diagrams is NEVER acceptable regardless of depth level.

> **Read `analysis_depth` input first** (default: `deep`). This controls iteration count and section requirements.

Based on the editorial profile for `evening-analysis` (from `scripts/editorial-framework.ts`):
- **SWOT**: ALL 8 stakeholder groups analyzed with evidence from the day's parliamentary activity
- **Dashboard**: required (min. 1 chart)
- **Mindmap**: optional for standard; required for deep/comprehensive
- **Min. stakeholders**: 8 perspectives (Citizens, Government Coalition, Opposition Bloc, Business/Industry, Civil Society, International/EU, Judiciary/Constitutional, Media/Public Opinion)
- **Risk Matrix**: required — numeric L×I scores for day's key developments
- **Forward Indicators**: required — next-day/next-week watch items with specific triggers
- **Confidence Labels**: `[HIGH]`/`[MEDIUM]`/`[LOW]` on ALL analytical claims
- **Mermaid Diagrams**: ≥1 color-coded diagram summarizing day's legislative flow or key voting patterns
- **AI iterations**: 1 (standard), 2 (deep), or 3 (comprehensive)

> 🚨 **ANTI-PATTERNS (REJECTED)**: Surface-level daily summaries without analysis, SWOT with only 3 groups, no Mermaid diagrams, no risk scores, no forward indicators

### 🗳️ Election 2026 Lens (Mandatory — v5.0)

Every analysis MUST include an **Election 2026 Implications** section assessing: Electoral Impact, Coalition Scenarios, Voter Salience, Campaign Vulnerability, and Policy Legacy. Use the **5-level confidence scale** (⬛VERY LOW → 🟥LOW → 🟧MEDIUM → 🟩HIGH → 🟦VERY HIGH). See `analysis/methodologies/ai-driven-analysis-guide.md` v5.0 for full criteria.

### Phase 1 — Data Collection & Initial Analysis
1. Fetch today's activity from MCP (`search_anforanden` — filter by `datum`, `get_betankanden` — filter by `publicerad`, `search_voteringar` — filter by `datum`, `get_sync_status`)
2. Score newsworthiness of each item using `scoreNewsworthiness()` logic
3. Build initial outline: day-in-review lede, top stories, votes summary, tonight's context

### Phase 2 — Depth Enhancement (for `deep`/`comprehensive` depth)
1. **Quick SWOT**: 1-paragraph SWOT overview of the day's political balance
2. **Activity Dashboard**: Generate `generateDashboardSection()` with ≥1 chart (today's activity breakdown)
3. **Quality Gate**:
   - Verify article covers events from today's date (not yesterday or tomorrow)
   - Verify all Swedish API text is translated
   - Verify word count ≥ 600

### Phase 3 — Final Quality Gate Before PR
Run validation checks before committing.

## Step 1: Date Validation & MCP Health Check

```bash
echo "=== Date Validation Check ==="
START_TIME=$(date +%s)
echo "START_TIME=$START_TIME" > /tmp/gh-aw/agent/timing.env
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
date +"%Z: %A %Y-%m-%d %H:%M:%S"
DAY_OF_WEEK=$(date -u +"%u")
echo "Day of week: $DAY_OF_WEEK (6=Saturday weekly wrap-up)"
echo "============================"
```

## 📅 Riksmöte (Parliamentary Session) Calculation

Sep+ → `rm = "{year}/{year+1 2-digit}"` (e.g. Oct 2026 → `2026/27`). Before Sep → `rm = "{year-1}/{year 2-digit}"` (e.g. Feb 2026 → `2025/26`).

## MANDATORY Deduplication Check

Before generating articles, check if articles already exist for the target date. **This check controls article GENERATION only — the deep political analysis phase ALWAYS runs regardless.**
```bash
# Resolve article date: use workflow_dispatch input when provided, fallback to UTC today
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
if [ -z "$ARTICLE_DATE" ]; then
  ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ARTICLE_TYPE="evening-analysis"
EXISTING=$(ls news/${ARTICLE_DATE}-${ARTICLE_TYPE}-en.html 2>/dev/null | wc -l)
if [ "$EXISTING" -gt 0 ]; then
  echo "📋 Articles for $ARTICLE_DATE/$ARTICLE_TYPE already exist — article generation will be skipped (analysis still runs)"
  SKIP_ARTICLE_GENERATION=true
  echo "SKIP_ARTICLE_GENERATION=true" >> "$GITHUB_ENV"
fi
# NOTE: Do NOT exit here or call safeoutputs___noop — analysis phase MUST still execute
# Later article-generation steps MUST gate on: if [ "$SKIP_ARTICLE_GENERATION" != "true" ]; then ...

```

> **🚨 NEVER call `safeoutputs___noop` because articles already exist.** If articles exist, the workflow MUST still run the full 15-20 minute deep political analysis phase and commit analysis artifacts. The dedup check only controls whether NEW HTML articles are generated — analysis is the primary output and always runs. If analysis produces artifacts, use `safeoutputs___create_pull_request` with `analysis-only` label.

### MCP Health Gate

STEP 1: ALWAYS check data freshness first — call `get_sync_status({})` to warm up MCP and check stale data. Retry up to 3× (30s wait). After 3 failures → `safeoutputs___noop({"message": "MCP unavailable"})`. All content MUST come from live MCP data.

### DATA FRESHNESS CHECK

After `get_sync_status()` succeeds, compute hours since last sync and check if data is stale. If `hoursSinceSync > 48`, add a disclaimer note in analysis mentioning "stale data (> 48 hours old)" but proceed with cached data. Example:
```js
const hoursSinceSync = (Date.now() - new Date(syncResult.last_updated).getTime()) / 3600000;
if (hoursSinceSync > 48) { /* add stale data disclaimer */ }
```

### IMPORTANT: Date Filtering in Analysis

Use riksdag-regering-mcp (32 tools for Swedish parliament data). For ad-hoc queries, use `scripts/mcp-query-cli.ts` — NEVER implement custom MCP client code (PROHIBITION).

**Date calculation (canonical pattern):**
```javascript
const now = new Date();
const lookbackHours = Number("${{ github.event.inputs.lookback_hours }}") || 12;
const fromDateIso = new Date(now.getTime() - lookbackHours * 3600000).toISOString().slice(0, 10);
const today = now.toISOString().slice(0, 10);
```

**Post-query date filter (use for tools without native date params):**
```javascript
const recent = results.filter(item =>
  (item.datum || item.publicerad || item.inlämnad || '').slice(0, 10) >= fromDateIso
);
```

**Tools with native date params:** `get_calendar_events` supports `from`/`tom`, `search_regering` + `analyze_g0v_by_department` supports `dateFrom`/`dateTo`.
**Tools requiring post-query filter:** `search_voteringar` (filter by `datum`), `get_betankanden` (filter by `publicerad`), `get_motioner` (filter by `inlämnad`), `get_propositioner` (filter by `publicerad`), `search_anforanden` (filter by `datum`).

### ⚠️ Calendar API Fallback

`get_calendar_events` intermittently returns HTML. If it fails: (1) do NOT treat failure as "no events"; (2) use `search_dokument({ from_date, to_date, doktyp: "bet" })` as a proxy for active parliamentary work; (3) flag the error in output. Calendar failure must never block article generation from other sources.

### Cross-Referencing Strategy

Cross-reference related data sources to produce richer analysis. Combine committee reports, voting records, propositions, and motions for comprehensive coverage.

**Example 1:** Link committee reports with voting records to show how parties voted on specific policy areas:
```javascript
// Committee Report Deep Dive
const fromDateIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const reports = (await get_betankanden({ rm: currentRm }))
  .filter(r => (r.publicerad || '').slice(0, 10) >= fromDateIso);
for (const report of reports) {
  const votes = await search_voteringar({ bet: report.beteckning });
}
```

**Example 2:** Cross-reference government propositions with press releases and party speeches:
```javascript
// Government Activity Analysis
const props = (await get_propositioner({ rm: currentRm, limit: 20 }))
  .filter(p => (p.publicerad || '').slice(0, 10) >= fromDateIso);
const press = await search_regering({ type: 'pressmeddelanden', dateFrom: fromDateIso });

// Party Behavior Analysis
const votes = (await search_voteringar({ rm: currentRm, limit: 100 }))
  .filter(v => (v.datum || '').slice(0, 10) >= fromDateIso);
const speeches = (await search_anforanden({ rm: currentRm, limit: 100 }))
  .filter(a => (a.datum || '').slice(0, 10) >= fromDateIso);
```

**Troubleshooting**: Too broad → tighten date range; Missing data → verify riksmöte calculation.

### Saturday vs Weekday Mode

- **Saturday** (day_of_week=6): Produce a **Weekly Parliamentary Review** looking back 5 days (Monday–Friday). Use `coverage_depth: comprehensive`. Title: "The Week in Swedish Politics: {key theme}". Article slug: `weekly-review`.
- **Weekday** (Mon–Fri): Produce a daily **evening analysis**. Use the `coverage_depth` and `lookback_hours` inputs. Article slug: `evening-analysis`.

### Coverage Depth
- **standard** — Day's key events with brief analysis (800-1200 words)
- **deep** — Extended analysis with historical context (1500-2500 words)
- **comprehensive** — Full coverage including minor events (2500-4000 words)

## Step 1.5: Data Download & Per-File AI Analysis

**CRITICAL: This step downloads data AND performs deep AI analysis BEFORE article generation.**

### Phase A — Data Download (Script-Driven)

Download all available parliamentary data using the populate script. Scripts handle data download efficiently:

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
echo "📥 Downloading MCP data for $ARTICLE_DATE..."
# CRITICAL: Source mcp-setup.sh to set MCP_SERVER_URL and MCP_AUTH_TOKEN for the gateway
source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=${MCP_SERVER_URL:-NOT SET}"
npx tsx scripts/populate-analysis-data.ts --date "$ARTICLE_DATE" --limit 50 || echo "⚠️ Data download had issues (non-blocking)"
echo "📥 Running pre-article analysis pipeline..."
npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 2>&1 | tee /tmp/pipeline-output.log
PIPE_EXIT=${PIPESTATUS[0]}
if [ "$PIPE_EXIT" -ne 0 ]; then
  echo "❌ Pipeline failed with exit code $PIPE_EXIT — agent MUST diagnose and fix (see Script Debugging Protocol)"
  tail -30 /tmp/pipeline-output.log
fi
echo "✅ Data downloaded to analysis/data/"
# Verify actual data was downloaded
MANIFEST_DOCS=0
if [ -f "analysis/daily/$ARTICLE_DATE/data-download-manifest.md" ]; then
  MANIFEST_DOCS=$(grep -E '^\*\*Documents Analyzed\*\*' "analysis/daily/$ARTICLE_DATE/data-download-manifest.md" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
fi
[ -z "$MANIFEST_DOCS" ] && MANIFEST_DOCS=0
DATA_JSON_COUNT=$(find analysis/data/ -name "*.json" -type f 2>/dev/null | wc -l)
echo "📊 Documents in manifest: $MANIFEST_DOCS, JSON data files: $DATA_JSON_COUNT"
# Relocate pipeline artifacts: pre-article-analysis.ts writes to analysis/daily/$DATE/ (unscoped)
# but this workflow needs them under analysis/daily/$DATE/evening-analysis/
# === Run Suffix Resolution (see SHARED_PROMPT_PATTERNS.md) ===
BASE_SUBFOLDER="evening-analysis"
ANALYSIS_SUBFOLDER="$BASE_SUBFOLDER"
if [ "${FORCE_GENERATION:-false}" != "true" ]; then
  _SUFFIX=1
  while [ -f "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/synthesis-summary.md" ]; do
    _SUFFIX=$((_SUFFIX + 1))
    ANALYSIS_SUBFOLDER="${BASE_SUBFOLDER}-${_SUFFIX}"
  done
fi
echo "📁 Analysis subfolder resolved: $ANALYSIS_SUBFOLDER"
UNSCOPED_DIR="analysis/daily/$ARTICLE_DATE"
SCOPED_DIR="$UNSCOPED_DIR/$ANALYSIS_SUBFOLDER"
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
    echo "📁 Relocated pipeline documents/ contents → $SCOPED_DIR/documents"
  fi
fi
if [ "$MANIFEST_DOCS" -eq 0 ] && [ "$DATA_JSON_COUNT" -eq 0 ]; then
  echo "🚨 CRITICAL: Pipeline downloaded ZERO data. Agent MUST diagnose and fix — do NOT fabricate analysis."
fi
```

### 🔄 Phase A.1 — Data Lookback Fallback

> 🚨 **CRITICAL RULE**: Never produce empty/stub analysis. If no data for today, look back to find unanalyzed data. Empty analysis = wasted workflow run.

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ORIGINAL_ARTICLE_DATE="$ARTICLE_DATE"

# Check if the requested date has any analyzed documents (per-date manifest, not session-wide catalog)
MANIFEST_PATH="analysis/daily/$ARTICLE_DATE/data-download-manifest.md"
DATE_DOCS_ANALYZED=0
if [ -f "$MANIFEST_PATH" ]; then
  DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
fi
[ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
echo "📄 Documents analyzed for $ARTICLE_DATE: $DATE_DOCS_ANALYZED"

if [ "$DATE_DOCS_ANALYZED" -eq 0 ]; then
  echo "⚠️ No per-date data for $ARTICLE_DATE — activating lookback fallback (up to 7 days)"
  DATA_DATE=""
  for DAYS_BACK in 1 2 3 4 5 6 7; do
    # Cross-platform date arithmetic: GNU date (-d) on Linux/GitHub Actions, BSD date (-v) on macOS
    LOOKBACK_DATE=$(date -u -d "$ARTICLE_DATE - $DAYS_BACK days" +%Y-%m-%d 2>/dev/null || date -u -v-${DAYS_BACK}d -j -f "%Y-%m-%d" "$ARTICLE_DATE" +%Y-%m-%d 2>/dev/null)
    [ -z "$LOOKBACK_DATE" ] && continue
    echo "🔍 Checking $LOOKBACK_DATE for analyzed data..."
    # First, check if a manifest already exists with non-zero Documents Analyzed
    MANIFEST_PATH="analysis/daily/$LOOKBACK_DATE/data-download-manifest.md"
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Found $DATE_DOCS_ANALYZED documents already analyzed for $LOOKBACK_DATE"
      DATA_DATE="$LOOKBACK_DATE"
      break
    fi
    # No existing data — run population and pre-article analysis for this lookback date
    echo "ℹ️ No existing manifest data for $LOOKBACK_DATE — running analysis pipeline"
    source scripts/mcp-setup.sh && npx tsx scripts/populate-analysis-data.ts --date "$LOOKBACK_DATE" --limit 50 2>/dev/null || true
    source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$LOOKBACK_DATE" --limit 50 2>/dev/null || true
    # Re-check manifest after running analysis
    DATE_DOCS_ANALYZED=0
    if [ -f "$MANIFEST_PATH" ]; then
      DATE_DOCS_ANALYZED=$(grep -E '^\*\*Documents Analyzed\*\*' "$MANIFEST_PATH" | sed -E 's/^\*\*Documents Analyzed\*\* *: *([0-9]+).*/\1/' || echo 0)
    fi
    [ -z "$DATE_DOCS_ANALYZED" ] && DATE_DOCS_ANALYZED=0
    if [ "$DATE_DOCS_ANALYZED" -gt 0 ]; then
      echo "✅ Successfully analyzed $DATE_DOCS_ANALYZED documents for $LOOKBACK_DATE"
      DATA_DATE="$LOOKBACK_DATE"
      break
    fi
  done
  # Lookback protection: copy analysis to today's directory instead of overwriting historical data
  if [ -n "$DATA_DATE" ] && [ "$DATA_DATE" != "$ORIGINAL_ARTICLE_DATE" ]; then
    SRC_DIR="analysis/daily/$DATA_DATE/evening-analysis"
    DST_DIR="analysis/daily/$ORIGINAL_ARTICLE_DATE/evening-analysis"
    if [ -d "$SRC_DIR" ]; then
      mkdir -p "$DST_DIR"
      cp -r "$SRC_DIR"/* "$DST_DIR/" 2>/dev/null || true
      echo "📁 Copied analysis from $DATA_DATE → $ORIGINAL_ARTICLE_DATE (preserving original at $DATA_DATE)"
    fi
    ARTICLE_DATE="$ORIGINAL_ARTICLE_DATE"
  elif [ -n "$DATA_DATE" ]; then
    ARTICLE_DATE="$DATA_DATE"
  fi
  echo "🗓️ Using analysis date: $ARTICLE_DATE (data sourced from: ${DATA_DATE:-$ARTICLE_DATE})"

  # Persist selected ARTICLE_DATE for downstream steps
  if [ -n "${GITHUB_ENV:-}" ]; then
    echo "ARTICLE_DATE=$ARTICLE_DATE" >> "$GITHUB_ENV"
  fi
fi

# Report pending per-file analysis count for monitoring
PENDING=$(npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null | jq '.pendingAnalysis // 0' 2>/dev/null || echo "0")
if [ -z "$PENDING" ]; then PENDING=0; fi
echo "📊 Total pending per-file analysis files (all dates): $PENDING"
```

### Phase B — Per-File AI Political Intelligence Analysis (AI-Driven)

**This is the core analysis phase.** The AI agent (you) performs deep analysis of every downloaded file, creating publication-quality intelligence markdown files.

> 🚨 **CRITICAL RULE:** You must **actually read the JSON data** in each file and base all analysis on real data found there. Every SWOT entry, risk score, and stakeholder assessment must cite specific data from the file (dok_id, vote counts, party names, reservation details). Generic or boilerplate analysis is a failure mode — see the "Concrete Example: What Good Analysis Looks Like" section in `analysis/methodologies/ai-driven-analysis-guide.md` for bad vs. good comparison.

#### B1. Read Methodology Documents AND Templates

**Before analyzing any file, use `view` or `cat` to read these methodology guides AND templates:**
1. **`analysis/methodologies/ai-driven-analysis-guide.md`** — Master per-file analysis guide (includes bad/good examples)
2. **`analysis/methodologies/political-swot-framework.md`** — Evidence-based SWOT with confidence hierarchy
3. **`analysis/methodologies/political-risk-methodology.md`** — 5×5 Likelihood×Impact risk matrix, calibration examples
4. **`analysis/methodologies/political-threat-framework.md`** — Political Threat Taxonomy, Attack Trees, severity calibration
5. **`analysis/methodologies/political-classification-guide.md`** — Sensitivity and domain taxonomy
6. **`analysis/methodologies/political-style-guide.md`** — Writing standards and evidence density
7. **`analysis/templates/per-file-political-intelligence.md`** — Per-file output template (SWOT.md quality)
8. **`analysis/templates/synthesis-summary.md`** — Daily synthesis template (SYN-ID, dashboard, artifacts inventory)
9. **`analysis/templates/risk-assessment.md`** — Risk assessment template (RSK-ID, heat map, L×I scores)
10. **`analysis/templates/political-classification.md`** — Classification template (CLS-ID, decision tree)
11. **`analysis/templates/threat-analysis.md`** — Threat template (THR-ID, Threat Taxonomy network, escalation)
12. **`analysis/templates/swot-analysis.md`** — SWOT template (SWT-ID, quadrant mapping, evidence)
13. **`analysis/templates/stakeholder-impact.md`** — Stakeholder template (STA-ID, 6 groups, impact radar)
14. **`analysis/templates/significance-scoring.md`** — Significance template (SIG-ID, 5 dimensions, publication decision)
15. **`scripts/prompts/v2/per-file-intelligence-analysis.md`** — Detailed protocol with filled example

#### B2. Get File Catalog

```bash
echo "📋 Cataloging files pending analysis..."
npx tsx scripts/catalog-downloaded-data.ts --pending-only 2>/dev/null | jq '.entries[:5]'
```

#### B3. Analyze Each Downloaded File

**⏱️ Time safeguard:** Check elapsed time before each file. If elapsed ≥ 18 min, stop per-file analysis and proceed to article generation with whatever analyses are complete. Prioritize highest-significance files first.

For each pending file from the catalog (ordered by significance — propositions and votes first):

1. **Read** the JSON data file — use `view` or `cat` to read the actual content
2. **Extract** key fields (dok_id, titel, datum, parti, vote counts, reservations, etc.)
3. **Classify** — Sensitivity level, domain, urgency, significance (0–10)
4. **SWOT** — Government + Opposition impact with evidence (cite specific dok_id, vote margins, party positions)
5. **Risk** — 5×5 Likelihood×Impact matrix with numeric scores (coalition, policy, budget, electoral, democratic, external)
6. **Political Threat Taxonomy** — 6 democratic function threat categories (only where applicable — cite evidence)
7. **Stakeholders** — 6-lens impact matrix (government, opposition, citizen, economic, international, media)
8. **Forward indicators** — Specific watch items with concrete timelines and triggers
9. **Mermaid diagrams** — At least 1 diagram with REAL data from the file (not placeholder text)
10. **Write** `{dok_id}-analysis.md` alongside the data file

**Quality standard:** Each analysis file must match [SWOT.md](../../SWOT.md) / [THREAT_MODEL.md](../../THREAT_MODEL.md) quality — Hack23 header badges, color-coded Mermaid diagrams, evidence tables with confidence labels, and actionable intelligence.

**Mermaid color convention:**
```
style X fill:#dc3545,color:#fff   /* 🔴 Red — CRITICAL / Threat */
style X fill:#fd7e14,color:#fff   /* 🟠 Orange — HIGH risk */
style X fill:#ffc107,color:#000   /* 🟡 Yellow — MEDIUM */
style X fill:#28a745,color:#fff   /* 🟢 Green — LOW / Strength */
style X fill:#0d6efd,color:#fff   /* 🔵 Blue — Informational */
style X fill:#6f42c1,color:#fff   /* 🟣 Purple — Special category */
```

**Minimum quality gate (8/10):**
- ≥ 3 evidence points with dok_id per file
- Confidence labels on all analytical claims
- At least 1 Mermaid diagram with document-specific data
- SWOT has ≥ 2 filled quadrants with evidence
- No `[REQUIRED]` placeholders remaining

#### B4. Compose Daily Synthesis — Following Templates

> 🚨 **CRITICAL**: The `pre-article-analysis.ts` script generates **stub files** that do NOT follow the full template structure from `analysis/templates/`. You MUST rewrite each daily synthesis file to match its template.

After per-file analyses, rewrite ALL daily files in `analysis/daily/$ARTICLE_DATE/evening-analysis/` to follow their templates:

| Daily File | Template | Key Requirements |
|------------|----------|-----------------|
| `synthesis-summary.md` | `analysis/templates/synthesis-summary.md` | SYN-ID, Intelligence Dashboard (Mermaid), Top Findings table, Aggregated SWOT, Risk Landscape, Threat Summary, Artifacts Inventory (✅/⚠️/❌) |
| `risk-assessment.md` | `analysis/templates/risk-assessment.md` | RSK-ID, Risk Heat Map (Mermaid), ≥2 risks with L×I scores, Coalition Stability, Policy/Budget/Electoral Risk |
| `classification-results.md` | `analysis/templates/political-classification.md` | CLS-ID, Sensitivity Decision Tree (Mermaid), Per-document table (sensitivity, domain, urgency, significance 0-10) |
| `threat-analysis.md` | `analysis/templates/threat-analysis.md` | THR-ID, Threat Taxonomy Network (Mermaid), 6 threat categories with severity 1-5, Threat Actor Mapping, Escalation Decision |
| `swot-analysis.md` | `analysis/templates/swot-analysis.md` | SWT-ID, Quadrant Mapping (Mermaid), Coalition + Opposition + Policy SWOT — all entries with dok_id evidence |
| `stakeholder-perspectives.md` | `analysis/templates/stakeholder-impact.md` | STA-ID, Impact Radar (Mermaid), 6 groups assessed, Impact Summary Matrix |
| `significance-scoring.md` | `analysis/templates/significance-scoring.md` | SIG-ID, 5-dimension scoring (0-10 each), Composite Score, Publication Decision |

**Important filename & template adaptation rules:**
- The mapped templates were originally authored as **single-event assessments** and may reference `event-slug` or `evening-*` filenames and a single primary `dok_id`.
- For this workflow, you MUST adapt those templates for **batch daily summaries** (potentially multiple `dok_id` values per file) while keeping the existing daily filenames under `analysis/daily/$ARTICLE_DATE/evening-analysis/`.
- NEVER create new markdown files (e.g. `event-slug`, `evening-*`) based on suggestions inside the templates. Always rewrite the existing stub file (the exact daily filename in the table above).

**Protocol for each daily file:**
1. **Read the template** — `cat analysis/templates/{template-name}.md`
2. **Preserve script data** — keep factual data from the script output
3. **Keep existing filenames** — do NOT rename or create new files; always rewrite in-place
4. **Add ALL template sections** — metadata header, Mermaid diagrams, evidence tables, confidence labels
5. **Fill with real data** — use per-file analysis results to populate
6. **No empty sections** — if no data, explain WHY with confidence label

**Template compliance checklist:**
- [ ] Every daily file has its template's metadata header (ID, date, riksmöte, confidence)
- [ ] Every daily file has ≥1 color-coded Mermaid diagram (not grey placeholders)
- [ ] No `[REQUIRED]` placeholders remain in any file
- [ ] Synthesis references all sibling files with ✅/⚠️/❌ status
- [ ] Per-file analyses are NOT stubs (no empty SWOT quadrants, no generic boilerplate)

#### B5. MANDATORY Quality Gate — Run Before Proceeding

> 🚨 **BLOCKING**: Do NOT proceed to article generation or commit until this quality gate passes. If it fails, go back and fix analysis files.

```bash
if [ -z "${ARTICLE_DATE:-}" ]; then
  if [ -n "${{ github.event.inputs.article_date }}" ]; then
    ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  else
    ARTICLE_DATE=$(date -u +%Y-%m-%d)
  fi
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/evening-analysis"
QUALITY_PASS=true
FAIL_COUNT=0
WARN_COUNT=0

echo "=== 🔍 Analysis Quality Gate Check (evening-analysis) ==="

DAILY_MD_FILES=$(find "$ANALYSIS_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null)
PERFILE_MD_FILES=$(find "$ANALYSIS_DIR/documents" -name "*-analysis.md" -type f 2>/dev/null)
ALL_MD_FILES=$(find "$ANALYSIS_DIR" -name "*.md" -type f 2>/dev/null)
echo "📊 Daily: $(echo "$DAILY_MD_FILES" | grep -c '.' 2>/dev/null || true) | Per-file: $(echo "$PERFILE_MD_FILES" | grep -c '.' 2>/dev/null || true)"

# Check 1: Daily synthesis Mermaid diagrams
for f in $DAILY_MD_FILES; do
  [ ! -f "$f" ] && continue
  MERMAID_COUNT=$(grep -c '```mermaid' "$f" 2>/dev/null || true)
  if [ "${MERMAID_COUNT:-0}" -eq 0 ]; then
    echo "❌ FAIL: $(basename "$f") has NO Mermaid diagrams"
    QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# Check 2: Color-coded style directives in Mermaid diagrams
for f in $DAILY_MD_FILES; do
  [ ! -f "$f" ] && continue
  if grep -q '```mermaid' "$f" 2>/dev/null; then
    STYLE_COUNT=$(grep -c 'style.*fill:#' "$f" 2>/dev/null || true)
    if [ "${STYLE_COUNT:-0}" -eq 0 ]; then
      echo "❌ FAIL: $(basename "$f") Mermaid has NO color-coded style directives"
      QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  fi
done

# Check 3: No [REQUIRED] placeholders
for f in $ALL_MD_FILES; do
  [ ! -f "$f" ] && continue
  REQ_COUNT=$(grep -c '\[REQUIRED\]' "$f" 2>/dev/null || true)
  if [ "${REQ_COUNT:-0}" -gt 0 ]; then
    echo "❌ FAIL: $(basename "$f") has $REQ_COUNT unfilled [REQUIRED] placeholders"
    QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# Check 4: SWOT evidence tables with dok_id
SWOT_FILE="$ANALYSIS_DIR/swot-analysis.md"
if [ -f "$SWOT_FILE" ]; then
  TABLE_COUNT=$(grep -c '|.*dok_id\||.*Evidence' "$SWOT_FILE" 2>/dev/null || true)
  if [ "${TABLE_COUNT:-0}" -eq 0 ]; then
    echo "❌ FAIL: swot-analysis.md has NO evidence tables with dok_id"
    QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
fi

# Check 5: Structured tables in daily synthesis (not just plain prose)
for f in $DAILY_MD_FILES; do
  [ ! -f "$f" ] && continue
  TABLE_COUNT=$(grep -c '^|' "$f" 2>/dev/null || true)
  if [ "${TABLE_COUNT:-0}" -lt 3 ]; then
    echo "⚠️ WARNING: $(basename "$f") has only $TABLE_COUNT table rows — templates require structured tables"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
done

# Check 6: Per-file analyses must NOT be stubs
STUB_COUNT=0
for f in $PERFILE_MD_FILES; do
  [ ! -f "$f" ] && continue
  STUB_SCORE=0
  [ "$(grep -cE '_No (strengths|weaknesses|opportunities|threats) identified_' "$f" 2>/dev/null || true)" -ge 2 ] && STUB_SCORE=$((STUB_SCORE + 2))
  [ "$(grep -c 'this document requires assessment of\|this document warrants scrutiny for\|this document may affect business\|this document has low newsworthiness\|this document must be assessed for' "$f" 2>/dev/null || true)" -ge 2 ] && STUB_SCORE=$((STUB_SCORE + 2))
  [ "$(grep -c '```mermaid' "$f" 2>/dev/null || true)" -eq 0 ] && STUB_SCORE=$((STUB_SCORE + 1))
  [ "$(grep -c '^|' "$f" 2>/dev/null || true)" -lt 2 ] && STUB_SCORE=$((STUB_SCORE + 1))
  if [ "${STUB_SCORE:-0}" -ge 3 ]; then
    echo "❌ FAIL: $(basename "$f") is a stub (score=$STUB_SCORE) — MUST be replaced with real analysis"
    STUB_COUNT=$((STUB_COUNT + 1)); QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# Check 7: Coverage — every JSON must have an analysis
if [ -d "$ANALYSIS_DIR/documents" ]; then
  JSON_COUNT=$(find "$ANALYSIS_DIR/documents" -name "*.json" -type f 2>/dev/null | wc -l)
  ANALYSIS_MD_COUNT=$(find "$ANALYSIS_DIR/documents" -name "*-analysis.md" -type f 2>/dev/null | wc -l)
  if [ "${JSON_COUNT:-0}" -gt 0 ] && [ "${ANALYSIS_MD_COUNT:-0}" -lt "${JSON_COUNT:-0}" ]; then
    echo "❌ FAIL: Only $ANALYSIS_MD_COUNT analysis files for $JSON_COUNT data files"
    QUALITY_PASS=false; FAIL_COUNT=$((FAIL_COUNT + 1))
  elif [ "${JSON_COUNT:-0}" -gt 0 ]; then
    echo "✅ PASS: $ANALYSIS_MD_COUNT analysis files for $JSON_COUNT data files"
  fi
fi

echo ""
echo "=== Quality Gate Summary ==="
echo "Failures: $FAIL_COUNT | Warnings: $WARN_COUNT"
if [ "$QUALITY_PASS" = "true" ]; then
  echo "✅ Quality gate PASSED — proceed to article generation"
else
  echo "❌ Quality gate FAILED ($FAIL_COUNT failures) — fix analysis files before proceeding"
  [ "${STUB_COUNT:-0}" -gt 0 ] && echo "🚨 $STUB_COUNT per-file analyses are stubs — read analysis/templates/per-file-political-intelligence.md and rewrite"
  echo "📌 For per-file analyses: read analysis/templates/per-file-political-intelligence.md"
  echo "📌 For daily synthesis: read the corresponding template in analysis/templates/"
  echo "📌 Reference good examples: SWOT.md, THREAT_MODEL.md"
fi
```

> **If the quality gate FAILS**: Go back and rewrite the failing files. Read the template again (`view analysis/templates/<template>.md`), then rewrite the file to match it. Do NOT proceed until all checks pass.

### 🔴 MANDATORY: Batch Analysis Enrichment (Prevents Empty "0 Documents Analyzed" Files)

> **Root Cause**: The `pre-article-analysis.ts` script filters documents by exact date match. When no documents match the exact analysis date, batch files report "0 documents analyzed" — this violates `ai-driven-analysis-guide.md` quality requirements.

**After per-file analysis and quality gate, check if batch files are empty and enrich them:**

1. Check `synthesis-summary.md` — if it reports "0 documents analyzed" but per-document analyses exist in `documents/`, aggregate the per-doc findings into all 9 batch files
2. If NO per-doc analyses exist AND batch files show "0 documents analyzed", use MCP tools directly (`search_dokument`, `get_propositioner`, `get_betankanden`, `search_anforanden`, `get_calendar_events`) to find recent parliamentary activity and create meaningful analysis
3. Each enriched batch file MUST include: ≥1 Mermaid diagram, structured tables, evidence citations, confidence labels
4. **NEVER commit batch files that report "0 documents analyzed" when analysis data is available**
5. See `ai-driven-analysis-guide.md` "Deep-Inspection Batch Analysis Enrichment Protocol (v4.1)" for full requirements

### 🚨 MANDATORY: Analysis Artifacts Must ALWAYS Be Committed

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Review the analysis artifacts** in `analysis/daily/YYYY-MM-DD/` and per-file `-analysis.md` files — read `synthesis-summary.md` and significance scores to understand what was found
2. **Summarize the analysis findings** — note how many documents were downloaded, their significance scores, key themes, and risk levels
3. **ALWAYS commit analysis artifacts** regardless of whether articles will be generated:

```bash
# Idempotent: only set if not already resolved by lookback
if [ -z "${ARTICLE_DATE:-}" ]; then
  ARTICLE_DATE="${{ github.event.inputs.article_date }}"
  [ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/evening-analysis"
NEW_ANALYSIS_COUNT=$(git status --porcelain -- analysis/data/ "$ANALYSIS_DIR" 2>/dev/null | wc -l)
if [ "$NEW_ANALYSIS_COUNT" -gt 0 ]; then
  echo "📊 Found $NEW_ANALYSIS_COUNT new/modified analysis artifacts — these MUST be committed (do NOT use safeoutputs___noop)"
else
  echo "📊 No new/modified analysis artifacts detected — safeoutputs___noop is allowed (no files to commit)"
fi
```

> **🚨 CRITICAL RULE: Never call `safeoutputs___noop` if analysis artifacts exist.** If the analysis produced ANY output files (per-file `-analysis.md` or daily synthesis), you MUST commit them via `safeoutputs___create_pull_request` — even if no articles are generated. Use an analysis-only PR with title: `📊 Analysis Only - Evening Analysis - {date}` and label `analysis-only`. Only use `safeoutputs___noop` if NO analysis output was generated.

## Step 2: Gather Parliamentary Data

**Check elapsed time before proceeding:**
```bash
source /tmp/gh-aw/agent/timing.env 2>/dev/null || true
if [ -z "$START_TIME" ]; then
  echo "⚠️ WARNING: START_TIME not set — timing unreliable"
  START_TIME=$(date +%s)
fi
ELAPSED=$(( ($(date +%s) - $START_TIME) / 60 ))
echo "Elapsed: ${ELAPSED} minutes"
if [ "$ELAPSED" -ge 35 ]; then
  echo "⚠️ TIME CRITICAL: Skip data gathering, call safe output NOW"
fi
```

Replace `<today>` with today's `YYYY-MM-DD`, `<rm>` with the calculated riksmöte value, and `<fromDate>` with the lookback start date.

**Saturday** (weekly wrap-up, 5-day lookback):
```
get_calendar_events({ from: "<fromDate>", tom: "<today>", limit: 100 })
search_voteringar({ rm: "<rm>", limit: 100 })
get_betankanden({ rm: "<rm>", limit: 50 })
search_anforanden({ rm: "<rm>", limit: 100 })
search_regering({ dateFrom: "<fromDate>", dateTo: "<today>", limit: 50 })
get_propositioner({ rm: "<rm>", limit: 20 })
get_motioner({ rm: "<rm>", limit: 50 })
get_fragor({ rm: "<rm>", limit: 50 })
get_interpellationer({ rm: "<rm>", limit: 20 })
get_calendar_events({ from: "<nextMonday>", tom: "<nextFriday>", limit: 50 })
```

**Weekday** (daily, lookback_hours):
```
get_calendar_events({ from: "<fromDate>", tom: "<today>", limit: 50 })
search_voteringar({ rm: "<rm>", limit: 50 })
get_betankanden({ rm: "<rm>", limit: 20 })
search_anforanden({ rm: "<rm>", limit: 50 })
search_regering({ dateFrom: "<fromDate>", dateTo: "<today>", limit: 30 })
get_propositioner({ rm: "<rm>", limit: 10 })
get_motioner({ rm: "<rm>", limit: 20 })
get_calendar_events({ from: "<tomorrow>", tom: "<tomorrow>", limit: 50 })
```

**Filter results by date** — apply post-query date filtering as described in Step 1.

**Statistical enrichment (optional):** For economic policy topics, use World Bank and SCB MCP servers as context. See `scripts/world-bank-context.ts` and `scripts/scb-context.ts`. Never block on SCB/World Bank failures.

**If ALL queries return empty results** (no votes, no speeches, no reports, no government activity):
1. **First check if analysis artifacts exist** in `analysis/daily/YYYY-MM-DD/$ANALYSIS_SUBFOLDER/`
2. If analysis artifacts exist: commit them with `git add "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/" && git commit -m "📊 Analysis artifacts - Evening Analysis - {date}"` and call `safeoutputs___create_pull_request` with title `📊 Analysis Only - Evening Analysis - {date}`, labels `["analysis-only", "evening-analysis"]`
3. If NO analysis artifacts exist: call `safeoutputs___noop({"message": "No significant parliamentary activity found for today's evening analysis. Pre-article analysis pipeline also produced no output."})` and stop.

## Step 3: Generate Articles

### Saturday — Use Generation Script

On Saturday, use the `weekly-review` article type which IS supported by the script (defined in `scripts/generate-news-enhanced/config.ts:VALID_ARTICLE_TYPES`):

```bash
LANGUAGES_INPUT="${{ github.event.inputs.languages }}"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="all"

case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac

source scripts/mcp-setup.sh && npx tsx scripts/generate-news-enhanced.ts \
  --types=weekly-review \
  --languages="$LANG_ARG" \
  --skip-existing
SCRIPT_EXIT=$?
```

### Weekday — Manual Evening Analysis

The `evening-analysis` article type is NOT in the script's `VALID_ARTICLE_TYPES` (see `scripts/generate-news-enhanced/config.ts`). Evening analysis requires **analytical synthesis** across multiple data sources which the template-based script cannot provide. Generate articles manually using MCP data gathered in Step 2.

**Determine target languages from input:**
```bash
LANGUAGES_INPUT="${{ github.event.inputs.languages }}"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="en,sv"

case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac
echo "Target languages: $LANG_ARG"
```

**Process ONE language at a time** (en first, then sv, then any remaining):

For each language in the resolved `LANG_ARG` list:
1. Check elapsed time — if >= 35 minutes, stop and proceed to Step 5
2. Create `news/YYYY-MM-DD-evening-analysis-{lang}.html`
3. Use `<link rel="stylesheet" href="../styles.css">` — NO embedded `<style>` tags
4. Include language switcher, article-top-nav, Schema.org NewsArticle, hreflang tags
5. Use `dir="rtl"` for Arabic (ar) and Hebrew (he)
6. Include proper `<html lang="{lang}">` attribute

> 🚫 **NEVER use bash heredoc (`cat > file << 'EOF'`) to write article HTML.** Heredoc truncates large content and causes silent failures.
>
> ✅ **Build the file incrementally** with multiple small `printf` appends (no heredoc, no size limits):
> ```bash
> FILE="news/YYYY-MM-DD-evening-analysis-en.html"
> printf '%s\n' '<!DOCTYPE html>' > "$FILE"
> printf '%s\n' '<html lang="en">' >> "$FILE"
> printf '%s\n' '<head><link rel="stylesheet" href="../styles.css"></head>' >> "$FILE"
> printf '%s\n' '<body>' >> "$FILE"
> # ... append each section separately ...
> printf '%s\n' '</body></html>' >> "$FILE"
> ```

**Article structure:**
1. **Lead Story** — Most significant development, why it matters
2. **Parliamentary Pulse** — Key votes, debates, committee decisions
3. **Government Watch** — Propositions, ministerial statements
4. **Opposition Dynamics** — Cross-party analysis
5. **Looking Ahead** — What's coming tomorrow

**After all languages or time cutoff:**
```bash
TODAY="$(date +%Y-%m-%d)"
NEW_ARTICLES="$(git status --porcelain -- news/ | awk '{print $2}' | grep "${TODAY}-" || true)"
echo "Generated: $(echo "$NEW_ARTICLES" | wc -l) articles"
```

## Step 3b: AI Title, Meta Description & Analysis References (v5.0 — Analysis-Driven)

> 🚨 **MANDATORY** — After article HTML is generated, the AI MUST read ALL completed synthesis-summary.md files from the day's analysis and use their findings to drive title, description, and SEO. Evening analysis synthesizes ALL article types, so titles must reflect the day's most significant developments. See `SHARED_PROMPT_PATTERNS.md` §"AI-DRIVEN TITLE & META DESCRIPTION GENERATION" and `ai-driven-analysis-guide.md` §"Analysis-Driven Article Decision Protocol (v5.0)".

**1. Read ALL available synthesis analyses** — Read synthesis-summary.md from each analysis folder that exists:
   - `cat "analysis/daily/$ARTICLE_DATE/committeeReports/synthesis-summary.md"` (if exists)
   - `cat "analysis/daily/$ARTICLE_DATE/propositions/synthesis-summary.md"` (if exists)
   - `cat "analysis/daily/$ARTICLE_DATE/interpellations/synthesis-summary.md"` (if exists)
   - `cat "analysis/daily/$ARTICLE_DATE/motions/synthesis-summary.md"` (if exists)
   - Extract the highest-significance findings across all types for the day's title

**2. Generate newsworthy titles from cross-type analysis** — Title must reflect the day's MOST significant political development across ALL article types. Follow: `[Active Verb] + [Specific Actor/Institution] + [Concrete Policy Action]`. Apply to ALL languages. BANNED: ❌ "Evening Analysis: Daily Summary" or any title ending with ": {Topic} in Focus".

**3. Generate AI meta descriptions from analysis** (150-160 chars) — Summarize the day's top 2-3 developments. BANNED: ❌ any description starting with "Analysis of N documents".

**4. 🔴 Add analysis references section (MANDATORY — VERIFY AFTER)** — Insert the "📊 Analysis & Sources" HTML block before footer. For evening analysis, link to ALL article-type analysis folders for the date:
- `analysis/daily/$ARTICLE_DATE/evening-analysis/` (this workflow's own analysis)
- `analysis/daily/$ARTICLE_DATE/committeeReports/` (if exists)
- `analysis/daily/$ARTICLE_DATE/propositions/` (if exists)
- `analysis/daily/$ARTICLE_DATE/interpellations/` (if exists)
- `analysis/daily/$ARTICLE_DATE/motions/` (if exists)
- `analysis/daily/$ARTICLE_DATE/realtime-*/` (if exists)
- `analysis/methodologies/ai-driven-analysis-guide.md`

> Use `ls analysis/daily/$ARTICLE_DATE/` to discover which folders exist.

**After inserting, VERIFY** by running:
```bash
for FILE in news/$ARTICLE_DATE-evening-analysis-*.html; do
  if [ -f "$FILE" ] && ! grep -q 'class="analysis-references"' "$FILE"; then
    echo "🔴 MISSING analysis-references in: $(basename $FILE) — MUST FIX NOW"
  fi
done
```

**5. Update all metadata in ALL languages** — For EVERY generated language file, ensure `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<h1>`, Schema.org `headline`, `alternativeHeadline`, and `description` all reflect the AI-generated title and description.

## Step 4: Translate & Validate

Check for untranslated Swedish content in non-Swedish articles:
```bash
UNTRANSLATED=0
for article in news/*-{en,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  if [ -f "$article" ] && grep -q 'data-translate="true"' "$article"; then
    echo "NEEDS TRANSLATION: $article"
    UNTRANSLATED=$((UNTRANSLATED + 1))
  fi
done
```

**Translation rules:** Translate all Swedish text. Keep party names (S, M, SD, V, MP, C, L, KD) and personal names untranslated. Zero language mixing.

Then run validation:
```bash
bash scripts/validate-news-generation.sh
VALIDATION_EXIT=$?
if [ "$VALIDATION_EXIT" -ne 0 ]; then
  echo "Validation issues found — fix what you can, proceed if time allows"
fi

# HTMLHint validation with auto-fix
NEWS_FILES=$(find news -maxdepth 1 -name '*-*.html' | wc -l)
if [ "$NEWS_FILES" -gt 0 ]; then
  if ! npx htmlhint "news/*-*.html" 2>/dev/null; then
    echo "⚠️ HTML validation errors, attempting auto-fix..."
    npx tsx scripts/article-quality-enhancer.ts --fix
    npx htmlhint "news/*-*.html" 2>/dev/null || echo "⚠️ Some HTML issues remain"
  fi
fi
```

## MANDATORY Quality Validation

After article generation, verify EACH article meets these minimum standards before committing.
Apply the quality rubric from **`scripts/prompts/v2/quality-criteria.md`** (minimum score: 7/10).

### Playwright Visual Validation
Run Playwright validation before creating the PR:
```bash
# HTMLHint validation
npx htmlhint "news/*-evening-analysis-*.html"

# Playwright visual validation (accessibility, RTL, responsive)
npx tsx scripts/validate-articles-playwright.ts --filter "evening-analysis"

# Validate JSON-LD cross-references
npx tsx scripts/validate-cross-references.ts news/*-evening-analysis-*.html
```

## 🛡️ File Ownership Contract

Content workflows: only create/modify **EN and SV** files (`news/YYYY-MM-DD-*-en.html`, `*-sv.html`). Validate with `npx tsx scripts/validate-file-ownership.ts content`. Fix violations: `git restore --staged --worktree -- <file>` (tracked) or `rm <file>` (untracked).

### Branch Naming Convention

Branch: `news/content/{YYYY-MM-DD}/evening-analysis`. `safeoutputs___create_pull_request` handles this automatically.

## Step 5: Commit & Create PR

### HOW SAFE PR CREATION WORKS

> `safeoutputs___create_pull_request` handles branch creation, push, and PR opening — do NOT run `git push` or `git checkout -b` manually. Stage files, then call the tool directly.

- ✅ `safeoutputs___create_pull_request` for articles or analysis-only PRs (`analysis-only` + `evening-analysis` labels)
- ✅ `safeoutputs___noop` ONLY if MCP unreachable after 3 attempts AND no analysis artifacts exist
- ❌ NEVER noop because articles already exist — analysis always runs
- ❌ Safe output tools are in your tool list — NEVER search for them via bash

```bash
# Stage articles and analysis — scoped to evening-analysis subfolder to prevent overwriting other workflows
# CRITICAL: Stage only this workflow's articles and metadata, NOT all of news/
git add news/*evening-analysis*.html news/*evening*.html 2>/dev/null || true
git add news/metadata/ 2>/dev/null || true
git add "analysis/daily/${ARTICLE_DATE:-$(date -u +%Y-%m-%d)}/${ANALYSIS_SUBFOLDER:-evening-analysis}/" || true
git add analysis/weekly/ || true
# Enforce safe-outputs 100-file PR limit
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_COUNT" -gt 90 ]; then
  echo "⚠️ Staged $STAGED_COUNT files exceeds 100-file PR limit. Removing weekly analysis."
  git reset HEAD -- analysis/weekly/ 2>/dev/null || true
  STAGED_COUNT=$(git diff --cached --name-only | wc -l)
fi
echo "📊 Final staged file count: $STAGED_COUNT"
git commit -m "🌆 Evening Analysis - $(date +%Y-%m-%d)"
```

Then **immediately** call (as a direct tool call, NOT via bash):
```
safeoutputs___create_pull_request({
  "title": "🌆 Evening Analysis - {date}",
  "body": "## Evening Analysis\n\nArticles: {count}\nLanguages: {list}\nCoverage: {depth}\nSource: riksdag-regering-mcp",
  "labels": ["automated-news", "evening-analysis", "needs-editorial-review"]
})
```

## 🌐 MANDATORY Translation Quality Rules

### Non-Negotiable Requirements for Non-EN/SV Articles:
1. **ALL section headings** (h1, h2, h3) MUST be in the target language
2. **ALL body paragraphs** MUST be written in the target language
3. **Meta keywords** MUST be translated to the target language
4. **No English fallback**: If you cannot translate a phrase, use the target language equivalent or omit
5. **data-translate markers**: ZERO `data-translate="true"` spans allowed in final output

### Per-Language Requirements:
- **RTL languages (ar, he)**: Ensure `dir="rtl"` on `<html>` and proper text direction
- **CJK languages (ja, ko, zh)**: Use native script only, no romanization in body text
- **Nordic languages (da, no, fi)**: Use language-specific parliamentary terms, not Swedish
- **European languages (de, fr, es, nl)**: Use formal register appropriate for political journalism

### Localized Section Headings (use CONTENT_LABELS):
Instead of English section headings, use localized equivalents from `scripts/data-transformers/constants/content-labels-part1.ts` and `content-labels-part2.ts`:
- "Key Takeaways" → Use `CONTENT_LABELS[lang].keyTakeaways`
- "Why It Matters" → Use `CONTENT_LABELS[lang].whyItMatters`
- "Deep Analysis" → Use `CONTENT_LABELS[lang].deepAnalysis`
- "What This Means" → Use `CONTENT_LABELS[lang].whatThisMeans`

### Post-Generation Validation:
After generating all articles, run:
```bash
npx tsx scripts/validate-news-translations.ts
```
Fix any files flagged before committing. Articles with >3 English phrases in non-EN versions must be regenerated.

### Additional Rules:
- Swedish API titles MUST be translated to target language
- Party abbreviations (S, M, SD, V, MP, C, L, KD) are NEVER translated
- ZERO TOLERANCE for language mixing

## Error Handling

| Scenario | Cause | Fix |
|----------|-------|-----|
| Tool not found | MCP server not initialized | Run `source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=${MCP_SERVER_URL}"` — source and npx MUST be chained with `&&` on one line; expected output: `MCP_SERVER_URL=http://host.docker.internal:80/mcp/riksdag-regering` |
| Empty results | No parliamentary activity for the queried date range | Check if analysis artifacts exist in `analysis/daily/` — if yes, commit them and create analysis-only PR; if no, call `safeoutputs___noop` |
| Timeout | MCP server response exceeds `timeout-minutes` | Commit any analysis artifacts produced so far, then call safe output |
| Stale data | `hoursSinceSync > 48` from `get_sync_status()` | Add disclaimer noting data staleness; proceed with cached data |
| Too broad results | Query returns excessive data without date filtering | Add explicit `from_date`/`to_date` parameters to narrow scope |

## 🚨 CRITICAL FINAL REMINDER

**YOU MUST call exactly one safe output tool before exiting.** This is the single most important rule of this workflow.

**Analysis artifacts MUST always be committed.** Before calling any safe output tool, check if `analysis/daily/YYYY-MM-DD/$ANALYSIS_SUBFOLDER/` (for the current `ARTICLE_DATE`) contains files. If it does, commit only that directory with `git add "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/"` and include it in the PR or create an analysis-only PR.

- If you generated articles → `safeoutputs___create_pull_request({...})` (includes analysis artifacts)
- If no articles but analysis artifacts exist → `git add "analysis/daily/$ARTICLE_DATE/$ANALYSIS_SUBFOLDER/" && git commit -m "📊 Analysis artifacts - Evening Analysis - {date}"` then `safeoutputs___create_pull_request({"title": "📊 Analysis Only - Evening Analysis - {date}", "body": "## Analysis Only\n\nNo articles generated but analysis artifacts committed for review.\n\nDocuments analyzed: {count}\nKey findings: {summary from synthesis-summary.md}", "labels": ["analysis-only", "evening-analysis"]})`
- If MCP server unreachable (no analysis produced) → `safeoutputs___noop({"message": "MCP server unavailable. No articles or analysis generated."})`
- If MCP data unavailable → `safeoutputs___missing_data({"reason": "MCP returned no usable data for evening analysis."})`
- If any error occurs → commit any analysis artifacts first, then `safeoutputs___noop({"message": "Error during evening analysis: <brief description>"})`

**Failing to call a safe output tool = automatic workflow failure and a bug report.**

🎯 **Now begin: Check date/day-of-week, warm up MCP with `get_sync_status()`, run pre-article analysis pipeline, review analysis results, gather parliamentary data, generate analysis articles, and call a safe output tool.**