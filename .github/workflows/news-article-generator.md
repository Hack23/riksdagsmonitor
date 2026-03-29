---
name: "News: Article Generator (Manual)"
description: Manual-only multi-type article generator. For automated per-type generation, use the dedicated news-committee-reports, news-propositions, news-motions, news-week-ahead, news-month-ahead, news-weekly-review, news-monthly-review workflows. For translations, use news-translate workflow.
strict: false  # Allow custom network domain riksdag-regering-ai.onrender.com (trusted MCP server)
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
        default: standard

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read
  
timeout-minutes: 45

concurrency:
  group: gh-aw-news-article-generator-${{ inputs.article_types || 'manual' }}
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
  create-pull-request:
    labels: [agentic-news, analysis-data]
    draft: false
    expires: 14
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
# 📰 News Article Generator Agent

You are the **News Journalist Agent** for Riksdagsmonitor. Generate high-quality political journalism using the **purpose-built TypeScript generation scripts**.

## 🔧 Workflow Dispatch Parameters

- **article_types** = `${{ github.event.inputs.article_types }}`
- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`
- **document_ids** = `${{ github.event.inputs.document_ids }}`
- **document_urls** = `${{ github.event.inputs.document_urls }}`
- **focus_topic** = `${{ github.event.inputs.focus_topic }}`
- **analysis_depth** = `${{ github.event.inputs.analysis_depth }}`

**Rules:**
1. If **article_types** is non-empty, generate ONLY those types. Do NOT fall back to day-of-week schedule.
2. If **article_types** is empty/blank, use day-of-week schedule (see Step 2).
3. If **force_generation** is `true`, generate even if recent articles exist.
4. If **languages** is empty/blank, default to `all` (14 languages).
5. If **article_types** includes `deep-inspection`, use **document_ids**, **document_urls**, and **focus_topic** for targeted deep analysis. **`document_ids` must be actual Riksdag dok_id values** (e.g. `H901FöU1,GZ01KU1`) — NOT search queries or wildcards. Use the riksdag-regering MCP tools first to find the correct IDs, then pass them.
6. For `deep-inspection` type: pass `--document-ids=<value>`, `--document-urls=<value>`, and `--focus-topic=<value>` flags to the generation script. **The script generates the following sections — these are ONLY available via the script, never via manual fallback:**
   - **Multi-stakeholder SWOT analysis** (Government, Parliament, Civil Society perspectives)
   - **Document Intelligence Dashboard** — Chart.js bar chart of document-type distribution
   - **Sankey flow chart** (SVG, no JS) — initiating actors → document types (only when ≥ 2 document types detected)
   - **Color-coded CSS Mindmap** — topic → detected policy domains → stakeholders → data sources
   - **World Bank Economic Dashboard** — auto-selected Nordic comparison charts based on detected policy domains (fiscal, labour, defence, healthcare, etc.)
   - **5W Deep-Analysis section** — Who/What/When/Why/Winners–Losers narrative

   **URL handling for `document_urls`:**
   - **riksdagen.se / data.riksdagen.se URLs** → auto-resolved to dok_id, fetched via `get_dokument`
   - **regeringen.se URLs** (e.g. press releases, SOUs, government decisions) → fetched via `get_g0v_document_content` MCP tool. The content is included as a government-source document in the analysis. **This is the primary mechanism for analyzing government press releases, SOUs, and other regeringen.se content.**
   - **github.com / raw.githubusercontent.com URLs** → converted to raw URL, fetched as text content. Used for **comparison/reference analysis** (e.g. linking Hack23 ISMS strategy, security policies, or other reference documents for comparison against government policy). The `blob/` path is automatically converted to raw content URL.
   - **Other URLs** → logged as warnings (not currently supported)

   **Example deep-inspection dispatch for cybersecurity strategy comparison:**
   ```
   article_types: deep-inspection
   document_urls: https://www.regeringen.se/pressmeddelanden/2026/03/91-atgarder-ska-starka-sveriges-motstandskraft-mot-cyberhot/,https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Strategy.md
   focus_topic: cyber security, cyberthreats, threatlandscape, cyber security strategy, ai future, ai security, hack23
   ```
   This will: (1) fetch the 91-measure plan via g0v, (2) fetch Hack23 ISMS strategy from GitHub, (3) generate SWOT comparing government strategy with private-sector reference, (4) focus all analysis through the cybersecurity + AI lens.

   Data sources automatically integrated into deep-inspection articles:
   - **Riksdag MCP** — propositions, committee reports, motions, laws (SFS), EU position papers
   - **Government MCP (g0v)** — regeringen.se press releases, SOUs, government decisions (via `get_g0v_document_content`)
   - **GitHub raw content** — external reference documents (strategy docs, ISMS policies, compliance frameworks) for comparison analysis
   - **World Bank MCP** (`api.worldbank.org`) — economic indicators for matching policy domains
   - **SCB MCP** (`api.scb.se`) — Swedish statistics context for matching policy domains
   - **CIA-data** (JSON exports) — when loaded via `--document-urls` pointing to CIA exports

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
   - No data available → `safeoutputs___noop({"message": "..."})`
   - Tool unavailable → `safeoutputs___missing_tool({"reason": "..."})`
2. `safeoutputs___create_pull_request` handles branch creation and push. **NEVER** run `git push` or `git checkout -b`.
3. Safe output tools are **always in your tool list**. NEVER search for them via bash.
4. **NEVER** write your own MCP HTTP/JSON-RPC client. Use the scripts or direct tool calls only.
5. Exiting without calling a safe output tool = workflow failure.

## ⏱️ Time Budget (45 minutes)

```bash
START_TIME=$(date +%s)
```

| Phase | Minutes | Action |
|-------|---------|--------|
| Setup | 0–3 | Date check, `get_sync_status()` warm-up, check recent generation |
| Download & Analysis | 3–13 | Run data download + AI per-file analysis (methodology-guided, SWOT.md quality) |
| Data | 13–18 | Query MCP tools for article types |
| Generate | 18–30 | Run `generate-news-enhanced.ts` in batches |
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
7. **`scripts/prompts/v2/political-analysis.md`** — Core political analysis framework (6 analytical lenses)
8. **`scripts/prompts/v1/stakeholder-perspectives.md`** — Multi-perspective analysis instructions
9. **`scripts/prompts/v2/quality-criteria.md`** — Quality self-assessment rubric (minimum 7/10)
10. **`scripts/prompts/v2/per-file-intelligence-analysis.md`** — Per-file AI analysis protocol
11. **`analysis/methodologies/ai-driven-analysis-guide.md`** — Methodology for deep per-file analysis
12. **`analysis/templates/per-file-political-intelligence.md`** — Per-file analysis output template

## 📊 MANDATORY Multi-Step AI Analysis Framework

### Standardised Analysis Depth Gate

| Depth | AI iterations | SWOT stakeholders | Charts | Mindmap |
|-------|--------------|-------------------|--------|---------|
| standard | 1-2 | ≥3 | ≥1 | optional |
| deep | 2-3 | ≥5 | ≥2 | required |
| comprehensive | 3+ | ≥7 | ≥3 | required |

> **Read `analysis_depth` input first** (default: `standard`). This controls how many AI iterations to apply per article type.

Each article type has a profile in `scripts/editorial-framework.ts` with the exact SWOT depth, dashboard requirements, mindmap requirements, stakeholder count, and AI iteration count to target. Use `getArticleTypeProfile(articleType)` to retrieve the profile, then apply the corresponding sections:

| Depth | Iterations | SWOT | Dashboard | Mindmap |
|-------|-----------|------|-----------|---------|
| standard | min(2, profile.aiIterations) | as profile | as profile | as profile |
| deep | clamp(2–3, profile.aiIterations) | as profile | as profile | as profile |
| comprehensive | max(3, profile.aiIterations) | as profile | as profile | as profile |

### Per-Article-Type Iteration Pattern
For each article type being generated in this run:
1. **Phase 1**: Fetch data → initial outline
2. **Phase 2**: Enhance with SWOT + Dashboard + Mindmap (per profile requirements)
3. **Quality Gate**: word count ≥ profile.minWordCount, no identical why-it-matters, all Swedish translated
4. **Additional iterations**: if `analysis_depth` is `deep` or `comprehensive` and quality gate fails

## Step 1: Date Validation & MCP Health Check

```bash
echo "=== Date Validation Check ==="
START_TIME=$(date +%s)
echo "START_TIME=$START_TIME" > /tmp/gh-aw/agent/timing.env
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
date +"%Z: %A %Y-%m-%d %H:%M:%S"
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

