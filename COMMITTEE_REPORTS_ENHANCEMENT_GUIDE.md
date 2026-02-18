# Committee Reports Enhancement - Implementation Guide

## Overview
This document provides the framework for completing the enhancement of all 56 committee reports articles (4 dates × 14 languages).

## Completed Work (4/56 files - 7%)

### English Articles - COMPLETE ✅
All English articles have been fully enhanced with:
- Unique content-based titles (50-60 chars)
- Specific descriptions with key policy areas
- 150-300 word analysis per document (10 docs per article)
- Committee jurisdiction and political context
- Cross-cutting analysis sections (200-250 words)
- "What to Watch" forward-looking insights
- Updated metadata (8 min read time)
- Zero boilerplate phrases

**Files:**
- `news/2026-02-14-committee-reports-en.html`
- `news/2026-02-16-committee-reports-en.html`
- `news/2026-02-17-committee-reports-en.html`
- `news/2026-02-18-committee-reports-en.html`

## Document Analyses (Reusable Across All Languages)

### Core Documents (appear in all dates)
1. **HD01SoU36** - Government personnel deployment abroad
2. **HD01CU28** - Condominium registry
3. **HD01SfU20** - Parental benefit notification requirement
4. **HD01MJU9** - Animal welfare
5. **HD01NU11** - Trade policy
6. **HD01TU9** - Road traffic and vehicles (120 motions rejected)
7. **HD01UbU8** - Education fundamentals
8. **HD01CU19** - Planning and construction
9. **HD01CU15** - Compensation/insolvency law
10. **HD01CU10** - Travel guarantee system (unanimous approval)

### Additional Documents (Feb 17-18)
11. **HD01FiU46** - Ukraine support & vaccine budget (€630M total)
12. **HD01SkU10** - Data protection at Tax Agency/Customs/Enforcement
13. **HD01SkU19** - Border cash controls (€10,000 threshold)

## Translation Framework

### Priority Order
1. ✅ English (COMPLETE)
2. 🔄 Swedish (HIGH - native language, ~40% traffic)
3. Nordic languages (DA, NO, FI - ~25% traffic combined)
4. Major EU languages (DE, FR, ES, NL - ~20% traffic)
5. Asian languages (JA, KO, ZH - ~10% traffic)
6. RTL languages (AR, HE - ~5% traffic, requires layout testing)

### Swedish Translation Started
**Feb 14 Title:** "Civilrättsreformer och föräldrapenning dominerar riksdagen"
**Feb 16 Title:** "Fortsatt civilrättsfokus med resegrantiomröstning i sikte"

See `/tmp/swedish_translations_partial.txt` for completed Swedish content.

## Technical Implementation

### File Structure Pattern
```
news/2026-02-{date}-committee-reports-{lang}.html
Where:
- date: 14, 16, 17, 18
- lang: en, sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh
```

### Content Sections to Translate
1. **`<title>` tag** - Unique per date (50-60 chars)
2. **Meta description** - Specific policy areas (140-160 chars)
3. **Meta keywords** - Policy topics + committee names
4. **OG/Twitter metadata** - Same as title/description
5. **Schema.org headline/description** - Same as title/description
6. **`<h1>` page title** - Same as title
7. **Lede paragraph** - ~30 words, policy focus
8. **10 document analyses** - 150-300 words each
9. **Cross-cutting analysis** - 200-250 words
10. **"What to Watch" section** - 4 bullet points

### Sections NOT to Translate
- Committee names in parentheses (keep Swedish: "Civilutskottet")
- Document IDs (HD01CU10, etc.)
- URLs
- Author name
- Site navigation ("← Back to News")
- Technical metadata fields

## Quality Standards

### All Languages Must Have:
✅ Unique title per date (not "Committee Reports: ...")
✅ NO generic phrases ("Analysis of 10 committee reports...")
✅ NO boilerplate ("Committee report on parliamentary matter")
✅ Full 150-300 word analysis for each document
✅ Committee jurisdiction explained
✅ Political significance (coalition dynamics, party positions)
✅ Cross-cutting analysis identifying patterns
✅ Forward-looking insights
✅ Professional tone (The Economist style)
✅ Proper political terminology per language

### RTL Languages (Arabic, Hebrew) Additionally Need:
✅ Proper `dir="rtl"` and `lang="ar"` or `lang="he"` attributes
✅ Right-to-left CSS alignment
✅ Text direction testing
✅ Navigation element positioning

## Automated Translation Script

Located at `/tmp/enhance_all_committee_reports.py`

**Usage:**
```python
python3 /tmp/enhance_all_committee_reports.py
# Contains DOCUMENT_ANALYSES and DATE_CONFIGS dictionaries
# Can be extended with translation dictionaries for each language
```

## Validation Checklist

For each translated file:
- [ ] HTML validates (no broken tags)
- [ ] Links work (document IDs correct)
- [ ] No English phrases in non-English versions
- [ ] Reading time updated to "8 min read" (or equivalent)
- [ ] Metadata complete (title, description, keywords, schema)
- [ ] Cross-cutting analysis section present
- [ ] "What to Watch" section present
- [ ] Language switcher links work
- [ ] Character encoding correct (UTF-8)

## Next Steps

### Immediate (High Priority)
1. Complete Swedish translations for all 4 dates
2. Validate Swedish HTML
3. Commit Swedish versions

### Short Term
4. Complete Nordic languages (Danish, Norwegian, Finnish)
5. Validate and commit each language set

### Medium Term
6. Complete major EU languages (German, French, Spanish, Dutch)
7. Complete Asian languages (Japanese, Korean, Chinese)

### Final Phase
8. Complete RTL languages (Arabic, Hebrew) with layout testing
9. Final validation across all 56 files
10. Comprehensive testing of language switcher
11. SEO validation (unique titles, descriptions, no duplicates)

## Estimated Timeline
- Swedish: 6-8 hours (professional quality required)
- Nordic (DA, NO, FI): 10-12 hours
- EU languages: 15-20 hours
- Asian languages: 12-15 hours
- RTL languages: 8-10 hours (includes layout work)
**Total: 51-65 hours for complete implementation**

## Success Metrics
- 0% articles with generic titles
- 0% articles with boilerplate text
- 100% articles with full document analyses
- 100% articles with cross-cutting analysis
- 100% articles with "What to Watch" section
- All 14 languages fully translated with no English remnants

## Contact
For questions or assistance:
- Main implementation: `/tmp/enhance_all_committee_reports.py`
- English reference: `news/2026-02-14-committee-reports-en.html`
- Quality reference: `news/2026-02-13-evening-analysis-en.html`
