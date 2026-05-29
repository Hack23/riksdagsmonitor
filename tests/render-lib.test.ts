/**
 * Unit tests for scripts/render-lib/index.ts — the aggregate-then-render
 * article pipeline introduced in PR #1979.
 *
 * Focus: the boilerplate-stripping and ordering rules that keep published
 * articles free of AI-process metadata (Pass-2 self-audit sections, admin
 * bylines like **Author** / **Run ID** / **Classification** / **Confidence**).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  aggregateAnalysis,
  AGGREGATION_ORDER,
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  LANGUAGES,
  buildGithubBlobUrl,
  buildGithubTreeUrl,
  titleForArtifact,
  renderMarkdownToHtml,
  renderChromeHead,
  buildChrome,
  buildArticleSeoMetadata,
  renderArticleHtml,
  stripBodyDuplicateSections,
  __test__,
} from '../scripts/render-lib/index.js';
import type { Language } from '../scripts/types/language.js';

const {
  stripPassTwoSection,
  stripLeadingAdminBylines,
  stripProcessMetaLines,
  stripSourcePreamble,
  demoteHeadings,
  cleanArtifactBody,
  rewriteRelativeLinks,
  prettifyFallbackTitle,
  readFirstHeading,
  readFirstParagraph,
  escapeYaml,
  escapeInlineMd,
  anchorForTitle,
} = __test__;

describe('render-lib — cleanArtifactBody', () => {
  it('strips a trailing "## Pass 2 refinements" section', () => {
    const raw = [
      '# Executive Brief',
      '',
      'Real BLUF prose.',
      '',
      '## Real section',
      '',
      'More real content.',
      '',
      '## Pass 2 refinements',
      '',
      'Re-read this artifact; no judgments were reversed.',
      'Pass-2 change log that must never reach readers.',
      '',
    ].join('\n');
    const out = cleanArtifactBody(raw);
    expect(out).toContain('Real BLUF prose.');
    expect(out).toContain('More real content.');
    expect(out).not.toMatch(/Pass 2 refinements/i);
    expect(out).not.toMatch(/must never reach readers/i);
  });

  it('strips variants: "Pass 2 addendum", "🔁 Pass 2", "### Pass 2 review note"', () => {
    const variants = [
      '## Pass 2 addendum — cross-references & tightening',
      '## 🔁 Pass 2 addendum',
      '### Pass 2 review note',
      '## Pass 2 Update (2026-04-24)',
      '#### Pass 2 improvements',
    ];
    for (const heading of variants) {
      const raw = `# Title\n\nReal prose here.\n\n${heading}\n\nself-audit note\n`;
      const out = cleanArtifactBody(raw);
      expect(out, `variant: ${heading}`).toContain('Real prose here.');
      expect(out, `variant: ${heading}`).not.toMatch(/self-audit note/);
    }
  });

  it('strips leading admin-byline paragraph (Author / Run ID / Classification / Confidence)', () => {
    const raw = [
      '# Executive Brief',
      '',
      '**Author**: James Pether Sörling   **Run ID**: 24866836753   **Classification**: PUBLIC   **Confidence**: HIGH (B2)',
      '',
      'Five committee reports tabled 2026-04-23 cluster along the coalition pillars.',
      '',
    ].join('\n');
    const out = cleanArtifactBody(raw);
    expect(out).not.toMatch(/Run ID/i);
    expect(out).not.toMatch(/James Pether Sörling/);
    expect(out).toContain('Five committee reports tabled');
  });

  it('strips admin byline with · separators', () => {
    const raw =
      '# X\n\n**Author**: J · **Date**: 2026-04-24 · **Classification**: Public · **Confidence**: MEDIUM\n\nThe actual lede.\n';
    const out = cleanArtifactBody(raw);
    expect(out).not.toContain('Classification');
    expect(out).toContain('The actual lede.');
  });

  it('keeps a paragraph that starts with a bold label but contains real prose', () => {
    // This guards against over-aggressive stripping of legitimate bold leads.
    const raw =
      '# X\n\n**Lead story**: The Kristersson government tabled four bills on 23 April 2026.\n';
    const out = cleanArtifactBody(raw);
    expect(out).toContain('Kristersson government tabled four bills');
  });

  it('still strips the first H1, YAML front-matter, Document control, and Run ID: single-line', () => {
    const raw = [
      '---',
      'title: foo',
      '---',
      '# Old H1',
      '',
      'Body para.',
      '',
      'Run ID: 12345',
      '',
      '## Document control',
      '',
      'change-log only',
      '',
    ].join('\n');
    const out = cleanArtifactBody(raw);
    expect(out).toContain('Body para.');
    expect(out).not.toContain('Old H1');
    expect(out).not.toContain('12345');
    expect(out).not.toContain('change-log only');
  });
});

describe('render-lib — helpers', () => {
  it('stripPassTwoSection preserves content before and removes content after', () => {
    const raw = 'Before.\n\n## Pass 2 refinements\n\nAfter.\n';
    expect(stripPassTwoSection(raw).trim()).toBe('Before.');
  });

  it('stripLeadingAdminBylines walks multiple admin paragraphs', () => {
    const body = [
      '**Author**: J',
      '',
      '**Classification**: Public',
      '',
      'Real prose begins here.',
    ].join('\n');
    expect(stripLeadingAdminBylines(body)).toContain('Real prose begins here.');
    expect(stripLeadingAdminBylines(body)).not.toContain('Classification');
  });

  it('stripLeadingAdminBylines drops admin blocks anywhere in body, not just leading', () => {
    // Per-document analyses and Family C/D artifacts emit additional admin
    // preambles after `### {dok_id}` / `## Section` headings. Those must
    // be stripped too — leading-only sweep let ~393 lines leak (audit
    // 2026-04-27).
    const body = [
      'Lead paragraph of real prose.',
      '',
      '**Author**: J',
      '**Date**: 2026-04-27',
      '**Confidence**: HIGH [B2]',
      '',
      'Second prose paragraph.',
      '',
      '**Dok ID**: HD03253',
      '**Type**: Proposition',
      '**Riksmöte**: 2025/26',
      '',
      'Third prose paragraph after dok-level admin.',
    ].join('\n');
    const out = stripLeadingAdminBylines(body);
    expect(out).toContain('Lead paragraph of real prose.');
    expect(out).toContain('Second prose paragraph.');
    expect(out).toContain('Third prose paragraph after dok-level admin.');
    expect(out).not.toContain('**Author**');
    expect(out).not.toContain('**Dok ID**');
    expect(out).not.toContain('**Riksmöte**');
  });

  it('stripLeadingAdminBylines preserves mixed paragraphs (1 admin + analytical fragments)', () => {
    // Safety: a paragraph containing ANY analytical fragment must survive
    // intact, even if it also contains admin-style fragments. Otherwise
    // ACH/SWOT/risk callouts would be stripped.
    const body = [
      '**ACH Score**: H1 likely [B2] | **Evidence**: vote record HD10437',
      '',
      '**Author**: J | **Classification**: Public',
    ].join('\n');
    const out = stripLeadingAdminBylines(body);
    expect(out).toContain('**ACH Score**');
    expect(out).toContain('**Evidence**');
    expect(out).not.toContain('**Author**');
    expect(out).not.toContain('**Classification**');
  });
});

describe('render-lib — stripProcessMetaLines (per-document journalist-card preservation)', () => {
  it('strips workflow-process lines while preserving journalist-fact lines in the same paragraph', () => {
    // Per-document identification card: mixes Dok_ID/Beteckning/Title
    // (journalism facts that link readers to primary sources) with
    // Author/Date/Confidence/DIW Score (workflow audit metadata that
    // doesn't belong in published journalism).
    const body = [
      '**Dok_ID**: HD03253  ',
      '**Beteckning**: Prop. 2025/26:253  ',
      '**Title**: EU:s bankpaket — genomförande av reviderade kapitaltäckningsregler  ',
      '**Department**: Finansdepartementet  ',
      '**Committee**: FiU (Finansutskottet)  ',
      '**DIW Score**: 9/10 (CRITICAL)  ',
      '**Author**: James Pether Sörling  ',
      '**Date**: 2026-04-27  ',
      '**Confidence**: HIGH [A2]',
    ].join('\n');
    const out = stripProcessMetaLines(body);
    // Journalist facts survive
    expect(out).toContain('**Dok_ID**');
    expect(out).toContain('**Beteckning**');
    expect(out).toContain('**Title**');
    expect(out).toContain('**Department**');
    expect(out).toContain('**Committee**');
    // Workflow process metadata stripped
    expect(out).not.toContain('**Author**');
    expect(out).not.toContain('**Date**');
    expect(out).not.toContain('**Confidence**');
    expect(out).not.toContain('**DIW Score**');
  });

  it('strips Admiralty Code typo "Admiration Code" used in some artifacts', () => {
    const body = '**Admiration Code**: [B2] — Confirmed, plausible source';
    expect(stripProcessMetaLines(body)).toBe('');
  });

  it('strips ICD 203 / Standard / Self-audit cycle / Framework', () => {
    const body = [
      '**Standard**: ICD 203 — Analytic Standards and Tradecraft',
      '**Self-audit cycle**: Pass 1 → Pass 2',
      '**Framework**: 5-dimension political risk register',
      'Real prose paragraph survives.',
    ].join('\n');
    const out = stripProcessMetaLines(body);
    expect(out).toContain('Real prose paragraph survives.');
    expect(out).not.toContain('**Standard**');
    expect(out).not.toContain('**Self-audit cycle**');
    expect(out).not.toContain('**Framework**');
  });

  it('does NOT strip "Election date" (a journalism fact) but does strip bare "Election"', () => {
    expect(stripProcessMetaLines('**Election date**: 2026-09-20')).toBe('**Election date**: 2026-09-20');
    expect(stripProcessMetaLines('**Election**: Riksdag election 2026')).toBe('');
  });

  it('does NOT strip per-document journalist facts (Beteckning, Minister, Response deadline, Effective date)', () => {
    const body = [
      '**Beteckning**: Prop. 2025/26:253',
      '**Minister**: Ebba Busch (KD), Ministry of Energy',
      '**Response deadline**: 2026-05-07',
      '**Effective date**: 2026-07-01',
      '**Tabling date**: 2026-04-23',
    ].join('\n');
    const out = stripProcessMetaLines(body);
    expect(out).toBe(body);
  });

  it('does NOT strip analytical callouts (ACH Score, ALARP, Mitigation, Evidence)', () => {
    const body = [
      '**ACH Score**: H1 likely [B2]',
      '**ALARP**: MITIGATE via opposition monitoring',
      '**Mitigation**: pre-amplify Lagrådet language',
      '**Evidence**: vote record HD10437 [A1]',
    ].join('\n');
    expect(stripProcessMetaLines(body)).toBe(body);
  });
});

describe('render-lib — AGGREGATION_ORDER', () => {
  it('puts journalist-optimal narrative arc before technical and audit appendices', () => {
    const idxSynth = AGGREGATION_ORDER.indexOf('synthesis-summary.md');
    const idxKJ = AGGREGATION_ORDER.indexOf('intelligence-assessment.md');
    const idxScoring = AGGREGATION_ORDER.indexOf('significance-scoring.md');
    const idxStakeholders = AGGREGATION_ORDER.indexOf('stakeholder-perspectives.md');
    const idxStakeholderImpactAlias = AGGREGATION_ORDER.indexOf('stakeholder-impact.md');
    const idxCoalition = AGGREGATION_ORDER.indexOf('coalition-mathematics.md');
    const idxVoter = AGGREGATION_ORDER.indexOf('voter-segmentation.md');
    const idxForward = AGGREGATION_ORDER.indexOf('forward-indicators.md');
    const idxScenario = AGGREGATION_ORDER.indexOf('scenario-analysis.md');
    const idxRisk = AGGREGATION_ORDER.indexOf('risk-assessment.md');
    const idxThreat = AGGREGATION_ORDER.indexOf('threat-analysis.md');
    const idxMedia = AGGREGATION_ORDER.indexOf('media-framing-analysis.md');
    const idxDevils = AGGREGATION_ORDER.indexOf('devils-advocate.md');
    const idxClassification = AGGREGATION_ORDER.indexOf('classification-results.md');

    // Phase A — Lead & headline judgments are contiguous and ordered.
    expect(idxSynth).toBeGreaterThanOrEqual(0);
    expect(idxKJ).toBe(idxSynth + 1);
    expect(idxScoring).toBe(idxKJ + 1);

    // Phase C — Actors cluster opens immediately after the so-what
    // ranking and per-document expansion (which is injected by
    // aggregate.ts after significance-scoring, not via this array).
    expect(idxStakeholders).toBe(idxScoring + 1);
    expect(idxStakeholderImpactAlias).toBe(idxStakeholders + 1);
    expect(idxCoalition).toBe(idxStakeholderImpactAlias + 1);
    expect(idxVoter).toBe(idxCoalition + 1);

    // Phase D — Forward trajectory follows the actors cluster.
    expect(idxForward).toBeGreaterThan(idxVoter);
    expect(idxScenario).toBe(idxForward + 1);

    // Phase E — Risk register cluster sits after forward trajectory
    // and groups risk + threat together.
    expect(idxRisk).toBeGreaterThan(idxScenario);
    expect(idxThreat).toBeGreaterThan(idxRisk);

    // Phase F — Media framing comes LATE, immediately before the
    // devil's-advocate critique. This is the central correction:
    // readers form their own view of substance first, then are shown
    // how the story is being framed.
    expect(idxMedia).toBe(idxDevils - 1);
    expect(idxMedia).toBeGreaterThan(idxThreat);
    expect(idxMedia).toBeGreaterThan(idxStakeholders);
    expect(idxMedia).toBeLessThan(idxClassification);

    // Forward-trajectory + risk register precede the audit appendix.
    expect(idxForward).toBeLessThan(idxClassification);
    expect(idxKJ).toBeLessThan(idxDevils);
  });

  it('still keeps the appendix group at the very end', () => {
    const tail = AGGREGATION_ORDER.slice(-6);
    expect(tail).toEqual([
      'classification-results.md',
      'political-classification.md',
      'cross-reference-map.md',
      'horizon-pir-rollforward.md',
      'methodology-reflection.md',
      'data-download-manifest.md',
    ]);
  });
});

describe('render-lib — reader-facing HTML quality projections', () => {
  describe('demoteHeadings', () => {
    it('demotes every ATX heading by one level so artifact bodies nest under wrapper H2', () => {
      const input = [
        '## 🎯 BLUF',
        '',
        'lede paragraph',
        '',
        '### 60-second read',
        '',
        '#### Detail',
        '',
        '##### Sub-detail',
      ].join('\n');
      expect(demoteHeadings(input)).toBe(
        [
          '### 🎯 BLUF',
          '',
          'lede paragraph',
          '',
          '#### 60-second read',
          '',
          '##### Detail',
          '',
          '###### Sub-detail',
        ].join('\n'),
      );
    });

    it('caps demotion at H6 — already-deep headings are left alone', () => {
      const input = '###### Already at H6';
      expect(demoteHeadings(input)).toBe('###### Already at H6');
    });

    it('does not touch ATX-looking lines inside fenced code blocks', () => {
      const input = [
        '## Real heading',
        '',
        '```bash',
        '## not a heading inside fence',
        '### also not',
        '```',
        '',
        '### After fence — real heading',
      ].join('\n');
      const out = demoteHeadings(input);
      expect(out).toContain('### Real heading');
      // The line inside the fence is preserved verbatim.
      expect(out).toContain('## not a heading inside fence');
      expect(out).toContain('### also not');
      expect(out).toContain('#### After fence — real heading');
    });

    it('leaves H1 alone (defensive — already stripped by upstream H1 regex)', () => {
      // H1 demotion would conflict with the wrapper-H2 contract; the
      // first H1 has been stripped by cleanArtifactBody upstream.
      const input = '# Surviving H1\n\n## sub';
      const out = demoteHeadings(input);
      expect(out).toBe('# Surviving H1\n\n### sub');
    });

    it('ignores `#` characters that are not the start of an ATX heading', () => {
      const input = 'an inline mention of #hashtag and `## not a heading`';
      expect(demoteHeadings(input)).toBe(input);
    });
  });

  describe('stripSourcePreamble', () => {
    it('strips a `_Source: \\`file.md\\`_` italic preamble line at the top of an artifact body', () => {
      const input = [
        '_Source: [`executive-brief.md`](https://github.com/x/y/blob/main/executive-brief.md)_',
        '',
        '## 🎯 BLUF',
        'real content',
      ].join('\n');
      const out = stripSourcePreamble(input);
      expect(out).not.toContain('_Source:');
      expect(out).toContain('## 🎯 BLUF');
      expect(out).toContain('real content');
    });

    it('strips a bare `_Source: file.md_` italic preamble (no link)', () => {
      const input = '_Source: synthesis-summary.md_\n\nbody';
      expect(stripSourcePreamble(input)).toBe('body');
    });

    it('leaves inline `Source:` mentions inside prose untouched', () => {
      const input = 'According to the report, "Source: Riksdagen" is the canonical citation.';
      expect(stripSourcePreamble(input)).toBe(input);
    });
  });

  describe('anchorForTitle', () => {
    it('produces stable rm-prefixed slugs for ASCII titles', () => {
      expect(anchorForTitle('Executive Brief')).toBe('rm-executive-brief');
    });

    it('trims leading hyphens that github-slugger emits when a title starts with a stripped character', () => {
      // emoji 🎯 is stripped by github-slugger → leading hyphen
      // would yield `rm--bluf` without normalisation.
      expect(anchorForTitle('🎯 BLUF')).toBe('rm-bluf');
      expect(anchorForTitle('🎯 60-second read')).toBe('rm-60-second-read');
    });
  });
});

describe('render-lib — aggregateAnalysis (integration)', () => {
  it('aggregates a minimal subfolder, strips Pass-2 and admin bylines, and picks a real description', () => {
    // Build a temp subfolder that mimics analysis/daily/$DATE/$SUB/.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-test-'));
    const sub = path.join(tmp, '2099-01-01', 'widgets');
    fs.mkdirSync(sub, { recursive: true });

    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Executive Brief — Widgets 2099-01-01',
        '',
        '**Author**: Test Runner   **Run ID**: 42   **Classification**: PUBLIC   **Confidence**: HIGH',
        '',
        'Today the widget committee reported five actionable findings with direct implications for Q2.',
        '',
        '## Pass 2 refinements',
        '',
        'self-audit text that must not publish',
        '',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(sub, 'synthesis-summary.md'),
      '# Synthesis\n\nReal synthesis.\n\n## Pass 2 addendum\n\nhidden\n',
    );
    fs.writeFileSync(
      path.join(sub, 'intelligence-assessment.md'),
      '# KJ\n\nKJ-1 confidence HIGH.\n',
    );
    fs.writeFileSync(
      path.join(sub, 'data-download-manifest.md'),
      '# Manifest\n\nsources table\n',
    );

    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/widgets',
      date: '2099-01-01',
      subfolder: 'widgets',
    });

    // Title: the H1 `# Executive Brief — Widgets 2099-01-01` is scrubbed by
    // `cleanArticleTitle()` (strips `Executive Brief — ` prefix and the
    // trailing ISO date). The remainder `Widgets` is < 20 chars, so the
    // aggregator falls back to `titleFromBluf()` which synthesises a
    // headline from the first BLUF sentence — see
    // `.github/prompts/seo-metadata-contract.md` §2.
    expect(result.title).toContain('widget committee reported five');

    // Description must be the real BLUF, NOT the admin byline.
    expect(result.description).toContain('widget committee reported five actionable findings');
    expect(result.description).not.toMatch(/Classification|Run ID|Author/i);
    expect(result.keywords).toContain('Widgets');
    // Keyword ordering (per article-seo.ts `buildArticleKeywords` ordering
    // contract): institutional mandatory floor leads
    // (`Riksdagsmonitor, Swedish Parliament, Riksdag, …`), then the
    // localized article-type label (`Widgets`), then the native language
    // name. The in-memory `result.keywords` string must expose the topic
    // keyword somewhere in the comma list AND must never leak admin-byline
    // tokens — `Test Runner` (from `**Author**: Test Runner`) and
    // `Run ID` (from `**Run ID**: 42`) historically leaked because the
    // brief-extractor mined them as Title-Case multi-word named entities.
    //
    // Note: post-`2026-05-24` SEO contract no longer writes `keywords:`
    // (or `title:` / `description:`) to article.md frontmatter — those
    // values flow directly from `executive-brief.md` into the renderer.
    // We therefore assert on the in-memory `result.keywords` string only.
    expect(result.keywords).toMatch(/^Riksdagsmonitor,\s*Swedish Parliament/);
    expect(result.keywords).toMatch(/\bWidgets\b/);
    expect(result.keywords).not.toMatch(/\b(?:Test Runner|Run ID|Author|Classification|Confidence)\b/);
    expect(result.markdown).not.toMatch(/^title:/m);
    expect(result.markdown).not.toMatch(/^description:/m);
    expect(result.markdown).not.toMatch(/^keywords:/m);

    // Aggregated markdown must carry real content but no Pass-2 / no admin byline.
    expect(result.markdown).toContain('## Reader Intelligence Guide');
    expect(result.markdown).toContain('Use this guide to read the article as a political-intelligence product');
    expect(result.markdown).toContain('widget committee reported five actionable findings');
    expect(result.markdown).toContain('Real synthesis.');
    expect(result.markdown).toContain('KJ-1 confidence HIGH.');
    expect(result.markdown).not.toMatch(/Pass 2/i);
    expect(result.markdown).not.toMatch(/self-audit text/);
    expect(result.markdown).not.toMatch(/\*\*Run ID\*\*/);

    // Section order: executive brief opens the article (BLUF context for
    // the reader), then the Reader Intelligence Guide routes them into the
    // deeper lenses, then synthesis → intelligence-assessment must follow.
    const guidePos = result.markdown.indexOf('## Reader Intelligence Guide');
    const execPos = result.markdown.indexOf('## What Happened');
    const synthPos = result.markdown.indexOf('## Why It Matters');
    const kjPos = result.markdown.indexOf('## Key Findings');
    expect(execPos).toBeGreaterThan(-1);
    expect(guidePos).toBeGreaterThan(execPos);
    expect(synthPos).toBeGreaterThan(guidePos);
    expect(kjPos).toBeGreaterThan(synthPos);
  });

  it('does NOT re-embed article.md or article.<lang>.md when re-running aggregation', () => {
    // Reproduces a bug where running the aggregator a second time caused
    // the previously-written article.md to be picked up as a supplementary
    // *.md and embedded inside itself.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-test-'));
    const sub = path.join(tmp, '2099-01-01', 'widgets');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'executive-brief.md'), '# EB\n\nReal lede.\n');
    fs.writeFileSync(path.join(sub, 'article.md'), '# Leftover\n\nold content\n');
    fs.writeFileSync(path.join(sub, 'article.sv.md'), '# Gammal\n\nold swedish\n');

    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/widgets',
      date: '2099-01-01',
      subfolder: 'widgets',
    });
    expect(result.markdown).toContain('Real lede.');
    expect(result.markdown).not.toContain('old content');
    expect(result.markdown).not.toContain('old swedish');
    expect(result.artifactsUsed).not.toContain('article.md');
    expect(result.artifactsUsed).not.toContain('article.sv.md');
  });

  it('normalizes BLUF framing and adds first-use confidence/doc-id context in aggregated output', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-narrative-'));
    const sub = path.join(tmp, '2099-01-01', 'narrative');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Parliamentary update',
        '',
        '## 🎯 BLUF (Bottom Line Up Front)',
        '',
        'The coalition moved three migration measures into fast-track committee handling.',
        '',
        '## Decisions This Brief Supports',
        '',
        '- **HIGH (B2)** confidence on HD03271 passage timing.',
        '- **MEDIUM (C2)** confidence on implementation sequencing.',
      ].join('\n'),
    );
    fs.writeFileSync(path.join(sub, 'synthesis-summary.md'), '# S\n\nSynthesis body.\n');

    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/narrative',
      date: '2099-01-01',
      subfolder: 'narrative',
    });

    expect(result.markdown).toContain('### Lede');
    expect(result.markdown).toContain('### Decisions and confidence context');
    expect(result.markdown).toContain('HIGH (B2, high confidence, corroborated by multiple sources)');
    expect(result.markdown).toContain('Riksdag document #03271 (HD03271)');
    expect(result.markdown).not.toContain('BLUF (Bottom Line Up Front)');
  });

  it('Reader Guide is built from emitted artifacts — a file cleaned to empty is NOT linked', () => {
    // Regression test: reader guide must only link headings that actually
    // get emitted. Previously it was built from rootArtifactSet (files on
    // disk), so a file present on disk but trimmed to empty by
    // cleanArtifactBody() would produce a broken in-article anchor.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-guide-emitted-'));
    const sub = path.join(tmp, '2099-01-01', 'guide-emitted');
    fs.mkdirSync(sub, { recursive: true });
    // executive-brief is required; synthesis-summary is a real section
    fs.writeFileSync(path.join(sub, 'executive-brief.md'), '# EB\n\nReal lede.\n');
    fs.writeFileSync(path.join(sub, 'synthesis-summary.md'), '# Synthesis\n\nReal synthesis.\n');
    // intelligence-assessment.md contains only Pass-2 / admin content that
    // cleanArtifactBody() will strip to an empty string — it must NOT
    // appear in the Reader Guide.
    fs.writeFileSync(
      path.join(sub, 'intelligence-assessment.md'),
      '## Pass 2 internal review\n\nself-audit text only\n',
    );

    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/guide-emitted',
      date: '2099-01-01',
      subfolder: 'guide-emitted',
    });
    // synthesis-summary survived cleaning → appears in guide
    expect(result.markdown).toContain('[Why It Matters]');
    // intelligence-assessment was cleaned to empty → must NOT appear in guide
    expect(result.markdown).not.toContain('[Key Findings]');
    // The section itself is also absent from the body
    expect(result.markdown).not.toContain('## Key Findings');
  });
});

