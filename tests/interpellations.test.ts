/**
 * Unit Tests for Interpellations Content Generator
 * Validates:
 * - Output does not contain motion/proposition-specific phrasing
 * - Interpellations label keys exist for all 14 languages
 * - Party rendering and coalition dynamics work correctly
 * - Empty state renders appropriately
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  generateArticleContent,
  CONTENT_LABELS,
} from '../scripts/data-transformers.js';
import type { Language } from '../scripts/types/language.js';

const ALL_LANGUAGES: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/** Mock interpellation document */
interface MockInterpellation {
  titel?: string;
  title?: string;
  url?: string;
  parti?: string;
  dokumentnamn?: string;
  dok_id?: string;
  intressent_namn?: string;
  author?: string;
  summary?: string;
  datum?: string;
  mottagare?: string;
}

describe('Interpellations Content Generator', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Content labels', () => {
    const INTERPELLATION_KEYS = [
      'noInterpellations',
      'interpellationDefault',
      'interpellationsBreakdown',
      'readFullInterpellation',
      'partyInterpellationsFiled',
      'interpellationStrategyContext',
    ] as const;

    ALL_LANGUAGES.forEach((lang) => {
      INTERPELLATION_KEYS.forEach((key) => {
        it(`should have "${key}" label for ${lang}`, () => {
          const labels = CONTENT_LABELS[lang];
          expect(labels).toBeDefined();
          expect((labels as unknown as Record<string, unknown>)[key]).toBeDefined();
        });
      });
    });

    it('should have function-valued interpellationsBreakdown for en', () => {
      const fn = CONTENT_LABELS.en.interpellationsBreakdown;
      expect(typeof fn).toBe('function');
      expect(fn(3)).toContain('3');
    });

    it('should have function-valued interpellationStrategyContext for en', () => {
      const fn = CONTENT_LABELS.en.interpellationStrategyContext;
      expect(typeof fn).toBe('function');
      const result = fn(4);
      expect(result).toContain('4');
    });

    it('should have function-valued partyInterpellationsFiled for en', () => {
      const fn = CONTENT_LABELS.en.partyInterpellationsFiled;
      expect(typeof fn).toBe('function');
      const result = fn('S', 2);
      expect(result).toContain('S');
      expect(result).toContain('2');
      expect(result).toContain('interpellation');
      expect(result).not.toContain('motion');
    });
  });

  describe('Output content', () => {
    it('should generate interpellations content with interpellation-specific heading', () => {
      const data = {
        interpellations: [
          {
            titel: 'Om sjukvårdsförsörjning till statsrådet',
            parti: 'V',
            url: 'https://riksdagen.se/ip1',
            dokumentnamn: 'IP 2025/26:1',
            intressent_namn: 'Test Person',
            mottagare: 'Socialministern',
          },
          {
            titel: 'Om klimatpolitik till statsrådet',
            parti: 'S',
            url: 'https://riksdagen.se/ip2',
            dokumentnamn: 'IP 2025/26:2',
            intressent_namn: 'Other Person',
            mottagare: 'Miljöministern',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;

      // Should contain interpellations-specific content
      expect(result).toContain('Interpellation');
      expect(result).toContain('interpellation-entry');

      // Should NOT contain motion-specific phrasing
      expect(result).not.toContain('Opposition Motions');
      expect(result).not.toContain('Read the full motion');
      expect(result).not.toContain('motion-entry');
    });

    it('should use interpellations-specific party count in coalition dynamics', () => {
      const data = {
        interpellations: [
          { titel: 'IP 1', parti: 'V', url: '#', dokumentnamn: 'IP1' },
          { titel: 'IP 2', parti: 'S', url: '#', dokumentnamn: 'IP2' },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // Coalition dynamics should say "interpellations filed" not "motions filed"
      expect(result).toContain('interpellation');
      expect(result).not.toMatch(/\d+ motion[s]? filed/);
    });

    it('should render parliamentary oversight strategy for multi-party interpellations', () => {
      const data = {
        interpellations: [
          { titel: 'IP 1', parti: 'V', url: '#', dokumentnamn: 'IP1' },
          { titel: 'IP 2', parti: 'S', url: '#', dokumentnamn: 'IP2' },
          { titel: 'IP 3', parti: 'M', url: '#', dokumentnamn: 'IP3' },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // Should contain multi-party strategy context
      expect(result).toContain('Opposition Strategy');
    });
  });

  describe('Empty state', () => {
    it('should show no-interpellations message when empty', () => {
      const data = { interpellations: [] as MockInterpellation[] };
      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('No interpellations');
    });

    it('should show Swedish no-interpellations message', () => {
      const data = { interpellations: [] as MockInterpellation[] };
      const result = generateArticleContent(data, 'interpellations', 'sv') as string;
      expect(result).toContain('Inga interpellationer');
    });
  });

  describe('Data contract', () => {
    it('should use data.interpellations when provided', () => {
      const data = {
        interpellations: [
          {
            titel: 'Interpellation from interpellations field',
            url: '#',
            dokumentnamn: 'IP-DOC1',
            parti: 'M',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('Interpellation from interpellations field');
      expect(result).not.toContain('No interpellations');
    });

    it('should show empty state when interpellations array is empty', () => {
      const data = {
        interpellations: [] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('No interpellations');
    });
  });

  describe('Analytical lede', () => {
    it('should include analytical lede with document count', () => {
      const data = {
        interpellations: [
          { titel: 'IP 1', parti: 'V', url: '#', dokumentnamn: 'IP1' },
          { titel: 'IP 2', parti: 'S', url: '#', dokumentnamn: 'IP2' },
          { titel: 'IP 3', parti: 'M', url: '#', dokumentnamn: 'IP3' },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('article-lede');
      expect(result).toContain('3');
    });
  });

  describe('Policy analysis', () => {
    it('should render ip-specific policy analysis text (not committee review)', () => {
      const data = {
        interpellations: [
          {
            titel: 'Interpellation om vård',
            parti: 'V',
            url: '#',
            dokumentnamn: 'IP1',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // The ip-specific policy analysis should reference accountability, not committee review
      expect(result).not.toContain('Requires committee review');
    });
  });
});
