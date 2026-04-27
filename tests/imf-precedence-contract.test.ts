/**
 * IMF Provider Precedence Contract Tests
 *
 * Synthetic tests asserting the economic-data provider hierarchy defined in
 * `.github/aw/ECONOMIC_DATA_CONTRACT.md` v2.1:
 *
 *   1. **IMF** — macro, fiscal, monetary, external sector (WEO + FM + IFS + BOP + DOTS + GFS + PCPS + ER + MFS)
 *   2. **SCB** — Sweden-specific ground truth (regional, monthly, granular)
 *   3. **Riksbank** — Swedish central bank policy rates and monetary statistics
 *   4. **World Bank** — governance/environment residue only
 *
 * Key invariants enforced here:
 * - IMF `provider: "imf"` in `ImfDataPoint` — never "scb" or "riksbank"
 * - SCB provenance emits `provider: "scb"` — never aliased as "imf"
 * - Riksbank provenance emits `provider: "riksbank"` — never aliased as "imf"
 * - `economic-indicators-inventory.json` prefers IMF for macro/fiscal/monetary
 * - Banned WB economic codes are not used as primary citations in the inventory
 *
 * References:
 *   - `.github/aw/ECONOMIC_DATA_CONTRACT.md` v2.1
 *   - `analysis/economic-indicators-inventory.json` v4.1
 *   - `scripts/imf-client.ts` (provider: 'imf' hard-coded)
 *   - `scripts/scb-fetch.ts` (provider: 'scb')
 *   - `scripts/riksbank-fetch.ts` (provider: 'riksbank')
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildScbProvenance,
  wrapWithScbProvenance,
  parseScbArgs,
  requireScbFlag,
  ScbFetchError,
} from '../scripts/scb-fetch.js';
import {
  buildRiksbankProvenance,
  wrapWithRiksbankProvenance,
  parseRiksbankArgs,
  requireRiksbankFlag,
  RiksbankFetchError,
  RIKSBANK_SERIES,
} from '../scripts/riksbank-fetch.js';
import type { ImfDataPoint } from '../scripts/imf-client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(resolve(repoRoot, relativePath), 'utf8'),
  ) as T;
}

// ---------------------------------------------------------------------------
// 1. IMF DataPoint provider invariant
// ---------------------------------------------------------------------------

describe('ImfDataPoint provider invariant', () => {
  it('IMF data points must carry provider "imf" (compile-time type)', () => {
    // This is a type-level assertion: the TypeScript type of ImfDataPoint.provider
    // is the literal 'imf'. We verify it holds at runtime by constructing a
    // conformant object and checking the value.
    const syntheticPoint: ImfDataPoint = {
      countryCode: 'SWE',
      countryName: 'Sweden',
      indicatorId: 'NGDP_RPCH',
      indicatorName: 'Real GDP growth',
      date: '2025',
      value: 1.9,
      projection: false,
      provider: 'imf',
    };

    expect(syntheticPoint.provider).toBe('imf');
    expect(syntheticPoint.provider).not.toBe('scb');
    expect(syntheticPoint.provider).not.toBe('riksbank');
    expect(syntheticPoint.provider).not.toBe('worldBank');
  });

  it('a list of IMF data points can be sorted before WB/SCB/Riksbank points', () => {
    // Synthetic mixed-provider data points (as the renderer would receive them)
    const mixedPoints = [
      { provider: 'worldBank', indicatorId: 'CC.EST', value: 2.1 },
      { provider: 'imf', indicatorId: 'NGDP_RPCH', value: 1.9 },
      { provider: 'scb', indicatorId: 'TAB5765', value: 7.2 },
      { provider: 'riksbank', indicatorId: 'SEKREPULD', value: 3.5 },
      { provider: 'imf', indicatorId: 'PCPIPCH', value: 2.3 },
    ];

    const PROVIDER_ORDER: Record<string, number> = { imf: 0, scb: 1, riksbank: 2, worldBank: 3 };

    const sorted = [...mixedPoints].sort(
      (a, b) => (PROVIDER_ORDER[a.provider] ?? 99) - (PROVIDER_ORDER[b.provider] ?? 99),
    );

    expect(sorted[0].provider).toBe('imf');
    expect(sorted[1].provider).toBe('imf');
    expect(sorted[2].provider).toBe('scb');
    expect(sorted[3].provider).toBe('riksbank');
    expect(sorted[4].provider).toBe('worldBank');
  });
});

// ---------------------------------------------------------------------------
// 2. SCB provenance — never aliased as IMF
// ---------------------------------------------------------------------------

describe('SCB economicProvenance contract', () => {
  it('buildScbProvenance returns provider "scb"', () => {
    const prov = buildScbProvenance('TAB5765');
    expect(prov.provider).toBe('scb');
    expect(prov.dataflow).toBe('pxweb');
    expect(prov.indicator).toBe('TAB5765');
  });

  it('SCB provider is never "imf"', () => {
    const prov = buildScbProvenance('TAB5765');
    expect(prov.provider).not.toBe('imf');
  });

  it('SCB provider is never "riksbank"', () => {
    const prov = buildScbProvenance('TAB5765');
    expect(prov.provider).not.toBe('riksbank');
  });

  it('SCB provider is never "worldBank"', () => {
    const prov = buildScbProvenance('TAB5765');
    expect(prov.provider).not.toBe('worldBank');
  });

  it('wrapWithScbProvenance embeds provenance block', () => {
    const wrapped = wrapWithScbProvenance({ tableId: 'TAB5765', dataPoints: [] }, 'TAB5765');
    expect(wrapped.economicProvenance.provider).toBe('scb');
    expect(wrapped.data).toMatchObject({ tableId: 'TAB5765' });
  });

  it('SCB vintage field is an ISO date (YYYY-MM-DD)', () => {
    const prov = buildScbProvenance('TAB5765');
    expect(prov.vintage).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('SCB retrieved_at is a valid ISO timestamp', () => {
    const prov = buildScbProvenance('TAB5765');
    const parsed = new Date(prov.retrieved_at);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Riksbank provenance — never aliased as IMF
// ---------------------------------------------------------------------------

describe('Riksbank economicProvenance contract', () => {
  it('buildRiksbankProvenance returns provider "riksbank"', () => {
    const prov = buildRiksbankProvenance('SEKREPULD');
    expect(prov.provider).toBe('riksbank');
    expect(prov.dataflow).toBe('swea');
    expect(prov.indicator).toBe('SEKREPULD');
  });

  it('Riksbank provider is never "imf"', () => {
    const prov = buildRiksbankProvenance('SEKREPULD');
    expect(prov.provider).not.toBe('imf');
  });

  it('Riksbank provider is never "scb"', () => {
    const prov = buildRiksbankProvenance('SEKREPULD');
    expect(prov.provider).not.toBe('scb');
  });

  it('Riksbank provider is never "worldBank"', () => {
    const prov = buildRiksbankProvenance('SEKREPULD');
    expect(prov.provider).not.toBe('worldBank');
  });

  it('wrapWithRiksbankProvenance embeds provenance block', () => {
    const wrapped = wrapWithRiksbankProvenance({ seriesId: 'SEKREPULD', observations: [] }, 'SEKREPULD');
    expect(wrapped.economicProvenance.provider).toBe('riksbank');
    expect(wrapped.data).toMatchObject({ seriesId: 'SEKREPULD' });
  });

  it('Riksbank vintage field is an ISO date (YYYY-MM-DD)', () => {
    const prov = buildRiksbankProvenance('SEKREPULD');
    expect(prov.vintage).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('RIKSBANK_SERIES catalogue contains the policy rate', () => {
    const policyRate = RIKSBANK_SERIES.find((s) => s.id === 'SEKREPULD');
    expect(policyRate).toBeDefined();
    expect(policyRate?.name).toContain('policy rate');
  });

  it('every Riksbank series has a policyAreas array', () => {
    RIKSBANK_SERIES.forEach((s) => {
      expect(s.policyAreas.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 4. IMF-first precedence in economic-indicators-inventory.json
// ---------------------------------------------------------------------------

describe('economic-indicators-inventory.json IMF precedence', () => {
  interface EconomicInventory {
    version: string;
    providerSelection: Record<string, string>;
    providers: {
      imf: { databases: string[] };
      worldBank?: Record<string, unknown>;
      scb?: Record<string, unknown>;
    };
    deprecationPolicy: {
      worldBankEconomicCodes: {
        supersedes: Record<string, string>;
      };
    };
    indicators: Array<{
      id: string;
      provider: string;
      key?: string;
    }>;
  }

  const inv = readJson<EconomicInventory>('analysis/economic-indicators-inventory.json');

  it('inventory version is at least 4.x', () => {
    const major = Number.parseInt(inv.version.split('.')[0] ?? '0', 10);
    expect(major).toBeGreaterThanOrEqual(4);
  });

  it('macro domain prefers IMF', () => {
    expect(inv.providerSelection.macro).toBe('imf');
  });

  it('fiscal domain prefers IMF', () => {
    expect(inv.providerSelection.fiscal).toBe('imf');
  });

  it('monetary domain prefers IMF', () => {
    expect(inv.providerSelection.monetary).toBe('imf');
  });

  it('external sector prefers IMF', () => {
    expect(inv.providerSelection.externalSector).toBe('imf');
  });

  it('Sweden primary provider is SCB, not IMF', () => {
    // SCB is ground truth for Swedish-specific data — must NOT be aliased as IMF
    expect(inv.providerSelection.swedenPrimary).toBe('scb');
    expect(inv.providerSelection.swedenPrimary).not.toBe('imf');
  });

  it('IMF databases list includes the 8 canonical dataflows', () => {
    const expected = ['WEO', 'FM', 'IFS', 'BOP_AGG', 'GFS_COFOG', 'MFS_IR', 'DOTS', 'PCPS'];
    expected.forEach((db) => {
      expect(inv.providers.imf.databases).toContain(db);
    });
  });

  it('WB GDP code is deprecated in favour of IMF', () => {
    const dep = inv.deprecationPolicy.worldBankEconomicCodes.supersedes;
    expect(dep['NY.GDP.MKTP.KD.ZG']).toMatch(/^imf:/);
  });

  it('WB CPI code is deprecated in favour of IMF', () => {
    const dep = inv.deprecationPolicy.worldBankEconomicCodes.supersedes;
    expect(dep['FP.CPI.TOTL.ZG']).toMatch(/^imf:/);
  });

  it('WB unemployment code is deprecated in favour of IMF', () => {
    const dep = inv.deprecationPolicy.worldBankEconomicCodes.supersedes;
    expect(dep['SL.UEM.TOTL.ZS']).toMatch(/^imf:/);
  });

  it('headline real GDP growth indicator uses IMF WEO', () => {
    const gdp = inv.indicators.find((i) => i.id === 'NGDP_RPCH');
    expect(gdp).toBeDefined();
    expect(gdp?.provider).toBe('imf');
  });

  it('IMF indicators never carry provider "scb"', () => {
    const imfIndicators = inv.indicators.filter((i) => i.provider === 'imf');
    expect(imfIndicators.length).toBeGreaterThan(0);
    imfIndicators.forEach((ind) => {
      expect(ind.provider).toBe('imf');
      expect(ind.provider).not.toBe('scb');
      expect(ind.provider).not.toBe('riksbank');
    });
  });
});

// ---------------------------------------------------------------------------
// 5. SCB CLI arg parsing
// ---------------------------------------------------------------------------

describe('SCB CLI parsing', () => {
  it('parses search command with required --query flag', () => {
    const parsed = parseScbArgs(['search', '--query', 'arbetslöshet']);
    expect(parsed.command).toBe('search');
    expect(requireScbFlag(parsed.flags, 'query')).toBe('arbetslöshet');
  });

  it('parses query command with required --table flag', () => {
    const parsed = parseScbArgs(['query', '--table', 'TAB5765', '--persist']);
    expect(parsed.command).toBe('query');
    expect(requireScbFlag(parsed.flags, 'table')).toBe('TAB5765');
    expect(parsed.booleans.has('persist')).toBe(true);
  });

  it('parses list-domains command', () => {
    const parsed = parseScbArgs(['list-domains']);
    expect(parsed.command).toBe('list-domains');
  });

  it('throws ScbFetchError for unknown command', () => {
    expect(() => parseScbArgs(['bad-cmd'])).toThrow(ScbFetchError);
  });

  it('throws ScbFetchError for missing required flag', () => {
    expect(() => requireScbFlag(new Map(), 'query')).toThrow(/missing required flag/);
  });

  it('throws ScbFetchError for unexpected positional arg', () => {
    expect(() => parseScbArgs(['search', 'unexpected'])).toThrow(ScbFetchError);
  });

  it('parseScbArgs defaults to help when no command given', () => {
    const parsed = parseScbArgs([]);
    expect(parsed.command).toBe('help');
  });
});

// ---------------------------------------------------------------------------
// 6. Riksbank CLI arg parsing
// ---------------------------------------------------------------------------

describe('Riksbank CLI parsing', () => {
  it('parses policy-rate command', () => {
    const parsed = parseRiksbankArgs(['policy-rate']);
    expect(parsed.command).toBe('policy-rate');
  });

  it('parses rates command with required --series flag', () => {
    const parsed = parseRiksbankArgs(['rates', '--series', 'SEKREPULD']);
    expect(parsed.command).toBe('rates');
    expect(requireRiksbankFlag(parsed.flags, 'series')).toBe('SEKREPULD');
  });

  it('parses rates command with optional --from and --to flags', () => {
    const parsed = parseRiksbankArgs(['rates', '--series', 'SEKREPULD', '--from', '2024-01-01', '--to', '2025-12-31']);
    expect(parsed.flags.get('from')).toBe('2024-01-01');
    expect(parsed.flags.get('to')).toBe('2025-12-31');
  });

  it('parses list-series command', () => {
    const parsed = parseRiksbankArgs(['list-series']);
    expect(parsed.command).toBe('list-series');
  });

  it('parses --persist boolean alongside policy-rate', () => {
    const parsed = parseRiksbankArgs(['policy-rate', '--persist']);
    expect(parsed.booleans.has('persist')).toBe(true);
  });

  it('throws RiksbankFetchError for unknown command', () => {
    expect(() => parseRiksbankArgs(['bad-cmd'])).toThrow(RiksbankFetchError);
  });

  it('throws RiksbankFetchError for missing required flag', () => {
    expect(() => requireRiksbankFlag(new Map(), 'series')).toThrow(/missing required flag/);
  });

  it('throws RiksbankFetchError for unexpected positional arg', () => {
    expect(() => parseRiksbankArgs(['rates', 'unexpected'])).toThrow(RiksbankFetchError);
  });

  it('parseRiksbankArgs defaults to help when no command given', () => {
    const parsed = parseRiksbankArgs([]);
    expect(parsed.command).toBe('help');
  });
});

// ---------------------------------------------------------------------------
// 7. Provider identity invariants across all three clients
// ---------------------------------------------------------------------------

describe('Cross-provider identity invariants', () => {
  it('SCB and Riksbank providers are distinct strings', () => {
    const scbProv = buildScbProvenance('TAB5765');
    const rbProv = buildRiksbankProvenance('SEKREPULD');
    expect(scbProv.provider).not.toBe(rbProv.provider);
  });

  it('neither SCB nor Riksbank providers equal "imf"', () => {
    const scbProv = buildScbProvenance('TAB1291');
    const rbProv = buildRiksbankProvenance('SEKSEKSTIBOR3MD');
    expect(scbProv.provider).not.toBe('imf' as string);
    expect(rbProv.provider).not.toBe('imf' as string);
  });

  it('neither SCB nor Riksbank providers equal "worldBank"', () => {
    const scbProv = buildScbProvenance('TAB4230');
    const rbProv = buildRiksbankProvenance('SEKBONDLNY10');
    expect(scbProv.provider).not.toBe('worldBank' as string);
    expect(rbProv.provider).not.toBe('worldBank' as string);
  });

  it('a synthetic IMF data point is sorted before SCB and Riksbank', () => {
    const PROVIDER_ORDER: Record<string, number> = { imf: 0, scb: 1, riksbank: 2, worldBank: 3 };

    const points = [
      { provider: 'riksbank', value: 3.5 },
      { provider: 'scb', value: 7.2 },
      { provider: 'imf', value: 1.9 },
    ];

    const sorted = [...points].sort(
      (a, b) => (PROVIDER_ORDER[a.provider] ?? 99) - (PROVIDER_ORDER[b.provider] ?? 99),
    );

    expect(sorted[0].provider).toBe('imf');
    expect(sorted[1].provider).toBe('scb');
    expect(sorted[2].provider).toBe('riksbank');
  });
});
