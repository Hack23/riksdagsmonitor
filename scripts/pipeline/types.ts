/**
 * @module pipeline/types
 * @description ContentPipeline interface and related types for the standardised
 * article-generation lifecycle: fetch → transform → generate → validate → write.
 *
 * Each article type implements `ContentPipeline` and is executed by the
 * `PipelineOrchestrator` in `orchestrator.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { GenerationResult } from '../types/article.js';

// ---------------------------------------------------------------------------
// Pipeline stage lifecycle
// ---------------------------------------------------------------------------

/**
 * Named stages of the article-generation lifecycle.
 * Stages execute sequentially for each language variant.
 */
export type PipelineStage = 'fetch' | 'transform' | 'generate' | 'validate' | 'write';

// ---------------------------------------------------------------------------
// Pipeline result
// ---------------------------------------------------------------------------

/**
 * Rich result returned by a completed pipeline run.
 * Extends `GenerationResult` with per-stage timing and degradation metadata.
 */
export interface PipelineResult extends GenerationResult {
  /** Wall-clock time in milliseconds for the complete pipeline run. */
  durationMs?: number;
  /**
   * Per-stage duration breakdown (ms).
   * Keys match `PipelineStage` values.
   */
  stageDurations?: Partial<Record<PipelineStage, number>>;
  /**
   * Warnings collected during the run (e.g. MCP queries that returned no data
   * but were handled via graceful degradation).
   */
  warnings?: string[];
  /**
   * Whether the pipeline used cached / fallback data for any stage.
   * `true` indicates at least one graceful-degradation path was taken.
   */
  degraded?: boolean;
}

// ---------------------------------------------------------------------------
// Pipeline options
// ---------------------------------------------------------------------------

/**
 * Common options accepted by every `ContentPipeline.run()` implementation.
 */
export interface PipelineOptions {
  /** Language variants to generate. Defaults to `['en', 'sv']`. */
  languages?: Language[];
  /**
   * Callback invoked after each article HTML is generated.
   * Used by the orchestrator to write files.  When `null` the article is
   * generated in-memory only (useful for tests / dry-run mode).
   */
  writeArticle?: ((html: string, filename: string) => Promise<void>) | null;
  /**
   * When `true` articles are generated even when source data is sparse.
   * Defaults to `false`.
   */
  allowDegradedContent?: boolean;
}

// ---------------------------------------------------------------------------
// ContentPipeline interface
// ---------------------------------------------------------------------------

/**
 * Contract that every article-type plugin must implement.
 *
 * Lifecycle:
 * 1. **fetch**     – Retrieve raw data from MCP tools (may partially fail).
 * 2. **transform** – Convert raw data into article payloads per language.
 * 3. **generate**  – Render HTML via `generateArticleHTML`.
 * 4. **validate**  – Verify HTML structure before writing.
 * 5. **write**     – Persist files to `news/` directory.
 *
 * Implementations are responsible for graceful degradation: if the `fetch`
 * stage partially fails they should log a warning and continue with whatever
 * data is available rather than throwing.
 */
export interface ContentPipeline {
  /**
   * Human-readable name of this pipeline (e.g. `'motions'`).
   * Used for logging and metrics.
   */
  readonly name: string;

  /**
   * Execute the full pipeline lifecycle and return a `PipelineResult`.
   *
   * Implementations **must not throw** — all errors should be caught and
   * returned via `PipelineResult.success = false` and `PipelineResult.error`.
   */
  run(options?: PipelineOptions): Promise<PipelineResult>;
}

// ---------------------------------------------------------------------------
// Orchestrator configuration
// ---------------------------------------------------------------------------

/**
 * Configuration passed to `PipelineOrchestrator`.
 */
export interface OrchestratorConfig {
  /** Pipelines to run.  Order matters when `parallel = false`. */
  pipelines: ContentPipeline[];
  /**
   * When `true` all pipelines run concurrently via `Promise.all`.
   * Defaults to `false` (sequential) for predictable logging.
   */
  parallel?: boolean;
  /** Default options forwarded to each pipeline unless overridden. */
  defaultOptions?: PipelineOptions;
}

/**
 * Aggregate result produced by the orchestrator after running all pipelines.
 */
export interface OrchestratorResult {
  /** `true` when every pipeline in the run reported success. */
  allSucceeded: boolean;
  /** Total number of files written across all pipelines. */
  totalFiles: number;
  /** Individual results keyed by pipeline name. */
  results: Record<string, PipelineResult>;
  /** Warnings collected across all pipelines. */
  warnings: string[];
  /** Total wall-clock time for the orchestrator run (ms). */
  durationMs: number;
}
