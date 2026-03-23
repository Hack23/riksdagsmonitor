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
        default: standard
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
    - regeringen.se
    - "*.se"
    - "*.com"
    - "*.org"
    - "*.io"
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
  microsoft/playwright:
    command: npx
    args: ["-y", "@playwright/mcp@0.0.68", "--headless"]
    env:
      DISPLAY: ":99"

safe-outputs:
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - data.riksdagen.se
    - www.riksdagen.se
    - www.regeringen.se
    - github.com
  create-pull-request: {}
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

**Every `bash` tool call MUST include both required parameters — omitting either causes validation errors:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `command` | ✅ YES | The shell command string to execute |
| `description` | ✅ YES | Short human-readable label (≤100 chars) |

**✅ CORRECT** — always provide both `command` and `description`:
```
bash({ command: "date -u '+%Y-%m-%d'", description: "Get current UTC date" })
bash({ command: "npm ci --prefer-offline --no-audit", description: "Install npm dependencies" })
bash({ command: "npx htmlhint 'news/*-*.html'", description: "Validate HTML files" })
```

**❌ WRONG** — missing parameters cause `"command": Required, "description": Required` errors:
```
bash("npm ci")           // ← WRONG: no named parameters
bash({ command: "..." }) // ← WRONG: missing description
```

> When you see fenced bash code blocks below (three backticks followed by bash), they show the **command content** to execute. You MUST wrap each in a proper bash tool call with both `command` and `description` parameters. For multi-line scripts, join commands with `&&` or `;` into a single `command` string.

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

## ⏱️ Time Budget (45 minutes)

```bash
START_TIME=$(date +%s)
```

| Phase | Minutes | Action |
|-------|---------|--------|
| Setup | 0–3 | Date check, `get_sync_status()`, determine day type |
| Data | 3–10 | Query MCP tools for parliamentary activity |
| Generate | 10–30 | Run generation script OR manual synthesis (see Step 3) |
| Validate | 30–38 | Translate, validate, commit |
| PR | 38–43 | `safeoutputs___create_pull_request` |

**Hard cutoffs** — check elapsed time before each phase:
- `>= 35 min` → Stop generating, commit what you have, create PR immediately
- `>= 43 min` → STOP ALL WORK, call safe output immediately

## Required Skills

Before generating articles, consult these skills:
1. **`.github/skills/editorial-standards/SKILL.md`** — OSINT/INTOP editorial standards
2. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
3. **`.github/skills/legislative-monitoring/SKILL.md`** — Voting patterns, committee tracking, bill progress
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
6. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage
7. **`scripts/prompts/v1/political-analysis.md`** — Core political analysis framework (6 analytical lenses)
8. **`scripts/prompts/v1/stakeholder-perspectives.md`** — Multi-perspective analysis instructions
9. **`scripts/prompts/v1/quality-criteria.md`** — Quality self-assessment rubric (minimum 7/10)

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Standardised Analysis Depth Gate

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap |
|-------|--------------|-------------------|--------|---------|
| standard | 1-2 | ≥3 | ≥1 | optional |
| deep | 2-3 | ≥5 | ≥2 | required |
| comprehensive | 3+ | ≥7 | ≥3 | required |

> **Read `analysis_depth` input first** (default: `standard`). This controls iteration count and section requirements.

Based on the editorial profile for `evening-analysis` (from `scripts/editorial-framework.ts`):
- **SWOT**: quick (1-paragraph overview)
- **Dashboard**: required (min. 1 Chart.js chart)
- **Mindmap**: not required
- **Min. stakeholders**: 3 perspectives
- **AI iterations**: 1 (standard), 2 (deep), or 3 (comprehensive)

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
- September or later: `rm = "{currentYear}/{nextYear's last 2 digits}"`
- Before September: `rm = "{previousYear}/{currentYear's last 2 digits}"`
- Example: February 2026 → `rm = "2025/26"`

### MCP Health Gate

STEP 1: ALWAYS check data freshness first — call `get_sync_status({})` to warm up MCP and check stale data.

