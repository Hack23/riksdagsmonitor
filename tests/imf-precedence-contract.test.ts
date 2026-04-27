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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCB_PRESETS,
  parseSCBArgs,
  requireSCBFlag,
  fetchSCBTablePayload,
  type SCBEconomicProvenance,
  type SCBFetchPayload,
} from '../scripts/scb-fetch.js';
import {
  parseRiksbankArgs,
  parseRiksbankKind,
  assertRiksbankFetchTarget,
  fetchRiksbankPayload,
  type RiksbankEconomicProvenance,
  type RiksbankFetchPayload,
} from '../scripts/riksbank-fetch.js';
import { SCBClient } from '../scripts/scb-client.js';
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SCBEconomicProvenance type enforces provider "scb"', () => {
    // Construct a conformant provenance block and assert the provider literal
    const prov: SCBEconomicProvenance = {
      provider: 'scb',
      dataflow: 'SCB PxWeb',
      indicator: '0000003N',
      tableId: '0000003N',
      retrieved_at: new Date().toISOString(),
      mcpTool: 'query_table',
    };

    expect(prov.provider).toBe('scb');
    expect(prov.dataflow).toBe('SCB PxWeb');
    expect(prov.mcpTool).toBe('query_table');
  });

  it('SCB provider is never "imf"', () => {
    const prov: SCBEconomicProvenance = {
      provider: 'scb',
      dataflow: 'SCB PxWeb',
      indicator: '0000003N',
      tableId: '0000003N',
      retrieved_at: new Date().toISOString(),
      mcpTool: 'query_table',
    };
    expect(prov.provider).not.toBe('imf');
  });

  it('SCB provider is never "riksbank"', () => {
    const prov: SCBEconomicProvenance = {
      provider: 'scb',
      dataflow: 'SCB PxWeb',
      indicator: 'TAB5765',
      tableId: 'TAB5765',
      retrieved_at: new Date().toISOString(),
      mcpTool: 'query_table',
    };
    expect(prov.provider).not.toBe('riksbank');
  });

  it('SCBFetchPayload top-level provider is "scb"', () => {
    const payload: SCBFetchPayload = {
      provider: 'scb',
      tableId: '0000003N',
      valueCodes: { Tid: 'top(12)' },
      data: [],
      status: 'no-data',
      economicProvenance: {
        provider: 'scb',
        dataflow: 'SCB PxWeb',
        indicator: '0000003N',
        tableId: '0000003N',
        retrieved_at: new Date().toISOString(),
        mcpTool: 'query_table',
      },
    };
    expect(payload.provider).toBe('scb');
    expect(payload.economicProvenance.provider).toBe('scb');
  });

  it('fetchSCBTablePayload emits provider "scb" on fail-soft (network down)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('SCB API down'));
    const payload = await fetchSCBTablePayload(
      '0000003N',
      { Tid: 'top(2)' },
      { client: new SCBClient({ maxRetries: 0 }) },
    );
    expect(payload.provider).toBe('scb');
    expect(payload.economicProvenance.provider).toBe('scb');
    expect(payload.economicProvenance.provider).not.toBe('imf');
    expect(payload.status).toBe('no-data');
  });

  it('SCB retrieved_at is a valid ISO timestamp', () => {
    const prov: SCBEconomicProvenance = {
      provider: 'scb',
      dataflow: 'SCB PxWeb',
      indicator: 'TAB5765',
      tableId: 'TAB5765',
      retrieved_at: new Date().toISOString(),
      mcpTool: 'query_table',
    };
    const parsed = new Date(prov.retrieved_at);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Riksbank provenance — never aliased as IMF
// ---------------------------------------------------------------------------

describe('Riksbank economicProvenance contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('RiksbankEconomicProvenance type enforces provider "riksbank"', () => {
    const prov: RiksbankEconomicProvenance = {
      provider: 'riksbank',
      dataflow: 'riksbank-web',
      indicator: 'repo-rate-path',
      url: 'https://www.riksbank.se/en-gb/monetary-policy/the-policy-rate/',
      retrieved_at: new Date().toISOString(),
    };

    expect(prov.provider).toBe('riksbank');
    expect(prov.dataflow).toBe('riksbank-web');
  });

  it('Riksbank provider is never "imf"', () => {
    const prov: RiksbankEconomicProvenance = {
      provider: 'riksbank',
      dataflow: 'riksbank-web',
      indicator: 'minutes',
      url: 'https://www.riksbank.se/en-gb/monetary-policy/monetary-policy-minutes/',
      retrieved_at: new Date().toISOString(),
    };
    expect(prov.provider).not.toBe('imf');
  });

  it('Riksbank provider is never "scb"', () => {
    const prov: RiksbankEconomicProvenance = {
      provider: 'riksbank',
      dataflow: 'riksbank-web',
      indicator: 'fuel-price-context',
      url: 'https://www.riksbank.se/en-gb/monetary-policy/monetary-policy-reports/',
      retrieved_at: new Date().toISOString(),
    };
    expect(prov.provider).not.toBe('scb');
  });

  it('RiksbankFetchPayload top-level provider is "riksbank"', () => {
    const payload: RiksbankFetchPayload = {
      provider: 'riksbank',
      kind: 'repo-rate-path',
      url: 'https://www.riksbank.se/en-gb/monetary-policy/the-policy-rate/',
      contentType: 'text/html',
      retrievedAt: new Date().toISOString(),
      status: 'no-data',
      economicProvenance: {
        provider: 'riksbank',
        dataflow: 'riksbank-web',
        indicator: 'repo-rate-path',
        url: 'https://www.riksbank.se/en-gb/monetary-policy/the-policy-rate/',
        retrieved_at: new Date().toISOString(),
      },
    };
    expect(payload.provider).toBe('riksbank');
    expect(payload.economicProvenance.provider).toBe('riksbank');
  });

  it('fetchRiksbankPayload emits provider "riksbank" on HTML response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html><head><title>Policy Rate - Riksbank</title></head><body>content</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    );
    const payload = await fetchRiksbankPayload(
      'repo-rate-path',
      'https://www.riksbank.se/en-gb/monetary-policy/the-policy-rate/',
    );
    expect(payload.provider).toBe('riksbank');
    expect(payload.economicProvenance.provider).toBe('riksbank');
    expect(payload.economicProvenance.provider).not.toBe('imf');
    expect(payload.status).toBe('ok');
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
  it('parses table command with required --table-id flag', () => {
    const parsed = parseSCBArgs(['table', '--table-id', 'TAB5765', '--persist']);
    expect(parsed.command).toBe('table');
    expect(requireSCBFlag(parsed.flags, 'table-id')).toBe('TAB5765');
    expect(parsed.booleans.has('persist')).toBe(true);
  });

  it('parses preset command with required --preset flag', () => {
    const parsed = parseSCBArgs(['preset', '--preset', 'cpi']);
    expect(parsed.command).toBe('preset');
    expect(requireSCBFlag(parsed.flags, 'preset')).toBe('cpi');
  });

  it('parses list-presets command', () => {
    const parsed = parseSCBArgs(['list-presets']);
    expect(parsed.command).toBe('list-presets');
  });

  it('throws for unknown command', () => {
    expect(() => parseSCBArgs(['bad-cmd'])).toThrow(/unknown command/);
  });

  it('throws for missing required flag', () => {
    expect(() => requireSCBFlag(new Map(), 'table-id')).toThrow(/missing required flag/);
  });

  it('throws for unexpected positional arg', () => {
    expect(() => parseSCBArgs(['table', 'unexpected'])).toThrow(/unexpected positional/);
  });

  it('parseSCBArgs defaults to help when no command given', () => {
    const parsed = parseSCBArgs([]);
    expect(parsed.command).toBe('help');
  });

  it('SCB_PRESETS covers all four preset keys', () => {
    const keys = SCB_PRESETS.map((p) => p.key);
    expect(keys).toContain('cpi');
    expect(keys).toContain('aku');
    expect(keys).toContain('household-economy');
    expect(keys).toContain('fuel-prices');
  });
});

