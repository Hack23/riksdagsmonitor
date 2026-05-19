/**
 * @module generate-news-indexes/template/rtl
 * @description Minimal RTL-specific styles. Kept as a public export for
 * backward compatibility; canonical RTL handling is now performed by
 * `buildChrome` via `dir="rtl"` on `<html>`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Generate the standalone RTL `<style>` block (legacy export). */
export function generateRTLStyles(isRTL: boolean | undefined): string {
  if (!isRTL) return '';

  return `
  <style>
    /* RTL-specific overrides for Arabic and Hebrew */
    .news-page .language-notice {
      border-left: none;
      border-right: 4px solid var(--primary-yellow, #ffbe0b);
    }

    .news-page .language-badge {
      margin-left: 0;
      margin-right: 0.5rem;
    }

    .news-page .back-link:hover {
      transform: translateX(5px); /* Reverse direction for RTL */
    }
  </style>`;
}

/**
 * RTL-specific overrides injected into `buildChrome`'s `extraStyle`. Trimmer
 * than {@link generateRTLStyles} because the canonical chrome already sets
 * `dir="rtl"` on `<html>` so we only need the news-page-specific tweaks.
 */
export function newsPageExtraRtlStyle(isRTL: boolean): string {
  return isRTL ? `
    /* RTL-specific overrides for Arabic and Hebrew */
    .news-page .language-notice {
      border-left: none;
      border-right: 4px solid var(--primary-yellow, #ffbe0b);
    }
    .news-page .language-badge { margin-left: 0; margin-right: 0.5rem; }
` : '';
}
