---
name: "News: Monthly Review"
description: Generates monthly review retrospective articles for all 14 languages. Runs on 28th of each month.
strict: false
on:
  schedule:
    cron: "0 10 28 * *"
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
# 📊 Monthly Review Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **monthly review** retrospective articles.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `monthly-review` articles.** Do not generate other article types.

This is a **retrospective** article providing comprehensive analysis of the past 30 days of parliamentary activity — legislative output, coalition dynamics, government performance, and policy trends over the full monthly cycle.

## ⏱️ Time Budget (30 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–10**: Query documents, votes, and reports from past 30 days
- **Minutes 10–22**: Generate articles for all 14 languages
- **Minutes 22–27**: Validate and commit
- **Minutes 27–30**: Create PR with `safeoutputs___create_pull_request`

## Required Skills

1. **`.github/skills/swedish-political-system/SKILL.md`** — Parliamentary terminology
2. **`.github/skills/language-expertise/SKILL.md`** — Per-language style guidelines
3. **`.github/skills/editorial-standards/SKILL.md`** — The Economist-style standards
4. **`.github/skills/riksdag-regering-mcp/SKILL.md`** — MCP tool documentation
5. **`.github/skills/gh-aw-safe-outputs/SKILL.md`** — Safe outputs usage

## MANDATORY Date Validation

```bash
echo "=== Date Validation Check ==="
date -u "+Current UTC: %A %Y-%m-%d %H:%M:%S"
echo "Article Type: monthly-review"
echo "============================"
```

## MANDATORY PR Creation

- ✅ `safeoutputs___create_pull_request` when articles generated
- ✅ `noop` ONLY if genuinely no parliamentary activity in past month
- ❌ NEVER use `noop` as fallback for PR creation failures

## MCP Tools

**ALWAYS call `get_sync_status()` FIRST.**

**Primary tools:** `search_dokument`, `get_betankanden` — comprehensive document search
**Cross-reference:** `get_propositioner`, `get_motioner`, `search_voteringar`, `analyze_g0v_by_department`

```javascript
get_sync_status({})
const lastMonth = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];
search_dokument({ from_date: lastMonth, to_date: today, limit: 50 })
get_betankanden({ rm: "2025/26", limit: 20 })
get_propositioner({ rm: "2025/26", limit: 20 })
get_motioner({ rm: "2025/26", limit: 20 })
search_voteringar({ rm: "2025/26", limit: 30 })
analyze_g0v_by_department({ dateFrom: lastMonth, dateTo: today })
```

## Generation Steps

### Step 1: Check Recent Generation
Check if monthly-review articles exist from the last 72 hours (monthly cadence).

### Step 2: Query MCP
```javascript
get_sync_status({})
search_dokument({ from_date: lastMonth, to_date: today, limit: 50 })
```

### Step 3: Generate Articles

```bash
LANGUAGES_INPUT="${{ github.event.inputs.languages }}"
[ -z "$LANGUAGES_INPUT" ] && LANGUAGES_INPUT="all"

case "$LANGUAGES_INPUT" in
  "nordic") LANG_ARG="en,sv,da,no,fi" ;;
  "eu-core") LANG_ARG="en,sv,de,fr,es,nl" ;;
  "all") LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
  *) LANG_ARG="$LANGUAGES_INPUT" ;;
esac

export MCP_SERVER_URL="http://host.docker.internal:80/mcp/riksdag-regering"
npx tsx scripts/generate-news-enhanced.ts \
  --types=monthly-review \
  --languages="$LANG_ARG" \
  --skip-existing
```

### Step 4: Translate, Validate & Create PR

```bash
npx tsx scripts/generate-news-indexes.ts
```

## Article Content Structure

Monthly review articles should include:
1. **Month in Numbers**: Key legislative statistics (bills passed, votes held, motions filed)
2. **Legislative Output**: Major legislation enacted or debated
3. **Government Performance**: Propositions tabled, policy direction analysis
4. **Coalition Dynamics**: Cross-party cooperation, voting discipline trends
5. **Committee Highlights**: Most significant committee reports and recommendations
6. **Opposition Activity**: Key motions, interpellations, government scrutiny
7. **Policy Trends**: Emerging patterns in government priorities
8. **Month's Most Consequential**: Deep analysis of the month's defining development
9. **Looking Ahead**: Preview of next month's parliamentary calendar

## Translation Rules
- Swedish API titles MUST be translated
- Party abbreviations NEVER translated
- ZERO TOLERANCE for language mixing

## Article Naming Convention
Files: `YYYY-MM-DD-monthly-review-{lang}.html`
