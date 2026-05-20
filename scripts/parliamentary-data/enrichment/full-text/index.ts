/**
 * @module parliamentary-data/enrichment/full-text
 * @description Two full-text enrichment flows for downloaded parliamentary
 * documents. Orchestrator + re-export surface; implementation lives in
 * sibling modules under `./full-text/`:
 *
 *  - {@link enrichTopDocumentsWithDetails} (`./fetch-policy.ts`) — called
 *    from `downloadAllDocuments` after the initial metadata fetch. Mutates
 *    the first N documents per enrichable type in place, attempting to
 *    attach `fullContent`/`fullText` plus coverage/provenance metadata.
 *    NO filesystem writes.
 *
 *  - {@link fetchFullTextForTopN} (`./stitcher.ts`) — explicit top-N
 *    persistence flow that writes one `.md` file per successfully fetched
 *    document to `{outputDir}/full-text/`. Returns per-document outcomes
 *    for the data-download manifest and analysis gate.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export {
  MAX_ENRICHMENT_PER_TYPE,
  LONG_HORIZON_FULL_TEXT_FLOOR,
} from './top-n-selection.js';

export {
  enrichTopDocumentsWithDetails,
  type EnrichTopDocumentsOptions,
} from './fetch-policy.js';

export {
  fetchFullTextForTopN,
  type FullTextFetchOutcome,
} from './stitcher.js';
