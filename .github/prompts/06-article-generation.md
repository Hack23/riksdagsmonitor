# 06 — Article Generation

Articles derive from analysis. Scripts produce HTML scaffolding; the AI writes every word of analytical content.

## Preconditions

- Module `05-analysis-gate.md` has passed.
- Every core analysis artifact has been read back in full in this run.

## Pre-flight: required analysis artifacts

Before any article section is drafted, the writer MUST have opened and read **every** artifact below from `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`:

| Workflow class | Required artifacts | Gate checks that enforce citation |
|----------------|---------------------|------------------------------------|
| All workflows (single-type + Tier-C) | **23 artifacts** — Family A (9) + B (2) + C (5) + D (7) per `04-analysis-pipeline.md` §"23 required artifacts" | `05-analysis-gate.md` **check 1** (all 23 present), **check 2** (per-document coverage — one `{dok_id}-analysis.md` per manifest entry), **check 4** (evidence cites `dok_id` / primary-source URL), **check 5** (Mermaid + colour-coded style on all synthesis files), **check 7** (Family C structure — BLUF, ≥ 3 Key Judgments, ≥ 3 scenarios, ≥ 3 ACH hypotheses, ICD 203 audit, ≥ 2 comparators), **check 8** (Family D structure — ≥ 10 forward indicators, coalition seat table) |
| Tier-C aggregation (`news-evening-analysis`, `news-weekly-review`, `news-monthly-review`, `news-week-ahead`, `news-month-ahead`, `news-realtime-monitor`, `news-article-generator` deep-inspection) | Same 23 artifacts **plus** Tier-C depth multipliers and cross-type synthesis — see `ext/tier-c-aggregation.md` | All single-type checks **plus** Tier-C sibling-citation check (cross-type citations in `cross-reference-map.md`) |

If any required artifact is missing or empty, do **not** proceed to step 1 below — return to `04-analysis-pipeline.md` and produce it.

## Generation steps

1. **Invoke the script** (HTML scaffold only):

   ```
   npx tsx scripts/generate-news-enhanced.ts \
     --date "$ARTICLE_DATE" \
     --type "$ARTICLE_TYPE" \
     --languages "$CORE_LANGUAGES"   # always "en,sv" for automated workflows
   ```

