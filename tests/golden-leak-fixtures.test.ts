/**
 * Golden-file regression test for the 2026-04-20 leakage patterns (§P3-4).
 *
 * These fixtures are **captured excerpts** from the real articles that
 * exposed the P0-3 (large `<span lang="sv">` dumps) and P0-4 (CSS + dok-id
 * prefix + stuttering) leaks in the 2026-04-20 non-SV articles. They are
 * committed verbatim here so any future regression of the cleaner or
 * detector immediately fails the build.
 *
 * Each fixture is the **minimum** excerpt that reproduces a specific leak
 * pattern — not the full article — so the test remains stable when the
 * articles themselves are regenerated.
 *
 * ## How to add a new golden fixture
 *
 *  1. Observe a leak in a newly generated article.
 *  2. Copy the smallest self-contained excerpt that reproduces it into
 *     the `GOLDEN_FIXTURES` table below with a `name`, `kind`, and
 *     `description`.
 *  3. Run this test — it MUST fail with the initial fixture (proving the
 *     detector/cleaner does catch it).
 *  4. Adjust the detector / cleaner until the test passes, then commit.
 *  5. The fixture is now a regression guard.
 */

import { describe, it, expect } from 'vitest';
import { cleanSummaryForDisplay, looksLikeRawDump } from '../scripts/data-transformers/text-cleaner.js';
import {
  detectSwedishLeakage,
  findLargeSwedishSpans,
  LARGE_SV_SPAN_WORD_THRESHOLD,
} from '../scripts/detect-swedish-leakage.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Golden fixtures
// ---------------------------------------------------------------------------

type GoldenKind = 'raw-dump-prose' | 'large-sv-span' | 'stutter';

interface GoldenFixture {
  readonly name: string;
  readonly kind: GoldenKind;
  readonly description: string;
  readonly input: string;
  /**
   * For `raw-dump-prose` fixtures: patterns that MUST NOT appear in the
   * cleaned output (leak markers successfully stripped).
   */
  readonly forbiddenAfterClean?: ReadonlyArray<string | RegExp>;
  /**
   * For `stutter` fixtures: patterns that MUST still be present after
   * cleaning (legitimate prose preserved). Keeping a separate field makes
   * the positive/negative semantic explicit per fixture kind.
   */
  readonly mustSurviveClean?: ReadonlyArray<string | RegExp>;
  /** For large-sv-span: target language under test. */
  readonly articleLang?: Language;
}

/**
 * Golden leak fixtures captured from the 2026-04-20 regressions.
 *
 * Each entry maps to one concrete anti-pattern surfaced in production and
 * serves as a **lock** on the detector/cleaner behaviour for that pattern.
 */
