/**
 * Unit Tests for Interpellations Content Generator
 * Validates:
 * - Output does not contain motion/proposition-specific phrasing
 * - Minister target extraction does not misparse titles like "... till Gaza"
 * - Interpellations label keys exist for all 14 languages
 * - Party rendering skips missing/unknown parties (no "OTHER")
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
      'debateDynamics',
      'ministerAccountability',
      'accountabilityAnalysis',
      'readFullInterpellation',
      'interpellationBy',
      'interpellationsScrutinyContext',
      'interpellationsAccountabilityContext',
      'partyInterpellationsFiled',
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

    it('should have function-valued interpellationsScrutinyContext for en', () => {
      const fn = CONTENT_LABELS.en.interpellationsScrutinyContext;
      expect(typeof fn).toBe('function');
      const result = fn(4);
      expect(result).toContain('4');
      expect(result).not.toContain('Motion');
      expect(result).not.toContain('motion');
    });

    it('should have function-valued interpellationsAccountabilityContext for en', () => {
      const fn = CONTENT_LABELS.en.interpellationsAccountabilityContext;
      expect(typeof fn).toBe('function');
      const result = fn(5, 3);
      expect(result).toContain('5');
      expect(result).toContain('3');
      expect(result).not.toContain('proposition');
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

    it('ministerAccountability should NOT say "Minister Response" in en', () => {
      expect(CONTENT_LABELS.en.ministerAccountability).not.toContain('Response');
      expect(CONTENT_LABELS.en.ministerAccountability).toContain('Directed');
    });

    it('ministerAccountability should NOT say "Ministersvar" in sv', () => {
      expect(CONTENT_LABELS.sv.ministerAccountability).not.toContain('Ministersvar');
      expect(CONTENT_LABELS.sv.ministerAccountability).toContain('Riktat');
    });
  });

  describe('Output content', () => {
    it('should generate interpellations content without motion phrasing', () => {
      const data = {
        motions: [
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
      expect(result).toContain('Debate Dynamics');
      expect(result).toContain('Accountability Analysis');

      // Should NOT contain motion-specific phrasing
      expect(result).not.toContain('Opposition Motions');
      expect(result).not.toContain('Read the full motion');
      expect(result).not.toContain('motion-entry');
      // Should not use the motions-specific "Motions from X parties" label
      expect(result).not.toMatch(/Motions from \d+ different parties/);
    });

    it('should not contain proposition-specific phrasing in accountability section', () => {
      const data = {
        motions: [
          {
            titel: 'Om försvaret till statsrådet',
            parti: 'M',
            url: 'https://riksdagen.se/ip3',
            dokumentnamn: 'IP 2025/26:3',
            intressent_namn: 'Defense Person',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // Should not reference propositions in the accountability section
      expect(result).not.toContain('propositions touch on');
      expect(result).not.toContain('legislative ambition');
    });

    it('should use interpellations-specific party count label', () => {
      const data = {
        motions: [
          { titel: 'IP 1', parti: 'V', url: '#', dokumentnamn: 'IP1' },
          { titel: 'IP 2', parti: 'S', url: '#', dokumentnamn: 'IP2' },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // Coalition dynamics should say "interpellations filed" not "motions filed"
      expect(result).toContain('interpellation');
      expect(result).not.toMatch(/\d+ motion[s]? filed/);
    });
  });

  describe('Minister target extraction', () => {
    it('should extract target from mottagare field', () => {
      const data = {
        motions: [
          {
            titel: 'Fråga om humanitär hjälp till Gaza',
            parti: 'V',
            url: '#',
            dokumentnamn: 'IP1',
            mottagare: 'Utrikesministern',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('Utrikesministern');
    });

    it('should NOT extract "Gaza" as minister from title "... till Gaza"', () => {
      const data = {
        motions: [
          {
            titel: 'Humanitär hjälp till Gaza – en fråga om solidaritet',
            parti: 'V',
            url: '#',
            dokumentnamn: 'IP1',
            // No mottagare field
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // Should NOT show "Gaza" as a minister target
      expect(result).not.toContain('Directed to</strong> Gaza');
      expect(result).not.toContain('Directed to:</strong> Gaza');
    });

    it('should extract target from "till X statsråd" pattern', () => {
      const data = {
        motions: [
          {
            titel: 'Interpellation till justitie- och inrikesminister',
            parti: 'SD',
            url: '#',
            dokumentnamn: 'IP1',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // The regex should match "till justitie- och inrikes" before "minister"
      expect(result).toContain('Directed to');
    });

    it('should extract full compound minister title like "utrikesminister"', () => {
      const data = {
        motions: [
          {
            titel: 'Fråga till utrikesministern om bistånd',
            parti: 'V',
            url: '#',
            dokumentnamn: 'IP2',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // The regex should capture "utrikesministern" — not just "utrikes"
      expect(result).toContain('utrikesministern');
    });

    it('should extract full compound "finansministern" target', () => {
      const data = {
        motions: [
          {
            titel: 'Interpellation till finansministern',
            parti: 'M',
            url: '#',
            dokumentnamn: 'IP3',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('finansministern');
    });
  });

  describe('Party rendering', () => {
    it('should NOT display "OTHER" when party is missing', () => {
      const data = {
        motions: [
          {
            titel: 'Test interpellation',
            url: '#',
            dokumentnamn: 'IP1',
            intressent_namn: 'Some Author',
            // parti is not set
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).not.toContain('OTHER');
    });

    it('should NOT display "OTHER" when party is "Unknown"', () => {
      const data = {
        motions: [
          {
            titel: 'Test interpellation',
            url: '#',
            dokumentnamn: 'IP1',
            intressent_namn: 'Some Author',
            parti: 'Unknown',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).not.toContain('OTHER');
      expect(result).not.toContain('UNKNOWN');
    });

    it('should display actual party when present', () => {
      const data = {
        motions: [
          {
            titel: 'Test interpellation',
            url: '#',
            dokumentnamn: 'IP1',
            intressent_namn: 'Some Author',
            parti: 'V',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('Party:</strong> V');
    });
  });

  describe('Empty state', () => {
    it('should show no-interpellations message when empty', () => {
      const data = { motions: [] as MockInterpellation[] };
      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('No interpellations');
    });
  });

  describe('Author sentinel filtering', () => {
    it('should NOT display "Unknown" as author name', () => {
      const data = {
        motions: [
          {
            titel: 'Test interpellation',
            url: '#',
            dokumentnamn: 'IP1',
            intressent_namn: 'Unknown',
            parti: 'V',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      // Should not render the sentinel value "Unknown" to readers
      expect(result).not.toContain('Interpellation by:</strong> Unknown');
    });

    it('should NOT display "unknown" (lowercase) as author name', () => {
      const data = {
        motions: [
          {
            titel: 'Test interpellation',
            url: '#',
            dokumentnamn: 'IP1',
            author: 'unknown',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).not.toContain('Interpellation by:</strong> unknown');
    });

    it('should display real author names', () => {
      const data = {
        motions: [
          {
            titel: 'Test interpellation',
            url: '#',
            dokumentnamn: 'IP1',
            intressent_namn: 'Anna Andersson',
            parti: 'S',
          },
        ] as MockInterpellation[],
      };

      const result = generateArticleContent(data, 'interpellations', 'en') as string;
      expect(result).toContain('Interpellation by:</strong> Anna Andersson');
    });
  });
});
