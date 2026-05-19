/**
 * @module scripts/imf-client
 * @description Thin re-export shim for the bounded-context IMF client.
 *
 * The implementation was split into `scripts/imf/` in the 2026-05
 * refactor (Hack23/riksdagsmonitor#2580). This shim preserves the
 * stable public surface so callers (`imf-fetch`, `imf-context`,
 * `check-imf-connectivity`, and `tests/imf-client.test.ts`) keep
 * working unchanged. Add new symbols to the relevant submodule, not
 * here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { ImfClient, getDefaultImfClient } from './imf/client.js';
export type {
  ImfBatchIndicatorErrorEvent,
  ImfClientConfig,
  ImfDataPoint,
} from './imf/types.js';

// Errors
export { ImfHttpError } from './imf/errors/http-error.js';
export { ImfWeoSdmxOnlyError } from './imf/errors/weo-sdmx-only.js';

// Indicators
export {
  IMF_WEO_INDICATORS,
  IMF_WEO_DATAMAPPER_AVAILABLE,
  IMF_WEO_SDMX_ONLY,
  weoSdmxPath,
} from './imf/indicators/weo.js';
export { IMF_FM_INDICATORS } from './imf/indicators/fm.js';
export {
  COFOG_DEFENCE,
  COFOG_EDUCATION,
  COFOG_HEALTH,
  COFOG_SOCIAL_PROTECTION,
  IMF_GFS_COFOG_CODES,
} from './imf/indicators/cofog-codes.js';

// Parsers
export {
  parseDatamapperIndicators,
  parseDatamapperValues,
} from './imf/parsers/datamapper-envelope.js';
export type {
  DatamapperEnvelope,
  DatamapperIndicatorsResponse,
  DatamapperResponse,
  ImfDatamapperIndicatorMeta,
} from './imf/parsers/datamapper-envelope.js';

// Transport helpers (exported for tests)
export {
  calculateRetryDelay,
  RETRY_AFTER_CAP_MS,
} from './imf/transport/retry.js';
export { normalizeSdmxPathForBase } from './imf/transport/path-normaliser.js';