const GOLDEN_FIXTURES: ReadonlyArray<GoldenFixture> = [
  {
    name: 'GF-01: Riksdag dok-id metadata prefix with Proposition stutter',
    kind: 'raw-dump-prose',
    description:
      'API dump pattern seen at the start of 2026-04-20/propositions summaries: the internal dok-id code, numeric ID fragments, and `prop prop prop` stuttering precede the human title.',
    input:
      '5287684 HD03232 2025/26 232 prop prop prop Proposition 2025/26:232 om en ny lag för en mer ändamålsenlig arbetsgivardeklaration',
    forbiddenAfterClean: [
      /^\d{6,}\s+HD/,           // leading numeric + HD code
      /\bprop\s+prop\s+prop\b/, // triple-stutter
      /\b2025\/26 232\b/,       // bare dok-id fragment
    ],
  },
  {
    name: 'GF-02: Inline CSS rule fragment in the middle of a summary',
    kind: 'raw-dump-prose',
    description:
      'CSS selectors and declarations leaked into article prose when the Riksdag API returned raw HTML+CSS in a motion summary field.',
    input:
      'Kommittén föreslår en ny lag. .page { margin: 0; padding: 0; } .body-text { font-family: sans-serif; color: #333; } Lagen ska träda i kraft 2026-07-01.',
    forbiddenAfterClean: [
      /\.page\s*\{/,
      /\.body-text\s*\{/,
      /font-family:/,
      /margin:\s*0/,
    ],
  },
  {
    name: 'GF-03: #page_N and #id_N anchor fragments',
    kind: 'raw-dump-prose',
    description:
      'Section anchors from the PDF-to-HTML conversion pipeline leaked through the API into the summary field.',
    input:
      'Motion 2026/27:42 behandlar jämställdhet #page_3 #id_7 och föreslår nya åtgärder #page_4.',
    forbiddenAfterClean: [/#page_\d+/, /#id_\d+/],
  },
  {
    name: 'GF-04: &nbsp; HTML entities not decoded',
    kind: 'raw-dump-prose',
    description:
      'Raw `&nbsp;` entities (and the underlying U+00A0 character) leaked into rendered prose.',
    input:
      'Utskottet&nbsp;föreslår&nbsp;att&nbsp;riksdagen&nbsp;avslår motionen.',
    forbiddenAfterClean: ['&nbsp;'],
  },
  {
    name: 'GF-05: Large <span lang="sv"> paragraph in an EN article',
    kind: 'large-sv-span',
    description:
      'Large untranslated Swedish block (>> 8 words) wrapped in <span lang="sv"> hiding inside an English article — the P0-3 regression that the dictionary-score detector previously missed.',
    articleLang: 'en',
    input:
      '<p>The committee reviewed the bill. <span lang="sv">Regeringen föreslår att riksdagen ska anta lagförslaget om skärpta regler för arbetskraftsinvandring och att detta ska träda i kraft den första juli tjugohundratjugosex.</span> The vote is scheduled for tomorrow.</p>',
  },
  {
    name: 'GF-06: Large <span lang="sv-SE"> with BCP-47 subtag in a DE article',
    kind: 'large-sv-span',
    description:
      'Same as GF-05 but using the BCP-47 country subtag `sv-SE`. The detector must match the language prefix, not the exact `lang="sv"` string.',
    articleLang: 'de',
    input:
      '<p>Der Ausschuss hat den Gesetzentwurf geprüft. <span lang="sv-SE">Regeringen föreslår att riksdagen ska anta lagförslaget om skärpta regler för arbetskraftsinvandring och att detta ska träda i kraft den första juli.</span> Die Abstimmung ist für morgen geplant.</p>',
  },
  {
    name: 'GF-07: Short <span lang="sv"> quote (legitimate — must NOT fire)',
    kind: 'large-sv-span',
    description:
      'A legitimate short proper-noun quote in Swedish (< 8 words) must NOT be flagged — only the large-block pattern is the leak.',
    articleLang: 'en',
    input:
      '<p>The committee approved <span lang="sv">Betänkande 2026/27:AU10</span> with minor amendments.</p>',
  },
  {
    name: 'GF-08: Two-word stutter is LEGITIMATE prose',
    kind: 'stutter',
    description:
      'The cleaner must only collapse ≥ 3-repeat stutters. Legitimate doubled words (e.g., "that that is") must pass through.',
    input: 'She said that that is the problem we need to solve.',
    mustSurviveClean: [/\bthat\s+is\s+the/], // text must still read "that is the"
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertNotContains(cleaned: string, forbidden: string | RegExp, fixtureName: string) {
  if (typeof forbidden === 'string') {
    expect(cleaned.includes(forbidden), `${fixtureName}: cleaned output still contains "${forbidden}"\n  cleaned: ${cleaned}`).toBe(false);
  } else {
    expect(forbidden.test(cleaned), `${fixtureName}: cleaned output still matches ${forbidden}\n  cleaned: ${cleaned}`).toBe(false);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Golden leak fixtures (§P3-4 regression guard)', () => {
  const rawDumps = GOLDEN_FIXTURES.filter((f) => f.kind === 'raw-dump-prose');
  const largeSpans = GOLDEN_FIXTURES.filter((f) => f.kind === 'large-sv-span');
  const stutters = GOLDEN_FIXTURES.filter((f) => f.kind === 'stutter');

  describe('raw-dump-prose fixtures — cleaner must strip the leak markers', () => {
    for (const fx of rawDumps) {
      it(`${fx.name} — ${fx.description}`, () => {
        const cleaned = cleanSummaryForDisplay(fx.input);
        // Stripping must not empty the prose — legitimate content survives.
        expect(cleaned.length, `${fx.name}: cleaner returned empty string`).toBeGreaterThan(0);
        for (const forbidden of fx.forbiddenAfterClean ?? []) {
          assertNotContains(cleaned, forbidden, fx.name);
        }
      });
    }

    it('looksLikeRawDump() returns true for every raw-dump-prose fixture', () => {
      for (const fx of rawDumps) {
        // GF-04 (&nbsp; only) is NOT a raw dump — it's entity decoding,
        // so it is accepted as prose. All others should flag.
        if (fx.name.startsWith('GF-04')) continue;
        expect(looksLikeRawDump(fx.input), `${fx.name}: expected looksLikeRawDump() = true`).toBe(true);
      }
    });
  });

  describe('large-sv-span fixtures — detector hard-fails on ≥ 8-word spans', () => {
    for (const fx of largeSpans) {
      it(`${fx.name} — ${fx.description}`, () => {
        const spans = findLargeSwedishSpans(fx.input);
        const expectHit = !fx.name.startsWith('GF-07'); // GF-07 is the legitimate short-quote control
        if (expectHit) {
          expect(spans.length, `${fx.name}: expected ≥ 1 large sv span`).toBeGreaterThanOrEqual(1);
          expect(spans[0].wordCount).toBeGreaterThanOrEqual(LARGE_SV_SPAN_WORD_THRESHOLD);
        } else {
          expect(spans.length, `${fx.name}: short sv span must NOT be flagged`).toBe(0);
        }
      });

      it(`${fx.name} — detectSwedishLeakage surfaces it (or correctly doesn't) for articleLang=${fx.articleLang}`, () => {
        const report = detectSwedishLeakage(fx.input, fx.articleLang ?? 'en');
        const expectHit = !fx.name.startsWith('GF-07');
        const spans = report.largeSwedishSpans ?? [];
        if (expectHit) {
          expect(spans.length).toBeGreaterThanOrEqual(1);
        } else {
          expect(spans.length).toBe(0);
        }
      });
    }
  });

  describe('stutter fixtures — cleaner preserves legitimate < 3-repeat prose', () => {
    for (const fx of stutters) {
      it(`${fx.name} — ${fx.description}`, () => {
        const cleaned = cleanSummaryForDisplay(fx.input);
        // Assert every required positive pattern survives cleaning — this
        // is the dedicated `mustSurviveClean` field, no more semantic
        // overload with `forbiddenAfterClean`.
        for (const mustSurvive of fx.mustSurviveClean ?? []) {
          if (typeof mustSurvive === 'string') {
            expect(cleaned, fx.name).toContain(mustSurvive);
          } else {
            expect(mustSurvive.test(cleaned), `${fx.name}: expected prose "${mustSurvive}" to survive cleanup\n  cleaned: ${cleaned}`).toBe(true);
          }
        }
      });
    }
  });

  describe('Fixture coverage summary', () => {
    it('every golden fixture has a unique name', () => {
      const names = new Set(GOLDEN_FIXTURES.map((f) => f.name));
      expect(names.size).toBe(GOLDEN_FIXTURES.length);
    });

    it('every golden fixture declares a kind', () => {
      for (const fx of GOLDEN_FIXTURES) {
        expect(['raw-dump-prose', 'large-sv-span', 'stutter']).toContain(fx.kind);
      }
    });

    it('at least one fixture per leak kind is present', () => {
      expect(rawDumps.length).toBeGreaterThanOrEqual(1);
      expect(largeSpans.length).toBeGreaterThanOrEqual(1);
      expect(stutters.length).toBeGreaterThanOrEqual(1);
    });
  });
});
