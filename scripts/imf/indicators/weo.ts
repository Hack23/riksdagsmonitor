/**
 * @module imf/indicators/weo
 * @description Canonical IMF World Economic Outlook (WEO) indicators.
 *
 * Includes the logical WEO surface used in `WEO:<code>` article
 * citations, plus the Datamapper/SDMX partition and the `weoSdmxPath`
 * helper. Co-locating these lets the type system reject calling the
 * Datamapper transport with an SDMX-only indicator.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Canonical IMF WEO indicator IDs used by Riksdagsmonitor articles.
 *
 * **Logical WEO surface** — these are the codes article workflows cite
 * as `WEO:<code>`. Some are addressable via the simple Datamapper JSON
 * transport (see {@link IMF_WEO_DATAMAPPER_AVAILABLE}); the rest only
 * live in the full WEO 9.0.0 SDMX dataflow (`IMF.RES,WEO,9.0.0`) and
 * require {@link weoSdmxPath} with the `IMF_SDMX_SUBSCRIPTION_KEY`
 * set. The WEO release cadence is twice a year (April + October) —
 * bump `DEFAULT_WEO_VINTAGE` in `imf/config/defaults.ts` accordingly.
 */
export const IMF_WEO_INDICATORS = {
  /** Real GDP growth, annual % change — headline macro indicator. */
  gdpGrowth: 'NGDP_RPCH',
  /** Nominal GDP, current USD. */
  gdpUsd: 'NGDPD',
  /** GDP per capita, current USD. */
  gdpPerCapita: 'NGDPDPC',
  /** Inflation, average consumer prices, annual % change. */
  inflationCpi: 'PCPIPCH',
  /** Unemployment rate, % of total labor force. */
  unemployment: 'LUR',
  /** General government gross debt, % of GDP. */
  generalGovGrossDebt: 'GGXWDG_NGDP',
  /** General government revenue, % of GDP. SDMX-only on Datamapper as of WEO 2026-04. */
  generalGovRevenue: 'GGR_NGDP',
  /** General government total expenditure, % of GDP. SDMX-only on Datamapper as of WEO 2026-04. */
  generalGovExpenditure: 'GGX_NGDP',
  /** General government net lending / borrowing, % of GDP. */
  generalGovBalance: 'GGXCNL_NGDP',
  /** Current account balance, % of GDP. */
  currentAccountBalance: 'BCA_NGDPD',
  /** Volume of exports of goods and services, annual % change. SDMX-only on Datamapper as of WEO 2026-04. */
  exportsVolumeGrowth: 'TX_RPCH',
  /** Population (millions). */
  population: 'LP',
} as const;

/**
 * WEO indicator codes that are reachable through the simple Datamapper
 * JSON transport (`/external/datamapper/api/v1/{code}/{country}`).
 *
 * Verified live on 2026-05-10 against the live Datamapper indicator
 * catalog. Codes outside this set must be fetched via SDMX 3.0 against
 * the `IMF.RES,WEO,9.0.0` SDMX dataflow — see {@link weoSdmxPath}.
 */
export const IMF_WEO_DATAMAPPER_AVAILABLE: ReadonlySet<string> = new Set([
  'NGDP_RPCH',
  'NGDPD',
  'NGDPDPC',
  'PCPIPCH',
  'LUR',
  'GGXWDG_NGDP',
  'GGXCNL_NGDP',
  'BCA_NGDPD',
  'LP',
]);

/**
 * WEO codes declared by {@link IMF_WEO_INDICATORS} that the Datamapper
 * does not actually serve. The transport returns HTTP 200 with an
 * **empty `values` envelope** (verified live 2026-05-10) — never a 404 —
 * so callers cannot rely on HTTP status alone to detect this. Route
 * these through SDMX with the WEO 9.0.0 dataflow path produced by
 * {@link weoSdmxPath}.
 */
export const IMF_WEO_SDMX_ONLY: ReadonlySet<string> = new Set([
  'GGR_NGDP',
  'GGX_NGDP',
  'TX_RPCH',
  'GGXONLB_NGDP',
]);

/**
 * Build the SDMX 3.0 data path for a WEO code + country. Uses the WEO
 * 9.0.0 dataflow (the `IMF.RES:WEO(9.0.0)` URN) with annual frequency.
 *
 * @example
 *   weoSdmxPath('SWE', 'GGR_NGDP')
 *   // => '/data/IMF.RES,WEO,9.0.0/A.SWE.GGR_NGDP'
 */
export function weoSdmxPath(iso3: string, weoCode: string): string {
  const c = encodeURIComponent(iso3.toUpperCase());
  const i = encodeURIComponent(weoCode);
  return `/data/IMF.RES,WEO,9.0.0/A.${c}.${i}`;
}
