import { describe, it, expect } from 'vitest';
import {
  CSV_SOURCES,
  RIKSDAG_PARTIES,
  COMMITTEE_ORG_CODES,
  COMMITTEE_DOCS_PER_MEETING_ESTIMATE
} from '../src/browser/cia/sources.js';

describe('CIA sources configuration', () => {
  it('exposes a non-empty local path and description for every CSV source', () => {
    const entries = Object.entries(CSV_SOURCES);
    // Acceptance criterion: at least 25 source definitions (currently 26).
    expect(entries.length).toBe(26);

    for (const [key, def] of entries) {
      expect(def.local, `${key}.local should be a non-empty string`).toBeTypeOf('string');
      expect(def.local.length, `${key}.local should not be empty`).toBeGreaterThan(0);
      expect(def.local, `${key}.local should look like a CSV path`).toMatch(/\.csv$/);
      expect(def.description, `${key}.description should be a non-empty string`).toBeTypeOf('string');
      expect(def.description.length, `${key}.description should not be empty`).toBeGreaterThan(0);
    }
  });

  it('uses unique local paths across all sources', () => {
    const paths = Object.values(CSV_SOURCES).map(s => s.local);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it('declares the 8 Swedish Riksdag parties', () => {
    expect(RIKSDAG_PARTIES).toEqual(['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP']);
  });

  it('maps committee names to short org codes', () => {
    expect(COMMITTEE_ORG_CODES['Konstitutionsutskottet']).toBe('KU');
    expect(COMMITTEE_ORG_CODES['Finansutskottet']).toBe('FiU');
    expect(COMMITTEE_ORG_CODES['Försvarsutskottet']).toBe('FöU');
    expect(Object.keys(COMMITTEE_ORG_CODES).length).toBeGreaterThanOrEqual(15);
  });

  it('exposes a positive committee meetings divisor', () => {
    expect(COMMITTEE_DOCS_PER_MEETING_ESTIMATE).toBeGreaterThan(0);
    expect(Number.isFinite(COMMITTEE_DOCS_PER_MEETING_ESTIMATE)).toBe(true);
  });
});
