---
name: "News: Translate Executive Briefs"
description: "Translates `analysis/daily/**/executive-brief.md` (English source produced by per-type news workflows) into the 13 non-English target languages as sibling `executive-brief_<lang>.md` files. Runs three times daily and picks up at most `max_briefs` (default 1) sources × `max_langs` (default 13) languages per run, **greenfield-first** — sources with one or more missing target files always win batch slots over drift-only sources, and within a source the still-needed languages are translated missing-first then drift up to `max_langs` (remaining languages drain in later runs). Pass 2 is **validator-first**: the bash validator does all structural parity at near-zero model-token cost and the agent only reads back the files it flags. This workflow only uses bash/edit/safe-outputs — its MCP/tool surface is deliberately minimal so the per-turn tool-schema context (the ~3.5× weighting driver that aborted run #26641603577 at 27.0M / 25M weighted) no longer dominates; wall-clock (Timer A/B) and the 200-file safe-outputs cap, not the token budget, are now the governing limits — see `07-commit-and-pr.md §Deadline enforcement`. See `TRANSLATION_GUIDE.md §Executive Brief Markdown Translations` for the authoritative content contract."
strict: false
imports:
  - ../prompts/00-base-contract.md
  - ../prompts/01-bash-and-shell-safety.md
  - ../prompts/02-mcp-access.md
  - ../prompts/07-commit-and-pr.md
on:
  schedule:
    # Three runs every day (7 days/week): morning, midday, evening UTC.
    # Intentional day-of-week range notation (`0-6`) instead of `*`: avoids the
    # gh-aw fixed-daily-time schedule warning (same pattern as
    # news-evening-analysis.md `'0 16 * * 6-6'`). Do not simplify to `*`.
    - cron: "0 9 * * 0-6"
    - cron: "0 14 * * 0-6"
    - cron: "0 19 * * 0-6"
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Restrict the scan to a single article date (YYYY-MM-DD). Leave empty to scan all dates.'
        required: false
      subfolder:
        description: 'Restrict the scan to a single document type (propositions, motions, committee-reports, interpellations, evening-analysis, week-ahead, month-ahead, quarter-ahead, year-ahead, election-cycle, weekly-review, monthly-review, realtime-pulse, …). Leave empty to scan all.'
        required: false
      languages:
        description: 'Target languages (comma list of `sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh` | `nordic-extra` | `eu-extra` | `cjk` | `rtl` | `all-extra`). Default: all-extra (all 13 non-English languages).'
        required: false
        default: all-extra
      max_briefs:
        description: 'Maximum number of source executive-brief.md files to translate this run (range 1–7; default 1). Hard cap: 7 (keeps under safe-outputs 200-file ceiling with 13 languages = 91 files). Lowered from 3 to 1 after run #26633644372 exceeded the Copilot effective-token cap before completing source #2.'
        required: false
        default: '1'
      max_langs:
        description: 'Maximum number of target languages to translate per run (range 1–13; default 13 = a full source in one run). The agent writes one full file per language in a single Copilot session, so the session''s weighted effective-token total scales with the language count **times the per-turn tool-schema surface**. The dominant cost was the latter: run #26641603577 hit 27.0M weighted (> the 25M Copilot per-session cap) at 13 languages while the workflow still loaded the full github `toolsets:[all]` + three data-MCP servers on every turn. That dead-weight schema was removed (the agent only uses bash/edit/safe-outputs), collapsing the per-turn footprint, so a full 13-language source now fits in one run. The worklist builder selects the missing/drifted languages **greenfield-first** and caps them at this value; remaining languages are picked up by the next scheduled run because the source stays classified MISSING/DRIFT until every requested language is present and current. Lower this first if an unusually large brief still approaches the cap.'
        required: false
        default: '13'
      force_retranslate:
        description: 'When true, ignore the `<!-- source-sha: ... -->` drift check and re-translate every matching source. Use sparingly — drains the safe-outputs file budget fast.'
        required: false
        default: 'false'
      analysis_depth:
        description: 'Analysis depth label echoed into validator output for parity with content workflows (standard, deep, comprehensive). Does not change translation behaviour.'
        required: false
        default: standard

# Shallow checkout (fetch-depth: 1) for fast safe_outputs Checkout. The prerequisite step
# fetches GITHUB_SHA on demand for bundle-apply, making full-history clones unnecessary.
# gh-aw v0.76.0+ honours `checkout.fetch-depth` (see compiler_safe_outputs_steps.go).
checkout:
  fetch-depth: 1

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 60

concurrency:
  group: gh-aw-news-translate-briefs-${{ inputs.article_date || 'batch' }}-${{ inputs.subfolder || 'all' }}
  job-discriminator: ${{ inputs.article_date || 'batch' }}-${{ inputs.subfolder || 'all' }}
  cancel-in-progress: true

features:
  mcp-gateway: true

runtimes:
  node:
    version: "26"