// ---------------------------------------------------------------------------
// article SEO metadata
// ---------------------------------------------------------------------------

describe('render-lib — article SEO metadata', () => {
  it('uses the brief H1 and BLUF without fixed description suffixes', () => {
    const base = {
      title: 'Security, identity and state control: three propositions',
      description: 'Three government propositions expand identity controls, population-register oversight and detention powers for security threats.',
      date: '2026-05-11',
      articleTypeLabel: 'Propositions',
      articleTypeId: 'propositions',
      canonicalPath: 'news/2026-05-11-propositions-en.html',
    };
    const en = buildArticleSeoMetadata({ ...base, lang: 'en' });
    const de = buildArticleSeoMetadata({
      ...base,
      lang: 'de',
      title: 'Sicherheit, Identität und staatliche Kontrolle: drei Vorlagen',
      description: 'Drei Regierungsvorlagen erweitern Identitätskontrollen, Aufsicht des Melderegisters und Haftbefugnisse bei Sicherheitsbedrohungen.',
      articleTypeLabel: 'Regierungsvorlagen',
      canonicalPath: 'news/2026-05-11-propositions-de.html',
    });
    // Titles retain the brief H1 within the per-language SERP budget
    // (EN hardMax 70 chars). The H1 ("Security, identity and state
    // control: three propositions" = 56 chars) plus brand suffix
    // " — Riksdagsmonitor" (18 chars) would overshoot 70, so per the
    // seo-metadata-contract.md §4 cascade the renderer ships the
    // story-only H1 — brand is already covered by `og:site_name` and
    // the canonical URL. Pre-2026-05 the renderer appended a
    // "· 2026-05-11 · en" uniqueness suffix; that was removed when
    // PR #2723 codified per-language budgets so every available pixel
    // goes to the story.
    expect(en.title).toContain('Security, identity and state');
    expect(de.title).toContain('Sicherheit, Identität');
    expect(en.title).not.toMatch(/\| .*Propositions:/);
    expect(de.title).not.toMatch(/\| .*Regierungsvorlagen:/);
    expect(en.title).not.toContain('update');
    expect(de.title).not.toContain('update');
    expect(de.title).not.toContain('Deutsch');
    // Brand suffix is conditional on budget — when the H1 overshoots
    // (H1 + " — Riksdagsmonitor" > hardMax) the renderer drops the
    // brand. Both EN and DE H1s here are >52 chars so brand is dropped.
    expect(en.title).not.toContain(' — Riksdagsmonitor');
    expect(de.title).not.toContain(' — Riksdagsmonitor');
    // Descriptions are the executive-brief BLUF only: no fixed suffix,
    // context boilerplate, or generated fallback string.
    expect(en.description).toBe(base.description);
    expect(en.description).not.toContain('Context:');
    expect(en.description).not.toContain('(en).');
    expect(de.description).not.toContain('deutsche Ausgabe');
    expect(de.description).not.toContain('Berichterstattung');
    expect(de.description).not.toContain('Riksdag/OSINT provenance');
    expect(de.description).not.toContain('Context:');
    expect(en.description).not.toBe(de.description);
    expect(en.description.length).toBeLessThanOrEqual(200);
    expect(de.description.length).toBeLessThanOrEqual(200);
    // Title budget — SERP-friendly with compact uniqueness context.
    expect(en.title.length).toBeLessThanOrEqual(70);
    // Keywords pull article-type label + native language name.
    // (Pre-2026-05 this asserted the EN `German` leak — the fix in
    // article-seo.ts § buildArticleKeywords intentionally surfaces the
    // native `Deutsch` instead and drops the EN Language-Meta `.name`
    // for non-EN locales, per seo-metadata-contract.md §4. See
    // tests/article-seo-localized-keywords.test.ts for the dedicated
    // regression suite.)
    expect(de.keywords).toContain('Regierungsvorlagen');
    expect(de.keywords).toContain('Deutsch');
    expect(de.keywords).not.toContain('German');
    // Native German core keywords must be present (the LANG_CORE_KEYWORDS
    // entry replaced the English-only CORE_KEYWORDS constant).
    expect(de.keywords).toContain('Schwedisches Parlament');
    // English frontmatter seed must NOT leak into a DE page.
    expect(de.keywords).not.toContain('Swedish Parliament');
    expect(de.keywords).not.toContain('political intelligence');
  });

  it('cleans malformed HTML fragments and falls back to the story title instead of an empty meta description', () => {
    const seo = buildArticleSeoMetadata({
      title: 'Riksdagen granskar vårbudgeten',
      description: '<div dir="rtl">',
      date: '2026-05-22',
      articleTypeLabel: 'Motioner',
      articleTypeId: 'motions',
      canonicalPath: 'news/2026-05-22-motions-sv.html',
      lang: 'sv',
    });

    // The malformed fragment strips to empty; rather than ship
    // `<meta name="description" content="">` (flagged "description
    // missing" by SEO crawlers) the builder now synthesises a non-empty,
    // story-specific description from the article H1 — never a fixed
    // boilerplate string and never the article-type label when a title
    // is present.
    expect(seo.description).not.toContain('<div');
    expect(seo.description).toBe('Riksdagen granskar vårbudgeten');
    expect(seo.description).not.toContain('Motioner');
    expect(seo.description).not.toContain('(sv).');
    expect(seo.description.length).toBeGreaterThan(0);
    expect(seo.description.length).toBeLessThanOrEqual(200);
  });

  it('keeps identical-H1 EN/DE titles identical (brand suffix when budget allows) — canonical URL disambiguates per-language pages', () => {
    // Pre-2026-05-24 the renderer appended a "· en" / "· de"
    // uniqueness suffix to avoid identical SERP titles when an
    // untranslated EN H1 was reused across languages. PR #2723
    // removed that suffix per `seo-metadata-contract.md` §4 — every
    // available SERP pixel goes to the story headline, and
    // per-language disambiguation is handled by `<link rel="canonical">`,
    // `og:url`, and `<html lang="…">` (all of which differ between
    // localized pages even when the H1 is identical).
    const base = {
      title: 'Tidö Current Mandate',
      description: 'The same untranslated fallback summary appears on more than one generated legacy HTML article page.',
      date: '2026-05-11',
      articleTypeLabel: 'Election cycle',
      articleTypeId: 'election-cycle-current',
      canonicalPath: 'news/2026-05-11-election-cycle-current-en.html',
    };

    const en = buildArticleSeoMetadata({ ...base, lang: 'en' });
    const de = buildArticleSeoMetadata({
      ...base,
      lang: 'de',
      articleTypeLabel: 'Wahlzyklus',
      canonicalPath: 'news/2026-05-11-election-cycle-current-de.html',
    });

    // Short H1 (20 chars) + brand suffix (18 chars) = 38 ≤ 70 EN hardMax
    // and ≤ 70 DE hardMax — brand is appended for both locales.
    expect(en.title).toBe('Tidö Current Mandate — Riksdagsmonitor');
    expect(de.title).toBe('Tidö Current Mandate — Riksdagsmonitor');
    // Descriptions are byte-equal because the untranslated brief was
    // re-used as the localized fallback — that's the legacy-collapse
    // case this test originally guarded against; the editorial fix
    // belongs upstream in the news-translate pipeline, not in the
    // SERP renderer.
    expect(en.description).toBe(de.description);
    expect(en.description).not.toContain('(en).');
    expect(de.description).not.toContain('(de).');
  });
});

