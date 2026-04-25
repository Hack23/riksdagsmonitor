# 🔖 SEO Metadata Contract — article `<title>` and `<meta description>`

> **Status:** Normative · **Owner:** Editorial · **Effective:** 2026-04-24 ·
> **Consumed by:** `scripts/render-lib/aggregator.ts` · `scripts/render-lib/chrome.ts` ·
> `scripts/generate-news-indexes/*` · `scripts/generate-sitemap-html.ts` ·
> the `news-translate` agentic workflow · every human editor writing an
> `executive-brief.md`.
> **Enforced by:** `tests/render-lib.test.ts` (forward-fix) and (post-PR 5)
> `tests/seo-metadata.test.ts` as a CI-blocking gate.

This contract is the single source of truth for what the `<title>` and
`<meta name="description">` of every published article must look like,
in every one of the 14 supported languages. It is the SEO-specific companion to [`Article-Generation.md`](../../Article-Generation.md), which describes the complete workflow → analysis artifacts → `article.md` → HTML/UI export pipeline. Every article also propagates
these two strings into eight other SEO surfaces (`og:title`,
`og:description`, `twitter:title`, `twitter:description`, JSON-LD
`headline` / `alternativeHeadline` / `description`, and the human-readable
`sitemap*.html` / `news/index*.html` cards). Get the two sources right
here and the other eight follow for free.

---

## 1 · Why this exists

Scan of `news/*.html` on 2026-04-24 (2,736 articles across 14 languages)
surfaced six quality issues worth the price of a rewrite:

| Issue                                                                    | Affected | Root cause                                                                          |
| ------------------------------------------------------------------------ | -------: | ----------------------------------------------------------------------------------- |
| Description truncated mid-word (no sentence boundary)                    |      547 | `readFirstParagraph` used a blind `.slice(0, 300)`; legacy renderer used `.slice(0, 160)` |
| Admin metadata leaking into description (`Brief ID:`, `Classification:`) |   12 + 14-lang siblings | `ADMIN_FIELD_RE` only covered 12 field names; splitter missed `\|` |
| Boilerplate `Executive Brief — X YYYY-MM-DD` titles                      |       28 | `readFirstHeading()` picked the literal H1 of `executive-brief.md`                  |
| `YYYY-MM-DD` in `<title>` (SEO dilutive)                                 |       83 | Same as above                                                                       |
| Descriptions below Google's 70-char floor                                |    dozens (mostly ja/zh/ar/he/ko committee-reports) | `news-translate` aggressively shortens; no lower-bound enforcement |
| Generic `"AI-generated political intelligence"` filler                   |    2 + 14-lang siblings | Executive-brief missing or had no prose paragraph — aggregator fell back to `prettifyFallbackTitle(subfolder)` |

The contract below prevents all six from ever happening again.

---

## 2 · Title rules

### 2.1 Canonical (EN-first) rules

- **Length:** 55-70 characters. Below 30 is under-specified; above 75 gets
  truncated in Google desktop SERP.
- **Front-load the actor.** Start with `Sweden`, `Riksdag`, the governing
  coalition name (`Tidö coalition`, `M+KD+SD`), the specific minister
  (`Finance Minister Svantesson`), the party shorthand (`S`, `M`, `SD`,
  `V`, `MP`, `C`, `L`, `KD`), or the legislative instrument code
  (`HD01FiU48`, `KU33`, `prop. 2025/26:236`).
- **Use a news verb.** `approves`, `blocks`, `splits`, `escalates`,
  `unveils`, `rebukes`, `restores`, `cuts`, `freezes`, `postpones`,
  `probes`, `warns`, `overrides`, `refers`, `ratifies`. Never static
  noun-phrases (`Committee report on energy policy`).
- **Never contains a literal date.** Not `2026-04-23`, not
  `on 23 April`. The publication date is already in
  `article:published_time` and the breadcrumb; duplicating it in the
  title wastes SERP pixels and dates the slug.
- **Never ends with ` — Riksdagsmonitor`.** The chrome template in
  `scripts/render-lib/chrome.ts` appends this for `og:title` and
  `twitter:title` only; adding it to `<title>` double-brands the card.
