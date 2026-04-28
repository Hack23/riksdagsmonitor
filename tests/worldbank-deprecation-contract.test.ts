/**
 * @file Contract test enforcing the v2.1 economic-data invariant:
 *
 *   "World Bank is NEVER acceptable for economic context —
 *    not as primary, not as secondary, not as fallback, not as historical."
 *
 * This test cross-checks three independent sources of truth:
 *
 *   1. `.github/aw/ECONOMIC_DATA_CONTRACT.md` v2.1 (banned-list)
 *   2. `analysis/economic-indicators-inventory.json` (master deprecation policy)
 *   3. `analysis/worldbank/indicators-inventory.json` (per-indicator
 *      `deprecated: true` + `supersededBy: "imf:..."` flags)
 *
 * The invariants:
 *
 *   - Every WB economic code from the contract banned-list MUST be marked
 *     `deprecated: true` with a non-empty `supersededBy` IMF citation in
 *     the WB inventory.
 *   - The active `ECONOMIC_INDICATORS` export from `world-bank-context.ts`
 *     MUST contain ZERO deprecated codes.
 *   - Every deprecated WB code MUST have an IMF replacement of the form
 *     `imf:DATABASE:INDICATOR_ID`.
 *
 * If this test fails, an agentic workflow author has likely re-introduced
 * a banned WB economic code. Address by routing the citation through
 * `scripts/imf-fetch.ts` instead.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  ECONOMIC_INDICATORS,
  ALL_WORLD_BANK_INDICATORS,
  findDeprecatedIndicators,
  resolveImfReplacement,
} from '../scripts/world-bank-context.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * The banned-list as enumerated in `.github/aw/ECONOMIC_DATA_CONTRACT.md`
 * v2.1 and the master `analysis/economic-indicators-inventory.json`. Any
 * change here MUST be coordinated with the contract document and master
 * inventory; this list is intentionally embedded inline so the test
 * remains independent of the inventory file's structure.
 */
const CONTRACT_BANNED_WB_CODES = [
  'NY.GDP.MKTP.KD.ZG', // Real GDP growth                  → IMF WEO:NGDP_RPCH
  'NY.GDP.MKTP.CD',    // GDP nominal USD                  → IMF WEO:NGDPD
  'NY.GDP.PCAP.CD',    // GDP per capita nominal           → IMF WEO:NGDPDPC
  'FP.CPI.TOTL.ZG',    // Headline CPI inflation           → IMF WEO:PCPIPCH
  'SL.UEM.TOTL.ZS',    // Unemployment rate                → IMF WEO:LUR
  'GC.XPN.TOTL.GD.ZS', // General gov expenditure          → IMF WEO:GGX_NGDP
  'GC.REV.XGRT.GD.ZS', // General gov revenue              → IMF WEO:GGR_NGDP
  'BN.CAB.XOKA.GD.ZS', // Current-account balance % GDP    → IMF WEO:BCA_NGDPD
  'NE.EXP.GNFS.ZS',    // Exports of goods & services      → IMF WEO:TX_RPCH
] as const;

interface MasterDeprecationPolicy {
  readonly worldBankEconomicCodes?: {
    readonly status?: string;
    readonly supersedes?: Readonly<Record<string, string>>;
  };
}