// ---------------------------------------------------------------------------
// URL helpers + constants
// ---------------------------------------------------------------------------

describe('render-lib — constants + URL helpers', () => {
  it('exports stable BASE_URL / GITHUB_BLOB / GITHUB_TREE', () => {
    expect(BASE_URL).toBe('https://riksdagsmonitor.com');
    expect(GITHUB_BLOB).toBe('https://github.com/Hack23/riksdagsmonitor/blob/main');
    expect(GITHUB_TREE).toBe('https://github.com/Hack23/riksdagsmonitor/tree/main');
  });

  it('LANGUAGES contains all 14 supported languages with en as x-default first', () => {
    expect(LANGUAGES).toHaveLength(14);
    expect(LANGUAGES[0]).toBe('en');
    expect(LANGUAGES).toContain('sv');
    expect(LANGUAGES).toContain('ar');
    expect(LANGUAGES).toContain('he');
    expect(LANGUAGES).toContain('zh');
  });

  it('buildGithubBlobUrl strips leading slashes and joins to GITHUB_BLOB', () => {
    expect(buildGithubBlobUrl('analysis/daily/x/y.md')).toBe(
      `${GITHUB_BLOB}/analysis/daily/x/y.md`,
    );
    expect(buildGithubBlobUrl('/leading/slash.md')).toBe(
      `${GITHUB_BLOB}/leading/slash.md`,
    );
    expect(buildGithubBlobUrl('///triple/slash.md')).toBe(
      `${GITHUB_BLOB}/triple/slash.md`,
    );
  });

  it('buildGithubTreeUrl strips leading slashes and joins to GITHUB_TREE', () => {
    expect(buildGithubTreeUrl('analysis/daily/2099-01-01/widgets')).toBe(
      `${GITHUB_TREE}/analysis/daily/2099-01-01/widgets`,
    );
    expect(buildGithubTreeUrl('/leading')).toBe(`${GITHUB_TREE}/leading`);
  });
});

// ---------------------------------------------------------------------------
// titleForArtifact + prettifyFallbackTitle
// ---------------------------------------------------------------------------

describe('render-lib — titleForArtifact', () => {
  it('returns the curated title for every known canonical artifact', () => {
    const known = [
      ['executive-brief.md', 'What Happened'],
      ['synthesis-summary.md', 'Why It Matters'],
      ['intelligence-assessment.md', 'Key Findings'],
      ['risk-assessment.md', 'Risk Assessment'],
      ['devils-advocate.md', "Devil's Advocate"],
      ['data-download-manifest.md', 'Deep Dive: Data Download Manifest'],
      ['methodology-reflection.md', 'Deep Dive: Methodology & Limitations'],
    ] as const;
    for (const [file, expected] of known) {
      expect(titleForArtifact(file)).toBe(expected);
    }
  });

  it('falls back to prettified title for unknown supplementary artifacts', () => {
    // pestle-analysis.md, wildcards-blackswans.md, etc. are now curated; use truly-unknown artifacts.
    expect(titleForArtifact('budget-bill-tracker.md')).toBe('Budget Bill Tracker');
    expect(titleForArtifact('eu_presidency_pivot.md')).toBe('Eu Presidency Pivot');
    expect(titleForArtifact('ext/foo-bar.md')).toBe('Foo Bar');
    expect(prettifyFallbackTitle('a-b_c.md')).toBe('A B C');
  });

  it('handles a bare filename without path', () => {
    expect(titleForArtifact('scenario-analysis.md')).toBe('Scenario Analysis');
  });
});