**ALL article content MUST originate from live MCP data.** Never fabricate, recycle, or generate from cached data.

### Data Freshness & Date Filtering

Parse sync status: if data is stale (> 48 hours since last sync), add disclaimer. Use riksdag-regering-mcp (32 tools for Swedish parliament data). For ad-hoc queries, use `scripts/mcp-query-cli.ts` — NEVER implement custom MCP client code (PROHIBITION).

Tools with date params: `get_calendar_events` (from/tom — **authoritative for scheduled/forward-looking events; may sometimes return HTML instead of JSON — if this happens, treat it as a calendar data error, NOT as "no events"**), `search_dokument` (from_date/to_date — **only use as a recent-activity proxy for retrospective/near‑real‑time monitoring when calendar data is temporarily unusable; NEVER substitute it for week/month‑ahead or debate schedule data**), `search_regering` (dateFrom/dateTo). Other tools (`search_voteringar`, `get_betankanden`, `get_motioner`, `get_propositioner`, `search_anforanden`) require post-query filter by datum.

## Step 1.5: Run Pre-Article Analysis Pipeline

**CRITICAL: Run the analysis pipeline BEFORE generating articles.** This downloads data from riksdag-regering-mcp, runs all 9 analysis steps (classification, risk assessment, SWOT, threat analysis, stakeholder perspectives, significance scoring, cross-references, synthesis), and writes structured artifacts to `analysis/daily/YYYY-MM-DD/`.

