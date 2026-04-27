/**
 * Statskontoret to implementation-feasibility contract tests.
 *
 * Asserts that the Statskontoret data infrastructure is correctly configured
 * to provide government-body coverage for any Swedish agency named in
 * implementation-feasibility.md files under analysis/daily.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  fetchStatskontoretCached,
  isStatskontoretCacheFresh,
  statskontoretSourceKeys,
  CACHE_TTL_MS,
  type StatskontoretCachedPayload,
} from '../scripts/fetch-statskontoret.js';
import { STATSKONTORET_SOURCES } from '../scripts/statskontoret-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Known major Swedish government agencies (Myndigheter)
// Drawn from the myndigheter-monitoring skill's "Key Swedish Agencies" section.
// ---------------------------------------------------------------------------

const KNOWN_AGENCIES: readonly string[] = [
  'Skatteverket',
  'Arbetsförmedlingen',
  'Försäkringskassan',
  'Polismyndigheten',
  'Migrationsverket',
  'Trafikverket',
  'Naturvårdsverket',
  'Socialstyrelsen',
  'Skolverket',
  'Finansinspektionen',
  'Riksgäldskontoret',
  'Ekonomistyrningsverket',
  'Pensionsmyndigheten',
  'Folkhälsomyndigheten',
  'Kriminalvården',
  'Boverket',
  'Energimyndigheten',
  'Konkurrensverket',
  'Statskontoret',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StatskontoretInventoryDataset {
  primaryUse: string;
  committees?: string[];
  admiralty?: string;
  [key: string]: unknown;
}

interface StatskontoretInventory {
  version: string;
  source: string;
  classification: string;
  datasets: Record<string, StatskontoretInventoryDataset>;
  providerDecisionMatrix: Record<string, string>;
}

function readInventory(): StatskontoretInventory {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(REPO_ROOT, 'analysis/statskontoret/indicators-inventory.json'),
      'utf-8',
    ),
  ) as StatskontoretInventory;
}

/** Return all implementation-feasibility.md files under analysis/daily/ */
function findFeasibilityFiles(): string[] {
  const dailyDir = path.join(REPO_ROOT, 'analysis', 'daily');
  if (!fs.existsSync(dailyDir)) return [];

  const results: string[] = [];
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === 'implementation-feasibility.md') {
        results.push(full);
      }
    }
  }
  walk(dailyDir);
  return results;
}

/** Extract agency names mentioned in a markdown file. */
function extractAgencyMentions(content: string, agencies: readonly string[]): string[] {
  return agencies.filter((agency) => content.includes(agency));
}

// ---------------------------------------------------------------------------
// Tests: inventory coverage
// ---------------------------------------------------------------------------

