/**
 * @module Infrastructure/RenderLib/Aggregator/Frontmatter
 * @category Intelligence Operations / Supporting Infrastructure
 * @name YAML / inline-markdown escape helpers + front-matter assembly
 *
 * @description
 * Pure escape helpers used by the aggregator to assemble the article
 * front-matter and to safely embed dynamic strings inside markdown.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Escape a string so it is safe to embed inside a YAML double-quoted
 * scalar. Escapes backslashes, double-quotes, and replaces newlines with
 * a single space (YAML double-quoted strings don't allow raw newlines).
 */
export function escapeYaml(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

/**
 * Escape markdown inline metacharacters in a string so it renders as
 * plain text (e.g. when injecting a `dok_id` like `H902FiU13` as a
 * subsection heading). Matches CommonMark §2.4 ASCII punctuation set
 * relevant to inline contexts.
 */
export function escapeInlineMd(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

/**
 * Assemble the article YAML front-matter block. Inputs are caller-
 * supplied — the aggregator owns title/description sourcing and date
 * formatting. The returned string ends with a trailing newline so the
 * caller can concatenate the body verbatim.
 */
export interface FrontMatterFields {
  /**
   * @deprecated Emitted by the aggregator in-memory but **no longer
   * written to the `article.md` YAML front-matter** (post-`2026-05-24`
   * SEO contract). The renderer now sources `<title>` directly from
   * `executive-brief.md` via `deriveBriefSeoOverrides` in
   * `scripts/render-lib/article.ts`. Field remains in the interface
   * so the aggregator can return it in its in-memory result object
   * for the test-article-headers CLI and unit tests.
   */
  readonly title?: string;
  /**
   * @deprecated Emitted by the aggregator in-memory but **no longer
   * written to the `article.md` YAML front-matter**. See
   * {@link FrontMatterFields.title}.
   */
  readonly description?: string;
  /**
   * @deprecated Emitted by the aggregator in-memory but **no longer
   * written to the `article.md` YAML front-matter**. The renderer
   * now derives keyword entities directly from
   * `executive-brief.md` via `extractBriefEntities` /
   * `flattenBriefEntities`. See {@link FrontMatterFields.title}.
   */
  readonly keywords?: string;
  readonly date: string;
  readonly subfolder: string;
  /** Auto-derived from `${date}-${subfolder}` if the caller omits it. */
  readonly slug?: string;
  readonly source_folder: string;
  readonly generated_at: string;
  readonly language?: string;
  readonly layout?: string;
}

/**
 * Build the canonical 6-key article front-matter block (date, subfolder,
 * slug, source_folder, generated_at, language, layout). SEO-relevant
 * keys (`title`, `description`, `keywords`) used to be emitted here but
 * are now sourced **directly from `executive-brief.md`** by the
 * renderer — see `scripts/render-lib/article.ts § deriveBriefSeoOverrides`.
 * Live in this leaf module so tests can exercise the YAML escape rules
 * without spinning up filesystem fixtures.
 */
export function buildFrontMatter(fm: FrontMatterFields): string {
  const slug = fm.slug ?? `${fm.date}-${fm.subfolder}`;
  const language = fm.language ?? 'en';
  const layout = fm.layout ?? 'article';
  return [
    '---',
    `date: ${fm.date}`,
    `subfolder: ${fm.subfolder}`,
    `slug: ${slug}`,
    `source_folder: ${fm.source_folder}`,
    `generated_at: ${fm.generated_at}`,
    `language: ${language}`,
    `layout: ${layout}`,
    '---',
    '',
  ].join('\n');
}
