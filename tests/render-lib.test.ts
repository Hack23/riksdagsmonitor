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
  __test__,
} from '../scripts/render-lib/index.js';

const { stripPassTwoSection, stripLeadingAdminBylines, cleanArtifactBody } = __test__;

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
});

describe('render-lib — AGGREGATION_ORDER', () => {
  it('puts intelligence-assessment.md immediately after synthesis-summary.md (ICD-203 flow)', () => {
    const idxSynth = AGGREGATION_ORDER.indexOf('synthesis-summary.md');
    const idxKJ = AGGREGATION_ORDER.indexOf('intelligence-assessment.md');
    const idxDevils = AGGREGATION_ORDER.indexOf('devils-advocate.md');
    const idxScoring = AGGREGATION_ORDER.indexOf('significance-scoring.md');
    expect(idxSynth).toBeGreaterThanOrEqual(0);
    expect(idxKJ).toBe(idxSynth + 1);
    // And intelligence-assessment must come well before devils-advocate and
    // significance-scoring (the old order buried it at position 19).
    expect(idxKJ).toBeLessThan(idxScoring);
    expect(idxKJ).toBeLessThan(idxDevils);
  });

  it('still keeps the appendix group at the very end', () => {
    const tail = AGGREGATION_ORDER.slice(-4);
    expect(tail).toEqual([
      'classification-results.md',
      'cross-reference-map.md',
      'methodology-reflection.md',
      'data-download-manifest.md',
    ]);
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

    // Title preserves the H1.
    expect(result.title).toBe('Executive Brief — Widgets 2099-01-01');

    // Description must be the real BLUF, NOT the admin byline.
    expect(result.description).toContain('widget committee reported five actionable findings');
    expect(result.description).not.toMatch(/Classification|Run ID|Author/i);

    // Aggregated markdown must carry real content but no Pass-2 / no admin byline.
    expect(result.markdown).toContain('widget committee reported five actionable findings');
    expect(result.markdown).toContain('Real synthesis.');
    expect(result.markdown).toContain('KJ-1 confidence HIGH.');
    expect(result.markdown).not.toMatch(/Pass 2/i);
    expect(result.markdown).not.toMatch(/self-audit text/);
    expect(result.markdown).not.toMatch(/\*\*Run ID\*\*/);

    // Section order: synthesis → intelligence-assessment must appear in that order.
    const synthPos = result.markdown.indexOf('## Synthesis Summary');
    const kjPos = result.markdown.indexOf('## Intelligence Assessment');
    expect(synthPos).toBeGreaterThan(-1);
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
});
