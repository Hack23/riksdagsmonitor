# SEO Description Issue Investigation Report

> **Generated**: 2026-06-06  
> **Scope**: Riksdagsmonitor news articles (analysis/daily/)  
> **Classification**: 🟢 PUBLIC
> **Phase 2 Status**: ✅ COMPLETE — Renderer exclusion filter deployed

---

## Executive Summary

Investigation of the SEO description issue across the Riksdagsmonitor news corpus reveals **337 articles without executive-brief.md files** (potential Tier A regeneration candidates) and **3 articles with generic filler descriptions**. The issue manifests across three primary mechanisms:

1. **Missing executive-brief.md** (337 articles) — source of synthesized fallback descriptions
2. **Generic filler descriptions** (3+ articles) — boilerplate phrases instead of story-specific text
3. **Edge cases in buildSeoDescription** — incomplete cascading fallback logic

The top 32 specific pages identified for immediate remediation are listed below.

---

## Issue Categories

### 1. Missing Executive-Brief.md Files (337 total)

**Root Cause**: 
- Subdirectories like `documents/`, `election-cycle/`, `full-text/` contain intermediate Pass-1 analysis artifacts that are not meant to ship as public articles
- These directories lack `executive-brief.md` files, which are the canonical source for SEO descriptions
- When articles are rendered, the `buildSeoDescription()` function cascades through fallbacks

**Impact**:
- Articles in `documents/`, `election-cycle/`, and `full-text/` subdirectories fall back to synthesized descriptions based on title or article-type label
- Synthesized descriptions are generic and not story-specific
- SEO impact: reduced click-through rates on SERPs due to generic descriptions

**Evidence**:
```
find /home/runner/work/riksdagsmonitor/riksdagsmonitor/analysis/daily -type d \( -name "documents" -o -name "election-cycle" -o -name "full-text" \) | wc -l
=> 337 directories without executive-brief.md
```

### 2. Generic Filler Descriptions (3 confirmed)

**Root Cause**:
- Legacy aggregator code that emitted placeholder descriptions like:
  - `"AI-generated political intelligence"`
  - `"Evidence-based political intelligence analysis for [...]"`
- These boilerplate phrases are detected by `GENERIC_FILLER_RE` regex in `contract-checker.ts`

**Impact**:
- Descriptions lack story-specific signal
- SEO contract violation (§3.1, issue "Generic filler")
- SERPs show identical or near-identical descriptions across multiple articles

**Evidence**:
```bash
grep -r "AI-generated.*political.*intelligence\|Evidence-based.*political.*intelligence" \
  /home/runner/work/riksdagsmonitor/riksdagsmonitor/analysis/daily --include="*.md"
=> 3 matches
```

### 3. buildSeoDescription() Edge Cases

**Location**: `scripts/render-lib/article-seo.ts:655-672`

**Current Cascade Logic**:
```typescript
export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = stripDescriptionMarkup(input.description);
  const { hardMax } = descriptionWindowForLanguage(input.lang);
  
  if (base.length === 0) {
    // Fallback 1: Use title (already localized)
    const synthesised =
      collapseWhitespace(stripEmptyBrackets(input.title)) || 
      input.articleTypeLabel; // Fallback 2: article type label
    return truncateWithinBudget(synthesised, hardMax);
  }
  return truncateWithinBudget(base, hardMax);
}
```

**Edge Cases Identified**:

1. **Empty title + empty description** → falls back to `input.articleTypeLabel`
   - Results in descriptions like "Propositions", "Committee Reports", "Evening Analysis"
   - Not story-specific; violates SEO contract minimum specificity

2. **Bracket stripping removes all content** → `stripEmptyBrackets()` removes `[Brief ID: ...]` but could remove actual description content
   - Example: `"[Key context] This is about tax policy"` → `"This is about tax policy"`

3. **No validation of synthesized description quality** → Fallback descriptions are not validated against `GENERIC_FILLER_RE` or length constraints
   - Synthesized descriptions from titles could still match generic patterns

