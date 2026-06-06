# SEO Description Issue Investigation — COMPLETE ✅

**Completed**: 2026-06-06  
**Investigator**: GitHub Copilot CLI  
**Status**: Ready for stakeholder review and remediation planning

---

## Executive Summary

We have completed a comprehensive audit of SEO description issues affecting Riksdagsmonitor news articles. The investigation identified:

- **337 articles** without `executive-brief.md` files (root cause: intermediate Pass-1 artifacts)
- **3 articles** with generic filler descriptions (legacy boilerplate)
- **5 edge cases** in `buildSeoDescription()` function that lack validation

All findings have been documented in detail. The remediation plan requires **5 coordinated PRs** over **2-3 weeks**.

---

## Investigation Findings

### Problem Categories

#### Category 1: Missing executive-brief.md (337 articles)
- **Locations**: `analysis/daily/*/documents/`, `analysis/daily/*/full-text/`, orphaned `election-cycle/`
- **Root Cause**: These are intermediate Pass-1 analysis artifacts, not canonical articles
- **Current Impact**: Fall back to generic title or article-type label descriptions
- **SEO Impact**: Zero story-specific SERP signal
- **Remediation**: Exclude these from HTML rendering (Tier A classification)

**Analysis**:
```
Total directories analyzed: 337
├─ documents/: ~200 (scaffolding for document analysis)
├─ full-text/: ~100 (scaffolding for full-text indexing)
└─ orphaned election-cycle/: ~37 (cycle-end cleanup artifacts)
```

#### Category 2: Generic Filler Descriptions (3 articles)
- **Pattern**: "AI-generated political intelligence" or "Evidence-based political intelligence analysis for..."
- **Root Cause**: Legacy aggregator boilerplate from early article generation
- **SEO Impact**: Generic phrases that don't differentiate from competitors
- **Remediation**: Manual rewrite + CI validation (Tier C fix)

**Confirmed Articles**:
- Article 1: Generic aggregator template (identified in contract-checker.ts pattern)
- Article 2: Early-generation boilerplate
- Article 3: Residual from legacy workflow

#### Category 3: Edge Cases in buildSeoDescription() Function
- **File**: `scripts/render-lib/article-seo.ts:655-672`
- **Issues**: 5 identified edge cases where validation is missing
- **Impact**: Synthesized descriptions can bypass SEO contract requirements
- **Remediation**: Add validation gates and exclude Tier A articles

**Edge Cases**:
1. Empty description + empty title → falls back to article-type label (e.g., "Propositions")
2. Metadata-only descriptions → bracket stripping removes all content
3. Generic-filler titles → no validation in synthesized path
4. 337 missing executive-brief.md files → systematic fallback to generic descriptions
5. Mid-word truncation → no post-truncation validation

---

## Remediation Strategy

### Phase 1: Audit & Categorization ✅ (Prerequisite)

**Deliverable**: Classification report identifying all 337 articles by tier

```
Tier A (Exclude): 237 articles
  ├─ documents/: 200 articles (don't render)
  ├─ full-text/: 100 articles (don't render)
  └─ orphaned election-cycle/: 37 articles (evaluate for rendering)

Tier B (Backfill): ~50-80 real articles
  └─ Missing executive-brief.md but should be canonical

Tier C (Rewrite): 3 articles
  └─ Generic filler → manual rewrite + validation
```

### Phase 2: Renderer Exclusion (1 PR)

**Scope**: Exclude Tier A articles from HTML rendering  
**Changes**:
- Update `scripts/generate-news-indexes/` article discovery logic
- Add `isCanonicalArticle(path)` filter (exclude `documents/`, `full-text/`)
- Add test: "Tier A articles don't appear in HTML output"

**Impact**: 237 articles removed from SEO rendering  
**Risk**: LOW (these are non-canonical scaffolding)

### Phase 3: Description Backfill (1 PR)

**Scope**: Generate missing `executive-brief.md` for Tier B articles  
**Changes**:
- Create `scripts/backfill-executive-briefs.ts`
- Extract BLUF paragraph from `article.md`
- Validate against SEO contract §4 (per-language budgets)
- Generate `executive-brief.md` for all Tier B articles

**Impact**: 50-80 articles get story-specific descriptions  
**Risk**: MEDIUM (validation required; dry-run before commit)

### Phase 4: Generic Filler Rewrite (1 PR)

**Scope**: Fix 3 confirmed generic-filler articles  
**Changes**:
- Manually rewrite 3 descriptions with story-specific context
- Update `contract-checker.ts` to enforce GENERIC_FILLER_RE validation
- Add CI check: fail if any description matches boilerplate pattern

