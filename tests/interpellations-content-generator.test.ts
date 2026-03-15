/**
 * Unit Tests for Interpellations Content Generator
 *
 * Tests the dedicated interpellations content generator to ensure:
 * - Correct heading (interpellationsTag, not oppMotions)
 * - Minister-focused grouping
 * - Interpellation-specific labels (interpellationBy, targetMinister)
 * - Correct routing in generateArticleContent dispatcher
 * - All 14 languages produce valid output
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateArticleContent } from '../scripts/data-transformers.js';
import { generateInterpellationsContent } from '../scripts/data-transformers/content-generators/interpellations.js';
import { CONTENT_LABELS } from '../scripts/data-transformers/constants/index.js';
import type { Language } from '../scripts/types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', 'scripts', 'prompts', 'v1');

const LANGUAGES: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/** Sample interpellation documents */
const sampleInterpellations = [
  {
    titel: 'Interpellation om sjukvårdens finansiering',
    dok_id: 'IP1234',
    parti: 'S',
    intressent_namn: 'Anna Lindberg',
    mottagare: 'Socialminister Jakob Forssmed',
    url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/interpellation/IP1234',
    datum: '2026-03-10',
  },
  {
    titel: 'Interpellation om försvarsbudgeten',
    dok_id: 'IP1235',
    parti: 'V',
    intressent_namn: 'Peter Lundgren',
    mottagare: 'Försvarsminister Pål Jonson',
    url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/interpellation/IP1235',
    datum: '2026-03-11',
  },
  {
    titel: 'Interpellation om skolresultaten',
    dok_id: 'IP1236',
    parti: 'S',
    intressent_namn: 'Maria Stenholm',
    mottagare: 'Skolminister Lotta Edholm',
    url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/interpellation/IP1236',
    datum: '2026-03-12',
  },
];