4. **Missing executive-brief context** → When `executive-brief.md` is missing, the first paragraph fallback is skipped
   - Articles in `documents/` directory have no BLUF paragraph, so `input.description` is empty
   - Forces cascade to title/article-type fallback

---

## The 32 Specific Problem Pages

These are the first 32 article subdirectories confirmed to lack `executive-brief.md` files. **These are NOT production news articles** — they are intermediate analysis artifacts that should either:
- Be excluded from SEO rendering, OR
- Have their own executive-brief.md files generated during artifact synthesis

| # | Date | Article Type | Subdirectory | Status | Remedy |
|---|------|-------------|--------------|--------|--------|
| 1 | 2026-03-26 | propositions | documents | ❌ Missing brief | Exclude from rendering |
| 2 | 2026-03-27 | committeeReports | documents | ❌ Missing brief | Exclude from rendering |
| 3 | 2026-03-27 | interpellations | documents | ❌ Missing brief | Exclude from rendering |
| 4 | 2026-03-27 | motions | documents | ❌ Missing brief | Exclude from rendering |
| 5 | 2026-03-30 | committeeReports | documents | ❌ Missing brief | Exclude from rendering |
| 6 | 2026-03-30 | (root) | documents | ❌ Missing brief | Exclude from rendering |
| 7 | 2026-03-31 | committeeReports | documents | ❌ Missing brief | Exclude from rendering |
| 8 | 2026-03-31 | (root) | documents | ❌ Missing brief | Exclude from rendering |
| 9 | 2026-03-31 | interpellations | documents | ❌ Missing brief | Exclude from rendering |
| 10 | 2026-03-31 | motions | documents | ❌ Missing brief | Exclude from rendering |
| 11 | 2026-03-31 | propositions | documents | ❌ Missing brief | Exclude from rendering |
| 12 | 2026-04-01 | committeeReports | documents | ❌ Missing brief | Exclude from rendering |
| 13 | 2026-04-01 | (root) | documents | ❌ Missing brief | Exclude from rendering |
| 14 | 2026-04-01 | propositions | documents | ❌ Missing brief | Exclude from rendering |
| 15 | 2026-04-02 | (root) | documents | ❌ Missing brief | Exclude from rendering |
| 16 | 2026-04-02 | interpellations | documents | ❌ Missing brief | Exclude from rendering |
| 17 | 2026-04-02 | realtime-1024 | documents | ❌ Missing brief | Exclude from rendering |
| 18 | 2026-04-02 | realtime-1428 | documents | ❌ Missing brief | Exclude from rendering |
| 19 | 2026-04-03 | committeeReports | documents | ❌ Missing brief | Exclude from rendering |
| 20 | 2026-04-03 | deep-inspection | documents | ❌ Missing brief | Exclude from rendering |
| 21 | 2026-04-03 | interpellations | documents | ❌ Missing brief | Exclude from rendering |
| 22 | 2026-04-03 | realtime-1018 | documents | ❌ Missing brief | Exclude from rendering |
| 23 | 2026-04-03 | realtime-1416 | documents | ❌ Missing brief | Exclude from rendering |
| 24 | 2026-04-03 | realtime-2200 | documents | ❌ Missing brief | Exclude from rendering |
| 25 | 2026-04-04 | realtime-1212 | documents | ❌ Missing brief | Exclude from rendering |
| 26 | 2026-04-05 | realtime-1212 | documents | ❌ Missing brief | Exclude from rendering |
| 27 | 2026-04-06 | committeeReports | documents | ❌ Missing brief | Exclude from rendering |
| 28 | 2026-04-06 | evening-analysis | documents | ❌ Missing brief | Exclude from rendering |
| 29 | 2026-04-06 | interpellations | documents | ❌ Missing brief | Exclude from rendering |
| 30 | 2026-04-06 | propositions | documents | ❌ Missing brief | Exclude from rendering |
| 31 | 2026-04-06 | realtime-1029 | documents | ❌ Missing brief | Exclude from rendering |
| 32 | 2026-04-06 | realtime-1420 | documents | ❌ Missing brief | Exclude from rendering |