network:
  allowed:
    # ── Ecosystem identifiers (gh-aw built-ins) ──────────────────────────────
    - node
    # Browser downloads for Playwright CLI mode (kept for cross-workflow network parity)
    - playwright
    - github
    - defaults
    # ── Container registries (node:26-alpine pulls for SCB + WB MCP) ─────────
    # `containers` ecosystem covers ghcr.io + *.docker.io + Docker Hub auth/CDN endpoints.
    - containers
    # ── Riksdag / Regering MCP server + Swedish parliament + government ──────
    - riksdag-regering-ai.onrender.com
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - regeringen.se
    - www.government.se
    - g0v.se
    # ── SCB (Statistics Sweden) ──────────────────────────────────────────────
    - api.scb.se
    - www.scb.se
    - scb-mcp.onrender.com
    # ── IMF (canonical economic-data source — see ECONOMIC_DATA_CONTRACT.md) ─
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - dataservices.imf.org
    - datamarketplace.imf.org
    # ── World Bank (governance / environment / social residue) ───────────────
    - api.worldbank.org
    - data.worldbank.org
    - datahelpdesk.worldbank.org
    - governance.worldbank.org
    - www.worldbank.org
    # ── European Parliament + EU institutions ────────────────────────────────
    - www.europarl.europa.eu
    - europarl.europa.eu
    - ec.europa.eu
    - eur-lex.europa.eu
    - data.europa.eu
    - www.consilium.europa.eu
    - digital-strategy.ec.europa.eu
    - economy-finance.ec.europa.eu
    - www.enisa.europa.eu
    # ── Swedish independent agencies, courts, regulators ─────────────────────
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - www.riksbank.se
    - www.riksrevisionen.se
    - www.konj.se
    - www.finanspolitiskaradet.se
    - www.regelradet.se
    - www.esv.se
    - www.ei.se
    - www.energimyndigheten.se
    - www.naturvardsverket.se
    - www.boverket.se
    - www.do.se
    - www.domstol.se
    - www.imy.se
    - www.konkurrensverket.se
    - www.kriminalvarden.se
    - www.migrationsverket.se
    - www.msb.se
    - www.av.se
    - www.svt.se
    - www.val.se
    - bra.se
    # ── Hack23 owned platforms ───────────────────────────────────────────────
    - hack23.com
    - www.hack23.com
    - hack23.github.io
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - riksdagsmonitor.hack23.com
    - riksdagsmonitor.pages.dev
    - euparliamentmonitor.com
    - www.euparliamentmonitor.com
    - ciacompliancemanager.com
    - www.ciacompliancemanager.com
    - blacktrigram.com
    - www.blacktrigram.com
    # ── GitHub raw content is covered by the `github` ecosystem identifier above.
    # Pinned FQDN remains in `safe-outputs.allowed-domains` below (only FQDNs allowed there).

# MCP surface is intentionally minimal: translation reads/writes files via bash + edit
# and ships the PR via safe-outputs, so it calls NO data-MCP, github-MCP, web-fetch or
# agentic-workflows tool. Every declared tool's JSON schema is re-sent on every model turn,
# so the cumulative weighted effective-token total scales with the schema surface × turns —
# this was the dominant driver of the 3.5× weighting that aborted run #26641603577 at 27.0M.
# Only riksdag-regering is kept (its URL is asserted by tests/network-diagnostics.test.ts) and
# narrowed to the single health-gate tool documented in 02-mcp-access.md. The scb / world-bank
# data servers are dropped here (their egress domains stay in network.allowed for uniformity).
mcp-servers:
  riksdag-regering:
    url: https://riksdag-regering-ai.onrender.com/mcp
    allowed: ["get_sync_status"]

tools:
  startup-timeout: 180
  timeout: 120
  bash: true
  edit:
  cache-memory:
    key: news-translate-${{ inputs.article_date || 'today' }}
    retention-days: 14

safe-outputs:
  threat-detection:
    continue-on-error: true
  report-failure-as-issue: false
  allowed-domains:
    # Riksdag / Regering MCP server + Swedish parliament + government
    - riksdag-regering-ai.onrender.com
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - regeringen.se
    - www.government.se
    - g0v.se
    # SCB (Statistics Sweden)
    - api.scb.se
    - www.scb.se
    - scb-mcp.onrender.com
    # IMF (canonical economic-data source)
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - dataservices.imf.org
    - datamarketplace.imf.org
    # World Bank
    - api.worldbank.org
    - data.worldbank.org
    - datahelpdesk.worldbank.org
    - governance.worldbank.org
    - www.worldbank.org
    # European Parliament + EU institutions
    - www.europarl.europa.eu
    - europarl.europa.eu
    - ec.europa.eu
    - eur-lex.europa.eu
    - data.europa.eu
    - www.consilium.europa.eu
    - digital-strategy.ec.europa.eu
    - economy-finance.ec.europa.eu
    - www.enisa.europa.eu
    # Swedish independent agencies, courts, regulators
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - www.riksbank.se
    - www.riksrevisionen.se
    - www.konj.se
    - www.finanspolitiskaradet.se
    - www.regelradet.se
    - www.esv.se
    - www.ei.se
    - www.energimyndigheten.se
    - www.naturvardsverket.se
    - www.boverket.se
    - www.do.se
    - www.domstol.se
    - www.imy.se
    - www.konkurrensverket.se
    - www.kriminalvarden.se
    - www.migrationsverket.se
    - www.msb.se
    - www.av.se
    - www.svt.se
    - www.val.se
    - bra.se
    # Hack23 owned platforms
    - hack23.com
    - www.hack23.com
    - hack23.github.io
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - riksdagsmonitor.hack23.com
    - riksdagsmonitor.pages.dev
    - euparliamentmonitor.com
    - www.euparliamentmonitor.com
    - ciacompliancemanager.com
    - www.ciacompliancemanager.com
    - blacktrigram.com
    - www.blacktrigram.com
    # GitHub raw content
    - raw.githubusercontent.com
  max-patch-size: 10240
  max-patch-files: 200
  create-pull-request:
    labels: [agentic-news, translation, executive-brief]
    draft: false
    expires: 14d
    max: 1
    if-no-changes: warn       # Don't fail when nothing changed (resilience)
    fallback-as-issue: true   # If org disables Actions PR creation, fall back to an issue with branch link
    protected-files:
      policy: allowed
  add-comment: {}

