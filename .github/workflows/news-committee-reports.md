---
name: "News: Committee Reports"
description: Generates committee reports analysis articles for all 14 languages. Single article type per run to reduce patch size and improve reliability.
strict: false
on:
  schedule:
    - cron: "0 4 * * 1-5"
  workflow_dispatch:
    inputs:
      force_generation:
        description: Force generation even if recent articles exist
        type: boolean
        required: false
        default: false
      languages:
        description: 'Languages to generate (en,sv | nordic | eu-core | all)'
        required: false
        default: all

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 30

network:
  allowed:
    - node
    - github.com
    - api.github.com
    - riksdag-regering-ai.onrender.com
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

tools:
  github:
    toolsets:
      - all
  bash: true

safe-outputs:
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - data.riksdagen.se
    - www.riksdagen.se
    - www.regeringen.se
    - github.com
  create-pull-request: {}
  add-comment: {}

steps:
  - name: Setup Node.js
    uses: actions/setup-node@6044e13b5dc448c55e2357c09f80417699197238 # v6.2.0
    with:
      node-version: '24'

  - name: Install dependencies
    run: |
      npm ci --prefer-offline --no-audit

engine:
  id: copilot
  model: claude-opus-4.6
---
# 📋 Committee Reports Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **committee reports** analysis articles.

## 🔧 Workflow Dispatch Parameters

- **force_generation** = `${{ github.event.inputs.force_generation }}`
- **languages** = `${{ github.event.inputs.languages }}`

If **force_generation** is `true`, generate articles even if recent ones exist. Use the **languages** value to determine which languages to generate.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `committee-reports` articles.** Do not generate other article types.
This focused approach ensures:
- Smaller patch sizes (avoids safe_outputs failures)
- Faster execution within timeout
- Independent scheduling per article type

## ⏱️ Time Budget (30 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–10**: Query MCP tools for committee reports data
- **Minutes 10–22**: Generate articles for all 14 languages
- **Minutes 22–27**: Validate and commit
- **Minutes 27–30**: Create PR with `safeoutputs___create_pull_request`

## Required Skills

Before generating articles, consult these skills:
1. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
2. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
3. **`.github/skills/editorial-standards/SKILL.md`** — The Economist-style standards
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage

## MANDATORY Date Validation

**ALWAYS START by logging the current date:**
```bash
echo "=== Date Validation Check ==="
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
echo "Article Type: committee-reports"
echo "============================"
```

## MANDATORY PR Creation

- ✅ **REQUIRED:** `safeoutputs___create_pull_request` when articles generated
- ✅ **ONLY USE `noop` if genuinely no new committee reports** from riksdag-regering-mcp
- ❌ **NEVER use `noop` as fallback for PR creation failures**

## MCP Tools

**ALWAYS call `get_sync_status()` FIRST** to warm up server and check data freshness.

**Primary tool:** `get_betankanden` — fetches latest committee reports
**Cross-reference:** `search_voteringar`, `search_anforanden`, `get_propositioner`

```javascript
get_sync_status({})
get_betankanden({ rm: "2025/26", limit: 20 })
```

## Generation Steps

### Step 1: Check Recent Generation
Check if committee-reports articles exist from the last 11 hours. Skip if force_generation is false AND recent articles exist.

### Step 2: Query MCP for Committee Reports
```javascript
get_sync_status({})
get_betankanden({ rm: "2025/26", limit: 20 })
```

### Step 3: Generate Articles

Parse the `languages` input and generate using the automated script:

```bash
# Set LANGUAGES_INPUT to the value shown in Workflow Dispatch Parameters above
LANGUAGES_INPUT="<value from Workflow Dispatch Parameters>"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="all"

case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac

export MCP_SERVER_URL="http://host.docker.internal:80/mcp/riksdag-regering"
npx tsx scripts/generate-news-enhanced.ts \
  --types=committee-reports \
  --languages="$LANG_ARG" \
  --skip-existing
```

### Step 4: Translate Swedish Content & Verify Analysis Quality
All Swedish API data MUST be translated. Check every article for `data-translate="true"` markers.

**CRITICAL: Each article MUST contain real analysis, not just a list of translated links.**
Every generated article must include:
- An analytical lede paragraph providing political context (not just a document count)
- Thematic analysis section grouping reports by committee with interpretive commentary
- "What This Means" or "Why It Matters" analysis for each document
- Key Takeaways section summarizing political significance and implications
- Policy domain inference (fiscal, defence, healthcare, etc.) based on committee and title

If the generated article lacks these analytical sections, manually add contextual analysis before committing.

### Step 5: Regenerate Indexes
```bash
npx tsx scripts/generate-news-indexes.ts
```

### Step 6: Validate & Create PR
Validate HTML structure, then create PR:
```
safeoutputs___create_pull_request
```

## Translation Rules
- Swedish API titles MUST be translated to target language
- Committee abbreviations (FiU, SoU) kept as-is in document references
- Party abbreviations (S, M, SD, V, MP, C, L, KD) are NEVER translated
- ZERO TOLERANCE for language mixing

## Article Naming Convention
Files: `YYYY-MM-DD-committee-reports-{lang}.html` (e.g., `2026-02-22-committee-reports-en.html`)
