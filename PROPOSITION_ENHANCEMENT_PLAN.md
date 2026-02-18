# Government Propositions Enhancement Implementation Plan

## 📊 Status

**Proof of Concept Completed**: Enhanced English version created for 2026-02-18
- **File**: `news/2026-02-18-government-propositions-en-ENHANCED.html`
- **Word Count**: 3,551 words (vs. 711 original) = **5x increase**
- **Quality**: Economist-style analytical depth, comprehensive policy analysis

## ✅ What Was Accomplished

### Content Transformation
1. **Unique Title**: "Weapons Law and VAT Fraud: Tidö Priorities This Week" (not generic)
2. **Specific Description**: References actual propositions, not boilerplate
3. **Per-Proposition Analysis** (200-400 words each × 10 propositions):
   - **HD03141** (Weapons Law): 380 words - policy details, affected parties, coalition dynamics
   - **HD03123** (Explosives Control): 240 words - implementation timeline, industry impact
   - **HD03128** (VAT Fraud): 360 words - budget impact, political positioning
   - **HD03129** (Beneficial Ownership): 310 words - EU compliance, privacy concerns
   - **HD03116** (Financial Crisis Tools): 290 words - SIFI requirements, stability framework
   - **HD03126** (E-ID Reporting): 250 words - infrastructure requirements, reliability
   - **HD03117** (Parental Benefit): 220 words - administrative simplification, unanimous support
   - **HD03110** (Police Reform Audit): 260 words - coalition tensions, budget commitments
   - **HD03122** (Climate Policy Audit): 240 words - evaluation framework, political vulnerabilities
   - **HD03120** (Veterinary Medicines): 220 words - EU compliance, farm impact

4. **Cross-Cutting Analysis** (420 words):
   - Law-and-order dominance (4/10 propositions)
   - Financial crime focus (3/10 propositions)
   - Administrative modernization theme
   - Accountability pressures
   - Coalition management challenges

5. **"What to Watch" Section** (310 words):
   - Committee hearing dates
   - Opposition response dynamics
   - Media attention flashpoints
   - EU compliance deadlines

### Quality Improvements
- **HTML Validation**: ✅ Passes htmlhint
- **Schema.org Metadata**: Updated with unique title/description
- **BreadcrumbList**: Present and accurate
- **Meta Tags**: OG, Twitter Card, all updated
- **Professional Tone**: Matches 2026-02-13-evening-analysis-en.html reference

## 📋 Implementation Approach for Remaining 69 Files

### Phase 1: English Versions (4 date groups remaining)
**Files**: `2026-02-14`, `2026-02-16`, `2026-02-17`, `2026-02-government` (English versions)

**Process**:
1. Extract proposition dok_ids from existing files
2. Fetch MCP data using `riksdag-regering-get_dokument` for each
3. Identify top 2-3 policy themes per date
4. Create unique titles based on actual policy areas:
   - **2026-02-14**: "Budget Implementation and EU Compliance: Week's Focus"
   - **2026-02-16**: "Healthcare Reform and Migration Policy Dominate"
   - **2026-02-17**: "Infrastructure Investment and Energy Policy Priority"
   - **2026-02-government**: "February Overview: Law-and-Order Surge"
5. Write 200-400 word analysis per proposition (using MCP full_text if available)
6. Add cross-cutting analysis per article
7. Create "What to Watch" sections
8. Update all metadata

**Time Estimate**: 3-4 hours per date group × 4 = 12-16 hours

### Phase 2: Translations (13 languages × 5 dates = 65 files)

**Translation Strategy**:

#### Option A: Professional Translation Service (Recommended for Production)
- Services: DeepL API Pro, Google Cloud Translation Advanced
- Cost: ~$0.05/word × 3,000 words × 65 files = ~$9,750
- Quality: High accuracy, cultural nuance
- Time: 2-3 business days

#### Option B: Manual Translation with Native Speakers
- Hire translators: Swedish, Danish, Norwegian, Finnish, German, French, Spanish, Dutch, Arabic, Hebrew, Japanese, Korean, Chinese
- Cost: ~$0.10/word × 13 languages = ~$39,000
- Quality: Highest accuracy
- Time: 1-2 weeks

