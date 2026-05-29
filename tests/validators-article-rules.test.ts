/**
 * @module tests/validators/article/per-rule
 * @description Per-rule unit tests for the article validator subtree.
 *              These cover rules that only had integration coverage in
 *              the monolithic validator (placeholders, landmarks,
 *              footer markers, per-document dok_id, slug helper).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  PLACEHOLDER_PATTERNS,
  checkPlaceholders,
  scanPlaceholders,
} from '../scripts/validators/article/rules/placeholders.js';
import {
  REQUIRED_LANDMARKS,
  checkLandmarks,
} from '../scripts/validators/article/rules/landmarks.js';
import {
  FOOTER_MARKER_PATTERNS,
  checkFooterMarkers,
} from '../scripts/validators/article/rules/footer.js';
import {
  DOK_ID_TOKEN_RE,
  MIN_PER_DOC_DOK_ID_HITS,
  checkPerDocument,
  extractPerDocumentSections,
} from '../scripts/validators/article/rules/per-document.js';
import {
  checkHeadingSlugs,
  permissiveSlug,
} from '../scripts/validators/article/slug.js';
import {
  checkUnclosedMermaidFences,
} from '../scripts/validators/article/rules/mermaid-fences.js';

const buildArticleFixture = (): string => `## Reader Intelligence Guide

| 📊 | [Section](#sec) |
| --- | --- |
| ✅ | Has data |

## Executive Brief

### BLUF

Anchored prose with HD12345 evidence and https://data.riksdagen.se/x.

## Per-document intelligence

### HD11111

Body referencing HD11111.

## Article Sources
`;

describe('article rules — placeholders', () => {
  it('exposes a non-empty PLACEHOLDER_PATTERNS array', () => {
    expect(PLACEHOLDER_PATTERNS.length).toBeGreaterThan(0);
  });

  it('scanPlaceholders returns the matched literal for every hit', () => {
    const hits = scanPlaceholders('Body has [REQUIRED: actor] and AI_MUST_REPLACE marker.');
    expect(hits).toContain('[REQUIRED: actor]');
    expect(hits.some((h) => /AI[_-]MUST[_-]REPLACE/i.test(h))).toBe(true);
  });

  it('checkPlaceholders emits one violation per pattern hit with stable code', () => {
    const v = checkPlaceholders('article.md', '[REQUIRED: actor] and TBD: details');
    expect(v.length).toBeGreaterThanOrEqual(2);
    for (const violation of v) {
      expect(violation.code).toBe('unresolved-placeholder');
      expect(violation.file).toBe('article.md');
    }
  });

  it('checkPlaceholders returns empty array for clean text', () => {
    expect(checkPlaceholders('article.md', 'Clean prose without any tokens.')).toEqual([]);
  });
});

describe('article rules — landmarks', () => {
  it('REQUIRED_LANDMARKS includes Reader Intelligence Guide, Executive Brief, BLUF, Article Sources', () => {
    const labels = REQUIRED_LANDMARKS.map((l) => l.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Reader Intelligence Guide',
        '## What Happened (Executive Brief) section',
        'BLUF/Lede heading inside the executive brief',
        'Article Sources appendix',
      ]),
    );
  });

  it('checkLandmarks passes a complete fixture', () => {
    expect(checkLandmarks('article.md', buildArticleFixture())).toEqual([]);
  });

  it('checkLandmarks reports every missing landmark for a stub document', () => {
    const v = checkLandmarks('article.md', '## Other Heading\n\nNo landmarks here.');
    const codes = v.map((vi) => vi.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'missing-reader-guide',
        'missing-executive-brief',
        'missing-bluf',
        'missing-sources-appendix',
      ]),
    );
  });

  it('checkLandmarks flags duplicate Reader Intelligence Guide headings', () => {
    const dup = '## Reader Intelligence Guide\n\n## Executive Brief\n\n### BLUF\n\nx HD12345 y\n\n## Reader Intelligence Guide\n\n## Article Sources\n';
    const v = checkLandmarks('article.md', dup);
    expect(v.some((x) => x.code === 'duplicate-reader-guide')).toBe(true);
  });

  it('checkLandmarks flags an empty Reader Intelligence Guide table', () => {
    const empty = '## Reader Intelligence Guide\n\nNo table.\n\n## Executive Brief\n\n### BLUF\n\nx HD12345 y\n\n## Article Sources\n';
    const v = checkLandmarks('article.md', empty);
    expect(v.some((x) => x.code === 'reader-guide-empty-table')).toBe(true);
  });
});

describe('article rules — footer markers', () => {
  it('FOOTER_MARKER_PATTERNS covers ISMS / Classified under / Hack23 ISMS / Article-Generation / Provenance / GDPR', () => {
    const labels = FOOTER_MARKER_PATTERNS.map((m) => m.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        '**ISMS …**',
        '**Classified under …**',
        '**Hack23 ISMS …**',
        '**Article-Generation contract …**',
        '**Provenance …**',
        '**GDPR …**',
      ]),
    );
  });

  it('checkFooterMarkers flags exact-duplicate footer lines', () => {
    const dup =
      'body\n**ISMS classification**: PUBLIC.\n\nmore body\n\n**ISMS classification**: PUBLIC.\n';
    const v = checkFooterMarkers('article.md', dup);
    expect(v.some((x) => x.code === 'duplicate-footer-marker')).toBe(true);
  });

  it('checkFooterMarkers does NOT flag distinct footer lines with the same prefix', () => {
    const distinct =
      'body\n**ISMS classification**: PUBLIC, no PII.\n\n**ISMS classification**: INTERNAL, restricted.\n';
    const v = checkFooterMarkers('article.md', distinct);
    expect(v).toEqual([]);
  });
});

describe('article rules — per-document', () => {
  it('extractPerDocumentSections returns each ### dok_id heading with its body', () => {
    const md = '## Per-document intelligence\n\n### HD11111\n\nBody A HD11111\n\n### HD22222\n\nBody B HD22222\n\n## Next section\n';
    const sections = extractPerDocumentSections(md);
    expect(sections.map((s) => s.id)).toEqual(['HD11111', 'HD22222']);
    expect(sections[0]!.body).toContain('HD11111');
  });

  it('checkPerDocument flags sections lacking any dok_id', () => {
    const md = '## Per-document intelligence\n\n### HD99999\n\nGeneric prose, no identifier here.\n';
    const v = checkPerDocument('article.md', md);
    expect(v.length).toBe(1);
    expect(v[0]!.code).toBe('per-doc-missing-dok_id');
  });

  it('DOK_ID_TOKEN_RE matches both H… and short-prefix codes', () => {
    expect(DOK_ID_TOKEN_RE.test('HD12345')).toBe(true);
    expect(DOK_ID_TOKEN_RE.test('FIU2025')).toBe(true);
  });

  it('MIN_PER_DOC_DOK_ID_HITS is at least 1', () => {
    expect(MIN_PER_DOC_DOK_ID_HITS).toBeGreaterThanOrEqual(1);
  });
});

describe('article rules — slug', () => {
  it('permissiveSlug produces lowercased hyphen-separated tokens', () => {
    expect(permissiveSlug('Executive Brief')).toBe('executive-brief');
    expect(permissiveSlug('Häpnadsväckande resultat!')).toBe('häpnadsväckande-resultat');
  });

  it('permissiveSlug returns empty string for symbol-only headings', () => {
    expect(permissiveSlug('---')).toBe('');
    expect(permissiveSlug('***')).toBe('');
  });

  it('checkHeadingSlugs flags a heading that produces an empty slug', () => {
    const v = checkHeadingSlugs('article.md', '## ---\n\nBody\n');
    expect(v.length).toBe(1);
    expect(v[0]!.code).toBe('empty-heading-slug');
  });

  it('checkHeadingSlugs is silent on well-formed headings', () => {
    expect(checkHeadingSlugs('article.md', '## Executive Brief\n\nBody\n')).toEqual([]);
  });
});

describe('article rules — mermaid fences', () => {
  it('checkUnclosedMermaidFences returns empty for balanced fences', () => {
    expect(checkUnclosedMermaidFences('article.md', '```mermaid\nflowchart LR\n A-->B\n```\n')).toEqual([]);
  });

  it('checkUnclosedMermaidFences reports unclosed openings with line numbers in the message', () => {
    const v = checkUnclosedMermaidFences('article.md', '```mermaid\nflowchart LR\n A-->B\n');
    expect(v).toHaveLength(1);
    expect(v[0]!.code).toBe('unclosed-mermaid-fence');
    expect(v[0]!.message).toMatch(/line 1/);
  });
});