// ---------------------------------------------------------------------------
// rewriteRelativeLinks
// ---------------------------------------------------------------------------

describe('render-lib — rewriteRelativeLinks', () => {
  const sub = 'analysis/daily/2099-01-01/widgets';

  it('rewrites `./foo.md` to an absolute GitHub blob URL', () => {
    const out = rewriteRelativeLinks('See [foo](./foo.md).', sub);
    expect(out).toBe(`See [foo](${GITHUB_BLOB}/${sub}/foo.md).`);
  });

  it('preserves anchor on a relative link', () => {
    const out = rewriteRelativeLinks('[x](risk-assessment.md#institutional)', sub);
    expect(out).toBe(`[x](${GITHUB_BLOB}/${sub}/risk-assessment.md#institutional)`);
  });

  it('normalises `../` path traversal', () => {
    const out = rewriteRelativeLinks('[up](../shared/notes.md)', sub);
    expect(out).toBe(
      `[up](${GITHUB_BLOB}/analysis/daily/2099-01-01/shared/notes.md)`,
    );
  });

  it('leaves absolute http/https URLs untouched', () => {
    expect(rewriteRelativeLinks('[x](https://example.com/a)', sub)).toBe(
      '[x](https://example.com/a)',
    );
    expect(rewriteRelativeLinks('[y](http://example.org)', sub)).toBe(
      '[y](http://example.org)',
    );
  });

  it('leaves pure anchor links untouched', () => {
    expect(rewriteRelativeLinks('[top](#heading)', sub)).toBe('[top](#heading)');
  });

  it('leaves mailto: links untouched', () => {
    expect(rewriteRelativeLinks('[c](mailto:x@y.z)', sub)).toBe('[c](mailto:x@y.z)');
  });
});

// ---------------------------------------------------------------------------
// readFirstHeading + readFirstParagraph
// ---------------------------------------------------------------------------

describe('render-lib — readFirstHeading / readFirstParagraph', () => {
  it('reads the first H1 verbatim from markdown', () => {
    expect(readFirstHeading('# Title\n\nbody\n')).toBe('Title');
    expect(readFirstHeading('## Not H1\n\n# Real\n')).toBe('Real');
    expect(readFirstHeading('no heading here')).toBeNull();
  });

  it('readFirstParagraph skips H1, admin bylines, tables, code fences, blockquotes', () => {
    const md = [
      '# Title',
      '',
      '**Author**: J · **Classification**: Public',
      '',
      '> block quote',
      '',
      '| a | b |',
      '| - | - |',
      '',
      '```',
      'code',
      '```',
      '',
      'The real lede paragraph.',
    ].join('\n');
    expect(readFirstParagraph(md)).toContain('real lede paragraph');
  });

  it('readFirstParagraph returns prose without truncation (truncation is delegated to truncateToSentenceBoundary)', () => {
    // Long single-paragraph bodies pass through untouched; the aggregator
    // calls `truncateToSentenceBoundary()` separately per
    // `seo-metadata-contract.md` §3.1.
    const long = '# T\n\n' + 'a'.repeat(500);
    expect(readFirstParagraph(long)!.length).toBe(500);
  });

  it('readFirstParagraph converts inline markdown links to plain text for article metadata', () => {
    expect(readFirstParagraph('# T\n\nA [HD10447](https://data.riksdagen.se/dokument/HD10447.html) filing with `A2` evidence.')!)
      .toBe('A HD10447 filing with A2 evidence.');
  });

  it('returns null when markdown has no suitable paragraph', () => {
    expect(readFirstParagraph('# T\n\n## Only headings\n')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// escape helpers
// ---------------------------------------------------------------------------

describe('render-lib — escape helpers', () => {
  it('escapeYaml escapes quotes, backslashes, and newlines', () => {
    expect(escapeYaml('a "quoted" b')).toBe('a \\"quoted\\" b');
    expect(escapeYaml('c\\d')).toBe('c\\\\d');
    expect(escapeYaml('line1\nline2')).toBe('line1 line2');
  });

  it('escapeInlineMd escapes every markdown metachar', () => {
    const out = escapeInlineMd('HD01CU25.ext');
    // Period must be escaped, alphanumerics preserved.
    expect(out).toBe('HD01CU25\\.ext');
    expect(escapeInlineMd('[x](y)')).toBe('\\[x\\]\\(y\\)');
    expect(escapeInlineMd('a*b_c')).toBe('a\\*b\\_c');
  });
});

// ---------------------------------------------------------------------------
// renderMarkdownToHtml
// ---------------------------------------------------------------------------

describe('render-lib — renderMarkdownToHtml', () => {
  it('renders GFM tables to <table>', async () => {
    const html = await renderMarkdownToHtml('| a | b |\n| - | - |\n| 1 | 2 |\n');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('preserves ```mermaid fences as <pre class="mermaid"> blocks verbatim', async () => {
    const md = '```mermaid\nflowchart LR\nA --> B\n```\n';
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('<pre class="mermaid"');
    expect(html).toContain('flowchart LR');
    // Mermaid body must be preserved with an intact arrow so the
    // client-side mermaid loader (`js/lib/mermaid-init.mjs`) can parse
    // it; HTML-escaping would break the diagram.
    expect(html).toMatch(/A --&gt; B|A --&#x3E; B|A --> B/);
  });

  it('adds id + anchor link to every heading (rehype-slug + autolink-headings)', async () => {
    const html = await renderMarkdownToHtml('## Hello World\n');
    // rehype-sanitize prefixes heading ids with `rm-` to avoid
    // ID collisions across embedded content (DOM-clobbering mitigation).
    expect(html).toMatch(/<h2 id="rm-hello-world">/);
    // Autolink-headings appends an <a> pointing at the slugged anchor (also prefixed).
    expect(html).toContain('href="#rm-hello-world"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('sanitises <script> tags out of the rendered HTML', async () => {
    const html = await renderMarkdownToHtml(
      'safe <script>alert(1)</script> end\n',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
    expect(html).toContain('safe');
    expect(html).toContain('end');
  });

  it('sanitises javascript: URLs out of links', async () => {
    const html = await renderMarkdownToHtml('[click](javascript:alert(1))\n');
    expect(html).not.toContain('javascript:');
  });

  it('sanitises <iframe> injections', async () => {
    const html = await renderMarkdownToHtml(
      'before\n\n<iframe src="evil"></iframe>\n\nafter\n',
    );
    expect(html).not.toContain('<iframe');
  });

  it('produces unique heading IDs even when an emoji-prefixed heading shares a base slug with a plain heading (HTMLHint id-unique guard)', async () => {
    // Reproduces the html-validation CI failure: `### 📜 Sources` and
    // a later `### Sources` were both slugged to `rm-sources`. The
    // pre-clean step in `rehypeSlugWithPrefix` must keep the slugger's
    // duplicate-suffix state consistent so the second heading gets
    // `rm-sources-1`.
    const md = [
      '## Section A',
      '',
      '### 📜 Sources',
      '',
      'first',
      '',
      '## Section B',
      '',
      '### Sources',
      '',
      'second',
      '',
    ].join('\n');
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('id="rm-sources"');
    expect(html).toContain('id="rm-sources-1"');
    // Negative: no double-dash slugs may leak through.
    expect(html).not.toMatch(/id="rm--/);
  });

  it('produces unique heading IDs across an emoji-prefixed and non-prefixed heading with mixed casing (defensive)', async () => {
    const md = '### 🔒 Confidence Profile\n\nfoo\n\n### Confidence Profile\n\nbar\n';
    const html = await renderMarkdownToHtml(md);
    expect(html).toContain('id="rm-confidence-profile"');
    expect(html).toContain('id="rm-confidence-profile-1"');
  });
});

// ---------------------------------------------------------------------------
// renderChromeHead + buildChrome
// ---------------------------------------------------------------------------

describe('render-lib — renderChromeHead', () => {
  it('emits <title>, description, canonical, and hreflang × every supplied locale', () => {
    const alternates: Record<string, string> = {};
    for (const l of LANGUAGES) alternates[l] = `news/x-${l}.html`;
    const head = renderChromeHead({
      lang: 'en',
      title: 'Propositions',
      description: 'Real BLUF.',
      canonicalPath: 'news/x-en.html',
      hreflangAlternates: alternates as unknown as Record<(typeof LANGUAGES)[number], string>,
    });
    expect(head).toContain('<!DOCTYPE html>');
    expect(head).toContain('<title>Propositions — Riksdagsmonitor</title>');
    expect(head).toContain('name="description" content="Real BLUF."');
    expect(head).toContain(`rel="canonical" href="${BASE_URL}/news/x-en.html"`);
    expect(head).toContain('rel="alternate" hreflang="en"');
    expect(head).toContain('rel="alternate" hreflang="sv"');
    expect(head).toContain('rel="alternate" hreflang="x-default"');
  });

  it('sets dir="rtl" for Arabic', () => {
    const head = renderChromeHead({
      lang: 'ar',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-ar.html',
    });
    expect(head).toMatch(/<html lang="ar" dir="rtl">/);
  });

  it('sets dir="ltr" for English', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(head).toMatch(/<html lang="en" dir="ltr">/);
  });

  it('embeds provided JSON-LD blobs into <head>', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x.html',
      jsonLd: [{ '@type': 'NewsArticle', headline: 'Hi' }],
    });
    expect(head).toContain('<script type="application/ld+json">');
    expect(head).toContain('"@type":"NewsArticle"');
    expect(head).toContain('"headline":"Hi"');
  });

  it('HTML-escapes title and description', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'A <bad> "title"',
      description: 'with <evil> &ampersand',
      canonicalPath: 'news/x.html',
    });
    expect(head).not.toContain('<bad>');
    expect(head).toContain('&lt;bad&gt;');
    expect(head).toContain('&quot;title&quot;');
  });
});

describe('render-lib — buildChrome', () => {
  it('emits skip-link, site header, nav, and footer', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x.html',
    });
    expect(chrome.headerHtml).toContain('class="skip-link"');
    expect(chrome.headerHtml).toContain('class="rm-site-header"');
    expect(chrome.headerHtml).toContain('class="rm-site-nav"');
    expect(chrome.headerHtml).toContain('class="rm-lang-switcher"');
    expect(chrome.footerHtml).toContain('class="rm-site-footer"');
    expect(chrome.footerHtml).toContain('Apache-2.0');
    expect(chrome.footerHtml).toContain('GDPR');
  });

  it('language switcher lists every language EXCEPT the current one', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // Should include sv, da, no, …  (13 others)
    expect(chrome.headerHtml).toMatch(/lang="sv"/);
    expect(chrome.headerHtml).toMatch(/lang="ar"/);
    // Current language link should NOT be in the dropdown (it is in the summary).
    // Scope the split to the dropdown's own container so the always-visible
    // horizontal `.rm-lang-bar` row that follows the header is not included.
    const dropdownStart = chrome.headerHtml.indexOf('rm-lang-switcher-dropdown');
    const dropdownEnd = chrome.headerHtml.indexOf('</details>', dropdownStart);
    expect(dropdownStart).toBeGreaterThanOrEqual(0);
    expect(dropdownEnd).toBeGreaterThanOrEqual(0);
    expect(dropdownEnd).toBeGreaterThan(dropdownStart);
    const dropdown = chrome.headerHtml.slice(dropdownStart, dropdownEnd);
    expect(dropdown).not.toMatch(/>\s*English\s*</);
  });

  it('appends bodyClass to the <body> class list', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/index.html',
      bodyClass: 'news-page',
    });
    // Always retains the base `rm-article-body` class …
    expect(chrome.headerHtml).toMatch(/<body class="rm-article-body news-page">/);
  });

  it('omits bodyClass when not supplied (only base class on <body>)', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/index.html',
    });
    expect(chrome.headerHtml).toMatch(/<body class="rm-article-body">/);
    expect(chrome.headerHtml).not.toMatch(/<body class="rm-article-body /);
  });

  it('renders the always-visible horizontal language bar by default', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(chrome.headerHtml).toMatch(/<nav class="language-switcher rm-lang-bar"/);
    // Current language is rendered as a non-interactive <span> with
    // aria-current="page" rather than an `<a href="#">`.
    expect(chrome.headerHtml).toMatch(/<span class="lang-link active"[^>]*aria-current="page"/);
  });

  it('suppresses the horizontal language bar when languageBar is false', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
      languageBar: false,
    });
    expect(chrome.headerHtml).not.toMatch(/rm-lang-bar/);
    // The compact <details> dropdown is still rendered — only the
    // horizontal row is gated by `languageBar`.
    expect(chrome.headerHtml).toMatch(/rm-lang-switcher-dropdown/);
  });

  it('renders the hero banner immediately after the site header by default', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // Banner appears after </header> and before any <main>, with the
    // canonical decorative image and width/height attributes for CLS.
    expect(chrome.headerHtml).toMatch(/<\/header>[\s\S]*<div class="hero-banner"/);
    expect(chrome.headerHtml).toContain('hero-banner-bg');
    expect(chrome.headerHtml).toContain('riksdagsmonitor-banner.webp');
    expect(chrome.headerHtml).toContain('riksdagsmonitor-banner-1536w.avif');
    expect(chrome.headerHtml).toContain('<picture class="hero-banner-picture">');
    expect(chrome.headerHtml).toMatch(/width="1536"/);
    expect(chrome.headerHtml).toMatch(/height="1024"/);
    // alt is empty (decorative); aria-hidden suppresses for screen-readers.
    expect(chrome.headerHtml).toMatch(/<img src="[^"]*riksdagsmonitor-banner\.webp" alt="" class="hero-banner-bg"/);
  });

  it('uses the depth-aware prefix for the hero banner image src', () => {
    const nested = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/2026-04-29-realtime-pulse-en.html',
    });
    // News articles live at /news/* → prefix is `../`.
    expect(nested.headerHtml).toMatch(/srcset="\.\.\/images\/riksdagsmonitor-banner-480w\.avif 480w/);
    expect(nested.headerHtml).toMatch(/<img src="\.\.\/images\/riksdagsmonitor-banner\.webp"/);
  });

  it('suppresses the hero banner when heroBanner is false', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
      heroBanner: false,
    });
    expect(chrome.headerHtml).not.toContain('hero-banner');
    expect(chrome.headerHtml).not.toContain('riksdagsmonitor-banner.webp');
  });

  it('computes the depth-prefix ../ correctly for nested canonical paths', () => {
    const shallow = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'index.html',
    });
    const nested = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'a/b/c/deep.html',
    });
    // Shallow path has no `../` prefix on internal asset references.
    expect(shallow.headerHtml).toContain('href="index.html"');
    // Nested path should prefix its homepage links with `../../../`.
    expect(nested.headerHtml).toMatch(/href="\.\.\/\.\.\/\.\.\/index\.html"/);
  });

  it('renders a tagline under the logo on wider viewports', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(chrome.headerHtml).toContain('class="rm-logo-brand"');
    expect(chrome.headerHtml).toContain('class="rm-logo-tagline"');
    expect(chrome.headerHtml).toMatch(/Swedish parliamentary intelligence/);
  });

  it('renders a breadcrumb row in the sub-navigation and a published-date indicator', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Executive Brief — Propositions 2026-04-24',
      description: 'd',
      canonicalPath: 'news/2026-04-24-propositions-en.html',
      publishedIso: '2026-04-24T00:00:00Z',
    });
    expect(chrome.headerHtml).toContain('class="rm-site-subnav"');
    expect(chrome.headerHtml).toContain('class="rm-breadcrumb"');
    expect(chrome.headerHtml).toMatch(/aria-current="page">Executive Brief — Propositions 2026-04-24</);
    expect(chrome.headerHtml).toContain('class="rm-article-published"');
    expect(chrome.headerHtml).toContain('datetime="2026-04-24T00:00:00Z"');
  });

  it('renders a 3-column footer with brand, navigate and trust sections plus RSS link', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // 3 columns
    expect(chrome.footerHtml).toContain('class="rm-footer-col rm-footer-brand"');
    expect(chrome.footerHtml).toContain('class="rm-footer-col rm-footer-navigate"');
    expect(chrome.footerHtml).toContain('class="rm-footer-col rm-footer-trust"');
    // Trust links
    expect(chrome.footerHtml).toMatch(/SECURITY\.md/);
    expect(chrome.footerHtml).toMatch(/CRA-ASSESSMENT\.md/);
    expect(chrome.footerHtml).toMatch(/THREAT_MODEL\.md/);
    expect(chrome.footerHtml).toMatch(/TRANSLATION_GUIDE\.md/);
    expect(chrome.footerHtml).toMatch(/CONTRIBUTING\.md/);
    expect(chrome.footerHtml).toMatch(/ISMS-PUBLIC/);
    // RSS feed
    expect(chrome.footerHtml).toContain('rss.xml');
    expect(chrome.footerHtml).toContain('type="application/rss+xml"');
    // Last-updated indicator
    expect(chrome.footerHtml).toContain('class="rm-footer-updated"');
    expect(chrome.footerHtml).toMatch(/<time datetime="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
  });

  it('uses a language-specific RSS feed for non-English articles', () => {
    const sv = buildChrome({
      lang: 'sv', title: 'T', description: 'd',
      canonicalPath: 'news/x-sv.html',
    });
    expect(sv.footerHtml).toContain('rss_sv.xml');
  });

  it('renders a secondary always-visible language row in the footer', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(chrome.footerHtml).toContain('class="rm-footer-langs"');
    expect(chrome.footerHtml).toContain('aria-label="Switch language"');
    // 13 other languages in the footer switcher (all except current)
    const langAttrs = (chrome.footerHtml.match(/class="rm-footer-langs"[\s\S]*?<\/nav>/)?.[0] ?? '')
      .match(/lang="[a-zA-Z-]+"/g) ?? [];
    expect(langAttrs).toHaveLength(13);
  });

  it('emits a header dark/light theme toggle button (id="theme-toggle")', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // Button lives inside the rm-site-header, not the footer.
    expect(chrome.headerHtml).toContain('id="theme-toggle"');
    expect(chrome.headerHtml).toContain('class="rm-theme-toggle"');
    // Accessibility metadata required by js/theme-toggle.js for label sync.
    expect(chrome.headerHtml).toMatch(/aria-pressed="false"/);
    expect(chrome.headerHtml).toMatch(/data-label-dark="[^"]+"/);
    expect(chrome.headerHtml).toMatch(/data-label-light="[^"]+"/);
  });

  it('emits the anti-flash theme bootstrap inline script in <head>', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    expect(head).toContain("'riksdagsmonitor-theme'");
    expect(head).toContain("document.documentElement.setAttribute('data-theme'");
  });

  it('bootstraps mermaid + back-to-top + theme-toggle via inline DOM injection (Vite-bypass)', () => {
    const chrome = buildChrome({
      lang: 'en', title: 'T', description: 'd',
      canonicalPath: 'news/x-en.html',
    });
    // Footer must NOT contain a <script type="module" src="…mermaid…"> tag —
    // that pattern is what Vite tries to bundle/hash and 404s on.
    expect(chrome.footerHtml).not.toMatch(/<script\s+type="module"\s+src="[^"]*mermaid-init\.mjs"/);
    // Instead, the footer injects the loader at runtime via an inline
    // imperative bootstrapper, so Vite's HTML transformer leaves it alone.
    expect(chrome.footerHtml).toContain("'/js/lib/mermaid-init.mjs'");
    expect(chrome.footerHtml).toContain("'/js/back-to-top.js'");
    expect(chrome.footerHtml).toContain("'/js/theme-toggle.js'");
  });

  it('renders a custom breadcrumb when `breadcrumb` is supplied (skips the legacy 3-tier default)', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Sitemap',
      description: 'd',
      canonicalPath: 'sitemap.html',
      breadcrumb: [
        { label: 'Home', href: 'index.html' },
        { label: 'Sitemap' },
      ],
    });
    // Last item has aria-current and no <a>
    expect(chrome.headerHtml).toMatch(/<li aria-current="page">Sitemap<\/li>/);
    // Penultimate item is a link
    expect(chrome.headerHtml).toMatch(/<li><a href="index\.html">Home<\/a><\/li>/);
    // Legacy "Political Intelligence" middle node must NOT be present in the breadcrumb
    const breadcrumbBlock =
      chrome.headerHtml.match(/<nav class="rm-breadcrumb"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(breadcrumbBlock).not.toMatch(/Political Intelligence/);
  });

  it('uses `defaultAlternateBase` for the lang-switcher fallback hrefs', () => {
    const chrome = buildChrome({
      lang: 'en',
      title: 'Sitemap',
      description: 'd',
      canonicalPath: 'sitemap.html',
      defaultAlternateBase: 'sitemap.html',
    });
    // SV alternate should fall back to sitemap_sv.html, not index_sv.html
    expect(chrome.headerHtml).toContain('href="sitemap_sv.html"');
    expect(chrome.footerHtml).toContain('href="sitemap_sv.html"');
    // No accidental fallback to the default index_sv.html in the lang switcher
    const dropdown = chrome.headerHtml.split('rm-lang-switcher-dropdown')[1] ?? '';
    expect(dropdown).not.toContain('href="index_sv.html"');
  });
});