#### Option C: AI-Assisted Translation (Budget Option)
**Recommended Approach**:

1. **Create Translation Templates**:
   ```javascript
   // For each language, map:
   {
     "en": {
       "title_pattern": "Weapons Law and VAT Fraud: Tidö Priorities This Week",
       "section_law_enforcement": "Law Enforcement and Security Measures",
       // ... 50+ translation keys
     },
     "sv": {
       "title_pattern": "Vapenlag och momsbedrägerier: Tidö-prioriteringar denna vecka",
       "section_law_enforcement": "Brottsbekämpning och säkerhetsåtgärder",
       // ...
     }
   }
   ```

2. **Use GPT-4 for Content Translation**:
   - Translate article body paragraphs (preserve HTML structure)
   - Maintain political terminology accuracy
   - Ensure cultural appropriateness

3. **RTL Layout for Arabic/Hebrew**:
   - Add `dir="rtl"` to `<html>` tag
   - Reverse arrow direction: "← Back to News" → "→ العودة إلى الأخبار"
   - Test language switcher layout

4. **Validation**:
   - Native speaker spot-checks for each language (1-2 hours per language)
   - HTML validation for all files
   - Link checking

**Time Estimate**: 
- Template creation: 4 hours
- Translation automation: 2 hours
- AI translation generation: 30 minutes per language × 13 = 6.5 hours
- Validation: 2 hours per language × 13 = 26 hours
- **Total**: ~38 hours

### Phase 3: Replace Original Files

**Process**:
1. Backup original files:
   ```bash
   mkdir -p news/backups/propositions-original
   cp news/2026-*-government-propositions-*.html news/backups/propositions-original/
   ```

2. Replace with enhanced versions:
   ```bash
   mv news/2026-02-18-government-propositions-en-ENHANCED.html news/2026-02-18-government-propositions-en.html
   # Repeat for all 70 files
   ```

3. Update news index files (if necessary):
   - Update titles in `news/index.html` (all 14 languages)
   - Update descriptions

4. Verify all links:
   ```bash
   npx linkinator news/*.html --recurse
   ```

## 🎯 Acceptance Criteria Checklist

### Content Quality
- [x] **2026-02-18 English**: 3,551 words (target: 3,000+) ✅
- [ ] **2026-02-14 English**: TBD
- [ ] **2026-02-16 English**: TBD
- [ ] **2026-02-17 English**: TBD
- [ ] **2026-02-government English**: TBD
- [ ] Each proposition: 200-400 words ✅ (for 2026-02-18)
- [ ] Unique titles per date (5 different) - 1/5 complete
- [ ] Political context for each proposition
- [ ] Implementation timelines specified
- [ ] Cross-cutting analysis sections
- [ ] "What to Watch" sections

### Multi-Language
- [ ] Swedish (SV) - 0/5 dates
- [ ] Danish (DA) - 0/5 dates
- [ ] Norwegian (NO) - 0/5 dates
- [ ] Finnish (FI) - 0/5 dates
- [ ] German (DE) - 0/5 dates
- [ ] French (FR) - 0/5 dates
- [ ] Spanish (ES) - 0/5 dates
- [ ] Dutch (NL) - 0/5 dates
- [ ] Arabic (AR) - 0/5 dates (RTL layout)
- [ ] Hebrew (HE) - 0/5 dates (RTL layout)
- [ ] Japanese (JA) - 0/5 dates
- [ ] Korean (KO) - 0/5 dates
- [ ] Chinese (ZH) - 0/5 dates

### Technical Quality
- [x] **2026-02-18-en**: HTML validation passes ✅
- [ ] Link checking passes (pending translation)
- [x] BreadcrumbList present ✅
- [x] Schema.org metadata updated ✅
- [ ] WCAG 2.1 AA verified (pending full test suite)

### Completeness
- [ ] All `2026-*-government-propositions-*.html` enhanced (1/58 complete)
- [ ] News index files updated with new titles
- [ ] Original files backed up

## 📈 Progress Tracking

**Current Status**: **1.7% complete** (1 of 58 files)

