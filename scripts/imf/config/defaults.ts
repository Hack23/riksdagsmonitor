/**
 * @module imf/config/defaults
 * @description Default base URLs, timeouts, user-agent and WEO vintage
 * for the IMF client.
 *
 * Keep all magic constants here so the transport layers (`transport/`)
 * and orchestrator (`client.ts`) never embed literals — making vintage
 * bumps (April / October WEO releases) and base-URL overrides trivial.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export const DEFAULT_DATAMAPPER_BASE_URL = 'https://www.imf.org/external/datamapper/api/v1';
export const DEFAULT_SDMX_BASE_URL = 'https://api.imf.org/external/sdmx/3.0';
export const DEFAULT_TIMEOUT = 15_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; Riksdagsmonitor; +https://riksdagsmonitor.com)';

/**
 * Default WEO release vintage. Bump in April / October when the IMF
 * publishes a new flagship release. Article workflows annotate any
 * value older than 6 months with the `>6 month vintage` flag — see
 * `.github/aw/ECONOMIC_DATA_CONTRACT.md §Vintage discipline`.
 */
export const DEFAULT_WEO_VINTAGE = 'WEO-2026-04';