describe('render-lib — renderChromeHead `ogType`', () => {
  it('defaults to og:type="article" and emits the article:* meta block', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'news/x.html',
    });
    expect(head).toContain('property="og:type" content="article"');
    expect(head).toContain('property="article:publisher"');
    expect(head).toContain('property="article:section"');
    expect(head).toContain('property="article:modified_time"');
    expect(head).toContain('property="article:published_time"');
  });

  it('switches to og:type="website" and suppresses the article:* meta block when `ogType: "website"`', () => {
    const head = renderChromeHead({
      lang: 'en',
      title: 'T',
      description: 'd',
      canonicalPath: 'sitemap.html',
      ogType: 'website',
    });
    expect(head).toContain('property="og:type" content="website"');
    expect(head).not.toContain('property="article:publisher"');
    expect(head).not.toContain('property="article:section"');
    expect(head).not.toContain('property="article:modified_time"');
    expect(head).not.toContain('property="article:published_time"');
  });
});

// ---------------------------------------------------------------------------
// renderArticleHtml — end-to-end
// ---------------------------------------------------------------------------

describe('render-lib — renderArticleHtml (end-to-end)', () => {
  const articleMd = [
    '---',
    'title: "Propositions 2099-01-01"',
    'description: "Real BLUF for propositions."',
    'date: 2099-01-01',
    'slug: 2099-01-01-propositions',
    '---',
    '',
    '## Executive Brief',
    '',
    'The lede paragraph with [a link](https://example.com).',
    '',
    '## Risk Assessment',
    '',
    'Risk body.',
    '',
  ].join('\n');

  it('produces a complete chrome-wrapped article with rm-article wrapper + sources block', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
    });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    // The wrapper always carries `rm-article` + the `rm-article-type-<id>`
    // class. A two-section article (Executive Brief + Risk Assessment)
    // clears the ≥2-heading TOC threshold (see article-scannability.test.ts),
    // so the wrapper also gains the `rm-article--with-toc` modifier. Match
    // the type class while tolerating that optional, intended modifier
    // instead of pinning the closing quote directly after the type slug.
    expect(html).toMatch(
      /<article class="rm-article rm-article-type-propositions( rm-article--with-toc)?"/,
    );
    expect(html).toContain('data-article-type="propositions"');
    expect(html).toContain('<p class="rm-article-eyebrow"><span class="rm-icon" aria-hidden="true">📜</span> Propositions</p>');
    expect(html).toContain('<h1>Propositions 2099-01-01</h1>');
    expect(html).toContain('<p class="rm-article-dek">Real BLUF for propositions.</p>');
    // Keywords meta follows the `buildArticleKeywords` ordering contract:
    // mandatory institutional floor leads (`Riksdagsmonitor, Swedish
    // Parliament, …`), then the localized article-type label
    // (`Propositions`), then the native language name. Assert the
    // *content* attribute carries the topic anchor in the comma list,
    // not that it leads the list — the floor's lead position was added
    // for SERP signal stability across all 14 locales.
    expect(html).toMatch(/<meta name="keywords" content="Riksdagsmonitor,\s*Swedish Parliament/);
    expect(html).toMatch(/<meta name="keywords" content="[^"]*\bPropositions\b/);
    expect(html).toContain('Traceable artifacts');
    expect(html).toContain('class="rm-article-sources"');
    expect(html).toContain('executive-brief.md');
    expect(html).toContain('risk-assessment.md');
    // New card-based sources: icon + i18n title + filename
    expect(html).toContain('class="rm-source-card"');
    expect(html).toContain('rm-source-card-icon');
    expect(html).toContain('rm-source-card-title');
    expect(html).toContain('Executive Brief'); // i18n title
    expect(html).toContain('Risk Assessment'); // i18n title
    expect(html).toContain('📊'); // executive-brief icon
    expect(html).toContain('⚠️'); // risk-assessment icon
    // Sources link must resolve to GitHub blob.
    expect(html).toContain(
      `${GITHUB_BLOB}/analysis/daily/2099-01-01/propositions/executive-brief.md`,
    );
    // JSON-LD NewsArticle with isBasedOn entries.
    expect(html).toContain('"@type":"NewsArticle"');
    expect(html).toContain('"isBasedOn"');
    // Body preserves real content.
    expect(html).toContain('The lede paragraph');
    // Reader Intelligence Guide section.
    expect(html).toContain('class="rm-reader-guide"');
    expect(html).toContain('Reader Intelligence Guide');
    expect(html).toContain('OSINT tradecraft');
    expect(html).toContain('AI-FIRST dual-pass review');
    expect(html).toContain('SWOT');
    expect(html).toContain('Fully traceable artifacts');
    expect(html).toContain('political-intelligence.html');
  });

  it('strips <script> injected via aggregated markdown source', async () => {
    const evil = [
      '---',
      'title: "Evil"',
      'description: "x"',
      'date: 2099-01-01',
      '---',
      '',
      '## EB',
      '',
      '<script>alert("xss")</script>',
      '',
      'visible text',
    ].join('\n');
    const html = await renderArticleHtml({
      markdown: evil,
      lang: 'en',
      canonicalPath: 'news/x.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/evil',
      artifactsUsed: [],
    });
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain('visible text');
  });

  it('respects hreflang alternates when provided', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      hreflangAlternates: {
        en: 'news/2099-01-01-propositions-en.html',
        sv: 'news/2099-01-01-propositions-sv.html',
      },
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md'],
    });
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="sv"');
    expect(html).toContain('hreflang="x-default"');
  });

  it('renders Reader Intelligence Guide in Swedish for lang=sv', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'sv',
      canonicalPath: 'news/2099-01-01-propositions-sv.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md'],
    });
    expect(html).toContain('Läsarens underrättelseguide');
    expect(html).toContain('OSINT-metodik');
    expect(html).toContain('political-intelligence_sv.html');
    // Swedish i18n title in source card
    expect(html).toContain('Chefsbriefing'); // sv title for executive-brief.md
  });

  it('rewrites embedded HTML .md links to canonical GitHub blob URLs', async () => {
    const md = [
      '---',
      'title: "Breaking 2099-01-01"',
      'description: "Link rewrite check."',
      'date: 2099-01-01',
      '---',
      '',
      '## Executive Brief',
      '',
      'See <a href="../analysis/daily/2099-01-01/propositions/risk-assessment.md#r1">risk</a> and',
      '<a href="https://raw.githubusercontent.com/Hack23/riksdagsmonitor/main/analysis/daily/2099-01-01/propositions/scenario-analysis.md">scenario</a>.',
      '',
      '## Risk Assessment',
      '',
      'Body.',
      '',
    ].join('\n');

    const html = await renderArticleHtml({
      markdown: md,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-breaking-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md'],
    });

    expect(html).toContain(
      `${GITHUB_BLOB}/analysis/daily/2099-01-01/propositions/risk-assessment.md#r1`,
    );
    expect(html).toContain(
      `${GITHUB_BLOB}/analysis/daily/2099-01-01/propositions/scenario-analysis.md`,
    );
    expect(html).not.toContain('../analysis/daily/2099-01-01/propositions/risk-assessment.md');
    expect(html).not.toContain('raw.githubusercontent.com/Hack23/riksdagsmonitor/main');
  });
});

