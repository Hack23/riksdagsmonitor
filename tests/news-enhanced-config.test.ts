/**
 * Unit Tests for generate-news-enhanced/config.ts
 *
 * Tests CLI argument parsing, language configuration, quality thresholds,
 * analysis depth parsing, and shared state exports.
 *
 * Since config.ts has side effects at import time (reads process.argv, creates
 * directories), we mock dependencies and import the module once in a top-level
 * beforeAll so all tests share the same config instance.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Module-level mocks (applied before import)
// ---------------------------------------------------------------------------

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readdirSync: vi.fn().mockReturnValue([]),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('{}'),
  },
  existsSync: vi.fn().mockReturnValue(true),
  readdirSync: vi.fn().mockReturnValue([]),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue('{}'),
}));

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: vi.fn().mockImplementation(() => ({
    baseURL: 'http://mock:3000',
    timeout: 30000,
    request: vi.fn().mockResolvedValue({ last_sync: new Date().toISOString() }),
  })),
}));

// ---------------------------------------------------------------------------
// Import config (with default process.argv — no CLI args)
// ---------------------------------------------------------------------------

let config: typeof import('../scripts/generate-news-enhanced/config.js');

beforeAll(async () => {
  config = await import('../scripts/generate-news-enhanced/config.js');
});

// ---------------------------------------------------------------------------
// Constants & exports
// ---------------------------------------------------------------------------

describe('generate-news-enhanced/config — ALL_LANGUAGES', () => {
  it('exports 14 languages', () => {
    expect(config.ALL_LANGUAGES).toHaveLength(14);
  });

  it('includes English and Swedish', () => {
    expect(config.ALL_LANGUAGES).toContain('en');
    expect(config.ALL_LANGUAGES).toContain('sv');
  });

  it('includes RTL languages (ar, he)', () => {
    expect(config.ALL_LANGUAGES).toContain('ar');
    expect(config.ALL_LANGUAGES).toContain('he');
  });

  it('includes CJK languages (ja, ko, zh)', () => {
    expect(config.ALL_LANGUAGES).toContain('ja');
    expect(config.ALL_LANGUAGES).toContain('ko');
    expect(config.ALL_LANGUAGES).toContain('zh');
  });

  it('includes Nordic languages (da, no, fi)', () => {
    expect(config.ALL_LANGUAGES).toContain('da');
    expect(config.ALL_LANGUAGES).toContain('no');
    expect(config.ALL_LANGUAGES).toContain('fi');
  });

  it('includes EU-core languages (de, fr, es, nl)', () => {
    expect(config.ALL_LANGUAGES).toContain('de');
    expect(config.ALL_LANGUAGES).toContain('fr');
    expect(config.ALL_LANGUAGES).toContain('es');
    expect(config.ALL_LANGUAGES).toContain('nl');
  });
});

describe('generate-news-enhanced/config — VALID_ARTICLE_TYPES', () => {
  it('contains week-ahead', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('week-ahead');
  });

  it('contains committee-reports', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('committee-reports');
  });

  it('contains propositions', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('propositions');
  });

  it('contains motions', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('motions');
  });

  it('contains interpellations', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('interpellations');
  });

  it('contains breaking', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('breaking');
  });

  it('contains deep-inspection', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('deep-inspection');
  });

  it('contains month-ahead', () => {
    expect(config.VALID_ARTICLE_TYPES).toContain('month-ahead');
  });
});

describe('generate-news-enhanced/config — LANGUAGE_PRESETS', () => {
  it('has "all" preset with 14 languages', () => {
    expect(config.LANGUAGE_PRESETS['all']).toHaveLength(14);
  });

  it('has "nordic" preset with 5 languages', () => {
    expect(config.LANGUAGE_PRESETS['nordic']).toHaveLength(5);
    expect(config.LANGUAGE_PRESETS['nordic']).toContain('en');
    expect(config.LANGUAGE_PRESETS['nordic']).toContain('sv');
    expect(config.LANGUAGE_PRESETS['nordic']).toContain('da');
    expect(config.LANGUAGE_PRESETS['nordic']).toContain('no');
    expect(config.LANGUAGE_PRESETS['nordic']).toContain('fi');
  });

  it('has "eu-core" preset with 6 languages', () => {
    expect(config.LANGUAGE_PRESETS['eu-core']).toHaveLength(6);
    expect(config.LANGUAGE_PRESETS['eu-core']).toContain('en');
    expect(config.LANGUAGE_PRESETS['eu-core']).toContain('sv');
    expect(config.LANGUAGE_PRESETS['eu-core']).toContain('de');
    expect(config.LANGUAGE_PRESETS['eu-core']).toContain('fr');
  });
});

describe('generate-news-enhanced/config — quality thresholds', () => {
  it('DEFAULT quality threshold is 40', () => {
    expect(config.QUALITY_THRESHOLD).toBe(40);
  });

  it('multi-dimensional quality threshold is 60', () => {
    expect(config.MULTIDIM_QUALITY_THRESHOLD).toBe(60);
  });
});

describe('generate-news-enhanced/config — default CLI state', () => {
  it('articleTypes defaults to ["week-ahead"] with no --types', () => {
    expect(config.articleTypes).toEqual(['week-ahead']);
  });

  it('dryRunArg is false by default', () => {
    expect(config.dryRunArg).toBe(false);
  });

  it('skipExistingArg is false by default', () => {
    expect(config.skipExistingArg).toBe(false);
  });

  it('batchSize is 0 by default', () => {
    expect(config.batchSize).toBe(0);
  });

  it('requireMcp is true by default', () => {
    expect(config.requireMcp).toBe(true);
  });

  it('analysisDepth defaults to 1', () => {
    expect(config.analysisDepth).toBe(1);
  });

  it('analysisIterations defaults to 3', () => {
    expect(config.analysisIterations).toBe(3);
  });

  it('analysisMode defaults to "standard"', () => {
    expect(config.analysisMode).toBe('standard');
  });

  it('documentIds is empty array by default', () => {
    expect(config.documentIds).toEqual([]);
  });

  it('documentUrls is empty array by default', () => {
    expect(config.documentUrls).toEqual([]);
  });

  it('focusTopic is empty string by default', () => {
    expect(config.focusTopic).toBe('');
  });
});

describe('generate-news-enhanced/config — toISODate', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    expect(config.toISODate(new Date('2026-03-15T12:00:00Z'))).toBe('2026-03-15');
  });

  it('handles midnight UTC boundary', () => {
    expect(config.toISODate(new Date('2026-12-31T00:00:00Z'))).toBe('2026-12-31');
  });

  it('handles leap year date', () => {
    expect(config.toISODate(new Date('2028-02-29T10:30:00Z'))).toBe('2028-02-29');
  });
});

describe('generate-news-enhanced/config — stats object', () => {
  it('exports stats with expected shape', () => {
    expect(config.stats).toBeDefined();
    expect(config.stats.generated).toBe(0);
    expect(config.stats.errors).toBe(0);
    expect(Array.isArray(config.stats.articles)).toBe(true);
    expect(typeof config.stats.timestamp).toBe('string');
    expect(Array.isArray(config.stats.qualityScores)).toBe(true);
  });
});

describe('generate-news-enhanced/config — getSharedClient', () => {
  it('exports getSharedClient as an async function', () => {
    expect(typeof config.getSharedClient).toBe('function');
  });
});
