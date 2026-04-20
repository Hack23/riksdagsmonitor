#!/bin/bash
# Validation Script for Agentic Workflow News Generation
# 
# This script validates that all news generation output meets quality standards
# and e2e test expectations before creating a PR.
#
# Usage: ./scripts/validate-news-generation.sh
# Exit codes: 0 = all checks pass, 1 = validation failed
#
# Author: Hack23 AB
# License: Apache-2.0

set -e  # Exit on unexpected errors; expected validation failures are guarded (if/||) and won't trigger this
set -u  # Exit on undefined variable

echo "🔍 Validating news generation output..."
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Check 1: Semantic HTML structure in news index files (if they exist)
# NOTE: news/index*.html are listed in .gitignore and generated at build time
# by the prebuild script. They are NOT present when this script runs in the
# agentic workflow. Skip them gracefully — they are validated at build/deploy.
# ============================================================================
echo "📋 Check 1: Semantic HTML structure in news/index*.html (build-time files)"

REQUIRED_ELEMENTS=(
  '<nav class="language-switcher"'
  '<main role="main"'
  '<footer class="footer-section"'
)

INDEX_FILES_FOUND=0
INDEX_ERRORS=0
for idx in news/index.html news/index_{sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  if [ -f "$idx" ]; then
    INDEX_FILES_FOUND=$((INDEX_FILES_FOUND + 1))
    for element in "${REQUIRED_ELEMENTS[@]}"; do
      if ! grep -q "$element" "$idx"; then
        echo -e "${RED}❌ Missing $element in $idx${NC}"
        INDEX_ERRORS=$((INDEX_ERRORS + 1))
        ERRORS=$((ERRORS + 1))
      fi
    done
  fi
done

if [ $INDEX_FILES_FOUND -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  News index files not present (they are in .gitignore, generated at build time — OK)${NC}"
elif [ $INDEX_ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All $INDEX_FILES_FOUND present news index files have required semantic HTML structure${NC}"
else
  echo -e "${RED}❌ $INDEX_ERRORS structural errors in news index files${NC}"
fi
echo ""

# ============================================================================
# Check 2: No untranslated Swedish content markers
# ============================================================================
echo "📋 Check 2: No untranslated Swedish content markers (data-translate)"

UNTRANSLATED=0
for file in news/*-{en,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  if [ -f "$file" ] && grep -q 'data-translate="true"' "$file"; then
    echo -e "${RED}❌ Untranslated Swedish content in $(basename $file)${NC}"
    UNTRANSLATED=$((UNTRANSLATED + 1))
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $UNTRANSLATED -eq 0 ]; then
  echo -e "${GREEN}✅ No untranslated Swedish content markers found${NC}"
else
  echo -e "${RED}❌ $UNTRANSLATED articles contain untranslated Swedish content${NC}"
fi
echo ""

# ============================================================================
# Check 3: Non-English articles don't have English taglines
# ============================================================================
echo "📋 Check 3: Localized taglines in non-English articles"

ENGLISH_TAGLINES=0
for file in news/*-{da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  if [ -f "$file" ] && grep -q 'class="site-tagline">Latest news and analysis' "$file"; then
    echo -e "${RED}❌ English tagline in non-English article: $(basename $file)${NC}"
    ENGLISH_TAGLINES=$((ENGLISH_TAGLINES + 1))
    ERRORS=$((ERRORS + 1))
  fi
done

# Also check news indexes
for file in news/index_{da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  if [ -f "$file" ] && grep -q 'class="site-tagline">Latest news and analysis' "$file"; then
    echo -e "${RED}❌ English tagline in non-English index: $(basename $file)${NC}"
    ENGLISH_TAGLINES=$((ENGLISH_TAGLINES + 1))
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ENGLISH_TAGLINES -eq 0 ]; then
  echo -e "${GREEN}✅ All non-English articles have localized taglines${NC}"
else
  echo -e "${RED}❌ $ENGLISH_TAGLINES non-English articles have English taglines${NC}"
fi
echo ""

# ============================================================================
# Check 3b: Analysis references section present in all news articles
# (Transparency requirement: every article must link to its analysis files)
# ============================================================================
echo "📋 Check 3b: Analysis references section in news articles"

MISSING_REFS=0
CHECKED_ARTICLES=0
for file in news/*-{en,sv}.html; do
  if [ -f "$file" ]; then
    # Only check actual article files (not index files)
    BASENAME="$(basename "$file")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    CHECKED_ARTICLES=$((CHECKED_ARTICLES + 1))
    if ! grep -q 'class="analysis-references"' "$file" 2>/dev/null; then
      echo -e "${YELLOW}⚠️ Missing analysis-references section: $BASENAME${NC}"
      MISSING_REFS=$((MISSING_REFS + 1))
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

if [ $CHECKED_ARTICLES -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  No article files found to check${NC}"
elif [ $MISSING_REFS -eq 0 ]; then
  echo -e "${GREEN}✅ All $CHECKED_ARTICLES articles have analysis-references section${NC}"
else
  echo -e "${YELLOW}⚠️ $MISSING_REFS of $CHECKED_ARTICLES articles missing analysis-references section${NC}"
  echo -e "${YELLOW}   ↳ See SHARED_PROMPT_PATTERNS.md §ANALYSIS FILE GITHUB REFERENCES for template${NC}"
fi
echo ""

# ============================================================================
# Check 3c: Analysis References — Broken Links
# ============================================================================
echo "📋 Check 3c: Analysis references link integrity"
BROKEN_REFS=0
CHECKED_REFS=0
for file in news/*-{en,sv}.html; do
  if [ -f "$file" ]; then
    BASENAME="$(basename "$file")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    if grep -q 'class="analysis-references"' "$file" 2>/dev/null; then
      CHECKED_REFS=$((CHECKED_REFS + 1))
      # Extract analysis paths from GitHub blob/tree URLs using portable awk
      BROKEN_IN_FILE=0
      while IFS=: read -r link_type link_path; do
        [ -n "$link_type" ] || continue
        [ -n "$link_path" ] || continue
        case "$link_type" in
          blob)
            if [ ! -f "$link_path" ]; then
              BROKEN_IN_FILE=$((BROKEN_IN_FILE + 1))
            fi
            ;;
          tree)
            if [ ! -d "$link_path" ]; then
              BROKEN_IN_FILE=$((BROKEN_IN_FILE + 1))
            fi
            ;;
        esac
      done <<LINKS
$(awk '{
  line = $0
  while (match(line, /href="[^"]+"/)) {
    href = substr(line, RSTART + 6, RLENGTH - 7)
    if (href ~ /^https:\/\/github\.com\/Hack23\/riksdagsmonitor\/(blob|tree)\/main\//) {
      sub(/^https:\/\/github\.com\/Hack23\/riksdagsmonitor\//, "", href)
      split(href, parts, "/")
      link_type = parts[1]
      link_path = href
      sub(/^(blob|tree)\/main\//, "", link_path)
      print link_type ":" link_path
    }
    line = substr(line, RSTART + RLENGTH)
  }
}' "$file")
LINKS
      if [ "$BROKEN_IN_FILE" -gt 0 ]; then
        echo -e "${YELLOW}⚠️ $BROKEN_IN_FILE broken analysis link(s) in: $BASENAME${NC}"
        BROKEN_REFS=$((BROKEN_REFS + 1))
        WARNINGS=$((WARNINGS + 1))
      fi
    fi
  fi
done

if [ $CHECKED_REFS -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  No articles with analysis-references to check${NC}"
elif [ $BROKEN_REFS -eq 0 ]; then
  echo -e "${GREEN}✅ All $CHECKED_REFS articles have valid analysis reference links${NC}"
else
  echo -e "${YELLOW}⚠️ $BROKEN_REFS of $CHECKED_REFS articles have broken analysis links${NC}"
  echo -e "${YELLOW}   ↳ Run: npx tsx scripts/fix-analysis-references.ts --rewrite${NC}"
fi
echo ""

# ============================================================================
# Check 4: BreadcrumbList localization (spot check key languages)
# ============================================================================
echo "📋 Check 4: BreadcrumbList structured data localization"

ENGLISH_BREADCRUMBS=0

# Spot check Chinese articles (should have 主页/新闻, not Home/News)
for file in news/*-zh.html; do
  if [ -f "$file" ] && grep -q '"name": "Home"' "$file"; then
    echo -e "${YELLOW}⚠️ English breadcrumbs in Chinese article: $(basename $file)${NC}"
    ENGLISH_BREADCRUMBS=$((ENGLISH_BREADCRUMBS + 1))
    WARNINGS=$((WARNINGS + 1))
  fi
done

# Spot check Arabic articles (should have localized, not Home/News)
for file in news/*-ar.html; do
  if [ -f "$file" ] && grep -q '"name": "Home"' "$file"; then
    echo -e "${YELLOW}⚠️ English breadcrumbs in Arabic article: $(basename $file)${NC}"
    ENGLISH_BREADCRUMBS=$((ENGLISH_BREADCRUMBS + 1))
    WARNINGS=$((WARNINGS + 1))
  fi
done

if [ $ENGLISH_BREADCRUMBS -eq 0 ]; then
  echo -e "${GREEN}✅ Breadcrumb structured data properly localized${NC}"
else
  echo -e "${YELLOW}⚠️ $ENGLISH_BREADCRUMBS articles have English breadcrumbs (warning only)${NC}"
fi
echo ""

# ============================================================================
# Check 5: All news index files are recent (not stale) — only if present
# NOTE: news/index*.html are in .gitignore, generated at build time. Skip if absent.
# ============================================================================
echo "📋 Check 5: News index files are up-to-date (if present)"

STALE_INDEXES=0
INDEX_COUNT_5=0
# Check if any index file is older than 1 day (86400 seconds)
for idx in news/index*.html; do
  if [ -f "$idx" ]; then
    INDEX_COUNT_5=$((INDEX_COUNT_5 + 1))
    FILE_AGE=$(($(date +%s) - $(stat -c %Y "$idx" 2>/dev/null || stat -f %m "$idx" 2>/dev/null)))
    if [ $FILE_AGE -gt 86400 ]; then
      echo -e "${YELLOW}⚠️ Index file is older than 24 hours: $(basename $idx)${NC}"
      STALE_INDEXES=$((STALE_INDEXES + 1))
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

if [ $INDEX_COUNT_5 -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  No index files present (generated at build time — OK)${NC}"
elif [ $STALE_INDEXES -eq 0 ]; then
  echo -e "${GREEN}✅ All news index files are recent${NC}"
else
  echo -e "${YELLOW}⚠️ $STALE_INDEXES index files are older than 24 hours${NC}"
fi
echo ""

# ============================================================================
# Check 6: News index files have content (not empty) — only if present
# NOTE: news/index*.html are in .gitignore, generated at build time. Skip if absent.
# ============================================================================
echo "📋 Check 6: News index files have content (if present)"

EMPTY_INDEXES=0
INDEX_COUNT_6=0
for idx in news/index*.html; do
  if [ -f "$idx" ]; then
    INDEX_COUNT_6=$((INDEX_COUNT_6 + 1))
    FILE_SIZE=$(stat -c %s "$idx" 2>/dev/null || stat -f %z "$idx" 2>/dev/null)
    if [ $FILE_SIZE -lt 1000 ]; then
      echo -e "${RED}❌ Index file is suspiciously small (< 1KB): $(basename $idx)${NC}"
      EMPTY_INDEXES=$((EMPTY_INDEXES + 1))
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

if [ $INDEX_COUNT_6 -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  No index files present (generated at build time — OK)${NC}"
elif [ $EMPTY_INDEXES -eq 0 ]; then
  echo -e "${GREEN}✅ All news index files have content${NC}"
else
  echo -e "${RED}❌ $EMPTY_INDEXES index files are too small${NC}"
fi
echo ""

# ============================================================================
# Check 7: Sitemap includes news articles
# ============================================================================
echo "📋 Check 7: Sitemap includes news articles"

if [ -f "sitemap.xml" ]; then
  NEWS_URLS=$(grep -c "<loc>https://riksdagsmonitor.com/news/20" sitemap.xml || echo "0")
  if [ $NEWS_URLS -lt 10 ]; then
    echo -e "${YELLOW}⚠️ Sitemap has only $NEWS_URLS news URLs (expected > 10)${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✅ Sitemap includes $NEWS_URLS news articles${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ sitemap.xml not found (OK — generated at build time by prebuild script)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================================================
# Check 8: Articles have visible language switcher navigation
# ============================================================================
echo "📋 Check 8: Articles have visible language switcher"
ARTICLES_WITHOUT_SWITCHER=0

# Check articles year-agnostically (all news/*-{lang}.html files across all 14 languages)
for article in news/*-en.html news/*-sv.html news/*-da.html news/*-no.html news/*-fi.html news/*-de.html news/*-fr.html news/*-es.html news/*-nl.html news/*-ar.html news/*-he.html news/*-ja.html news/*-ko.html news/*-zh.html; do
  # Skip index files
  if [[ "$article" == news/index*.html ]]; then
    continue
  fi
  
  if [ -f "$article" ]; then
    if ! grep -q '<nav class="language-switcher"' "$article"; then
      ARTICLES_WITHOUT_SWITCHER=$((ARTICLES_WITHOUT_SWITCHER + 1))
    fi
  fi
done

if [ $ARTICLES_WITHOUT_SWITCHER -gt 0 ]; then
  echo -e "${YELLOW}⚠️ $ARTICLES_WITHOUT_SWITCHER articles missing language switcher navigation${NC}"
  echo -e "${YELLOW}   Fallback: python3 scripts/fix-article-navigation.py${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  # Check if there are any articles to validate
  ARTICLE_COUNT=$(find news -name '*-*.html' | grep -v 'index' | wc -l)
  if [ $ARTICLE_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ All checked articles have language switcher${NC}"
  else
    echo -e "${YELLOW}⚠️ No articles found to check${NC}"
  fi
fi
echo ""

# ============================================================================
# Check 9: Articles have article-top-nav with back-to-news link
# ============================================================================
echo "📋 Check 9: Articles have top navigation (article-top-nav)"
ARTICLES_WITHOUT_TOPNAV=0

for article in news/*-en.html news/*-sv.html news/*-da.html news/*-no.html news/*-fi.html news/*-de.html news/*-fr.html news/*-es.html news/*-nl.html news/*-ar.html news/*-he.html news/*-ja.html news/*-ko.html news/*-zh.html; do
  if [[ "$article" == news/index*.html ]]; then
    continue
  fi
  
  if [ -f "$article" ]; then
    if ! grep -q 'class="article-top-nav"' "$article"; then
      ARTICLES_WITHOUT_TOPNAV=$((ARTICLES_WITHOUT_TOPNAV + 1))
    fi
  fi
done

if [ $ARTICLES_WITHOUT_TOPNAV -gt 0 ]; then
  echo -e "${YELLOW}⚠️ $ARTICLES_WITHOUT_TOPNAV articles missing article-top-nav${NC}"
  echo -e "${YELLOW}   Fallback: python3 scripts/fix-article-navigation.py${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  ARTICLE_COUNT_TOPNAV=$(find news -name '*-*.html' | grep -v 'index' | wc -l)
  if [ "$ARTICLE_COUNT_TOPNAV" -gt 0 ]; then
    echo -e "${GREEN}✅ All checked articles have article-top-nav${NC}"
  else
    echo -e "${YELLOW}⚠️ No articles found to check${NC}"
  fi
fi
echo ""

# ============================================================================
# Check 10: Articles have back-to-news link in footer
# ============================================================================
echo "📋 Check 10: Articles have back-to-news footer link"
ARTICLES_WITHOUT_BACKNAV=0

for article in news/*-en.html news/*-sv.html news/*-da.html news/*-no.html news/*-fi.html news/*-de.html news/*-fr.html news/*-es.html news/*-nl.html news/*-ar.html news/*-he.html news/*-ja.html news/*-ko.html news/*-zh.html; do
  if [[ "$article" == news/index*.html ]]; then
    continue
  fi
  
  if [ -f "$article" ]; then
    if ! grep -q 'class="back-to-news"' "$article"; then
      ARTICLES_WITHOUT_BACKNAV=$((ARTICLES_WITHOUT_BACKNAV + 1))
    fi
  fi
done

if [ $ARTICLES_WITHOUT_BACKNAV -gt 0 ]; then
  echo -e "${YELLOW}⚠️ $ARTICLES_WITHOUT_BACKNAV articles missing back-to-news link${NC}"
  echo -e "${YELLOW}   Fallback: python3 scripts/fix-article-navigation.py${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  ARTICLE_COUNT_BACKNAV=$(find news -name '*-*.html' | grep -v 'index' | wc -l)
  if [ "$ARTICLE_COUNT_BACKNAV" -gt 0 ]; then
    echo -e "${GREEN}✅ All checked articles have back-to-news link${NC}"
  else
    echo -e "${YELLOW}⚠️ No articles found to check${NC}"
  fi
fi
echo ""

# ============================================================================
# Check 11: HTMLHint validation on news articles
# ============================================================================
echo "📋 Check 11: HTMLHint validation on news articles"

NEWS_HTML_COUNT=$(find news -maxdepth 1 -name '*-*.html' | wc -l)
if [ "$NEWS_HTML_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠️ No news articles found to HTMLHint-validate${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  HTMLHINT_RESULT=0
  HTMLHINT_OUTPUT=$(npx htmlhint "news/*-*.html" 2>&1) || HTMLHINT_RESULT=$?
  if [ $HTMLHINT_RESULT -ne 0 ]; then
    echo "$HTMLHINT_OUTPUT"
    echo -e "${YELLOW}⚠️ HTMLHint found errors in news articles (attempting auto-fix)${NC}"
    npx tsx scripts/article-quality-enhancer.ts --fix || true
    HTMLHINT_RESULT2=0
    HTMLHINT_OUTPUT2=$(npx htmlhint "news/*-*.html" 2>&1) || HTMLHINT_RESULT2=$?
    if [ $HTMLHINT_RESULT2 -ne 0 ]; then
      echo "$HTMLHINT_OUTPUT2"
      echo -e "${YELLOW}⚠️ HTMLHint errors remain after auto-fix — review before merging${NC}"
      WARNINGS=$((WARNINGS + 1))
    else
      echo -e "${GREEN}✅ HTMLHint errors fixed successfully${NC}"
    fi
  else
    echo -e "${GREEN}✅ All $NEWS_HTML_COUNT news articles pass HTMLHint validation${NC}"
  fi
fi
echo ""

# Check 12: Language coverage per article slug (14-language completeness)
# ============================================================================
echo "📋 Check 12: Language coverage per article slug (all 14 languages expected)"

ALL_ARTICLE_LANGS="en sv da no fi de fr es nl ar he ja ko zh"
INCOMPLETE_SLUGS=0
TOTAL_SLUGS=0

# Use English articles as the reference set — English is always generated first
for en_file in news/*-en.html; do
  if [[ "$en_file" == news/index*.html ]]; then
    continue
  fi
  if [ ! -f "$en_file" ]; then
    continue
  fi

  slug=$(basename "$en_file" -en.html)
  TOTAL_SLUGS=$((TOTAL_SLUGS + 1))
  MISSING_LANGS=""
  LANG_COUNT=0

  for lang in $ALL_ARTICLE_LANGS; do
    if [ -f "news/${slug}-${lang}.html" ]; then
      LANG_COUNT=$((LANG_COUNT + 1))
    else
      MISSING_LANGS="$MISSING_LANGS $lang"
    fi
  done

  if [ $LANG_COUNT -lt 14 ]; then
    INCOMPLETE_SLUGS=$((INCOMPLETE_SLUGS + 1))
    echo -e "${YELLOW}⚠️ '$slug' has only $LANG_COUNT/14 languages. Missing:$MISSING_LANGS${NC}"
  fi
done

if [ $TOTAL_SLUGS -eq 0 ]; then
  echo -e "${YELLOW}⚠️ No articles found to check language coverage${NC}"
  WARNINGS=$((WARNINGS + 1))
elif [ $INCOMPLETE_SLUGS -eq 0 ]; then
  echo -e "${GREEN}✅ All $TOTAL_SLUGS article slugs have complete 14-language coverage${NC}"
else
  echo -e "${YELLOW}⚠️ $INCOMPLETE_SLUGS/$TOTAL_SLUGS article slugs have incomplete language coverage${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================================================
# Check 13: Content quality scores from multi-dimensional assessment
# ============================================================================
echo "📋 Check 13: Content quality scores (multi-dimensional assessment)"

QUALITY_SCORES_FILE="news/metadata/quality-scores.json"
MULTIDIM_THRESHOLD=${MULTIDIM_THRESHOLD:-60}  # mirrors MULTIDIM_QUALITY_THRESHOLD in config.ts; override via env
# Validate threshold is a positive integer (>= 1) to avoid injection into downstream commands
if ! [[ "$MULTIDIM_THRESHOLD" =~ ^[1-9][0-9]*$ ]]; then
  echo -e "${RED}❌ MULTIDIM_THRESHOLD must be a positive integer (>= 1), got: '${MULTIDIM_THRESHOLD}'${NC}"
  ERRORS=$((ERRORS + 1))
  MULTIDIM_THRESHOLD=60
fi

if [ ! -f "$QUALITY_SCORES_FILE" ]; then
  echo -e "${YELLOW}⚠️ quality-scores.json not found — no articles generated yet or file not persisted${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  # Parse quality scores using node/jq if available
  if command -v node &>/dev/null; then
    if ! QUALITY_SUMMARY=$(MULTIDIM_THRESHOLD="$MULTIDIM_THRESHOLD" node scripts/validate-quality-scores.cjs "$QUALITY_SCORES_FILE" 2>/dev/null); then
      QUALITY_SUMMARY="ERROR:EXECUTION_FAILED"
    fi

    if [[ "$QUALITY_SUMMARY" == "NO_ARTICLES" ]]; then
      echo -e "${YELLOW}⚠️ quality-scores.json is empty — no articles scored${NC}"
      WARNINGS=$((WARNINGS + 1))
    elif [[ "$QUALITY_SUMMARY" == "NO_MULTIDIM" ]]; then
      echo -e "${YELLOW}⚠️ No multi-dimensional scores found in quality-scores.json${NC}"
      WARNINGS=$((WARNINGS + 1))
    elif [[ "$QUALITY_SUMMARY" == ERROR:* ]]; then
      echo -e "${YELLOW}⚠️ Could not parse quality-scores.json: ${QUALITY_SUMMARY}${NC}"
      WARNINGS=$((WARNINGS + 1))
    else
      if ! [[ "$QUALITY_SUMMARY" =~ ^[0-9]+\|[0-9]+\|[0-9]+\|[0-9]+$ ]]; then
        echo -e "${YELLOW}⚠️ Malformed quality summary from parser: ${QUALITY_SUMMARY}${NC}"
        WARNINGS=$((WARNINGS + 1))
      else
        AVG_SCORE=$(echo "$QUALITY_SUMMARY" | cut -d'|' -f1)
        PASSED_COUNT=$(echo "$QUALITY_SUMMARY" | cut -d'|' -f2)
        TOTAL_COUNT=$(echo "$QUALITY_SUMMARY" | cut -d'|' -f3)
        CRITICAL_COUNT=$(echo "$QUALITY_SUMMARY" | cut -d'|' -f4)

        echo -e "   Average multi-dimensional score: ${AVG_SCORE}/100"
        echo -e "   Articles passing threshold (≥${MULTIDIM_THRESHOLD}): ${PASSED_COUNT}/${TOTAL_COUNT}"

        if [ "$CRITICAL_COUNT" -gt 0 ]; then
          echo -e "${YELLOW}⚠️ $CRITICAL_COUNT article(s) scored below the ${MULTIDIM_THRESHOLD}/100 multi-dimensional threshold${NC}"
          WARNINGS=$((WARNINGS + 1))
        fi

        CRITICAL_THRESHOLD=$((MULTIDIM_THRESHOLD * 2 / 3))  # 2/3 of MULTIDIM_THRESHOLD
        if [ "$AVG_SCORE" -lt "$CRITICAL_THRESHOLD" ]; then
          echo -e "${RED}❌ Average content quality score ${AVG_SCORE}/100 is critically low (< ${CRITICAL_THRESHOLD})${NC}"
          ERRORS=$((ERRORS + 1))
        elif [ "$AVG_SCORE" -lt "$MULTIDIM_THRESHOLD" ]; then
          echo -e "${YELLOW}⚠️ Average content quality score ${AVG_SCORE}/100 is below recommended level (< ${MULTIDIM_THRESHOLD})${NC}"
          WARNINGS=$((WARNINGS + 1))
        else
          echo -e "${GREEN}✅ Content quality average ${AVG_SCORE}/100 meets threshold${NC}"
        fi
      fi
    fi
  else
    echo -e "${YELLOW}⚠️ node not available — skipping quality score analysis${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi
echo ""

# ============================================================================
# Check 14: No surviving AI_MUST_REPLACE markers in article HTML
# ============================================================================
echo "📋 Check 14: No AI_MUST_REPLACE markers surviving in article HTML"

AI_MARKER_COUNT=0
for article in news/*.html; do
  if [ -f "$article" ]; then
    MARKERS=$(grep -c 'AI_MUST_REPLACE' "$article" 2>/dev/null) || true
    if [ "${MARKERS:-0}" -gt 0 ]; then
      AI_MARKER_COUNT=$((AI_MARKER_COUNT + MARKERS))
      echo -e "${RED}❌ $article has $MARKERS AI_MUST_REPLACE marker(s) — committed article HTML must not contain unresolved placeholders${NC}"
    fi
  fi
done

if [ "$AI_MARKER_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ $AI_MARKER_COUNT total AI_MUST_REPLACE marker(s) found in article HTML — validation requires zero unresolved placeholders${NC}"
  ERRORS=$((ERRORS + 1))
else
  ARTICLE_COUNT=$(find news -maxdepth 1 -name '*.html' -type f 2>/dev/null | wc -l) || true
  if [ "${ARTICLE_COUNT:-0}" -gt 0 ]; then
    echo -e "${GREEN}✅ No AI_MUST_REPLACE markers found in $ARTICLE_COUNT article(s)${NC}"
  else
    echo -e "${YELLOW}ℹ️  No article files found to check${NC}"
  fi
fi

# Check 15: No banned generic template text in article HTML
# Uses detectBannedPatterns() from shared.ts as the single canonical pattern list
BANNED_GENERIC_COUNT=0
ARTICLE_FILES=(news/*.html)
if [ -f "${ARTICLE_FILES[0]}" ] && command -v npx &>/dev/null; then
  BANNED_OUTPUT=""
  BANNED_EXIT=0
  BANNED_OUTPUT=$(npx tsx scripts/check-banned-patterns.ts news/*.html) || BANNED_EXIT=$?
  if [ "$BANNED_EXIT" -ge 126 ]; then
    # Exit codes 126+ indicate the command could not be executed (126=not executable, 127=not found, 128+=signals)
    echo -e "${RED}❌ Failed to execute banned pattern detection (exit $BANNED_EXIT). Review the error output above.${NC}"
    ERRORS=$((ERRORS + 1))
  elif [ -n "$BANNED_OUTPUT" ]; then
    while IFS= read -r line; do
      FILE=$(echo "$line" | jq -r '.file' 2>/dev/null) || FILE=""
      if [ -n "$FILE" ]; then
        echo -e "${RED}❌ $FILE contains BANNED generic template text — AI must replace${NC}"
      else
        echo -e "${RED}❌ (unknown file) contains BANNED generic template text — AI must replace${NC}"
      fi
      BANNED_GENERIC_COUNT=$((BANNED_GENERIC_COUNT + 1))
    done <<< "$BANNED_OUTPUT"
  fi
fi

if [ "$BANNED_GENERIC_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ $BANNED_GENERIC_COUNT article(s) contain banned generic Deep Analysis template text${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================================================
# Check 16: No banned generic title patterns in articles
# Detects titles that are bare category labels instead of newsworthy headlines
# ============================================================================
echo "📋 Check 16: No banned generic title patterns"

BANNED_TITLES=0
# These are the exact generic category labels that SHARED_PROMPT_PATTERNS.md bans
BANNED_TITLE_PATTERNS=(
  "Riksdag Committee Reports"
  "Government Propositions"
  "Opposition Motions"
  "Parliamentary Interpellations"
  "Breaking News"
  "Weekly Review"
)

for article in news/*-en.html; do
  if [ -f "$article" ]; then
    BASENAME="$(basename "$article")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    # Extract <title> content using a portable pattern (same-line <title>...</title>)
    TITLE_TEXT=$(sed -n 's|.*<title>\([^<]*\)</title>.*|\1|p' "$article" 2>/dev/null | head -n 1) || true
    if [ -n "$TITLE_TEXT" ]; then
      for pattern in "${BANNED_TITLE_PATTERNS[@]}"; do
        if [ "$TITLE_TEXT" = "$pattern" ]; then
          echo -e "${RED}❌ Generic banned title '$TITLE_TEXT' in $BASENAME — AI agent must replace${NC}"
          BANNED_TITLES=$((BANNED_TITLES + 1))
          ERRORS=$((ERRORS + 1))
          break
        fi
      done
      # §P2-3: regex-based banned-title bucket. Catches the boilerplate
      # headline shapes seen across 2026-04-20 aggregation articles:
      #   - "Latest …"
      #   - "Analysis of What Happened …"
      #   - "Riksdag <Word> <Word>: What Happened, Timeline …"
      if echo "$TITLE_TEXT" | grep -qE '^(Latest |Analysis of What Happened|Riksdag [A-Z][a-z]+ [A-Z][a-z]+: What Happened, Timeline)'; then
        echo -e "${RED}❌ Banned generic title shape '$TITLE_TEXT' in $BASENAME — AI agent must write a newsworthy headline (§P2-3)${NC}"
        BANNED_TITLES=$((BANNED_TITLES + 1))
        ERRORS=$((ERRORS + 1))
      fi
      # §P2-4: meta-description as intelligence summary. Reject the
      # "Analysis of <topic> across N documents" boilerplate.
      META_DESC=$(sed -n 's|.*<meta[^>]*name="description"[^>]*content="\([^"]*\)".*|\1|p' "$article" 2>/dev/null | head -n 1) || true
      if [ -n "$META_DESC" ] && echo "$META_DESC" | grep -qE '^Analysis of .+ across [0-9]+ documents'; then
        echo -e "${RED}❌ Banned generic meta description '$META_DESC' in $BASENAME — AI agent must write a specific intelligence summary (§P2-4)${NC}"
        BANNED_TITLES=$((BANNED_TITLES + 1))
        ERRORS=$((ERRORS + 1))
      fi
    fi
  fi
done

if [ $BANNED_TITLES -eq 0 ]; then
  echo -e "${GREEN}✅ No banned generic title patterns found${NC}"
else
  echo -e "${RED}❌ $BANNED_TITLES article(s) have generic banned titles — AI agent must replace them with newsworthy headlines${NC}"
fi
echo ""

# ============================================================================
# Check 17: No raw Swedish boilerplate in non-Swedish articles
# ============================================================================
echo "📋 Check 17: No raw Swedish boilerplate in non-Swedish articles"

SWEDISH_LEAKS=0
SWEDISH_BOILERPLATE_PATTERNS=(
  "Regeringen överlämnar denna proposition"
  "Propositionens huvudsakliga innehåll"
  "Förslag till riksdagsbeslut"
  "Stockholm den [0-9]{1,2} [[:alpha:]]+ [0-9]{4}"
)

for article in news/*-*.html; do
  if [ -f "$article" ]; then
    BASENAME="$(basename "$article")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    # Skip Swedish articles — boilerplate is expected there
    if [[ "$BASENAME" == *-sv.html ]]; then
      continue
    fi
    LANG_SUFFIX="${BASENAME##*-}"
    LANG_SUFFIX="${LANG_SUFFIX%.html}"
    LANG_SUFFIX_UPPER="$(printf '%s' "$LANG_SUFFIX" | tr '[:lower:]' '[:upper:]')"
    for pattern in "${SWEDISH_BOILERPLATE_PATTERNS[@]}"; do
      COUNT=$(grep -ciE "$pattern" "$article" 2>/dev/null) || true
      if [ "${COUNT:-0}" -gt 0 ]; then
        echo -e "${YELLOW}⚠️ Swedish boilerplate in ${LANG_SUFFIX_UPPER} article $BASENAME: '$pattern' ($COUNT occurrence(s))${NC}"
        SWEDISH_LEAKS=$((SWEDISH_LEAKS + COUNT))
      fi
    done
  fi
done

if [ $SWEDISH_LEAKS -eq 0 ]; then
  echo -e "${GREEN}✅ No raw Swedish boilerplate in non-Swedish articles${NC}"
else
  echo -e "${YELLOW}⚠️ $SWEDISH_LEAKS Swedish boilerplate occurrence(s) found in non-Swedish articles${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================================================
# Check 17b (§P0-3 HARD-FAIL): Large <span lang="sv"> blocks in non-SV articles
# ----------------------------------------------------------------------------
# Any non-SV article containing a `<span lang="sv">` with ≥ 8 Swedish words is
# an automatic hard-fail regardless of dictionary-score thresholds. This closes
# the loophole where untranslated titles/summaries hid inside lang="sv"
# wrappers and were excluded from the leakage score. See
# analysis/agentic-workflow-quality-plan §P0-3 for rationale.
# ============================================================================
echo "📋 Check 17b: No large <span lang=\"sv\"> blocks in non-Swedish articles (§P0-3 hard-fail)"

LARGE_SV_SPAN_HARD_FAILS=0
if command -v npx >/dev/null 2>&1 && [ -f scripts/detect-swedish-leakage.ts ]; then
  # The detector's CLI now exits non-zero on large-span hard-fails. Run it
  # against the news/ directory and surface the output as errors.
  if ! SV_SPAN_OUTPUT=$(npx tsx scripts/detect-swedish-leakage.ts --dir news/ --threshold 1000000 2>&1); then
    # Extract just the HARD FAIL lines so we don't drown CI with score warnings.
    HARD_FAIL_LINES=$(printf '%s\n' "$SV_SPAN_OUTPUT" | grep -E 'HARD FAIL|^   Line [0-9]+: [0-9]+ words' || true)
    if [ -n "$HARD_FAIL_LINES" ]; then
      printf '%s\n' "$HARD_FAIL_LINES" | while IFS= read -r line; do
        echo -e "${RED}${line}${NC}"
      done
      LARGE_SV_SPAN_HARD_FAILS=$(printf '%s\n' "$HARD_FAIL_LINES" | grep -c 'HARD FAIL' || true)
      ERRORS=$((ERRORS + LARGE_SV_SPAN_HARD_FAILS))
    fi
  fi
fi

if [ "${LARGE_SV_SPAN_HARD_FAILS:-0}" -eq 0 ]; then
  echo -e "${GREEN}✅ No large <span lang=\"sv\"> blocks in non-Swedish articles${NC}"
else
  echo -e "${RED}❌ ${LARGE_SV_SPAN_HARD_FAILS} file(s) contain large untranslated <span lang=\"sv\"> blocks (§P0-3 hard-fail)${NC}"
fi
echo ""

# ============================================================================
# Check 17c (§P1-5): methodology-reflection.md contract validation
# ----------------------------------------------------------------------------
# Every `analysis/daily/*/**/methodology-reflection.md` must satisfy the
# Tier-C §methodology-reflection contract documented in SHARED_PROMPT_PATTERNS.md
# Row 14 — required sections, byte-floor, confidence labels, sibling cross-
# reference (Tier-C only), and Upstream Watchpoint Reconciliation table
# (Tier-C only). Validator: scripts/validate-methodology-reflection.ts
# ============================================================================
echo "📋 Check 17c: methodology-reflection.md contract (§P1-5)"

METHOD_REFL_FAILS=0
if command -v npx >/dev/null 2>&1 && [ -f scripts/validate-methodology-reflection.ts ]; then
  # Collect every methodology-reflection.md under analysis/daily/ (nullglob-safe).
  METHOD_FILES=()
  while IFS= read -r -d '' f; do
    METHOD_FILES+=("$f")
  done < <(find analysis/daily -maxdepth 4 -name "methodology-reflection.md" -type f -print0 2>/dev/null)

  if [ "${#METHOD_FILES[@]}" -gt 0 ]; then
    if ! METHOD_OUTPUT=$(npx tsx scripts/validate-methodology-reflection.ts "${METHOD_FILES[@]}" 2>&1); then
      # Surface only the failure lines to keep CI log signal-to-noise high.
      printf '%s\n' "$METHOD_OUTPUT" | grep -E '^❌|^   🔴' || true
      METHOD_REFL_FAILS=$(printf '%s\n' "$METHOD_OUTPUT" | grep -c '^❌' || true)
      ERRORS=$((ERRORS + METHOD_REFL_FAILS))
    fi
  fi
fi

if [ "${METHOD_REFL_FAILS:-0}" -eq 0 ]; then
  echo -e "${GREEN}✅ methodology-reflection.md contract satisfied${NC}"
else
  echo -e "${RED}❌ ${METHOD_REFL_FAILS} methodology-reflection.md file(s) failed §P1-5 contract${NC}"
fi
echo ""

# ============================================================================
# Check 17d (§P2-1): MCP Reliability Table in Tier-C data-download-manifest.md
# ----------------------------------------------------------------------------
# Every Tier-C data-download-manifest.md must include the canonical MCP
# Reliability Table (server · tool · calls · successes · retries · failures ·
# notes). Validator: scripts/validate-mcp-reliability.ts
#
# Scope: only Tier-C subfolders (week-ahead, weekly-review, month-ahead,
# monthly-review, evening-analysis, deep-inspection, realtime-*). Doc-type
# leaf folders (propositions, motions, …) are out of scope.
# ============================================================================
echo "📋 Check 17d: MCP Reliability Table in Tier-C manifests (§P2-1)"

MCP_REL_FAILS=0
if command -v npx >/dev/null 2>&1 && [ -f scripts/validate-mcp-reliability.ts ]; then
  MANIFEST_FILES=()
  # NOTE: The Tier-C folder list below MUST stay in sync with `isTierCFolder()`
  # in scripts/validate-methodology-reflection.ts. When adding a new Tier-C
  # workflow, update both locations. A future PR may consolidate these into
  # a single shared constant (tracked in the §P2 roadmap).
  while IFS= read -r -d '' f; do
    parent_dir=$(basename "$(dirname "$f")")
    case "$parent_dir" in
      week-ahead|weekly-review|month-ahead|monthly-review|evening-analysis|deep-inspection|realtime-*)
        MANIFEST_FILES+=("$f")
        ;;
    esac
  done < <(find analysis/daily -maxdepth 4 -name "data-download-manifest.md" -type f -print0 2>/dev/null)

  if [ "${#MANIFEST_FILES[@]}" -gt 0 ]; then
    if ! MCP_OUTPUT=$(npx tsx scripts/validate-mcp-reliability.ts "${MANIFEST_FILES[@]}" 2>&1); then
      printf '%s\n' "$MCP_OUTPUT" | grep -E '^❌|^   🔴' || true
      MCP_REL_FAILS=$(printf '%s\n' "$MCP_OUTPUT" | grep -c '^❌' || true)
      # §P2-1 is a new contract — surface as a WARNING during the rollout
      # window until existing exemplars are back-filled in a follow-up PR.
      # Switch to `ERRORS=$((ERRORS + MCP_REL_FAILS))` once back-fill lands.
      WARNINGS=$((WARNINGS + MCP_REL_FAILS))
    fi
  fi
fi

if [ "${MCP_REL_FAILS:-0}" -eq 0 ]; then
  echo -e "${GREEN}✅ MCP Reliability Table present in every Tier-C manifest${NC}"
else
  echo -e "${YELLOW}⚠️ ${MCP_REL_FAILS} Tier-C manifest(s) missing/invalid MCP Reliability Table (§P2-1 rollout warning)${NC}"
fi
echo ""

# ============================================================================
# Check 18: Duplicate significance text detection
# Extracts "Why It Matters" / "What This Means" paragraphs (the <p> immediately
# following those headings) and flags articles where >50% are identical —
# a sign of committee-level fallback text being reused.
# ============================================================================
echo "📋 Check 18: Duplicate significance text detection"

DUPLICATE_SIG_ARTICLES=0
for article in news/*-en.html; do
  if [ -f "$article" ]; then
    BASENAME="$(basename "$article")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    # Capture the full <p>...</p> block, then strip inline HTML and normalize whitespace
    # before computing uniqueness so duplicate detection is resilient to markup.
    SIG_PARAGRAPHS=$(perl -0777 -ne 'while (/(?:Why It Matters|What This Means)[^<]*<\/h[23]>\s*<p\b[^>]*>(.*?)<\/p>/gis) { $t = $1; $t =~ s/<[^>]+>/ /g; $t =~ s/&nbsp;/ /gi; $t =~ s/\s+/ /g; $t =~ s/^\s+|\s+$//g; print "$t\n" if length($t) >= 30 }' "$article" 2>/dev/null) || true
    TOTAL_SIG=$(printf '%s\n' "$SIG_PARAGRAPHS" | grep -c .) || true
    UNIQUE_SIG=$(printf '%s\n' "$SIG_PARAGRAPHS" | grep . | sort -u | wc -l) || true
    if [ "${TOTAL_SIG:-0}" -eq 0 ]; then
      # Fallback: extract the paragraph directly following significance-marked elements
      # and normalize it the same way to avoid truncation from inline markup.
      SIG_PARAGRAPHS=$(perl -0777 -ne 'while (/<[^>]*significance[^>]*>.*?<\/[^>]+>\s*<p\b[^>]*>(.*?)<\/p>/gis) { $t = $1; $t =~ s/<[^>]+>/ /g; $t =~ s/&nbsp;/ /gi; $t =~ s/\s+/ /g; $t =~ s/^\s+|\s+$//g; print "$t\n" if length($t) >= 30 }' "$article" 2>/dev/null) || true
      TOTAL_SIG=$(printf '%s\n' "$SIG_PARAGRAPHS" | grep -c .) || true
      UNIQUE_SIG=$(printf '%s\n' "$SIG_PARAGRAPHS" | grep . | sort -u | wc -l) || true
    fi
    if [ "${TOTAL_SIG:-0}" -lt 2 ]; then
      continue
    fi
    # Compute duplicate ratio: if unique < 50% of total, flag it
    if [ "${UNIQUE_SIG:-0}" -gt 0 ] && [ "$TOTAL_SIG" -gt 0 ]; then
      RATIO=$((UNIQUE_SIG * 100 / TOTAL_SIG))
      if [ "$RATIO" -lt 50 ]; then
        echo -e "${YELLOW}⚠️ $BASENAME: only $UNIQUE_SIG unique significance entries out of $TOTAL_SIG total (${RATIO}%) — check for repeated fallback text${NC}"
        DUPLICATE_SIG_ARTICLES=$((DUPLICATE_SIG_ARTICLES + 1))
      fi
    fi
  fi
done

if [ $DUPLICATE_SIG_ARTICLES -eq 0 ]; then
  echo -e "${GREEN}✅ No excessive duplicate significance text detected${NC}"
else
  echo -e "${YELLOW}⚠️ $DUPLICATE_SIG_ARTICLES article(s) have duplicate significance text — each document should have unique analysis${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================================================
# Check 19: Quality metadata presence in articles
# Verifies articles contain quality-score meta tags required by quality-criteria v2
# ============================================================================
echo "📋 Check 19: Quality metadata tags in articles"

MISSING_QUALITY_META=0
CHECKED_QUALITY=0
for article in news/*-*.html; do
  if [ -f "$article" ]; then
    BASENAME="$(basename "$article")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    CHECKED_QUALITY=$((CHECKED_QUALITY + 1))
    if ! grep -Eq 'name="(article-quality-score|article:quality-score|quality-score)"' "$article" 2>/dev/null; then
      MISSING_QUALITY_META=$((MISSING_QUALITY_META + 1))
    fi
  fi
done

if [ $CHECKED_QUALITY -eq 0 ]; then
  echo -e "${YELLOW}ℹ️  No articles found to check quality metadata${NC}"
elif [ $MISSING_QUALITY_META -eq 0 ]; then
  echo -e "${GREEN}✅ All $CHECKED_QUALITY articles have quality metadata tags${NC}"
else
  echo -e "${YELLOW}⚠️ $MISSING_QUALITY_META of $CHECKED_QUALITY articles missing quality metadata tags${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================================================
# Check 20: Empty paragraph tags in articles
# ============================================================================
echo "📋 Check 20: No empty paragraph tags"

EMPTY_P_ARTICLES=0
for article in news/*-*.html; do
  if [ -f "$article" ]; then
    BASENAME="$(basename "$article")"
    if [[ "$BASENAME" == index* ]]; then
      continue
    fi
    EMPTY_P=$(grep -cE '<p(>|[[:space:]][^>]*>)[[:space:]]*</p>' "$article" 2>/dev/null) || true
    if [ "${EMPTY_P:-0}" -gt 0 ]; then
      echo -e "${YELLOW}⚠️ $BASENAME has $EMPTY_P empty <p> tag(s)${NC}"
      EMPTY_P_ARTICLES=$((EMPTY_P_ARTICLES + 1))
    fi
  fi
done

if [ $EMPTY_P_ARTICLES -eq 0 ]; then
  echo -e "${GREEN}✅ No empty paragraph tags found${NC}"
else
  echo -e "${YELLOW}⚠️ $EMPTY_P_ARTICLES article(s) have empty paragraph tags${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================================================
# Check 21: Economic context quality gate (live World Bank / SCB data,
#   Chart.js canvases, AI commentary). See
#   scripts/validate-economic-context.ts and
#   .github/aw/ECONOMIC_DATA_CONTRACT.md.
# ============================================================================
echo "📋 Check 21: Economic context (World Bank / SCB data + Chart.js + AI commentary)"

# Opt-out escape hatch for local/pre-agentic runs. The validator is a
# hard-fail gate: any violation reported by
# `scripts/validate-economic-context.ts` (missing artefact, placeholder
# leakage, too-few charts, short commentary, blank-canvas gap, etc.)
# is promoted to an ERROR and fails the build. There is no WARN mode.
# Set SKIP_ECON_GATE=1 to skip entirely (e.g. local dev on a branch
# that has not yet produced `analysis/daily/*/*/economic-data.json`).
if [ "${SKIP_ECON_GATE:-0}" = "1" ]; then
  echo -e "${YELLOW}⚠️ Economic context gate skipped (SKIP_ECON_GATE=1)${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  ECON_LOG="/tmp/validate-economic-context.log"
  if npx --no-install tsx scripts/validate-economic-context.ts > "$ECON_LOG" 2>&1; then
    ECON_EXIT=0
  else
    ECON_EXIT=$?
  fi
  cat "$ECON_LOG"
  if [ "$ECON_EXIT" -eq 0 ]; then
    echo -e "${GREEN}✅ Economic context contract satisfied${NC}"
  else
    echo -e "${RED}❌ Economic context contract violated — see details above${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi
echo ""

# ============================================================================
# Check 22: No economic-dashboard-placeholder leakage in recent (≤7d) EN articles
#   — complements the per-article validator (Check 21) by catching
#   regressions from older pipelines that still ship the bullet list.
# ============================================================================
echo "📋 Check 22: No economic-dashboard-placeholder in recent English articles"

# Collect candidate files: news/*-en.html newer than 7 days OR dated within
# the last 7 ISO dates, to avoid relying solely on mtimes (which git resets).
PLACEHOLDER_LEAKS=0
CUTOFF_EPOCH=$(( $(date +%s) - 7*86400 ))

for f in news/*-en.html; do
  [ -f "$f" ] || continue
  case "$f" in news/index*.html) continue ;; esac

  # Extract YYYY-MM-DD prefix from the filename; fall back to mtime.
  base=$(basename "$f")
  dprefix="${base:0:10}"
  if [[ "$dprefix" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    file_epoch=$(date -d "$dprefix" +%s 2>/dev/null || echo 0)
  else
    file_epoch=$(stat -c %Y "$f" 2>/dev/null || echo 0)
  fi

  if [ "$file_epoch" -lt "$CUTOFF_EPOCH" ]; then
    continue
  fi

  if grep -q 'class="economic-dashboard-placeholder"' "$f"; then
    echo -e "${RED}❌ $f contains economic-dashboard-placeholder (≤7d old) — violates Economic Data Contract${NC}"
    PLACEHOLDER_LEAKS=$((PLACEHOLDER_LEAKS + 1))
  fi
done

if [ "$PLACEHOLDER_LEAKS" -eq 0 ]; then
  echo -e "${GREEN}✅ No economic-dashboard-placeholder leaks in recent English articles${NC}"
else
  echo -e "${RED}❌ $PLACEHOLDER_LEAKS article(s) within the last 7 days carry the placeholder${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "================================================================"
echo "Validation Summary"
echo "================================================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All validation checks passed!${NC}"
  echo ""
  echo "✨ Safe to create PR"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️ $WARNINGS warning(s) found${NC}"
  echo ""
  echo "⚠️ Warnings only - PR can be created but review recommended"
  exit 0
else
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ $WARNINGS warning(s) found${NC}"
  fi
  echo -e "${RED}❌ $ERRORS error(s) found${NC}"
  echo ""
  echo "❌ DO NOT create PR - fix errors first"
  echo ""
  echo "Recommended actions:"
  echo "  1. Check translation post-processing completed for all non-Swedish articles"
  echo "  2. Verify article HTML structure (semantic tags, language switcher, taglines)"
  echo "  3. Verify article generation succeeded"
  echo "  4. Rerun this validation script"
  echo "  Note: news/index*.html are auto-generated at build time — do NOT generate manually"
  echo "  Fallback only: python3 scripts/fix-article-navigation.py (if navigation elements missing)"
  exit 1
fi