```bash
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
if [ -z "$ARTICLE_DATE" ]; then
  ARTICLE_DATE=$(date -u +%Y-%m-%d)
fi
echo "📊 Running pre-article analysis for $ARTICLE_DATE..."
# CRITICAL: Source mcp-setup.sh FIRST to set MCP_SERVER_URL and MCP_AUTH_TOKEN for the gateway
source scripts/mcp-setup.sh && npx tsx scripts/pre-article-analysis.ts --date "$ARTICLE_DATE" --limit 50 2>&1 | tee /tmp/pipeline-output.log
PIPE_EXIT=${PIPESTATUS[0]}
if [ "$PIPE_EXIT" -ne 0 ]; then
  echo "❌ Pipeline failed — agent MUST diagnose and fix (read /tmp/pipeline-output.log)"
  tail -20 /tmp/pipeline-output.log
fi
echo "📊 Analysis artifacts for $ARTICLE_DATE:"
ls -la "analysis/daily/$ARTICLE_DATE/" 2>/dev/null || echo "⚠️ No analysis output"
DATA_JSON_COUNT=$(find analysis/data/ -name "*.json" -type f 2>/dev/null | wc -l)
echo "📊 JSON data files: $DATA_JSON_COUNT (must be > 0)"
if [ "$DATA_JSON_COUNT" -eq 0 ]; then
  echo "🚨 CRITICAL: Pipeline downloaded ZERO data. Agent MUST diagnose and fix — do NOT fabricate analysis."
fi
```

### Per-File AI Analysis Enhancement

After the script-based analysis, perform **AI-driven per-file analysis** for deeper intelligence:

1. Run `npx tsx scripts/catalog-downloaded-data.ts --pending-only` to list files needing analysis
2. Read the methodology guides:
   - `analysis/methodologies/ai-driven-analysis-guide.md`
   - `analysis/methodologies/political-swot-framework.md`
   - `analysis/templates/per-file-political-intelligence.md`
3. For each pending file: classify, SWOT, risk assess, STRIDE, stakeholder impact, write `.analysis.md`
4. Each analysis file must include color-coded Mermaid diagrams and evidence tables
5. Quality gate: ≥3 evidence points, confidence labels, no template placeholders

These analysis files are committed alongside articles for human review and continuous improvement.

