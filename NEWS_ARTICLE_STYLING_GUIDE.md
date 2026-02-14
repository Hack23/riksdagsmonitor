# News Article Styling Guide

## Overview

All generated news articles use **external styles.css** instead of embedded CSS and follow **The Economist-style** political journalism formatting.

## Architecture Change (Feb 2026)

### Before
- ❌ 350+ lines of CSS embedded in JavaScript (`article-template.js`)
- ❌ Generated articles had `<style>` tags in HTML
- ❌ Inconsistent styling possible between articles
- ❌ Poor browser caching (CSS in every HTML file)

### After ✅
- ✅ All styles in `styles.css` (section: NEWS ARTICLE STYLES, line ~8705)
- ✅ No embedded CSS in generated articles
- ✅ Consistent styling across all articles
- ✅ Better browser caching and performance
- ✅ Easier to maintain and update styles

**File Size Reduction**: `article-template.js` reduced from 813 → 463 lines (43% smaller)

## The Economist-Style Formatting

### Tagline (Required on All Articles)
Every article includes the brand tagline:

```html
<p class="article-tagline">
  Latest news and analysis from Sweden's Riksdag. 
  The Economist-style political journalism covering parliament, 
  government, and agencies with systematic transparency.
</p>
```

**Location**: Immediately after `<article-header>` opening, before `<h1>`

### Typography Enhancements

#### 1. Drop Cap (Lede Paragraph)
First letter of lede paragraph styled as elegant drop cap:

```css
.lede::first-letter {
  float: left;
  font-size: 3.5rem;
  line-height: 0.85;
  margin: 0.1rem 0.1rem 0 0;
  font-weight: 700;
  color: var(--primary-color, #006633);
}
```

**Responsive**: Reduces to 2.5rem on mobile

#### 2. Justified Text
Body paragraphs use justified text for Economist-style look:

```css
.article-content p {
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
}
```

**Responsive**: Switches to left-aligned on mobile and in print

#### 3. Optimal Line Length
Content constrained to 66 characters for readability:

```css
.article-content {
  max-width: 66ch;
  margin: 0 auto;
}
```

### Special Content Blocks

#### Why This Matters (Analysis Section)
For analytical depth and context:

```html
<div class="why-matters">
  <h3>Why This Matters</h3>
  <p>Analysis explaining significance and implications...</p>
  <p>International comparisons or historical context...</p>
</div>
```

**Styling**: Green gradient border, light background, prominent heading

#### Pull Quotes
For emphasis and visual breaks:

```html
<blockquote class="pull-quote">
  The coalition's arithmetic problems have morphed into 
  philosophical differences that no amount of calculation can reconcile.
</blockquote>
```

**Styling**: Large italic text, green left border, decorative quotation mark

#### Context Boxes (Explainers)
For additional background information:

```html
<div class="context-box">
  <h3>Historical Context</h3>
  <p>Background information providing context...</p>
</div>
```

**Styling**: Light gray background, green left border

### Section Dividers
H2 headings include elegant top borders:

```css
.article-content h2 {
  border-top: 1px solid var(--section-border);
  padding-top: 2rem;
  margin: 2.5rem 0 1rem 0;
}
```

## CSS Classes Reference

### Article Structure
- `.news-article` - Main article container (max-width: 800px)
- `.article-header` - Header with green bottom border
- `.article-tagline` - Economist-style subtitle ✨ NEW
- `.article-meta` - Date, type, read time metadata
- `.article-content` - Main content area (max-width: 66ch)
- `.article-footer` - Footer with sources and navigation

### Typography
- `.lede` - Lead paragraph with left border
- `.lede::first-letter` - Drop cap (3.5rem) ✨ NEW

### Special Content
- `.why-matters` - Analysis section ✨ NEW
- `.pull-quote` - Emphasized quotes ✨ NEW
- `.context-box` - Background information boxes
- `.watch-section` - "What to Watch" key points
- `.event-calendar` - Calendar grid for Week Ahead

### Navigation
- `.article-nav` - Footer navigation
- `.back-to-news` - Link back to news index