describe('Interpellations Content Generator', () => {
  describe('Dedicated generator output', () => {
    it('should use interpellationsTag heading, not oppMotions', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      expect(content).toContain('Interpellation Debates');
      expect(content).not.toContain('Opposition Motions');
    });

    it('should use interpellationsTag heading in Swedish', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'sv');
      expect(content).toContain('Interpellationsdebatter');
      expect(content).not.toContain('Oppositionens motioner');
    });

    it('should use interpellationsTag heading in German', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'de');
      expect(content).toContain('Interpellationsdebatten');
      expect(content).not.toContain('Oppositionsanträge');
    });

    it('should group interpellations by target minister', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      expect(content).toContain('Socialminister Jakob Forssmed');
      expect(content).toContain('Försvarsminister Pål Jonson');
      expect(content).toContain('Skolminister Lotta Edholm');
    });

    it('should show ministerial accountability section heading', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      expect(content).toContain('Ministerial Accountability');
    });

    it('should show interpellationsBreakdown lede paragraph', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      expect(content).toContain('3 interpellations');
      expect(content).toContain('ministerial accountability');
    });

    it('should use readFullInterpellation, not readFullMotion link text', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      // Interpellation-specific link text must be present
      expect(content).toContain('View interpellation');
      // Motion-specific link text must NOT appear in interpellation articles
      expect(content).not.toContain('Read the full motion');
    });

    it('should show opposition oversight section', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      expect(content).toContain('Opposition Oversight');
    });

    it('should show party activity in oversight section', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      // S party has 2 interpellations, V has 1
      expect(content).toContain('S');
      expect(content).toContain('V');
    });

    it('should handle empty interpellations gracefully', () => {
      const content = generateInterpellationsContent({ interpellations: [] }, 'en');
      expect(content).toContain('No interpellations available');
      expect(content).not.toContain('Ministerial Accountability');
    });

    it('should handle interpellations without mottagare field', () => {
      const noMinisterInterps = [
        {
          titel: 'Interpellation om klimatpolitiken',
          dok_id: 'IP9999',
          parti: 'MP',
          intressent_namn: 'Karin Svensson Smith',
          // No mottagare field
          url: 'https://www.riksdagen.se/sv/dokument/IP9999',
          datum: '2026-03-10',
        },
      ];
      const content = generateInterpellationsContent({ interpellations: noMinisterInterps }, 'en');
      expect(content).toContain('Interpellation');
      // Should not crash and should still render the entry
      expect(content).toContain('Karin Svensson Smith');
      // Should NOT use motion-specific "Independent Motions" heading
      expect(content).not.toContain('Independent Motions');
    });

    it('should use otherDocuments heading for unassigned interpellations when ministers exist', () => {
      const mixed = [
        ...sampleInterpellations,
        {
          titel: 'Interpellation utan mottagare',
          dok_id: 'IP9998',
          parti: 'MP',
          intressent_namn: 'Test Person',
          url: 'https://www.riksdagen.se/sv/dokument/IP9998',
          datum: '2026-03-10',
        },
      ];
      const content = generateInterpellationsContent({ interpellations: mixed }, 'en');
      expect(content).toContain('Other documents');
      expect(content).not.toContain('Independent Motions');
    });

    it('should demote entry headings to h4 under minister h3 sections', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      // Minister names should be h3
      expect(content).toMatch(/<h3>.*Socialminister.*<\/h3>/);
      // Entry titles under ministers should be h4 (demoted from h3)
      expect(content).toContain('<h4>');
      // Entries within minister sections should NOT have h3 (only h4)
      // Find content between first minister h3 and next h2/h3
      const ministerSection = content.split('<h3>')[1]; // after first minister heading
      if (ministerSection) {
        const withinSection = ministerSection.split('</h3>')[1]; // after closing the minister heading
        if (withinSection) {
          const beforeNextSection = withinSection.split('<h2>')[0] || withinSection.split('<h3>')[0] || withinSection;
          // Within a minister section, entries should use h4 not h3
          expect(beforeNextSection).toContain('<h4>');
        }
      }
    });

    it('should use partyInterpellationsFiled in oversight section, not interpellationBy', () => {
      const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, 'en');
      // Should use grammatical aggregate label like "S: 2 interpellations filed"
      expect(content).toContain('interpellations filed');
      // Should NOT use the awkward per-entry "Filed by" label in aggregate context
      const oversightSection = content.split('Opposition Oversight')[1] || '';
      expect(oversightSection).not.toMatch(/<strong>S<\/strong>: Filed by/);
    });

    it('should fall back to data.motions when data.interpellations is absent (backward compat)', () => {
      const content = generateInterpellationsContent({ motions: sampleInterpellations }, 'en');
      expect(content).toContain('Interpellation Debates');
      expect(content).toContain('Socialminister Jakob Forssmed');
    });
  });

  describe('Routing via generateArticleContent', () => {
    it('should route interpellations type to interpellations generator, not motions', () => {
      const content = generateArticleContent({ interpellations: sampleInterpellations }, 'interpellations', 'en') as string;
      expect(content).toContain('Interpellation Debates');
      expect(content).not.toContain('Opposition Motions');
    });

    it('should keep motions type using motions generator', () => {
      const content = generateArticleContent({ motions: sampleInterpellations }, 'motions', 'en') as string;
      expect(content).toContain('Opposition Motions');
      expect(content).not.toContain('Interpellation Debates');
    });

    it('should route interpellations in Swedish to interpellations generator', () => {
      const content = generateArticleContent({ interpellations: sampleInterpellations }, 'interpellations', 'sv') as string;
      expect(content).toContain('Interpellationsdebatter');
      expect(content).not.toContain('Oppositionens motioner');
    });
  });

  describe('Multi-language support', () => {
    for (const lang of LANGUAGES) {
      it(`should generate valid non-empty content in ${lang}`, () => {
        const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, lang);
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(100);
        // Should contain h2 headings
        expect(content).toContain('<h2>');
        // Should not contain "Opposition Motions" in any language (use interpellationsTag instead)
        const oppMotionsLabel = CONTENT_LABELS[lang as Language]?.oppMotions;
        if (oppMotionsLabel && typeof oppMotionsLabel === 'string') {
          expect(content).not.toContain(oppMotionsLabel);
        }
      });

      it(`should have interpellationsTag heading in ${lang}`, () => {
        const content = generateInterpellationsContent({ interpellations: sampleInterpellations }, lang);
        const tag = CONTENT_LABELS[lang as Language]?.interpellationsTag;
        if (typeof tag === 'string' && tag.length > 0) {
          expect(content).toContain(tag);
        }
      });
    }
  });

  describe('Content labels for interpellations', () => {
    it('should have noInterpellations label for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.noInterpellations, `noInterpellations label missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.noInterpellations).toBe('string');
      }
    });

    it('should have interpellationsBreakdown function for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.interpellationsBreakdown, `interpellationsBreakdown missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.interpellationsBreakdown).toBe('function');
        const result = (labels?.interpellationsBreakdown as (n: number) => string)(5);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('should have ministerAccountability label for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.ministerAccountability, `ministerAccountability missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.ministerAccountability).toBe('string');
      }
    });

    it('should have targetMinister label for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.targetMinister, `targetMinister missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.targetMinister).toBe('string');
      }
    });

    it('should have interpellationBy label for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.interpellationBy, `interpellationBy missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.interpellationBy).toBe('string');
      }
    });

    it('should have questioner label for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.questioner, `questioner missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.questioner).toBe('string');
      }
    });

    it('should have oppositionOversight label for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.oppositionOversight, `oppositionOversight missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.oppositionOversight).toBe('string');
      }
    });

    it('should have partyInterpellationsFiled function for all 14 languages', () => {
      for (const lang of LANGUAGES) {
        const labels = CONTENT_LABELS[lang as Language];
        expect(labels?.partyInterpellationsFiled, `partyInterpellationsFiled missing for ${lang}`)
          .toBeTruthy();
        expect(typeof labels?.partyInterpellationsFiled).toBe('function');
        const result = (labels?.partyInterpellationsFiled as (p: string, n: number) => string)('S', 3);
        expect(result).toBeTruthy();
        expect(result).toContain('S');
        expect(result).toContain('3');
      }
    });
  });
});