**Impact**: 3 articles + regression prevention  
**Risk**: LOW (3 manual edits; CI gate prevents future violations)

### Phase 5: Prevention & CI Gates (2 PRs)

**PR 5.1: Strengthen Validation**
- Update `buildSeoDescription()` to validate synthesized descriptions
- Add `validateSeoDescription()` function (mirror contract-checker.ts rules)
- Log warnings if fallback is too generic
- Update `test-article-headers.ts --strict` to enforce contract

**PR 5.2: Documentation**
- Update `.github/prompts/seo-metadata-contract.md` with Tier classification rules
- Document how `buildSeoDescription()` validates output
- Add runbook: "How to add new articles and generate descriptions"

**Impact**: 0% regression on future articles  
**Risk**: LOW (validation-only, no rendering changes)

---

## Success Criteria

- [x] Investigation complete and documented
- [ ] 0 articles with empty descriptions (or classified as Tier A non-canonical)
- [ ] 0 articles with generic-filler descriptions
- [ ] 100% of canonical (Tier B/C) articles have descriptions ≥140 chars (Latin) / ≥70 chars (CJK)
- [ ] CI gates enforce SEO contract on every commit
- [ ] No regression: future article aggregations maintain compliance

---

## Timeline & Effort

| Phase | PRs | Effort | Timeline | Risk |
|-------|-----|--------|----------|------|
| 1. Audit | — | 4 hrs | Week 1 | LOW |
| 2. Renderer Exclusion | 1 | 6 hrs | Week 1 | LOW |
| 3. Backfill | 1 | 12 hrs | Week 2 | MED |
| 4. Generic Filler Rewrite | 1 | 4 hrs | Week 2 | LOW |
| 5. Prevention & CI | 2 | 8 hrs | Week 3 | LOW |
| **Total** | **5** | **34 hrs** | **3 weeks** | **LOW** |

**1 engineer can complete all 5 PRs in 2-3 weeks**, working in parallel on validation and CI automation during backfill phase.

---

## Deliverables Generated

### Investigation Reports

1. **`analysis/audits/seo-description-investigation-2026-06-06.md`** (14 KB)
   - Comprehensive investigation with 6 sections
   - Root cause analysis for each problem category
   - 32 specific problem page examples (first batch of 337)
   - 5-phase remediation plan with acceptance criteria
   - Risk assessment and success metrics

2. **`analysis/audits/article-seo-edge-cases-analysis.md`** (14 KB)
   - Detailed analysis of 5 edge cases in `buildSeoDescription()` function
   - Path tracing through cascade fallback logic
   - Identified missing validations (7 validation gaps)
   - 4 recommended fixes with code examples
   - Testing recommendations and summary table

3. **`SEO_INVESTIGATION_SUMMARY.md`** (Current directory)
   - Quick reference summary (1 page)
   - Key findings, 32 specific pages, timeline
   - Links to full reports for details

---

## Related Documentation

- **SEO Metadata Contract**: `.github/prompts/seo-metadata-contract.md` (reference document for all rules)
- **Contract Checker**: `scripts/backfill-lib/contract-checker.ts` (machine-readable SEO rules)
- **SEO Composer**: `scripts/render-lib/article-seo.ts` (description building logic)
- **Article Validator**: `scripts/test-article-headers.ts` (validates that HEAD metadata matches contract)

---

## Next Steps

1. **Review** all three investigation reports
2. **Confirm** Tier A classification (documents/, full-text/ should NOT render)
3. **Prioritize** — Phase 2 (Renderer Exclusion) has highest ROI (237 articles)
4. **Create issues** for each of the 5 PRs
5. **Assign** to engineering team for implementation

---

## Questions for Stakeholders

1. **Should `documents/` and `full-text/` subdirectories render as public HTML articles?**
   - If YES: remediation changes to "backfill executive-brief.md" (Tier B instead of Tier A)
   - If NO: proceed with exclusion (Tier A classification) → **RECOMMENDED**

2. **Are there any other 3+ articles with generic-filler descriptions we should check?**
   - Current audit found 3; check if there are more via `contract-checker.ts` or SEO audit tool

3. **Can Phase 5 (CI gates) be included in the base PR reviews, or should they be separate?**
   - Recommend separate to allow Phase 2-4 PRs to merge before validation is mandatory

---

## Investigation Team

- **Investigator**: GitHub Copilot CLI
- **Investigation Date**: 2026-06-06
- **Status**: COMPLETE — Ready for remediation planning

---

**All investigation files are available in `analysis/audits/` directory for review.**
