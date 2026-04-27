/**
 * Statskontoret enrichment layer contract tests.
 *
 * Validates:
 * - data/statskontoret/index.json structure and required fields
 * - implementation-feasibility.md template contains required Statskontoret evidence hooks
 * - download-parliamentary-data parseArgs handles --auto-full-text-top-n
 * - graceful degradation when enrichment limit is 0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../scripts/download-parliamentary-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// data/statskontoret/index.json contract
// ---------------------------------------------------------------------------

interface StatskontoretIndexEntry {
  title: string;
  year: number;
  agency: string;
  summary: string;
  url: string;
  admiralty_grade: string;
  cached_at: string;
}

interface StatskontoretIndex {
  version: string;
  source: string;
  classification: string;
  cache_ttl_days: number;
  description: string;
  generated_at: string;
  entries: StatskontoretIndexEntry[];
}

function readStatskontoretIndex(): StatskontoretIndex {
  return JSON.parse(
    readFileSync(resolve(repoRoot, 'data/statskontoret/index.json'), 'utf-8'),
  ) as StatskontoretIndex;
}

describe('data/statskontoret/index.json', () => {
  const idx = readStatskontoretIndex();

  it('declares source as Statskontoret with Public classification', () => {
    expect(idx.source).toMatch(/Statskontoret/i);
    expect(idx.classification).toBe('Public');
    expect(idx.version).toBeTruthy();
  });

  it('specifies a 30-day cache TTL', () => {
    expect(idx.cache_ttl_days).toBe(30);
  });

  it('contains at least one entry', () => {
    expect(idx.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('each entry has required fields with valid formats', () => {
    for (const entry of idx.entries) {
      expect(typeof entry.title).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.year).toBe('number');
      expect(entry.year).toBeGreaterThan(2000);
      expect(typeof entry.agency).toBe('string');
      expect(entry.agency.length).toBeGreaterThan(0);
      expect(typeof entry.summary).toBe('string');
      expect(entry.summary.length).toBeGreaterThan(10);
      expect(entry.url).toMatch(/^https?:\/\/www\.statskontoret\.se\//);
      expect(entry.admiralty_grade).toMatch(/^[A-F][1-6]$/);
      expect(entry.cached_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it('covers known high-priority agencies', () => {
    const agencies = idx.entries.map(e => e.agency);
    // At least one catch-all cross-agency entry should be present
    expect(agencies.some(a => a === '*')).toBe(true);
    // At least one entry should target a specific named agency
    expect(agencies.some(a => a !== '*')).toBe(true);
  });

  it('entries with named agencies target recognised Swedish authorities', () => {
    const KNOWN_AGENCIES = new Set([
      '*',
      'Kriminalvården',
      'Polismyndigheten',
      'Försäkringskassan',
      'Skatteverket',
      'Migrationsverket',
      'Arbetsförmedlingen',
      'Socialstyrelsen',
      'Transportstyrelsen',
      'Transportverket',
      'Naturvårdsverket',
      'Energimyndigheten',
    ]);
    for (const entry of idx.entries) {
      expect(KNOWN_AGENCIES.has(entry.agency)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// implementation-feasibility.md template: Statskontoret hooks
// ---------------------------------------------------------------------------

describe('analysis/templates/implementation-feasibility.md', () => {
  const templatePath = resolve(repoRoot, 'analysis/templates/implementation-feasibility.md');
  const content = readFileSync(templatePath, 'utf-8');

  it('includes a Statskontoret relevance field in the Feasibility Context table', () => {
    expect(content).toMatch(/Statskontoret relevance/i);
  });

  it('includes a Statskontoret overlay instruction in the Administrative section', () => {
    expect(content).toMatch(/Statskontoret overlay/i);
  });

  it('references statskontoret in at least one evidence guidance note', () => {
    expect(content.toLowerCase()).toContain('statskontoret');
  });
});

// ---------------------------------------------------------------------------
// download-parliamentary-data: --auto-full-text-top-n parsing
// ---------------------------------------------------------------------------

describe('parseArgs --auto-full-text-top-n', () => {
  const BASE_ARGV = ['node', 'download-parliamentary-data.ts'];

  it('returns null when flag is absent', () => {
    const args = parseArgs([...BASE_ARGV, '--date', '2026-04-27']);
    expect(args.autoFullTextTopN).toBeNull();
  });

  it('parses integer value correctly', () => {
    const args = parseArgs([...BASE_ARGV, '--date', '2026-04-27', '--auto-full-text-top-n', '2']);
    expect(args.autoFullTextTopN).toBe(2);
  });

  it('parses 0 (graceful-degradation: disable enrichment)', () => {
    const args = parseArgs([...BASE_ARGV, '--date', '2026-04-27', '--auto-full-text-top-n', '0']);
    expect(args.autoFullTextTopN).toBe(0);
  });

  it('parses larger values', () => {
    const args = parseArgs([...BASE_ARGV, '--auto-full-text-top-n', '10']);
    expect(args.autoFullTextTopN).toBe(10);
  });

  it('throws for non-integer float value', () => {
    expect(() =>
      parseArgs([...BASE_ARGV, '--auto-full-text-top-n', '1.5']),
    ).toThrow(/Invalid --auto-full-text-top-n/);
  });

  it('throws for negative value', () => {
    expect(() =>
      parseArgs([...BASE_ARGV, '--auto-full-text-top-n', '-1']),
    ).toThrow(/Invalid --auto-full-text-top-n/);
  });

  it('throws for non-numeric string', () => {
    expect(() =>
      parseArgs([...BASE_ARGV, '--auto-full-text-top-n', 'abc']),
    ).toThrow(/Invalid --auto-full-text-top-n/);
  });

  it('does not affect other parsed fields', () => {
    const args = parseArgs([...BASE_ARGV, '--date', '2026-04-27', '--limit', '5', '--auto-full-text-top-n', '2']);
    expect(args.limit).toBe(5);
    expect(args.date).toBe('2026-04-27');
    expect(args.autoFullTextTopN).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Graceful-degradation: --auto-full-text-top-n=0 disables enrichment
// ---------------------------------------------------------------------------

describe('graceful degradation: --auto-full-text-top-n=0', () => {
  it('parseArgs returns autoFullTextTopN=0 which maps to enrichLimit=0 (no enrichment)', () => {
    const args = parseArgs(['node', 'script', '--auto-full-text-top-n', '0']);
    // enrichLimit=0 is the signal to downloadAllDocuments to skip all enrichment,
    // providing graceful degradation when full-text fetch is unavailable.
    expect(args.autoFullTextTopN).toBe(0);
  });

  it('default (no flag) leaves autoFullTextTopN null, meaning downloadAllDocuments uses MAX_ENRICHMENT_PER_TYPE', () => {
    const args = parseArgs(['node', 'script']);
    expect(args.autoFullTextTopN).toBeNull();
  });
});
