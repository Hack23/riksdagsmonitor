/**
 * @module pipeline/orchestrator
 * @description Unified pipeline orchestrator.
 *
 * The `PipelineOrchestrator` runs a collection of `ContentPipeline` instances
 * either sequentially (default) or in parallel, collects results, logs
 * progress, and surfaces a structured `OrchestratorResult`.
 *
 * Usage (sequential):
 * ```ts
 * import { PipelineOrchestrator } from './pipeline/orchestrator.js';
 * import { MotionsPipeline } from './pipeline/plugins/motions-pipeline.js';
 *
 * const orchestrator = new PipelineOrchestrator({
 *   pipelines: [new MotionsPipeline()],
 * });
 * const result = await orchestrator.run();
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  ContentPipeline,
  OrchestratorConfig,
  OrchestratorResult,
  PipelineOptions,
  PipelineResult,
} from './types.js';

// ---------------------------------------------------------------------------
// PipelineOrchestrator
// ---------------------------------------------------------------------------

/**
 * Orchestrates the execution of one or more `ContentPipeline` instances.
 *
 * Key behaviours:
 * - **Error isolation**: a failure in one pipeline does not abort others.
 * - **Parallel mode**: when `config.parallel = true` all pipelines run via
 *   `Promise.all` for throughput; otherwise they execute sequentially for
 *   predictable log output.
 * - **Result aggregation**: all per-pipeline `PipelineResult` objects are
 *   merged into a single `OrchestratorResult`.
 */
export class PipelineOrchestrator {
  private readonly pipelines: ContentPipeline[];
  private readonly parallel: boolean;
  private readonly defaultOptions: PipelineOptions;

  constructor(config: OrchestratorConfig) {
    this.pipelines = config.pipelines;
    this.parallel = config.parallel ?? false;
    this.defaultOptions = config.defaultOptions ?? {};
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Run all pipelines and return an aggregated `OrchestratorResult`.
   *
   * @param overrideOptions - Options forwarded to every pipeline, merged on
   *                          top of `defaultOptions`.
   */
  async run(overrideOptions?: PipelineOptions): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const effectiveOptions: PipelineOptions = {
      ...this.defaultOptions,
      ...(overrideOptions ?? {}),
    };

    const results: Record<string, PipelineResult> = {};

    if (this.parallel) {
      const settled = await Promise.allSettled(
        this.pipelines.map(p => this._runSingle(p, effectiveOptions)),
      );
      for (let i = 0; i < this.pipelines.length; i++) {
        const pipeline = this.pipelines[i]!;
        const outcome = settled[i]!;
        if (outcome.status === 'fulfilled') {
          results[pipeline.name] = outcome.value;
        } else {
          // Promise should never reject because _runSingle catches all errors,
          // but handle it defensively.
          results[pipeline.name] = {
            success: false,
            error: String((outcome as PromiseRejectedResult).reason),
            warnings: [],
            degraded: false,
          };
        }
      }
    } else {
      for (const pipeline of this.pipelines) {
        results[pipeline.name] = await this._runSingle(pipeline, effectiveOptions);
      }
    }

    return this._aggregate(results, Date.now() - startTime);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Run a single pipeline, wrapping any unexpected throws in a failed result.
   */
  private async _runSingle(
    pipeline: ContentPipeline,
    options: PipelineOptions,
  ): Promise<PipelineResult> {
    console.log(`[Orchestrator] ▶ Starting pipeline: ${pipeline.name}`);
    const t0 = Date.now();
    try {
      const result = await pipeline.run(options);
      const durationMs = Date.now() - t0;
      console.log(
        `[Orchestrator] ${result.success ? '✅' : '❌'} Pipeline "${pipeline.name}" completed in ${durationMs}ms`,
      );
      return { ...result, durationMs };
    } catch (err: unknown) {
      const durationMs = Date.now() - t0;
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Orchestrator] 💥 Pipeline "${pipeline.name}" threw unexpectedly after ${durationMs}ms: ${message}`,
      );
      return {
        success: false,
        error: message,
        durationMs,
        warnings: [`Unexpected throw from pipeline "${pipeline.name}": ${message}`],
        degraded: false,
      };
    }
  }

  /**
   * Aggregate individual pipeline results into a single orchestrator result.
   */
  private _aggregate(
    results: Record<string, PipelineResult>,
    totalDurationMs: number,
  ): OrchestratorResult {
    let totalFiles = 0;
    let allSucceeded = true;
    const warnings: string[] = [];

    for (const [name, result] of Object.entries(results)) {
      if (!result.success) {
        allSucceeded = false;
        console.warn(`[Orchestrator] ⚠ Pipeline "${name}" did not succeed: ${result.error ?? 'unknown error'}`);
      }
      totalFiles += result.files ?? 0;
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }

    console.log(
      `[Orchestrator] 🏁 All pipelines done. ` +
        `success=${allSucceeded}, files=${totalFiles}, duration=${totalDurationMs}ms`,
    );

    return {
      allSucceeded,
      totalFiles,
      results,
      warnings,
      durationMs: totalDurationMs,
    };
  }
}