- **Sentence case.** Not Title Case. (`Sweden approves emergency budget`,
  not `Sweden Approves Emergency Budget`.)

### 2.2 Banned phrases (hard-block — enforced in test suite)

Any of these in the title fails CI:

- `Executive Brief — …` (boilerplate H1 from the analysis template)
- `AI-generated political intelligence` (generator fallback string)
- Any literal `YYYY-MM-DD` or `YYYY/MM/DD`
- `Brief ID:` / `Classification:` / `Prepared by:` / `Analyst:` /
  `60-second read:` / `Admiralty baseline:`
- Trailing ` — Riksdagsmonitor`

### 2.3 Required elements (soft-require — at least one)

Well-performing articles always contain at least one of:

- A named minister (`Kristersson`, `Svantesson`, `Billström`, `Strömmer`, …)
- A party code (`M`, `S`, `SD`, `V`, `MP`, `C`, `L`, `KD`)
- A legislative instrument code (`HD01FiU48`, `KU33`, `prop. 2025/26:236`,
  `HD10442`)
- A concrete number (`SEK 4.1bn`, `14 motions`, `three interpellations`)
- A time-relative anchor (`five months before the election`, `this week`,
  `ahead of the autumn budget`)

A title with none of these is usually boilerplate — the test suite will
warn (not block) on it.

---

## 3 · Description rules

### 3.1 Canonical (EN-first) rules

- **Length:** 140-200 characters. Below 140 Google is likely to rewrite
  the snippet from the body; above 200 gets truncated on Google mobile
  with an ellipsis in the middle of a word.
- **One complete sentence, ending on `.`, `!`, `?`, or an intentional
  `…`.** Never end mid-word — `scripts/render-lib/aggregator.ts` must
  walk back from char 200 to the nearest sentence terminator.
- **Concrete over abstract.** At least one of: named actor, concrete
  number, proposition / committee code, vote breakdown, SEK/€ amount,
  date-relative anchor.
- **Active voice, present tense** (`Sweden cuts fuel tax …`), not
  passive past (`The fuel tax was cut by Sweden …`).
- **No admin metadata.** Never contains `Brief ID:`, `Classification:`,
  `Prepared by:`, `Analyst:`, `60-second read:`, `Admiralty baseline:`,
  `Distribution:`, `Methodology:`.

### 3.2 Good vs bad (real examples from `news/*.html`)

✅ `Sweden's government tables 8 propositions covering electricity system overhaul, wind power revenue sharing, paid police education, digital fraud protection, and a new environmental permitting authority.` (198 chars, 8 concrete instruments, 2026-04-15)

✅ `With 2,308 rule violations flagged across 2,494 tracked politicians and 109,259 documents processed, the parliamentary session reveals a government struggling to translate coalition arithmetic into legislative momentum.` (200 chars, 3 numbers, named entity, 2026-02-13)

❌ `Brief ID: EB-2026-04-22-EVE001 Prepared by: James Pether Sörling Prepared at: 2026-04-22 23:50 UTC Classification: Public — GDPR Art. 9(2)(e) Confidence: HIGH [A1] 60-second read: ✅` (admin leak, 2026-04-22)

❌ `Riksdag Committee Reports — AI-generated political intelligence from Sweden's Riksdag` (generic filler, 2026-04-15)

❌ `Analyse von 10 Ausschussberichten` (35 chars, below floor, no concrete content, 2026-02-14 DE)

---

## 4 · Per-language charset budgets

Character counts are visual width in SERP, not UTF-8 bytes. CJK glyphs
are roughly 2× the SERP width of a Latin letter.