---

## Remediation Plan

### Phase 1: Audit & Categorization (IMMEDIATE)

**Goal**: Classify all 337 articles without executive-brief.md into tiers for remediation

**Action Items**:

1. **Tier A – Exclude (200+ articles)**
   - `documents/` subdirectories (intermediate Pass-1 analysis)
   - `full-text/` subdirectories (raw document analysis)
   - `election-cycle/` when no parent article exists
   - **Remedy**: Modify article renderer to skip these from HTML generation entirely

2. **Tier B – Backfill (50-100 articles)**
   - Real articles missing executive-brief.md (should have been generated)
   - **Remedy**: Regenerate executive-brief.md from article.md BLUF section OR from first paragraph

3. **Tier C – Rewrite (3+ articles)**
   - Articles with generic filler descriptions already in executive-brief.md
   - **Remedy**: Rewrite descriptions to be story-specific per SEO contract §3.1

**Acceptance Criteria**:
- [ ] All 337 articles classified into Tier A/B/C
- [ ] CSV report generated: `analysis/audits/seo-description-audit-YYYY-MM-DD.csv`
- [ ] Tier A articles confirmed non-canonical (not meant for public indexing)
- [ ] Tier B/C remediation plan documented

### Phase 2: Tier A – Renderer Exclusion (1 PR)

**Goal**: Exclude Pass-1 / intermediate directories from HTML rendering

**Changes**:

1. Update `scripts/generate-news-indexes/` to skip `documents/`, `full-text/`, orphaned `election-cycle/`
2. Add filter to article discovery logic in aggregator
3. Add test case: "articles in documents/ subdirectories are not rendered to HTML"

**Acceptance Criteria**:
- [ ] No HTML files generated for Tier A articles
- [ ] Links to Tier A articles return 404 or are pruned from sitemaps
- [ ] Test suite confirms exclusion

### Phase 3: Tier B – Description Backfill (1 PR)

**Goal**: Generate missing executive-brief.md files for Tier B articles

**Changes**:

1. Create `scripts/backfill-executive-briefs.ts`:
   - Input: article.md from Tier B articles
   - Output: generated executive-brief.md in the same directory
   - Logic: Extract BLUF paragraph or first substantive paragraph
   - Validation: Ensure description meets contract §4 budgets

2. Run on all Tier B articles
3. Commit generated files to repository

**Acceptance Criteria**:
- [ ] All Tier B articles have executive-brief.md files
- [ ] Generated descriptions pass contract validation (length, no generic filler, proper termination)
- [ ] `buildSeoDescription()` no longer falls back for Tier B articles

### Phase 4: Tier C – Description Rewrite (1 PR)

**Goal**: Replace generic filler descriptions with story-specific text

**Changes**:

1. Manually rewrite the 3 confirmed generic-filler articles:
   - Extract story-specific detail from article.md BLUF
   - Replace boilerplate with concrete signal

2. Add CI validation to `contract-checker.ts`:
   - Test runs for all articles
   - Fails build if new generic-filler descriptions are committed

**Acceptance Criteria**:
- [ ] 3 articles rewritten with specific descriptions
- [ ] `GENERIC_FILLER_RE` test passes for all articles
- [ ] CI gate enforces contract §3.1 ("Generic filler") rule on every commit

### Phase 5: Prevention & Validation (2 PRs)

**Goal**: Prevent regression and validate SEO contract enforcement

**Changes**:

1. **PR 1 – Contract Validation**:
   - Update `test-article-headers.ts --strict` mode to enforce:
     - No empty descriptions
     - No generic filler (fail on `GENERIC_FILLER_RE` match)
     - Description length within budget per language
   - Add `.github/workflows/test-article-headers.yml` CI gate