2. **Read pre-computed analysis — ALL 23 artifacts, in full — before filling any section.** The analysis folder is the *only* knowledge source for article prose; the HTML scaffold and MCP data are scaffolding, not content. Skipping a read forfeits AI-FIRST (`00-base-contract.md` rule 5) and produces the boilerplate-default output observed in past failed runs.

   **Mandatory read-back order** (read each file end-to-end, do not skim):

   1. `README.md` → scope + file index
   2. `data-download-manifest.md` → authoritative `dok_id` list (the article MUST NOT cite any `dok_id` outside this list)
   3. `synthesis-summary.md` → lead story, DIW ranking, §"AI-Recommended Article Metadata"
   4. `executive-brief.md` → BLUF, Key Judgments
   5. `significance-scoring.md` → ranked items
   6. `classification-results.md` → classification + confidence levels (article confidence language must match)
   7. `swot-analysis.md` → Strengths / Weaknesses / Opportunities / Threats quadrants
   8. `risk-assessment.md` + `threat-analysis.md` → strategic-context section
   9. `stakeholder-perspectives.md` → Winners & Losers (named actors only)
   10. `scenario-analysis.md` → ≥ 3 scenarios for the "What to Watch" section
   11. `comparative-international.md` → ≥ 2 comparators for context paragraphs
   12. `devils-advocate.md` → counter-argument paragraph
   13. `intelligence-assessment.md` → ≥ 3 ACH hypotheses, ICD 203 confidence
   14. `methodology-reflection.md` → known limitations footnote
   15. `election-2026-analysis.md` + `coalition-mathematics.md` + `voter-segmentation.md` → Election 2026 lens paragraph (mandatory in every article)
   16. `historical-parallels.md` → context paragraph
   17. `media-framing-analysis.md` → framing-awareness paragraph
   18. `implementation-feasibility.md` → What This Means-style sections
   19. `forward-indicators.md` → ≥ 10 forward indicators for Key Takeaways / What to Watch
   20. `cross-reference-map.md` → cross-document links inside the article
   21. `documents/<dok_id>-analysis.md` for **every** `dok_id` in the manifest → per-document "Why it matters"

   **Read-back evidence log (required).** Produce this log in the run output before drafting any article prose; each line is the first ≤ 120-char non-empty line of the artifact, proving the file was actually opened:

   ```bash
   ART_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
   echo "📖 Read-back evidence log ($(date -u '+%Y-%m-%dT%H:%M:%SZ')):"
   for f in README.md data-download-manifest.md synthesis-summary.md executive-brief.md \
            significance-scoring.md classification-results.md swot-analysis.md \
            risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
            scenario-analysis.md comparative-international.md devils-advocate.md \
            intelligence-assessment.md methodology-reflection.md \
            election-2026-analysis.md voter-segmentation.md coalition-mathematics.md \
            historical-parallels.md media-framing-analysis.md \
            implementation-feasibility.md forward-indicators.md cross-reference-map.md; do
     if [ -s "$ART_DIR/$f" ]; then
       FIRST=$(grep -m1 -v '^[[:space:]]*$' "$ART_DIR/$f" | head -c 120)
       echo "  ✅ $f — $FIRST"
     else
       echo "  ❌ $f MISSING/EMPTY — abort, return to 04-analysis-pipeline.md"
       exit 1
     fi
   done
   for doc in "$ART_DIR"/documents/*.md; do
     [ -s "$doc" ] && echo "  ✅ $(basename "$doc") — $(grep -m1 -v '^[[:space:]]*$' "$doc" | head -c 120)"
   done
   ```

   The log is an auditable record — a run without it is treated as "analysis not read" and the article MUST be rewritten.

   **Map article sections → analysis files:**

   | Article section | Sourced from |
   |-----------------|--------------|
   | Analytical lede | `synthesis-summary.md` (lead story + DIW ranking) |
   | Per-document "Why it matters" | `documents/<dok_id>-analysis.md` |
   | Winners & losers | `stakeholder-perspectives.md` |
   | Key takeaways | `significance-scoring.md` top items |
   | Strategic context | `risk-assessment.md` + `threat-analysis.md` |
   | Election 2026 lens | `election-2026-analysis.md` + `coalition-mathematics.md` + `voter-segmentation.md` |
   | What to Watch / forward | `forward-indicators.md` + `scenario-analysis.md` |
   | Comparative context | `comparative-international.md` + `historical-parallels.md` |
   | Counter-argument footnote | `devils-advocate.md` + `methodology-reflection.md` |
   | Economic context | `economic-data.json` + commentary paragraph |
   | SEO title / meta description | `synthesis-summary.md` §"AI-Recommended Article Metadata" |
   | Analysis references block | Hand-written footer linking to the 23 analysis files on GitHub — at minimum: `executive-brief.md`, `synthesis-summary.md`, `intelligence-assessment.md`, `scenario-analysis.md`, `risk-assessment.md`, `forward-indicators.md` (see "Mandatory sections" below) |

3. **Replace every `AI_MUST_REPLACE` marker** with evidence-cited analysis. Note: `05-analysis-gate.md` **check 3** only scans `$ANALYSIS_DIR` — it does **not** scan generated HTML. The article-side gate in step 5 below is the only mechanism that blocks unresolved markers from reaching the PR, so it is mandatory.

4. **Article Pass 2** — AI-FIRST principle applies (see `00-base-contract.md` rule 5). Read every generated article HTML back in full. Improve: tighten lede, strengthen quotes, expand stakeholder coverage, replace boilerplate sentences, verify every `dok_id` reference resolves. Minimum 8 minutes.