| Language  | Code | Title chars  | Description chars | Direction | Notes                                                 |
| --------- | ---- | ------------ | ----------------- | --------- | ----------------------------------------------------- |
| English   | `en` | 55-70        | 140-200           | LTR       | Canonical; all other langs translate from EN source   |
| Swedish   | `sv` | 55-70        | 140-200           | LTR       | Use native instrument names (`proposition`, `utskott`)|
| Danish    | `da` | 55-70        | 140-200           | LTR       | `Riksdagen` stays Swedish (proper noun)               |
| Norwegian | `no` (BCP-47 `nb`) | 55-70 | 140-200     | LTR       | File suffix `no`, `hreflang="nb"`                     |
| Finnish   | `fi` | 55-70        | 140-200           | LTR       | Tolerate +10 chars for agglutination                  |
| German    | `de` | 55-70        | 140-200           | LTR       | Tolerate +10 chars for compounds                      |
| French    | `fr` | 55-70        | 140-200           | LTR       |                                                       |
| Spanish   | `es` | 55-70        | 140-200           | LTR       |                                                       |
| Dutch     | `nl` | 55-70        | 140-200           | LTR       |                                                       |
| Arabic    | `ar` | 45-60        | 120-170           | **RTL**   | Test direction; keep Riksdagen as `الريكسداغ`         |
| Hebrew    | `he` | 45-60        | 120-170           | **RTL**   | Keep Riksdagen as `ריקסדאג`                           |
| Japanese  | `ja` | 30-45        | 70-120            | LTR       | Count CJK glyphs, not bytes                           |
| Korean    | `ko` | 30-45        | 70-120            | LTR       |                                                       |
| Chinese   | `zh` | 30-45        | 70-120            | LTR       | Simplified; Riksdag = `瑞典议会`                      |

The lower floor in the Description column is enforced — a 35-char
`Analyse von 10 Ausschussberichten` fails CI.

Native terminology cribs live in
`scripts/translation-dictionary-party-names.ts`,
`scripts/translation-dictionary-committee-names.ts`, and
`scripts/translation-dictionary-political-terms.ts`. Translators MUST
reference them.

---

## 5 · Generator contract (automated enforcement)

`scripts/render-lib/aggregator.ts` implements the EN-side of this
contract on every run:

| § Rule                                          | Enforced in                                                 |
| ----------------------------------------------- | ----------------------------------------------------------- |
| Admin bylines (`Brief ID`, `Prepared by`, …)    | `ADMIN_FIELD_RE` + `stripLeadingAdminBylines` + `readFirstParagraph` |
| `\|`-separated admin blocks                     | Fragment splitter includes `\|`, `｜`, `、`                   |
| Description length 140-200, sentence-terminated | `truncateToSentenceBoundary()` in `aggregator.ts`           |
| Description prefers BLUF over first paragraph   | `readBlufParagraph()` in `aggregator.ts`                    |
| Title strips `Executive Brief — ` prefix        | `cleanArticleTitle()` in `aggregator.ts`                    |
| Title strips trailing ` — YYYY-MM-DD`           | `cleanArticleTitle()` in `aggregator.ts`                    |
| `og:title` avoids double-`— Riksdagsmonitor`    | `renderChromeHead()` in `chrome.ts`                         |
| Sitemap / news-index prefer longer `og:description` | `parseArticleMetadata()` / `extractArticleMeta()`     |

Translation-side (non-EN) enforcement is the responsibility of the
`news-translate` agentic workflow: it reads the EN title + description,
applies the per-language budget from §4, and validates against the
banned-phrase list before committing.

---

## 6 · Editorial checklist (humans writing `executive-brief.md`)

Before committing an `executive-brief.md` artifact:

- [ ] The H1 (`# …`) is a publishable **story-oriented title** — not
      `# Executive Brief — …`. If you leave the boilerplate H1 in,
      `aggregator.ts` will strip the `Executive Brief — ` prefix and
      trailing date but cannot invent a good replacement. A brief with
      just `# Executive Brief — Propositions 2026-04-23` produces a weak
      title. Always write an editorial H1.
- [ ] The first paragraph under `## 🎯 BLUF` is the article's lede,
      publishable as-is, 140-200 characters, ending on a full stop.
      `aggregator.ts` uses this verbatim as the description.
- [ ] No trailing `**Classification**: Public | **Analyst**: …` block
      *between* the H1 and the BLUF heading — keep admin metadata
      between the H1 and the first `---` or move it entirely below
      `## 🎯 BLUF`.
- [ ] Title contains at least one named actor + one news verb, and no
      literal date (§2.3).
- [ ] Description contains at least one concrete number / instrument /
      named actor (§3.1).

---

## 7 · Change log

| Date       | Change                                                      | Author   |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-04-24 | Initial contract (PR 1 of the 5-PR SEO rescue plan)         | Copilot  |

<!-- End of contract -->