| Date Group | English | SV | DA | NO | FI | DE | FR | ES | NL | AR | HE | JA | KO | ZH | Total |
|------------|---------|----|----|----|----|----|----|----|----|----|----|----|----|-------|-------|
| 2026-02-18 | ✅ 100% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 7% |
| 2026-02-17 | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| 2026-02-16 | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| 2026-02-14 | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| 2026-02-mon | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |

**Files Completed**: 1 / 58 (70 total with monthly overviews)

## 🚀 Next Steps

### Immediate (Next Session)
1. Complete English versions for remaining 4 date groups (12-16 hours)
2. Create translation automation script (ES modules compatible)
3. Generate Swedish translations as proof-of-concept (5 files)

### Short-Term (This Week)
1. Decision on translation approach (A, B, or C)
2. If Option C: Complete AI-assisted translations for all 13 languages
3. Native speaker validation spot-checks
4. Replace original files with enhanced versions
5. Update news index files

### Validation (Before Merge)
1. Run full HTML validation suite: `npx htmlhint news/*.html`
2. Link checking: `npx linkinator news/*.html --recurse`
3. Accessibility audit: `npx pa11y-ci news/2026-*-government-propositions-*.html`
4. Manual spot-checks: 2-3 articles per language
5. Git diff review: Verify no English text in non-English versions

## 📚 Reference Materials

### High-Quality Example
- **File**: `news/2026-02-13-evening-analysis-en.html`
- **Characteristics**: Economist-style depth, political context, forward-looking insights
- **Structure**: Executive summary → Detailed analysis → What to Watch

### MCP Data Sources
```javascript
// Fetch proposition details
riksdag-regering-get_dokument({
  dok_id: "HD03141",
  include_full_text: false  // Set true for deep analysis
})

// Search related documents
riksdag-regering-search_dokument({
  relaterat_id: "HD03141",
  limit: 20
})

// Get committee context
riksdag-regering-get_utskott()
```

### Translation Quality Checks
1. **Political Terminology**: Party names, committee names, legal terms must be accurate
2. **Cultural Sensitivity**: Swedish political context maintained across languages
3. **RTL Layout**: Arabic/Hebrew require `dir="rtl"` and reversed UI elements
4. **Date Formats**: Localized per language (e.g., "18 February 2026" vs "18 februari 2026")
5. **Number Formats**: Respect locale conventions (1,000 vs 1 000 vs 1.000)

## 💡 Lessons Learned (2026-02-18 POC)

1. **MCP Data is Essential**: Real proposition metadata (ministry, date, title) enables authentic analysis
2. **Policy Themes Matter**: Grouping by theme (law-and-order, financial crime) creates coherent narrative
3. **Coalition Dynamics Key**: Tidö Agreement context explains political maneuvering
4. **Implementation Timelines**: Committee schedules, vote dates add concrete forward-looking value
5. **Word Count Sweet Spot**: 200-400 words per proposition balances depth vs. readability
6. **Cross-Cutting Analysis**: Government priorities section synthesizes individual propositions into strategic insights
7. **Unique Titles Critical**: SEO and user experience demand content-specific titles, not generic boilerplate

## 🎬 Conclusion

The proof-of-concept demonstrates that transforming generic link lists into comprehensive analytical articles is **feasible and high-impact**. The enhanced 2026-02-18 English version shows:

- **5x content increase** (711 → 3,551 words)
- **Professional journalism quality** (matches reference article)
- **SEO-optimized** (unique title, specific description)
- **Actionable insights** ("What to Watch" section)
- **Political depth** (coalition dynamics, opposition positioning)

**Recommended Next Step**: Complete remaining 4 English versions, then decide on translation approach based on budget/timeline constraints.

**Estimated Total Time**:
- English completion: 12-16 hours
- Translation (Option C - AI-assisted): 38 hours
- Validation and deployment: 10 hours
- **Total**: 60-64 hours (~1.5-2 weeks full-time)

---

**Created**: 2026-02-19  
**Status**: Phase 1 in progress (1/5 date groups complete)
**Last Updated**: 2026-02-19