1. Call `get_sync_status({})` — if successful, proceed
2. If it fails, wait 30 seconds and retry (up to 3 total attempts)
3. If ALL 3 attempts fail → `safeoutputs___noop` with "MCP server unavailable after 3 connection attempts."

**ALL article content MUST originate from live MCP data.**

### DATA FRESHNESS CHECK

After `get_sync_status()` succeeds, compute hours since last sync and check if data is stale. If `hoursSinceSync > 48`, add a disclaimer note in analysis mentioning "stale data (> 48 hours old)" but proceed with cached data. Example:
```js
const hoursSinceSync = (Date.now() - new Date(syncResult.last_updated).getTime()) / 3600000;
if (hoursSinceSync > 48) { /* add stale data disclaimer */ }
```

### IMPORTANT: Date Filtering in Analysis

Use riksdag-regering-mcp (32 tools for Swedish parliament data). For ad-hoc queries, use `scripts/mcp-query-cli.ts` — NEVER implement custom MCP client code (PROHIBITION).

**Date calculation pattern:**
```javascript
const lookbackHours = 24; // adjust as needed (e.g. 8 for evening analysis, 168 for weekly)
const now = new Date();
const fromDate = new Date(now.getTime() - lookbackHours * 3600000); // 3600000 ms = 1 hour
const weekAgo = new Date(now.getTime() - 7 * 86400000); // 86400000 ms = 1 day
const today = now.toISOString().split('T')[0];
// ISO string variants for tools with native date params
const fromDateIso = fromDate.toISOString().slice(0, 10);
// Day-granularity date strings (via .slice(0, 10) truncation):
const lookbackDays = Math.ceil(lookbackHours / 24);
const fromDateStr = new Date(Date.now() - lookbackDays * 86400000).toISOString().slice(0, 10);
// For weekly review (Saturday): 5-day lookback = 5 * 86400000 ms
const weekFromDate = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
```

**Tools with native date params** (supports from/tom or dateFrom/dateTo):
- `get_calendar_events` — supports `from`/`tom` parameters (**⚠️ Known issue: may return HTML instead of JSON — see Calendar API Fallback below**)
- `search_regering` — supports `dateFrom`/`dateTo` parameters
- `analyze_g0v_by_department` — supports `dateFrom`/`dateTo` parameters

### ⚠️ Calendar API Fallback

The Riksdag calendar API (`get_calendar_events`) intermittently returns HTML instead of JSON. If the calendar call returns an error, empty results with an `error` field, or HTML content:

1. **Do NOT treat calendar failure as "no events"** — continue evaluating all other data sources normally.
2. **Use `search_dokument` as a document-based proxy** to detect recently published committee reports and propositions (these indicate active parliamentary work even when the calendar is unavailable):
   ```
   search_dokument({ from_date: "<fromDate>", to_date: "<today>", limit: 50, doktyp: "bet" })
   search_dokument({ from_date: "<fromDate>", to_date: "<today>", limit: 30, doktyp: "prop" })
   ```
   > Note: This does NOT replace the calendar's session-timing data. It provides publication signals as context for whether parliament is active.
3. **Flag the API error** in any noop message or article metadata so it can be investigated.
4. The calendar is supplementary context — its failure should never block article generation from other sources.

**Tools requiring post-query filter by datum/publicerad/inlämnad:**
- `search_voteringar` — filter by `datum` field
- `get_betankanden` — filter by `publicerad` date
- `get_motioner` — filter by `inlämnad` date
- `get_propositioner` — filter by `publicerad` date
- `search_anforanden` — filter by `datum` field

Filter results to only include items with dates `>= fromDate` using timezone-safe ISO string comparison:

For tools without native date support, apply a post-query date filter:

```javascript
// Calculate lookback window (e.g. 24 hours = 86400000 ms, 1 hour = 3600000 ms)
const fromDate = new Date(Date.now() - 24 * 3600000).toISOString().slice(0, 10);
const results = queryResults.filter(
  item => (item.publicerad || item.datum || item.inlämnad || '').slice(0, 10) >= fromDate
);
```

