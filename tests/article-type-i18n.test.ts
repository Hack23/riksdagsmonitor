/**
 * Unit tests for `scripts/render-lib/article-type-i18n.ts`.
 *
 * Verifies the per-language article-type label map covers all 14 languages
 * for every registry id + legacy fallback id, and that the helper falls
 * back to the supplied English label when no translation is registered.
 */

import { describe, expect, it } from 'vitest';

import { ARTICLE_TYPE_LABEL_I18N, articleTypeLabel } from '../scripts/render-lib/article-type-i18n.js';
import { loadArticleTypesRegistry } from '../scripts/render-lib/article-types.js';
import type { Language } from '../scripts/types/language.js';

const ALL_LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
];

describe('article-type-i18n', () => {
  describe('coverage', () => {
    it('every map entry covers all 14 languages with a non-empty string', () => {
      for (const [typeId, langMap] of Object.entries(ARTICLE_TYPE_LABEL_I18N)) {
        for (const lang of ALL_LANGUAGES) {
          const value = langMap[lang];
          expect(value, `missing translation for [${typeId}, ${lang}]`).toBeTruthy();
          expect(typeof value).toBe('string');
          expect(value.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('every registry article-type id has a localised label map', () => {
      const reg = loadArticleTypesRegistry();
      for (const entry of reg.types) {
        expect(
          ARTICLE_TYPE_LABEL_I18N[entry.id],
          `registry id "${entry.id}" missing from ARTICLE_TYPE_LABEL_I18N`,
        ).toBeDefined();
      }
    });
  });

  describe('articleTypeLabel()', () => {
    it('returns the localised label when both type and language are registered', () => {
      expect(articleTypeLabel('propositions', 'sv', 'Propositions')).toBe('Propositioner');
      expect(articleTypeLabel('committee-reports', 'de', 'Committee Reports')).toBe('Ausschussberichte');
      expect(articleTypeLabel('week-ahead', 'ja', 'Week Ahead')).toBe('今後一週間');
    });

    it('falls back to the supplied English label for unknown type ids', () => {
      expect(articleTypeLabel('not-a-real-type', 'sv', 'Custom label')).toBe('Custom label');
    });

    it('returns the English entry when lang is "en"', () => {
      expect(articleTypeLabel('motions', 'en', 'fallback')).toBe('Motions');
    });

    it('preserves RTL strings exactly (Arabic, Hebrew)', () => {
      expect(articleTypeLabel('interpellations', 'ar', 'Interpellations')).toBe('استجوابات برلمانية');
      expect(articleTypeLabel('interpellations', 'he', 'Interpellations')).toBe('שאילתות בוחנות');
    });
  });
});
