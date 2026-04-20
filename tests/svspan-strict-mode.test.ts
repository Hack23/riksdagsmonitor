/**
 * Unit tests for the opt-in strict-mode gate on `svSpan()` (§P0-1).
 *
 * When the env var `SVSPAN_STRICT=1` is set, calling svSpan() for a target
 * language other than 'sv' or 'en' must throw — forcing AI translation to
 * happen upstream rather than shipping untranslated Swedish into target-
 * language articles. Default (env unset) behaviour is unchanged so existing
 * tests and callers continue to work.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { svSpan } from '../scripts/data-transformers/helpers.js';

describe('svSpan() §P0-1 opt-in strict-mode gate', () => {
  const originalValue = process.env.SVSPAN_STRICT;

  beforeEach(() => {
    delete process.env.SVSPAN_STRICT;
  });

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.SVSPAN_STRICT;
    } else {
      process.env.SVSPAN_STRICT = originalValue;
    }
  });

  describe('default (non-strict) mode — backward compatibility', () => {
    it('accepts sv without throwing', () => {
      expect(() => svSpan('text', 'sv')).not.toThrow();
    });

    it('accepts en without throwing', () => {
      expect(() => svSpan('text', 'en')).not.toThrow();
    });

    it('accepts any other language without throwing (legacy behaviour)', () => {
      expect(() => svSpan('text', 'de')).not.toThrow();
      expect(() => svSpan('text', 'fr')).not.toThrow();
      expect(() => svSpan('text', 'ar')).not.toThrow();
    });

    it('always emits a data-translate span with lang="sv"', () => {
      const html = svSpan('Bättre förutsättningar', 'en');
      expect(html).toContain('data-translate="true"');
      expect(html).toContain('lang="sv"');
      expect(html).toContain('Bättre förutsättningar');
    });
  });

  describe('strict mode (SVSPAN_STRICT=1)', () => {
    beforeEach(() => {
      process.env.SVSPAN_STRICT = '1';
    });

    it('accepts sv without throwing', () => {
      expect(() => svSpan('text', 'sv')).not.toThrow();
    });

    it('accepts en without throwing (SV source + EN bilingual path is allowed)', () => {
      expect(() => svSpan('text', 'en')).not.toThrow();
    });

    it('throws for de with an actionable workflow-visible error', () => {
      expect(() => svSpan('text', 'de'))
        .toThrow(/svSpan\(\) called for lang=de/);
    });

    it('throws for every other non-SV/non-EN target language', () => {
      for (const lang of ['fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh', 'da', 'no', 'fi']) {
        expect(() => svSpan('text', lang), `should throw for lang=${lang}`).toThrow();
      }
    });

    it('does not throw when SVSPAN_STRICT is set to something other than "1"', () => {
      process.env.SVSPAN_STRICT = '0';
      expect(() => svSpan('text', 'de')).not.toThrow();
      process.env.SVSPAN_STRICT = 'true';
      expect(() => svSpan('text', 'de')).not.toThrow();
    });
  });
});