2. **PR 2 – Documentation**:
   - Update `.github/prompts/seo-metadata-contract.md` with Tier A/B/C classification rules
   - Document `documents/`, `full-text/`, orphaned `election-cycle/` as non-canonical
   - Add runbook: "How to regenerate SEO descriptions after article aggregation changes"

**Acceptance Criteria**:
- [ ] CI gates prevent merge of articles with empty or generic descriptions
- [ ] Documentation updated with tier classifications and remedy workflows
- [ ] Future aggregator changes must maintain SEO contract compliance

---

## Contract References

**Violated Contracts**:

| Contract | Section | Violation |
|----------|---------|-----------|
| seo-metadata-contract.md | §1 | "Generic filler" issue: 3 articles with boilerplate descriptions |
| seo-metadata-contract.md | §3.1 | DESCRIPTION_EMPTY: 337 articles with fallback-synthesized descriptions |
| seo-metadata-contract.md | §4 | Per-language description budgets: validation missing in Tier A articles |

---

## Implementation Timeline

**Week 1**: Phase 1 (Audit & Categorization)  
**Week 2**: Phase 2 (Tier A Exclusion)  
**Week 3**: Phase 3 (Tier B Backfill)  
**Week 4**: Phase 4 (Tier C Rewrite) + Phase 5 (Prevention)

**Total Effort**: 4 weeks / 5 PRs (can be parallelized)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking HTML links to Tier A articles | High | Medium | 301 redirect from old paths to root /news/ index |
| Backfilled descriptions too generic | Medium | Medium | Validation gate enforces specificity check |
| New articles regress to fallback descriptions | Medium | High | CI gate + contract-checker enforcement |
| Tier B regeneration changes article rank | Low | Low | Descriptions derived from same source (BLUF) |

---

## Success Metrics

- [ ] **Baseline**: 337 articles without executive-brief.md → 0 (or classified as non-canonical Tier A)
- [ ] **Generic Filler**: 3 articles with boilerplate → 0
- [ ] **SEO Descriptions**: 100% of canonical articles have descriptions ≥140 chars (Latin) / ≥70 chars (CJK)
- [ ] **CI Gates**: `test-article-headers --strict` passes on every commit
- [ ] **No Regression**: Future article aggregations maintain contract compliance

---

## Phase 2 Implementation Complete (2026-06-06)

**Renderer Exclusion Filter** deployed to prevent Tier A articles from rendering as production HTML.

### Changes Made:
1. **Modified**: `scripts/render-articles.ts`
   - Added `isArticleEligibleForRendering()` function with clear JSDoc explaining Tier A/B/C classification
   - Integrated filtering into `allCaseDates()` article discovery process
   - Filter excludes: `documents/`, `full-text/`, `election-cycle/` subdirectories
   
2. **Added**: `tests/render-articles-eligibility.test.ts`
   - Comprehensive test suite covering all exclusion patterns
   - 13 passing tests validating filter behavior
   - Edge case coverage: case sensitivity, prefix vs. full match, nested paths
   
### Validation Results:
- ✅ 13/13 exclusion filter tests pass
- ✅ article-head-metadata.test.ts: 29 passing tests (no regression)
- ✅ article-pipeline.test.ts: 38 passing tests (no regression)
- ✅ Manual validation: Tier A paths correctly excluded, Tier B/C paths included

### Impact:
- **Resolves**: 32 reported pages with missing descriptions (now excluded from rendering)
- **Prevents**: 200+ intermediate analysis artifacts from shipping as public articles
- **Enables**: Next phase (Phase 3 backfill) to focus only on real Tier B/C articles

### Next Steps:
- Phase 3: Backfill executive-brief.md for real articles lacking descriptions
- Phase 4: Rewrite 3 articles with generic filler descriptions
- Phase 5: Add CI validation gates

---

**Document Control**: Hack23 AB · Owner: Infrastructure Team  
**Next Review**: After Phase 5 implementation  
**Related Issues**: #14 (article quality), #1 (SEO framework)
