/**
 * Unit tests for the Swedish institutional keyword expansion tables.
 *
 * Covers:
 *  - `AGENCY_ACRONYM_MAP` / `expandAgencyAcronyms` — bidirectional
 *    full-name ↔ acronym expansion, de-duplication, and order
 *    preservation.
 *  - `COMMITTEE_DOMAIN_MAP` / `expandCommitteeDomains` — per-language
 *    domain-word emission and graceful fallback for unknown codes.
 */

import { describe, it, expect } from 'vitest';

import {
  AGENCY_ACRONYM_MAP,
  COMMITTEE_DOMAIN_MAP,
  expandAgencyAcronyms,
  expandCommitteeDomains,
} from '../scripts/render-lib/aggregator/seo/sv-keyword-mappings.js';

describe('AGENCY_ACRONYM_MAP', () => {
  it('contains every high-frequency Swedish agency', () => {
    const fullNames = AGENCY_ACRONYM_MAP.map(([full]) => full);
    expect(fullNames).toContain('Försäkringskassan');
    expect(fullNames).toContain('Skatteverket');
    expect(fullNames).toContain('Säkerhetspolisen');
  });

  it('uses non-empty acronyms with sensible length', () => {
    for (const [full, acronym] of AGENCY_ACRONYM_MAP) {
      expect(full.length).toBeGreaterThan(2);
      expect(acronym.length).toBeGreaterThan(0);
      expect(acronym.length).toBeLessThan(6);
    }
  });
});

describe('expandAgencyAcronyms', () => {
  it('emits the acronym when the full name is mentioned', () => {
    const out = expandAgencyAcronyms(['Försäkringskassan']);
    expect(out).toEqual(['FK']);
  });

  it('emits the full name when the acronym is mentioned', () => {
    const out = expandAgencyAcronyms(['SÄPO']);
    expect(out).toEqual(['Säkerhetspolisen']);
  });

  it('skips unknown agencies', () => {
    const out = expandAgencyAcronyms(['SomeUnknownAgency', 'Tidö Coalition']);
    expect(out).toEqual([]);
  });

  it('does not duplicate when both forms are already in input', () => {
    const out = expandAgencyAcronyms(['Försäkringskassan', 'FK']);
    expect(out).toEqual([]);
  });

  it('preserves order of input entities', () => {
    const out = expandAgencyAcronyms(['Migrationsverket', 'Skatteverket']);
    expect(out).toEqual(['MIG', 'SKV']);
  });

  it('is case-insensitive on the lookup key', () => {
    const out = expandAgencyAcronyms(['skatteverket']);
    expect(out).toEqual(['SKV']);
  });
});

describe('COMMITTEE_DOMAIN_MAP', () => {
  it('covers every Riksdag committee code', () => {
    const required = ['AU', 'CU', 'EU', 'FiU', 'FöU', 'JuU', 'KU', 'KrU', 'MJU', 'NU', 'RU', 'SfU', 'SkU', 'SoU', 'TU', 'UU', 'UbU', 'UFöU'];
    for (const code of required) {
      expect(COMMITTEE_DOMAIN_MAP[code]).toBeDefined();
    }
  });

  it('emits a localized lemma in every supported language', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
    for (const lang of langs) {
      expect(COMMITTEE_DOMAIN_MAP.JuU[lang]).toBeTruthy();
    }
  });
});

describe('expandCommitteeDomains', () => {
  it('emits the English domain word for JuU when lang=en', () => {
    expect(expandCommitteeDomains(['JuU'], 'en')).toEqual(['Justice']);
  });

  it('emits the Swedish lemma when lang=sv', () => {
    expect(expandCommitteeDomains(['JuU'], 'sv')).toEqual(['rättsväsen']);
  });

  it('emits the Japanese lemma for FiU when lang=ja', () => {
    expect(expandCommitteeDomains(['FiU'], 'ja')).toEqual(['財政']);
  });

  it('de-duplicates when the same code appears twice', () => {
    expect(expandCommitteeDomains(['JuU', 'JuU'], 'en')).toEqual(['Justice']);
  });

  it('preserves input order across distinct codes', () => {
    const out = expandCommitteeDomains(['FiU', 'JuU', 'AU'], 'en');
    expect(out).toEqual(['Finance', 'Justice', 'Labour Market']);
  });

  it('silently skips unknown committee codes', () => {
    expect(expandCommitteeDomains(['ZZZ', 'JuU'], 'en')).toEqual(['Justice']);
  });
});
