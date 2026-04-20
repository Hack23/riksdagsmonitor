/**
 * @module IMF/Context
 * @description Policy-area → IMF indicator mapping, mirroring the surface of
 * `world-bank-context.ts`.
 *
 * Where World Bank data lags 12–24 months, IMF data (WEO April/October
 * cycle; Fiscal Monitor; IFS; GFS_COFOG) leads. The agentic workflows
 * use this module at article-authoring time to pick the correct IMF
 * indicator for each Riksdag committee's policy area and to stamp
 * projections with the right vintage.
 *
 * Scope: narrow, code-only mapping for the indicators currently used by
 * the four "look-ahead" article types (week-ahead, month-ahead,
 * weekly-review, monthly-review) plus the macro-adjacent daily types
 * (committee-reports, propositions, motions, evening-analysis). For
 * wider discovery, agents should go through the `imf-data-mcp` server
 * and use its `imf_search_databases` → `imf_get_parameter_defs` →
 * `imf_get_parameter_codes` → `imf_fetch_data` flow.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { COUNTRY_CODES, COUNTRY_NAMES_EN } from './imf-codes.js';
import { IMF_WEO_INDICATORS, IMF_FM_INDICATORS } from './imf-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Database family an indicator belongs to. */
export type ImfDatabase = 'WEO' | 'FM' | 'IFS' | 'BOP_AGG' | 'GFS_COFOG' | 'MFS_IR';

/** An IMF economic indicator mapped to a Swedish policy area. */
export interface ImfIndicatorContext {
  /** IMF database the indicator lives in (`WEO`, `FM`, ...). */
  readonly database: ImfDatabase;
  /** IMF indicator code native to that database. */
  readonly indicatorId: string;
  /** Human-readable name (English). */
  readonly name: string;
  /** Concise description for article commentary. */
  readonly description: string;
  /** Swedish policy areas this indicator relates to. */
  readonly policyAreas: readonly string[];
  /** Relevant Riksdag committees. */
  readonly committees: readonly string[];
  /** Unit of measurement (e.g. '% of GDP', 'Annual % change'). */
  readonly unit: string;
  /** Whether the IMF publishes projections beyond the current year. */
  readonly publishesProjections: boolean;
}

// ---------------------------------------------------------------------------
// Policy-area → IMF indicator mapping
// ---------------------------------------------------------------------------

/**
 * Canonical IMF indicator catalogue used by Riksdagsmonitor article
 * workflows. Only the subset actively consumed by article templates —
 * extend deliberately; keep in sync with
 * `analysis/economic-indicators-inventory.json`.
 */