steps:
  - name: News pre-warm & pre-flight (composite)
    uses: ./.github/actions/news-prewarm
    with:
      imf-sdmx-subscription-key: ${{ secrets.IMF_SDMX_SUBSCRIPTION_KEY }}
  - name: Resolve workflow inputs
    uses: ./.github/actions/news-resolve-inputs
    with:
      subfolder: news-translate
      article-date: ${{ inputs.article_date }}
      analysis-depth: ${{ inputs.analysis_depth }}
      default-analysis-depth: standard
      languages: ${{ inputs.languages }}
      max-briefs: ${{ inputs.max_briefs }}
      force-retranslate: ${{ inputs.force_retranslate }}
      translate-subfolder: ${{ inputs.subfolder }}
  - name: Build executive-brief translation work list
    id: worklist
    env:
      ARTICLE_DATE_INPUT: ${{ github.event.inputs.article_date }}
      SUBFOLDER_INPUT: ${{ github.event.inputs.subfolder }}
      LANGUAGES_INPUT: ${{ github.event.inputs.languages }}
      MAX_BRIEFS_INPUT: ${{ github.event.inputs.max_briefs }}
      MAX_LANGS_INPUT: ${{ github.event.inputs.max_langs }}
      FORCE_RETRANSLATE: ${{ github.event.inputs.force_retranslate }}
    run: |
      set -euo pipefail
      # Resolve target languages.
      LANGUAGES_RAW="${LANGUAGES_INPUT:-all-extra}"
      case "$LANGUAGES_RAW" in
        all-extra) LANGS="sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh" ;;
        nordic-extra) LANGS="sv,da,no,fi" ;;
        eu-extra) LANGS="de,fr,es,nl" ;;
        cjk) LANGS="ja,ko,zh" ;;
        rtl) LANGS="ar,he" ;;
        *) LANGS="$LANGUAGES_RAW" ;;
      esac
      echo "Target languages: $LANGS"

      # Resolve batch cap (1–7 hard range).
      MAX_BRIEFS="${MAX_BRIEFS_INPUT:-1}"
      if ! [[ "$MAX_BRIEFS" =~ ^[1-7]$ ]]; then
        echo "::warning::max_briefs '$MAX_BRIEFS' out of range; clamping to 1"
        MAX_BRIEFS=1
      fi
      echo "Max source briefs this run: $MAX_BRIEFS"

      # Resolve per-run language cap (1–13 hard range; default 13 = a full source
      # in one run). The agent writes one full file per language in a single Copilot
      # session, so the weighted effective-token total scales with the language count
      # times the per-turn tool-schema surface. The latter was the dominant cost: run
      # #26641603577 hit 27.0M weighted (> the 25M cap) at 13 languages while the heavy
      # github toolsets:[all] + three data-MCP server schemas were still re-sent every
      # turn. That dead-weight surface was removed (this workflow only uses bash/edit/
      # safe-outputs), so a full 13-language source now fits under the cap. The batching
      # block below caps the languages handled per run to this value, greenfield-first.
      MAX_LANGS="${MAX_LANGS_INPUT:-13}"
      if ! [[ "$MAX_LANGS" =~ ^([1-9]|1[0-3])$ ]]; then
        echo "::warning::max_langs '$MAX_LANGS' out of range; clamping to 13"
        MAX_LANGS=13
      fi
      echo "Max target languages this run: $MAX_LANGS"

      # Discover candidate sources.
      ROOT="analysis/daily"
      # Worklist file written to GITHUB_WORKSPACE so it is visible inside the
      # AWF container (`--add-dir "${GITHUB_WORKSPACE}"`); /tmp on the runner
      # is NOT mounted into the container and the agent cannot read it.
      WORKLIST_FILE="${GITHUB_WORKSPACE}/.exec-brief-worklist.txt"

      # Emit a single canonical bundle to BOTH $GITHUB_OUTPUT (for downstream
      # GHA steps) AND $GITHUB_ENV (so `awf --env-all` forwards the values
      # to the agent's bash sandbox — agents have no access to step outputs).
      emit_bundle() {
        local worklist="$1" langs="$2" max="$3" missing="$4" drift="$5"
        {
          echo "TRANSLATION_WORKLIST=$worklist"
          echo "TRANSLATION_LANGS=$langs"
          echo "MAX_BRIEFS=$max"
          echo "MAX_BRIEFS_RESOLVED=$max"
          echo "MISSING_COUNT=$missing"
          echo "DRIFT_COUNT=$drift"
          echo "EXEC_BRIEF_WORKLIST_FILE=$WORKLIST_FILE"
        } >> "$GITHUB_OUTPUT"
        {
          echo "TRANSLATION_WORKLIST=$worklist"
          echo "TRANSLATION_LANGS=$langs"
          echo "MAX_BRIEFS=$max"
          echo "MAX_BRIEFS_RESOLVED=$max"
          echo "MISSING_COUNT=$missing"
          echo "DRIFT_COUNT=$drift"
          echo "EXEC_BRIEF_WORKLIST_FILE=$WORKLIST_FILE"
        } >> "$GITHUB_ENV"
        # Always write the file (empty when worklist is empty) so the agent
        # can rely on a stable path.
        : > "$WORKLIST_FILE"
        if [ -n "$worklist" ]; then
          printf '%s\n' "$worklist" | tr ',' '\n' > "$WORKLIST_FILE"
        fi
      }

      if [ ! -d "$ROOT" ]; then
        emit_bundle "" "$LANGS" "$MAX_BRIEFS" "0" "0"
        echo "No $ROOT directory — nothing to translate."
        exit 0
      fi

      if [ -n "${ARTICLE_DATE_INPUT:-}" ] && [ -n "${SUBFOLDER_INPUT:-}" ]; then
        SCAN_PATTERN="$ROOT/$ARTICLE_DATE_INPUT/$SUBFOLDER_INPUT"
      elif [ -n "${ARTICLE_DATE_INPUT:-}" ]; then
        SCAN_PATTERN="$ROOT/$ARTICLE_DATE_INPUT"
      else
        SCAN_PATTERN="$ROOT"
      fi

      # Build list of (date, source-path) tuples, oldest date first.
      CANDIDATES=$(find "$SCAN_PATTERN" -type f -name 'executive-brief.md' 2>/dev/null \
        | sort)

      if [ -z "$CANDIDATES" ]; then
        emit_bundle "" "$LANGS" "$MAX_BRIEFS" "0" "0"
        echo "No executive-brief.md sources found under $SCAN_PATTERN."
        exit 0
      fi

      # For each source, classify it as MISSING (≥1 requested language file absent
      # or empty) or DRIFT (every requested language file present but ≥1 has a
      # stale `<!-- source-sha: ... -->` trailer relative to the current source
      # commit SHA). When `force_retranslate=true`, every source with at least
      # one existing target file is reclassified as DRIFT (forces a re-pass);
      # sources missing any target stay in MISSING.
      #
      # Selection policy (greenfield-first):
      #   1. Fill `MAX_BRIEFS` batch slots with MISSING sources, oldest date first
      #      (159-source backlog is drained before any drift-fix work).
      #   2. Only if MISSING is empty after the scan, fill remaining slots with
      #      DRIFT sources, oldest date first.
      # This guarantees runs never "redo already-translated briefs" while the
      # untranslated backlog still has work — see PR description for context.
      MISSING=()
      DRIFT=()
      IFS=',' read -ra LANG_LIST <<< "$LANGS"
      while IFS= read -r SRC; do
        [ -n "$SRC" ] || continue
        DIR=$(dirname "$SRC")
        SRC_SHA=$(git log -1 --format=%H -- "$SRC" 2>/dev/null || echo "")
        HAS_MISSING=0
        HAS_DRIFT=0
        for L in "${LANG_LIST[@]}"; do
          TGT="$DIR/executive-brief_${L}.md"
          if [ ! -s "$TGT" ]; then
            HAS_MISSING=1
            continue
          fi
          if [ -n "$SRC_SHA" ] && ! grep -q "<!-- source-sha: $SRC_SHA -->" "$TGT" 2>/dev/null; then
            HAS_DRIFT=1
          fi
        done
        if [ "$HAS_MISSING" -eq 1 ]; then
          MISSING+=("$SRC")
        elif [ "${FORCE_RETRANSLATE:-false}" = "true" ] || [ "$HAS_DRIFT" -eq 1 ]; then
          DRIFT+=("$SRC")
        fi
      done <<< "$CANDIDATES"

      MISSING_COUNT="${#MISSING[@]}"
      DRIFT_COUNT="${#DRIFT[@]}"
      echo "Backlog classification: MISSING=$MISSING_COUNT  DRIFT=$DRIFT_COUNT"

      # Fill batch: MISSING first (greenfield), DRIFT only if capacity remains.
      WORK=()
      for SRC in "${MISSING[@]}"; do
        WORK+=("$SRC")
        if [ "${#WORK[@]}" -ge "$MAX_BRIEFS" ]; then break; fi
      done
      if [ "${#WORK[@]}" -lt "$MAX_BRIEFS" ]; then
        for SRC in "${DRIFT[@]}"; do
          WORK+=("$SRC")
          if [ "${#WORK[@]}" -ge "$MAX_BRIEFS" ]; then break; fi
        done
      fi

      if [ "${#WORK[@]}" -eq 0 ]; then
        emit_bundle "" "$LANGS" "$MAX_BRIEFS" "$MISSING_COUNT" "$DRIFT_COUNT"
        echo "All discovered sources are up to date for the requested languages."
        exit 0
      fi

      # Categorise the chosen batch for the log line: how many slots were filled
      # with greenfield (MISSING) vs drift-fix (DRIFT) work.
      WORK_MISSING=0
      WORK_DRIFT=0
      for SRC in "${WORK[@]}"; do
        for M in "${MISSING[@]:-}"; do
          if [ "$M" = "$SRC" ]; then WORK_MISSING=$((WORK_MISSING+1)); continue 2; fi
        done
        WORK_DRIFT=$((WORK_DRIFT+1))
      done

      WORKLIST_JOINED=$(printf '%s\n' "${WORK[@]}" | paste -sd ',' -)

      # --- Per-run language batching (effective-token control) ---
      # Across the selected batch, collect the requested languages that still
      # NEED work — missing target file first (greenfield), then drift — in the
      # canonical order of $LANGS, and translate at most $MAX_LANGS of them this
      # run. This bounds the number of full files the agent writes in one
      # Copilot session (the dominant driver of the weighted effective-token
      # total that aborted run #26641603577 with a 429 before the PR shipped).
      # The remaining languages are picked up by the next scheduled run because
      # every selected source stays classified MISSING/DRIFT until all requested
      # languages are present and current.
      NEED_MISSING=()
      NEED_DRIFT=()
      for L in "${LANG_LIST[@]}"; do
        L_MISSING=0
        L_DRIFT=0
        for SRC in "${WORK[@]}"; do
          DIR=$(dirname "$SRC")
          SRC_SHA=$(git log -1 --format=%H -- "$SRC" 2>/dev/null || echo "")
          TGT="$DIR/executive-brief_${L}.md"
          if [ ! -s "$TGT" ]; then
            L_MISSING=1
            continue
          fi
          if [ "${FORCE_RETRANSLATE:-false}" = "true" ]; then
            L_DRIFT=1
          elif [ -n "$SRC_SHA" ] && ! grep -q "<!-- source-sha: $SRC_SHA -->" "$TGT" 2>/dev/null; then
            L_DRIFT=1
          fi
        done
        if [ "$L_MISSING" -eq 1 ]; then
          NEED_MISSING+=("$L")
        elif [ "$L_DRIFT" -eq 1 ]; then
          NEED_DRIFT+=("$L")
        fi
      done
      NEED_LANGS=("${NEED_MISSING[@]}" "${NEED_DRIFT[@]}")
      # Fallback: if nothing was flagged as needing work (edge case), fall back
      # to the full requested list so the run never emits an empty language set.
      if [ "${#NEED_LANGS[@]}" -eq 0 ]; then
        NEED_LANGS=("${LANG_LIST[@]}")
      fi
      RUN_LANG_LIST=()
      for L in "${NEED_LANGS[@]}"; do
        RUN_LANG_LIST+=("$L")
        if [ "${#RUN_LANG_LIST[@]}" -ge "$MAX_LANGS" ]; then break; fi
      done
      RUN_LANGS=$(IFS=','; echo "${RUN_LANG_LIST[*]}")
      echo "Per-run language batch (cap $MAX_LANGS): [$RUN_LANGS] of requested [$LANGS]"

      emit_bundle "$WORKLIST_JOINED" "$RUN_LANGS" "$MAX_BRIEFS" "$MISSING_COUNT" "$DRIFT_COUNT"
      echo "✅ Selected ${#WORK[@]} source brief(s) for translation into [$RUN_LANGS]"
      echo "   (greenfield=$WORK_MISSING / drift-fix=$WORK_DRIFT;  total backlog: MISSING=$MISSING_COUNT DRIFT=$DRIFT_COUNT)"
      echo "   Worklist file (agent reads this): $WORKLIST_FILE"
      printf '   %s\n' "${WORK[@]}"

