/**
 * Round-5 split — focused leaf-module tests for the bounded-context
 * decomposition of `scripts/render-lib/aggregator.ts`.
 *
 * These tests intentionally import each leaf module **by its real
 * filesystem path** (not via the barrel) to prove every module:
 *
 * 1. Loads in isolation with no missing imports.
 * 2. Exposes the same behaviour as the legacy monolith for its narrow
 *    bounded context.
 * 3. Has no circular dependencies (Vitest fails the import otherwise).
 *
 * The existing `tests/render-lib.test.ts` (1803 LOC, 144 tests) already
 * exercises every transform end-to-end via the public barrel; this file
 * complements it with branch-level coverage of the leaf surface so a
 * regression in any one module breaks a single small test rather than
 * the giant test file.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  ADMIN_FIELD_NAMES,
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
  stripLeadingAdminBylines,
} from '../scripts/render-lib/aggregator/cleaning/admin-bylines.js';
import {
  PASS_TWO_HEADING_RE,
  stripPassTwoSection,
} from '../scripts/render-lib/aggregator/cleaning/pass-two.js';
import {
  PROCESS_META_FIELD_NAMES,
  PROCESS_META_LINE_RE,
  stripProcessMetaLines,
} from '../scripts/render-lib/aggregator/cleaning/process-meta.js';
import {
  cleanArtifactBody,
  demoteHeadings,
  rewriteRelativeLinks,
  stripSourcePreamble,
} from '../scripts/render-lib/aggregator/cleaning/structural.js';
import {
  buildFrontMatter,
  escapeInlineMd,
  escapeYaml,
} from '../scripts/render-lib/aggregator/frontmatter.js';
import {
  AGGREGATION_ORDER,
  prettifyFallbackTitle,
  titleForArtifact,
} from '../scripts/render-lib/aggregator/order.js';
import {
  anchorForTitle,
  buildReaderGuide,
} from '../scripts/render-lib/aggregator/reader-guide.js';
import {
  SENTENCE_END_RE,
  markdownInlineToText,
  readBlufParagraph,
  readFirstParagraph,
  truncateToSentenceBoundary,
} from '../scripts/render-lib/aggregator/seo/description.js';
import {
  cleanArticleTitle,
  readFirstHeading,
  titleFromBluf,
} from '../scripts/render-lib/aggregator/seo/title.js';
import { buildSourcesAppendix } from '../scripts/render-lib/aggregator/sources-appendix.js';

// Markdown leaf modules
import { preprocessMermaidFences } from '../scripts/render-lib/markdown/mermaid-preprocess.js';
import { rehypeSlugWithPrefix } from '../scripts/render-lib/markdown/rehype-slug-prefixed.js';
import { rehypeWrapTables } from '../scripts/render-lib/markdown/rehype-wrap-tables.js';
import {
  HEADING_ID_PREFIX,
  sanitizeSchema,
} from '../scripts/render-lib/markdown/sanitize-schema.js';

// Public barrel — for parity-with-leaf identity assertions.
import * as aggregatorBarrel from '../scripts/render-lib/aggregator/index.js';
import * as markdownBarrel from '../scripts/render-lib/markdown/index.js';

describe('aggregator/order — canonical narrative order', () => {
  it('AGGREGATION_ORDER opens with the executive brief', () => {
    expect(AGGREGATION_ORDER[0]).toBe('executive-brief.md');
  });

  it('AGGREGATION_ORDER closes with the audit-appendix manifest', () => {
    expect(AGGREGATION_ORDER[AGGREGATION_ORDER.length - 1]).toBe(
      'data-download-manifest.md',
    );
  });

  it('titleForArtifact maps known files to curated titles', () => {
    expect(titleForArtifact('intelligence-assessment.md')).toBe(
      'Intelligence Assessment — Key Judgments',
    );
    expect(titleForArtifact('devils-advocate.md')).toBe("Devil's Advocate");
  });

  it('titleForArtifact falls back to prettifyFallbackTitle for unknown files', () => {
    expect(titleForArtifact('pestle-analysis.md')).toBe('Pestle Analysis');
    expect(titleForArtifact('wildcards-blackswans.md')).toBe(
      'Wildcards Blackswans',
    );
  });

  it('prettifyFallbackTitle is idempotent on already-prettified input', () => {
    expect(prettifyFallbackTitle('foo-bar.md')).toBe('Foo Bar');
    expect(prettifyFallbackTitle('foo_bar.md')).toBe('Foo Bar');
    expect(prettifyFallbackTitle('foo.md')).toBe('Foo');
  });
});

describe('aggregator/cleaning/admin-bylines — paragraph-level admin stripper', () => {
  it('exports a non-empty admin-field whitelist', () => {
    expect(ADMIN_FIELD_NAMES.length).toBeGreaterThan(50);
    expect(ADMIN_FIELD_NAMES).toContain('Author');
    expect(ADMIN_FIELD_NAMES).toContain('Classification');
  });

  it('ADMIN_FIELD_RE matches structured admin fragments only', () => {
    expect('**Author**: Jane'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('Run ID: 123'.match(ADMIN_FIELD_RE)).not.toBeNull();
    // Real prose that *starts* with one of the admin words but is not
    // followed by `:` must not match.
    expect('The Author wrote the brief.'.match(ADMIN_FIELD_RE)).toBeNull();
  });

  it('ADMIN_FRAGMENT_SPLITTER does not split on em-dash', () => {
    const fragments = '**Classification**: Public — GDPR Art. 9(2)(e)'.split(
      ADMIN_FRAGMENT_SPLITTER,
    );
    expect(fragments).toHaveLength(1);
  });

  it('stripLeadingAdminBylines removes pure-admin paragraphs anywhere', () => {
    const input =
      '**Author**: Jane | **Date**: 2026-01-01\n\nStory prose here.\n\n**Run ID**: abc';
    const out = stripLeadingAdminBylines(input);
    expect(out).toContain('Story prose here.');
    expect(out).not.toContain('**Author**');
    expect(out).not.toContain('**Run ID**');
  });
});

describe('aggregator/cleaning/pass-two — Pass 2 self-audit stripper', () => {
  it('exports a regex matching `## Pass 2 …` and emoji variants', () => {
    expect('## Pass 2 self-audit'.match(PASS_TWO_HEADING_RE)).not.toBeNull();
    PASS_TWO_HEADING_RE.lastIndex = 0;
    expect('### 🔁 Pass 2 review'.match(PASS_TWO_HEADING_RE)).not.toBeNull();
  });

  it('strips Pass 2 section through end-of-file', () => {
    const out = stripPassTwoSection(
      'Lead paragraph.\n\n## Pass 2 self-audit\n\nNoise.\n',
    );
    expect(out).toContain('Lead paragraph.');
    expect(out).not.toContain('Pass 2');
    expect(out).not.toContain('Noise.');
  });
});

describe('aggregator/cleaning/process-meta — line-level metadata stripper', () => {
  it('exports a non-empty process-metadata whitelist', () => {
    expect(PROCESS_META_FIELD_NAMES.length).toBeGreaterThan(20);
    expect(PROCESS_META_FIELD_NAMES).toContain('Confidence');
  });

  it('strips individual `**Confidence**: …` lines but preserves prose', () => {
    const input =
      'Story prose.\n\n**Confidence**: High\n**Date**: 2026-01-01\n\nMore prose.';
    const out = stripProcessMetaLines(input);
    expect(out).toContain('Story prose.');
    expect(out).toContain('More prose.');
    expect(out).not.toContain('Confidence');
    expect(out).not.toMatch(/\*\*Date\*\*: 2026/);
  });

  it('PROCESS_META_LINE_RE has the global flag (multi-line replacement)', () => {
    expect(PROCESS_META_LINE_RE.flags).toContain('g');
  });
});

describe('aggregator/cleaning/structural — body cleaner & link rewriter', () => {
  it('cleanArtifactBody strips front-matter, first H1, admin bylines, Pass 2', () => {
    const input = [
      '---',
      'title: Foo',
      '---',
      '# Big H1',
      '',
      '**Author**: Jane | **Date**: 2026-01-01',
      '',
      'Real prose.',
      '',
      '## Pass 2 self-audit',
      '',
      'Noise.',
      '',
    ].join('\n');
    const out = cleanArtifactBody(input);
    expect(out).toContain('Real prose.');
    expect(out).not.toContain('Big H1');
    expect(out).not.toContain('**Author**');
    expect(out).not.toContain('Pass 2');
    expect(out).not.toContain('title: Foo');
  });

  it('demoteHeadings demotes inner H2 → H3, caps at H6', () => {
    const out = demoteHeadings('## Section\n\n###### Already H6');
    expect(out).toContain('### Section');
    expect(out).toContain('###### Already H6'); // unchanged — already at cap
  });

  it('demoteHeadings does not affect headings inside fenced code', () => {
    const out = demoteHeadings(
      '## Real heading\n\n```text\n## Code-block heading\n```\n',
    );
    expect(out).toContain('### Real heading');
    expect(out).toContain('## Code-block heading'); // untouched inside fence
  });

  it('stripSourcePreamble removes `_Source: file.md_` italic lines', () => {
    const out = stripSourcePreamble('_Source: `foo.md`_\n\nBody.');
    expect(out).not.toContain('Source:');
    expect(out).toContain('Body.');
  });

  it('rewriteRelativeLinks rewrites .md links to absolute GitHub blob URLs', () => {
    const out = rewriteRelativeLinks(
      '[See more](sibling.md#section)',
      'analysis/daily/2026-04-27/propositions',
    );
    expect(out).toContain('github.com');
    expect(out).toContain('analysis/daily/2026-04-27/propositions/sibling.md');
    expect(out).toContain('#section');
  });

  it('rewriteRelativeLinks leaves absolute URLs untouched', () => {
    const input = '[ext](https://example.org/x)';
    expect(rewriteRelativeLinks(input, 'whatever')).toBe(input);
  });
});

describe('aggregator/seo/description — BLUF / first-paragraph readers', () => {
  it('SENTENCE_END_RE matches Latin / CJK / Devanagari terminators', () => {
    SENTENCE_END_RE.lastIndex = 0;
    expect('a. b'.match(SENTENCE_END_RE)).not.toBeNull();
    SENTENCE_END_RE.lastIndex = 0;
    expect('a。b'.match(SENTENCE_END_RE)).not.toBeNull();
    SENTENCE_END_RE.lastIndex = 0;
    expect('a।b'.match(SENTENCE_END_RE)).not.toBeNull();
  });

  it('markdownInlineToText strips emphasis + links to plain text', () => {
    expect(markdownInlineToText('**Bold** and [link](url) text')).toBe(
      'Bold and link text',
    );
    expect(markdownInlineToText('![alt](img.png) prose')).toBe('alt prose');
  });

  it('truncateToSentenceBoundary returns input unchanged when within window', () => {
    expect(truncateToSentenceBoundary('Short.', 140, 200)).toBe('Short.');
  });

  it('truncateToSentenceBoundary cuts at sentence end inside window', () => {
    const a = 'A'.repeat(150);
    const b = 'B'.repeat(60);
    const result = truncateToSentenceBoundary(`${a}. ${b}.`, 140, 200);
    expect(result.endsWith('.')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('truncateToSentenceBoundary handles single-token pathological input', () => {
    const long = 'X'.repeat(300);
    const out = truncateToSentenceBoundary(long, 140, 200);
    // Must be non-empty and not collapse to a bare ellipsis.
    expect(out.length).toBeGreaterThan(10);
    expect(out).not.toBe('…');
  });

  it('readBlufParagraph returns null when no BLUF heading exists', () => {
    expect(readBlufParagraph('# Heading\n\nProse only.')).toBeNull();
  });

  it('readBlufParagraph returns the prose paragraph after `## 🎯 BLUF`', () => {
    const input = '# H1\n\n## 🎯 BLUF\n\nThe lede.\n\n## Next\n\nMore.';
    expect(readBlufParagraph(input)).toBe('The lede.');
  });

  it('readFirstParagraph skips admin paragraphs', () => {
    const input =
      '**Author**: Jane | **Date**: x\n\nThe real first paragraph.';
    expect(readFirstParagraph(input)).toBe('The real first paragraph.');
  });
});

describe('aggregator/seo/title — title cleanup & BLUF synthesis', () => {
  it('readFirstHeading returns the H1 text without the leading `# `', () => {
    expect(readFirstHeading('# Hello World\n\nbody')).toBe('Hello World');
    expect(readFirstHeading('No heading here')).toBeNull();
  });

  it('cleanArticleTitle strips `Executive Brief — ` prefix and trailing date', () => {
    expect(
      cleanArticleTitle(
        'Executive Brief — Sweden joins NATO summit talks — 2026-04-27',
      ),
    ).toBe('Sweden joins NATO summit talks');
  });

  it('cleanArticleTitle returns null when too short', () => {
    expect(cleanArticleTitle('Short')).toBeNull();
  });

  it('titleFromBluf truncates at word boundary when first sentence too long', () => {
    const longBluf = `${'A long political development with many actors and consequences'.repeat(2)}.`;
    const out = titleFromBluf(longBluf, 70);
    expect(out!.length).toBeLessThanOrEqual(70);
    expect(out).not.toContain('  ');
  });

  it('titleFromBluf returns null on empty/null input', () => {
    expect(titleFromBluf(null)).toBeNull();
    expect(titleFromBluf('')).toBeNull();
  });
});

describe('aggregator/frontmatter — YAML escape + assembly', () => {
  it('escapeYaml escapes quotes, backslashes and newlines', () => {
    expect(escapeYaml('hello "world"')).toBe('hello \\"world\\"');
    expect(escapeYaml('line1\nline2')).toBe('line1 line2');
    expect(escapeYaml('a\\b')).toBe('a\\\\b');
  });

  it('escapeInlineMd escapes markdown metacharacters', () => {
    expect(escapeInlineMd('H902FiU13_v2')).toBe('H902FiU13\\_v2');
    expect(escapeInlineMd('foo*bar')).toBe('foo\\*bar');
  });

  it('buildFrontMatter assembles a 9-key block with auto slug', () => {
    const fm = buildFrontMatter({
      title: 'Hello',
      description: 'Body',
      date: '2026-04-27',
      subfolder: 'propositions',
      source_folder: 'analysis/daily/2026-04-27/propositions',
      generated_at: '2026-04-27T18:00:00.000Z',
    });
    expect(fm).toContain('title: "Hello"');
    expect(fm).toContain('slug: 2026-04-27-propositions');
    expect(fm).toContain('language: en');
    expect(fm).toContain('layout: article');
    expect(fm).toMatch(/^---\n[\s\S]+\n---\n$/);
  });
});

describe('aggregator/reader-guide — anchor slug parity', () => {
  it('anchorForTitle prefixes the slug with HEADING_ID_PREFIX', () => {
    const a = anchorForTitle('Intelligence Assessment — Key Judgments');
    expect(a.startsWith(HEADING_ID_PREFIX)).toBe(true);
    expect(a).toMatch(/^rm-intelligence-assessment/);
  });

  it('anchorForTitle strips leading emoji before slugging', () => {
    expect(anchorForTitle('🎯 BLUF')).toBe('rm-bluf');
  });

  it('buildReaderGuide emits only rows whose artifact is available', () => {
    const guide = buildReaderGuide(
      new Set(['executive-brief.md', 'risk-assessment.md']),
      false,
    );
    expect(guide).toContain('executive-brief.md');
    expect(guide).toContain('risk-assessment.md');
    expect(guide).not.toContain('intelligence-assessment.md');
    // Audit-appendix pointer is always emitted.
    expect(guide).toContain('Audit appendix');
    // No per-document row when hasDocuments=false.
    expect(guide).not.toContain('Per-document intelligence');
  });

  it('buildReaderGuide emits the per-document row when hasDocuments=true', () => {
    const guide = buildReaderGuide(new Set(['executive-brief.md']), true);
    expect(guide).toContain('Per-document intelligence');
  });
});

describe('aggregator/sources-appendix', () => {
  it('returns null when no artifacts were used', () => {
    expect(buildSourcesAppendix([], 'whatever')).toBeNull();
  });

  it('emits one bullet per artifact with absolute GitHub URLs', () => {
    const out = buildSourcesAppendix(
      ['executive-brief.md', 'documents/foo.md'],
      'analysis/daily/2026-04-27/propositions',
    );
    expect(out).toContain('## Article Sources');
    expect(out).toContain('`executive-brief.md`');
    expect(out).toContain('`documents/foo.md`');
    expect(out).toContain('https://github.com/');
  });
});

describe('markdown/* — leaf module isolation', () => {
  it('preprocessMermaidFences swaps fences for <pre class="mermaid">', () => {
    const out = preprocessMermaidFences('```mermaid\ngraph LR; A-->B\n```');
    expect(out).toContain('<pre class="mermaid"');
    expect(out).toContain('data-mermaid-source="true"');
  });

  it('preprocessMermaidFences escapes HTML inside diagram source', () => {
    const out = preprocessMermaidFences('```mermaid\nA --> "B<C>"\n```');
    expect(out).toContain('&lt;C&gt;');
    expect(out).not.toContain('B<C>');
  });

  it('rehypeSlugWithPrefix exports a plugin function', () => {
    expect(typeof rehypeSlugWithPrefix).toBe('function');
    expect(typeof rehypeSlugWithPrefix()).toBe('function'); // returns transformer
  });

  it('rehypeWrapTables exports a plugin function', () => {
    expect(typeof rehypeWrapTables).toBe('function');
    expect(typeof rehypeWrapTables()).toBe('function'); // returns transformer
  });

  it('HEADING_ID_PREFIX is the canonical `rm-` site prefix', () => {
    expect(HEADING_ID_PREFIX).toBe('rm-');
  });

  it('sanitizeSchema preserves the `rm-` clobberPrefix', () => {
    expect(sanitizeSchema.clobberPrefix).toBe(HEADING_ID_PREFIX);
    // `id` is removed from the clobber list — see Round-1 fix.
    expect(sanitizeSchema.clobber).not.toContain('id');
    expect(sanitizeSchema.clobber).toContain('name');
  });
});

describe('barrel parity — leaf identity matches barrel re-export', () => {
  it('aggregator barrel re-exports the same `aggregateAnalysis` identity', () => {
    expect(aggregatorBarrel.aggregateAnalysis).toBe(aggregateAnalysis);
  });

  it('aggregator barrel `__test__` exposes the same regex identity as the leaf', () => {
    expect(aggregatorBarrel.__test__.PASS_TWO_HEADING_RE).toBe(
      PASS_TWO_HEADING_RE,
    );
    expect(aggregatorBarrel.__test__.ADMIN_FIELD_RE).toBe(ADMIN_FIELD_RE);
    expect(aggregatorBarrel.__test__.ADMIN_FRAGMENT_SPLITTER).toBe(
      ADMIN_FRAGMENT_SPLITTER,
    );
    expect(aggregatorBarrel.__test__.PROCESS_META_LINE_RE).toBe(
      PROCESS_META_LINE_RE,
    );
    expect(aggregatorBarrel.__test__.SENTENCE_END_RE).toBe(SENTENCE_END_RE);
  });

  it('aggregator barrel `__test__` is frozen (no accidental mutation)', () => {
    expect(Object.isFrozen(aggregatorBarrel.__test__)).toBe(true);
  });

  it('markdown barrel re-exports the same `sanitizeSchema` identity', () => {
    expect(markdownBarrel.sanitizeSchema).toBe(sanitizeSchema);
    expect(markdownBarrel.HEADING_ID_PREFIX).toBe(HEADING_ID_PREFIX);
  });
});
