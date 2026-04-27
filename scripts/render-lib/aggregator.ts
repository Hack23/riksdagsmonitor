/**
 * @module Infrastructure/RenderLib/Aggregator (compat shim)
 * @category Intelligence Operations / Supporting Infrastructure
 *
 * @description
 * Backwards-compatibility re-export shim. The real implementation lives
 * in `aggregator/` (Round-5 split into 12 bounded-context leaf modules).
 * Existing consumers that `import { … } from './aggregator.js'` continue
 * to work without change.
 *
 * **Do not add new code here** — extend the matching leaf module under
 * `aggregator/` instead. This shim exists only so that:
 * - `scripts/render-lib/index.ts` keeps working.
 * - `scripts/aggregate-analysis.ts` and `scripts/render-articles.ts`
 *   keep their existing import paths.
 * - `tests/render-lib*.ts` import paths keep resolving.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export {
  AGGREGATION_ORDER,
  __test__,
  aggregateAnalysis,
  prettifyFallbackTitle,
  titleForArtifact,
} from './aggregator/index.js';
export type {
  AggregationInput,
  AggregationResult,
  AggregatorTestApi,
} from './aggregator/index.js';
