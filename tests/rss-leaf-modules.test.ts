/**
 * @module Tests/Rss/LeafModules
 * @description Unit tests for the bounded-context leaf modules of the
 * RSS generator (Round-6 split).
 *
 * Covers the pure helpers that have no filesystem dependency:
 *   - escapeXml
 *   - hreflangCode
 *   - stablePubDate (filename-driven branch)
 *   - extractArticleMeta (string-driven branch — file-not-found fallback)
 *   - validateRss
 *
 * The orchestrator is exercised by `generate-rss.test.ts` via the CLI
 * shim's barrel re-export; this file pins the unit-level invariants.
 */
import path from 'path';
import { describe, it, expect } from 'vitest';

import { escapeXml } from '../scripts/rss/escape.js';
import { hreflangCode } from '../scripts/rss/hreflang.js';
import { stablePubDate } from '../scripts/rss/pub-date.js';
import { extractArticleMeta } from '../scripts/rss/article-meta.js';
import { validateRss } from '../scripts/rss/validator.js';

describe('rss/escape.ts — escapeXml', () => {
  it('escapes the five XML metacharacters', () => {
    expect(escapeXml('a < b & c > d "e" \'f\'')).toBe(
      'a &lt; b &amp; c &gt; d &quot;e&quot; &apos;f&apos;',
    );
  });

  it('preserves valid pre-encoded numeric, hex, and named entities', () => {
    const input = 'Riksdag &amp; Regering &#39;quoted&#39; &#x27;hex&#x27;';
    expect(escapeXml(input)).toBe(input);
  });

  it('escapes a stray ampersand in plain prose like "R&D"', () => {
    expect(escapeXml('R&D')).toBe('R&amp;D');
    // Note: `&B;` looks like a named-entity reference per the XML 1.0 spec
    // — the escaper deliberately leaves it alone (preserve-entities).
    expect(escapeXml('R&B;')).toBe('R&B;');
  });

  it('uses XML-canonical &apos; for apostrophes (NOT HTML &#039;)', () => {
    expect(escapeXml("don't")).toBe('don&apos;t');
  });
});

describe('rss/hreflang.ts — hreflangCode', () => {
  it('maps `no` → `nb`', () => {
    expect(hreflangCode('no')).toBe('nb');
  });

  it.each(['en', 'sv', 'de', 'ja', 'zh'])('passes %s through unchanged', (code) => {
    expect(hreflangCode(code)).toBe(code);
  });
});

describe('rss/pub-date.ts — stablePubDate', () => {
  it('parses a YYYY-MM-DD prefix as 12:00 UTC for determinism', () => {
    expect(stablePubDate('news/2026-04-01-riksdag-vote-en.html'))
      .toBe('2026-04-01T12:00:00.000Z');
  });

  it('does not consult the filesystem when the filename has a date prefix', () => {
    // /no/such/path is not on disk — but the date prefix wins.
    expect(stablePubDate('/no/such/path/2026-12-31-something.html'))
      .toBe('2026-12-31T12:00:00.000Z');
  });

  it('falls back to the fixed sentinel when stat fails AND no date prefix', () => {
    expect(stablePubDate('/no/such/path/no-date-here.html'))
      .toBe('2026-01-01T12:00:00.000Z');
  });

  it('uses filesystem mtime when no date prefix but the file exists', () => {
    // Use this very test file as a known-existing file with no date prefix.
    const result = stablePubDate(__filename);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result).not.toBe('2026-01-01T12:00:00.000Z');
  });
});

describe('rss/article-meta.ts — extractArticleMeta', () => {
  it('returns sentinel defaults when the article file does not exist', () => {
    const meta = extractArticleMeta('/no/such/path/2026-01-15-missing-en.html');
    expect(meta).toEqual({
      title: '2026-01-15-missing-en',
      description: '',
      pubDate: '2026-01-15T12:00:00.000Z',
      author: 'Riksdagsmonitor',
      category: 'Political Analysis',
    });
  });

  it('uses path.basename so the title falls back to the bare filename without .html', () => {
    const meta = extractArticleMeta('/missing/2025-09-09-test-en.html');
    expect(meta.title).toBe('2025-09-09-test-en');
    expect(meta.title.endsWith('.html')).toBe(false);
  });

  it('uses the absolute basename of a relative path too', () => {
    const meta = extractArticleMeta(path.join('news', '2024-02-29-leap-day-en.html'));
    expect(meta.title).toBe('2024-02-29-leap-day-en');
    expect(meta.pubDate).toBe('2024-02-29T12:00:00.000Z');
  });
});

describe('rss/validator.ts — validateRss', () => {
  const happyPath = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>x</title>
    <link>x</link>
    <description>x</description>
    <item>
      <title>y</title>
      <link>y</link>
      <guid>y</guid>
    </item>
  </channel>
</rss>`;

  it('returns true on a structurally valid feed', () => {
    expect(validateRss(happyPath)).toBe(true);
  });

  it('throws when the XML declaration is missing', () => {
    expect(() => validateRss('<rss version="2.0"><channel></channel></rss>')).toThrow(/XML declaration/);
  });

  it('throws when the RSS version is wrong or missing', () => {
    const bad = `<?xml version="1.0"?><channel></channel>`;
    expect(() => validateRss(bad)).toThrow(/RSS 2\.0/);
  });

  it('throws when the channel envelope is missing', () => {
    const bad = `<?xml version="1.0"?><rss version="2.0"></rss>`;
    expect(() => validateRss(bad)).toThrow(/<channel>/);
  });

  it('throws when there are no items', () => {
    const empty = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>x</title><link>x</link><description>x</description></channel></rss>`;
    expect(() => validateRss(empty)).toThrow(/No items/);
  });

  it('throws when item count and required-tag count diverge', () => {
    const guidless = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>x</title><link>x</link><description>x</description>
    <item><title>y</title><link>y</link></item>
  </channel>
</rss>`;
    expect(() => validateRss(guidless)).toThrow(/<guid>/);
  });
});