5. **Pre-commit article gate (MANDATORY, hard-blocking).** Before staging any article for commit, run **all three** sub-checks. Any non-zero exit MUST abort — do NOT hand-edit offending text to bypass the gate; return to step 2 and rewrite from analysis.

   **5a. Banned patterns + unresolved markers** (all languages):

   ```bash
   # Collect today's article HTML across both legacy (news/$DATE-*.html) and
   # dated-folder (news/$YYYY/$MM/$DD/*.html) layouts.
   YYYY="${ARTICLE_DATE%%-*}"; REST="${ARTICLE_DATE#*-}"; MM="${REST%%-*}"; DD="${REST#*-}"
   mapfile -t ARTICLES < <(
     { ls news/${ARTICLE_DATE}-*.html 2>/dev/null; ls news/${YYYY}/${MM}/${DD}/*.html 2>/dev/null; } \
     | sort -u
   )
   [ "${#ARTICLES[@]}" -gt 0 ] || { echo "❌ No article files found for $ARTICLE_DATE"; exit 1; }
   npx tsx scripts/check-banned-patterns.ts "${ARTICLES[@]}"
   GATE_EXIT=$?
   if [ "$GATE_EXIT" -ne 0 ]; then
     echo "❌ Article gate 5a failed: $GATE_EXIT file(s) contain unresolved AI_MUST_REPLACE markers or banned patterns"
     exit 1
   fi
   ```

   **5b. Manifest/citation consistency** — every `dok_id` cited in the article must exist in the analysis `documents/` folder:

   ```bash
   CITED=$(grep -hoE 'H[A-Z0-9]{2}[A-Z]{2,}[0-9]+' "${ARTICLES[@]}" | sort -u)
   for d in $CITED; do
     if ! ls "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/${d}"*.md >/dev/null 2>&1; then
       echo "❌ Article cites $d but no documents/${d}*.md exists in $SUBFOLDER/"
       exit 1
     fi
   done
   ```

   **5c. Language purity (HARD block for English articles).** English must contain **zero** untranslated Swedish tokens outside of proper nouns wrapped in `<span lang="sv">…</span>`. Swedish articles likewise must not contain untranslated English prose (English is allowed only in proper-noun spans, code, URLs, and unavoidable technical terms):

   ```bash
   # 5c.i — English articles: zero Swedish leakage (threshold: 1)
   mapfile -t EN_ARTICLES < <(printf '%s\n' "${ARTICLES[@]}" | grep -E '(-en\.html|\.en\.html)$' || true)
   if [ "${#EN_ARTICLES[@]}" -gt 0 ]; then
     if ! npx tsx scripts/detect-swedish-leakage.ts --dir "$(dirname "${EN_ARTICLES[0]}")" --threshold 1 2>&1 | tee /tmp/sv-leak.log; then
       # Filter the log to today's articles only — the script scans the whole dir.
       if grep -E "$(basename "${EN_ARTICLES[0]%-*}")" /tmp/sv-leak.log | grep -q '❌'; then
         echo "❌ Article gate 5c.i failed: English article contains untranslated Swedish tokens"
         echo "   Translate the offending lines — do NOT ship Swedish text in EN articles."
         exit 1
       fi
     fi
   fi

   # 5c.ii — Non-Swedish articles must declare the correct lang attribute on <html>.
   for a in "${ARTICLES[@]}"; do
     LANG_CODE=$(basename "$a" | sed -E 's/.*-([a-z]{2})\.html$/\1/; s/.*\.([a-z]{2})\.html$/\1/')
     DECL=$(grep -oE '<html[^>]*lang="[a-z-]+"' "$a" | head -1 | grep -oE 'lang="[a-z-]+"' | head -1)
     EXPECTED="lang=\"$LANG_CODE\""
     [ "$LANG_CODE" = "no" ] && EXPECTED="lang=\"nb\""
     if [ -n "$DECL" ] && [ "$DECL" != "$EXPECTED" ]; then
       echo "❌ Article gate 5c.ii failed: $a has $DECL but filename implies $EXPECTED"
       exit 1
     fi
   done
   ```

   This gate catches the exact failure modes observed in past runs: unresolved `<!-- AI_MUST_REPLACE: ... -->` HTML comments, `by Unknown` author fallbacks, `dok_id`s that have no analysis artifact, and raw Swedish `<p>…</p>` blocks (e.g. verbatim `riksdagen.se` dumps) surviving into English articles.