Filter results to only include items with dates `>= fromDate` using ISO-string comparison (avoids timezone-sensitive `new Date()` parsing):
```js
const filtered = results.filter(item =>
  (item.datum || item.publicerad || item.inlämnad || '').slice(0, 10) >= fromDate
);
// Discouraged alternative: new Date() parsing — timezone/format sensitive
// const filtered = rawResults.filter(item => new Date(item.publicerad || item.datum || item.inlämnad) >= fromDate);
```

**Post-query date filtering example** (day-granularity; 86400000 ms = 1 day):
```javascript
const fromDate = new Date(Date.now() - lookback_days * 86400000).toISOString().slice(0, 10);
const results = rawResults.filter(item => {
  const itemDate = (item.datum || item.publicerad || item.inlämnad || '').slice(0, 10);
  return itemDate >= fromDate; // lexicographic YYYY-MM-DD comparison — no timezone drift
});
```

**Date calculation pattern** (day-granularity — `.toISOString().slice(0, 10)` truncates to YYYY-MM-DD):
```javascript
const now = new Date();
const lookback_hours = 12; // default; override via workflow input
const lookbackHours = Number(lookback_hours);
if (!Number.isFinite(lookbackHours) || !Number.isInteger(lookbackHours) || lookbackHours <= 0) {
  throw new Error('Invalid lookback_hours');
}
const lookbackMs = lookbackHours * 3600000; // 3600000 ms per hour
const fromDate = new Date(now.getTime() - lookbackMs).toISOString().slice(0, 10);
// For weekly review (Saturday): 5 * 86400000 ms = 5 days
const weekStart = new Date(now.getTime() - 5 * 86400000).toISOString().slice(0, 10);
const today = now.toISOString().slice(0, 10);
```

**Post-query filtering example:**
```javascript
const results = await get_betankanden({ rm: currentRm, limit: 50 });
const recent = results.filter(item => {
  const itemDate = (item.datum || item.publicerad || item.inlämnad || '').slice(0, 10);
  return itemDate >= fromDate;
});
```

**Date calculation example:**
```javascript
const today = new Date().toISOString().slice(0, 10);
const fromDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10); // 24h lookback
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
// For Saturday weekly review, use 5-day lookback (5 * 86400000 ms)
```

**Post-query filtering example:**
```javascript
// Filter betankanden by publicerad date (ISO-string day comparison — avoids timezone-sensitive Date parsing)
const recent = results.filter(r => r.publicerad?.slice(0, 10) >= fromDate);
// Filter voteringar by datum
const todayVotes = votes.filter(v => v.datum?.slice(0, 10) >= fromDate);
```

### Cross-Referencing Strategy

Cross-reference related data sources for richer analysis. Filter all results by date to `>= fromDate`.

#### Example 1: Committee Report Deep Dive
```
// 1. Fetch committee reports for the period
// 2. For each report, look up related voting records via search_voteringar(bet: reportId)
// 3. Cross-reference with any motions that reference the same bet
```

#### Example 2: Government Activity Analysis
```
// 1. Get government propositions (get_propositioner)
// 2. Search for committee reports (get_betankanden) that reference each proposition
// 3. Look up debate speeches (search_anforanden) on the same topic
```

#### Example 3: Party Behavior Analysis
```
// 1. Get voting records grouped by party (search_voteringar with groupBy: parti)
// 2. Cross-reference with motions filed by each party
// 3. Identify where parties voted against their own motions
```

### Detailed Code Examples

**Example 1: Committee Report Deep Dive**
```javascript
// Setup: riksmöte + date threshold (ISO-string comparison — timezone-safe)
const currentRm = '2025/26'; // adjust to current session
const fromDateIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10); // YYYY-MM-DD
// 1. Fetch committee reports, filter by date using ISO-string comparison
const allReports = await get_betankanden({ rm: currentRm });
const reports = allReports.filter(r => (r.publicerad || r.datum || '').slice(0, 10) >= fromDateIso);
// 2. For each report, cross-reference voting records
for (const report of reports) {
  const votes = await search_voteringar({ bet: report.beteckning });
}
```