engine:
  id: copilot
  model: claude-sonnet-4.6
---

# 🌐 News Translate — Executive Brief Markdown

This workflow is the **sole writer** of `analysis/daily/$DATE/$SUB/executive-brief_<lang>.md` files. It translates the English-master executive brief (`executive-brief.md`, produced by the per-type news workflows) into 13 non-English sibling files — together with the English source these give "all 14 languages". It never generates original analysis and never modifies `executive-brief.md` itself.

> 🔗 **Authoritative content contract:** [`TRANSLATION_GUIDE.md §Executive Brief Markdown Translations`](../../TRANSLATION_GUIDE.md#-executive-brief-markdown-translations). Read this **in full** before producing any translation — it defines verbatim-preserve blocks, always-translate blocks, structural parity, tone register per language, RTL rules, and the validator acceptance checklist.

## Pipeline

1. **Wall-clock checkpoint (mandatory)** — as the **very first bash call** in this run, record `JOB_START=$(date +%s)` and export it. After every source completes Pass 2, re-read `NOW=$(date +%s)` and compute `ELAPSED_MIN=$(( (NOW - JOB_START) / 60 ))`; print it. If `ELAPSED_MIN >= 35`, stop selecting new sources and proceed directly to the validate → stage → commit → `safeoutputs___create_pull_request` flow regardless of remaining `$TRANSLATION_WORKLIST` entries. If `ELAPSED_MIN >= 42`, **halt all translation work immediately** and execute the [`07-commit-and-pr.md §Emergency deadline order of operations`](../prompts/07-commit-and-pr.md) bash block to ship a partial PR before Timer A (60-min job `timeout-minutes`) and Timer B (~60-min Copilot API session) fire. A partial PR is always better than zero output — see run [#26633644372](https://github.com/Hack23/riksdagsmonitor/actions/runs/26633644372), where source #2 failed with `CAPIError: 429 Maximum effective tokens exceeded`.
2. The `Build executive-brief translation work list` pre-flight step has already exported four env vars into the agent sandbox: **`$TRANSLATION_WORKLIST`** (comma-separated repo-relative paths — read this verbatim, or parse the same content line-by-line from the file at **`$EXEC_BRIEF_WORKLIST_FILE`** at `${GITHUB_WORKSPACE}/.exec-brief-worklist.txt`), **`$TRANSLATION_LANGS`** (comma-separated language codes — this is the **per-run language batch**, already capped at `inputs.max_langs` (default 13) and pre-selected **greenfield-first** from the languages that still need work; translate **exactly and only** these codes — do not expand to the full 13-language set), **`$MAX_BRIEFS`** / **`$MAX_BRIEFS_RESOLVED`** (1–7, clamp-applied), and the audit counters **`$MISSING_COUNT`** / **`$DRIFT_COUNT`**. **Do not re-scan the filesystem** to rebuild this list — the pre-flight step has already honoured `inputs.article_date`, `inputs.subfolder`, `inputs.languages`, `inputs.max_briefs`, `inputs.max_langs`, and `inputs.force_retranslate`. Languages omitted from `$TRANSLATION_LANGS` this run are intentionally deferred to the next scheduled run (the source stays MISSING/DRIFT until all requested languages are present and current) — this per-run cap is what keeps the session under the Copilot weighted effective-token cap that aborted run [#26641603577](https://github.com/Hack23/riksdagsmonitor/actions/runs/26641603577). The selector is **greenfield-first**: sources with one or more missing target files (`MISSING`) always win the `max_briefs` batch slots over sources that only need drift-fixes (`DRIFT`); `DRIFT` is only consulted when `MISSING` is empty. If `$TRANSLATION_WORKLIST` is empty (so `$MISSING_COUNT=0` **and** `$DRIFT_COUNT=0`), nothing is pending — proceed to improvement-mode (re-validate every existing translation against the current `<!-- source-sha: ... -->` trailer and fix any drift the validator flags). If still nothing changes after improvement-mode, follow `07-commit-and-pr.md §No-op policy`.
3. For each source path in `$TRANSLATION_WORKLIST` (or each line of `$EXEC_BRIEF_WORKLIST_FILE`):
   1. **Pass 1 — translate**: Read the source `executive-brief.md` in full **once**. For every language in `TRANSLATION_LANGS`, produce `analysis/daily/$DATE/$SUB/executive-brief_<lang>.md` following the TRANSLATION_GUIDE rules — **write each file with one `edit` tool call per language** (never via `python3`, `bash` heredocs, or shell redirection — see `01-bash-and-shell-safety.md §File creation & overwrite strategy`). Apply the per-language tone register from TRANSLATION_GUIDE **at write time** (so Pass 2 never needs a full re-read just to adjust register), and for `ar`/`he` start the file with `<!-- dir: rtl -->`. Preserve every verbatim block (YAML, HTML comments except `source-sha`, `dok_id` codes, Mermaid DSL bodies, code fences, URLs, file paths, evidence-anchor canonical column values). Translate every always-translate block (prose, headings, list items, table cell text, image alt-text, BLUF, decisions, link text). **Do not** read a freshly written translation back into model context to "confirm" it — the validator in Pass 2 is the authoritative gate.
   2. **Pass 2 — validate-first & targeted refine**: This is the **primary token-efficiency control**. Run `npx tsx scripts/validate-executive-brief-translations.ts --source <source> --lang "$TRANSLATION_LANGS"` in the runtime shell (the `--lang` scope restricts validation to this run's language batch so deferred languages are not reported as missing). That validator already performs every structural-parity check at near-zero model-token cost: heading / table-row / code-fence / Mermaid-block count parity, `dok_id` and URL set equality, banned-English-phrase detection (`Executive Brief`, `Decisions`, `Confidence`, `BLUF`, …), the `<!-- dir: rtl -->` marker for `ar`/`he`, and the `<!-- source-sha: -->` trailer. **Do not read passing translations back into model context** — reading every target file back in full is exactly what drove run [#26633644372](https://github.com/Hack23/riksdagsmonitor/actions/runs/26633644372) to `7.6M` effective tokens and a `429 Maximum effective tokens exceeded` abort. Only read back (and re-translate / fix) the specific `executive-brief_<lang>.md` files the validator reports as failing, then re-run the validator until it is clean for the requested languages.
   3. **Append the source-revision marker**: compute `SRC_SHA=$(git log -1 --format=%H -- <source>)` in the runtime shell. Use the `edit` tool to add or replace the final `<!-- source-sha: $SRC_SHA -->` line at the end of every translation file **whose language is in `$TRANSLATION_LANGS`** (consistent with the file-write contract — no `>>` or `echo`). Do not touch translation files for languages outside the current batch — their marker must remain stale (or absent) so the next run correctly classifies them as DRIFT/MISSING. This is the drift signal future runs use to decide whether to retranslate.
   4. **Title post-processing**: for each language code `$L` in `$TRANSLATION_LANGS`, run `npx tsx scripts/postprocess-translated-brief.ts analysis/daily/$DATE/$SUB/executive-brief_$L.md` to re-apply the renderer's `cleanArticleTitle` pipeline on the translated H1. This strips locale-specific boilerplate prefixes (`Exekutiv sammanfattning — `, `Zusammenfassung — `, `执行摘要：…`) and trailing date suffixes that the Pass 1 translation may have left in place. The helper only rewrites when the cleaned title differs from the source; it never falls back to a BLUF synthesis. Verify the script reports `✓` or `✏️` for every file (no `✗`). Do not pass `executive-brief_*.md` as a glob — that would rewrite deferred-language files outside `$TRANSLATION_LANGS` without subsequent validation, defeating the per-run language cap.
   5. **Final validate**: re-run `npx tsx scripts/validate-executive-brief-translations.ts --source <source> --lang "$TRANSLATION_LANGS"` (when available) to confirm the title post-processing in sub-step 4 did not break parity, or fall back to the structural sanity checks listed in TRANSLATION_GUIDE §Acceptance checklist. Fix any failures by re-translating only the offending language (read back only that file). Do not commit a file that fails validation.
   6. **Re-evaluate the wall-clock checkpoint** (from step 1) before starting the next source. Never start a new source after `ELAPSED_MIN >= 35`.
4. Stage every newly written / refreshed `executive-brief_<lang>.md` file. **Do not** touch `executive-brief.md` itself, any HTML under `news/`, any file under `analysis/daily/*/article.md`, or any non-translation file.
5. Call `safeoutputs___create_pull_request` **exactly once** covering the whole batch, **by agent minute 42 at the latest** (hard deadline 45 per `07-commit-and-pr.md §Deadline enforcement`). The branch prefix `news/translate/briefs/` is enforced by the safe-outputs config (`07-commit-and-pr.md`).

## Inputs

- `article_date` — optional. Restrict scanning to a single date folder.
- `subfolder` — optional. Restrict scanning to a single document type folder.
- `languages` — default `all-extra` (= `sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh`). Aliases: `nordic-extra`, `eu-extra`, `cjk`, `rtl`, `all-extra`. Comma list also accepted.
- `max_briefs` — default `1`, range `1–7`. Caps the number of **source** files processed in this run; total file output = `max_briefs × |TRANSLATION_LANGS|` (= `1 × 13 = 13` at the defaults; hard-cap worst case `7 × 13 = 91`, safely under the 200-file safe-outputs cap). The default was lowered from 3 to 1 after run #26633644372 hit the Copilot effective-token limit before finishing source #2.
- `max_langs` — default `13` (= a full source in one run), range `1–13`. Caps the number of **target languages** translated this run. The builder pre-selects the still-needed languages **greenfield-first** (missing files first, then drift) and truncates to this many. Run #26641603577 hit 27.0M weighted effective tokens (> the 25M cap) at 13 languages, but that was while the heavy `github toolsets:[all]` + three data-MCP server schemas were re-sent every turn; that dead-weight surface has been removed (this workflow only uses bash/edit/safe-outputs), collapsing the per-turn footprint so a full 13-language source now fits in one run. Lower this first if an unusually large brief approaches the cap.
- `force_retranslate` — default `false`. When `true`, every requested language is rewritten even if the `<!-- source-sha: -->` marker matches.
- `analysis_depth` — default `standard`. Echoed into the validator output for parity with content workflows; does not change translation behaviour.

## Batch-size rationale

| Quantity | Value | Source |
|----------|-------|--------|
| Average source size | ~650 words (range 232–2040) | `wc -w` over `analysis/daily/**/executive-brief.md` |
| Per-language Pass 1 write + validator gate | ~45–75 s | Sonnet-class translation budget; Pass 2 is bash-validated, not re-read into context |
| Per-source wall time (≤`max_langs` languages, sequential) | ~15–25 min at `max_langs=13` | derived |
| Default `max_briefs` / `max_langs` | 1 source / 13 languages | a slim per-turn MCP/tool surface keeps the weighted effective-token total under Copilot's per-session cap even at a full 13-language source |
| Per-session token driver | per-turn tool-schema surface × turn count | **before the fix** the dominant cost was the fixed per-turn schema (github `toolsets:[all]` + three data-MCP servers) re-sent every turn — the ~3.5× weighting multiplier. The translate agent calls none of those tools, so the surface was stripped to bash/edit/safe-outputs (+ one riksdag health-gate tool); the per-turn footprint now collapses toward the raw token count |
| Run #26641603577 (pre-fix) | 13 langs → 27.0M weighted / 25M cap → 429 before PR | gh-aw raw 7.67M; the weighted metric was ~3.5× raw and exceeded the cap — driven by the dead-weight per-turn schema, now removed; **no PR shipped** |
| Primary token levers | **strip unused per-turn MCP/tool schema** + validator-first Pass 2 | removing the data-MCP servers + github `toolsets:[all]` cuts the fixed per-turn cost so the 25M cap stops being the limiter; structural parity stays in the bash validator |
| Per-run file output | `max_briefs × max_langs` = `1 × 13` = **13 files** (default) | well under safe-outputs `max-patch-files: 200` |
| Daily throughput (3 runs) | up to **39 language-files / day** at defaults | wall-clock (Timer A/B) and the 200-file cap, not the token budget, are now the governing limits |
| Current backlog drain (≥159 untranslated sources) | greenfield-first, oldest source + missing languages first | linear |

If a run is behind schedule at agent minute 30 with translations still pending, the agent MUST trim `max_briefs` downward (drop the last selected source) rather than skip the Pass 2 validator gate — quality over completeness. A partial PR is always better than missing Timer A (job `timeout-minutes: 60`). The default `max_briefs=1` was set after run [#26633644372](https://github.com/Hack23/riksdagsmonitor/actions/runs/26633644372) repeatedly hit `CAPIError: 429 Maximum effective tokens exceeded` while attempting source #2; the validator-first Pass 2 above removes the read-back token sink, and stripping the unused per-turn MCP/tool schema (github `toolsets:[all]` + the scb/world-bank data servers — none of which this workflow ever calls) collapses the fixed per-turn cost that drove the ~3.5× weighting, so the weighted effective-token total stays under the 25M cap and the PR safe-output is reached even at the default 13-language batch.

## Rules specific to this workflow

- **Never** generate original analysis or write files outside `analysis/daily/**/executive-brief_<lang>.md`.
- **Never** modify the English source `executive-brief.md` — it is owned by per-type news workflows.
- **Validate every translation** with `scripts/validate-executive-brief-translations.ts` before commit. Re-translate (do not commit) any file that fails.
- Keep the PR under the safe-outputs 200-file cap. The default `max_briefs=1` × 13 languages = 13 files leaves ample headroom; the hard cap `max_briefs=7` × 13 = 91 stays well under 200. The previous default of 3 was reduced after run [#26633644372](https://github.com/Hack23/riksdagsmonitor/actions/runs/26633644372) hit the Copilot effective-token cap before the PR call.
- **Per-language idempotency, not workflow-level no-op**:
  - The pre-flight selector is **greenfield-first**: it classifies every candidate source as `MISSING` (≥1 requested language file absent or empty) or `DRIFT` (every requested language file present but ≥1 has a stale `<!-- source-sha: -->` trailer), then fills the `max_briefs` batch slots with `MISSING` sources oldest-first and only falls back to `DRIFT` once `MISSING` is empty. Drift-fix work **never** displaces an untranslated brief while the backlog still has missing files.
  - A target language is skipped *for that language only* when **all three** hold:
    1. `executive-brief_<lang>.md` exists and is non-empty,
    2. its `<!-- source-sha: <sha> -->` trailer matches the current `git log -1 --format=%H -- executive-brief.md`, **and**
    3. `scripts/validate-executive-brief-translations.ts` passes for that language.
  - When **all** requested languages for all candidate sources satisfy the three conditions, the run enters **translation-improvement mode**: re-run the validator across every translation, fix any drift / structural-parity regressions / RTL-marker omissions the validator flags, refresh `<!-- source-sha: -->` trailers if the source has been recommitted since, and commit the resulting changes. Append the improvement-mode rerun marker per `07-commit-and-pr.md §No-op policy`.
  - `safeoutputs___noop` is only allowed under the conditions in `07-commit-and-pr.md §No-op policy`. "All translations already exist and are valid" is **never** a noop trigger; it is an improvement trigger.

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. The operative constraint is Timer A (job `timeout-minutes: 60`) and Timer B (~60-min Copilot API session). See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`. The default `max_briefs=1` is sized to keep runs below the Copilot effective-token ceiling; exceeding it risks repeating run [#26633644372](https://github.com/Hack23/riksdagsmonitor/actions/runs/26633644372), where the session aborted on source #2 with `CAPIError: 429 Maximum effective tokens exceeded`.

**Single run** (target ~36–40 agent minutes in a 60-min job, hard deadline 45 agent minutes for the PR call):

| Minutes | Phase |
|---------|-------|
| 0–3 | MCP pre-warm; work-list resolved into `$TRANSLATION_WORKLIST` env var + `$EXEC_BRIEF_WORKLIST_FILE` (`${GITHUB_WORKSPACE}/.exec-brief-worklist.txt`); record `JOB_START=$(date +%s)` |
| 3–5 | Read TRANSLATION_GUIDE §Executive Brief Markdown Translations + selected sources |
| 5–32 | Pass 1 write + validator-first Pass 2 × `max_briefs` sources × all requested languages; re-evaluate `ELAPSED_MIN` after every source and stop selecting new sources once `ELAPSED_MIN >= 35` |
| 32–38 | Final validation with `scripts/validate-executive-brief-translations.ts`; append `<!-- source-sha: -->` trailers; stage scoped files |
| 38–42 | **One** `safeoutputs___create_pull_request` call — **HARD DEADLINE agent minute 45**; if `ELAPSED_MIN >= 42` at any point, switch to the `07-commit-and-pr.md §Emergency deadline order of operations` bash block immediately |

If the batch cannot finish under this budget, commit the translations completed so far and call `safeoutputs___create_pull_request` with label `partial`; the next scheduled run picks up the remaining work. A partial PR is always better than losing the whole batch to Timer A.

All non-workflow-specific rules are in the imported modules — do not restate them here.
