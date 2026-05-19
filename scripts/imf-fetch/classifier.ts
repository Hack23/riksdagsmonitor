/**
 * @module scripts/imf-fetch/classifier
 * @description Classify IMF fetch errors as transient or permanent.
 *
 * Used by `subcommands/weo.ts` to decide whether to retry. Tightly
 * coupled to {@link ImfWeoSdmxOnlyError} (always permanent — the
 * Datamapper genuinely does not carry the indicator) and the
 * `EMPTY_DATAMAPPER_SERIES_CODE` sentinel raised when Datamapper
 * returns 200 + empty envelope for a code listed in
 * `IMF_WEO_DATAMAPPER_AVAILABLE`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { ImfWeoSdmxOnlyError } from '../imf/errors/weo-sdmx-only.js';
import type { ImfCliFailureClassification } from './logger.js';

/** Sentinel `Error.code` for "Datamapper returned 200 + empty envelope" cases. */
export const EMPTY_DATAMAPPER_SERIES_CODE = 'datamapper-empty-series';

export function classifyImfFetchError(err: unknown): ImfCliFailureClassification {
  if (err instanceof ImfWeoSdmxOnlyError) return 'permanent';
  if (
    err instanceof Error &&
    'code' in err &&
    (err as { code?: unknown }).code === EMPTY_DATAMAPPER_SERIES_CODE
  ) {
    return 'transient';
  }
  if (
    err instanceof Error &&
    'retryable' in err &&
    typeof (err as { retryable?: unknown }).retryable === 'boolean'
  ) {
    return (err as { retryable: boolean }).retryable ? 'transient' : 'permanent';
  }
  if (err instanceof Error && 'name' in err && err.name === 'AbortError') {
    return 'transient';
  }
  if (
    err instanceof Error &&
    'status' in err &&
    typeof (err as { status?: unknown }).status === 'number'
  ) {
    const status = (err as { status: number }).status;
    return status === 429 || status >= 500 ? 'transient' : 'permanent';
  }
  const message = err instanceof Error ? err.message : String(err);
  if (
    /timeout|timed out|fetch failed|failed to fetch|network|ecconn|eai_again|empty series/i.test(
      message,
    )
  ) {
    return 'transient';
  }
  return 'permanent';
}