### 🚨 MANDATORY: Analysis Artifacts Must ALWAYS Be Committed

**Before deciding whether to generate articles or call noop, you MUST:**

1. **Review the analysis artifacts** in `analysis/daily/YYYY-MM-DD/` — read `synthesis-summary.md` and `significance-scoring.md` to understand what was found
2. **Summarize the analysis findings** — note how many documents were downloaded, their significance scores, key themes, and risk levels
3. **ALWAYS commit analysis artifacts** regardless of whether articles will be generated:

```bash
ARTICLE_DATE="${{ github.event.inputs.article_date }}"
[ -z "$ARTICLE_DATE" ] && ARTICLE_DATE=$(date -u +%Y-%m-%d)
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE"
ANALYSIS_COUNT=0
if [ -d "$ANALYSIS_DIR" ]; then
  ANALYSIS_COUNT=$(find "$ANALYSIS_DIR" -type f | wc -l)
fi
if [ "$ANALYSIS_COUNT" -gt 0 ]; then
  echo "📊 Found $ANALYSIS_COUNT analysis artifacts in $ANALYSIS_DIR — these MUST be committed (do NOT use safeoutputs___noop)"
else
  echo "📊 Found 0 analysis artifacts — safeoutputs___noop is allowed (no files to commit)"
fi
```

> **🚨 CRITICAL RULE: Never call `safeoutputs___noop` if analysis artifacts exist.** If the pre-article analysis pipeline produced ANY output files in `analysis/daily/YYYY-MM-DD/`, you MUST commit them via `safeoutputs___create_pull_request` — even if no articles are generated. Use an analysis-only PR with title: `📊 Analysis Only - Article Generator - {date}` and label `analysis-only`. Only use `safeoutputs___noop` if the analysis pipeline produced ZERO output files (truly nothing to analyze).

## Step 2: Determine Article Types & Languages

```bash
# Use the article_types workflow dispatch parameter
ARTICLE_TYPES="${{ github.event.inputs.article_types }}"
if [ -z "$ARTICLE_TYPES" ]; then
  DAY_OF_WEEK=$(date -u +"%u")  # 1=Monday, 7=Sunday
  case "$DAY_OF_WEEK" in
    5)  ARTICLE_TYPES="week-ahead,committee-reports,propositions,motions,interpellations"
        echo "📅 Friday schedule" ;;
    6|7) ARTICLE_TYPES="committee-reports,propositions,motions,interpellations"
        echo "📅 Weekend schedule" ;;
    *)  ARTICLE_TYPES="committee-reports,propositions,motions,interpellations"
        echo "📅 Weekday schedule" ;;
  esac
fi

# Use the languages workflow dispatch parameter
LANGUAGES_INPUT="${{ github.event.inputs.languages }}"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="all"
LANGUAGES_INPUT=$(echo "$LANGUAGES_INPUT" | xargs)

case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac

echo "📰 Types: $ARTICLE_TYPES | Languages: $LANG_ARG"
```

Valid article types (defined in `scripts/generate-news-enhanced/config.ts:VALID_ARTICLE_TYPES`): `week-ahead`, `month-ahead`, `weekly-review`, `monthly-review`, `committee-reports`, `propositions`, `motions`, `interpellations`, `breaking`, `deep-inspection`. Note: `evening-analysis` is NOT a valid script type — evening analysis requires manual synthesis (see `news-evening-analysis.md`).

## Step 3: Generate Articles (Script-First)

**PRIMARY APPROACH — use the batch generation script:**

> ⚠️ **CRITICAL — MCP env vars and script MUST run in the same shell session.**
> Never pipe `source scripts/mcp-setup.sh` to `tail` or run it in a separate bash invocation.
> Use `source scripts/mcp-setup.sh && npx tsx ...` on a **single command line**.