**Example 2: Government Activity Analysis**
```javascript
// Setup: riksmöte + date threshold (ISO-string comparison — timezone-safe)
const currentRm = '2025/26'; // adjust to current session
const fromDateIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10); // YYYY-MM-DD
// 1. Fetch propositions, filter by date using ISO-string comparison
const allProps = await get_propositioner({ rm: currentRm });
const props = allProps.filter(p => (p.publicerad || p.datum || '').slice(0, 10) >= fromDateIso);
// 2. Cross-reference with government press releases (native dateFrom param)
const press = await search_regering({ type: 'pressmeddelanden', dateFrom: fromDateIso });
```

**Example 3: Party Behavior Analysis**
```javascript
// Setup: riksmöte + date threshold + party (ISO-string comparison — timezone-safe)
const currentRm = '2025/26'; // adjust to current session
const fromDateIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10); // YYYY-MM-DD
const partyCode = 'S'; // e.g. S, M, SD, V, MP, C, L, KD
// 1. Get motions filed by party, filter by date using ISO-string comparison
const allMotions = await get_motioner({ rm: currentRm });
const motions = allMotions.filter(m => (m.inlämnad || m.datum || '').slice(0, 10) >= fromDateIso);
// 2. Get party voting patterns, filter by date
const allVotes = await search_voteringar({ parti: partyCode, rm: currentRm });
const votes = allVotes.filter(v => (v.datum || '').slice(0, 10) >= fromDateIso);
```

**Example 2: Government Activity Analysis**
```javascript
// 1. Get government documents in date range
const fromDateIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);
const govDocs = await search_regering({ dateFrom: fromDateIso, dateTo: today, limit: 30 });

// 2. Get related propositions
const propositions = (await get_propositioner({ rm: currentRm, limit: 20 }))
  .filter(p => (p.publicerad || '').slice(0, 10) >= fromDateIso);
```

**Example 3: Party Behavior Analysis**
```javascript
// 1. Get party voting records
const fromDateIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const votes = (await search_voteringar({ rm: currentRm, limit: 100 }))
  .filter(v => (v.datum || '').slice(0, 10) >= fromDateIso);

// 2. Get party speeches
const speeches = (await search_anforanden({ rm: currentRm, limit: 100 }))
  .filter(a => (a.datum || '').slice(0, 10) >= fromDateIso);
```

**Detailed Example: Committee Report Deep Dive**
```javascript
// 1. Fetch committee reports
const reports = await get_betankanden({ rm: riksmote, limit: 20 });
// 2. Cross-reference with voting records
const votes = await search_voteringar({ rm: riksmote, limit: 50 });
const reportsWithVotes = reports.filter(r => votes.some(v => v.bet === r.bet));
```

**Detailed Example: Government Activity Analysis**
```javascript
// 1. Fetch government propositions
const props = await get_propositioner({ rm: riksmote, limit: 20 });
// 2. Cross-reference with committee referrals
const referred = props.filter(p => p.referredTo);
```

**Detailed Example: Party Behavior Analysis**
```javascript
// 1. Fetch party motions
const motions = await get_motioner({ rm: riksmote, limit: 50 });
// 2. Group by party for oversight analysis
const byParty = motions.reduce((acc, m) => {
  acc[m.parti] = (acc[m.parti] || 0) + 1;
  return acc;
}, {});
```

**Troubleshooting**:
- Too broad results → Tighten date range or add keyword filters
- Missing data → Verify riksmöte calculation and date ranges

### Saturday vs Weekday Mode

- **Saturday** (day_of_week=6): Produce a **Weekly Parliamentary Review** looking back 5 days (Monday–Friday). Use `coverage_depth: comprehensive`. Title: "The Week in Swedish Politics: {key theme}". Article slug: `weekly-review`.
- **Weekday** (Mon–Fri): Produce a daily **evening analysis**. Use the `coverage_depth` and `lookback_hours` inputs. Article slug: `evening-analysis`.

### Coverage Depth
- **standard** — Day's key events with brief analysis (800-1200 words)
- **deep** — Extended analysis with historical context (1500-2500 words)
- **comprehensive** — Full coverage including minor events (2500-4000 words)

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

