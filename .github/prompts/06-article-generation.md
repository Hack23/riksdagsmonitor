# 06 — Article Generation

Articles derive from analysis. Scripts produce HTML scaffolding; the AI writes every word of analytical content.

## Preconditions

- Module `05-analysis-gate.md` has passed.
- Every core analysis artifact has been read back in full in this run.

## Pre-flight: required analysis artifacts

Before any article section is drafted, the writer MUST have opened and read **every** file committed to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` — not a fixed list.

| Workflow class | Minimum baseline | What the writer actually reads | Gate checks |
|----------------|-------------------|--------------------------------|-------------|
| All workflows (single-type + Tier-C) | **≥ 23 artifacts** — Family A (9) + B (2) + C (5) + D (7) per `04-analysis-pipeline.md` §"23 required artifacts" | **All files** discovered under `$ANALYSIS_DIR/` by the read-back loop in step 2, including any additional `.md`, `.json`, `.csv`, `.yml`, `.txt` artifacts the pipeline produced | `05-analysis-gate.md` **check 1** (baseline present), **check 2** (per-document coverage — one `{dok_id}-analysis.md` per manifest entry), **check 4** (evidence cites `dok_id` / primary-source URL), **check 5** (Mermaid + colour-coded style on all synthesis files), **check 7** (Family C structure — BLUF, ≥ 3 Key Judgments, ≥ 3 scenarios, ≥ 3 ACH hypotheses, ICD 203 audit, ≥ 2 comparators), **check 8** (Family D structure — ≥ 10 forward indicators, coalition seat table) |
| Tier-C aggregation (`news-evening-analysis`, `news-weekly-review`, `news-monthly-review`, `news-week-ahead`, `news-month-ahead`, `news-realtime-monitor`, `news-article-generator` deep-inspection) | Same baseline **plus** Tier-C depth multipliers, cross-type synthesis, and every `ext/*.md` / sibling file — see `ext/tier-c-aggregation.md` | Same "read everything in the folder" rule — the recursive loop in step 2 picks up `ext/` siblings automatically | All single-type checks **plus** Tier-C sibling-citation check (cross-type citations in `cross-reference-map.md`) |

**The rule is "read everything under `$ANALYSIS_DIR`", NOT "read a fixed 23-file list".** The 23 (or 14 Tier-C) figure is the *minimum* baseline enforced by `05-analysis-gate.md`; real analysis folders routinely contain more (ext modules, JSON snapshots, data-download manifests, per-document memos, language-specific notes). Missing any committed file when drafting the article is a process failure.

If any required artifact is missing or empty, do **not** proceed to step 1 below — return to `04-analysis-pipeline.md` and produce it.

## Generation steps

1. **Invoke the script** (HTML scaffold only):

   ```
   npx tsx scripts/generate-news-enhanced.ts \
     --date "$ARTICLE_DATE" \
     --type "$ARTICLE_TYPE" \
     --languages "$CORE_LANGUAGES"   # always "en,sv" for automated workflows
   ```

2. **Read pre-computed analysis — EVERY artifact under `$ANALYSIS_DIR`, in full, before filling any section.** The analysis folder is the *only* knowledge source for article prose; the HTML scaffold and MCP data are scaffolding, not content. Skipping a read forfeits AI-FIRST (`00-base-contract.md` rule 5) and produces the boilerplate-default output observed in past failed runs.

   > ⚠️ **There is NO fixed artifact count.** The always-on minimum is 23 single-type / 14 Tier-C-aggregation (per `04-analysis-pipeline.md`), but additional artifacts (`ext/*.md`, extra `.md` / `.json` / `.csv` files dropped by workflow-specific pipelines, Tier-C sibling outputs, memo files, etc.) are always in scope. The rule is **"read everything in the folder"**, not "read a fixed list". Any file the prior analysis run committed into `$ANALYSIS_DIR` is evidence and MUST be read.

   **Discover-and-read-all contract** (applies to every run, including Tier-C, translate, realtime-monitor):

   1. Enumerate every non-empty file under `$ANALYSIS_DIR/` recursively — `.md`, `.json`, `.csv`, `.yml`, `.txt`, and any other extension committed by the analysis pipeline.
   2. Open each file end-to-end (do not skim, do not truncate) and extract the evidence needed by the article-section map below.
   3. Emit the read-back evidence log (next code block) into the run log. Missing or empty files abort the run.
   4. `data-download-manifest.md` is the authoritative `dok_id` allow-list; the article MUST NOT cite any `dok_id` outside this list.

   **Read-back evidence log (required, dynamic — no hard-coded file list).** Produce this log in the run output before drafting any article prose. Each line is the first ≤ 120-char non-empty line of the artifact, proving the file was actually opened. The loop discovers files from the filesystem — adding a new artifact in the pipeline automatically expands the read-back scope with zero prompt changes:

   ```bash
   ART_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
   [ -d "$ART_DIR" ] || { echo "❌ $ART_DIR missing — run 04-analysis-pipeline.md first"; exit 1; }

   # Recursively enumerate every committed artifact. Include all common analysis
   # extensions; exclude only scratch / lock / hidden files.
   mapfile -t ARTIFACTS < <(
     find "$ART_DIR" -type f \
       \( -name '*.md' -o -name '*.json' -o -name '*.csv' \
          -o -name '*.yml' -o -name '*.yaml' -o -name '*.txt' \) \
       ! -name '.*' ! -name '*.lock' ! -name '*.tmp' \
       | sort
   )
   TOTAL=${#ARTIFACTS[@]}
   [ "$TOTAL" -ge 23 ] || { echo "❌ Only $TOTAL artifacts under $ART_DIR — minimum 23 (see 04-analysis-pipeline.md)"; exit 1; }

   echo "📖 Read-back evidence log ($(date -u '+%Y-%m-%dT%H:%M:%SZ')) — $TOTAL artifact(s):"
   READ_COUNT=0
   EMPTY_COUNT=0
   for f in "${ARTIFACTS[@]}"; do
     REL="${f#$ART_DIR/}"
     if [ -s "$f" ]; then
       FIRST=$(grep -m1 -v '^[[:space:]]*$' "$f" | head -c 120)
       echo "  ✅ $REL — $FIRST"
       READ_COUNT=$((READ_COUNT + 1))
     else
       echo "  ❌ $REL EMPTY — abort, return to 04-analysis-pipeline.md"
       EMPTY_COUNT=$((EMPTY_COUNT + 1))
     fi
   done
   [ "$EMPTY_COUNT" -eq 0 ] || { echo "❌ $EMPTY_COUNT empty artifact(s) — analysis incomplete"; exit 1; }
   echo "📖 Total artifacts read: $READ_COUNT / $TOTAL"

   # Verify Family A core-synthesis baseline (these nine are always required — see
   # 04-analysis-pipeline.md). Additional families (B/C/D/E/ext) are discovered by
   # the loop above; no need to hard-code them here.
   REQUIRED_CORE=(README.md executive-brief.md synthesis-summary.md significance-scoring.md \
                  classification-results.md swot-analysis.md risk-assessment.md \
                  threat-analysis.md stakeholder-perspectives.md data-download-manifest.md)
   for f in "${REQUIRED_CORE[@]}"; do
     [ -s "$ART_DIR/$f" ] || { echo "❌ Core artifact $f missing — cannot write article"; exit 1; }
   done
   ```

   The log is an auditable record — a run without it is treated as "analysis not read" and the article MUST be rewritten.

   **Section-to-artifact mapping** (guides where to look first; does NOT limit what to read — still read every file):

   - Analytical lede → `synthesis-summary.md` (lead story + DIW ranking)
   - Per-document "Why it matters" → `documents/<dok_id>-analysis.md`
   - Winners & losers → `stakeholder-perspectives.md`
   - Key takeaways → `significance-scoring.md` top items
   - Strategic context → `risk-assessment.md` + `threat-analysis.md`
   - SWOT callouts → `swot-analysis.md`
   - Classification + confidence language → `classification-results.md` + `intelligence-assessment.md`
   - Scenarios / What to Watch → `scenario-analysis.md` + `forward-indicators.md`
   - Comparative / historical context → `comparative-international.md` + `historical-parallels.md`
   - Election 2026 lens (mandatory) → `election-2026-analysis.md` + `coalition-mathematics.md` + `voter-segmentation.md`
   - Media framing awareness → `media-framing-analysis.md`
   - Feasibility / implementation → `implementation-feasibility.md`
   - Counter-argument + limitations → `devils-advocate.md` + `methodology-reflection.md`
   - Cross-document links → `cross-reference-map.md`
   - Tier-C sibling synthesis → any `ext/*.md` files
   - Economic context → `economic-data.json` or any `*.json` / `*.csv` data snapshots committed in the folder

   - Analysis references footer → link to every file in `$ART_DIR/` on GitHub (all discovered artifacts — at minimum `executive-brief.md`, `synthesis-summary.md`, `intelligence-assessment.md`, `scenario-analysis.md`, `risk-assessment.md`, `forward-indicators.md`; see "Mandatory sections" below)

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

   **5c. Language purity (HARD block for non-Swedish articles).** A non-Swedish article must contain **zero** untranslated Swedish tokens — including inside `<span lang="sv">…</span>` wrappers, which are themselves banned in non-SV articles. Translate every party name, ministry, agency, statute, document subtitle and descriptive concept to the target language using the canonical equivalents listed under "Banned patterns → Swedish leakage in EN" below. A single first-occurrence parenthetical Swedish gloss in plain text (e.g. "the Swedish Social Insurance Agency (Försäkringskassan)") is the **only** permitted Swedish surface in the article body, and even that must not be wrapped in `<span lang="sv">`. Swedish articles likewise must not contain untranslated English prose (English is allowed only in proper-noun spans, code, URLs, and unavoidable technical terms). The pre-commit gate runs the leakage detector at threshold 1 and additionally rejects any `<span lang="sv">` element found in a non-SV article:

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

   # 5c.ii — Non-Swedish articles must not contain any <span lang="sv"> wrapper.
   # The wrapper is itself banned (translate the content instead). lang="sv" /
   # hreflang="sv" attributes on <a> and <link> language-switcher elements are
   # legitimate and not flagged by this check, which is anchored to <span ...>.
   for a in "${ARTICLES[@]}"; do
     LANG_CODE=$(basename "$a" | sed -E 's/.*-([a-z]{2})\.html$/\1/; s/.*\.([a-z]{2})\.html$/\1/')
     [ "$LANG_CODE" = "sv" ] && continue
     if grep -nE '<span[^>]+lang="sv"' "$a" >/dev/null; then
       echo "❌ Article gate 5c.ii failed: $a contains <span lang=\"sv\"> — translate the content; the wrapper is banned in non-SV articles"
       grep -nE '<span[^>]+lang="sv"' "$a" | head -5
       exit 1
     fi
   done

   # 5c.iii — Non-Swedish articles must declare the correct lang attribute on <html>.
   for a in "${ARTICLES[@]}"; do
     LANG_CODE=$(basename "$a" | sed -E 's/.*-([a-z]{2})\.html$/\1/; s/.*\.([a-z]{2})\.html$/\1/')
     DECL=$(grep -oE '<html[^>]*lang="[a-z-]+"' "$a" | head -1 | grep -oE 'lang="[a-z-]+"' | head -1)
     EXPECTED="lang=\"$LANG_CODE\""
     [ "$LANG_CODE" = "no" ] && EXPECTED="lang=\"nb\""
     if [ -n "$DECL" ] && [ "$DECL" != "$EXPECTED" ]; then
       echo "❌ Article gate 5c.iii failed: $a has $DECL but filename implies $EXPECTED"
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
| Swedish leakage in EN (and any non-SV language) | **Zero Swedish text in non-Swedish articles.** This is a hard rule with **no `<span lang="sv">` exception** — wrapping Swedish prose in `<span lang="sv">` does not satisfy the rule and is itself banned. Every Swedish word, including party names, ministry names, agency names, statute titles, document subtitles, and descriptive concepts, **must be translated to the target language**. Use the established English equivalents (`Liberalerna` → "the Liberals (L)", `Moderaterna` → "the Moderates (M)", `Sverigedemokraterna` → "the Sweden Democrats (SD)", `Kristdemokraterna` → "the Christian Democrats (KD)", `Vänsterpartiet` → "the Left Party (V)", `Finansdepartementet` → "Ministry of Finance", `Justitiedepartementet` → "Ministry of Justice", `Polismyndigheten` → "the Swedish Police Authority", `Försäkringskassan` → "the Swedish Social Insurance Agency", `Riksgälden` → "the Swedish National Debt Office", `Finansinspektionen` → "the Swedish Financial Supervisory Authority", `Lagrådet` → "the Council on Legislation", `Riksbanken` → "the Riksbank", `Kriminalvården` → "the Swedish Prison and Probation Service", `Transportstyrelsen` → "the Swedish Transport Agency", `Bankföreningen` → "the Swedish Bankers' Association", `Advokatsamfundet` → "the Swedish Bar Association", `kontrollerat boende` → "controlled housing", `säkerhetsförvaring` → "security detention", `bostadstillägg` → "housing supplement", `aktivitetsersättning` → "activity compensation", `sjukersättning` → "sickness compensation", `betänkande` → "committee report", `utskott` → "committee", `motion` → "member's bill", `proposition` → "government bill", `skrivelse` → "government communication", `yttrande` → "(legal) opinion", `notering` → "noting", `Bilaga` → "Annex", `höstbudget` → "autumn budget", `valkretsar` → "constituencies", `Budgetlag` → "Budget Act", etc.). At most a single first-occurrence parenthetical Swedish gloss in plain text (e.g. "the Swedish Social Insurance Agency (Försäkringskassan)") is permitted to disambiguate the institution; do **not** wrap it in `<span lang="sv">`, do **not** repeat the gloss, and do **not** rely on it as a substitute for translation. Article-body prose, headings, lists, captions, JSON-LD `articleBody`, `alternativeHeadline`, breadcrumb names and analysis citations must all be in the target language. Swedish source URLs (`data.riksdagen.se/…`) and the `lang="sv"` / `hreflang="sv"` attributes on language-switcher links are the only legitimate Swedish tokens. Blocked by step 5c.i. |
| English leakage in SV | English sentences in a Swedish article body where a Swedish equivalent exists (exceptions: quoted proper nouns, code, URLs, wrapped `<span lang="en">…</span>`). |
| `<span lang="sv">` in any non-SV article | The wrapper is itself a banned construct in non-Swedish articles — it signals that the writer left Swedish source material untranslated. Translate the content; do not tag-and-leak. |
| Wrong `<html lang>` attribute | EN article declares `lang="sv"` or vice versa. Blocked by step 5c.iii. |
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
