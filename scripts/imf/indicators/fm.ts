/**
 * @module imf/indicators/fm
 * @description Commonly-referenced IMF Fiscal Monitor (FM) indicators.
 *
 * The codes below are the **logical** FM identifiers used in
 * `FM:<code>` article citations and routed through SDMX 3.0 against
 * the `IMF.FAD,FM,5.1.0` dataflow. The Datamapper FM dataset uses
 * different suffix conventions (`GGXONLB_G01_GDP_PT`,
 * `G_XWDG_G01_GDP_PT`, …) — see the live catalog via
 * `imf-fetch.ts list-datamapper-indicators --dataset FM`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export const IMF_FM_INDICATORS = {
  /** General government gross debt, % of GDP (FM vintage — may differ slightly from WEO). */
  generalGovGrossDebtFm: 'GGXWDG_NGDP',
  /** General government primary balance, % of GDP. */
  primaryBalance: 'GGXONLB_NGDP',
} as const;
