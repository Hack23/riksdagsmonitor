/** Validation tests for the Statskontoret inventory artifacts. */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATSKONTORET_SOURCES } from '../scripts/statskontoret-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

interface StatskontoretInventory {
  version: string;
  source: string;
  classification: string;
  clients: Record<string, string>;
  datasets: Record<string, { url: string; cadence: string; format: string[]; primaryUse: string }>;
  providerDecisionMatrix: Record<string, string>;
}

function readInventory(): StatskontoretInventory {
  return JSON.parse(readFileSync(resolve(repoRoot, 'analysis/statskontoret/indicators-inventory.json'), 'utf-8')) as StatskontoretInventory;
}

describe('analysis/statskontoret/indicators-inventory.json', () => {
  const inv = readInventory();

  it('identifies Statskontoret as the public source', () => {
    expect(inv.source).toMatch(/Statskontoret/i);
    expect(inv.classification).toBe('Public');
    expect(inv.version).toBeTruthy();
  });

  it('covers every built-in TypeScript source definition', () => {
    for (const source of STATSKONTORET_SOURCES) {
      expect(inv.datasets[source.key], `inventory missing ${source.key}`).toBeDefined();
      expect(inv.datasets[source.key].url).toBe(`https://www.statskontoret.se${source.url}`);
    }
  });

  it('declares key provider-decision routes', () => {
    expect(inv.providerDecisionMatrix.governmentBodiesHeadcount).toBe('statskontoret:myndighetsforteckning');
    expect(inv.providerDecisionMatrix.macroFiscalProjection).toBe('imf:WEO/FM');
    expect(inv.providerDecisionMatrix.centralGovernmentBudgetMonthlyOutturn).toBe('statskontoret:manadsutfall');
  });

  it('documents the client, CLI and persistence surfaces', () => {
    expect(inv.clients.cli).toContain('scripts/statskontoret-fetch.ts');
    expect(inv.clients.library).toContain('scripts/statskontoret-client.ts');
    expect(inv.clients.persistence).toContain('persistStatskontoretData');
  });
});
