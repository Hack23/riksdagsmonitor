/**
 * @module imf/errors/weo-sdmx-only
 * @description Diagnostic error for WEO indicators that the Datamapper
 * does not serve (returns an empty envelope) and require SDMX 3.0.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { weoSdmxPath } from '../indicators/weo.js';

/**
 * Thrown by `ImfClient.getWeoIndicator` when the requested code lives
 * in `IMF_WEO_SDMX_ONLY` (i.e. the Datamapper transport returned zero
 * points). Carries the SDMX path the caller should use instead so
 * agents can recover programmatically.
 */
export class ImfWeoSdmxOnlyError extends Error {
  readonly weoCode: string;
  readonly countryCode: string;
  readonly sdmxPath: string;
  constructor(iso3: string, weoCode: string) {
    const normalisedIso3 = iso3.toUpperCase();
    const sdmxPath = weoSdmxPath(normalisedIso3, weoCode);
    super(
      `IMF WEO indicator '${weoCode}' is not exposed by the Datamapper for '${normalisedIso3}'. ` +
        `Use sdmxFetch('${sdmxPath}') with IMF_SDMX_SUBSCRIPTION_KEY set, or the ` +
        `'imf-fetch sdmx --path ${sdmxPath} --indicator ${weoCode} --country ${normalisedIso3}' CLI.`,
    );
    this.name = 'ImfWeoSdmxOnlyError';
    this.weoCode = weoCode;
    this.countryCode = normalisedIso3;
    this.sdmxPath = sdmxPath;
  }
}
