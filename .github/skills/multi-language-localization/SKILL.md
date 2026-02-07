---
name: multi-language-localization
description: Best practices for multi-language static websites with proper i18n and l10n support
license: Apache-2.0
---

# Multi-Language Localization Skill

## Purpose

Implement proper internationalization (i18n) and localization (l10n) for static websites supporting multiple languages.

## Core Principles

### 1. Language Declaration
```html
<!-- ✅ Always declare language -->
<html lang="en">

<!-- For Swedish -->
<html lang="sv">

<!-- For Arabic (RTL) -->
<html lang="ar" dir="rtl">
```

### 2. File Structure
```
index.html       (en - English, default)
index_sv.html    (sv - Swedish)
index_da.html    (da - Danish)
index_no.html    (no - Norwegian)
index_fi.html    (fi - Finnish)
index_de.html    (de - German)
index_fr.html    (fr - French)
index_es.html    (es - Spanish)
index_nl.html    (nl - Dutch)
index_ar.html    (ar - Arabic, RTL)
index_he.html    (he - Hebrew, RTL)
index_ja.html    (ja - Japanese)
index_ko.html    (ko - Korean)
index_zh.html    (zh - Chinese)
```

### 3. Language Switcher
```html
<nav aria-label="Language selection">
  <ul>
    <li><a href="index.html" hreflang="en">English</a></li>
    <li><a href="index_sv.html" hreflang="sv">Svenska</a></li>
    <li><a href="index_ar.html" hreflang="ar">العربية</a></li>
  </ul>
</nav>
```

### 4. RTL Support
```css
/* RTL-specific styles */
[dir="rtl"] .element {
  text-align: right;
  direction: rtl;
}

/* Use logical properties */
.element {
  margin-inline-start: 1rem;  /* Not margin-left */
  padding-inline-end: 1rem;   /* Not padding-right */
}
```

### 5. Cultural Considerations
- Date formats (US: MM/DD/YYYY, EU: DD/MM/YYYY)
- Number formats (1,000.00 vs 1.000,00)
- Currency symbols
- Text direction (LTR vs RTL)
- Color meanings (cultural significance)

## SEO Best Practices

### Hreflang Tags
```html
<link rel="alternate" hreflang="en" href="https://example.com/index.html">
<link rel="alternate" hreflang="sv" href="https://example.com/index_sv.html">
<link rel="alternate" hreflang="x-default" href="https://example.com/index.html">
```

### Sitemap
```xml
<url>
  <loc>https://example.com/index.html</loc>
  <xhtml:link rel="alternate" hreflang="sv" href="https://example.com/index_sv.html"/>
</url>
```

## Testing

- Native speaker review
- RTL layout testing
- Character encoding verification
- Cultural appropriateness check
- SEO validation (hreflang)

## Remember

- **Native Speakers**: Use professional translation
- **Cultural Context**: Consider cultural differences
- **RTL Support**: Test right-to-left languages
- **Consistent UX**: Same experience across languages
- **SEO**: Proper hreflang and sitemap

## References

- [W3C Internationalization](https://www.w3.org/International/)
- [MDN Localization](https://developer.mozilla.org/en-US/docs/Mozilla/Localization)
