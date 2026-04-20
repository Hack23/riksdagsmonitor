/**
 * @module IMF/Codes
 * @description Canonical country / area code mappings for the IMF data
 * ecosystem (`data.imf.org`).
 *
 * The IMF exposes different country-code conventions in different
 * datasets:
 *  - **Datamapper** (`www.imf.org/external/datamapper/api/v1/*`) uses
 *    ISO-3 alpha-3 codes (SWE, DNK, NOR, FIN, DEU, USA).
 *  - **SDMX 3.0** (`data.imf.org`) is dataset-dependent: WEO uses ISO-3;
 *    IFS typically uses IMF area codes (3-digit numeric) from code list
 *    `CL_AREA_*`; Government Finance Statistics (GFS_COFOG) uses the
 *    same 3-digit numeric area codes.
 *
 * This module exposes:
 *  - `ISO3_TO_IMF_AREA` — ISO3 → IMF 3-digit area code (IFS/GFS/BOP)
 *  - `IMF_AREA_TO_ISO3` — inverse lookup
 *  - `toDatamapperCode(iso3)` — passthrough (Datamapper uses ISO3)
 *  - `toImfAreaCode(iso3)` — throws if mapping is unknown (fail-loud
 *    avoids silent data loss — see the plan's risk matrix)
 *  - `COUNTRY_CODES` — Nordic + EU peer set used by the article
 *    dashboards (SWE, DNK, NOR, FIN, DEU plus aggregates)
 *
 * The canonical IMF AREA reference is published in the SDMX code list
 * `CL_AREA` at data.imf.org; this module carries only the subset
 * Riksdagsmonitor queries. Extend as new datasets are onboarded.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * ISO 3166-1 alpha-3 codes for Sweden and the comparison peer set used
 * by Riksdagsmonitor article dashboards.
 */
export const COUNTRY_CODES = {
  sweden: 'SWE',
  denmark: 'DNK',
  norway: 'NOR',
  finland: 'FIN',
  germany: 'DEU',
  /** European Union (WEO/FM aggregate — `EU` in IMF WEO codelist) */
  europeanUnion: 'EU',
  /** Euro Area (WEO aggregate — `EURO` in IMF WEO codelist) */
  euroArea: 'EURO',
} as const;

/**
 * ISO3 → IMF 3-digit AREA code mapping for the peer set and a selection
 * of G7 comparators. Values from the IMF `CL_AREA` code list on
 * data.imf.org. The table is intentionally conservative — extend only
 * after a successful `imf_get_parameter_codes(database_id, "COUNTRY")`
 * round-trip against the dataset in question (some datasets use
 * different country code lists).
 */
export const ISO3_TO_IMF_AREA: Readonly<Record<string, string>> = Object.freeze({
  SWE: '144',
  DNK: '128',
  NOR: '142',
  FIN: '172',
  DEU: '134',
  USA: '111',
  GBR: '112',
  FRA: '132',
  ITA: '136',
  JPN: '158',
  CAN: '156',
  NLD: '138',
  POL: '964',
  ESP: '184',
});

/**
 * Inverse of `ISO3_TO_IMF_AREA`. Useful when SDMX responses include the
 * numeric area code and the consumer (article dashboard) needs ISO3 for
 * chart country labelling.
 */
export const IMF_AREA_TO_ISO3: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(Object.entries(ISO3_TO_IMF_AREA).map(([iso3, area]) => [area, iso3])),
);

/**
 * Datamapper uses ISO-3 alpha-3 codes directly. This function exists to
 * keep consumer call sites dataset-agnostic — pass ISO3 in, get the
 * right code back for the target endpoint.
 */
export function toDatamapperCode(iso3: string): string {
  const upper = iso3.trim().toUpperCase();
  // The Datamapper accepts EU / EURO aggregates as-is. ISO-3 regular
  // states pass through unchanged.
  return upper;
}

/**
 * Convert an ISO-3 alpha-3 code to the 3-digit IMF AREA code used in
 * SDMX 3.0 (IFS/GFS/BOP datasets). Throws when the mapping is unknown
 * to surface silent data loss early.
 */
export function toImfAreaCode(iso3: string): string {
  const upper = iso3.trim().toUpperCase();
  const area = ISO3_TO_IMF_AREA[upper];
  if (!area) {
    throw new Error(
      `toImfAreaCode: no IMF area code mapping for ISO-3 '${iso3}'. ` +
        `Add the entry to ISO3_TO_IMF_AREA after confirming with ` +
        `imf_get_parameter_codes(database_id, 'COUNTRY').`,
    );
  }
  return area;
}

/** Returns true when the code is a known ISO-3 we can map to IMF AREA. */
export function isKnownIso3(iso3: string): boolean {
  return Object.prototype.hasOwnProperty.call(ISO3_TO_IMF_AREA, iso3.trim().toUpperCase());
}

/** Localised country name map used by the article dashboards. English baseline. */
export const COUNTRY_NAMES_EN: Readonly<Record<string, string>> = Object.freeze({
  SWE: 'Sweden',
  DNK: 'Denmark',
  NOR: 'Norway',
  FIN: 'Finland',
  DEU: 'Germany',
  USA: 'United States',
  GBR: 'United Kingdom',
  FRA: 'France',
  ITA: 'Italy',
  JPN: 'Japan',
  CAN: 'Canada',
  NLD: 'Netherlands',
  POL: 'Poland',
  ESP: 'Spain',
  EU: 'European Union',
  EURO: 'Euro Area',
});
