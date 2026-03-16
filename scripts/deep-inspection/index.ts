/**
 * @module deep-inspection
 * @description DeepInspectionPipeline — thin programmatic entrypoint wrapper
 * around `generateDeepInspection()`.
 *
 * The underlying generator performs collection, analysis, synthesis, and
 * rendering internally. This class intentionally does not re-implement those
 * phases; it only delegates execution and returns enriched run metadata.
 *
 * @example
 * ```typescript
 * const pipeline = new DeepInspectionPipeline();
 * const result = await pipeline.run();
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { generateDeepInspection } from '../generate-news-enhanced/generators.js';
import { analysisDepth, focusTopic } from '../generate-news-enhanced/config.js';
import type { GenerationResult } from '../types/article.js';

/**
 * Result produced by a pipeline run.
 * Extends GenerationResult with optional depth and topic metadata.
 */
export interface DeepInspectionResult extends GenerationResult {
  /** Effective analysis depth used. */
  depth: 1 | 2 | 3 | 4;
  /** Focus topic if provided. */
  topic?: string;
}

/**
 * DeepInspectionPipeline delegates execution to
 * `generateDeepInspection()` in generators.ts, which
 * reads targeting parameters and `analysisDepth` from CLI config. When used
 * programmatically via this class, those CLI values are already set at module
 * load time — so `run()` simply invokes the generator and enriches the result.
 *
 * All targeting (document IDs, URLs) and analysis depth are controlled via CLI
 * arguments parsed by `config.ts` at module load time. This class provides a
 * clean programmatic entrypoint without duplicating CLI parameter handling.
 */
export class DeepInspectionPipeline {
  /**
   * Phase labels for logging purposes.
   * @internal
   */
  private phaseLabel(depth: 1 | 2 | 3 | 4): string {
    const labels: Record<1 | 2 | 3 | 4, string> = {
      1: 'Surface analysis — events & actors',
      2: 'Predictive + historical context',
      3: 'Full report with executive summary & methodology',
      4: 'Full multi-iteration intelligence report',
    };
    return labels[depth];
  }

  /**
   * Run deep-inspection generation via the underlying generator wrapper.
   *
   * @returns DeepInspectionResult with success status, file count, and slug
   */
  async run(): Promise<DeepInspectionResult> {
    const depth = analysisDepth;
    const topic = focusTopic || undefined;

    console.log(`🔬 DeepInspectionPipeline starting — depth ${depth}: ${this.phaseLabel(depth)}`);
    if (topic) console.log(`   Topic: ${topic}`);

    const result = await generateDeepInspection();

    return {
      ...result,
      depth,
      topic,
    };
  }
}

export default DeepInspectionPipeline;
