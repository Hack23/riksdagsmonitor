/**
 * Unit tests for the localized executive-brief lead transform
 * (`scripts/render-lib/article-brief-lead.ts`).
 *
 * The transform is a pure (no-I/O) string rewrite applied by
 * `renderArticleHtml` so a non-English news page opens with its own
 * `executive-brief_<lang>.md` body — mirroring the SEO `<title>` /
 * `<meta description>` cascade — while every embedded
 * `## Executive Brief <Lang>` carrier section is removed for all
 * languages. These tests pin the contract documented in the module
 * JSDoc.
 */

import { describe, it, expect } from 'vitest';

import {
  localizeExecutiveBriefLead,
  stripEmbeddedLocalizedBriefSections,
} from '../scripts/render-lib/article-brief-lead.js';

/**
 * Minimal aggregated article body: an English `## What Happened` lead
 * followed by an analytical section and two embedded localized-brief
 * carrier sections, matching the shape the aggregator emits.
 */
const ARTICLE_BODY = [
  '## What Happened',
  '<!-- source: executive-brief.md :: https://example/executive-brief.md -->',
  '',
  "Sweden's Busch government submitted seven propositions.",
  '',
  '## Risk Assessment',
  '',
  'Three measures carry constitutional review risk.',
  '',
  '## Executive Brief Sv',
  '<!-- source: executive-brief_sv.md -->',
  '',
  '### Sammanfattning',
  '',
  'Busch-regeringen lämnade sju propositioner.',
  '',
  '## Executive Brief Ja',
  '',
  '### 概要',
  '',
  'ブッシュ政権は7つの法案を提出した。',
  '',
].join('\n');

const SV_BRIEF = [
  '---',
  'title: Swedish lead',
  '---',
  '',
  '# Sveriges säkerhetsstat accelererar',
  '',
  '## Sammanfattning',
  '',
  'Busch-regeringen lämnade sju propositioner.',
  '',
  '## Vad du behöver veta',
  '',
  'Tre åtgärder bär konstitutionell risk.',
  '',
].join('\n');

describe('stripEmbeddedLocalizedBriefSections', () => {
  it('removes every embedded carrier section while keeping analytical sections', () => {
    const out = stripEmbeddedLocalizedBriefSections(ARTICLE_BODY);
    expect(out).not.toMatch(/## Executive Brief/);
    expect(out).not.toContain('Busch-regeringen lämnade sju propositioner.');
    expect(out).not.toContain('ブッシュ政権は7つの法案を提出した。');
    // Canonical English lead + analytical section survive untouched.
    expect(out).toContain('## What Happened');
    expect(out).toContain("Sweden's Busch government submitted seven propositions.");
    expect(out).toContain('## Risk Assessment');
  });

  it('collapses the blank-line gap left by removed carriers and ends with a single newline', () => {
    const out = stripEmbeddedLocalizedBriefSections(ARTICLE_BODY);
    expect(out).not.toMatch(/\n{3,}/);
    expect(out.endsWith('\n')).toBe(true);
    expect(out.endsWith('\n\n')).toBe(false);
  });

  it('is a no-op for a body with no carrier sections', () => {
    const body = '## What Happened\n\nPlain English lead.\n';
    expect(stripEmbeddedLocalizedBriefSections(body)).toContain('Plain English lead.');
    expect(stripEmbeddedLocalizedBriefSections(body)).not.toMatch(/## Executive Brief/);
  });
});

describe('localizeExecutiveBriefLead', () => {
  it('English: strips carriers but keeps the canonical English lead verbatim', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'en',
      localizedBriefMarkdown: undefined,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).toContain("Sweden's Busch government submitted seven propositions.");
    expect(out).not.toMatch(/## Executive Brief/);
    expect(out).not.toContain('Busch-regeringen lämnade sju propositioner.');
  });

  it('non-English with a brief: swaps the lead body to localized prose under the stable H2', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'sv',
      localizedBriefMarkdown: SV_BRIEF,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    // Heading stays English (body H2 headings are language-stable).
    expect(out).toContain('## What Happened');
    // English lead body is gone, Swedish brief body present.
    expect(out).not.toContain("Sweden's Busch government submitted seven propositions.");
    expect(out).toContain('Busch-regeringen lämnade sju propositioner.');
    // Analytical English section is preserved after the lead.
    expect(out).toContain('## Risk Assessment');
    // Carrier sections removed.
    expect(out).not.toMatch(/## Executive Brief/);
  });

  it('non-English brief: cleaning strips front-matter and the first H1, demotes ## to ###', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'sv',
      localizedBriefMarkdown: SV_BRIEF,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).not.toContain('title: Swedish lead');
    expect(out).not.toContain('# Sveriges säkerhetsstat accelererar');
    // Brief's own ## headings are demoted to ### so the article H2 stays unique.
    expect(out).toContain('### Sammanfattning');
    expect(out).toContain('### Vad du behöver veta');
  });

  it('non-English brief: repoints the lead provenance comment at executive-brief_<lang>.md', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'sv',
      localizedBriefMarkdown: SV_BRIEF,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).toContain('source: executive-brief_sv.md');
    expect(out).not.toContain('source: executive-brief.md ::');
  });

  it('non-English without a brief: keeps the English lead (localized-if-exists, English-otherwise)', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'de',
      localizedBriefMarkdown: undefined,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).toContain("Sweden's Busch government submitted seven propositions.");
    expect(out).not.toMatch(/## Executive Brief/);
  });

  it('non-English with an empty/whitespace brief: falls back to the English lead', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'fr',
      localizedBriefMarkdown: '   \n\n  ',
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).toContain("Sweden's Busch government submitted seven propositions.");
  });

  it('does not inject English normalize-terminology glosses into localized prose', () => {
    const out = localizeExecutiveBriefLead({
      content: ARTICLE_BODY,
      lang: 'sv',
      localizedBriefMarkdown: SV_BRIEF,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).not.toMatch(/Riksdag document #/);
    expect(out).not.toContain('Lede');
  });

  it('targets the first H2 generically (legacy `## Executive Brief` lead heading)', () => {
    const legacy = [
      '## Executive Brief',
      '',
      'English legacy lead.',
      '',
      '## Risk Assessment',
      '',
      'Body.',
      '',
    ].join('\n');
    const out = localizeExecutiveBriefLead({
      content: legacy,
      lang: 'sv',
      localizedBriefMarkdown: SV_BRIEF,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).toContain('## Executive Brief');
    expect(out).not.toContain('English legacy lead.');
    expect(out).toContain('Busch-regeringen lämnade sju propositioner.');
    expect(out).toContain('## Risk Assessment');
  });

  it('handles a lead section that is the only H2 (no trailing analytical section)', () => {
    const single = ['## What Happened', '', 'English lead only.', ''].join('\n');
    const out = localizeExecutiveBriefLead({
      content: single,
      lang: 'sv',
      localizedBriefMarkdown: SV_BRIEF,
      subfolderRepoRelPath: 'analysis/daily/2026-05-20/propositions',
    });
    expect(out).toContain('## What Happened');
    expect(out).not.toContain('English lead only.');
    expect(out).toContain('Busch-regeringen lämnade sju propositioner.');
  });
});