// ---------------------------------------------------------------------------
// aggregateAnalysis — edge cases
// ---------------------------------------------------------------------------

describe('render-lib — aggregateAnalysis edge cases', () => {
  it('throws a helpful error when executive-brief.md is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-edge-'));
    const sub = path.join(tmp, '2099-01-01', 'empty');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'risk-assessment.md'), '# R\n\nbody\n');
    expect(() =>
      aggregateAnalysis({
        subfolderAbsPath: sub,
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/empty',
        date: '2099-01-01',
        subfolder: 'empty',
      }),
    ).toThrow(/executive-brief\.md/i);
  });

  it('throws when subfolder does not exist at all', () => {
    expect(() =>
      aggregateAnalysis({
        subfolderAbsPath: '/nonexistent/path/xyz-123',
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/ghost',
        date: '2099-01-01',
        subfolder: 'ghost',
      }),
    ).toThrow(/not found/i);
  });

  it('expands documents/*.md inline as "Per-document intelligence" subsections', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-edge-'));
    const sub = path.join(tmp, '2099-01-01', 'with-docs');
    const docs = path.join(sub, 'documents');
    fs.mkdirSync(docs, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      '# EB\n\nLede.\n',
    );
    fs.writeFileSync(path.join(docs, 'HD01FOO-analysis.md'), '# Foo\n\nFoo body.\n');
    fs.writeFileSync(path.join(docs, 'HD01BAR-analysis.md'), '# Bar\n\nBar body.\n');
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/with-docs',
      date: '2099-01-01',
      subfolder: 'with-docs',
    });
    expect(result.markdown).toContain('## Per-document intelligence');
    // dok_id is emitted as an H3 with escaped markdown metacharacters; since
    // HD01FOO has no metachars the heading appears verbatim.
    expect(result.markdown).toContain('### HD01BAR');
    expect(result.markdown).toContain('### HD01FOO');
    expect(result.markdown).toContain('Foo body.');
    expect(result.markdown).toContain('Bar body.');
    expect(result.artifactsUsed).toContain('documents/HD01FOO-analysis.md');
    expect(result.artifactsUsed).toContain('documents/HD01BAR-analysis.md');
  });

  it('classifies a sibling that exists on disk + alias-suppressed as alias-de-duped (not present-but-empty) in the coverage report', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-alias-'));
    const sub = path.join(tmp, '2099-01-01', 'alias-dedup');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'executive-brief.md'), '# EB\n\nLede.\n');
    // Both alias members present + non-empty: stakeholder-perspectives.md
    // appears first in AGGREGATION_ORDER and wins; stakeholder-impact.md
    // is alias-suppressed at selection time and MUST be reported as
    // alias-de-duped, not as present-but-empty (which is the
    // cleanArtifactBody bucket).
    fs.writeFileSync(
      path.join(sub, 'stakeholder-perspectives.md'),
      '# SP\n\nStakeholder perspectives body.\n',
    );
    fs.writeFileSync(
      path.join(sub, 'stakeholder-impact.md'),
      '# SI\n\nStakeholder impact body.\n',
    );
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/alias-dedup',
      date: '2099-01-01',
      subfolder: 'alias-dedup',
    });
    expect(result.markdown).toContain('Alias-de-duped canonical artifacts');
    expect(result.markdown).toContain('`stakeholder-impact.md`');
  });

  it('appends unknown supplementary *.md after the core order alphabetically', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-render-edge-'));
    const sub = path.join(tmp, '2099-01-01', 'supp');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, 'executive-brief.md'), '# EB\n\nLede.\n');
    fs.writeFileSync(path.join(sub, 'zebra-appendix.md'), '# Z\n\nzebra content.\n');
    fs.writeFileSync(path.join(sub, 'pestle-analysis.md'), '# P\n\npestle content.\n');
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/supp',
      date: '2099-01-01',
      subfolder: 'supp',
    });
    // Both unknown artifacts appear.
    expect(result.markdown).toContain('pestle content');
    expect(result.markdown).toContain('zebra content');
    // Pestle before Zebra (alphabetical).
    expect(result.markdown.indexOf('pestle content')).toBeLessThan(
      result.markdown.indexOf('zebra content'),
    );
  });
});

// ---------------------------------------------------------------------------
// SEO metadata contract forward-fix — see
// `.github/prompts/seo-metadata-contract.md` and the plan in PR #1981.
// ---------------------------------------------------------------------------

const {
  readBlufParagraph,
  truncateToSentenceBoundary,
  cleanArticleTitle,
  titleFromBluf,
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
} = __test__;

describe('render-lib — ADMIN_FIELD_RE (SEO contract §3a)', () => {
  it('matches the legacy admin fields', () => {
    for (const f of [
      '**Author**: X',
      '**Run ID**: 42',
      '**Date**: 2026-04-24',
      '**Classification**: PUBLIC',
      '**Confidence**: HIGH',
      '**Scope**: all',
      '**Admiralty range**: A1-F6',
      '**Read time**: 5m',
      '**Version**: 1',
      '**Status**: draft',
      '**Owner**: CEO',
      '**Last Updated**: 2026-04-24',
      '**Generated**: today',
    ]) {
      expect(ADMIN_FIELD_RE.test(f)).toBe(true);
    }
  });

  it('matches the new contract fields that previously leaked into descriptions', () => {
    for (const f of [
      '**Brief ID**: EB-2026-04-22-EVE001',
      '**Prepared by**: James Pether Sörling',
      '**Prepared at**: 2026-04-22 23:50 UTC',
      '**Analyst**: James Pether Sörling',
      '**Distribution**: Open',
      '**Methodology**: ai-driven-analysis-guide.md',
      '**Cycle**: Realtime-2338',
      '**Admiralty baseline**: [A2]',
      '**60-second read**: ✅',
      '**60 second read**: ✅',
      '**Reviewed by**: Editorial',
      '**Reviewer**: Editorial',
      '**Disseminated**: 2026-04-23',
      '**Source**: Riksdagen',
      '**Dissemination**: TLP:WHITE',
    ]) {
      expect(ADMIN_FIELD_RE.test(f)).toBe(true);
    }
  });

  it('matches preamble-leak fields observed 2026-04-27 (Analysis period / Pass 2 / AI-FIRST iterations / ARTICLE_TYPE)', () => {
    for (const f of [
      '**Analysis period**: 2026-04-23 (most recent parliamentary day)',
      '**Pass 2**: 2026-04-27T06:38Z — Improved economic provenance',
      '**AI-FIRST iterations**: 2',
      '**AI-FIRST iterations**: 2 (pass 1 + pass 2 improvement)',
      '**ARTICLE_TYPE**: month-ahead',
      '**Article type**: propositions',
      '**Article period**: 2026-04-23',
      '**Period**: 2026-04-20 → 2026-04-26',
      '**Window**: April 20–26, 2026',
      '**Coverage window**: 30-day rolling',
      '**Analysis date**: 2026-04-20',
      '**Horizon**: 14 days',
      '**Method**: Morphological scenario construction',
      '**Focus**: HD10437 (frs 2025/26:437) in EU comparative context',
      '**Workflow**: `news-interpellations`',
      '**Purpose**: Document the analytic pipeline',
      '**Run started**: 2026-04-27T06:00Z',
      // Round 3 — per-document / per-artifact preamble labels
      '**F3EAD Stage**: Exploit',
      '**Framework**: Political SWOT v3.4',
      '**Party**: M (initiated)',
      '**Dok ID**: HD03253',
      '**Dok-ID**: HD03253',
      '**Dok_ID**: HD03253',
      '**Document ID**: HD03253',
      '**Document**: HD03253',
      '**Organ**: FiU',
      '**Subject**: Banking',
      '**Type**: Proposition',
      '**Committee**: FiU',
      '**Comparator set**: Sweden vs DE/FR',
      '**Election date**: 2026-09-20',
      '**SCN-ID**: SCN-2026-04-27-001',
      '**RSK-ID**: RSK-2026-04-27-001',
      '**THR-ID**: THR-2026-04-27-001',
      // Round 4 — extra family A/C/D preamble labels
      '**Riksmöte**: 2025/26',
      '**DIW Score**: 7/10 (HIGH)',
      '**Confidence distribution**: 2× HIGH, 3× MEDIUM, 1× LOW',
      '**Confidence floor**: B2',
      '**Overall Threat Level**: MEDIUM',
      '**Overall Risk Level**: HIGH',
      '**PIRs**: PIR-1, PIR-2',
      '**PIRs served**: PIR-1',
      '**Source Diversity**: 4 distinct sources',
      '**Source Diversity floor**: 3',
      '**SATs applied**: ACH, KAC, Red Team',
      '**ICD 203**: compliant',
      '**Hash**: sha256:abc123',
      // Round 5 — manifest / synthesis preamble labels
      '**Article Type**: month-ahead',
      '**Article Date**: 2026-04-27',
      '**Analysis Type**: interpellations',
      '**Analysis Depth**: deep',
      '**Data Sources**: get_propositioner, get_motioner',
      '**Data Source**: riksdag-regering-mcp',
      '**Documents Downloaded**: 1200',
      '**Documents Selected (date-filtered)**: 11',
      '**Produced By**: download-parliamentary-data script',
      '**Scope of this file**: raw data downloaded',
      // Round 6 — per-document and Swedish-language admin preamble labels
      '**Session**: Riksmöte 2025/26 (final spring phase)',
      '**Datum**: 2026-04-23',
      '**Tier**: A',
      '**DIW Tier**: HIGH',
      '**Admiralty Source Code**: A1',
      '**Inlämnare**: Magdalena Andersson (S)',
      '**Mottagare**: Finansutskottet',
      '**Talman**: Andreas Norlén',
      '**Ministry**: Finansdepartementet',
      '**SISVA (response deadline)**: 2026-05-15',
      '**Filed**: 2026-04-23',
      '**Filed by**: M, KD, L, SD',
      '**Effective date**: 2026-07-01',
      '**Effective Date**: 2026-07-01',
      '**Tabling date**: 2026-04-23',
      '**Requested date**: 2026-04-15',
      '**Source authority**: riksdagen.se',
      '**UTC Timestamp**: 2026-04-27T16:00Z',
      '**Analysis Timestamp**: 2026-04-27T16:00Z',
      '**Analysis run**: rm-2026-04-27-001',
      '**Updated**: 2026-04-27',
      '**Level**: HIGH',
      '**Relates to**: HD03253',
      '**frs**: 2025/26:437',
      '**Run completed**: 2026-04-27T06:38Z',
      '**Run at**: 2026-04-27 06:38 UTC',
    ]) {
      expect(ADMIN_FIELD_RE.test(f)).toBe(true);
    }
  });

  it('matches unbolded admin fields (leak case — description read back from rendered HTML)', () => {
    expect(ADMIN_FIELD_RE.test('Brief ID: EB-2026-04-22-EVE001')).toBe(true);
    expect(ADMIN_FIELD_RE.test('Prepared by: James Pether Sörling')).toBe(true);
    expect(ADMIN_FIELD_RE.test('Classification: Public')).toBe(true);
  });

  it('does not match real prose that happens to start with similar words', () => {
    expect(ADMIN_FIELD_RE.test('Sweden approves SEK 4.1bn emergency budget')).toBe(false);
    expect(ADMIN_FIELD_RE.test('The government presented three propositions')).toBe(false);
  });
});

