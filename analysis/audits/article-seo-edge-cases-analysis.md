# article-seo.ts buildSeoDescription() — Edge Case Analysis

## Function Signature

**Location**: `scripts/render-lib/article-seo.ts:655-672`

```typescript
export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = stripDescriptionMarkup(input.description);
  const { hardMax } = descriptionWindowForLanguage(input.lang);
  if (base.length === 0) {
    const synthesised =
      collapseWhitespace(stripEmptyBrackets(input.title)) || input.articleTypeLabel;
    return truncateWithinBudget(synthesised, hardMax);
  }
  return truncateWithinBudget(base, hardMax);
}
```

## Cascade Logic

### Path 1: Happy Path (description exists in front-matter)
```
input.description → stripDescriptionMarkup() → base.length > 0
  ↓
  return truncateWithinBudget(base, hardMax)
  ✅ Story-specific, contract-validated
```

### Path 2: Fallback to Title
```
input.description is empty → base.length === 0
  → input.title is non-empty
  ↓
  collapseWhitespace(stripEmptyBrackets(input.title))
  ↓
  return truncateWithinBudget(synthesised, hardMax)
  ⚠️ Generic, not story-specific
```

### Path 3: Fallback to Article-Type Label
```
input.description is empty → base.length === 0
  → input.title is empty
  ↓
  return truncateWithinBudget(input.articleTypeLabel, hardMax)
  ❌ WORST CASE: Description = "Evening Analysis", "Committee Reports", etc.
```

## Identified Edge Cases

### Edge Case 1: Empty Description + Empty Title

**Condition**: 
```typescript
input.description.trim().length === 0 && input.title.trim().length === 0
```

**Current Behavior**:
```typescript
const synthesised = "" || input.articleTypeLabel;
// Result: input.articleTypeLabel (e.g., "Propositions")
```

**Issue**:
- Description is generic boilerplate (article type name, not story)
- Violates SEO contract §3.1: descriptions must be story-specific
- Examples:
  - `<meta name="description" content="Propositions">` (too generic)
  - `<meta name="description" content="Evening Analysis">` (too generic)

**Expected Behavior**:
- Should generate a meaningful fallback from article content or log warning
- Could extract from `input.briefEntities` or first BLUF paragraph

**Severity**: 🔴 **HIGH** — Results in 1-word descriptions that fail SEO contract

---

### Edge Case 2: Bracket Stripping Removes All Content

**Condition**:
```typescript
input.description === "[Brief ID: EBR20260405-001]"  // Only metadata, no narrative
```

**Current Behavior**:
```typescript
stripDescriptionMarkup("[Brief ID: EBR20260405-001]")
  → stripEmptyBrackets("[Brief ID: EBR20260405-001]")
  → ""  // Empty string (brackets removed, nothing left)
→ base.length === 0  // Triggers fallback!
```

**Issue**:
- Description that contains only metadata (Brief ID) gets stripped to empty
- Falls back to title or article-type label
- Loses potential signal from the BLUF markdown

**Expected Behavior**:
- Should NOT strip descriptions that have only metadata brackets
- Should log warning: "Description contains only metadata; check article.md BLUF"

**Severity**: 🟡 **MEDIUM** — Affects articles with purely metadata descriptions

---

### Edge Case 3: No Validation of Synthesized Descriptions

**Condition**:
```typescript
// Title that matches generic-filler pattern
input.title === "AI-generated political intelligence"
input.description === ""  // Falls back to title
```

**Current Behavior**:
```typescript
const synthesised = collapseWhitespace(stripEmptyBrackets("AI-generated political intelligence"));
return truncateWithinBudget("AI-generated political intelligence", 200);
// Result: "AI-generated political intelligence" as the meta description
```

**Issue**:
- Synthesized description matches `GENERIC_FILLER_RE` regex
- No validation against generic-filler patterns in fallback path
- Contract-checker would catch this, but it bypasses `buildSeoDescription()` validation

**Expected Behavior**:
- Should validate synthesized descriptions against `GENERIC_FILLER_RE`
- Should emit warning if fallback result matches boilerplate
- Should NOT render articles with fallback-synthesized generic descriptions

**Severity**: 🟡 **MEDIUM** — Can propagate boilerplate into SEO descriptions

---

### Edge Case 4: Missing executive-brief.md Sources

**Condition** (337 confirmed cases):
```typescript
// Article in analysis/daily/2026-04-06/propositions/documents/
// executive-brief.md does NOT exist
input.description = ""  // Aggregator can't find BLUF paragraph
```

