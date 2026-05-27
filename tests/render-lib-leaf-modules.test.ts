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
  collapseRepeatedFooterBlocks,
  dedupeAdjacentDuplicateLines,
  demoteHeadings,
  rewriteRelativeLinks,
  stripInlineReaderGuide,
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
  auditAnchorForArtifacts,
  buildReaderGuide,
  READER_GUIDE_ENTRIES,
} from '../scripts/render-lib/aggregator/reader-guide.js';
import {
  SENTENCE_END_RE,
  isAbbreviationDot,
  markdownInlineToText,
  readBlufParagraph,
  readFirstParagraph,
  stripBlufLabel,
  truncateToSentenceBoundary,
} from '../scripts/render-lib/aggregator/seo/description.js';
import {
  cleanArticleTitle,
  readFirstHeading,
  titleFromBluf,
} from '../scripts/render-lib/aggregator/seo/title.js';
import { buildArtifactCoverageReport, buildSourcesAppendix } from '../scripts/render-lib/aggregator/sources-appendix.js';
import { aggregateAnalysis } from '../scripts/render-lib/aggregator/aggregate.js';

// Markdown leaf modules
import { preprocessMermaidFences } from '../scripts/render-lib/markdown/mermaid-preprocess.js';
import {
  CANONICAL_MERMAID_INIT,
  ensureMermaidTheme,
  hasMermaidTheme,
} from '../scripts/render-lib/markdown/mermaid-canonical-theme.js';
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
    // pestle-analysis.md, wildcards-blackswans.md, etc. are now curated; use truly-unknown artifacts.
    expect(titleForArtifact('budget-bill-tracker.md')).toBe('Budget Bill Tracker');
    expect(titleForArtifact('eu-presidency-pivot.md')).toBe(
      'Eu Presidency Pivot',
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

  // ──────────────────────────────────────────────────────────────────
  // Round 7 (2026-05-09) — admin-field expansion. Preamble fields that
  // leaked into <meta description> across news/2026-05-08-*-en.html.
  // ──────────────────────────────────────────────────────────────────

  it('ADMIN_FIELD_RE matches Round 7 leak fields (DIW Composite, WEP, Audience)', () => {
    expect('**DIW Composite**: 10.0/10 (election-adjusted)'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**WEP**: Almost Certainly (AC, 90-95%)'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Audience**: Editors, researchers, engaged citizens'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Audience for this brief**: Editors'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Iteration**: Pass 2'.match(ADMIN_FIELD_RE)).not.toBeNull();
  });

  it('stripLeadingAdminBylines removes the realtime-pulse Audience admin block', () => {
    // Reproduces the leak shape from analysis/daily/2026-05-08/realtime-pulse/executive-brief.md.
    const input =
      '**Classification**: UNCLASSIFIED — PUBLIC  \n**Audience**: Editors, researchers, engaged citizens  \n**Date**: 2026-05-08  \n**Prepared by**: Riksdagsmonitor news-realtime-monitor\n\nThe Riksdag chamber on 8 May 2026 debates two significant committee reports.';
    const out = stripLeadingAdminBylines(input);
    expect(out).toContain('The Riksdag chamber on 8 May 2026');
    expect(out).not.toContain('Audience');
    expect(out).not.toContain('Classification');
  });

  it('stripLeadingAdminBylines removes the propositions DIW Composite admin block', () => {
    // Reproduces the leak shape from analysis/daily/2026-05-08/propositions/executive-brief.md.
    const input =
      '**Classification**: B2 (Probably True / Reliable) | **WEP**: Almost Certainly (AC, 90-95%)  \n**DIW Composite**: 10.0/10 (election-adjusted)  \n**Analyst**: AI political intelligence synthesis  \n**Date**: 2026-05-08\n\nOn 7 May 2026, the Tidö government submitted three propositions.';
    const out = stripLeadingAdminBylines(input);
    expect(out).toContain('On 7 May 2026');
    expect(out).not.toContain('DIW Composite');
    expect(out).not.toContain('WEP');
  });

  // ──────────────────────────────────────────────────────────────────
  // Round 8 (2026-05-09) — multi-value continuation tolerance.
  // Audit of analysis/daily/2026-05-07/propositions/ showed
  // `**WEP Confidence**: Almost certain (ratification outcome) | Likely (geopolitical trajectory)`
  // surviving the previous "every fragment must match" rule because the
  // post-pipe value (`Likely (geopolitical trajectory)`) had no field
  // label. The new per-line rule treats it as a value continuation.
  // ──────────────────────────────────────────────────────────────────

  it('stripLeadingAdminBylines accepts pipe-separated value continuations on admin lines', () => {
    const input =
      '**Classification**: Admiralty [B2] | **Horizon**: T+72h / T+90d  \n**WEP Confidence**: Almost certain (ratification outcome) | Likely (geopolitical trajectory)  \n**DIW**: L2 Strategic | **Date**: 2026-05-07\n\n## 🔴 Key Intelligence Finding\n\nThe Tidö government has signed three interlocking propositions.';
    const out = stripLeadingAdminBylines(input);
    expect(out).toContain('Tidö government has signed');
    expect(out).not.toContain('WEP Confidence');
    expect(out).not.toContain('Likely (geopolitical');
    expect(out).not.toContain('DIW');
  });

  it('stripLeadingAdminBylines preserves prose containing pipes that are NOT admin', () => {
    // Plain prose with a pipe must survive — the continuation rule
    // only fires when the line's first fragment is admin.
    const input =
      'Sweden | Norway | Finland coordinate Nordic defence policy. The three states issued a joint statement.';
    const out = stripLeadingAdminBylines(input);
    expect(out).toContain('Sweden | Norway | Finland');
    expect(out).toContain('joint statement');
  });

  it('ADMIN_FIELD_RE matches Round 8 leak fields (Horizon / Workflow / Election Proximity / IMF vintage)', () => {
    expect('**Horizon**: T+72h to T+90d'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Reading time**: ~5 minutes'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Workflow**: news-year-ahead'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Election**: 2026-09-13 (T+129)'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Election Proximity**: T−135 days to Sept 14, 2026'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Election countdown**: T−131 days'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**IMF vintage**: WEO Apr-2026'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Riksmöte**: 2025/26 (closing phase)'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**For**: Riksdagsmonitor subscribers'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Prepared**: 2026-05-05T07:15:00Z'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**Analyst confidence**: HIGH'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**WEP Confidence**: Almost certain'.match(ADMIN_FIELD_RE)).not.toBeNull();
    expect('**DIW Aggregate**: 8.4'.match(ADMIN_FIELD_RE)).not.toBeNull();
    // Real prose starting with `For`, `Election`, `Prepared` should NOT
    // match (no colon).
    expect('For decades the Riksdag'.match(ADMIN_FIELD_RE)).toBeNull();
    expect('Election results show'.match(ADMIN_FIELD_RE)).toBeNull();
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

  // Round 7 (2026-05-09) — abbreviation guard. Without the guard,
  // descriptions get cut mid-sentence at common abbreviations like
  // `prop.`, `art.`, `Mr.` (audit of news/2026-05-08-motions-en.html).
  it('truncateToSentenceBoundary does not cut mid-sentence at "prop." abbreviation', () => {
    const text =
      'Eight opposition motions filed 2026-05-04 mount challenges against two government propositions: the forestry deregulation (prop. 2025/26:236) and the youth justice reform (prop. 2025/26:237). Both will be voted before recess.';
    const out = truncateToSentenceBoundary(text, 140, 200);
    // Must not end at the `prop.` abbreviation period.
    expect(out).not.toMatch(/\bprop\.$/);
    expect(out).not.toMatch(/\(prop\.$/);
  });

  it('truncateToSentenceBoundary does not cut at "art." / "Mr." / "etc." abbreviations', () => {
    expect(truncateToSentenceBoundary('See art. 5 ECHR. The minister noted concerns.', 20, 30))
      .not.toMatch(/\bart\.$/);
    expect(truncateToSentenceBoundary('Mr. Strömmer told the press. He confirmed.', 15, 25))
      .not.toMatch(/\bMr\.$/);
    expect(truncateToSentenceBoundary('Reform, training etc. is needed. Plans follow.', 20, 30))
      .not.toMatch(/\betc\.$/);
  });

  it('truncateToSentenceBoundary still cuts at real sentence ends after abbreviations', () => {
    // After the guard skips `prop.`, the next real `.` in window is the
    // sentence terminator after "vote" — that should still be honoured
    // when the input exceeds hardMax.
    const tail =
      ' Beyond that point follows further analysis that should be cut off entirely because it is past the sentence terminator we want to land on.';
    const text =
      'Eight motions challenge prop. 2025/26:236 and prop. 2025/26:237 in the chamber vote.' +
      tail;
    const out = truncateToSentenceBoundary(text, 80, 100);
    expect(out.endsWith('vote.')).toBe(true);
  });

  it('isAbbreviationDot recognises simple abbreviations (prop., Mr., etc.)', () => {
    // "prop." — dot at index 4
    expect(isAbbreviationDot('prop.', 4)).toBe(true);
    // "Mr." — dot at index 2
    expect(isAbbreviationDot('Mr.', 2)).toBe(true);
    // real sentence end — "vote."
    expect(isAbbreviationDot('vote.', 4)).toBe(false);
  });

  it('isAbbreviationDot recognises multi-dot abbreviations e.g., i.e., bl.a., d.v.s.', () => {
    // "e.g." — the trailing dot is at the end
    const eg = 'e.g.';
    expect(isAbbreviationDot(eg, eg.length - 1)).toBe(true);
    // "i.e." — same pattern
    const ie = 'i.e.';
    expect(isAbbreviationDot(ie, ie.length - 1)).toBe(true);
    // "bl.a." — Swedish "bland annat"
    const bla = 'bl.a.';
    expect(isAbbreviationDot(bla, bla.length - 1)).toBe(true);
    // "d.v.s." — Swedish "det vill säga"
    const dvs = 'd.v.s.';
    expect(isAbbreviationDot(dvs, dvs.length - 1)).toBe(true);
  });

  it('isAbbreviationDot does not false-positive on non-abbreviation prefix before known suffix', () => {
    // `example.al.` — `al` is in the set but `example` is not an abbreviation;
    // only the FIRST component is checked so this should return false.
    const text = 'example.al.';
    expect(isAbbreviationDot(text, text.length - 1)).toBe(false);
  });

  it('truncateToSentenceBoundary handles multiple consecutive abbreviations', () => {
    // Both "e.g." and "i.e." should be skipped; the real sentence end at
    // "final." should still be honoured.
    const result = truncateToSentenceBoundary(
      'Text e.g. more i.e. the final sentence. Additional text that should not appear.',
      20,
      45,
    );
    expect(result).toBe('Text e.g. more i.e. the final sentence.');
  });

  it('truncateToSentenceBoundary does not cut at e.g. / i.e. / bl.a.', () => {
    // The abbreviation dot in "e.g." should not trigger a cut.
    expect(truncateToSentenceBoundary('This is often, e.g. in practice. Final sentence.', 20, 40))
      .toBe('This is often, e.g. in practice.');
    // "i.e." likewise
    expect(truncateToSentenceBoundary('The policy, i.e. the act. Further detail.', 20, 30))
      .toBe('The policy, i.e. the act.');
    // "bl.a." (Swedish)
    expect(truncateToSentenceBoundary('Åtgärder bl.a. inom skolan. Mer info.', 20, 30))
      .toBe('Åtgärder bl.a. inom skolan.');
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

  // ──────────────────────────────────────────────────────────────────
  // Round 8 (2026-05-09) — `BLUF:` inline-label strip on the BLUF
  // paragraph itself. Audit of news/2026-05-08-interpellations-en.html
  // showed `BLUF: Five interpellations filed …` reaching <meta description>
  // because some analysts write the BLUF label inline on top of the
  // `## 🎯 BLUF` heading.
  // ──────────────────────────────────────────────────────────────────

  it('stripBlufLabel removes leading BLUF: / TL;DR: / Bottom Line: prefixes and list markers', () => {
    expect(stripBlufLabel('BLUF: Five interpellations filed.')).toBe('Five interpellations filed.');
    expect(stripBlufLabel('TL;DR — Sweden joins NATO.')).toBe('Sweden joins NATO.');
    expect(stripBlufLabel('Bottom Line: The motion failed.')).toBe('The motion failed.');
    expect(stripBlufLabel('Top Line: New SIGINT law.')).toBe('New SIGINT law.');
    // Round 8: also strip leading ordered/unordered list markers so
    // `1. SD fires …` doesn't survive into <meta description>.
    expect(stripBlufLabel('1. SD fires two coordinated state-reform salvos.'))
      .toBe('SD fires two coordinated state-reform salvos.');
    expect(stripBlufLabel('- The Riksdag voted 173-176.'))
      .toBe('The Riksdag voted 173-176.');
  });

  it('stripBlufLabel preserves prose without a BLUF prefix', () => {
    expect(stripBlufLabel('The Riksdag voted 173-176.')).toBe('The Riksdag voted 173-176.');
  });

  it('readBlufParagraph strips BLUF: inline-label from the returned paragraph', () => {
    const input = '## 🎯 BLUF\n\nBLUF: Five interpellations filed today.';
    expect(readBlufParagraph(input)).toBe('Five interpellations filed today.');
  });

  // ──────────────────────────────────────────────────────────────────
  // 14-language localised BLUF heading matchers (2026-05-26 audit).
  //
  // Roughly half of translated executive briefs drop the literal
  // `BLUF` token in favour of a native-language summary heading
  // (`## Sammanfattning`, `## 핵심 요약`, `## 执行摘要`,
  // `## الخلاصة التنفيذية`, …). Without per-language matching, those
  // briefs silently fall back to `readFirstParagraph` and ship the
  // admin byline as the meta-description. Each fixture below was
  // observed in the live corpus.
  // ──────────────────────────────────────────────────────────────────

  it.each([
    ['sv', '## 📌 Sammanfattning'],
    ['sv', '## 🎯 Slutsats'],
    ['da', '## 🎯 Konklusion'],
    ['da', '## 📌 Sammenfatning'],
    ['no', '## 🎯 Konklusjon'],
    ['no', '## 📌 Sammendrag'],
    ['fi', '## 🎯 Yhteenveto'],
    ['fi', '## 📌 Tiivistelmä'],
    ['de', '## 🎯 Zusammenfassung'],
    ['de', '## 📌 Fazit'],
    ['fr', '## 🎯 Conclusion'],
    ['fr', '## 📌 Résumé'],
    ['es', '## 🎯 Conclusión'],
    ['es', '## 📌 Resumen ejecutivo'],
    ['nl', '## 🎯 Conclusie'],
    ['nl', '## 📌 Samenvatting'],
    ['ar', '## 🎯 الملخص التنفيذي'],
    ['ar', '## 📌 الخلاصة التنفيذية'],
    ['he', '## 🎯 תמצית מנהלים'],
    ['he', '## 📌 תקציר מנהלים'],
    ['ja', '## 🎯 要約'],
    ['ja', '## 📌 要旨'],
    ['ko', '## 🎯 핵심 요약'],
    ['ko', '## 📌 요약'],
    ['zh', '## 🎯 执行摘要'],
    ['zh', '## 📌 核心摘要'],
    // ── New entries from the 80.5% → 100% coverage expansion ──
    // BLUF-equivalent and template-anchor sections observed as the
    // first H2 of translated briefs in the live corpus. Each fixture
    // pins one previously-NONE pattern; removal here causes that
    // brief to fall back to readFirstParagraph and leak admin bylines.
    ['sv', '## Övergripande bedömning'],
    ['sv', '## Underrättelsesummering'],
    ['no', '## 60-sekunders lesing (8 punkter)'],
    ['fi', '## ⚡ Huippotason tiedustelu'],
    ['da', '## Beslutninger der kræves straks'],
    ['de', '## Sofort erforderliche Entscheidungen'],
    ['fr', '## Décisions immédiates requises'],
    ['es', '## Decisiones inmediatas requeridas'],
    ['nl', '## Onmiddellijk vereiste beslissingen'],
    ['ar', '## 🎯 ملخص'],
    ['he', '## כותרת ראשית'],
    ['ja', '## エグゼクティブサマリー'],
    ['ja', '## 5点エグゼクティブサマリー'],
    ['ko', '## 종합 평가'],
    ['ko', '## 즉각적인 결정 사항'],
    ['zh', '## 即刻所需决策'],
    ['zh', '## 60秒阅读'],
  ] as const)('[%s] readBlufParagraph matches localised heading "%s"', (lang, heading) => {
    const input = `# Title\n\n${heading}\n\nThe lede sentence.\n\n## Next\n\nMore.`;
    expect(readBlufParagraph(input, lang)).toBe('The lede sentence.');
  });

  it('readBlufParagraph(md, "en") still matches the literal `BLUF` token for translated briefs that preserve the English acronym', () => {
    // Half of non-EN briefs keep `BLUF` as a recognised intelligence
    // term — those must continue to match via the universal default
    // alternation, no matter what `lang` we pass.
    const input = '# Title\n\n## 🎯 BLUF\n\nThe lede.\n\n## Next';
    expect(readBlufParagraph(input, 'sv')).toBe('The lede.');
    expect(readBlufParagraph(input, 'ar')).toBe('The lede.');
    expect(readBlufParagraph(input, 'zh')).toBe('The lede.');
  });

  it('readBlufParagraph(md) without a lang preserves legacy English-only behaviour', () => {
    // Backward-compat regression guard: the no-lang call signature is
    // used by `article.ts` and `aggregate.ts` when extracting from the
    // English brief markdown. Localised headings must NOT match here
    // (e.g. a Spanish prose paragraph containing the word "Resumen"
    // in body text must not be promoted to BLUF when no `lang` is
    // supplied).
    const input = '# Title\n\n## 🎯 Sammanfattning\n\nSwedish lede.';
    expect(readBlufParagraph(input)).toBeNull();
  });

  it('readBlufParagraph accepts a blockquote-formatted BLUF body', () => {
    // Some translated briefs render the BLUF paragraph as a Markdown
    // blockquote (`> …`) rather than a plain paragraph. The cascade
    // must strip the `> ` prefix from each line and return the
    // collapsed prose. Removing the blockquote branch in
    // `readBlufParagraph` causes those briefs to count as NONE in
    // corpus coverage and silently ship the admin byline.
    const input = '# Title\n\n## BLUF\n\n> The lede sentence spans\n> two quoted lines.\n\n## Next';
    expect(readBlufParagraph(input)).toBe('The lede sentence spans two quoted lines.');
  });

  it('buildBlufHeadingRegex matches a parenthesised "(BLUF)" suffix variant', () => {
    // Briefs sometimes write the heading as
    //   `## Kärnbudskap (BLUF)` / `## 核心要点（BLUF）`
    // — the keyword is in parens AFTER a localised label.
    // `buildBlufHeadingRegex` must allow `(` and `（` as the
    // pre-keyword separator character.
    const sv = '# T\n\n## Kärnbudskap (BLUF)\n\nThe sv lede.\n\n## X';
    expect(readBlufParagraph(sv, 'sv')).toBe('The sv lede.');
    const zh = '# T\n\n## 核心要点（BLUF）\n\nThe zh lede.\n\n## X';
    expect(readBlufParagraph(zh, 'zh')).toBe('The zh lede.');
  });

  it('buildBlufHeadingRegex matches a CJK-script prefix before the keyword', () => {
    // Japanese briefs may write `## 結論優先の要約` — the dictionary
    // entry is `結論優先の要約` (no separator before it), but in
    // some files the heading reads `## 【BLUF】要約` with `]` /
    // `】` between an emoji-bracket prefix and the keyword. The
    // regex must allow CJK script characters (Han/Hiragana/Katakana/
    // Hangul) as a valid pre-keyword character so the alternation
    // can match without requiring a literal space.
    const ja = '# T\n\n## 【要約】の要点\n\nJa lede.\n\n## X';
    expect(readBlufParagraph(ja, 'ja')).toBe('Ja lede.');
  });

  it('cleanArtifactBody strips a leading Unicode bidi mark from RTL headings', () => {
    // Arabic / Hebrew translated briefs sometimes carry a leading
    // RLM (U+200F) or LRM (U+200E) on the H2 heading line. Without
    // stripping these line-start bidi marks the `^#{2,6}` anchor
    // never matches and the brief is counted as NONE in coverage.
    // `cleanArtifactBody` must strip U+200E..U+202E and U+2066..U+2069
    // at the start of each line. The integration is verified end-to-end
    // here by feeding the cleaned body to `readBlufParagraph`.
    const rawAr = '# Title\n\n\u200F## الملخص التنفيذي\n\nالنص العربي للملخص.\n\n## Next';
    const cleanedAr = cleanArtifactBody(rawAr);
    expect(readBlufParagraph(cleanedAr, 'ar')).toBe('النص العربي للملخص.');
    const rawHe = '# Title\n\n\u200E## תמצית מנהלים\n\nתקציר בעברית.\n\n## Next';
    const cleanedHe = cleanArtifactBody(rawHe);
    expect(readBlufParagraph(cleanedHe, 'he')).toBe('תקציר בעברית.');
  });

  // ── Corpus-derived regression guards: specific heading forms found ──
  // in 2026-05 production briefs that were previously unrecognised,
  // causing `readBlufParagraph` to fall through to a later, generic
  // section (e.g. `## Synthèse des risques` via bare `synthèse` in FR,
  // or `## 风险摘要` via bare `摘要` in ZH) and leak risk-matrix bullets
  // into the SERP description instead of the high-quality BLUF prose.

  it('[fr] évaluation de situation synthétique is matched as BLUF (prevents fallthrough to Synthèse des risques)', () => {
    const brief = [
      '# Propositions test',
      '',
      '**Classification** : OSINT · **Confiance** : MOYEN-ÉLEVÉ',
      '',
      '## 🎯 Évaluation de situation synthétique',
      '',
      'Du 30 avril au 7 mai 2026, le gouvernement Kristersson a soumis 10 propositions.',
      '',
      '## Lecture en 60 secondes',
      '',
      '- HD03267: Expulsion accélérée',
      '',
      '## Synthèse des risques',
      '',
      '- **Niveau 1 (systémique)** : Mise en œuvre HD03262 → risque de capacité ÉLEVÉ.',
      '',
    ].join('\n');
    const result = readBlufParagraph(brief, 'fr');
    expect(result).not.toBeNull();
    expect(result).toContain('gouvernement Kristersson');
    // Must NOT leak the risk-matrix content
    expect(result).not.toContain('Niveau 1');
  });

  it('[es] síntesis de situación is matched as BLUF', () => {
    const brief = [
      '# Mociones test',
      '',
      '**Clasificación**: OSINT · **Confianza**: MEDIO-ALTO',
      '',
      '## Síntesis de situación',
      '',
      'S exige el rechazo total de la prop 255 por motivos de RGPD.',
      '',
      '## Lectura en 60 segundos (8 puntos)',
      '',
      '1. **S contra MP**: análisis de la prop 255',
      '',
    ].join('\n');
    const result = readBlufParagraph(brief, 'es');
    expect(result).not.toBeNull();
    expect(result).toContain('RGPD');
  });

  it('[zh] 态势简要评估 is matched as BLUF (prevents fallthrough to 风险摘要)', () => {
    const brief = [
      '# ZH propositions test',
      '',
      '**分类**：公开OSINT · **可信度**：中高',
      '',
      '## 🎯 态势简要评估',
      '',
      '2026年4月，克里斯特松政府提交了10项议会议案。',
      '',
      '## 60秒速读',
      '',
      '- **最重要**：HD03262——废除永久居留许可',
      '',
      '## 风险摘要',
      '',
      '- **第1级（系统性）**：HD03262实施 → 能力风险高。',
      '',
    ].join('\n');
    const result = readBlufParagraph(brief, 'zh');
    expect(result).not.toBeNull();
    expect(result).toContain('克里斯特松政府');
    // Must NOT leak the risk-matrix content
    expect(result).not.toContain('第1级');
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

  // ──────────────────────────────────────────────────────────────────
  // Round 9 (2026-05-25) — 14-language Executive-Brief prefix dictionary.
  // Live audit of news/index_sv.html, _de.html, _fr.html, … showed
  // localized briefs shipped with the upstream-translated boilerplate
  // prefix (`Exekutiv sammanfattning —`, `Zusammenfassung —`,
  // `Résumé exécutif —`, …) un-stripped. The new lang-aware path in
  // cleanArticleTitle strips the prefix dictionary entries for the
  // matching language before the editorial signal is exposed to
  // buildSeoTitle.
  // ──────────────────────────────────────────────────────────────────

  it('cleanArticleTitle strips Swedish brief prefix `Exekutiv sammanfattning —`', () => {
    expect(
      cleanArticleTitle(
        'Exekutiv sammanfattning — Riksdagen antar AI-lag om ansiktsigenkänning — 2026-05-22',
        undefined,
        'sv',
      ),
    ).toBe('Riksdagen antar AI-lag om ansiktsigenkänning');
  });

  it('cleanArticleTitle strips German brief prefix `Zusammenfassung —`', () => {
    expect(
      cleanArticleTitle(
        'Zusammenfassung — Schwedens Reichstag verabschiedet KI-Gesetz — 2026-05-22',
        undefined,
        'de',
      ),
    ).toBe('Schwedens Reichstag verabschiedet KI-Gesetz');
  });

  it('cleanArticleTitle strips French brief prefix `Résumé exécutif —`', () => {
    expect(
      cleanArticleTitle(
        'Résumé exécutif — Le Riksdag suédois adopte une loi de surveillance faciale',
        undefined,
        'fr',
      ),
    ).toBe('Le Riksdag suédois adopte une loi de surveillance faciale');
  });

  it('cleanArticleTitle strips Arabic brief prefix `ملخص تنفيذي —` (RTL)', () => {
    // The dash is preserved as a single literal separator in the
    // dictionary; verify the RTL prefix is removed cleanly.
    const out = cleanArticleTitle(
      'ملخص تنفيذي — البرلمان السويدي يقر قانون الذكاء الاصطناعي',
      undefined,
      'ar',
    );
    expect(out).not.toMatch(/^ملخص/);
    expect(out).not.toBeNull();
  });

  it('cleanArticleTitle without lang param falls back to EN strip only (legacy callers)', () => {
    // Legacy callers (rewriter.ts, executive-brief-h1.ts gate) call
    // without a lang argument. The EN strip must still work; the SV
    // prefix must NOT match (no false positives in EN-only paths).
    expect(
      cleanArticleTitle('Executive Brief — Sweden Tightens Migration Rules This Week'),
    ).toBe('Sweden Tightens Migration Rules This Week');
    // SV prefix without lang — left intact since cleanArticleTitle
    // cannot disambiguate the language without the parameter.
    expect(
      cleanArticleTitle('Exekutiv sammanfattning — Sweden Tightens Migration Rules This Week'),
    ).toBe('Exekutiv sammanfattning — Sweden Tightens Migration Rules This Week');
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

  // ──────────────────────────────────────────────────────────────────
  // Round 7 (2026-05-09) — quality-fix regressions for known-bad
  // titles/descriptions observed in news/2026-05-08-*-en.html.
  // ──────────────────────────────────────────────────────────────────

  it('cleanArticleTitle returns null when title equals prettified subfolder (boilerplate guard)', () => {
    // `# Executive Brief — Government Propositions 2026-05-08` →
    // `Government Propositions` after strip → equals `prettifyFallbackTitle('propositions')`
    // → null (forces BLUF fallback).
    expect(
      cleanArticleTitle(
        'Executive Brief — Government Propositions 2026-05-08',
        'propositions',
      ),
    ).toBeNull();
    // Same for `Interpellation Debates` ↔ `interpellations`.
    expect(
      cleanArticleTitle('Interpellation Debates', 'interpellations'),
    ).toBeNull();
    // And the realtime-pulse case: `Riksdag Realtime Pulse` ends with
    // the prettified subfolder `Realtime Pulse` so the guard fires.
    expect(
      cleanArticleTitle('Riksdag Realtime Pulse', 'realtime-pulse'),
    ).toBeNull();
  });

  it('cleanArticleTitle preserves a real story title even when subfolder is supplied', () => {
    expect(
      cleanArticleTitle(
        'Opposition Motions Challenge Forestry and Youth Justice Reforms',
        'motions',
      ),
    ).toBe('Opposition Motions Challenge Forestry and Youth Justice Reforms');
  });

  it('titleFromBluf strips a leading "On <date>, " prefix (no literal date in title)', () => {
    const bluf =
      'On 7 May 2026, the Tidö government submitted three interlocking propositions.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/\b2026\b/);
    expect(out).not.toMatch(/^On\s+\d/);
    // First letter recapped from lower-case `the` after strip.
    expect(out!.startsWith('The Tidö government')).toBe(true);
  });

  it('titleFromBluf strips a leading weekday + date prefix when result remains grammatical', () => {
    // No verb-leading after strip → date prefix is removed.
    const bluf =
      'Friday 8 May 2026, the Riksdag advanced six committee reports.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/\b2026\b/);
    expect(out).not.toMatch(/^Friday/);
    expect(out!.length).toBeGreaterThan(10);
  });

  it('titleFromBluf KEEPS the date prefix when stripping would leave a verb-leading subjectless fragment', () => {
    // `Friday 8 May 2026 marks …` → strip would leave `marks …` which is
    // ungrammatical (lost subject). Better to ship the date than break
    // grammar — see VERB_LEADING_TOKENS guard.
    const bluf =
      'Friday 8 May 2026 marks a legislative heavy-load day in the Riksdag.';
    const out = titleFromBluf(bluf, 70);
    expect(out!.startsWith('Friday')).toBe(true);
    expect(out).not.toMatch(/^Marks\s/);
  });

  it('titleFromBluf strips a leading "The week of <range>" prefix', () => {
    const bluf =
      'The week of 2–9 May 2026 produced a cluster of domestic legislation.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/\b2026\b/);
    expect(out).not.toMatch(/^The week of/);
  });

  it('titleFromBluf does not end on a trailing comma or coordinating connector', () => {
    // Worst-case from news/2026-05-08-evening-analysis-en.html: cut at
    // "in the Riksdag," — both the comma and the connector should be
    // stripped by the post-cut cleanup.
    const bluf =
      'A legislative heavy-load day in the Riksdag, with six committee reports advancing toward chamber vote.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/[,;:]$/);
    expect(out).not.toMatch(/\b(?:and|or|but|with|the|a|in|of|to|for|on|at|by|from|that|which|have|has|had|is|are|was|were|will|would)$/i);
  });

  it('titleFromBluf still returns null on empty input after date strip', () => {
    expect(titleFromBluf('On 7 May 2026, .')).toBeNull();
  });

  // Round 8 (2026-05-09) — list-marker strip. Audit of
  // analysis/daily/2026-05-05/evening-analysis/ showed that an ordered
  // list `1. SD fires …` produced title `1` because the period after
  // the digit was treated as a sentence terminator. Now we strip the
  // list-item marker before extracting the first sentence.
  it('titleFromBluf strips a leading ordered-list marker (1. / 2) / -)', () => {
    expect(titleFromBluf('1. SD fires two coordinated state-reform salvos.', 70))
      .toBe('SD fires two coordinated state-reform salvos');
    expect(titleFromBluf('2) The opposition mounts coordinated resistance.', 70))
      .toBe('The opposition mounts coordinated resistance');
    expect(titleFromBluf('- The Riksdag voted 173 to 176 against the motion.', 70))
      .toBe('The Riksdag voted 173 to 176 against the motion');
    expect(titleFromBluf('• Sweden joins NATO summit talks.', 70))
      .toBe('Sweden joins NATO summit talks');
  });

  // ────────────────────────────────────────────────────────────────────
  // 2026-05-16 hardening (Phase 3 of the PR #2527 follow-up):
  // - Trailing-comma strip in cleanArticleTitle (Class C cosmetic damage).
  // - Tail-too-short truncation guard in titleFromBluf (`… on the Tidö`).
  // - Swedish "Den <day> <månad> <year>" date-prefix strip (multi-lingual).
  // ────────────────────────────────────────────────────────────────────

  it('cleanArticleTitle preserves a bare trailing uppercase `A` (live: `Tax Class A`, `Plan A`)', () => {
    // Regression: title.ts:92 connector regex used the `i` flag with bare
    // single-letter `a`/`à` in the alternation list, so uppercase `A`/`À`
    // at the end of a real title was silently stripped — `Tax Class A`
    // → `Tax Class`, `Plan A` → `Plan`. The fix splits multi-letter
    // case-insensitive connectors from single-letter case-sensitive
    // (lowercase-only) ones, so genuine uppercase initials survive.
    expect(
      cleanArticleTitle('Riksdag Vote Approves Migration Reform Plan A'),
    ).toBe('Riksdag Vote Approves Migration Reform Plan A');
    expect(
      cleanArticleTitle('New Tax Bracket Created for Income Category A'),
    ).toBe('New Tax Bracket Created for Income Category A');
    // Lowercase Spanish/Catalan `a` connector is still stripped.
    expect(
      cleanArticleTitle('El Riksdag aprueba una ley a'),
    ).toBe('El Riksdag aprueba una ley');
  });

  it('cleanArticleTitle strips a bare trailing comma (live: `Sweden Evening Analysis,`)', () => {
    expect(
      cleanArticleTitle('Sweden Evening Analysis, Constitutional Moment Builds,'),
    ).toBe('Sweden Evening Analysis, Constitutional Moment Builds');
    expect(
      cleanArticleTitle('Riksdag Approves FiU48 Fuel-Tax Cut Ahead of Election,'),
    ).toBe('Riksdag Approves FiU48 Fuel-Tax Cut Ahead of Election');
  });

  it('cleanArticleTitle strips a bare trailing semicolon or colon', () => {
    expect(
      cleanArticleTitle('Opposition Unites Against Migration Restriction Package;'),
    ).toBe('Opposition Unites Against Migration Restriction Package');
    expect(
      cleanArticleTitle('Riksdag Constitutional Reform Advances Toward Vote:'),
    ).toBe('Riksdag Constitutional Reform Advances Toward Vote');
  });

  it("titleFromBluf does not truncate to end on a ≤ 3-char tail word (live: `… on the Tidö`)", () => {
    // Reproduces 2026-05-16 weekly-review live regression where the
    // card title was "Three simultaneous pressure points are converging
    // on the Tidö" — `Tidö` is a 4-char word but the previous tail
    // `… on the` would have been ≤ 3 chars. Verify both that we don't
    // end on `the`/`on`/`to` (which we would have done before the
    // guard) and that 4-char words are preserved as substantive endings.
    const bluf =
      'Three simultaneous pressure points are converging on the Tidö coalition government this week.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/\b(?:the|on|to|of|in|at|by|as|a|an)$/i);
  });

  it('titleFromBluf does not truncate to end on `two`, `has` or other ≤ 3-char filler', () => {
    // Live: `Sweden's Constitutional Affairs Committee (KU) has advanced two`
    const bluf =
      "Sweden's Constitutional Affairs Committee (KU) has advanced two interlocked constitutional amendments requiring a supermajority.";
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/\b(?:two|has|had|its|the|and|or)$/i);
    expect(out!.length).toBeGreaterThan(10);
  });

  it('titleFromBluf preserves 4+ char tail words like `bill`, `cuts`, `vote`', () => {
    // Bluf longer than 70 chars to trigger the cut path; `bill` should
    // be the substantive 4-char tail word that survives the step-back
    // guard.
    const bluf =
      'Opposition motions challenge the new forestry reform bill in committee.';
    const out = titleFromBluf(bluf, 70);
    expect(out).toMatch(/bill$/);
  });

  it('titleFromBluf KEEPS a leading Swedish date prefix when stripping would leave a V2 verb-leading fragment', () => {
    // Swedish V2 word order: "Den 13 maj 2026 antog riksdagen …" →
    // stripping the date prefix leaves "antog riksdagen …" which is
    // verb-leading (lost grammatical subject due to V2 inversion).
    // The guard detects "antog" in VERB_LEADING_TOKENS and keeps the
    // date prefix — same logic as the English "marks …" case.
    const bluf =
      'Den 13 maj 2026 antog Rysslands statsduma en lag som institutionaliserar makten.';
    const out = titleFromBluf(bluf, 70);
    // Date prefix is kept — verb-leading guard fires.
    expect(out!.startsWith('Den')).toBe(true);
    expect(out).not.toMatch(/^antog\s/i);
  });

  it('titleFromBluf strips a leading Swedish date prefix when result is NOT verb-leading', () => {
    // When the stripped result starts with a noun phrase (not a verb),
    // the date IS removed as intended. Here "Den 7 maj 2026, riksdagen…"
    // has subject-first order after the comma — no V2 inversion — so
    // stripping leaves "riksdagen…" (noun-leading).
    const bluf =
      'Den 7 maj 2026, riksdagen röstade nej till förslaget om skattelättnader.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/^Den\s+\d/);
    expect(out).not.toMatch(/\bmaj\s+2026\b/);
  });

  it('titleFromBluf KEEPS a leading German date prefix when stripping would leave a V2 verb-leading fragment', () => {
    // German V2: "Am 13. Mai 2026 beschloss der Bundestag …" →
    // stripping "Am 13. Mai 2026 " leaves "beschloss der Bundestag …"
    // which starts with German past-tense verb (V2 inversion).
    const bluf =
      'Am 13. Mai 2026 beschloss der Bundestag ein neues Gesetz zur Verteidigungspolitik.';
    const out = titleFromBluf(bluf, 70);
    expect(out!.startsWith('Am')).toBe(true);
    expect(out).not.toMatch(/^beschloss\s/i);
  });

  it('titleFromBluf strips a leading German date prefix when result is NOT verb-leading', () => {
    // A noun-leading result after date strip → date is removed.
    const bluf =
      'Am 7. Mai 2026 ist der neue Haushaltsentwurf in Kraft getreten.';
    const out = titleFromBluf(bluf, 70);
    expect(out).not.toMatch(/^Am\s+\d/);
    expect(out).not.toMatch(/\bMai\s+2026\b/);
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

  it('buildFrontMatter assembles a body-only block with auto slug and omits SEO fields', () => {
    const fm = buildFrontMatter({
      title: 'Hello',
      description: 'Body',
      date: '2026-04-27',
      subfolder: 'propositions',
      source_folder: 'analysis/daily/2026-04-27/propositions',
      generated_at: '2026-04-27T18:00:00.000Z',
    });
    // SEO fields are derived from executive-brief.md at render time, not emitted to article.md frontmatter
    expect(fm).not.toContain('title:');
    expect(fm).not.toContain('description:');
    expect(fm).not.toContain('keywords:');
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
    // Localised labels appear (not raw filenames — the source-artifact
    // column was removed in favour of audit-grade traceability via the
    // Analysis Sources card grid at the article foot).
    expect(guide).toContain('BLUF and editorial decisions');
    expect(guide).toContain('Risk assessment');
    expect(guide).not.toContain('Key Judgments'); // intelligence-assessment.md not present
    // Audit-appendix pointer is always emitted.
    expect(guide).toContain('Audit appendix');
    expect(guide).toContain('#rm-article-sources');
    // No per-document row when hasDocuments=false.
    expect(guide).not.toContain('Per-document intelligence');
  });

  it('buildReaderGuide emits the per-document row when hasDocuments=true', () => {
    const guide = buildReaderGuide(new Set(['executive-brief.md']), true);
    expect(guide).toContain('Per-document intelligence');
  });

  it('buildReaderGuide audit row targets political-classification when classification-results is absent', () => {
    const guide = buildReaderGuide(
      new Set(['executive-brief.md', 'political-classification.md']),
      false,
    );
    expect(guide).toContain('[Audit appendix](#rm-political-classification)');
    expect(guide).not.toContain('[Audit appendix](#rm-classification-results)');
    expect(guide).toContain('ISMS data classification');
    expect(auditAnchorForArtifacts(['political-classification.md'])).toBe('rm-political-classification');
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

  it('links supporting JSON data artifacts without expanding them inline', () => {
    const out = buildSourcesAppendix(
      ['executive-brief.md'],
      'analysis/daily/2026-05-12/propositions',
      ['pir-status.json', 'economic-data.json', 'documents/hd03250.json'],
    );
    expect(out).toContain('### Supporting Data Artifacts');
    expect(out).toContain('`pir-status.json`');
    expect(out).toContain('`economic-data.json`');
    expect(out).toContain('`documents/hd03250.json`');
    expect(out).toContain('not expanded inline');
  });

  it('emits a supporting-data-only preamble when used is empty but supporting data exists', () => {
    const out = buildSourcesAppendix(
      [],
      'analysis/daily/2026-05-12/propositions',
      ['pir-status.json'],
    );
    expect(out).not.toBeNull();
    expect(out).toContain('## Article Sources');
    expect(out).toContain('only machine-readable supporting data');
    expect(out).not.toContain('Each section above projects one analysis artifact');
    expect(out).toContain('### Supporting Data Artifacts');
    expect(out).toContain('`pir-status.json`');
  });

  it('buildArtifactCoverageReport summarizes emitted, data and absent artifacts', () => {
    const out = buildArtifactCoverageReport({
      emittedMarkdownArtifacts: ['executive-brief.md', 'political-classification.md'],
      perDocumentArtifacts: ['documents/HD1-analysis.md'],
      supportingDataArtifacts: ['pir-status.json'],
      absentOrderedArtifacts: ['classification-results.md'],
    });
    expect(out).toContain('## Analysis Artifact Coverage Report');
    expect(out).toContain('| Ordered/root markdown sections | 2 |');
    expect(out).toContain('| Per-document analyses | 1 |');
    expect(out).toContain('| Supporting data artifacts | 1 |');
    expect(out).toContain('`classification-results.md`');
  });

  it('buildArtifactCoverageReport surfaces alias-de-duped and present-but-empty buckets on their own lines', () => {
    const out = buildArtifactCoverageReport({
      emittedMarkdownArtifacts: ['executive-brief.md', 'stakeholder-perspectives.md'],
      perDocumentArtifacts: [],
      supportingDataArtifacts: [],
      absentOrderedArtifacts: ['scenario-analysis.md'],
      presentButFilteredArtifacts: ['threat-analysis.md'],
      aliasDedupedArtifacts: ['stakeholder-impact.md'],
    });
    expect(out).toContain('Absent canonical ordered slots');
    expect(out).toContain('`scenario-analysis.md`');
    expect(out).toContain('Present-but-empty canonical slots');
    expect(out).toContain('`threat-analysis.md`');
    expect(out).toContain('Alias-de-duped canonical artifacts');
    expect(out).toContain('`stakeholder-impact.md`');
  });

  it('buildArtifactCoverageReport annotates the supporting-data count when truncation occurred', () => {
    const out = buildArtifactCoverageReport({
      emittedMarkdownArtifacts: ['executive-brief.md'],
      perDocumentArtifacts: [],
      supportingDataArtifacts: ['a.json', 'b.json'],
      supportingDataTruncatedCount: 17,
      absentOrderedArtifacts: [],
    });
    expect(out).toContain('| Supporting data artifacts | 2 (+17 truncated) |');
  });
});

describe('markdown/* — leaf module isolation', () => {
  it('preprocessMermaidFences swaps fences for <pre class="mermaid">', () => {
    const out = preprocessMermaidFences('```mermaid\ngraph LR; A-->B\n```');
    expect(out).toContain('<pre class="mermaid"');
    expect(out).toContain('data-mermaid-source="true"');
    expect(out).toContain('tabindex="0"');
  });

  it('preprocessMermaidFences escapes HTML inside diagram source', () => {
    const out = preprocessMermaidFences('```mermaid\nA --> "B<C>"\n```');
    expect(out).toContain('&lt;C&gt;');
    expect(out).not.toContain('B<C>');
  });

  it('preprocessMermaidFences injects the canonical %%{init …}%% block when the diagram is unthemed', () => {
    const out = preprocessMermaidFences('```mermaid\nflowchart LR\nA --> B\n```');
    // Renderer escapes `"` → `&quot;`, so we match the escaped fingerprint.
    expect(out).toContain('%%{init');
    expect(out).toContain('&quot;theme&quot;: &quot;dark&quot;');
    expect(out).toContain('&quot;primaryColor&quot;: &quot;#00d9ff&quot;');
    expect(out).toContain('flowchart LR');
  });

  it('preprocessMermaidFences leaves an already-themed diagram untouched (no double prologue)', () => {
    const themed =
      '```mermaid\n%%{init: {"theme": "neutral"}}%%\nflowchart LR\nA --> B\n```';
    const out = preprocessMermaidFences(themed);
    // Exactly one `%%{init` — i.e. the renderer did not stack a second
    // canonical prologue on top of the artifact's own theme.
    const initCount = (out.match(/%%\{init/g) ?? []).length;
    expect(initCount).toBe(1);
    expect(out).toContain('&quot;theme&quot;: &quot;neutral&quot;');
    expect(out).not.toContain('&quot;theme&quot;: &quot;dark&quot;');
  });

  it('returns body unchanged when there are no mermaid fences', () => {
    const md = '## Heading\n\nSome prose with `inline code` and a [link](https://x).';
    expect(preprocessMermaidFences(md)).toBe(md);
  });

  it('recovers from an unclosed mermaid fence by terminating at the next opening fence', () => {
    // Reproducer for the motions/article.md regression: AI agent emits
    // two `\`\`\`mermaid` openings with the closing fence dropped on the
    // first. The naive non-greedy regex would silently merge both into
    // one diagram and lose the second. The line-based preprocessor must
    // emit exactly two `<pre class="mermaid">` blocks.
    const md = [
      '```mermaid',
      'flowchart LR',
      '  A --> B',
      // (no closing fence!)
      '',
      '## Next section',
      '',
      '```mermaid',
      'flowchart TD',
      '  C --> D',
      '```',
    ].join('\n');
    const out = preprocessMermaidFences(md);
    const preCount = (out.match(/<pre class="mermaid"/g) ?? []).length;
    expect(preCount).toBe(2);
    // Each block contains its own diagram body (no merge).
    expect(out).toContain('flowchart LR');
    expect(out).toContain('flowchart TD');
    // The intervening heading is preserved.
    expect(out).toContain('## Next section');
  });

  it('recovers from an unclosed mermaid fence at end-of-input', () => {
    const md = '```mermaid\nflowchart LR\n  A --> B\n';
    const out = preprocessMermaidFences(md);
    expect(out).toContain('<pre class="mermaid"');
    expect(out).toContain('flowchart LR');
    // Ensure the opening fence is consumed (no stray `\`\`\`mermaid` left).
    expect(out).not.toContain('```mermaid');
  });

  it('preserves the open/close pairing for back-to-back well-formed mermaid blocks', () => {
    const md = [
      '```mermaid',
      'flowchart LR',
      '  A --> B',
      '```',
      '',
      '```mermaid',
      'flowchart TD',
      '  C --> D',
      '```',
    ].join('\n');
    const out = preprocessMermaidFences(md);
    const preCount = (out.match(/<pre class="mermaid"/g) ?? []).length;
    expect(preCount).toBe(2);
  });

  it('hasMermaidTheme detects every Check-5 theme signal', () => {
    expect(hasMermaidTheme('flowchart LR\nA --> B')).toBe(false);
    expect(hasMermaidTheme('%%{init: {"theme":"dark"}}%%\nflowchart LR')).toBe(true);
    expect(hasMermaidTheme('flowchart LR\nA --> B\nstyle A fill:#000')).toBe(true);
    expect(hasMermaidTheme('flowchart LR\nclassDef red fill:#f00\nclass A red')).toBe(true);
    expect(hasMermaidTheme('flowchart LR\nA --> B\nlinkStyle 0 stroke:#0f0')).toBe(true);
    expect(hasMermaidTheme('themeVariables:\n  primary: red')).toBe(true);
  });

  it('ensureMermaidTheme is a pure function and idempotent', () => {
    const unthemed = 'flowchart LR\nA --> B';
    const once = ensureMermaidTheme(unthemed);
    const twice = ensureMermaidTheme(once);
    expect(once).toBe(twice); // injection happens at most once
    expect(once.startsWith(CANONICAL_MERMAID_INIT)).toBe(true);
  });

  it('CANONICAL_MERMAID_INIT mirrors the cyberpunk dark theme baked into mermaid-init.mjs', () => {
    // Cross-check against the irreducible colour tokens consumed by the
    // client-side loader (`js/lib/mermaid-init.mjs`). If the loader
    // changes, this test fails and forces an update of the canon.
    expect(CANONICAL_MERMAID_INIT).toContain('"primaryColor": "#00d9ff"');
    expect(CANONICAL_MERMAID_INIT).toContain('"primaryTextColor": "#e0e0e0"');
    expect(CANONICAL_MERMAID_INIT).toContain('"lineColor": "#ff006e"');
    expect(CANONICAL_MERMAID_INIT).toContain('"background": "#0a0e27"');
    expect(CANONICAL_MERMAID_INIT.endsWith('\n')).toBe(true);
  });

  it('CANONICAL_MERMAID_INIT satisfies Check 5 of .github/prompts/05-analysis-gate.md', () => {
    // The gate's Check 5 fails any GATE_SYNTH_LIST file whose Mermaid
    // block lacks BOTH a `style …` directive AND a
    // `themeVariables` / `%%{init …}` config. The canonical block must
    // satisfy the second branch — this regex is the JS equivalent of the
    // gate's grep pattern (`grep -qE 'themeVariables|%%\{[[:space:]]*init'`).
    const gateCheck5Re = /themeVariables|%%\{\s*init/;
    expect(gateCheck5Re.test(CANONICAL_MERMAID_INIT)).toBe(true);
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

// ── Reader Intelligence Guide — i18n, dedup, completeness ─────────────────

import { READER_GUIDE_I18N, readerGuideI18n } from '../scripts/render-lib/aggregator/reader-guide-i18n.js';
import { LANGUAGES } from '../scripts/render-lib/constants.js';

describe('aggregator/reader-guide-i18n — 14-language coverage', () => {
  it('READER_GUIDE_I18N has an entry for all 14 supported languages', () => {
    for (const lang of LANGUAGES) {
      expect(READER_GUIDE_I18N[lang]).toBeDefined();
      expect(READER_GUIDE_I18N[lang].chrome.heading).toBeTruthy();
      expect(READER_GUIDE_I18N[lang].chrome.preamble.length).toBeGreaterThan(20);
      expect(READER_GUIDE_I18N[lang].chrome.auditLabel).toBeTruthy();
      expect(READER_GUIDE_I18N[lang].chrome.colIcon).toBeTruthy();
    }
  });

  it('non-English languages have localised (non-English) heading', () => {
    const enHeading = READER_GUIDE_I18N.en.chrome.heading;
    for (const lang of LANGUAGES) {
      if (lang === 'en') continue;
      expect(READER_GUIDE_I18N[lang].chrome.heading).not.toBe(enHeading);
    }
  });

  it('non-English languages have localised audit appendix label', () => {
    const enAuditLabel = READER_GUIDE_I18N.en.chrome.auditLabel;
    for (const lang of LANGUAGES) {
      if (lang === 'en') continue;
      expect(READER_GUIDE_I18N[lang].chrome.auditLabel).not.toBe(enAuditLabel);
    }
  });

  it('every language bundle has entries for all READER_GUIDE_ENTRIES files', () => {
    for (const lang of LANGUAGES) {
      const bundle = READER_GUIDE_I18N[lang];
      for (const entry of READER_GUIDE_ENTRIES) {
        expect(bundle.entries[entry.file]).toBeDefined();
        expect(bundle.entries[entry.file]!.label).toBeTruthy();
        expect(bundle.entries[entry.file]!.readerValue).toBeTruthy();
      }
    }
  });

  it('readerGuideI18n() returns English for unknown language', () => {
    // @ts-expect-error — intentionally passing invalid language
    const bundle = readerGuideI18n('xx');
    expect(bundle.chrome.heading).toBe('Reader Intelligence Guide');
  });
});

describe('aggregator/reader-guide — i18n integration', () => {
  it('buildReaderGuide with lang=sv produces Swedish heading', () => {
    const guide = buildReaderGuide(
      new Set(['executive-brief.md', 'risk-assessment.md']),
      false,
      'sv',
    );
    expect(guide).toContain('## Läsarens underrättelseguide');
    // Swedish localised audit-row label.
    expect(guide).toContain('Revisionsappendix');
    expect(guide).not.toContain('Reader Intelligence Guide');
    expect(guide).not.toContain('Audit appendix');
  });

  it('buildReaderGuide with lang=ja produces Japanese heading', () => {
    const guide = buildReaderGuide(
      new Set(['executive-brief.md']),
      false,
      'ja',
    );
    expect(guide).toContain('## 読者向けインテリジェンスガイド');
  });

  it('buildReaderGuide without lang defaults to English', () => {
    const guide = buildReaderGuide(
      new Set(['executive-brief.md']),
      false,
    );
    expect(guide).toContain('## Reader Intelligence Guide');
  });

  it('buildReaderGuide slug-parity: every anchor starts with HEADING_ID_PREFIX', () => {
    const allFiles = new Set(READER_GUIDE_ENTRIES.map((e) => e.file));
    const guide = buildReaderGuide(allFiles, true, 'en');
    const anchors = [...guide.matchAll(/#(rm-[a-z0-9-]+)/g)].map((m) => m[1]);
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) {
      expect(a).toMatch(/^rm-/);
      expect(a).not.toMatch(/^rm--/); // no double-dash after prefix
    }
  });

  it('buildReaderGuide completeness: row count matches available artifact count + special rows', () => {
    const available = new Set(['executive-brief.md', 'risk-assessment.md', 'scenario-analysis.md']);
    const guide = buildReaderGuide(available, true, 'en');
    // 3 artifact rows + 1 per-document + 1 audit = 5 data rows.
    // New row pattern: `| <icon> | [label](#anchor) | description |`
    // The leading icon glyph is a single Unicode character (emoji),
    // so we match rows starting with `| ` followed by a non-pipe and
    // then ` | [`.
    const dataRows = guide.split('\n').filter((l) => /^\| [^|]+ \| \[/.test(l));
    expect(dataRows.length).toBe(5);
  });
});

describe('aggregator/cleaning/structural — stripInlineReaderGuide', () => {
  it('strips an inline Reader Intelligence Guide block from artifact body', () => {
    const body = [
      'Some real content here.',
      '',
      '## Reader Intelligence Guide',
      '',
      'Use this guide.',
      '',
      '| Reader need | What you\'ll get | Source artifact |',
      '|---|---|---|',
      '| [BLUF](#rm-bluf) | fast answer | `executive-brief.md` |',
      '',
      '## Next Section',
      '',
      'More content.',
    ].join('\n');

    const result = stripInlineReaderGuide(body);
    expect(result).not.toContain('Reader Intelligence Guide');
    expect(result).toContain('Some real content here.');
    expect(result).toContain('## Next Section');
    expect(result).toContain('More content.');
  });

  it('preserves a paragraph that follows the table without intervening heading', () => {
    // Regression: the old regex ate all non-`##` content after the table.
    const body = [
      '## Reader Intelligence Guide',
      '',
      '| Reader need | What | Source |',
      '|---|---|---|',
      '| [BLUF](#rm-bluf) | answer | `brief.md` |',
      '',
      'This paragraph comes after the table and must survive.',
      '',
      '### Subheading still present',
    ].join('\n');

    const result = stripInlineReaderGuide(body);
    expect(result).not.toContain('Reader Intelligence Guide');
    expect(result).toContain('This paragraph comes after the table and must survive.');
    expect(result).toContain('### Subheading still present');
  });

  it('returns body unchanged when no Reader Intelligence Guide is present', () => {
    const body = '## Summary\n\nSome text here.\n';
    expect(stripInlineReaderGuide(body)).toBe(body);
  });

  it('cleanArtifactBody invokes stripInlineReaderGuide (integration)', () => {
    const raw = [
      '---',
      'title: Test',
      '---',
      '# Test Artifact',
      '',
      '## Reader Intelligence Guide',
      '',
      '| Reader need | What | Source |',
      '|---|---|---|',
      '| [BLUF](#rm-bluf) | answer | `brief.md` |',
      '',
      '## Real Content',
      '',
      'Actual analysis here.',
    ].join('\n');

    const cleaned = cleanArtifactBody(raw);
    expect(cleaned).not.toContain('Reader Intelligence Guide');
    expect(cleaned).toContain('Actual analysis here.');
  });
});

describe('aggregator/cleaning/structural — dedupeAdjacentDuplicateLines', () => {
  it('collapses two identical adjacent classification rows', () => {
    const body = [
      '| Dimension | Classification | Rationale |',
      '|-----------|---------------|-----------|',
      '| Policy domain | Infrastructure | foo [HD123] |',
      '| Policy domain | Infrastructure | foo [HD123] |',
      '| Urgency | HIGH | bar |',
    ].join('\n');
    const out = dedupeAdjacentDuplicateLines(body);
    const occurrences = out.match(/Policy domain \| Infrastructure/g) ?? [];
    expect(occurrences.length).toBe(1);
    expect(out).toContain('| Urgency | HIGH | bar |');
  });

  it('keeps non-adjacent duplicate lines intact', () => {
    const body = ['Line A.', 'Line B.', 'Line A.'].join('\n');
    expect(dedupeAdjacentDuplicateLines(body)).toBe(body);
  });

  it('preserves duplicates inside a fenced code block', () => {
    const body = ['```', 'foo', 'foo', '```', 'foo', 'foo'].join('\n');
    const out = dedupeAdjacentDuplicateLines(body);
    // Inside the fence both `foo` lines remain; outside the fence one
    // is collapsed.
    expect(out).toBe(['```', 'foo', 'foo', '```', 'foo'].join('\n'));
  });

  it('is idempotent (applying twice equals applying once)', () => {
    const body = ['x', 'x', 'x', '', 'y', 'y'].join('\n');
    const once = dedupeAdjacentDuplicateLines(body);
    expect(dedupeAdjacentDuplicateLines(once)).toBe(once);
  });
});

describe('aggregator/cleaning/structural — collapseRepeatedFooterBlocks', () => {
  it('collapses repeated **ISMS** footer lines to the first occurrence', () => {
    const body = [
      'Body content.',
      '',
      '**ISMS classification**: PUBLIC, no PII.',
      '',
      'More content.',
      '',
      '**ISMS classification**: PUBLIC, no PII.',
    ].join('\n');
    const out = collapseRepeatedFooterBlocks(body);
    const matches = out.match(/\*\*ISMS classification\*\*/g) ?? [];
    expect(matches.length).toBe(1);
    expect(out).toContain('More content.');
  });

  it('collapses repeated `**Classified under …**` markers', () => {
    const body = [
      '**Classified under ISO 27001:A.5.10**',
      'Body.',
      '**Classified under ISO 27001:A.5.10**',
    ].join('\n');
    const out = collapseRepeatedFooterBlocks(body);
    expect(out.match(/Classified under/g)?.length ?? 0).toBe(1);
  });

  it('leaves a single occurrence untouched', () => {
    const body = '**ISMS**: PUBLIC.\n\nBody.';
    expect(collapseRepeatedFooterBlocks(body)).toBe(body);
  });

  it('does not strip legitimate content that mentions ISMS in prose', () => {
    const body = 'The ISMS framework requires this.\n\nThe ISMS framework requires this.';
    // These lines do not start with the bold/italic footer marker so
    // they are not treated as repeated footer blocks.
    expect(collapseRepeatedFooterBlocks(body)).toBe(body);
  });

  it('cleanArtifactBody invokes the new cleaning steps (integration)', () => {
    const raw = [
      '---',
      'title: Test',
      '---',
      '# Test Artifact',
      '',
      '**ISMS classification**: PUBLIC.',
      '',
      'Body line.',
      'Body line.',
      '',
      '**ISMS classification**: PUBLIC.',
    ].join('\n');
    const cleaned = cleanArtifactBody(raw);
    expect(cleaned.match(/\*\*ISMS classification\*\*/g)?.length ?? 0).toBe(1);
    expect(cleaned.match(/Body line\./g)?.length ?? 0).toBe(1);
  });
});