```bash
# Build deep-inspection flags using bash array (preserves spaces in values — NOT a string)
DEEP_ARGS=()
if echo "$ARTICLE_TYPES" | grep -q "deep-inspection"; then
  DOCUMENT_IDS="${{ github.event.inputs.document_ids }}"
  DOCUMENT_URLS="${{ github.event.inputs.document_urls }}"
  FOCUS_TOPIC="${{ github.event.inputs.focus_topic }}"
  [ -n "$DOCUMENT_IDS" ]   && DEEP_ARGS+=("--document-ids=${DOCUMENT_IDS}")
  [ -n "$DOCUMENT_URLS" ]  && DEEP_ARGS+=("--document-urls=${DOCUMENT_URLS}")
  [ -n "$FOCUS_TOPIC" ]    && DEEP_ARGS+=("--focus-topic=${FOCUS_TOPIC}")
  echo "📋 Deep-inspection args: ${DEEP_ARGS[*]}"
fi

BATCH_NUM=1
while true; do
  echo "🔄 Running batch $BATCH_NUM..."
  # source + npx on ONE line so MCP_SERVER_URL is in scope for the script process
  source scripts/mcp-setup.sh && npx tsx scripts/generate-news-enhanced.ts \
    --types="$ARTICLE_TYPES" \
    --languages="$LANG_ARG" \
    --batch-size=5 \
    --skip-existing \
    "${DEEP_ARGS[@]}"
  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Batch $BATCH_NUM failed with exit code $EXIT_CODE"
    break
  fi

  # Check if all languages are done
  if [ -f "news/metadata/batch-status.json" ]; then
    ALL_DONE=$(node -e "const s=JSON.parse(require('fs').readFileSync('news/metadata/batch-status.json','utf8')); console.log(s.complete)")
    if [ "$ALL_DONE" = "true" ]; then
      echo "✅ All languages generated!"
      break
    fi
  else
    break  # No batch status means single-pass completed
  fi

  BATCH_NUM=$((BATCH_NUM + 1))
  if [ $BATCH_NUM -gt 5 ]; then
    echo "⚠️ Exceeded maximum batch count"
    break
  fi

  # Check time budget before next batch
  ELAPSED=$(( ($(date +%s) - $START_TIME) / 60 ))
  if [ $ELAPSED -ge 30 ]; then
    echo "⏰ Time budget reached ($ELAPSED min), proceeding with generated articles"
    break
  fi
done

TODAY="$(date +%Y-%m-%d)"
NEW_ARTICLES="$(git status --porcelain -- news/ | awk '{print $2}' | grep "${TODAY}-" || true)"
if [ -z "$NEW_ARTICLES" ]; then
  echo "No new articles created."
else
  echo "Newly generated articles:"
  printf '%s\n' "$NEW_ARTICLES"
fi
```

- If `$NEW_ARTICLES` is non-empty → proceed to Step 4
- If empty AND `$EXIT_CODE` is 0 (no data available) → call `safeoutputs___noop`
- If empty AND `$EXIT_CODE` is non-zero → see Fallback below

### Fallback: Manual Generation (ONLY for non-deep-inspection types if script fails AND no articles created)

> ⚠️ **`deep-inspection` NEVER uses manual fallback.** The script generates multi-stakeholder SWOT analysis, Chart.js document-intelligence dashboard, inline SVG Sankey flow chart, color-coded CSS mindmap, World Bank economic dashboard, and 5W deep-analysis sections that **cannot be replicated manually**. If the script fails for deep-inspection, diagnose and fix the MCP connection, then retry. If MCP is genuinely unavailable, call `safeoutputs___noop` with a clear error message.
>
> **Before declaring script failure, verify MCP is live in the same shell:**
> ```bash
> source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=${MCP_SERVER_URL}"
> ```
> Expected output: `MCP_SERVER_URL=http://host.docker.internal:80/mcp/riksdag-regering`  
> If the value is blank or "unset", `mcp-setup.sh` failed to read the gateway key — check `GH_AW_MCP_CONFIG`. If set correctly, retry the full script command.

For **non-deep-inspection** article types only, if the script fails, generate articles manually ONE language at a time:
1. Check elapsed time — if >= 38 minutes, stop and call noop with summary
2. Write HTML to `news/YYYY-MM-DD-{slug}-{lang}.html`
3. Use `<link rel="stylesheet" href="../styles.css">` — NO embedded `<style>` tags
4. Include language switcher, article-top-nav, Schema.org NewsArticle, hreflang tags
5. Use `dir="rtl"` for Arabic (ar) and Hebrew (he)