**Current Behavior**:
```typescript
// Cascades to Path 3 (article-type label)
if (input.title === "")  // Also empty (no H1 in documents/)
  return truncateWithinBudget(input.articleTypeLabel, hardMax);
  // Result: "Propositions" or "Committee Reports"
```

**Issue**:
- 337 articles in intermediate artifact directories have no executive-brief.md
- These are NOT meant to be canonical articles (documents/, full-text/, orphaned election-cycle/)
- But they render with generic article-type descriptions because the fallback path is too permissive

**Expected Behavior**:
- Should NOT render articles in `documents/`, `full-text/` subdirectories
- Should classify these as Tier A (non-canonical) in article discovery
- Should skip them from HTML generation entirely

**Severity**: 🔴 **HIGH** — 337 articles with non-specific descriptions

---

### Edge Case 5: Truncation Mid-Word

**Condition**:
```typescript
input.description = "This is a very long description about coalition stability and political trends..."
truncatedResult = "This is a very long description about coalition stability and political tre"
```

**Current Behavior**:
```typescript
truncateWithinBudget(base, hardMax)
// Truncates at character boundary, possibly mid-word
```

**Issue**:
- Description could be cut off mid-word (e.g., "trend" → "tre")
- Contract-checker validates for mid-word truncation via `TRUNCATED_MIDWORD_RE`
- But `buildSeoDescription()` does not validate its output

**Expected Behavior**:
- Should validate that truncated descriptions end at word boundary
- Should validate that truncated descriptions end with sentence terminator

**Severity**: 🟡 **MEDIUM** — Affects contract compliance of truncated descriptions

---

## Missing Validations in buildSeoDescription()

| Validation | Current Status | SEO Contract Reference |
|-----------|-----------------|----------------------|
| Empty description | ⚠️ Falls back to title/type | §3.1 `DESCRIPTION_EMPTY` |
| Description length (min) | ⚠️ No check on fallback | §4 (per-language windows) |
| Description length (max) | ✅ `truncateWithinBudget()` | §4 (per-language windows) |
| Generic filler phrases | ❌ NOT CHECKED | §3.1 `DESCRIPTION_GENERIC_FILLER` |
| Admin metadata leak | ❌ NOT CHECKED | §3.1 `DESCRIPTION_HAS_ADMIN_LEAK` |
| Mid-word truncation | ❌ NOT CHECKED | §3.1 `DESCRIPTION_TRUNCATED_MIDWORD` |
| Sentence terminator | ❌ NOT CHECKED | §3.1 `DESCRIPTION_NOT_TERMINATED` |
| Brand suffix duplication | N/A | (only applies to title) |

---

## Recommended Fixes

### Fix 1: Validate Synthesized Descriptions (Quick Win)

```typescript
export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = stripDescriptionMarkup(input.description);
  const { hardMax } = descriptionWindowForLanguage(input.lang);
  
  if (base.length === 0) {
    // Check if title/articleTypeLabel would match generic-filler
    const titleSynthesised = collapseWhitespace(stripEmptyBrackets(input.title)) || input.articleTypeLabel;
    
    // Validate: don't emit generic-filler descriptions
    if (GENERIC_FILLER_RE.test(titleSynthesised)) {
      // Log warning and fall back to empty string (caught by chrome/head.ts)
      console.warn(`[buildSeoDescription] Fallback description matches generic-filler regex: "${titleSynthesised}"`);
      return "";  // chrome/head.ts will use title as fallback
    }
    
    return truncateWithinBudget(titleSynthesised, hardMax);
  }
  
  return truncateWithinBudget(base, hardMax);
}
```

**Impact**: Prevents propagation of boilerplate descriptions from fallback path

---

### Fix 2: Exclude Tier A Articles from buildSeoDescription() Entirely

```typescript
// In article discovery (scripts/generate-news-indexes/)
function isCanonicalArticle(path: string): boolean {
  // Exclude intermediate artifact directories
  return !(path.includes('/documents/') || 
           path.includes('/full-text/') ||
           (path.includes('/election-cycle/') && !hasExecutiveBrief(path)));
}

// In renderer:
if (!isCanonicalArticle(articlePath)) {
  // Skip from HTML generation entirely
  return null;  // Don't call buildSeoDescription()
}
```

**Impact**: Reduces 337 non-canonical articles from SEO rendering

---

### Fix 3: Strengthen Fallback Logic

