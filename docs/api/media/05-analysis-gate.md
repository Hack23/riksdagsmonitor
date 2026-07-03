# 05 — Analysis Gate (single blocking gate)
This is the **only** gate separating analysis from article generation. If it fails, fix the analysis and re-run it. Never bypass.
## Inputs
- `$ANALYSIS_DIR = analysis/daily/$ARTICLE_DATE/$SUBFOLDER`
- 23 required artifacts (Families A + B + C + D from `04-analysis-pipeline.md`) + per-document Family E.
- Authoritative references: [`artifact-catalog.md`](../../analysis/methodologies/artifact-catalog.md) (source of truth), [`per-artifact-methodologies.md`](../../analysis/methodologies/per-artifact-methodologies.md) (Inputs / Analytic moves / Evidence rules / Anti-patterns), [`reference-quality-thresholds.json`](../../analysis/methodologies/reference-quality-thresholds.json) (line floors + tradecraft signals).
## Checks (all must pass)
1. **Artifact existence** — every Family A (9), B (2), C (5), D (7) artifact is present and non-empty. Catalogue: [`analysis/methodologies/artifact-catalog.md`](../../analysis/methodologies/artifact-catalog.md).
2. **Per-document coverage (Family E)** — `$ANALYSIS_DIR/documents/` contains one `.md` per `dok_id` listed in `data-download-manifest.md` (metadata-only documents are tagged, not skipped).
3. **No stubs** — zero occurrences of `AI_MUST_REPLACE`, `[REQUIRED]`, `TODO:`, or `Lorem ipsum` across all artifacts.
4. **Evidence citations** — `swot-analysis.md` and `significance-scoring.md` carry primary-source evidence per quadrant / ranked item. Accepted: a `dok_id` (e.g. `H901FiU1`) **or** a primary-source URL host (`riksdagen.se`, `regeringen.se`, `scb.se`, `statskontoret.se`, `worldbank.org`, `api.imf.org`, `data.imf.org`, `www.imf.org`). Enforced on SWOT `### Strengths/Weaknesses/Opportunities/Threats` bullets+rows and significance-scoring bullets, ranking-table rows, and Mermaid node labels.
5. **Mermaid diagrams** — every Family A and Family D synthesis file contains ≥ 1 Mermaid block with colour-coded `style` directives (or `themeVariables` / `%%{init …}`).
6. **Pass-2 done** — every enforced Pass-2 artifact (all Family A/B/C/D except `data-download-manifest.md`) shows mtime > birth + 3 min, OR has a differing `pass1/` snapshot on disk.
7. **Family C structure** — `executive-brief.md` has `## BLUF` + `## Decisions` **and** a publishable story-oriented H1 (blocks `REPLACE THIS H1`, `Executive Brief Template`, `AI_MUST_REPLACE`, `AI-generated political intelligence`, and bare-boilerplate `# Executive Brief`); the H1 ships as the SERP `<title>`/`og:title`/JSON-LD `headline`/sitemap card across all 14 languages — see [`analysis/methodologies/per-artifact-methodologies.md#executive-brief`](../../analysis/methodologies/per-artifact-methodologies.md#executive-brief) and [`.github/prompts/seo-metadata-contract.md`](./seo-metadata-contract.md). `intelligence-assessment.md` declares ≥ 3 Key Judgments with ≥ 3 confidence labels (`VERY HIGH`/`HIGH`/`MEDIUM`/`LOW`/`VERY LOW`) and ≥ 1 PIR reference; `scenario-analysis.md` ≥ 3 scenarios; `comparative-international.md` comparator set or ≥ 2 comparator rows; `devils-advocate.md` ≥ 3 ACH hypotheses; `methodology-reflection.md` non-empty + ICD 203 audit or ≥ 3 named improvements + literal `Pass-2 status: executed in full` (never `skipped` / `deferred` / `partial`). When `IMPROVEMENT_MODE=true`, the file MUST include `## Re-run log` with canonical fields `run_id`, `attempt`, `new dok_ids`, `artifacts extended`, `flags closed`, `vintage refresh`.
8. **Family D structure** — `forward-indicators.md` ≥ 10 dated indicators; `coalition-mathematics.md` has a seat-count / vote-breakdown table; `implementation-feasibility.md` carries a `statskontoret.se` URL or `none found` in the `Statskontoret relevance` row whenever it names a recognised agency (Kriminalvården, Polismyndigheten, Försäkringskassan, Skatteverket, Migrationsverket, Arbetsförmedlingen, Socialstyrelsen, Transportstyrelsen, Trafikverket, Naturvårdsverket, Energimyndigheten).
9. **PIR status sidecar** — `pir-status.json` is present and valid per [`schemas/pir-status.schema.json`](../../schemas/pir-status.schema.json) v1.0 so open PIRs can roll forward.
10. **Top-2 full-text availability** — when `data-download-manifest.md` contains a `## Full-Text Fetch Outcomes` table, ≥ 2 top documents must have `full_text_available=true`. Add `<!-- full-text-fallback: <reason> -->` to bypass.
11. **Supplementary artifacts** — see §Supplementary checks (blocking for aggregation/Tier-C/multi-run).
12. **Editorial QA gate** — after aggregation, run `npx tsx scripts/validate-article.ts $ANALYSIS_DIR/article.md` (enforces banned-phrase scan, citation density per `reference-quality-thresholds.json → aiFirst.citationDensity.perArticle`, and `economicProvenance` ≤ 6-month vintage unless wrapped in `<!-- stale-vintage: reason -->`). See `validate-article.ts` checks 7–9.
13. **Analysis language** — all analysis artifacts (excluding `executive-brief_<lang>.md`) must be authored in English. Run `npx tsx scripts/check-analysis-language.ts $ANALYSIS_DIR`; fails when Swedish-marker density > 5 % AND ≥ 5 markers.
## Implementation
> ⏱  **Time-budget telemetry (mandatory).** Print `agent_minute` before the gate begins so an over-budget run can be detected immediately. Target `agent_minute ≤ 36` at gate start (see `00-base-contract.md §Session timing → Phase budget`). If `agent_minute ≥ 40` at this point, prioritise: run the gate, accept first-pass result, proceed straight to aggregate+render+PR — do **not** loop on gate fixes past minute 40.
>
> ```bash
> AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch 2>/dev/null || date -u +%s)"
> ELAPSED_MIN=$(( ($(date -u +%s) - AGENT_START_EPOCH) / 60 ))
> echo "⏱  gate-entry agent_minute=$ELAPSED_MIN  remaining_to_pr_deadline=$(( 45 - ELAPSED_MIN )) min"
> ```
No dedicated validator script exists yet — implement the checks as an inline bash gate. Full implementation (covers checks 1–13, plus conditional check 9b where applicable). Check 12 invokes `scripts/validate-article.ts` when `article.md` is already present (after aggregation); Check 13 invokes `scripts/check-analysis-language.ts`:
```bash
set -Eeuo pipefail
: "${ARTICLE_DATE:?ARTICLE_DATE must be set}"
: "${SUBFOLDER:?SUBFOLDER must be set}"
ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
[ -d "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR does not exist: $ANALYSIS_DIR"; exit 1; }
DOK_RE='[Hh][A-Za-z0-9]{3,}[0-9]+'
EVIDENCE_RE='[Hh][A-Za-z0-9]{3,}[0-9]+|riksdagen\.se|regeringen\.se|scb\.se|statskontoret\.se|worldbank\.org|api\.imf\.org|data\.imf\.org|www\.imf\.org'
FAIL=0
# Materialise required-file lists via /tmp (AWF sandbox forbids inline bash arrays; see 01-bash-and-shell-safety.md).
GATE_REQ_LIST="/tmp/gate-req-$$"; GATE_PASS2_LIST="/tmp/gate-pass2-$$"
GATE_SYNTH_LIST="/tmp/gate-synth-$$"; GATE_DOK_LIST="/tmp/gate-doks-$$"
trap 'rm -f "$GATE_REQ_LIST" "$GATE_PASS2_LIST" "$GATE_SYNTH_LIST" "$GATE_DOK_LIST"' EXIT

write_list() { local out="$1"; shift; printf '%s\n' "$@" > "$out"; }

write_list "$GATE_REQ_LIST" \
  README.md executive-brief.md synthesis-summary.md significance-scoring.md classification-results.md \
  swot-analysis.md risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
  data-download-manifest.md cross-reference-map.md \
  scenario-analysis.md comparative-international.md devils-advocate.md intelligence-assessment.md methodology-reflection.md \
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md historical-parallels.md \
  media-framing-analysis.md implementation-feasibility.md forward-indicators.md

write_list "$GATE_SYNTH_LIST" \
  synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
  significance-scoring.md classification-results.md cross-reference-map.md executive-brief.md \
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md historical-parallels.md \
  media-framing-analysis.md implementation-feasibility.md forward-indicators.md

# data-download-manifest.md may legitimately be unchanged at Pass 2 — excluded.
write_list "$GATE_PASS2_LIST" \
  synthesis-summary.md swot-analysis.md risk-assessment.md threat-analysis.md stakeholder-perspectives.md \
  significance-scoring.md classification-results.md cross-reference-map.md executive-brief.md README.md \
  scenario-analysis.md comparative-international.md devils-advocate.md intelligence-assessment.md methodology-reflection.md \
  election-2026-analysis.md voter-segmentation.md coalition-mathematics.md historical-parallels.md \
  media-framing-analysis.md implementation-feasibility.md forward-indicators.md

# Check 1 — artifact existence (all 23)
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ missing/empty: $f"; FAIL=1; }
done < "$GATE_REQ_LIST"

# Check 2 — per-document coverage against manifest (avoid process substitution per 01-bash-and-shell-safety.md).
if [ -s "$ANALYSIS_DIR/data-download-manifest.md" ]; then
  grep -oE "$DOK_RE" "$ANALYSIS_DIR/data-download-manifest.md" | sort -u > "$GATE_DOK_LIST"
  DOK_COUNT=$(wc -l < "$GATE_DOK_LIST" | tr -d ' ')
  [ "${DOK_COUNT:-0}" -gt 0 ] || { echo "❌ manifest has no dok_id entries"; FAIL=1; }
  while IFS= read -r d; do
    [ -z "$d" ] && continue
    d_lc="${d,,}"
    if [ ! -s "$ANALYSIS_DIR/documents/${d}.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d}-analysis.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d_lc}.md" ] \
       && [ ! -s "$ANALYSIS_DIR/documents/${d_lc}-analysis.md" ]; then
      echo "❌ documents/${d}.md or documents/${d}-analysis.md missing (any case)"
      FAIL=1
    fi
  done < "$GATE_DOK_LIST"
fi

# Check 3 — no stubs
grep -rIn -e 'AI_MUST_REPLACE' -e '\[REQUIRED\]' -e 'TODO:' -e 'Lorem ipsum' "$ANALYSIS_DIR" \
  && { echo "❌ stub placeholders detected"; FAIL=1; }

# Check 4 — evidence citations per quadrant / ranked item (dok_id OR primary-source URL)
awk -v re="$EVIDENCE_RE" '
  function reset_table() { trow=0 }
  /^###[[:space:]]+.*(Strengths|Weaknesses|Opportunities|Threats)\b/ { sec=$0; reset_table(); next }
  /^#{1,6}[[:space:]]+/ { sec=""; reset_table(); next }
  sec != "" && /^[[:space:]]*[-*][[:space:]]+/ && $0 !~ re {
    printf "❌ swot-analysis.md %s: bullet missing evidence (dok_id or primary-source URL): %s\n", sec, $0; bad=1; next
  }
  sec != "" && /^[[:space:]]*\|/ {
    if ($0 ~ /^[[:space:]|:\-]+$/) next
    trow++
    if (trow == 1) next
    if ($0 !~ re) {
      printf "❌ swot-analysis.md %s: table row missing evidence (dok_id or primary-source URL): %s\n", sec, $0; bad=1
    }
    next
  }
  sec != "" && /^[[:space:]]*$/ { reset_table(); next }
  END { exit bad+0 }
' "$ANALYSIS_DIR/swot-analysis.md" || FAIL=1

awk -v re="$EVIDENCE_RE" '
  function reset_table() { trow=0 }
  /^```mermaid[[:space:]]*$/ { in_mermaid=1; reset_table(); next }
  in_mermaid && /^```[[:space:]]*$/ { in_mermaid=0; next }
  !in_mermaid && /^[[:space:]]*([0-9]+\.[[:space:]]+|[-*][[:space:]]+)/ && $0 !~ re {
    printf "❌ significance-scoring.md ranked item missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1; next
  }
  !in_mermaid && /^[[:space:]]*\|/ {
    if ($0 ~ /^[[:space:]|:\-]+$/) next
    trow++
    if (trow == 1) next
    if ($0 !~ re) {
      printf "❌ significance-scoring.md ranking table row missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1
    }
    next
  }
  !in_mermaid && /^[[:space:]]*$/ { reset_table(); next }
  in_mermaid {
    if ($0 ~ /^[[:space:]]*(%%|style\b|classDef\b|class\b|linkStyle\b|subgraph\b|end\b|graph\b|flowchart\b|quadrantChart\b|mindmap\b|timeline\b|journey\b|gantt\b|pie\b|xychart-beta\b|sequenceDiagram\b|stateDiagram(-v2)?\b|erDiagram\b|sankey-beta\b|gitGraph\b|requirementDiagram\b|block-beta\b)/) next
    if ($0 ~ /[\[\(\{][^][(){}]+[\]\)\}]/ && $0 !~ re) {
      printf "❌ significance-scoring.md Mermaid ranked item missing evidence (dok_id or primary-source URL): %s\n", $0; bad=1
    }
    next
  }
  END { exit bad+0 }
' "$ANALYSIS_DIR/significance-scoring.md" || FAIL=1

# Check 5 — Mermaid + colour-coded config on core synthesis + key extension files
while IFS= read -r f; do
  [ -z "$f" ] && continue
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  grep -qE '^```mermaid' "$p" || { echo "❌ $f: missing Mermaid block"; FAIL=1; }
  if ! grep -qE '^[[:space:]]*style[[:space:]]+' "$p" \
     && ! grep -qE 'themeVariables|%%\{[[:space:]]*init' "$p"; then
    echo "❌ $f: missing Mermaid colour-coded config (no 'style …' directive and no 'themeVariables' / '%%{init …}' block)"
    FAIL=1
  fi
done < "$GATE_SYNTH_LIST"

# Check 6 — Pass-2 evidence (mtime ≥ birth + 180s, OR differing pass1 snapshot on disk)
while IFS= read -r f; do
  [ -z "$f" ] && continue
  p="$ANALYSIS_DIR/$f"; [ -s "$p" ] || continue
  ok=0
  B=$(stat -c %W "$p" 2>/dev/null || echo 0)
  M=$(stat -c %Y "$p" 2>/dev/null || echo 0)
  [ "${B:-0}" -gt 0 ] && [ "${M:-0}" -ge $((B + 180)) ] && ok=1
  [ -s "$ANALYSIS_DIR/pass1/$f" ] && ! cmp -s "$ANALYSIS_DIR/pass1/$f" "$p" && ok=1
  [ "$ok" -eq 1 ] || { echo "❌ $f: Pass-2 evidence missing (mtime<birth+180s and no pass1/ snapshot)"; FAIL=1; }
done < "$GATE_PASS2_LIST"

# Check 7 — Family C structure
if [ -s "$ANALYSIS_DIR/executive-brief.md" ]; then
  grep -qE '^##[[:space:]].*BLUF' "$ANALYSIS_DIR/executive-brief.md" \
    || { echo "❌ executive-brief.md: missing '## BLUF' section"; FAIL=1; }
  grep -qE '^##[[:space:]].*(Decision|Decisions[[:space:]]+This[[:space:]]+Brief)' "$ANALYSIS_DIR/executive-brief.md" \
    || { echo "❌ executive-brief.md: missing 'Decisions' section"; FAIL=1; }
  # H1 quality scan — ships as <title>/og:title/JSON-LD headline/sitemap card across 14 languages.
  EB_H1="$(grep -m1 -E '^#[[:space:]]+' "$ANALYSIS_DIR/executive-brief.md" || true)"
  if [ -z "$EB_H1" ]; then
    EB_H1="$(grep -m1 -oE '<h1[^>]*>[^<]+</h1>' "$ANALYSIS_DIR/executive-brief.md" || true)"
  fi
  if [ -n "$EB_H1" ]; then
    EB_H1_LOWER="$(printf '%s' "$EB_H1" | tr '[:upper:]' '[:lower:]')"
    case "$EB_H1_LOWER" in
      *replace\ this\ h1*|*replace*this*h1*)
        echo "❌ executive-brief.md: H1 still contains 'REPLACE THIS H1' placeholder — write a story-oriented publishable title (see methodology #executive-brief)"; FAIL=1 ;;
      *executive\ brief\ template*)
        echo "❌ executive-brief.md: H1 still says 'Executive Brief Template' — replace with a publishable title"; FAIL=1 ;;
      *ai_must_replace*|*ai-must-replace*)
        echo "❌ executive-brief.md: H1 contains AI_MUST_REPLACE stub marker"; FAIL=1 ;;
      *ai-generated\ political\ intelligence*)
        echo "❌ executive-brief.md: H1 contains banned phrase 'AI-generated political intelligence'"; FAIL=1 ;;
    esac
    # Strip leading H1 marker + emoji/whitespace + trailing dashes to detect bare-boilerplate `# Executive Brief`.
    EB_H1_PLAIN="$(printf '%s' "$EB_H1_LOWER" \
      | sed -E 's/^#[[:space:]]+//' \
      | sed -E 's/<[^>]+>//g' \
      | sed -E 's/^[^[:alnum:]]+//' \
      | sed -E 's/[[:space:]—–-]+$//')"
    if [ "$EB_H1_PLAIN" = "executive brief" ] || [ -z "$EB_H1_PLAIN" ]; then
      echo "❌ executive-brief.md: H1 is bare boilerplate ('Executive Brief') — write a publishable story-oriented title (actor + active verb + instrument or number)"
      FAIL=1
    fi
    # Date-in-H1 guard (seo-metadata-contract.md §2.1) — mirrors scripts/agentic/analysis-gate.ts checkExecutiveBrief.
    EB_H1_TEXT="$(printf '%s' "$EB_H1" \
      | sed -E 's/^#[[:space:]]+//' \
      | sed -E 's/<[^>]+>//g')"
    if printf '%s' "$EB_H1_TEXT" | grep -qE '[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}'; then
      echo "❌ executive-brief.md: H1 contains a literal ISO date (YYYY-MM-DD) — dates belong in article:published_time, not the SERP <title>"
      FAIL=1
    elif printf '%s' "$EB_H1_LOWER" | grep -qE '[0-9]{1,2}[[:space:]]+(january|february|march|april|may|june|july|august|september|october|november|december)[[:space:]]+[0-9]{4}'; then
      echo "❌ executive-brief.md: H1 contains a literal English long-form date — dates belong in article:published_time, not the SERP <title>"
      FAIL=1
    elif printf '%s' "$EB_H1_LOWER" | grep -qE '(january|february|march|april|may|june|july|august|september|october|november|december)[[:space:]]+[0-9]{1,2}(,[[:space:]]*[0-9]{4})?'; then
      echo "❌ executive-brief.md: H1 contains a literal English long-form date (US order: 'May 15, 2026') — dates belong in article:published_time, not the SERP <title>"
      FAIL=1
    elif printf '%s' "$EB_H1_LOWER" | grep -qE '[0-9]{1,2}[[:space:]]+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)[[:space:]]+[0-9]{4}'; then
      echo "❌ executive-brief.md: H1 contains a literal Swedish long-form date — dates belong in article:published_time, not the SERP <title>"
      FAIL=1
    fi
    # Trailing-punctuation / dangling-connector guard — H1 must be a complete grammatical phrase.
    EB_H1_TRIM="$(printf '%s' "$EB_H1_TEXT" | sed -E 's/[[:space:]]+$//')"
    case "$EB_H1_TRIM" in
      *,|*\;|*:|*—|*–|*-)
        echo "❌ executive-brief.md: H1 ends with dangling punctuation (',' / ';' / ':' / '—' / '–' / '-') — complete the headline or remove the trailing marker"
        FAIL=1 ;;
    esac
    EB_H1_TRIM_LOWER="$(printf '%s' "$EB_H1_TRIM" | tr '[:upper:]' '[:lower:]')"
    if printf '%s' "$EB_H1_TRIM_LOWER" | grep -qE '[[:space:]](and|or|but|with|as|for|to|in|of|on|at|by|the|a|an|from|that)$'; then
      echo "❌ executive-brief.md: H1 ends with a coordinating connector or article ('and', 'or', 'with', 'the', …) — complete the headline"
      FAIL=1
    fi
    # Across-days uniqueness check (Phase 2 dup-card guard); full normalised comparison in analysis-gate.ts.
    EB_DAILY_DIR="$(dirname "$ANALYSIS_DIR")"
    EB_DAILY_ROOT="$(dirname "$EB_DAILY_DIR")"
    EB_CURR_DATE="$(basename "$EB_DAILY_DIR")"
    EB_SUBFOLDER="$(basename "$ANALYSIS_DIR")"
    if printf '%s' "$EB_CURR_DATE" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' && [ -d "$EB_DAILY_ROOT" ]; then
      EB_CURR_NORM="$(printf '%s' "$EB_H1_TRIM_LOWER" | sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2}//g' | tr -s '[:space:][:punct:]' ' ' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
      if [ "${#EB_CURR_NORM}" -ge 10 ]; then
        for EB_SIBLING in $(ls -1 "$EB_DAILY_ROOT" 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' | awk -v c="$EB_CURR_DATE" '$0 < c' | sort | tail -7); do
          EB_SIB_BRIEF="$EB_DAILY_ROOT/$EB_SIBLING/$EB_SUBFOLDER/executive-brief.md"
          [ -s "$EB_SIB_BRIEF" ] || continue
          EB_SIB_H1="$(grep -E '^#[[:space:]]+' "$EB_SIB_BRIEF" | head -n1 | sed -E 's/^#[[:space:]]+//' | sed -E 's/<[^>]+>//g')"
          [ -n "$EB_SIB_H1" ] || continue
          EB_SIB_NORM="$(printf '%s' "$EB_SIB_H1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2}//g' | tr -s '[:space:][:punct:]' ' ' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
          if [ "$EB_SIB_NORM" = "$EB_CURR_NORM" ]; then
            echo "❌ executive-brief.md: H1 is normalised-identical (case/punctuation/date stripped) to analysis/daily/$EB_SIBLING/$EB_SUBFOLDER/executive-brief.md — reword to surface the day-specific angle (period-aggregation briefs must not ship duplicate cards on the news index)"
            FAIL=1
            break
          fi
        done
      fi
    fi
  else
    # No H1 — renderer has nothing to seed SERP <title> and falls back to a BLUF-sentence fragment.
    echo "❌ executive-brief.md: no '# H1' heading found — the H1 is the SERP <title> source across all 14 languages; add a publishable story-oriented title"
    FAIL=1
  fi
