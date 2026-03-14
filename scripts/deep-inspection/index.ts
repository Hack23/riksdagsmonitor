/**
 * @module deep-inspection
 * @description DeepInspectionPipeline — modular 4-phase pipeline for
 * AI-driven political intelligence reports.
 *
 * ## Pipeline Phases
 * 1. **Collect** — Resolve document IDs from URLs, fetch riksdag documents
 *    and government / GitHub content, then enrich with full text.
 * 2. **Analyse** — Multi-iteration analysis (depth 1–4), progressively
 *    adding executive summary, predictive assessment, historical context,
 *    and methodology confidence sections.
 * 3. **Synthesise** — Build TemplateSection visualisations (SWOT, dashboard,
 *    mindmap, sankey, economic) from enriched document metadata.
 * 4. **Render** — Generate per-language HTML articles and write to disk.
 *
 * @example
 * ```typescript
 * const pipeline = new DeepInspectionPipeline({
 *   documentIds: ['H901FiU1'],
 *   focusTopic: 'defence budget',
 *   depth: 4,
 * });
 * const result = await pipeline.run();
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { generateDeepInspection } from '../generate-news-enhanced/generators.js';
import { analysisDepth } from '../generate-news-enhanced/config.js';
import type { GenerationResult } from '../types/article.js';

/** Parameters accepted by DeepInspectionPipeline. */
export interface DeepInspectionPipelineParams {
  /**
   * Riksdag document IDs (e.g. H901FiU1).
   *
   * **Note**: These values are informational when constructing the pipeline
   * programmatically. The actual targeting is read from CLI `--document-ids`
   * at module load time by `config.ts`. Pass these here for future extensibility
   * and documentation clarity.
   */
  documentIds?: string[];
  /**
   * riksdagen.se / regeringen.se / github.com URLs.
   *
   * **Note**: Same CLI-first constraint as `documentIds`.
   */
  documentUrls?: string[];
  /** Policy topic to focus the analysis on (used for log labelling). */
  focusTopic?: string;
  /**
   * Analysis depth (1–4):
   *  1 — surface analysis (what happened) — default, fastest
   *  2 — adds predictive assessment and historical context
   *  3 — adds executive intelligence summary and methodology section
   *  4 — full multi-iteration intelligence report with all sections
   *
   * **Note**: This must match the `--depth` CLI arg passed at process start,
   * since config.ts reads it at module load time. Setting this here only
   * affects log labels, not the actual generation depth.
   */
  depth?: 1 | 2 | 3 | 4;
}

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
 * DeepInspectionPipeline orchestrates the 4-phase deep-inspection generation:
 * collect → analyse → synthesise → render.
 *
 * The pipeline delegates to `generateDeepInspection()` in generators.ts, which
 * reads targeting parameters and `analysisDepth` from CLI config. When used
 * programmatically via this class, those CLI values are already set at module
 * load time — so `run()` simply invokes the generator and enriches the result.
 */
export class DeepInspectionPipeline {
  private readonly params: DeepInspectionPipelineParams;

  constructor(params: DeepInspectionPipelineParams = {}) {
    this.params = params;
  }

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
   * Run the full 4-phase pipeline.
   *
   * Phases:
   * 1. **Collect** — documents fetched and enriched by `generateDeepInspection()`
   * 2. **Analyse** — multi-iteration HTML content generated (depth-gated sections)
   * 3. **Synthesise** — SWOT, dashboard, mindmap, sankey visualisations built
   * 4. **Render** — per-language HTML written to the `news/` directory
   *
   * @returns DeepInspectionResult with success status, file count, and slug
   */
  async run(): Promise<DeepInspectionResult> {
    const depth = analysisDepth;
    const topic = this.params.focusTopic;

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