> 🚫 **NEVER use bash heredoc (`cat > file << 'EOF'`) to write article HTML.** Heredoc truncates large content and causes silent failures.
>
> ✅ **Build the file incrementally** with multiple small `printf` appends (no heredoc, no size limits):
> ```bash
> FILE="news/YYYY-MM-DD-slug-en.html"
> printf '%s\n' '<!DOCTYPE html>' > "$FILE"
> printf '%s\n' '<html lang="en">' >> "$FILE"
> printf '%s\n' '<head><link rel="stylesheet" href="../styles.css"></head>' >> "$FILE"
> printf '%s\n' '<body>' >> "$FILE"
> # ... append each section separately ...
> printf '%s\n' '</body></html>' >> "$FILE"
> ```

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

If untranslated content found, translate each `<span data-translate="true" lang="sv">text</span>` to the target language and remove the wrapper.

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
news/content/{YYYY-MM-DD}/{article-types}
```

> **Note:** `safeoutputs___create_pull_request` handles branch creation automatically; this naming convention is documented for traceability and conflict avoidance.

## Step 5: Commit & Create PR

### HOW SAFE PR CREATION WORKS

⚠️ DO NOT use `git push` — the safe output tool handles publishing. Commit locally, then use the tool.

```bash
git add news/ analysis/daily/ analysis/weekly/
git commit -m "📰 Automated News Generation - $(date +%Y-%m-%d)"
```

Then **immediately** call (as a direct tool call, NOT via bash):
```
safeoutputs___create_pull_request({
  "title": "📰 Automated News Generation - {date}",
  "body": "## Automated News Generation\n\nArticles: {count}\nTypes: {types}\nLanguages: {list}\nSource: riksdag-regering-mcp",
  "labels": ["automated-news", "news-generation", "needs-editorial-review"]
})
```

## 🌐 MANDATORY Translation Quality Rules

> **📋 Canonical translation rules are maintained in `news-translate.md`.**

When generating articles for non-EN/SV languages in this manual workflow:
1. **ALL section headings** and body content MUST be in the target language
2. **Meta keywords** MUST be translated to the target language
3. **data-translate markers**: ZERO `data-translate="true"` spans in final output
4. Swedish API titles MUST be translated to target language
5. Party abbreviations (S, M, SD, V, MP, C, L, KD) are NEVER translated

For comprehensive per-language rules (RTL, CJK, Nordic, European), localized CONTENT_LABELS, and validation commands, see `news-translate.md`.

**Recommended workflow**: Generate EN/SV content first with deep analysis, then dispatch `news-translate` for remaining languages:
```
safeoutputs___dispatch_workflow({
  "workflow_name": "news-translate",
  "inputs": {
    "article_date": "<YYYY-MM-DD>",
    "article_type": "<article-type>",
    "languages": "all-extra"
  }
})
```

> **⚠️ Timing note:** The dispatch runs immediately after creating this PR, but the translate workflow checks out `main` where the EN/SV articles may not yet exist (the content PR hasn't been merged). In this case, the translate workflow will `noop` gracefully. The scheduled translate cron (11:00 and 17:00 UTC weekdays) will pick up the translations after the content PR is merged.

## Error Handling

| Scenario | Cause | Fix |
|----------|-------|-----|
| Tool not found | MCP server not initialized | Run `source scripts/mcp-setup.sh && echo "MCP_SERVER_URL=${MCP_SERVER_URL}"` — source and script MUST be chained with `&&` on one line; never pipe source to tail |
| Empty results | No new documents for the queried article type | Check if analysis artifacts exist — if yes, commit them and create analysis-only PR; if no, call `safeoutputs___noop` |
| Timeout | MCP server response exceeds `timeout-minutes` | Commit any analysis artifacts produced so far, then call safe output |
| Stale data | `hoursSinceSync > 48` from `get_sync_status()` | Add disclaimer noting data staleness; proceed with cached data |

🎯 **Now begin: Check date, warm up MCP with `get_sync_status()`, run pre-article analysis pipeline, review analysis results, determine article types, generate with the script, validate, and call a safe output tool.**
