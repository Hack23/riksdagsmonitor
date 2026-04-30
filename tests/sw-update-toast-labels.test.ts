/**
 * Unit tests for the SW-update-toast localization helper exported from
 * `src/browser/main.ts`. These exercise the language-resolution rules
 * (primary subtag, fallback to English) that drive the
 * `New content available` toast on non-English index pages.
 *
 * `src/browser/main.ts` performs DOM access at module top-level
 * (`document.readyState`, `DOMContentLoaded` listener) and registers a
 * service worker on `window.load`. Importing it here is safe because the
 * vitest config uses a happy-dom environment (`vitest.config.js` →
 * `test.environment: 'happy-dom'`), which provides both `document` and
 * `window`. The service-worker branch is also gated on
 * `'serviceWorker' in navigator`, so it no-ops under happy-dom.
 */

import { describe, it, expect } from 'vitest';
import {
  SW_UPDATE_TOAST_LABELS,
  getUpdateToastLabels,
} from '../src/browser/main.js';

describe('SW update toast localization', () => {
  it('exposes labels for every supported site language', () => {
    // 14 site languages + `nb` BCP-47 alias for legacy `no` lang attr.
    const expected = ['en', 'sv', 'da', 'no', 'nb', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    for (const code of expected) {
      expect(SW_UPDATE_TOAST_LABELS).toHaveProperty(code);
      const labels = SW_UPDATE_TOAST_LABELS[code];
      expect(labels).toBeDefined();
      expect(labels!.message).toBeTruthy();
      expect(labels!.reload).toBeTruthy();
      expect(labels!.dismiss).toBeTruthy();
      expect(labels!.lang).toBe(code);
    }
  });

  it('returns Swedish labels for `sv` (case-insensitive)', () => {
    expect(getUpdateToastLabels('sv').message).toBe('Nytt innehåll tillgängligt');
    expect(getUpdateToastLabels('SV').reload).toBe('Ladda om');
  });

  it('returns Arabic labels including a non-empty dismiss aria-label', () => {
    const labels = getUpdateToastLabels('ar');
    expect(labels.message).toBe('محتوى جديد متاح');
    expect(labels.dismiss).toBe('إغلاق');
    expect(labels.lang).toBe('ar');
  });

  it('matches on the BCP-47 primary subtag (e.g. `en-GB` → en, `zh-Hans` → zh)', () => {
    expect(getUpdateToastLabels('en-GB').message).toBe('New content available');
    expect(getUpdateToastLabels('zh-Hans').message).toBe('有新内容可用');
    expect(getUpdateToastLabels('he-IL').reload).toBe('טען מחדש');
  });

  it('falls back to English for unsupported languages and empty input', () => {
    expect(getUpdateToastLabels('xx').message).toBe('New content available');
    expect(getUpdateToastLabels('').message).toBe('New content available');
    expect(getUpdateToastLabels('  ').message).toBe('New content available');
  });
});