describe('render-lib — ADMIN_FRAGMENT_SPLITTER (SEO contract §3b)', () => {
  it('splits on structural delimiters (pipe, fullwidth pipe, newline, double-space)', () => {
    const input = '**Classification**: Public | **Analyst**: JPS';
    const parts = input.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    expect(parts).toHaveLength(2);
    expect(parts[0]!.trim()).toMatch(/^\*\*Classification\*\*:/);
    expect(parts[1]!.trim()).toMatch(/^\*\*Analyst\*\*:/);
  });

  it('does NOT split on em-dash / middle-dot (value-internal punctuation)', () => {
    // `**Classification**: Public — GDPR Art. 9(2)(e)` is ONE admin field
    // whose value happens to contain an em-dash — splitting on — would
    // incorrectly yield a non-admin fragment and let the byline escape.
    const input = '**Classification**: Public — GDPR Art. 9(2)(e)';
    const parts = input.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toBe(input);
  });

  it('handles |-separated admin blocks — whole block is admin, every fragment matches', () => {
    const block = '**Classification**: Public | **Analyst**: JPS | **Cycle**: Realtime-2338';
    const parts = block.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    expect(parts.length).toBe(3);
    for (const p of parts) {
      expect(ADMIN_FIELD_RE.test(p.trim())).toBe(true);
    }
  });
});

describe('render-lib — readFirstParagraph skips |-separated admin blocks (SEO contract §3b)', () => {
  it('skips a paragraph whose fragments are all admin fields, even when joined by `|`', () => {
    const md = [
      '# Executive Brief — Realtime 2026-04-22',
      '',
      '**Classification**: Public | **Analyst**: JPS | **Cycle**: Realtime-2338',
      '',
      'The real lede paragraph of the brief.',
    ].join('\n');
    const p = readFirstParagraph(md);
    expect(p).toContain('real lede paragraph');
    expect(p).not.toMatch(/Classification|Analyst|Cycle/);
  });

  it('skips a multi-line admin block led by an unbolded `Brief ID`', () => {
    // Reproduces the 2026-04-22-evening-analysis regression in which the
    // description leaked "Brief ID: EB-… Prepared by: … Prepared at: …
    // Classification: Public — GDPR Art. 9(2)(e) Confidence: HIGH [A1]".
    const md = [
      '# Executive Brief — Evening Analysis',
      '',
      'Brief ID: EB-2026-04-22-EVE001',
      'Prepared by: James Pether Sörling',
      'Prepared at: 2026-04-22 23:50 UTC',
      'Classification: Public — GDPR Art. 9(2)(e)',
      'Confidence: HIGH [A1]',
      '60-second read: ✅',
      '',
      'The real BLUF lead sentence that should become the description.',
    ].join('\n');
    const p = readFirstParagraph(md);
    expect(p).toContain('real BLUF lead sentence');
    expect(p).not.toMatch(/Brief ID|Prepared by|Classification|Confidence|60-second/);
  });
});

describe('render-lib — truncateToSentenceBoundary (SEO contract §3c)', () => {
  it('returns the input unchanged when it is already within the window', () => {
    const s = 'Sweden approves emergency budget five months before the September 2026 general election.';
    expect(truncateToSentenceBoundary(s)).toBe(s);
  });

  it('truncates at the last sentence boundary within hardMax, not mid-word', () => {
    const s =
      'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election. ' +
      'The Social Democrats abandoned their climate counter-motion to avoid blame for high fuel costs. ' +
      'Trailing sentence that will not fit.';
    const out = truncateToSentenceBoundary(s);
    expect(out.length).toBeLessThanOrEqual(200);
    // Should end on a sentence terminator, not mid-word.
    expect(out).toMatch(/[.!?]$/);
    // Should include the first sentence in full.
    expect(out).toContain('Sweden approves SEK 4.1bn emergency budget');
  });

  it('never cuts mid-word when no sentence boundary is reachable', () => {
    // 30 repetitions of "longword " → 270 chars, no sentence end.
    const s = 'longword '.repeat(30).trim();
    const out = truncateToSentenceBoundary(s);
    expect(out.length).toBeLessThanOrEqual(201); // +1 for ellipsis
    // Ends with an intentional ellipsis (no optional match — the ellipsis
    // must actually be present), preceded by a complete `longword` token.
    expect(out).toMatch(/longword…$/);
  });

  it('respects custom windows (e.g. CJK 70-120)', () => {
    const s =
      'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election. Additional context follows here.';
    const out = truncateToSentenceBoundary(s, 70, 120);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out).toMatch(/[.!?]$/);
  });

  it('supports CJK full stop `。` as a sentence terminator', () => {
    const s =
      '瑞典批准紧急预算。这是在九月大选前五个月通过的。更多文本可能会跟随。后续的一些段落继续内容。' +
      '更多内容。更多内容。更多内容。更多内容。更多内容。更多内容。';
    const out = truncateToSentenceBoundary(s, 20, 60);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out).toMatch(/。$/);
  });
});

describe('render-lib — readBlufParagraph (SEO contract §3d)', () => {
  it('returns the first prose paragraph after a `## 🎯 BLUF` heading', () => {
    const md = [
      '# Executive Brief — Something',
      '',
      '**Classification**: Public',
      '',
      '## 🎯 BLUF',
      '',
      'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election.',
      '',
      '## Next section',
      '',
      'body text',
    ].join('\n');
    const bluf = readBlufParagraph(md);
    expect(bluf).toContain('Sweden approves SEK 4.1bn emergency budget');
  });

  it('returns null when the brief has no BLUF heading', () => {
    const md = '# No BLUF\n\nJust a regular paragraph.\n';
    expect(readBlufParagraph(md)).toBeNull();
  });

  it('skips admin paragraphs between the BLUF heading and the first prose', () => {
    const md = [
      '# EB',
      '',
      '## 🎯 BLUF',
      '',
      '**Classification**: Public | **Analyst**: JPS',
      '',
      'Real BLUF sentence.',
    ].join('\n');
    expect(readBlufParagraph(md)).toBe('Real BLUF sentence.');
  });
});

describe('render-lib — cleanArticleTitle (SEO contract §3e)', () => {
  it('strips `Executive Brief — ` prefix and trailing ISO date', () => {
    expect(cleanArticleTitle('Executive Brief — Government Committee Reports 2026-04-23'))
      .toBe('Government Committee Reports');
    expect(cleanArticleTitle('Executive Brief - Opposition Propositions 2026/04/15'))
      .toBe('Opposition Propositions');
  });

  it('returns null when the cleaned title is too short to be a real headline', () => {
    expect(cleanArticleTitle('Executive Brief — EB 2026-04-22')).toBeNull();
    // "Committee Reports" is 17 chars — below the 20-char floor for a real story.
    expect(cleanArticleTitle('Executive Brief — Committee Reports 2026-04-23')).toBeNull();
    expect(cleanArticleTitle('# Hi')).toBeNull();
    expect(cleanArticleTitle('')).toBeNull();
    expect(cleanArticleTitle(null)).toBeNull();
  });

  it('preserves a real editorial headline that already has no boilerplate', () => {
    const t = 'Sweden approves emergency budget five months before the 2026 election';
    expect(cleanArticleTitle(t)).toBe(t);
  });

  it('strips trailing realtime-cycle timestamps like ` 2026-04-22 23:38`', () => {
    expect(cleanArticleTitle('Executive Brief — Riksdag Realtime Monitor 2026-04-22 23:38'))
      .toBe('Riksdag Realtime Monitor');
    // Note: "Riksdag Realtime Monitor" is the subject, `Executive Brief —`
    // prefix is stripped and the trailing timestamp is removed.
  });

  it('handles the `Realtime Monitor — ` boilerplate prefix too', () => {
    expect(cleanArticleTitle('Realtime Monitor — Swedish defense spending debate 2026-04-22'))
      .toBe('Swedish defense spending debate');
  });

  it('strips leading pictographs / emoji prefixes like `📋 Executive Brief — …`', () => {
    // Regression: translated Tier-A articles sometimes render the H1
    // with a `📋` emoji prefix — the old regex anchored strictly on
    // `^Executive Brief` and failed to fire.
    expect(cleanArticleTitle('📋 Executive Brief — Riksdag Realtime Monitor 2026-04-17 14:34'))
      .toBe('Riksdag Realtime Monitor');
    expect(cleanArticleTitle('🚨 Intelligence Brief — Coalition Mathematics 2026-04-20'))
      .toBe('Coalition Mathematics');
  });

  it('strips mid-title ISO date ranges and dangling connectors', () => {
    // Regression: week-ahead articles emit titles like `Week Ahead: 2026-02-23 to`
    // in every language variant — the old regex only stripped trailing
    // dates so the mid-title date + dangling connector survived in
    // Arabic / German / Japanese etc. Real bad titles end with the
    // connector word after the date (no trailing prose), which
    // collapses to under the 20-char floor → `null`, so the rewriter
    // falls back to `titleFromBluf`.
    expect(cleanArticleTitle('Week Ahead: 2026-02-23 to')).toBeNull();
    expect(cleanArticleTitle('Woche Voraus: 2026-02-23 bis')).toBeNull();
    expect(cleanArticleTitle('الأسبوع القادم: 2026-02-23 إلى')).toBeNull();
    // But a real follow-on phrase survives with the embedded date gone:
    expect(cleanArticleTitle('Budget outlook 2026-02-23 through 2026-03-02 in Riksdagen'))
      .toBe('Budget outlook through in Riksdagen');
  });
});