## Implementation Guide

### Generating Articles
When generating articles with `article-template.js`:

```javascript
import { generateArticleHTML } from './scripts/article-template.js';

const html = generateArticleHTML({
  slug: 'article-slug.html',
  title: 'Article Title',
  subtitle: 'Article subtitle/lede',
  date: '2026-02-14',
  type: 'analysis',
  lang: 'en',
  content: '<p>Article content...</p>',
  // ... other fields
});
```

The template automatically:
- ✅ Links to `../styles.css`
- ✅ Adds Economist tagline
- ✅ Applies all styling via CSS classes
- ✅ No embedded CSS generated

### Adding "Why This Matters" Sections
In your content generation code:

```javascript
const content = `
<p>Main article content...</p>

<div class="why-matters">
  <h3>Why This Matters</h3>
  <p>Explain the significance and broader implications...</p>
  <p>Add international comparisons or historical context...</p>
</div>

<p>Continue article...</p>
`;
```

### Adding Pull Quotes
For emphasis:

```javascript
const content = `
<p>Regular paragraph...</p>

<blockquote class="pull-quote">
  A striking statement or key insight that deserves emphasis.
</blockquote>

<p>Continue analysis...</p>
`;
```

## Responsive Behavior

### Desktop (≥768px)
- Justified text with hyphens
- Drop cap: 3.5rem
- Max width: 66ch for content
- Pull quotes: 1.35rem font size

### Mobile (<768px)
- Left-aligned text (no justification)
- Drop cap: 2.5rem (smaller)
- Full width content
- Pull quotes: 1.15rem font size

### Print
- Left-aligned text
- No justification
- Black and white calendar/watch sections
- Back to news button hidden

## Color Scheme

All articles use the riksdagsmonitor green palette:

```css
--primary-color: #006633
--primary-light: #007744
--primary-dark: #004422
--text-color: #1a1a1a
--text-secondary: #4a4a4a
```

## Accessibility (WCAG 2.1 AA)

All styles maintain accessibility:
- ✅ Color contrast ≥ 4.5:1 for normal text
- ✅ Color contrast ≥ 3:1 for large text
- ✅ Focus indicators visible
- ✅ Semantic HTML structure
- ✅ Screen reader compatible

## Performance

External CSS benefits:
- **Caching**: styles.css cached across all articles
- **Size**: HTML files ~5KB smaller without embedded CSS
- **Speed**: Faster page loads on multi-article views
- **Bandwidth**: Reduced data transfer

## Maintenance

### Updating Styles
All article styles live in `styles.css` section "NEWS ARTICLE STYLES" (line ~8705).

**DO**:
- ✅ Update styles in styles.css
- ✅ Test across all 14 languages
- ✅ Verify responsive design
- ✅ Check WCAG 2.1 AA compliance

**DON'T**:
- ❌ Add embedded CSS to article-template.js
- ❌ Recreate removed functions (generateArticleCSS, getArticleStyles)
- ❌ Use inline styles in generated articles

### Testing Changes
After style updates:

```bash
# Generate test article
node test-article-gen.js

# Verify no embedded CSS
grep -c "<style>" generated-article.html  # Should be 0

# Verify tagline present
grep "article-tagline" generated-article.html  # Should match

# Verify styles.css link
grep "styles.css" generated-article.html  # Should match
```

## Migration Notes

### Existing Articles
Articles generated before Feb 2026 may still have embedded CSS. Consider regenerating for consistency.

### Future Development
When creating new article types or templates:
1. Always link to `styles.css`
2. Never generate embedded CSS
3. Use existing CSS classes
4. Add new classes to styles.css if needed
5. Include Economist-style tagline
6. Follow 66ch max-width pattern

## References

- **Template**: `scripts/article-template.js`
- **Styles**: `styles.css` (lines ~8705-9200)
- **Sample**: `news/sample-economist-style.html`
- **Commit**: 421fc56 (2026-02-14)

## Questions?

See repository documentation or file an issue on GitHub.

---

**Last Updated**: 2026-02-14  
**Version**: 1.0  
**Status**: ✅ In Production