## Mandatory sections (per article)

- Headline (60–80 chars, analysis-driven).
- Meta description (150–160 chars, no boilerplate).
- Analytical lede (2–3 sentences).
- ≥ 1 per-document "Why it matters" section citing `dok_id`.
- Winners & losers with named actors.
- Strategic context with explicit risk or threat reference.
- Election 2026 lens paragraph (every article, even single-type).
- Analysis & sources block linking to the 23 analysis files on GitHub (Families A+B+C+D), with direct callouts to `executive-brief.md`, `intelligence-assessment.md`, and `scenario-analysis.md`.

## Banned patterns (zero tolerance)

| Pattern | Example |
|---------|---------|
| Unresolved scaffold markers | Any `<!-- AI_MUST_REPLACE: * -->` comment in committed HTML. Blocked by step 5a pre-commit gate. |
| Section-name title leakage | Headlines built by concatenating section names, e.g. "X: What Happened, Timeline & Context, Why This Matters". |
| Manifest drift | Citing a `dok_id` in the article that has no matching `documents/<dok_id>-analysis.md` artifact. Blocked by step 5b. |
| Unresolved author fallback | `by Unknown`, `Author: Unknown` — the scaffold's default placeholder, never a valid shipped value. |
| Raw upstream HTML dump | Pasting raw `<p>…</p>` from `riksdagen.se` into the article body in place of original analysis. |
| Swedish leakage in EN | Any untranslated Swedish token (`betänkande`, `utskott`, `riksdag(en)`, `regering(en)`, `motion`, `proposition`, Swedish stop words `och/att/är/inte/…`) outside a `<span lang="sv">…</span>` proper-noun wrapper. Blocked by step 5c.i. |
| English leakage in SV | English sentences in a Swedish article body where a Swedish equivalent exists (exceptions: quoted proper nouns, code, URLs, wrapped `<span lang="en">…</span>`). |
| Wrong `<html lang>` attribute | EN article declares `lang="sv"` or vice versa. Blocked by step 5c.ii. |
| Boilerplate filler | "This is an important development that will have significant implications." |
| Unattributed claims | "Experts say…", "Critics argue…" without named actor. |
| Title-only summaries | Re-stating the document title as the analysis. |
| Generic stakeholders | "The opposition", "Voters" without specific parties / groups. |
| Confidence mismatch | Article claims "high confidence" while analysis files state "low". |
| Committee-code boilerplate repetition | Same "What This Means" paragraph repeated across every doc in the same committee — guaranteed proof that `documents/<dok_id>-analysis.md` was not read. |

## Visualisation

- Every chart container in the HTML must have a matching JSON file next to the analysis artifacts.
- Charts follow the specs in [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) and [`analysis/templates/`](../../analysis/templates/).

## Translations

- Automated article workflows produce only core languages (`en,sv`).
- Remaining 12 languages are dispatched to `news-translate` via `dispatch-workflow`.
- `news-translate` consumes completed articles; it never generates original analysis.

## Quality floor

Each article ≥ 1000 words, minimum 3 of 5 mandatory analytical sections present, ≥ 3 `dok_id` references. Below any of these = rewrite before commit.

## Next step

Run the **phase checkpoint** from `00-base-contract.md` with label `phase-06-article` to persist the generated articles to repo memory. Then stage all analysis + article + visualisation files, and call `07-commit-and-pr.md`.