export const IMF_INDICATORS: readonly ImfIndicatorContext[] = Object.freeze([
  // --- Headline macro (FiU Finance Committee) ---
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.gdpGrowth,
    name: 'Real GDP growth',
    description:
      'Year-over-year percent change in real GDP. Headline macro indicator; projected ≥ 5 years in each WEO cycle.',
    policyAreas: ['fiscal policy', 'macro economy', 'growth'],
    committees: ['FiU', 'SkU', 'NU'],
    unit: 'Annual % change',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.gdpPerCapita,
    name: 'GDP per capita',
    description: 'Nominal GDP per capita in current USD. Useful for cross-country peer comparisons.',
    policyAreas: ['macro economy', 'living standards'],
    committees: ['FiU', 'AU', 'SoU'],
    unit: 'Current USD',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.inflationCpi,
    name: 'Inflation (CPI, average)',
    description:
      'Average consumer price inflation, annual % change. Primary monetary-policy reference; projected to T+5.',
    policyAreas: ['monetary policy', 'inflation'],
    committees: ['FiU'],
    unit: 'Annual % change',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.unemployment,
    name: 'Unemployment rate',
    description: 'Unemployment as % of total labor force, WEO definition; projected to T+5.',
    policyAreas: ['labor market', 'employment'],
    committees: ['AU', 'SoU'],
    unit: '% of labor force',
    publishesProjections: true,
  },

  // --- Fiscal (SkU, FiU) — critical upgrade over WB ---
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.generalGovGrossDebt,
    name: 'General government gross debt',
    description:
      'Debt/GDP ratio on a general-government (EDP) basis. Superior to World Bank GC.DOD.TOTL.GD.ZS for EU policy discussion because it follows GFSM 2014.',
    policyAreas: ['fiscal policy', 'debt', 'EU stability and growth pact'],
    committees: ['FiU', 'SkU'],
    unit: '% of GDP',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.generalGovBalance,
    name: 'General government net lending / borrowing',
    description: 'Headline fiscal balance (surplus +, deficit −); projected to T+5.',
    policyAreas: ['fiscal policy', 'budget'],
    committees: ['FiU', 'SkU'],
    unit: '% of GDP',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.generalGovRevenue,
    name: 'General government revenue',
    description: 'Tax and non-tax revenue as % of GDP; projected to T+5.',
    policyAreas: ['fiscal policy', 'taxation'],
    committees: ['SkU', 'FiU'],
    unit: '% of GDP',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.generalGovExpenditure,
    name: 'General government expenditure',
    description: 'Total government spending as % of GDP; projected to T+5.',
    policyAreas: ['fiscal policy', 'public spending'],
    committees: ['FiU'],
    unit: '% of GDP',
    publishesProjections: true,
  },
  {
    database: 'FM',
    indicatorId: IMF_FM_INDICATORS.primaryBalance,
    name: 'General government primary balance',
    description: 'Fiscal balance excluding interest payments (Fiscal Monitor vintage).',
    policyAreas: ['fiscal policy', 'debt sustainability'],
    committees: ['FiU', 'SkU'],
    unit: '% of GDP',
    publishesProjections: true,
  },

  // --- External sector (NU, UU) ---
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.currentAccountBalance,
    name: 'Current account balance',
    description: 'Net external position (trade + primary + secondary income); projected to T+5.',
    policyAreas: ['external sector', 'trade'],
    committees: ['NU', 'UU', 'FiU'],
    unit: '% of GDP',
    publishesProjections: true,
  },
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.exportsVolumeGrowth,
    name: 'Exports volume growth',
    description: 'Real exports of goods and services, annual % change.',
    policyAreas: ['trade', 'export performance'],
    committees: ['NU', 'UU'],
    unit: 'Annual % change',
    publishesProjections: true,
  },

  // --- Demographics (SoU) ---
  {
    database: 'WEO',
    indicatorId: IMF_WEO_INDICATORS.population,
    name: 'Population',
    description: 'Total population (millions), WEO definition.',
    policyAreas: ['demographics'],
    committees: ['SoU', 'SfU'],
    unit: 'Millions',
    publishesProjections: true,
  },
]);

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** Find indicators relevant to one or more policy domains (case-insensitive). */
export function findImfIndicatorsForDomains(
  policyDomains: readonly string[],
): readonly ImfIndicatorContext[] {
  if (policyDomains.length === 0) return [];
  const lowered = policyDomains.map((d) => d.toLowerCase());
  return IMF_INDICATORS.filter((indicator) =>
    indicator.policyAreas.some((area) =>
      lowered.some((q) => area.toLowerCase().includes(q) || q.includes(area.toLowerCase())),
    ),
  );
}

/** Find indicators relevant to a Riksdag committee (e.g. 'FiU'). */
export function findImfIndicatorsForCommittee(
  committee: string,
): readonly ImfIndicatorContext[] {
  const upper = committee.toUpperCase();
  return IMF_INDICATORS.filter((indicator) =>
    indicator.committees.some((c) => c.toUpperCase() === upper),
  );
}

/** Default peer-country set for Nordic + DE comparisons. */
export const IMF_NORDIC_PEERS = Object.freeze([
  COUNTRY_CODES.sweden,
  COUNTRY_CODES.denmark,
  COUNTRY_CODES.norway,
  COUNTRY_CODES.finland,
  COUNTRY_CODES.germany,
] as const);

/** Look up a human-readable country name (English) by ISO-3 code. */
export function imfCountryNameEn(iso3: string): string {
  return COUNTRY_NAMES_EN[iso3.toUpperCase()] ?? iso3.toUpperCase();
}

/**
 * Build the `source.imf[]` citation string for an indicator. Format:
 * `DATABASE:INDICATOR_ID` (e.g. `WEO:NGDP_RPCH`, `FM:GGXWDG_NGDP`).
 */
export function imfCitation(database: ImfDatabase, indicatorId: string): string {
  return `${database}:${indicatorId}`;
}