describe('worldbank-deprecation-contract', () => {
  describe('contract banned-list × WB inventory cross-check', () => {
    CONTRACT_BANNED_WB_CODES.forEach((code) => {
      it(`WB code "${code}" MUST be marked deprecated in the WB inventory`, () => {
        const ind = ALL_WORLD_BANK_INDICATORS.find((i) => i.indicatorId === code);
        expect(ind, `WB code ${code} missing from worldbank inventory`).toBeDefined();
        expect(
          ind!.deprecated,
          `WB code ${code} must carry deprecated:true (contract v2.1 banned-list)`,
        ).toBe(true);
        expect(
          ind!.supersededBy,
          `WB code ${code} must declare an IMF supersededBy citation`,
        ).toMatch(/^imf:[A-Z_]+:[A-Z0-9_]+$/);
      });

      it(`WB code "${code}" MUST NOT appear in the active ECONOMIC_INDICATORS export`, () => {
        const surfaced = ECONOMIC_INDICATORS.some((i) => i.indicatorId === code);
        expect(
          surfaced,
          `Banned WB economic code ${code} leaked into the active set surfaced to agents`,
        ).toBe(false);
      });

      it(`resolveImfReplacement("${code}") MUST resolve to a canonical IMF citation`, () => {
        const imf = resolveImfReplacement(code);
        expect(imf).toBeDefined();
        expect(imf).toMatch(/^imf:[A-Z_]+:[A-Z0-9_]+$/);
      });
    });
  });

  describe('master economic-indicators-inventory.json alignment', () => {
    const masterPath = path.join(repoRoot, 'analysis/economic-indicators-inventory.json');
    const master = JSON.parse(readFileSync(masterPath, 'utf-8')) as {
      deprecationPolicy?: MasterDeprecationPolicy;
    };

    it('master inventory declares a deprecationPolicy.worldBankEconomicCodes block', () => {
      expect(master.deprecationPolicy?.worldBankEconomicCodes).toBeDefined();
      expect(master.deprecationPolicy?.worldBankEconomicCodes?.status).toMatch(/deprecat/i);
    });

    it('every WB code in the master `supersedes` map MUST be marked deprecated where present in WB inventory', () => {
      const supersedes = master.deprecationPolicy?.worldBankEconomicCodes?.supersedes ?? {};
      const masterCodes = Object.keys(supersedes);
      expect(masterCodes.length).toBeGreaterThan(0);
      masterCodes.forEach((code) => {
        const ind = ALL_WORLD_BANK_INDICATORS.find((i) => i.indicatorId === code);
        if (ind === undefined) {
          // Master may list codes not in the WB inventory (e.g. GC.DOD which
          // is only in the master). The WB-inventory invariant only applies
          // to codes that ARE present in the WB inventory.
          return;
        }
        expect(
          ind.deprecated,
          `Master inventory deprecates ${code} but the WB inventory still has deprecated !== true`,
        ).toBe(true);
      });
    });

    it('master `supersedes` map MUST agree with WB inventory `supersededBy` for overlapping keys', () => {
      const supersedes = master.deprecationPolicy?.worldBankEconomicCodes?.supersedes ?? {};
      Object.entries(supersedes).forEach(([wbCode, imfCitation]) => {
        const ind = ALL_WORLD_BANK_INDICATORS.find((i) => i.indicatorId === wbCode);
        if (ind === undefined || ind.supersededBy === undefined) {
          return; // partial overlap is acceptable
        }
        expect(
          ind.supersededBy,
          `Mismatched IMF replacement for ${wbCode}: master="${imfCitation}" inventory="${ind.supersededBy}"`,
        ).toBe(imfCitation);
      });
    });
  });

  describe('global invariants', () => {
    it('the active ECONOMIC_INDICATORS export MUST contain zero deprecated entries', () => {
      const leaked = ECONOMIC_INDICATORS.filter((i) => i.deprecated === true);
      expect(
        leaked,
        `Active set leaked ${leaked.length} deprecated WB economic codes — investigate world-bank-context.ts filter`,
      ).toHaveLength(0);
    });

    it('every deprecated WB indicator MUST declare an IMF replacement and a reason', () => {
      const deprecated = findDeprecatedIndicators();
      expect(deprecated.length).toBeGreaterThan(0);
      deprecated.forEach((ind) => {
        expect(ind.supersededBy).toMatch(/^imf:[A-Z_]+:[A-Z0-9_]+$/);
        expect(ind.deprecationReason).toBeDefined();
        expect(ind.deprecationReason!.length).toBeGreaterThan(20);
      });
    });

    it('no IMF citation in supersededBy MUST point at another WB code (no circularity)', () => {
      const deprecated = findDeprecatedIndicators();
      deprecated.forEach((ind) => {
        // imf:DATABASE:CODE — DATABASE must be one of the canonical IMF dataflows
        const validImfDb = /^imf:(WEO|FM|IFS|BOP|BOP_AGG|GFS_COFOG|MFS_IR|DOTS|PCPS|ER):/;
        expect(
          validImfDb.test(ind.supersededBy!),
          `${ind.indicatorId} supersededBy "${ind.supersededBy}" does not name a canonical IMF dataflow`,
        ).toBe(true);
      });
    });
  });
});
