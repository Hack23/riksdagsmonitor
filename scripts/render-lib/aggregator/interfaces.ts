/**
 * @module Infrastructure/RenderLib/Aggregator/Interfaces
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Shared pipeline interfaces and types
 *
 * @description
 * Centralised type definitions for the article.md generation pipeline.
 * Every stage (read → validate → aggregate → enrich → write) uses these
 * interfaces as its contract, enabling independent testing and composability.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

// ─── Pipeline Stage Contracts ────────────────────────────────────────────────

/**
 * Generic result type for pipeline stages. Encapsulates either success
 * with a value or failure with an error message and optional diagnostics.
 */
export interface PipelineResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: string;
  readonly warnings?: readonly string[];
}

/**
 * A single pipeline stage: takes an input and produces a typed result.
 * Stages are composable — the output of one stage feeds the next.
 */
export interface PipelineStage<TInput, TOutput> {
  readonly name: string;
  execute(input: TInput): PipelineResult<TOutput>;
}

// ─── Read Stage ──────────────────────────────────────────────────────────────

/**
 * Input to the read stage: filesystem location of analysis artifacts.
 */
export interface ReadStageInput {
  /** Absolute path to `analysis/daily/$DATE/$SUBFOLDER`. */
  readonly subfolderAbsPath: string;
  /** Repo-relative path (e.g. `analysis/daily/2026-04-23/propositions`). */
  readonly subfolderRepoRelPath: string;
  /** `$DATE` (YYYY-MM-DD). */
  readonly date: string;
  /** `$SUBFOLDER` (e.g. `propositions`). */
  readonly subfolder: string;
}

/**
 * A single analysis artifact read from disk.
 */
export interface ArtifactFile {
  /** Filename relative to the subfolder (e.g. `executive-brief.md`). */
  readonly fileName: string;
  /** Raw file content (UTF-8). */
  readonly content: string;
}

/**
 * Output of the read stage: inventory of all available artifacts.
 */
export interface ReadStageOutput {
  /** All markdown artifacts found in the subfolder. */
  readonly artifacts: readonly ArtifactFile[];
  /** Whether a `documents/` subdirectory with per-document analyses exists. */
  readonly hasDocuments: boolean;
  /** Set of filenames available (for Reader Guide filtering). */
  readonly availableFiles: ReadonlySet<string>;
}

// ─── Validate Stage ──────────────────────────────────────────────────────────

/**
 * Validation diagnostics for a single artifact or the folder as a whole.
 */
export interface ValidationDiagnostic {
  readonly level: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly file?: string;
}

/**
 * Output of the validate stage.
 */
export interface ValidateStageOutput {
  /** Whether the artifact set passes the analysis gate. */
  readonly passed: boolean;
  /** Ordered list of diagnostics. */
  readonly diagnostics: readonly ValidationDiagnostic[];
}

// ─── Aggregate Stage ─────────────────────────────────────────────────────────

/**
 * A rendered section of the final article (post-cleaning, with heading).
 */
export interface ArticleSection {
  /** The artifact filename this section was sourced from (or synthetic ID). */
  readonly sourceFile: string;
  /** Rendered markdown for this section (including ## heading). */
  readonly markdown: string;
}

/**
 * Output of the aggregate stage: ordered sections ready for assembly.
 */
export interface AggregateStageOutput {
  /** Article title (from executive-brief). */
  readonly title: string;
  /** Article description / lede (from executive-brief BLUF). */
  readonly description: string;
  /** Ordered sections composing the article body. */
  readonly sections: readonly ArticleSection[];
  /** Ordered list of artifact filenames consumed. */
  readonly artifactsUsed: readonly string[];
}

// ─── Enrich Stage ────────────────────────────────────────────────────────────

/**
 * SEO and metadata fields added during enrichment.
 */
export interface EnrichmentMetadata {
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly subfolder: string;
  readonly slug: string;
  readonly sourceFolder: string;
  readonly generatedAt: string;
  readonly language: string;
}

/**
 * Output of the enrich stage.
 */
export interface EnrichStageOutput {
  readonly metadata: EnrichmentMetadata;
  readonly sections: readonly ArticleSection[];
  readonly artifactsUsed: readonly string[];
}

// ─── Write Stage ─────────────────────────────────────────────────────────────

/**
 * Output of the write stage: the final article.md content.
 */
export interface WriteStageOutput {
  /** Complete markdown content (front-matter + body). */
  readonly markdown: string;
  /** Article title for summary reporting. */
  readonly title: string;
  /** Article description for summary reporting. */
  readonly description: string;
  /** Ordered list of artifacts consumed. */
  readonly artifactsUsed: readonly string[];
}

// ─── Full Pipeline ───────────────────────────────────────────────────────────

/**
 * Configuration for the full article pipeline.
 */
export interface ArticlePipelineConfig {
  /** Override the generated_at timestamp (for deterministic tests). */
  readonly generatedAt?: string;
  /** Language code (defaults to 'en'). */
  readonly language?: string;
  /** Layout template (defaults to 'article'). */
  readonly layout?: string;
}
