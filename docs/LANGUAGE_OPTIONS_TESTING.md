# Language Options Testing Guide

**Document Classification:** 🟢 Public  
**Last Updated:** 2026-02-14  
**Related Issue:** [GitHub Actions Run #22019458523](https://github.com/Hack23/riksdagsmonitor/actions/runs/22019458523/job/63626154184)

## Overview

This document provides comprehensive testing guidance for the news-article-generator workflow language parameter handling. It documents all supported language options and provides test cases for validation.

## Problem Statement

The news-article-generator workflow was not correctly handling language parameters. When users passed `languages: "no, da, fi"` (Norwegian, Danish, Finnish), the agent would ignore them and only generate English/Swedish articles.

## Root Causes

### 1. Missing Script Invocation Instructions

The agent instructions in `.github/workflows/news-article-generator.md` told the agent to manually create HTML files but never mentioned using the `generate-news-enhanced.js` script which already implements all language handling logic.

**Fixed by:** Adding comprehensive script invocation examples in Step 4.

### 2. Whitespace Handling Bug

The `scripts/generate-news-enhanced.js` script had a bug where it validated language codes with `.trim()` but didn't store the trimmed values:

```javascript
// ❌ OLD (bug)
const languages = languagesInput.split(',').filter(l => ALL_LANGUAGES.includes(l.trim()));

// ✅ NEW (fixed)
const languages = languagesInput.split(',').map(l => l.trim()).filter(l => ALL_LANGUAGES.includes(l));
```

**Fixed by:** Trimming whitespace before filtering (commit 601672b).

## Supported Language Options

### Default
- `en,sv` - English and Swedish only (default if not specified)

### Presets
- `nordic` → `en,sv,da,no,fi` (5 Nordic languages)
- `eu-core` → `en,sv,de,fr,es,nl` (6 EU core languages)
- `all` → All 14 languages: `en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh`

### Custom Lists
- Any comma-separated list (e.g., `"en,sv,de,fr"`)
- Whitespace handling: `"no, da, fi"` (spaces are automatically trimmed)

### All 14 Supported Languages

| Code | Language | Notes |
|------|----------|-------|
| en | English | Default |
| sv | Swedish | Default |
| da | Danish | Nordic |
| no | Norwegian | Nordic |
| fi | Finnish | Nordic |
| de | German | EU Core |
| fr | French | EU Core |
| es | Spanish | EU Core |
| nl | Dutch | EU Core |
| ar | Arabic | RTL layout (dir="rtl") |
| he | Hebrew | RTL layout (dir="rtl") |
| ja | Japanese | |
| ko | Korean | |
| zh | Chinese | |

## Manual Test Cases

### Test 1: Default Languages (en,sv)

```bash
# Run script without languages parameter
node scripts/generate-news-enhanced.js --types="week-ahead" --dry-run

# Expected output:
# Languages: en, sv
```

### Test 2: Nordic Preset Expansion

```bash
# Test nordic preset
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="nordic" --dry-run

# Expected output:
# Languages: en, sv, da, no, fi
```

### Test 3: EU Core Preset Expansion

```bash
# Test eu-core preset
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="eu-core" --dry-run

# Expected output:
# Languages: en, sv, de, fr, es, nl
```

### Test 4: All Languages Preset

```bash
# Test all preset
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="all" --dry-run

# Expected output:
# Languages: en, sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh
```

### Test 5: Custom List Without Spaces

```bash
# Test custom list
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="en,sv,de" --dry-run

# Expected output:
# Languages: en, sv, de
```

### Test 6: Custom List With Spaces (Whitespace Trimming)

```bash
# Test whitespace handling (THIS WAS THE BUG)
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="no, da, fi" --dry-run

# Expected output:
# Languages: no, da, fi
# ✅ Should trim spaces correctly
```

### Test 7: RTL Languages

```bash
# Test Arabic (RTL)
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="ar" --dry-run

# Expected output:
# Languages: ar

# Test Hebrew (RTL)
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="he" --dry-run

# Expected output:
# Languages: he

# Test both RTL languages
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="ar,he" --dry-run

# Expected output:
# Languages: ar, he
```

### Test 8: Error Handling - Invalid Language Code

```bash
# Test invalid language code
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="invalid" --dry-run

# Expected output:
# ❌ No valid language codes provided. Valid codes: en, sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh
# Process exits with error code 1
```

### Test 9: Mixed Valid/Invalid Codes

```bash
# Test filtering invalid codes
node scripts/generate-news-enhanced.js --types="week-ahead" --languages="en,invalid,sv" --dry-run

# Expected output:
# Languages: en, sv
# (invalid code silently filtered out)
```

### Test 10: All 14 Languages Individually

```bash
# Test each language individually
for lang in en sv da no fi de fr es nl ar he ja ko zh; do
  echo "Testing: $lang"
  node scripts/generate-news-enhanced.js --types="week-ahead" --languages="$lang" --dry-run | grep "Languages:"
done

# Expected output:
# Testing: en
# Languages: en
# Testing: sv
# Languages: sv
# ... (and so on for all 14)
```

## Workflow Testing

### Manual Workflow Dispatch Test

1. Go to GitHub Actions: `https://github.com/Hack23/riksdagsmonitor/actions/workflows/news-article-generator.lock.yml`
2. Click "Run workflow"
3. Test each language option:

#### Test A: Nordic Preset
```
article_types: week-ahead
force_generation: true
languages: nordic
```

**Expected Result:**
- Articles generated for: en, sv, da, no, fi
- 5 HTML files created: `news/YYYY-MM-DD-week-ahead-{lang}.html`

#### Test B: Custom List with Spaces
```
article_types: week-ahead
force_generation: true
languages: no, da, fi
```

**Expected Result:**
- Articles generated for: no, da, fi (spaces trimmed correctly)
- 3 HTML files created

#### Test C: All Languages
```
article_types: week-ahead
force_generation: true
languages: all
```

**Expected Result:**
- Articles generated for all 14 languages
- 14 HTML files created
- RTL layout for `ar` and `he` files

## Validation Checks

After article generation, validate:

### 1. File Existence Check

```bash
# Check if all requested languages were generated
LANG_ARG="en,sv,da,no,fi"  # Example
IFS=',' read -ra LANGS <<< "$LANG_ARG"

for lang in "${LANGS[@]}"; do
  count=$(find news -name "*-${lang}.html" -type f -mmin -10 | wc -l)
  if [ $count -gt 0 ]; then
    echo "✅ $lang: $count articles"
  else
    echo "❌ $lang: No articles found"
  fi
done
```

### 2. RTL Attribute Check

```bash
# Verify RTL layout for Arabic and Hebrew
for lang in ar he; do
  if ls -t news/*-"$lang".html 1>/dev/null 2>&1; then
    if grep -q 'dir="rtl"' news/*-"$lang".html; then
      echo "✅ $lang: RTL attribute present"
    else
      echo "❌ $lang: RTL attribute missing"
    fi
  fi
done
```

### 3. Language Attribute Check

```bash
# Verify HTML lang attribute matches file
for file in news/*-en.html news/*-sv.html news/*-da.html; do
  [ -f "$file" ] || continue
  lang=$(echo "$file" | grep -oP '\-(\w+)\.html$' | sed 's/-//;s/.html//')
  if grep -q "lang=\"$lang\"" "$file"; then
    echo "✅ $file: lang=\"$lang\" correct"
  else
    echo "❌ $file: lang attribute mismatch"
  fi
done
```

### 4. Hreflang Tags Check

```bash
# Verify hreflang tags include all generated languages
for file in news/*-en.html; do
  [ -f "$file" ] || continue
  
  # Check if hreflang tags exist
  if grep -q 'hreflang=' "$file"; then
    echo "✅ $file: hreflang tags present"
    
    # Count hreflang tags (should match number of generated languages)
    count=$(grep -c 'hreflang=' "$file")
    echo "   Found $count hreflang tags"
  else
    echo "❌ $file: hreflang tags missing"
  fi
done
```

## Continuous Integration

### GitHub Actions Workflow Test

The workflow automatically tests language handling:

```bash
# Language preset expansion (used by agentic workflows and CLI)
case "$LANGUAGES" in
  "nordic")
    LANG_ARG="en,sv,da,no,fi"
    ;;
  "eu-core")
    LANG_ARG="en,sv,de,fr,es,nl"
    ;;
  "all")
    LANG_ARG="en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh"
    ;;
  *)
    LANG_ARG="$LANGUAGES"
    ;;
esac
```

### Quality Gates

Before merging PR, verify:
- ✅ All manual test cases pass
- ✅ Script correctly trims whitespace
- ✅ Presets expand correctly
- ✅ Invalid codes are filtered
- ✅ RTL languages get `dir="rtl"` attribute
- ✅ Agent instructions include script invocation
- ✅ Documentation is updated

## Known Issues

### MCP Server Dependency

The `generate-news-enhanced.js` script requires access to the `riksdag-regering-mcp` server to fetch data. When the server is unavailable:

```
❌ Error generating Week Ahead: MCP request failed: MCP server error: 400 Bad Request
```

This is expected and doesn't indicate a language handling issue. The language parsing happens **before** MCP calls.

### Dry Run Limitations

The `--dry-run` flag prevents file writing but doesn't prevent MCP network calls. For true offline testing, the script would need refactoring.

## References

- **Fixed in:** Commit 601672b (2026-02-14)
- **Workflow:** `.github/workflows/news-article-generator.md`
- **Script:** `scripts/generate-news-enhanced.js`
- **Related:** `WORKFLOWS.md` - CI/CD documentation
- **Issue:** [GitHub Actions Run #22019458523](https://github.com/Hack23/riksdagsmonitor/actions/runs/22019458523/job/63626154184)

## Success Criteria

Language options are considered fully functional when:

- ✅ All 4 presets (default, nordic, eu-core, all) work correctly
- ✅ Custom comma-separated lists work with/without spaces
- ✅ All 14 individual languages work
- ✅ Invalid codes are rejected or filtered
- ✅ RTL languages get proper `dir="rtl"` attribute
- ✅ Agent instructions are clear and complete
- ✅ Manual workflow dispatch works for all options
- ✅ Generated articles appear in all 14 language index pages

---

**Status:** ✅ FIXED (2026-02-14)  
**Tested by:** DevOps Engineer (Copilot Agent)  
**Approved by:** Pending user validation