describe('render-lib — titleFromBluf (SEO contract §3e fallback)', () => {
  it('synthesises a title from the first BLUF sentence', () => {
    const bluf = 'Sweden approves SEK 4.1bn emergency budget five months before the September 2026 election. More context follows.';
    const title = titleFromBluf(bluf);
    expect(title).not.toBeNull();
    expect(title!.length).toBeLessThanOrEqual(70);
    expect(title).toContain('Sweden approves');
  });

  it('returns null when there is no usable BLUF', () => {
    expect(titleFromBluf(null)).toBeNull();
    expect(titleFromBluf('')).toBeNull();
    expect(titleFromBluf('   ')).toBeNull();
  });

  it('truncates at word boundary when the first sentence exceeds maxLen', () => {
    const bluf = 'The Swedish Riksdag approved a comprehensive emergency energy relief package worth SEK four point one billion with a cross-bloc majority including unexpected Social Democratic support despite their counter-motion filed the same week.';
    const title = titleFromBluf(bluf, 70);
    expect(title).not.toBeNull();
    expect(title!.length).toBeLessThanOrEqual(70);
    // Must end on a complete word — i.e. the char immediately after the
    // title in the source BLUF is a whitespace (word boundary) or EOL.
    const nextCharIdx = bluf.indexOf(title!) + title!.length;
    const nextChar = bluf[nextCharIdx];
    expect(nextChar === undefined || /\s/.test(nextChar)).toBe(true);
  });
});

describe('render-lib — aggregateAnalysis end-to-end contract', () => {
  it('produces a clean title + description for a realistic executive-brief with boilerplate H1', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-seo-e2e-'));
    const sub = path.join(tmp, '2026-04-23', 'committeeReports');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Executive Brief — Committee Reports 2026-04-23',
        '',
        '**Classification**: Public | **Distribution**: Open',
        '**Analyst**: James Pether Sörling | **Date**: 2026-04-23',
        '',
        '## 🎯 BLUF',
        '',
        "Sweden's Riksdag approved an emergency SEK 4.1 billion fiscal package on 23 April 2026, cutting fuel taxes five months before the September general election while simultaneously ratifying two dormant constitutional amendments.",
        '',
        '## More context',
        '',
        'Body.',
      ].join('\n'),
    );
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2026-04-23/committeeReports',
      date: '2026-04-23',
      subfolder: 'committeeReports',
    });

    // Title: `Executive Brief — ` stripped, `2026-04-23` stripped. Since
    // `Committee Reports` (17 chars) is < 20, fall back to BLUF synthesis.
    expect(result.title).not.toMatch(/Executive Brief/);
    expect(result.title).not.toMatch(/2026-04-23/);
    expect(result.title.length).toBeGreaterThan(15);

    // Description: BLUF paragraph, sentence-terminated OR intentionally
    // ellipsis-truncated, ≤ 200 chars, no admin leakage. Per
    // `truncateToSentenceBoundary()`: when no sentence end fits in the
    // window, fall back to a clean word-boundary cut with Unicode `…`.
    expect(result.description.length).toBeLessThanOrEqual(200);
    expect(result.description).toMatch(/[.!?…]$/);
    expect(result.description).not.toMatch(/Classification|Analyst|Distribution/);
    expect(result.description).toContain("Sweden");
  });

  it('synthesises a BLUF-based title when the H1 collapses to nothing useful', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-seo-short-'));
    const sub = path.join(tmp, '2026-04-22', 'evening-analysis');
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(
      path.join(sub, 'executive-brief.md'),
      [
        '# Executive Brief — Evening 2026-04-22',
        '',
        '## 🎯 BLUF',
        '',
        'Finance Minister Svantesson faces a coordinated three-interpellation accountability offensive from the Social Democrats ahead of the September 2026 election.',
      ].join('\n'),
    );
    const result = aggregateAnalysis({
      subfolderAbsPath: sub,
      subfolderRepoRelPath: 'analysis/daily/2026-04-22/evening-analysis',
      date: '2026-04-22',
      subfolder: 'evening-analysis',
    });

    expect(result.title).toContain('Finance Minister Svantesson');
    expect(result.title.length).toBeLessThanOrEqual(70);
    expect(result.title).not.toMatch(/Executive Brief|2026-04-22/);
  });
});

// ---------------------------------------------------------------------------
// stripBodyDuplicateSections — removes inline Reader Guide + Article Sources
// ---------------------------------------------------------------------------

describe('render-lib — stripBodyDuplicateSections', () => {
  it('strips the ## Reader Intelligence Guide section from article body', () => {
    const body = [
      '## Executive Brief',
      '',
      'Some content here.',
      '',
      '## Reader Intelligence Guide',
      '',
      'Use this guide to read the article.',
      '',
      '| Reader need | What you\'ll get | Source artifact |',
      '|---|---|---|',
      '| BLUF | fast answer | `executive-brief.md` |',
      '',
      '## Risk Assessment',
      '',
      'Risk body.',
    ].join('\n');
    const result = stripBodyDuplicateSections(body);
    expect(result).not.toContain('Reader Intelligence Guide');
    expect(result).not.toContain('Use this guide to read');
    expect(result).toContain('## Executive Brief');
    expect(result).toContain('## Risk Assessment');
    expect(result).toContain('Risk body.');
  });

  it('strips the ## Article Sources section from article body', () => {
    const body = [
      '## Executive Brief',
      '',
      'Lede content.',
      '',
      '## Article Sources',
      '',
      'Each section above projects one analysis artifact.',
      '',
      '- [`executive-brief.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/x/executive-brief.md)',
      '- [`risk-assessment.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/x/risk-assessment.md)',
    ].join('\n');
    const result = stripBodyDuplicateSections(body);
    expect(result).not.toContain('Article Sources');
    expect(result).not.toContain('Each section above');
    expect(result).toContain('## Executive Brief');
    expect(result).toContain('Lede content.');
  });

  it('strips both sections when present together', () => {
    const body = [
      '## Executive Brief',
      '',
      'Content.',
      '',
      '## Reader Intelligence Guide',
      '',
      'Guide preamble.',
      '',
      '| Col1 | Col2 |',
      '|---|---|',
      '| A | B |',
      '',
      '## Synthesis Summary',
      '',
      'Synthesis content.',
      '',
      '## Article Sources',
      '',
      '- [`file.md`](url)',
    ].join('\n');
    const result = stripBodyDuplicateSections(body);
    expect(result).not.toContain('Reader Intelligence Guide');
    expect(result).not.toContain('Article Sources');
    expect(result).toContain('## Executive Brief');
    expect(result).toContain('## Synthesis Summary');
    expect(result).toContain('Synthesis content.');
  });

  it('returns body unchanged when neither section is present', () => {
    const body = '## Executive Brief\n\nContent.\n\n## Risk Assessment\n\nRisk.\n';
    expect(stripBodyDuplicateSections(body)).toBe(body);
  });

  it('renders no inline Reader Guide or Article Sources in final HTML (integration)', async () => {
    const mdWithDuplicates = [
      '---',
      'title: "Test Article"',
      'description: "Test desc"',
      'date: 2099-01-01',
      '---',
      '',
      '## Executive Brief',
      '',
      'The lede paragraph.',
      '',
      '## Reader Intelligence Guide',
      '',
      'Use this guide to read the article as a political-intelligence product.',
      '',
      '| Reader need | What you\'ll get | Source artifact |',
      '|---|---|---|',
      '| BLUF | fast answer | `executive-brief.md` |',
      '',
      '## Risk Assessment',
      '',
      'Risk body.',
      '',
      '## Article Sources',
      '',
      'Each section above projects one analysis artifact.',
      '',
      '- [`executive-brief.md`](https://github.com/Hack23/riksdagsmonitor/blob/main/x)',
    ].join('\n');

    const html = await renderArticleHtml({
      markdown: mdWithDuplicates,
      lang: 'sv',
      canonicalPath: 'news/2099-01-01-test-sv.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/test',
      artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
    });

    // The body should NOT contain the markdown-rendered Reader Guide table
    // (it would appear as a <table> with "Reader need" header if not stripped)
    expect(html).not.toMatch(/<th>Reader need<\/th>/);
    // But the chrome-level Swedish Reader Guide section SHOULD be present
    expect(html).toContain('Läsarens underrättelseguide');
    // The body should NOT contain the markdown-rendered Article Sources list
    expect(html).not.toContain('Each section above projects one analysis artifact.');
    // But the chrome-level Swedish sources heading SHOULD be present
    expect(html).toContain('Analyskällor och metodik');
    // Article content remains
    expect(html).toContain('The lede paragraph');
    expect(html).toContain('Risk body.');
  });

  it('renders fully localized Reader Intelligence Guide table for all 14 languages', async () => {
    const md = [
      '---',
      'title: "Test"',
      'description: "Test"',
      'date: 2099-01-01',
      '---',
      '',
      '## Executive Brief',
      '',
      'Content.',
    ].join('\n');

    // Test all canonical languages to verify localization works.
    // `auditLabel` is the localized text of the audit-appendix row's
    // first cell (still rendered after the source-artifact column was
    // dropped per the user-visible "remove source artifacts" contract).
    const localizedExpectations = {
      en: { heading: 'Reader Intelligence Guide', auditLabel: 'Audit appendix' },
      sv: { heading: 'Läsarens underrättelseguide', auditLabel: 'Revisionsappendix' },
      da: { heading: 'Læserens efterretningsguide', auditLabel: 'Revisionsappendiks' },
      no: { heading: 'Leserens etterretningsguide', auditLabel: 'Revisjonsvedlegg' },
      fi: { heading: 'Lukijan tiedusteluopas', auditLabel: 'Tarkastusliite' },
      de: { heading: 'Nachrichtendienstlicher Leseleitfaden', auditLabel: 'Prüfungsanhang' },
      fr: { heading: 'Guide de renseignement du lecteur', auditLabel: "Annexe d&#039;audit" },
      es: { heading: 'Guía de inteligencia del lector', auditLabel: 'Apéndice de auditoría' },
      nl: { heading: 'Inlichtingengids voor de lezer', auditLabel: 'Auditbijlage' },
      ar: { heading: 'دليل القارئ الاستخباراتي', auditLabel: 'ملحق التدقيق' },
      he: { heading: 'מדריך המודיעין לקורא', auditLabel: 'נספח ביקורת' },
      ja: { heading: '読者向けインテリジェンスガイド', auditLabel: '監査付録' },
      ko: { heading: '독자 인텔리전스 가이드', auditLabel: '감사 부록' },
      zh: { heading: '读者情报指南', auditLabel: '审计附录' },
    } satisfies Record<Language, { heading: string; auditLabel: string }>;
    const expectations = LANGUAGES.map(lang => ({ lang, ...localizedExpectations[lang] }));

    for (const { lang, heading, auditLabel } of expectations) {
      const html = await renderArticleHtml({
        markdown: md,
        lang,
        canonicalPath: `news/2099-01-01-test-${lang}.html`,
        subfolderRepoRelPath: 'analysis/daily/2099-01-01/test',
        artifactsUsed: ['executive-brief.md', 'risk-assessment.md'],
      });
      expect(html, `lang=${lang} should contain localized heading`).toContain(heading);
      expect(html, `lang=${lang} should contain localized audit-row label`).toContain(auditLabel);
      expect(html, `lang=${lang} should render responsive Reader Guide table chrome`).toContain('class="rm-reader-guide-table"');
      // Table column headers should also be localized (not English "Reader need")
      if (lang !== 'en') {
        expect(html, `lang=${lang} should not have English table header`).not.toContain('<th>Reader need</th>');
        expect(html, `lang=${lang} should not have English audit-row label`).not.toContain('>Audit appendix<');
      }
    }
  });

  it('styles Reader Intelligence Guide table outside the article body', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'styles.css'), 'utf-8');
    expect(css).toContain('.rm-reader-guide .rm-table-wrap');
    expect(css).toContain('.rm-reader-guide-table');
    expect(css).toMatch(/\.rm-reader-guide-table\s*\{[\s\S]*?min-width:\s*42rem/);
  });
});