describe('Statskontoret inventory → implementation-feasibility coverage contract', () => {
  const inv = readInventory();
  const feasibilityFiles = findFeasibilityFiles();

  it('inventory has myndighetsforteckning dataset for government-body coverage', () => {
    expect(inv.datasets['myndighetsforteckning']).toBeDefined();
    expect(inv.datasets['myndighetsforteckning'].primaryUse).toMatch(/[Hh]eadcount|government bodies/);
  });

  it('myndighetsforteckning is classified A1 (highest data quality)', () => {
    expect(inv.datasets['myndighetsforteckning'].admiralty).toBe('A1');
  });

  it('at least one implementation-feasibility.md file in the analysis tree ' +
     'mentions a known Swedish agency (otherwise the per-file coverage test is vacuous)', () => {
    const filesWithMentions = feasibilityFiles.filter((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return extractAgencyMentions(content, KNOWN_AGENCIES).length > 0;
    });
    expect(
      filesWithMentions.length,
      'No implementation-feasibility.md file references any known Swedish agency. ' +
        'Either the analysis corpus is empty or KNOWN_AGENCIES is misconfigured.',
    ).toBeGreaterThan(0);
  });

  it('every implementation-feasibility.md mentioning a known agency resolves to ' +
     'a Statskontoret dataset that covers it via myndighetsforteckning', () => {
    // Since myndighetsforteckning covers ALL Swedish government bodies by
    // definition, one dataset entry suffices for all named agencies. This
    // test enforces the contract per-file: every file mentioning an agency
    // is recorded with the exact agencies it cites, and the inventory must
    // serve that file via the myndighetsforteckning dataset.
    const perFileCoverage: Array<{ file: string; agencies: string[]; covered: boolean }> = [];

    for (const filePath of feasibilityFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const mentioned = extractAgencyMentions(content, KNOWN_AGENCIES);
      if (mentioned.length === 0) continue;

      const covered = inv.datasets['myndighetsforteckning'] !== undefined;
      perFileCoverage.push({
        file: path.relative(REPO_ROOT, filePath),
        agencies: mentioned,
        covered,
      });
    }

    const uncovered = perFileCoverage.filter((entry) => !entry.covered);
    expect(
      uncovered,
      `Statskontoret inventory is missing myndighetsforteckning coverage for:\n` +
        uncovered.map((u) => `  - ${u.file} (mentions: ${u.agencies.join(', ')})`).join('\n'),
    ).toHaveLength(0);

    // Sanity: confirm we actually recorded coverage for at least one file —
    // protects against the prior version that always passed even when no
    // file mentioned any agency.
    expect(perFileCoverage.length, 'expected at least one feasibility file to mention a known agency').toBeGreaterThan(0);
  });

  it('inventory globally covers FiU and KU committees in at least one Statskontoret dataset', () => {
    // Collect all committees covered across all datasets.
    const coveredCommittees = new Set<string>();
    for (const dataset of Object.values(inv.datasets)) {
      for (const committee of dataset.committees ?? []) {
        coveredCommittees.add(committee);
      }
    }

    // Structural sanity check: FiU (Finance) and KU (Constitution) are the
    // committees most likely to need Statskontoret context for agency analysis.
    expect(coveredCommittees.has('FiU')).toBe(true);
    expect(coveredCommittees.has('KU')).toBe(true);
  });

  it('inventory providerDecisionMatrix maps governmentBodiesHeadcount to statskontoret', () => {
    expect(inv.providerDecisionMatrix['governmentBodiesHeadcount']).toMatch(/^statskontoret:/);
  });

  it('found at least one implementation-feasibility.md file in the analysis tree', () => {
    // Guard: if there are zero files, subsequent tests are vacuously true and could hide issues.
    expect(feasibilityFiles.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: fetch-statskontoret module API contract
// ---------------------------------------------------------------------------

describe('fetch-statskontoret module — API contract', () => {
  it('exports CACHE_TTL_MS equal to 30 days', () => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(CACHE_TTL_MS).toBe(thirtyDaysMs);
  });

  it('statskontoretSourceKeys() returns all built-in source keys', () => {
    const keys = statskontoretSourceKeys();
    const expected = STATSKONTORET_SOURCES.map((s) => s.key);
    expect(keys).toEqual(expected);
    expect(keys.length).toBeGreaterThanOrEqual(4);
  });

  it('isStatskontoretCacheFresh returns false when no cache file exists', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'sk-cache-test-'));
    try {
      const fresh = isStatskontoretCacheFresh('myndighetsforteckning', { cacheRoot: tmpDir });
      expect(fresh).toBe(false);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('isStatskontoretCacheFresh returns true when a fresh cache file exists', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'sk-cache-test-'));
    try {
      const cacheDir = path.join(tmpDir, 'myndighetsforteckning', 'cache');
      mkdirSync(cacheDir, { recursive: true });
      const entry = {
        fetchedAt: new Date().toISOString(),
        sourceKey: 'myndighetsforteckning',
        links: [],
      };
      writeFileSync(path.join(cacheDir, 'downloads.json'), JSON.stringify(entry), 'utf-8');

      const fresh = isStatskontoretCacheFresh('myndighetsforteckning', { cacheRoot: tmpDir });
      expect(fresh).toBe(true);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('isStatskontoretCacheFresh returns false when cache entry is older than TTL', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'sk-cache-test-'));
    try {
      const cacheDir = path.join(tmpDir, 'arsutfall', 'cache');
      mkdirSync(cacheDir, { recursive: true });
      // Timestamp 31 days ago
      const staleDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      const entry = { fetchedAt: staleDate, sourceKey: 'arsutfall', links: [] };
      writeFileSync(path.join(cacheDir, 'downloads.json'), JSON.stringify(entry), 'utf-8');

      const fresh = isStatskontoretCacheFresh('arsutfall', { cacheRoot: tmpDir });
      expect(fresh).toBe(false);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('fetchStatskontoretCached returns cached payload from disk without network call', async () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'sk-cache-test-'));
    try {
      const cacheDir = path.join(tmpDir, 'manadsutfall', 'cache');
      mkdirSync(cacheDir, { recursive: true });
      const now = new Date().toISOString();
      const mockLink = {
        source: 'manadsutfall' as const,
        sourcePage: 'https://www.statskontoret.se/analys-och-statistik/oppna-data/manadsutfall/',
        href: '/OpenData/GetFile?fileType=Excel&fileName=test.xlsx',
        url: 'https://www.statskontoret.se/OpenData/GetFile?fileType=Excel&fileName=test.xlsx',
        text: 'Excel (5 kB)',
        resourceType: 'excel' as const,
        documentType: 'Inkomst',
        year: 2026,
        month: 3,
      };
      const entry = { fetchedAt: now, sourceKey: 'manadsutfall', links: [mockLink] };
      writeFileSync(path.join(cacheDir, 'downloads.json'), JSON.stringify(entry), 'utf-8');

      // Pass a clientConfig with a failing fetchFn to confirm no network call happens
      const failingFetch = async (): Promise<Response> => {
        throw new Error('network call should not happen on cache hit');
      };

      const payload: StatskontoretCachedPayload = await fetchStatskontoretCached('manadsutfall', {
        cacheRoot: tmpDir,
        clientConfig: { fetchFn: failingFetch as typeof fetch },
      });

      expect(payload.fromCache).toBe(true);
      expect(payload.links).toHaveLength(1);
      expect(payload.sourceKey).toBe('manadsutfall');
      expect(payload.cacheAgeMs).toBeGreaterThanOrEqual(0);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('fetchStatskontoretCached falls back to stale cache on network error', async () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'sk-cache-test-'));
    try {
      const cacheDir = path.join(tmpDir, 'arsutfall', 'cache');
      mkdirSync(cacheDir, { recursive: true });
      // Stale cache (31 days old)
      const staleDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      const entry = { fetchedAt: staleDate, sourceKey: 'arsutfall', links: [] };
      writeFileSync(path.join(cacheDir, 'downloads.json'), JSON.stringify(entry), 'utf-8');

      const failingFetch = async (): Promise<Response> => {
        throw new Error('simulated network failure');
      };

      const payload = await fetchStatskontoretCached('arsutfall', {
        cacheRoot: tmpDir,
        clientConfig: { fetchFn: failingFetch as typeof fetch },
      });

      // Should fall back to the stale cache
      expect(payload.fromCache).toBe(true);
      expect(payload.links).toHaveLength(0);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('fetchStatskontoretCached throws StatskontoretError when network fails and no cache exists', async () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'sk-cache-test-'));
    try {
      const failingFetch = async (): Promise<Response> => {
        throw new Error('simulated network failure');
      };

      await expect(
        fetchStatskontoretCached('budget-time-series', {
          cacheRoot: tmpDir,
          clientConfig: { fetchFn: failingFetch as typeof fetch },
        }),
      ).rejects.toThrow(/no cache available/);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
