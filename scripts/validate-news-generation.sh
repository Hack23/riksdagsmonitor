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
# Check 1: Semantic HTML structure in all 14 news index files
# ============================================================================
echo "📋 Check 1: Semantic HTML structure in news/index*.html"

REQUIRED_ELEMENTS=(
  '<nav class="language-switcher"'
  '<main role="main"'
  '<footer class="footer-section"'
)

for idx in news/index.html news/index_{sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html; do
  if [ -f "$idx" ]; then
    for element in "${REQUIRED_ELEMENTS[@]}"; do
      if ! grep -q "$element" "$idx"; then
        echo -e "${RED}❌ Missing $element in $idx${NC}"
        ERRORS=$((ERRORS + 1))
      fi
    done
  else
    echo -e "${RED}❌ File not found: $idx${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All 14 news index files have required semantic HTML structure${NC}"
else
  echo -e "${RED}❌ $ERRORS structural errors in news index files${NC}"
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
# Check 5: All news index files are recent (not stale)
# ============================================================================
echo "📋 Check 5: News index files are up-to-date"

STALE_INDEXES=0
# Check if any index file is older than 1 day (86400 seconds)
for idx in news/index*.html; do
  if [ -f "$idx" ]; then
    FILE_AGE=$(($(date +%s) - $(stat -c %Y "$idx" 2>/dev/null || stat -f %m "$idx" 2>/dev/null)))
    if [ $FILE_AGE -gt 86400 ]; then
      echo -e "${YELLOW}⚠️ Index file is older than 24 hours: $(basename $idx)${NC}"
      STALE_INDEXES=$((STALE_INDEXES + 1))
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

if [ $STALE_INDEXES -eq 0 ]; then
  echo -e "${GREEN}✅ All news index files are recent${NC}"
else
  echo -e "${YELLOW}⚠️ $STALE_INDEXES index files are older than 24 hours${NC}"
fi
echo ""

# ============================================================================
# Check 6: News index files have content (not empty)
# ============================================================================
echo "📋 Check 6: News index files have content"

EMPTY_INDEXES=0
for idx in news/index*.html; do
  if [ -f "$idx" ]; then
    FILE_SIZE=$(stat -c %s "$idx" 2>/dev/null || stat -f %z "$idx" 2>/dev/null)
    if [ $FILE_SIZE -lt 1000 ]; then
      echo -e "${RED}❌ Index file is suspiciously small (< 1KB): $(basename $idx)${NC}"
      EMPTY_INDEXES=$((EMPTY_INDEXES + 1))
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

if [ $EMPTY_INDEXES -eq 0 ]; then
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
  echo -e "${RED}❌ sitemap.xml not found${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================================================
# Check 8: Articles have visible language switcher navigation
# ============================================================================
echo "📋 Check 8: Articles have visible language switcher"
ARTICLES_WITHOUT_SWITCHER=0

# Check articles year-agnostically (all news/*-{en,sv}.html files)
for article in news/*-en.html news/*-sv.html; do
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
  echo -e "${YELLOW}   (UX enhancement - not blocking)${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  # Check if there are any articles to validate
  ARTICLE_COUNT=$(find news -name '*-en.html' -o -name '*-sv.html' | grep -v 'index' | wc -l)
  if [ $ARTICLE_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ All checked articles have language switcher${NC}"
  else
    echo -e "${YELLOW}⚠️ No articles found to check${NC}"
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
  echo "  1. Rerun: node scripts/generate-news-indexes.js"
  echo "  2. Check translation post-processing completed"
  echo "  3. Verify article generation succeeded"
  echo "  4. Rerun this validation script"
  exit 1
fi
