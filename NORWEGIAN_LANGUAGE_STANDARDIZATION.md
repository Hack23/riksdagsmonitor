# Norwegian Language Code Standardization

## Summary

All Norwegian language references in the riksdagsmonitor repository now consistently use `no` (Norwegian) instead of `nb` (Norwegian Bokmål BCP 47 code).

## Changes Made

### Source Files Updated

1. **scripts/generate-news-indexes.js**
   - Language code: `'nb'` → `'no'`
   - Locale: `'nb_NO'` → `'no_NO'`

2. **scripts/generate-sitemap.js**
   - LANGUAGES array: `'nb'` → `'no'`
   - Removed conditional mapping: `lang === 'nb' ? 'no' : lang` → just `lang`
   - Sitemap alternates: `{ lang: 'nb', ... }` → `{ lang: 'no', ... }`

3. **scripts/article-template.js**
   - Hreflang attribute: `l === 'no' ? 'nb' : l` → just `l`
   - Locale mapping: `no: 'nb-NO'` → `no: 'no-NO'`

4. **scripts/data-transformers.js**
   - Locale mapping: `no: 'nb-NO'` → `no: 'no-NO'`

5. **tests/article-template.test.js**
   - Expected languages: `'nb'` → `'no'`
   - Removed BCP 47 comment

6. **tests/news-evening-analysis.test.js**
   - Required hreflangs: `'nb'` → `'no'`

7. **.github/workflows/news-evening-analysis.md**
   - Documentation: Updated to reflect `'no'` usage
   - Example hreflang: `hreflang="nb"` → `hreflang="no"`

## Standard Convention

**Norwegian language MUST always use:**

- **Filename suffix**: `_no` or `-no`
  - Examples: `index_no.html`, `article-no.html`, `sitemap_no.html`

- **Language code**: `'no'`
  - In LANGUAGES arrays, code properties, hreflang attributes

- **Locale identifier**: `'no_NO'` or `'no-NO'`
  - In locale mappings and BCP 47 format where needed

- **Hreflang attribute**: `hreflang="no"`
  - In HTML alternate links

## Verification

✅ No `'nb'` or `"nb"` references found in source files (scripts/, tests/, .github/)  
✅ All language arrays consistently use `'no'`  
✅ All locale mappings use `'no_NO'` or `'no-NO'`  
✅ Tests updated to expect `'no'`  
✅ Documentation updated

## Future Guidelines

1. **NEVER use `'nb'`** - Always use `'no'` for Norwegian
2. **Consistency is critical** - Use `'no'` across all contexts:
   - File names
   - Language codes
   - Locale identifiers
   - Hreflang attributes
   - Test expectations
   - Documentation

3. **If regenerating HTML files**, they will automatically use `'no'` based on the updated scripts

4. **When adding new features** that involve languages, always use `'no'` for Norwegian

## Rationale

The repository standardized on `'no'` (Norwegian) for simplicity and consistency. While `'nb'` (Norwegian Bokmål) is the BCP 47 standard for Norwegian Bokmål specifically, the simpler `'no'` code:

- Matches the filename convention (`_no`, `-no`)
- Is easier to maintain consistently
- Avoids confusion between language code and filename suffix
- Was the user's explicit requirement for this repository

---

**Last Updated**: 2026-02-14  
**Status**: ✅ Complete - All 'nb' references removed
