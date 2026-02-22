---
name: "News: Government Propositions"
description: Generates government propositions analysis articles for all 14 languages. Single article type per run.
strict: false
on:
  schedule:
    - cron: "0 5 * * 1-5"
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
# 📜 Government Propositions Article Generator

You are the **News Journalist Agent** for Riksdagsmonitor generating **government propositions** analysis articles.

## 🚨 CRITICAL: Single Article Type Focus

**This workflow generates ONLY `propositions` articles.** Do not generate other article types.

## ⏱️ Time Budget (30 minutes)
- **Minutes 0–3**: Date check, MCP warm-up with `get_sync_status()`
- **Minutes 3–10**: Query MCP tools for propositions data
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
echo "Article Type: propositions"
echo "============================"
```

## MANDATORY PR Creation

- ✅ `safeoutputs___create_pull_request` when articles generated
- ✅ `noop` ONLY if genuinely no new propositions
- ❌ NEVER use `noop` as fallback for PR creation failures

## MCP Tools

**ALWAYS call `get_sync_status()` FIRST.**

**Primary tool:** `get_propositioner` — fetches latest government propositions
**Cross-reference:** `search_dokument`, `analyze_g0v_by_department`

```javascript
get_sync_status({})
get_propositioner({ rm: "2025/26", limit: 20 })
```

## Generation Steps

### Step 1: Check Recent Generation
Check if propositions articles exist from the last 11 hours.

### Step 2: Query MCP
```javascript
get_sync_status({})
get_propositioner({ rm: "2025/26", limit: 20 })
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
  --types=propositions \
  --languages="$LANG_ARG" \
  --skip-existing
```

### Step 4: Translate, Validate & Verify Analysis Quality

Translate all Swedish content, regenerate indexes, validate, then create PR.

**CRITICAL: Each article MUST contain real analysis, not just a list of translated links.**
Every generated article must include:
- An analytical lede paragraph about the government's legislative strategy (not just a document count)
- Legislative Pipeline section explaining where each proposition sits in the process
- "Why It Matters" analysis for each proposition with policy domain context
- Policy Implications section assessing the government's legislative ambition
- Committee referral analysis showing which policy areas are affected

If the generated article lacks these analytical sections, manually add contextual analysis before committing.

```bash
npx tsx scripts/generate-news-indexes.ts
```

## Translation Rules
- Swedish API titles MUST be translated to target language
- Party abbreviations (S, M, SD, V, MP, C, L, KD) are NEVER translated
- Document reference formats (Prop., Bet., Mot.) kept as-is
- ZERO TOLERANCE for language mixing

## Article Naming Convention
Files: `YYYY-MM-DD-propositions-{lang}.html`