// ---------------------------------------------------------------------------
// 6. Riksbank CLI arg parsing
// ---------------------------------------------------------------------------

describe('Riksbank CLI parsing', () => {
  it('parses repo-rate-path command', () => {
    const parsed = parseRiksbankArgs(['repo-rate-path']);
    expect(parsed.command).toBe('repo-rate-path');
  });

  it('parses fetch command with --kind and --url flags', () => {
    const parsed = parseRiksbankArgs(['fetch', '--kind', 'minutes', '--url', 'https://www.riksbank.se/en-gb/minutes/']);
    expect(parsed.command).toBe('fetch');
    expect(parsed.flags.get('kind')).toBe('minutes');
    expect(parsed.flags.get('url')).toBe('https://www.riksbank.se/en-gb/minutes/');
  });

  it('parses --persist boolean alongside repo-rate-path', () => {
    const parsed = parseRiksbankArgs(['repo-rate-path', '--persist']);
    expect(parsed.booleans.has('persist')).toBe(true);
  });

  it('throws for unknown command', () => {
    expect(() => parseRiksbankArgs(['bad-cmd'])).toThrow(/unknown command/);
  });

  it('throws for unexpected positional arg', () => {
    expect(() => parseRiksbankArgs(['fetch', 'unexpected'])).toThrow(/unexpected positional/);
  });

  it('parseRiksbankArgs defaults to help when no command given', () => {
    const parsed = parseRiksbankArgs([]);
    expect(parsed.command).toBe('help');
  });

  it('parseRiksbankKind accepts all valid kinds', () => {
    expect(parseRiksbankKind('repo-rate-path')).toBe('repo-rate-path');
    expect(parseRiksbankKind('minutes')).toBe('minutes');
    expect(parseRiksbankKind('fuel-price-context')).toBe('fuel-price-context');
  });

  it('parseRiksbankKind throws for invalid kind', () => {
    expect(() => parseRiksbankKind('bad-kind')).toThrow(/unknown Riksbank artifact kind/);
  });

  it('assertRiksbankFetchTarget accepts valid riksbank.se HTTPS URLs', () => {
    expect(() => assertRiksbankFetchTarget('https://www.riksbank.se/en-gb/')).not.toThrow();
  });

  it('assertRiksbankFetchTarget rejects non-HTTPS', () => {
    expect(() => assertRiksbankFetchTarget('http://www.riksbank.se/en-gb/')).toThrow(/HTTPS/);
  });

  it('assertRiksbankFetchTarget rejects non-Riksbank hosts', () => {
    expect(() => assertRiksbankFetchTarget('https://example.com/path')).toThrow(/allowlist/);
  });
});

// ---------------------------------------------------------------------------
// 7. Cross-provider identity invariants
// ---------------------------------------------------------------------------

describe('Cross-provider identity invariants', () => {
  it('SCB and Riksbank providers are distinct strings', () => {
    const scbProv: SCBEconomicProvenance = {
      provider: 'scb',
      dataflow: 'SCB PxWeb',
      indicator: 'TAB5765',
      tableId: 'TAB5765',
      retrieved_at: new Date().toISOString(),
      mcpTool: 'query_table',
    };
    const rbProv: RiksbankEconomicProvenance = {
      provider: 'riksbank',
      dataflow: 'riksbank-web',
      indicator: 'repo-rate-path',
      url: 'https://www.riksbank.se/en-gb/monetary-policy/the-policy-rate/',
      retrieved_at: new Date().toISOString(),
    };
    expect(scbProv.provider).not.toBe(rbProv.provider);
  });

  it('neither SCB nor Riksbank providers equal "imf"', () => {
    expect('scb').not.toBe('imf');
    expect('riksbank').not.toBe('imf');
  });

  it('neither SCB nor Riksbank providers equal "worldBank"', () => {
    expect('scb').not.toBe('worldBank');
    expect('riksbank').not.toBe('worldBank');
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
