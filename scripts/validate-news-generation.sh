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
MULTIDIM_THRESHOLD=60  # mirrors MULTIDIM_QUALITY_THRESHOLD in config.ts — keep in sync

if [ ! -f "$QUALITY_SCORES_FILE" ]; then
  echo -e "${YELLOW}⚠️ quality-scores.json not found — no articles generated yet or file not persisted${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  # Parse quality scores using node/jq if available
  if command -v node &>/dev/null; then
    QUALITY_SUMMARY=$(node -e "
      const fs = require('fs');
      try {
        const scores = JSON.parse(fs.readFileSync('$QUALITY_SCORES_FILE', 'utf-8'));
        const entries = Object.values(scores);
        if (entries.length === 0) { console.log('NO_ARTICLES'); process.exit(0); }
        const overallScores = entries
          .filter(e => e.multidimensional && typeof e.multidimensional.overallScore === 'number')
          .map(e => e.multidimensional.overallScore);
        if (overallScores.length === 0) { console.log('NO_MULTIDIM'); process.exit(0); }
        const avg = Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length);
        const passed = overallScores.filter(s => s >= ${MULTIDIM_THRESHOLD}).length;
        const critical = entries.filter(e => e.multidimensional && !e.multidimensional.passesThreshold).length;
        console.log(avg + '|' + passed + '|' + overallScores.length + '|' + critical);
      } catch(e) { console.log('ERROR:' + e.message); }
    " 2>/dev/null)

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
  else
    echo -e "${YELLOW}⚠️ node not available — skipping quality score analysis${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
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
