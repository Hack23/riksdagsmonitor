/**
 * Validation tests for the machine-readable IMF inventory artifacts.
 *
 * Asserts the shape and completeness of:
 *   - analysis/imf/indicators-inventory.json (v1.0 canonical IMF catalogue)
 *   - analysis/economic-indicators-inventory.json (v4.1 multi-provider, with
 *     IMF-first decision matrix and per-domain provider routing)
 *
 * These files are referenced by:
 *   - .github/aw/ECONOMIC_DATA_CONTRACT.md (v3.0+)
 *   - analysis/methodologies/imf-indicator-mapping.md (v2.0)
 *   - analysis/methodologies/worldbank-indicator-mapping.md (v1.1)
 *   - .github/prompts/02-mcp-access.md, 04-analysis-pipeline.md
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

interface ImfIndicator {
  id: string;
  database: string;
  name: string;
  unit: string;
  description?: string;
  publishesProjections?: boolean;
  supersedes?: string;
  [key: string]: unknown;
}

interface ImfDomain {
  label: string;
  primary?: boolean;
  committees: string[];
  indicators: ImfIndicator[];
  [key: string]: unknown;
}

interface ImfInventory {
  version: string;
  lastUpdated: string;
  source: string;
  committeeMatrix: Record<string, { provider: string; mustQuery: string[] }>;
  vintageDiscipline: { current: string; [k: string]: unknown };
  domains: Record<string, ImfDomain>;
  databases: Record<string, { label: string; [k: string]: unknown }>;
  totalIndicators: number;
  indicators?: ImfIndicator[];
}

interface EconomicInventory {
  version: string;
  authoritativeSources: Record<string, string>;
  indicators: Array<{ id: string; provider: string; domain?: string; [k: string]: unknown }>;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf-8')) as T;
}

describe('analysis/imf/indicators-inventory.json (v1.0 canonical)', () => {
  const inv = readJson<ImfInventory>('analysis/imf/indicators-inventory.json');

  it('identifies IMF as the authoritative economic source', () => {
    expect(inv.source).toMatch(/IMF/i);
    expect(inv.version).toBeTruthy();
  });

  it('carries a current WEO vintage tag in the standard format', () => {
    expect(inv.vintageDiscipline.current).toMatch(/^WEO-\d{4}-\d{2}$/);
  });

  it('declares all 9 canonical IMF dataflows', () => {
    const expected = ['WEO', 'FM', 'IFS', 'BOP', 'GFS_COFOG', 'MFS_IR', 'DOTS', 'PCPS', 'ER'];
    for (const df of expected) {
      expect(inv.databases[df], `databases missing ${df}`).toBeDefined();
    }
  });

  it('declares core policy domains with IMF-primary ownership', () => {
    const required = ['macro', 'inflation', 'labor', 'fiscal', 'external', 'monetary', 'cofog'];
    for (const domain of required) {
      expect(inv.domains[domain], `domains missing ${domain}`).toBeDefined();
    }
    // Headline economic domains MUST be primary.
    expect(inv.domains.macro.primary).toBe(true);
    expect(inv.domains.fiscal.primary).toBe(true);
  });

  it('lists at least the core WEO macro+fiscal headline indicators', () => {
    const allIds = new Set<string>();
    for (const domain of Object.values(inv.domains)) {
      for (const ind of domain.indicators ?? []) {
        allIds.add(ind.id);
      }
    }
    for (const required of [
      'NGDP_RPCH',
      'PCPIPCH',
      'LUR',
      'GGXWDG_NGDP',
      'GGXCNL_NGDP',
      'BCA_NGDPD',
      'GGR_NGDP',
      'GGX_NGDP',
    ]) {
      expect(allIds.has(required), `IMF inventory missing indicator ${required}`).toBe(true);
    }
  });

  it('every indicator has the minimum required fields', () => {
    for (const [domainKey, domain] of Object.entries(inv.domains)) {
      for (const ind of domain.indicators ?? []) {
        expect(ind.id, `${domainKey}: indicator missing id`).toBeTruthy();
        expect(ind.database, `${domainKey}/${ind.id}: missing database`).toBeTruthy();
        expect(ind.name, `${domainKey}/${ind.id}: missing name`).toBeTruthy();
        expect(ind.unit, `${domainKey}/${ind.id}: missing unit`).toBeTruthy();
      }
    }
  });

  it('IMF inventory uses provider routing (no deprecation block)', () => {
    expect((inv as { deprecationPolicy?: unknown }).deprecationPolicy).toBeUndefined();
  });

  it('committee matrix covers the main economic committees with IMF provider', () => {
    for (const committee of ['FiU', 'SkU', 'AU', 'NU']) {
      expect(inv.committeeMatrix[committee], `committeeMatrix missing ${committee}`).toBeDefined();
      expect(inv.committeeMatrix[committee].provider).toMatch(/IMF/);
      expect(inv.committeeMatrix[committee].mustQuery.length).toBeGreaterThan(0);
    }
  });

  it('totalIndicators count matches the unique indicator-ID count across domains', () => {
    const unique = new Set<string>();
    for (const d of Object.values(inv.domains)) {
      for (const ind of d.indicators ?? []) {
        unique.add(ind.id);
      }
    }
    expect(inv.totalIndicators).toBe(unique.size);
  });
});

describe('analysis/economic-indicators-inventory.json (v4.1 multi-provider)', () => {
  const inv = readJson<EconomicInventory>('analysis/economic-indicators-inventory.json');

  it('is at version 4.1 or higher', () => {
    const parts = inv.version.split('.').map((n) => parseInt(n, 10));
    expect(parts[0]).toBeGreaterThanOrEqual(4);
    if (parts[0] === 4) {
      expect(parts[1]).toBeGreaterThanOrEqual(1);
    }
  });

  it('points at the canonical IMF inventory', () => {
    expect(inv.authoritativeSources.imfInventory).toBe(
      'analysis/imf/indicators-inventory.json',
    );
  });

  it('master and IMF inventories use provider routing (no deprecation block)', () => {
    expect((inv as { deprecationPolicy?: unknown }).deprecationPolicy).toBeUndefined();
    const imfInv = readJson<ImfInventory>('analysis/imf/indicators-inventory.json');
    expect((imfInv as { deprecationPolicy?: unknown }).deprecationPolicy).toBeUndefined();
  });

  it('IMF inventory indicators use IMF dataflows directly (no `supersedes` mapping)', () => {
    const imfInv = readJson<ImfInventory>('analysis/imf/indicators-inventory.json');
    const domains = (imfInv as { domains?: Record<string, { indicators?: Array<Record<string, unknown>> }> }).domains ?? {};
    let inspected = 0;
    for (const [domainKey, domain] of Object.entries(domains)) {
      for (const ind of domain.indicators ?? []) {
        inspected++;
        const id = (ind as { id?: string }).id ?? '<unknown>';
        expect(
          (ind as { supersedes?: string }).supersedes,
          `IMF indicator ${domainKey}/${id} must not carry a supersedes link`,
        ).toBeUndefined();
      }
    }
    expect(inspected, 'expected to inspect at least one IMF indicator').toBeGreaterThan(0);
  });
});