**If ALL queries return empty results** (no votes, no speeches, no reports, no government activity), call `safeoutputs___noop({"message": "No significant parliamentary activity found for today's evening analysis."})` immediately and stop.

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

## 🛡️ File Ownership Contract

This workflow is a **content** workflow and MUST only create/modify files for **EN and SV** languages.

- ✅ **Allowed:** `news/YYYY-MM-DD-*-en.html`, `news/YYYY-MM-DD-*-sv.html`
- ❌ **Forbidden:** `news/YYYY-MM-DD-*-da.html`, `news/YYYY-MM-DD-*-no.html`, or any other translation language

Validate file ownership (checks staged, unstaged, and untracked changes):
```bash
npx tsx scripts/validate-file-ownership.ts content
```

If the validator reports violations, remove tracked changes with `git restore --staged --worktree -- <file>` (or `git checkout -- <file>` on older Git), and remove untracked files with `rm <file>` (or `git clean -f -- <file>`) before committing.

### Branch Naming Convention

Use deterministic branch names for content PRs:
```
news/content/{YYYY-MM-DD}/evening-analysis
```

> **Note:** `safeoutputs___create_pull_request` handles branch creation automatically; this naming convention is documented for traceability and conflict avoidance.

## Step 5: Commit & Create PR

### MANDATORY PR Creation (READ THIS FIRST)

> **🚀 HOW SAFE PR CREATION WORKS**
>
> The `safeoutputs___create_pull_request` tool handles **everything**: branch creation, pushing commits, and opening the PR. You do NOT create branches or push manually.
>
> **Exact steps:**
> 1. Write article files to `news/` using `bash` or `edit` tools
> 2. Stage and commit locally: `git add news/ && git commit -m "🌆 Evening Analysis - $(date +%Y-%m-%d)"`
> 3. Call `safeoutputs___create_pull_request` with `title`, `body`, and `labels`
>
> **❌ DO NOT** run `git push`, `git checkout -b`, `git branch`, or use GitHub API to create PRs.
> **❌ DO NOT** call `safeoutputs___noop` if articles were generated but PR creation failed — let the workflow FAIL instead.

- ✅ **REQUIRED:** `safeoutputs___create_pull_request` when articles were generated
- ✅ **ONLY USE `safeoutputs___noop` if genuinely no parliamentary activity** in the queried date range
- ❌ **NEVER use `safeoutputs___noop` as fallback for PR creation failures**

> **🚨 NEVER search for safe output tools via bash.** After `git commit`, call `safeoutputs___create_pull_request` directly as your VERY NEXT action.

```bash
git add news/
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
| Empty results | No parliamentary activity for the queried date range | Call `safeoutputs___noop({"message": "No significant parliamentary activity found for today."})` immediately |
| Timeout | MCP server response exceeds `timeout-minutes` | Reduce query scope or call `safeoutputs___noop` immediately |
| Stale data | `hoursSinceSync > 48` from `get_sync_status()` | Add disclaimer noting data staleness; proceed with cached data |
| Too broad results | Query returns excessive data without date filtering | Add explicit `from_date`/`to_date` parameters to narrow scope |

## 🚨 CRITICAL FINAL REMINDER

**YOU MUST call exactly one safe output tool before exiting.** This is the single most important rule of this workflow.

- If you generated articles → `safeoutputs___create_pull_request({...})`
- If no parliamentary activity → `safeoutputs___noop({"message": "No significant parliamentary activity found for today's evening analysis."})`
- If MCP server unreachable → `safeoutputs___noop({"message": "MCP server unavailable. No articles generated."})`
- If MCP data unavailable → `safeoutputs___missing_data({"reason": "MCP returned no usable data for evening analysis."})`
- If any error occurs → `safeoutputs___noop({"message": "Error during evening analysis: <brief description>"})`

**Failing to call a safe output tool = automatic workflow failure and a bug report.**

🎯 **Now begin: Check date/day-of-week, warm up MCP with `get_sync_status()`, gather parliamentary data, generate analysis articles, and call a safe output tool.**
