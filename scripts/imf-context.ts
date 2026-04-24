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
 * wider discovery, callers should use `ImfClient.sdmxFetch()` (see
 * `scripts/imf-client.ts`) directly against the SDMX 3.0 endpoint, or
 * invoke the `scripts/imf-fetch.ts sdmx --path ...` CLI from agentic
 * workflows.
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

  // --- COFOG — committee-aligned spending decomposition ---
  // COFOG codes (SDMX: GFS_COFOG database, 3-digit numeric). These are
  // the four functions Riksdagsmonitor reports align with directly:
  //   02 Defence         → FöU
  //   07 Health          → SoU
  //   09 Education       → UbU
  //   10 Social Protection → SfU
  {
    database: 'GFS_COFOG',
    indicatorId: 'G02',
    name: 'Government spending — Defence (COFOG 02)',
    description:
      'General-government expenditure on defence as a share of total outlays. Committee-aligned with FöU (Defence).',
    policyAreas: ['defence', 'public spending'],
    committees: ['FöU', 'FiU'],
    unit: 'Currency (flow) or % of total outlays',
    publishesProjections: false,
  },
  {
    database: 'GFS_COFOG',
    indicatorId: 'G07',
    name: 'Government spending — Health (COFOG 07)',
    description: 'General-government expenditure on health. Committee-aligned with SoU (Health & Welfare).',
    policyAreas: ['health', 'public spending'],
    committees: ['SoU', 'FiU'],
    unit: 'Currency (flow) or % of total outlays',
    publishesProjections: false,
  },
  {
    database: 'GFS_COFOG',
    indicatorId: 'G09',
    name: 'Government spending — Education (COFOG 09)',
    description: 'General-government expenditure on education. Committee-aligned with UbU (Education).',
    policyAreas: ['education', 'public spending'],
    committees: ['UbU', 'FiU'],
    unit: 'Currency (flow) or % of total outlays',
    publishesProjections: false,
  },
  {
    database: 'GFS_COFOG',
    indicatorId: 'G10',
    name: 'Government spending — Social protection (COFOG 10)',
    description:
      'General-government expenditure on social protection. Committee-aligned with SfU (Social Insurance).',
    policyAreas: ['social protection', 'public spending', 'welfare'],
    committees: ['SfU', 'FiU'],
    unit: 'Currency (flow) or % of total outlays',
    publishesProjections: false,
  },

  // --- Monetary (FiU — Riksbank oversight) ---
  {
    database: 'MFS_IR',
    indicatorId: 'FPOLM_PA',
    name: 'Central bank policy rate',
    description:
      'Riksbank policy (styrränta) rate, monthly. Primary monetary-policy reference; pairs with WEO:PCPIPCH for the inflation/policy-rate narrative.',
    policyAreas: ['monetary policy', 'interest rates'],
    committees: ['FiU'],
    unit: '% per annum',
    publishesProjections: false,
  },

  // --- Trade (NU/UU — bilateral flows) ---
  {
    database: 'DOTS',
    indicatorId: 'TXG_FOB_USD',
    name: 'Exports of goods, FOB (USD, bilateral)',
    description:
      'Bilateral goods exports by partner country. Indispensable for NU trade-policy and UU foreign-affairs coverage where partner-country exposure matters.',
    policyAreas: ['trade', 'external sector'],
    committees: ['NU', 'UU'],
    unit: 'Current USD, millions',
    publishesProjections: false,
  },

  // --- Exchange rates (FiU/NU) ---
  {
    database: 'IFS',
    indicatorId: 'ENDA_XDC_USD_RATE',
    name: 'Exchange rate — SEK per USD (end of period)',
    description:
      'End-of-period nominal exchange rate vs USD. Pairs with WEO:PCPIPCH and PCPS commodity-price overlays for inflation-drivers commentary.',
    policyAreas: ['monetary policy', 'exchange rates'],
    committees: ['FiU', 'NU'],
    unit: 'SEK per USD',
    publishesProjections: false,
  },

  // --- Commodities (MJU — energy, FiU — inflation drivers) ---
  {
    database: 'IFS',
    indicatorId: 'POILAPSP',
    name: 'Crude oil price index (APSP average)',
    description:
      'IMF Average Petroleum Spot Price index. Key overlay for MJU environment/energy coverage and for FiU inflation-driver commentary.',
    policyAreas: ['energy', 'inflation', 'environment'],
    committees: ['MJU', 'FiU'],
    unit: 'Index, 2016 = 100',
    publishesProjections: false,
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

/**
 * Direct lookup by canonical `DATABASE:INDICATOR_ID` citation. Returns
 * `undefined` if the indicator is not in the curated context catalogue
 * — callers should fall back to {@link findImfIndicatorsForDomains} or
 * {@link findImfIndicatorsForCommittee} for broader discovery.
 *
 * @example
 * ```ts
 * const ind = findImfIndicatorByCode('WEO', 'NGDP_RPCH');
 * // → { database: 'WEO', indicatorId: 'NGDP_RPCH', name: 'Real GDP growth', ... }
 * ```
 */
export function findImfIndicatorByCode(
  database: ImfDatabase,
  indicatorId: string,
): ImfIndicatorContext | undefined {
  const upperDb = database.toUpperCase() as ImfDatabase;
  const upperId = indicatorId.toUpperCase();
  return IMF_INDICATORS.find(
    (ind) => ind.database === upperDb && ind.indicatorId.toUpperCase() === upperId,
  );
}

/**
 * Parse a `DATABASE:INDICATOR_ID` citation string and look up the
 * corresponding indicator context. Returns `undefined` for malformed
 * citations or unknown entries. Symmetric with {@link imfCitation}.
 */
export function findImfIndicatorByCitation(
  citation: string,
): ImfIndicatorContext | undefined {
  const idx = citation.indexOf(':');
  if (idx <= 0 || idx === citation.length - 1) return undefined;
  const db = citation.slice(0, idx) as ImfDatabase;
  const id = citation.slice(idx + 1);
  return findImfIndicatorByCode(db, id);
}

/**
 * Enumerate the set of IMF databases actually referenced by the curated
 * catalogue. Used by workflow introspection tooling to decide which
 * transport (Datamapper vs SDMX) will be exercised for a given article.
 */
export function getImfDatabasesInUse(): ReadonlySet<ImfDatabase> {
  return new Set(IMF_INDICATORS.map((ind) => ind.database));
}

/**
 * Build a committee → indicators matrix (keys UPPERCASE) mirroring the
 * shape of `analysis/imf/indicators-inventory.json → committeeMatrix`
 * without loading the JSON inventory. Useful for workflow-level summaries
 * ("for FiU we will pull: WEO:NGDP_RPCH, WEO:PCPIPCH, …").
 *
 * Committees are derived from the curated {@link IMF_INDICATORS} catalogue,
 * so this matrix is always internally consistent with the code.
 *
 * @example
 * ```ts
 * const matrix = getImfCommitteeMatrix();
 * matrix.get('FIU'); // → ['WEO:NGDP_RPCH', 'WEO:PCPIPCH', ...]
 * ```
 */
export function getImfCommitteeMatrix(): ReadonlyMap<string, readonly string[]> {
  const matrix = new Map<string, Set<string>>();
  for (const ind of IMF_INDICATORS) {
    const citation = imfCitation(ind.database, ind.indicatorId);
    for (const committee of ind.committees) {
      const key = committee.toUpperCase();
      if (!matrix.has(key)) matrix.set(key, new Set());
      matrix.get(key)!.add(citation);
    }
  }
  const out = new Map<string, readonly string[]>();
  for (const [committee, citations] of matrix) {
    out.set(committee, Object.freeze([...citations].sort()));
  }
  return out;
}

/**
 * Enumerate all indicator citations (`DATABASE:INDICATOR_ID`) exposed by
 * the curated catalogue, sorted alphabetically. Useful for workflow logs
 * and for cross-checking with `indicators-inventory.json`.
 */
export function listImfCitations(): readonly string[] {
  return Object.freeze(
    IMF_INDICATORS.map((ind) => imfCitation(ind.database, ind.indicatorId)).sort(),
  );
}
