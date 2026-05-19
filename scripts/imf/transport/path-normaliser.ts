/**
 * @module imf/transport/path-normaliser
 * @description SDMX path normalisation for the IMF SDMX 3.0 gateway.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Translate a comma-form SDMX dataflow reference
 * (`/data/AGENCY,FLOW,VERSION/key` — the SDMX 2.x URN style still used
 * by all of our docs / CLI / `weoSdmxPath` for human readability) into
 * the slash form (`/data/dataflow/AGENCY/FLOW/VERSION/key`) that the
 * IMF SDMX 3.0 REST gateway requires. The 3.0 endpoint silently 404s
 * the comma form. Verified live against `api.imf.org` 2026-05-10.
 *
 * SDMX 3.0 is the only IMF SDMX surface this client targets; legacy
 * SDMX surfaces are not configured anywhere in the repo.
 */
export function normalizeSdmxPathForBase(baseURL: string, pathWithQuery: string): string {
  if (!baseURL.includes('/sdmx/3.0')) {
    return pathWithQuery;
  }
  if (pathWithQuery.includes('/data/dataflow/')) {
    return pathWithQuery;
  }
  const re = /^(\/?data)\/([^/,?#]+),([^/,?#]+),([^/,?#]+)(\/[^?#]*)?(\?.*)?$/;
  const m = re.exec(pathWithQuery);
  if (!m) {
    return pathWithQuery;
  }
  const [, dataPrefix, agency, flow, version, keyPart, query] = m;
  return `${dataPrefix}/dataflow/${agency}/${flow}/${version}${keyPart ?? ''}${query ?? ''}`;
}
