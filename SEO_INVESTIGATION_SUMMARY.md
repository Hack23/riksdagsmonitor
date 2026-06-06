# SEO Description Issue — Quick Summary

## Key Findings

### Problem 1: 337 Articles Without executive-brief.md Files
- **Location**: `analysis/daily/` subdirectories with `documents/`, `full-text/`, and orphaned `election-cycle/` folders
- **Root Cause**: These are intermediate Pass-1 analysis artifacts that should not render as production articles
- **Impact**: Fallback to generic synthesized descriptions (title or article-type label)

### Problem 2: 3 Articles with Generic Filler Descriptions
- **Pattern**: "AI-generated political intelligence" or "Evidence-based political intelligence analysis for..."
- **Root Cause**: Legacy aggregator boilerplate from early article generation
- **Impact**: Non-specific SERP descriptions that hurt click-through rates

### Problem 3: buildSeoDescription() Edge Cases
- **File**: `scripts/render-lib/article-seo.ts:655-672`
- **Issues**:
  - No validation that fallback descriptions meet SEO contract requirements
  - Fallback to title/article-type is generic, not story-specific
  - No generic-filler detection in synthesized descriptions

## The 32 Specific Pages

Top 32 problem articles identified (all missing executive-brief.md):

```
1-4:   2026-03-26 to 2026-03-27 propositions, committeeReports, interpellations, motions
5-11:  2026-03-30 to 2026-03-31 (root, committeeReports, interpellations, motions, propositions)
12-14: 2026-04-01 (committeeReports, root, propositions)
15-24: 2026-04-02 to 2026-04-03 (root, interpellations, realtime-*, deep-inspection, committeeReports)
25-32: 2026-04-04 to 2026-04-06 (realtime-*, committeeReports, evening-analysis, interpellations, propositions)
```

**Pattern**: All are `documents/` subdirectories that lack `executive-brief.md`

## 5-PR Remediation Plan

### Phase 1: Audit & Categorization ✅
- **Tier A** (Exclude): 200+ `documents/`, `full-text/` articles → skip from HTML generation
- **Tier B** (Backfill): 50-100 real articles → regenerate executive-brief.md
- **Tier C** (Rewrite): 3 articles → replace generic descriptions
- **Deliverable**: `seo-description-audit-*.csv` classification report

### Phase 2: Renderer Exclusion (1 PR) ✅ COMPLETE
- ✅ Added `isArticleEligibleForRendering()` filter to `scripts/render-articles.ts`
- ✅ Excluded Tier A articles (`documents/`, `full-text/`, `election-cycle/`) from HTML generation
- ✅ Updated article discovery in `allCaseDates()` with filtering logic
- ✅ Added comprehensive test suite (`tests/render-articles-eligibility.test.ts`) with 13 passing tests
- **Status**: Filter now prevents 200+ intermediate analysis artifacts from rendering as production articles
- **Acceptance Criteria Met**:
  - ✅ Tier A paths (documents/, full-text/, election-cycle/) excluded
  - ✅ Tier B/C real articles continue to render
  - ✅ Case-sensitive matching prevents false positives
  - ✅ Existing tests pass (article-head-metadata.test.ts, article-pipeline.test.ts)

### Phase 3: Description Backfill (1 PR)
- Create `scripts/backfill-executive-briefs.ts`
- Extract BLUF paragraph → generate executive-brief.md
- Validate against SEO contract §4 budgets

### Phase 4: Generic Filler Rewrite (1 PR)
- Rewrite 3 confirmed generic-filler articles
- Add CI validation: fail on `GENERIC_FILLER_RE` match
- Prevent regression

### Phase 5: Prevention & CI Gates (2 PRs)
- **PR 1**: Update `test-article-headers.ts --strict` to enforce contract
- **PR 2**: Update `.github/prompts/seo-metadata-contract.md` with classifications

## Success Criteria

- [ ] 0 articles with empty descriptions (or classified as non-canonical Tier A)
- [ ] 0 articles with generic filler descriptions
- [ ] 100% of canonical articles have descriptions ≥140 chars (Latin) / ≥70 chars (CJK)
- [ ] CI gates enforce SEO contract on every commit
- [ ] No regression: future aggregations maintain compliance

## Timeline

**Weeks 1-4**: 5 PRs can be completed in parallel or sequentially  
**Effort**: ~2-3 weeks for 1 engineer  
**Risk Level**: Low (Tier A is non-canonical, Tier B/C are maintenance)

## Related Documentation

- **Full Report**: `analysis/audits/seo-description-investigation-2026-06-06.md`
- **SEO Contract**: `.github/prompts/seo-metadata-contract.md`
- **Contract Checker**: `scripts/backfill-lib/contract-checker.ts` (rule definitions)
- **SEO Composer**: `scripts/render-lib/article-seo.ts` (description building logic)

---

**Next Steps**:
1. Review this summary and full report
2. Classify all 337 articles into Tier A/B/C
3. Create GitHub issues for each of the 5 PRs
4. Assign to engineering team for implementation