```typescript
export function buildSeoDescription(input: ArticleSeoMetadataInput): string {
  const base = stripDescriptionMarkup(input.description);
  const { hardMin, hardMax } = descriptionWindowForLanguage(input.lang);
  
  if (base.length === 0) {
    // Tier-1 fallback: title (if story-specific)
    const titleFallback = collapseWhitespace(stripEmptyBrackets(input.title));
    if (titleFallback.length >= hardMin) {
      return truncateWithinBudget(titleFallback, hardMax);
    }
    
    // Tier-2 fallback: article-type label (generic)
    // THIS IS A RED FLAG — should log and potentially skip rendering
    console.warn(`[buildSeoDescription] Using article-type label (generic): "${input.articleTypeLabel}"`);
    return truncateWithinBudget(input.articleTypeLabel, hardMax);
  }
  
  return truncateWithinBudget(base, hardMax);
}
```

**Impact**: Logs when fallback is too generic, enables alerting

---

### Fix 4: Add Post-Generation Validation

```typescript
export function validateSeoDescription(
  description: string,
  lang: Language
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  const window = descriptionWindowForLanguage(lang);
  const len = visualLength(description);
  
  // Contract validations (mirror contract-checker.ts)
  if (len === 0) violations.push("DESCRIPTION_EMPTY");
  if (len < window.descriptionMin) violations.push("DESCRIPTION_TOO_SHORT");
  if (len > window.descriptionMax) violations.push("DESCRIPTION_TOO_LONG");
  if (GENERIC_FILLER_RE.test(description)) violations.push("DESCRIPTION_GENERIC_FILLER");
  if (BANNED_DESCRIPTION_PHRASES.some(p => p.test(description))) violations.push("DESCRIPTION_HAS_ADMIN_LEAK");
  if (!SENTENCE_TERMINATOR_RE.test(description)) violations.push("DESCRIPTION_NOT_TERMINATED");
  // ... etc
  
  return { ok: violations.length === 0, violations };
}

// In buildSeoDescription():
const result = truncateWithinBudget(base, hardMax);
const validation = validateSeoDescription(result, input.lang);
if (!validation.ok) {
  console.warn(`[buildSeoDescription] Validation failed: ${validation.violations.join(", ")}`);
}
return result;
```

**Impact**: Validates every synthesized description before returning

---

## Testing Recommendations

### Test Case 1: Empty Description + Empty Title
```typescript
it('falls back to article-type label when both description and title are empty', () => {
  const input = {
    description: "",
    title: "",
    articleTypeLabel: "Evening Analysis",
    lang: "en" as Language,
  };
  const result = buildSeoDescription(input);
  expect(result).toBe("Evening Analysis");
  // ⚠️ This is NOT a good description; should be flagged by CI gate
});
```

### Test Case 2: Synthesized Description Matches Generic Filler
```typescript
it('warns when synthesized description matches generic-filler regex', () => {
  const input = {
    description: "",
    title: "AI-generated political intelligence",
    articleTypeLabel: "Propositions",
    lang: "en" as Language,
  };
  const warnSpy = spyOn(console, 'warn');
  const result = buildSeoDescription(input);
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("generic-filler"));
});
```

### Test Case 3: Tier A Articles Excluded from Rendering
```typescript
it('does not generate descriptions for articles in documents/ subdirectories', () => {
  const articlePath = 'analysis/daily/2026-04-06/propositions/documents/article.md';
  expect(isCanonicalArticle(articlePath)).toBe(false);
  // Renderer should skip this article entirely
});
```

---

## Summary

| Issue | Severity | Prevalence | Root Cause | Fix |
|-------|----------|-----------|-----------|-----|
| Empty fallback descriptions | 🔴 HIGH | 337 articles | Missing executive-brief.md | Exclude Tier A from rendering |
| Generic-filler fallback | 🟡 MEDIUM | 3+ articles | No validation in fallback | Add validation gate |
| Bracket stripping | 🟡 MEDIUM | Unknown | Metadata-only descriptions | Check for content before fallback |
| Mid-word truncation | 🟡 MEDIUM | Unknown | No post-truncation validation | Add validation |
| No length validation | 🟡 MEDIUM | All articles | Validation happens downstream | Validate in function |

**Recommended Implementation Order**:
1. Fix 2 (Exclude Tier A) — highest impact, 337 articles fixed
2. Fix 1 (Validate generic filler) — prevents regression
3. Fix 3 (Strengthen fallback) — improves logging
4. Fix 4 (Post-validation) — comprehensive contract checking
