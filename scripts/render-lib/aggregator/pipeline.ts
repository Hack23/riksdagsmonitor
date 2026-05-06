/**
 * @module Infrastructure/RenderLib/Aggregator/Pipeline
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Composable article pipeline orchestrator
 *
 * @description
 * Provides a typed, composable pipeline abstraction for the article.md
 * generation workflow. Each stage has explicit input/output contracts
 * and can be tested independently. The pipeline composes:
 *
 *   Read → Validate → Aggregate → Enrich → Write
 *
 * This module wraps the existing `aggregateAnalysis()` function with the
 * new pipeline interface, enabling incremental migration of consumers
 * without breaking the existing API.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type {
  ArticlePipelineConfig,
  PipelineResult,
  ReadStageInput,
  WriteStageOutput,
} from './interfaces.js';
import { aggregateAnalysis } from './aggregate.js';
import type { AggregationInput } from './aggregate.js';

/**
 * Execute the full article pipeline from analysis artifacts to article.md.
 *
 * This is a thin wrapper around `aggregateAnalysis()` that conforms to
 * the new `PipelineResult<WriteStageOutput>` discriminated union interface.
 * Existing consumers can continue using `aggregateAnalysis()` directly;
 * new consumers should prefer this typed pipeline entry point.
 *
 * @param input - Filesystem location and metadata for the analysis folder.
 * @param config - Optional overrides for `generated_at`, `language`, and `layout`
 *   front-matter fields. When omitted, defaults match `aggregateAnalysis()`.
 * @returns A discriminated union: `{ ok: true, value }` or `{ ok: false, error }`.
 */
export function runArticlePipeline(
  input: ReadStageInput,
  config?: ArticlePipelineConfig,
): PipelineResult<WriteStageOutput> {
  try {
    const aggregationInput: AggregationInput = {
      subfolderAbsPath: input.subfolderAbsPath,
      subfolderRepoRelPath: input.subfolderRepoRelPath,
      date: input.date,
      subfolder: input.subfolder,
      generated_at: config?.generated_at,
      language: config?.language,
      layout: config?.layout,
    };

    const result = aggregateAnalysis(aggregationInput);

    return {
      ok: true,
      value: {
        markdown: result.markdown,
        title: result.title,
        description: result.description,
        artifactsUsed: result.artifactsUsed,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: message,
    };
  }
}