fi
if [ -s "$ANALYSIS_DIR/intelligence-assessment.md" ]; then
  KJ=$(grep -cE '(Key[[:space:]]+Judgment|KJ-?[0-9]+)' "$ANALYSIS_DIR/intelligence-assessment.md" || true)
  [ "${KJ:-0}" -ge 3 ] || { echo "❌ intelligence-assessment.md: fewer than 3 Key Judgments (found ${KJ:-0})"; FAIL=1; }
  CONF=$(grep -cE '(VERY[[:space:]]+HIGH|VERY[[:space:]]+LOW|\bHIGH\b|\bMEDIUM\b|\bLOW\b)' "$ANALYSIS_DIR/intelligence-assessment.md" || true)
  [ "${CONF:-0}" -ge 3 ] || { echo "❌ intelligence-assessment.md: fewer than 3 confidence labels (VERY HIGH/HIGH/MEDIUM/LOW/VERY LOW) — found ${CONF:-0}"; FAIL=1; }
  grep -qE 'PIR' "$ANALYSIS_DIR/intelligence-assessment.md" \
    || { echo "❌ intelligence-assessment.md: no PIR reference"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/scenario-analysis.md" ]; then
  SC=$(awk '/^##? .*Scenario/{c++} END{print c+0}' "$ANALYSIS_DIR/scenario-analysis.md")
  [ "$SC" -ge 3 ] || { echo "❌ scenario-analysis.md: fewer than 3 scenarios (found $SC)"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/devils-advocate.md" ]; then
  HY=$(grep -cE '^#{2,4}[[:space:]]*(Hypothesis|H[0-9]+[[:space:]]*[:.—-])' "$ANALYSIS_DIR/devils-advocate.md" || true)
  [ "${HY:-0}" -ge 3 ] || { echo "❌ devils-advocate.md: fewer than 3 competing hypotheses (found ${HY:-0})"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/methodology-reflection.md" ]; then
  MR="$ANALYSIS_DIR/methodology-reflection.md"
  grep -qE 'ICD[[:space:]]+203|Methodology[[:space:]]+Improvements|Improvement[[:space:]]+1|#{2,4}[[:space:]]+.*Improvements' "$MR" \
    || { echo "❌ methodology-reflection.md: missing ICD 203 audit or named Methodology Improvements section"; FAIL=1; }
  grep -qE 'Pass-2[[:space:]]+status:[[:space:]]*executed[[:space:]]+in[[:space:]]+full' "$MR" \
    || { echo "❌ methodology-reflection.md: missing canonical 'Pass-2 status: executed in full' declaration"; FAIL=1; }
  if grep -qiE 'Pass-2[[:space:]]+status:[[:space:]]*(not[[:space:]]+executed|skipped|deferred|partial)' "$MR"; then
    echo "❌ methodology-reflection.md: Pass-2 cannot be marked not executed/skipped/deferred/partial"; FAIL=1
  fi
  if [ "${IMPROVEMENT_MODE:-false}" = "true" ]; then
    grep -qE '^##[[:space:]]+Re-run[[:space:]]+log' "$MR" \
      || { echo "❌ methodology-reflection.md: improvement-mode requires '## Re-run log'"; FAIL=1; }
    grep -qE 'run_id[=:][[:space:]]*'"${GITHUB_RUN_ID:-}" "$MR" \
      || { echo "❌ methodology-reflection.md: improvement-mode requires current run_id in Re-run log"; FAIL=1; }
    grep -qE 'attempt[=:][[:space:]]*'"${GITHUB_RUN_ATTEMPT:-}" "$MR" \
      || { echo "❌ methodology-reflection.md: improvement-mode requires current attempt in Re-run log"; FAIL=1; }
    for field in 'new[[:space:]]+dok_ids' 'artifacts[[:space:]]+extended' 'flags[[:space:]]+closed' 'vintage[[:space:]]+refresh'; do
      grep -qE "${field}[[:space:]]*:" "$MR" \
        || { echo "❌ methodology-reflection.md: Re-run log missing field matching '${field}'"; FAIL=1; }
    done
  fi
fi
if [ -s "$ANALYSIS_DIR/comparative-international.md" ]; then
  awk '
    BEGIN { comparator_set=0; comparator_rows=0 }
    /^[[:space:]]*\*{0,2}Comparator set\*{0,2}[[:space:]]*:/ {
      value = $0
      sub(/^[^:]*:[[:space:]]*/, "", value)
      if (value !~ /^[[:space:]]*$/ && value !~ /^[[:space:]]*[-–—]+[[:space:]]*$/) comparator_set = 1
    }
    /^\|/ {
      if ($0 !~ /^\|[[:space:]:-]+(\|[[:space:]:-]+)+\|?[[:space:]]*$/ && $0 !~ /^\|[[:space:]]*(Jurisdiction|Comparator|Country)[[:space:]]*\|/) comparator_rows++
    }
    END { exit !(comparator_set || comparator_rows >= 2) }
  ' "$ANALYSIS_DIR/comparative-international.md" \
    || { echo "❌ comparative-international.md: missing comparator set or fewer than 2 comparator rows"; FAIL=1; }
fi

# Check 8 — Family D structure
if [ -s "$ANALYSIS_DIR/forward-indicators.md" ]; then
  DI=$(grep -cE '20[0-9]{2}-[0-1][0-9]-[0-3][0-9]|20[0-9]{2}Q[1-4]|\+[0-9]+[[:space:]]*(h|d|day|week|month)' "$ANALYSIS_DIR/forward-indicators.md" || true)
  [ "${DI:-0}" -ge 10 ] || { echo "❌ forward-indicators.md: fewer than 10 dated indicators (found ${DI:-0})"; FAIL=1; }
fi
if [ -s "$ANALYSIS_DIR/coalition-mathematics.md" ]; then
  grep -qE '^\|.*(Ja|Nej|Avstår|Frånvarande|Seats|Mandat)' "$ANALYSIS_DIR/coalition-mathematics.md" \
    || { echo "❌ coalition-mathematics.md: missing seat-count / vote-breakdown table"; FAIL=1; }
fi

# Check 9b — Statskontoret evidence in implementation-feasibility.md. When file names a recognised
# agency it MUST carry a statskontoret.se URL or literal `none found` in `| **Statskontoret relevance** |` row.
AGENCY_RE='Kriminalvård(en)?|Polismyndigheten|Försäkringskassan|Skatteverket|Migrationsverket|Arbetsförmedlingen|Socialstyrelsen|Transportstyrelsen|Trafikverket|Naturvårdsverket|Energimyndigheten'
STATSKONTORET_RELEVANCE_RE='^\|[[:space:]]*\*\*Statskontoret relevance\*\*[[:space:]]*\|[[:space:]]*([^|]*statskontoret\.se[^|]*|[^|]*none found[^|]*)\|'
if [ -s "$ANALYSIS_DIR/implementation-feasibility.md" ]; then
  if grep -qE "$AGENCY_RE" "$ANALYSIS_DIR/implementation-feasibility.md"; then
    grep -qiE "$STATSKONTORET_RELEVANCE_RE" "$ANALYSIS_DIR/implementation-feasibility.md" \
      || { echo "❌ implementation-feasibility.md: names a recognised agency but the Statskontoret relevance row lacks a statskontoret.se URL or 'none found'"; FAIL=1; }
  fi
fi

# Check 9 — PIR status sidecar. Schema: schemas/pir-status.schema.json v1.0. Roll-forward: scripts/roll-forward-pirs.ts
PIR_FILE="$ANALYSIS_DIR/pir-status.json"
if [ ! -s "$PIR_FILE" ]; then
  echo "❌ pir-status.json missing or empty in $ANALYSIS_DIR — create it per schemas/pir-status.schema.json"
  FAIL=1
else
  python3 - "$PIR_FILE" << 'PYEOF' || FAIL=1
import json, sys, re
bad = 0
try:
    d = json.load(open(sys.argv[1]))
except Exception as e:
    print(f'❌ pir-status.json: parse error: {e}'); sys.exit(1)
for f in ('schema_version', 'cycle', 'date', 'subfolder', 'pirs', 'generated_at'):
    if f not in d:
        print(f"❌ pir-status.json: missing required field '{f}'"); bad = 1
if d.get('schema_version') != '1.0':
    print("❌ pir-status.json: schema_version must be '1.0'"); bad = 1
if not isinstance(d.get('pirs'), list):
    print("❌ pir-status.json: 'pirs' must be a JSON array"); bad = 1
if d.get('subfolder') != d.get('cycle'):  # cross-field invariant
    print(f"❌ pir-status.json: subfolder={d.get('subfolder')!r} must equal cycle={d.get('cycle')!r}"); bad = 1
PIR_ID_RE = re.compile(r'^PIR-[A-Za-z0-9]+(-[A-Za-z0-9]+)*$')
VALID_STATUS = {'open','answered','superseded','deferred','cancelled'}
VALID_CONF = {'VERY HIGH','HIGH','MEDIUM','LOW','VERY LOW'}
for p in (d.get('pirs') or []):
    pid = p.get('pir_id')
    if not isinstance(pid, str) or not PIR_ID_RE.match(pid):
        print(f'❌ pir-status.json: invalid pir_id format: {pid!r}'); bad = 1
    for f in ('statement', 'status', 'confidence'):
        if not p.get(f):
            print(f'❌ pir-status.json pir={pid!r}: missing required field "{f}"'); bad = 1
    if p.get('status') not in VALID_STATUS:
        print(f'❌ pir-status.json pir={pid!r}: invalid status {p.get("status")!r}'); bad = 1
    if p.get('confidence') not in VALID_CONF:
        print(f'❌ pir-status.json pir={pid!r}: invalid confidence {p.get("confidence")!r}'); bad = 1
    # answer_summary required iff status == 'answered'.
    if p.get('status') == 'answered' and not p.get('answer_summary'):
        print(f'❌ pir-status.json pir={pid!r}: status=answered requires non-empty answer_summary'); bad = 1
    if p.get('status') != 'answered' and 'answer_summary' in p:
        print(f'❌ pir-status.json pir={pid!r}: status={p.get("status")!r} must not carry answer_summary'); bad = 1
sys.exit(bad)
PYEOF
fi

# Check 10 — top-2 full-text availability. When manifest has "Full-Text Fetch Outcomes" table (from
# --auto-full-text-top-n), ≥ 2 top docs must have full_text_available=true. `full-text-fallback:` bypasses.
MANIFEST="$ANALYSIS_DIR/data-download-manifest.md"
if [ -s "$MANIFEST" ] && grep -q "## Full-Text Fetch Outcomes" "$MANIFEST" \
   && ! grep -q "full-text-fallback:" "$MANIFEST"; then
  FT_SUCCESS=$(grep -cE '^\|[[:space:]]*[A-Za-z0-9_-]+[[:space:]]*\|[[:space:]]*true' "$MANIFEST" || true)
  [ "${FT_SUCCESS:-0}" -ge 2 ] \
    || { echo "❌ data-download-manifest.md: Full-Text Fetch Outcomes table present but fewer than 2 top documents have full_text_available=true (found ${FT_SUCCESS:-0}). Add <!-- full-text-fallback: <reason> --> to bypass."; FAIL=1; }
fi

# Check 12 — Editorial QA gate (validate-article.ts: banned phrases, citation density, vintage discipline).
# Runs on aggregated article.md when present; informational when aggregator hasn't run yet.
ART_MD_GATE="$ANALYSIS_DIR/article.md"
if [ -s "$ART_MD_GATE" ]; then
  if command -v npx >/dev/null 2>&1; then
    npx tsx scripts/validate-article.ts "$ART_MD_GATE" || FAIL=1
  else
    echo "⚠️  Check 12 (editorial QA): npx not found — skipping (non-blocking)"
  fi
else
  echo "ℹ️  Check 12 (editorial QA): $ART_MD_GATE not yet produced — skipped (run after aggregator)"
fi

# Check 13 — Analysis language (English-only). Blocks any analysis artifact (excluding
# executive-brief_<lang>.md siblings) exceeding the Swedish-density threshold. Exits 0/1.
if command -v npx >/dev/null 2>&1; then
  npx tsx scripts/check-analysis-language.ts "$ANALYSIS_DIR" || FAIL=1
else
  echo "⚠️  Check 13 (analysis language): npx not found — skipping (non-blocking)"
fi

[ "$FAIL" -eq 0 ] || exit 1
```

Exit code 0 = pass, non-zero = fail with per-check report. Precondition for check 6: agent MUST save Pass-1 drafts to `$ANALYSIS_DIR/pass1/` so the `cmp` fallback fires when the same-session mtime window is too tight.

## Outcome

- **Pass** → proceed to `06-article-generation.md`.
- **Fail** → fix flagged files (never delete them), re-run the gate, then proceed.
- **Unrecoverable fail after fixes** → stage whatever analysis exists, commit with label `analysis-only`, call `safeoutputs___create_pull_request` once (see `07-commit-and-pr.md`). Do **not** generate articles.

## Re-run / deduplication note

Same-day re-runs are **improvement runs** when `03-data-download.md §Pre-flight` detects a reusable baseline (all 23 artifacts present **or** at least `synthesis-summary.md` on disk) and sets `IMPROVEMENT_MODE=true`. The router keys off analysis baselines, not rendered HTML. On improvement runs the pipeline runs in extend-and-improve mode (`04-analysis-pipeline.md §Execution order`), the gate runs normally, and `06-article-generation.md` always regenerates `article.md` + `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` (all 14 languages via the localized executive-brief cascade). Per-language `article.<lang>.md` files are forbidden artefacts — `scripts/validate-file-ownership.ts` rejects them (see `06-article-generation.md §Step 2`). One PR call per run. Existing HTML is a reason to regenerate, never to call `safeoutputs___noop`.

### Check 12 ordering note

Check 12 (`scripts/validate-article.ts`) is the editorial QA gate on aggregated `article.md`. The blocking branch in §Implementation only fires when `article.md` is on disk; on first pass the validator logs `ℹ️ Check 12 (editorial QA): … skipped (run after aggregator)`. Re-invoke the gate (or `npx tsx scripts/validate-article.ts $ANALYSIS_DIR/article.md`) **after** `scripts/aggregate-analysis.ts` writes `article.md`. See `06-article-generation.md §Step 1b — Editorial QA re-check (post-aggregation)`.

## Supplementary checks

Non-blocking for `standard` / `deep` runs; **blocking for `comprehensive` / Tier-C aggregation runs**. Source: [`analysis/templates/README.md §Operational Supplementary`](../../analysis/templates/README.md), [`analysis/methodologies/artifact-catalog.md §Operational Supplementary`](../../analysis/methodologies/artifact-catalog.md#-operational-supplementary-artifacts-7).

| S# | File | Blocking when |
|:--:|------|---------------|
| S1 | `analysis-index.md` | `comprehensive` |
| S2 | `reference-analysis-quality.md` | `comprehensive` |
| S3 | `mcp-reliability-audit.md` | `comprehensive`, or any run with ≥ 1 MCP endpoint failure |
| S4 | `workflow-audit.md` | `comprehensive` |
| S5 | `cross-run-diff.md` | any article type with ≥ 2 production runs |
| S6 | `cross-session-intelligence.md` | `weekly-review`, `monthly-review` |
| S7 | `session-baseline.md` | `weekly-review`, `monthly-review` |

Methodology §links: [`per-artifact-methodologies.md`](../../analysis/methodologies/per-artifact-methodologies.md) (anchors: `#analysis-index`, `#reference-analysis-quality`, `#mcp-reliability-audit`, `#workflow-audit`, `#cross-run-diff`, `#cross-session-intelligence`, `#session-baseline`).

Inline bash probe — append after `FAIL=0` bookkeeping. Three blocking triggers: aggregation types (`weekly-review`/`monthly-review`), `comprehensive` tier, and `cross-run-diff.md` whenever `ANALYSIS_RUN_COUNT ≥ 2`. `ARTICLE_TYPE` encodes the workflow family; `ANALYSIS_TIER` encodes the depth tier (`standard` | `deep` | `comprehensive`); `ANALYSIS_RUN_COUNT` is the numeric run count for the same cycle (unset/non-numeric → `1`).

```bash
# Check 11 — supplementary artifacts (blocking for aggregation types, Tier-C, and S5 when run-count >= 2)
IS_AGGREGATION=0; IS_TIER_C=0; IS_MULTI_RUN=0; RUN_COUNT=1
[[ "${ARTICLE_TYPE:-}" =~ ^(weekly-review|monthly-review)$ ]] && IS_AGGREGATION=1
[[ "${ANALYSIS_TIER:-standard}" == "comprehensive" ]] && IS_TIER_C=1
[[ "${ANALYSIS_RUN_COUNT:-}" =~ ^[0-9]+$ ]] && RUN_COUNT="${ANALYSIS_RUN_COUNT}"
(( RUN_COUNT >= 2 )) && IS_MULTI_RUN=1
if (( IS_AGGREGATION == 1 || IS_TIER_C == 1 || IS_MULTI_RUN == 1 )); then
  SUPP_LIST="/tmp/gate-supp-$$"; : > "$SUPP_LIST"  # /tmp list (no inline bash arrays)
  (( IS_AGGREGATION == 1 || IS_TIER_C == 1 )) && \
    printf '%s\n' analysis-index.md reference-analysis-quality.md mcp-reliability-audit.md workflow-audit.md >> "$SUPP_LIST"
  (( IS_AGGREGATION == 1 )) && printf '%s\n' cross-session-intelligence.md session-baseline.md >> "$SUPP_LIST"
  (( IS_MULTI_RUN == 1 )) && printf '%s\n' cross-run-diff.md >> "$SUPP_LIST"
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ -s "$ANALYSIS_DIR/$f" ] || { echo "❌ supplementary missing (agg=$IS_AGGREGATION tier-c=$IS_TIER_C multi-run=$IS_MULTI_RUN): $f"; FAIL=1; }
  done < "$SUPP_LIST"
  rm -f "$SUPP_LIST"
fi
```

Depth floors for S1–S7 live under `thresholds.breaking.*` in [`reference-quality-thresholds.json`](../../analysis/methodologies/reference-quality-thresholds.json) (default `defaults.supplementaryFloor` = 120 lines).

**Pass-2 quality audit — recommendation, not enforced** — the bash probe does **not** parse `reference-analysis-quality.md §5`. When the artifact exists, agents SHOULD re-read its `§5 Overall Benchmark Judgement` total and trigger another Pass-2 iteration if the score is below **7.0/10** before invoking this gate.

---

## Long-horizon additive gate

Applies to `news-quarter-ahead`, `news-year-ahead`, `news-election-cycle` (blocking) and `news-week-ahead`, `news-month-ahead` (warnings only). Runs as an **additive** block **after** the Tier-C additive block whenever `ext/long-horizon-forecasting.md` is imported.

```bash
set -Eeuo pipefail
ANALYSIS_DIR="${ANALYSIS_DIR:-}"; ARTICLE_TYPE="${ARTICLE_TYPE:-}"  # type: week-ahead|month-ahead|quarter-ahead|year-ahead|election-cycle
[ -n "$ANALYSIS_DIR" ] || { echo "❌ ANALYSIS_DIR is not set"; exit 1; }
[ -n "$ARTICLE_TYPE" ] || { echo "ℹ️ ARTICLE_TYPE not set; long-horizon gate skipped"; exit 0; }
case "$ARTICLE_TYPE" in quarter-ahead|year-ahead|election-cycle) BLOCKING=1 ;; *) BLOCKING=0 ;; esac
FAIL=0

# LH-1 — every WEP term in long-horizon Family-C/D artifacts carries [horizon:<band>] tag
for f in synthesis-summary.md scenario-analysis.md risk-assessment.md \
         intelligence-assessment.md forward-indicators.md cross-reference-map.md; do
  [ -s "$ANALYSIS_DIR/$f" ] || continue
  WEP_LINES=$(grep -nE '\b(very likely|likely|roughly even|about even|unlikely|very unlikely)\b' "$ANALYSIS_DIR/$f" || true)
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    echo "$line" | grep -qE '\[horizon:(72h|week|month|quarter|year|cycle|election)\]' \
      || { echo "⚠️ long-horizon: $f line missing [horizon:...] tag near WEP term: ${line:0:120}"; FAIL=1; }
  done <<< "$WEP_LINES"
done

# LH-2 — IMF citations carry projection-year stamp (T+N)
for f in synthesis-summary.md scenario-analysis.md risk-assessment.md \
         intelligence-assessment.md cross-reference-map.md; do
  [ -s "$ANALYSIS_DIR/$f" ] || continue
  if grep -qE '\bIMF (WEO|FM|GFS_COFOG)\b' "$ANALYSIS_DIR/$f"; then
    grep -qE '\bIMF (WEO|FM|GFS_COFOG)\b.*\bT\+[0-9]+\b' "$ANALYSIS_DIR/$f" \
      || { echo "❌ long-horizon: $f cites IMF without T+N projection-year stamp"; FAIL=1; }
  fi
done

# LH-3 — counterfactuals in devils-advocate.md
case "$ARTICLE_TYPE" in
  week-ahead|month-ahead) MIN_COUNTER=1 ;;
  quarter-ahead|year-ahead) MIN_COUNTER=2 ;;
  election-cycle) MIN_COUNTER=3 ;;
  *) MIN_COUNTER=0 ;;
esac
if [ "$MIN_COUNTER" -gt 0 ] && [ -s "$ANALYSIS_DIR/devils-advocate.md" ]; then
  COUNT=$(grep -cE '^\*\*Counterfactual [0-9]+ — ' "$ANALYSIS_DIR/devils-advocate.md" || true)
  [ "${COUNT:-0}" -ge "$MIN_COUNTER" ] \
    || { echo "❌ long-horizon: devils-advocate.md needs ≥ $MIN_COUNTER counterfactual paragraphs (found ${COUNT:-0})"; FAIL=1; }
fi

# LH-4 — PESTLE blocking for year-ahead and election-cycle
case "$ARTICLE_TYPE" in year-ahead|election-cycle)
  [ -s "$ANALYSIS_DIR/pestle-analysis.md" ] \
    || { echo "❌ long-horizon: pestle-analysis.md is BLOCKING for $ARTICLE_TYPE"; FAIL=1; } ;;
esac

# LH-5 — election-cycle blocking extras (24th+ artifacts)
if [ "$ARTICLE_TYPE" = "election-cycle" ]; then
  for ec_file in cycle-trajectory.md wildcards-blackswans.md quantitative-swot.md political-stride-assessment.md; do
    [ -s "$ANALYSIS_DIR/$ec_file" ] \
      || { echo "❌ long-horizon: $ec_file is BLOCKING for election-cycle"; FAIL=1; }
  done
fi

# LH-6 — cross-horizon citation in cross-reference-map.md
if [ -s "$ANALYSIS_DIR/cross-reference-map.md" ]; then
  CRM="$ANALYSIS_DIR/cross-reference-map.md"
  check_lh6() { grep -qE "analysis/daily/[0-9-]+/$1/" "$CRM" || { echo "❌ long-horizon: $ARTICLE_TYPE must cite at least one $1 predecessor"; FAIL=1; }; }
  case "$ARTICLE_TYPE" in
    quarter-ahead) check_lh6 week-ahead; check_lh6 month-ahead ;;
    year-ahead)    check_lh6 quarter-ahead ;;
    election-cycle) check_lh6 year-ahead ;;
  esac
fi

if [ "$BLOCKING" = "1" ] && [ "$FAIL" = "1" ]; then echo "❌ long-horizon gate FAILED for $ARTICLE_TYPE"; exit 1
elif [ "$FAIL" = "1" ]; then echo "⚠️ long-horizon gate produced warnings for $ARTICLE_TYPE (non-blocking)"
fi
echo "✅ long-horizon gate complete for $ARTICLE_TYPE"
```