describe('Shared Prompts Library', () => {
  it('should have all required prompt files in v1/', () => {
    const requiredFiles = [
      'political-analysis.md',
      'swot-generation.md',
      'dashboard-generation.md',
      'stakeholder-perspectives.md',
      'quality-criteria.md',
    ];
    for (const file of requiredFiles) {
      expect(
        fs.existsSync(path.join(PROMPTS_DIR, file)),
        `Missing prompt file: v1/${file}`
      ).toBe(true);
    }
  });

  it('should have quality-criteria.md with scoring dimensions', () => {
    const filePath = path.join(PROMPTS_DIR, 'quality-criteria.md');
    expect(fs.existsSync(filePath), 'quality-criteria.md must exist').toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Factual Accuracy');
    expect(content).toContain('Analytical Depth');
    expect(content).toContain('Perspective Coverage');
    expect(content).toContain('Translation Quality');
    expect(content).toContain('Editorial Standards');
    expect(content).toContain('7/10'); // minimum passing score
  });

  it('should have political-analysis.md with six perspectives', () => {
    const filePath = path.join(PROMPTS_DIR, 'political-analysis.md');
    expect(fs.existsSync(filePath), 'political-analysis.md must exist').toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Government perspective');
    expect(content).toContain('Opposition perspective');
    expect(content).toContain('Citizen perspective');
    expect(content).toContain('Economic perspective');
    expect(content).toContain('International perspective');
    expect(content).toContain('Media');
  });

  it('should have stakeholder-perspectives.md with party attribution standards', () => {
    const filePath = path.join(PROMPTS_DIR, 'stakeholder-perspectives.md');
    expect(fs.existsSync(filePath), 'stakeholder-perspectives.md must exist').toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('2 parties cited');
    expect(content).toContain('opposition');
  });
});
