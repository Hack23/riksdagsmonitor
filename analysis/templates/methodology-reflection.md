<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🔬 Methodology Reflection Template</h1>

<p align="center">
  <strong>📊 After-Action Review of the Run's Analytical Quality</strong><br>
  <em>🎯 Self-Audit · Pass-2 Evidence · Quality-Gate Score · Improvement Backlog</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.1-0A66C2?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--04--25-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.1 | **📅 Last Updated:** 2026-04-25 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template instructions:** Produce for every run as a required run-audit gate. Save as `analysis/daily/${ARTICLE_DATE}/${DOC_TYPE}/methodology-reflection.md`. Honest self-audit — this feeds the next methodology update and must not be skipped.

> **✨ What to produce:** Proof that the 7-step protocol was followed, the quality-gate score was met, the pass-2 rewrite actually changed sections, and a specific backlog of methodology improvements the next run should adopt.

---

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#methodology-reflection) |
> | **Owning gate check** | Check 7 (Family C — ICD 203 audit) + Check 6 (Pass-2 mtime) — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | every other artifact in the run |
> | **Horizon band** | per-run (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Family C — Strategic Extensions |
> | **Aggregation order** | 29 of 30 in canonical order (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `methodology-reflection.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
> | **Canonical evidence anchor** | `\| claim \| evidence (dok_id / vote / MP intressent_id / primary-source URL) \| retrieved_at \| confidence \|` — every analytical claim row uses this schema. |
>
> Cross-reference: [`README.md §Template ↔ Methodology ↔ Gate-Check Matrix`](README.md#-template--methodology--gate-check-matrix).

<!--
AI-FIRST Pass-1 / Pass-2 self-check (HTML comment — invisible in rendered articles; not stripped by aggregator unless under a "## Pass 2 …" heading).

PASS 1 (creation, minimal viable artifact):
  • Fill every REQUIRED slot above; cite ≥ 1 dok_id / vote / MP / primary-source URL per major claim.
  • Use the canonical evidence anchor schema for every analytical claim row.
  • Mermaid blocks use the cyberpunk %%{init: theme/themeVariables}%% prologue and at least one `style …` or `classDef …` directive (Check 5 of 05-analysis-gate.md).

PASS 2 (read-back & improve — AI-FIRST mandatory, ≥ 180 s after Pass 1):
  • Re-read the file end-to-end; for each section verify (a) ≥ 1 evidence anchor row, (b) WEP language tightened (no "may/might/could" hedges), (c) named actors with intressent_id where applicable, (d) Mermaid colour theming present.
  • Banned-phrase scan: "intelligence theatre", "sources say", "reportedly", "it is widely believed", "experts agree", "AI_MUST_REPLACE".
  • Citation density target: ≥ 1 evidence anchor row per 100 words of analytical prose.
  • Neutrality arithmetic: equal analytical depth across the 8 Riksdag parties (S, M, SD, V, MP, C, L, KD); flag and correct any bias in the Pass-2 Self-Audit section.

ANTI-TEMPLATE — DO NOT:
  • Ship plain prose without evidence anchor tables.
  • Leave AI_MUST_REPLACE / [REQUIRED: …] placeholders in the rendered output.
  • Cite a non-primary URL when a `dok_id` or vote record is available.
  • Treat co-occurrence of keywords as coordination; uni-directional chains as bi-directional.
  • Use a Mermaid block without colour theming (Check 5 will block aggregation).
  • Skip the Pass-2 read-back (Check 6 verifies mtime ≥ birth + 180 s OR a differing pass1/ snapshot).
-->

## 🔄 Tradecraft Context

| Element | Value |
|---------|-------|
| **F3EAD Stage** | **ANALYZE (meta-level)** — quality assurance and process improvement |
| **PIRs Served** | No direct PIR; ensures all PIR-serving outputs meet tradecraft standards |
| **Admiralty Floor** | N/A (self-audit references same sources as assessed files) |
| **WEP + ODNI** | Confidence distribution audit uses existing scale; no new probability claims |
| **Source Diversity Floor** | **AUDIT TARGET** — this file checks that all other files met Source Diversity Rule (P0: ≥4, P1: ≥3, P2: ≥2); reports violations |
| **SAT(s) Applied** | Key Assumptions Check (audit own assumptions), Quality of Information Check (source audit) |
| **ICD 203 Standards** | **ALL 9** (this file audits ICD 203 compliance across the run) |

---

## 📋 Reflection Context

| Field | Value |
|-------|-------|
| **Reflection ID** | `MET-YYYY-MM-DD-NNN` |
| **Generated** | `YYYY-MM-DD HH:MM UTC` |
| **Workflow** | `e.g., news-morning-propositions` |
| **Run duration** | `minutes` |
| **Files produced** | `N` |
| **Exemplar status** | `Yes / No — and why` |

> **Pass-2 status: executed in full** *(required literal — `05-analysis-gate.md` greps for this exact phrase, with the colon, outside the table cell.)*

---

## ✅ Required Section Contract (Gate-Enforced)

> **[REQUIRED]** `methodology-reflection.md` is invalid unless all sections below are present (as `##` headings) and completed. The canonical heading text is given here; the template renders each heading with a leading emoji (e.g. `## 📋 ICD 203 …`) and the gate accepts an optional leading emoji on each heading. The **section name** must match exactly.
>
> 1. `## 📋 ICD 203 Analytic Tradecraft Compliance Audit`
> 2. `## 🎯 Devil's-Advocate Key Judgment Coverage Matrix`
> 3. `## 📈 Confidence Distribution by Key Judgment (Posterior Required)`
> 4. `## ⚖️ Lagrådet / Statskontoret / SKR Tracking`
> 5. `## 🔗 Sibling-Folder Ingestion Record (Tier-C)`
> 6. `## 🔁 Re-run Log (Unified Schema)`
> 7. `## 🚫 Banned-Phrase Audit (Zero-Count Grid)`
> 8. `## 🔄 Pass 1 → Pass 2 Delta Table`
> 9. `## 🧭 Improvement Opportunities → PIR Roll-Forward`
>
> Beyond presence, the gate also enforces:
> - **Devil's-Advocate KJ Coverage Matrix**: no `❌` rows remain and no `OPEN` statuses remain for KJ rows (coverage must be 100%).
> - **Confidence Distribution**: every KJ row has a filled Posterior value (no `[REQUIRED]` placeholder, no empty cell).
> - **Re-run Log**: the unified column schema (`run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh`) is present as a markdown table header.

---

## 🎯 Devil's-Advocate Key Judgment Coverage Matrix

> **[REQUIRED]** Every KJ in `intelligence-assessment.md` must be challenged at least once in `devils-advocate.md`. Coverage must be **100%** before gate pass.

| KJ ID | KJ summary | Challenged in devils-advocate.md? | Counter-evidence row ID | Status |
|-------|------------|:---------------------------------:|--------------------------|:------:|
| KJ-1 | `[REQUIRED: judgement summary]` | ✅ / ❌ | `DA-##` | OPEN / CLOSED |
| KJ-2 | `[REQUIRED: judgement summary]` | ✅ / ❌ | `DA-##` | OPEN / CLOSED |
| KJ-3 | `[REQUIRED: judgement summary]` | ✅ / ❌ | `DA-##` | OPEN / CLOSED |
| ... | ... | ... | ... | ... |
| **Coverage** | — | **_N_ / _N_ KJs** | — | **Must be 100%** |

---

## 📈 Confidence Distribution by Key Judgment (Posterior Required)

> **[REQUIRED]** Explicit posterior confidence per KJ. Missing posterior values are gate failures.

| KJ ID | Prior (Pass 1) | Evidence update in Pass 2 / Re-run | Posterior (required) | Change rationale |
|------|----------------:|--------------------------------------|----------------------:|------------------|
| KJ-1 | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |
| KJ-2 | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |
| KJ-3 | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |

---

## ⚖️ Lagrådet / Statskontoret / SKR Tracking

> **[REQUIRED]** Track external implementation/legal-review signals. Use [`lagradet-tracking.md`](lagradet-tracking.md) as the canonical field fragment — the `Impact note` column below mirrors the fragment's required `impact_note` field.

| Track | Applicability | Status | Latest evidence (URL + date) | Next check | Impact note |
|-------|:-------------:|--------|-------------------------------|------------|-------------|
| Lagrådet yttrande | Y/N | `not applicable / referral pending / yttrande published` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |
| Statskontoret implementation signal | Y/N | `found / none found / not triggered` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |
| SKR operational impact signal | Y/N | `found / none found / not triggered` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |

---

## 🔗 Sibling-Folder Ingestion Record (Tier-C)

> **[REQUIRED for Tier-C; REQUIRED to mark N/A for non-Tier-C]**

| Sibling folder | Artifact cited | Why ingested | Impact on current KJ / scenario | Citation |
|----------------|----------------|--------------|-----------------------------------|----------|
| `[REQUIRED or N/A]` | `[REQUIRED or N/A]` | `[REQUIRED or N/A]` | `[REQUIRED or N/A]` | `[REQUIRED or N/A]` |

---

## 🔁 Re-run Log (Unified Schema)

> **[REQUIRED]** Use this exact schema for every same-day improvement re-run.

| run_id | attempt | new dok_ids | artifacts extended | flags closed | vintage refresh |
|--------|--------:|-------------|--------------------|--------------|-----------------|
| `[REQUIRED]` | `[REQUIRED]` | `[comma-separated or none]` | `[comma-separated list]` | `[count + ids]` | `[IMF/SCB/other + result]` |

---

## 🚫 Banned-Phrase Audit (Zero-Count Grid)

> **[REQUIRED]** All banned phrases must be zero in final analysis + article.

| Phrase | Count | Location | Status |
|--------|------:|----------|:------:|
| intelligence theatre | `0` | `—` | ✅ |
| sources say | `0` | `—` | ✅ |
| reportedly | `0` | `—` | ✅ |
| it is widely believed | `0` | `—` | ✅ |
| experts agree | `0` | `—` | ✅ |
| AI_MUST_REPLACE | `0` | `—` | ✅ |

---

## 🔄 Pass 1 → Pass 2 Delta Table

> **[REQUIRED]** Show measurable change; narrative-only statements are insufficient.

| Artifact | Pass 1 baseline | Pass 2 (or re-run) state | Delta | Why it changed |
|----------|------------------|--------------------------|-------|----------------|
| `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` |

---

## 🧭 Improvement Opportunities → PIR Roll-Forward

> **[REQUIRED]** Convert every unresolved methodology gap into a tracked PIR action.

| Improvement opportunity | Severity | Linked PIR (`pir-status.json`) | Owner | Due date | Roll-forward status |
|-------------------------|:--------:|--------------------------------|-------|----------|---------------------|
| `[REQUIRED]` | HIGH/MED/LOW | `PIR-...` | `[REQUIRED]` | `YYYY-MM-DD` | OPEN / ANSWERED / DEFERRED |

---

## 🧭 7-Step Protocol Compliance

> ⚠️ **Illustrative example below — replace every status marker, count, and note with run-specific findings before publishing.** The completion marks, file counts, and missed-file names shown here are drawn from a worked example and must not be shipped as pre-audited results.

```mermaid
flowchart LR
    S1["1️⃣ Prepare"] --> S2["2️⃣ Download"] --> S3["3️⃣ Per-File"] --> S4["4️⃣ Core Synthesis"] --> S5["5️⃣ Extensions"] --> S6["6️⃣ Quality Gate"] --> S7["7️⃣ Pass-2"]

    style S1 fill:#4CAF50,color:#FFFFFF
    style S2 fill:#4CAF50,color:#FFFFFF
    style S3 fill:#4CAF50,color:#FFFFFF
    style S4 fill:#4CAF50,color:#FFFFFF
    style S5 fill:#FFC107,color:#000000
    style S6 fill:#4CAF50,color:#FFFFFF
    style S7 fill:#FF9800,color:#FFFFFF
```

| Step | Completed? | Evidence | Notes |
|:----:|:----------:|----------|-------|
| 1 Prepare | ✅ | Methodologies read; citations present in output | — |
| 2 Download | ✅ | `data-download-manifest.md` present, N documents, data-depth table complete | Manifest complete |
| 3 Per-file | ✅ | N analyses in `documents/`, all with ≥ 1 Mermaid | — |
| 4 Core synthesis | ✅ | All 9 Family A files + 2 Family B files | — |
| 5 Extensions | 🟡 | Only 3 of 5 triggered files produced | Missed `comparative-international` despite P0 doc |
| 6 Quality gate | ✅ | Composite score 8.01 | — |
| 7 Pass-2 rewrite | 🟡 | 8 of 11 files measurably rewritten | Synthesis + SWOT still Pass-1 |

---

## 🏁 Quality-Gate Scorecard

> ⚠️ **Illustrative example below — replace every numeric score and evidence note with run-specific values before publishing.** The scores, weighted totals, and evidence summaries shown here are drawn from a worked example and must not be shipped as real metrics.

| Dimension | Weight | Score (/10) | Weighted | Evidence |
|-----------|:------:|:-----------:|:--------:|----------|
| 📎 Evidence | 25% | 8.5 | 2.13 | 94 dok_id citations across outputs |
| 📐 Depth | 25% | 8.0 | 2.00 | L2+ applied on all P1 docs |
| 📋 Structural | 20% | 8.5 | 1.70 | All Mermaid color-coded; 2 missing doc-control blocks |
| 🎯 Actionable | 15% | 7.5 | 1.13 | 11 of 14 forward indicators dated |
| ⚖️ Neutrality | 15% | 7.0 | 1.05 | Two SWOT entries imbalanced toward government |
| **Composite** | — | — | **8.01** | ✅ pass (threshold 7.0) |

---

## ✏️ Pass-2 Evidence — Before vs After

> [!WARNING]
> **Illustrative example — replace before publishing.** The table below (and the subsequent Content Metrics, What Worked, What to Improve, and Backlog sections) carries worked-example content — named ministers, dok_ids, before/after ledes, word counts, citation counts, and specific "fix for next run" entries — from a prior reference run. Replace every row with run-specific Pass-2 evidence, metrics, and retrospection before committing this file; do not ship the example values as if they were produced by the current run.

| File | Before Pass-2 (lede snippet) | After Pass-2 (lede snippet) | Improvement |
|------|------------------------------|-----------------------------|-------------|
| `synthesis-summary.md` | "The government tabled several propositions today." | "Finance Minister **Elisabeth Svantesson (M)** tabled the 2026 Spring Bill (HD03100) alongside an extra amendment budget (HD0399) and three fiscal support measures." | 🟢 Named actor + dok_ids added |
| `swot-analysis.md` — Opportunities Q1 | "Potential for cross-party support." | "Cross-party support from SD on sentencing (HD01JuU15) extends to fuel-tax package (HD03236)." | 🟢 Specific cross-reference added |
| `executive-brief.md` — BLUF | "Coalition shows discipline." | "Coalition unanimous on FiU48 (confidence 🟩 HIGH; L reservation noted separately)." | 🟢 Confidence qualifier added |

---

## Re-run log

<!-- improvement-mode only. Heading MUST stay `## Re-run log` (no emoji, no parenthetical) so the gate regex `^## Re-run log` matches across all 14 news workflows. Values are NOT wrapped in backticks — the gate greps for the literal expanded `run_id=<digits>` / `attempt=<digits>` of the current run. -->

- **Re-run**: YYYY-MM-DD HH:MM UTC · workflow=$GITHUB_WORKFLOW · run_id=$GITHUB_RUN_ID · attempt=$GITHUB_RUN_ATTEMPT
  - new dok_ids: <count or "none">
  - artifacts extended: <comma-separated list or "none — content stable">
  - flags closed: <count>
  - vintage refresh: <"yes" or "no, IMF WEO Apr-2026 still current">

---

## 📊 Content Metrics

> Include IMF provenance and Statskontoret coverage in this section whenever relevant. Economic claims without IMF vintage/provenance or implementation claims without a Statskontoret search note are methodology gaps, even if the rest of the gate passes.

| Metric | Target | Actual | Status |
|--------|:------:|:------:|:------:|
| Total word count across Family A | ≥ 5 000 | 7 320 | 🟢 |
| Mermaid diagrams (total) | ≥ 12 | 19 | 🟢 |
| dok_id citations (total) | ≥ 40 | 94 | 🟢 |
| Named actors (total) | ≥ 20 | 37 | 🟢 |
| Forward indicators with dates | ≥ 8 | 11 | 🟢 |
| 🟢 Low-confidence claims flagged | all | 6 of 6 flagged | 🟢 |
| 🔴 Unresolved TODOs / placeholders | 0 | 0 | 🟢 |
| **Banned phrases detected** | 0 | _N_ | 🟢 = 0 · 🔴 > 0 (see `political-style-guide.json`) |
| **Citation density (article)** | ≤ 200 words/anchor | _N_ | 🟢 ≤ threshold · 🟡 ≤ 1.5× · 🔴 > 1.5× |
| **Stale economicProvenance (>6mo)** | 0 unannotated | _N_ | 🟢 = 0 · 🟡 annotated · 🔴 unannotated stale |
| **Pass-2 net change** | ≥ 5% (word count + citations) | _N%_ | 🟢 ≥ 5% · 🟡 3–5% · 🔴 < 3% (cosmetic-only) |
| **Full-text fetched (top-N by DIW)** | ≥ 3 (≥ 5 Tier-C) | _N of N_ | 🟢 ≥ floor · 🟡 1 below · 🔴 > 1 below |
| **L2+ docs without full text** | 0 | _N_ | 🟢 = 0 · 🟡 1–2 · 🔴 ≥ 3 |
| **Prior-voteringar enrichment** | ≥ 1 entry per committee touched | _N_ rows in `data-download-manifest.md §Prior-Voteringar Enrichment` | 🟢 all committees covered · 🟡 ≥ 50% covered · 🔴 < 50% covered |
| **Statskontoret pre-warm** | trigger-checked + recorded | `triggered: Y/N` · `result: source URL / "no source found" / "no trigger matched"` | 🟢 trigger evaluated + result recorded · 🟡 evaluated, source not found despite trigger · 🔴 trigger not evaluated |
| **IMF pre-warm** | always (vintage + indicator) | `WEO {Apr-2026 / current vintage}` · `{indicators used}` | 🟢 current vintage (≤ 6 months) · 🟡 stale vintage with annotation · 🔴 not pre-warmed |
| **Lagrådet tracking** (major bills only) | referral status recorded | `not applicable / referral pending / yttrande {URL + date}` | 🟢 status recorded · 🟡 referral pending tagged · 🔴 applicable but not checked |
| **Party `[unconfirmed]` flags** | every empty-`parti` row tagged | _N_ flags · _N_ closed via `search_ledamoter` | 🟢 all flagged or closed · 🟡 ≥ 80% flagged · 🔴 inferred without flag |
| **Election-proximity multiplier (1.5×)** | applied when election ≤ 6 months | `applied: Y/N` · scope: `opposition motions / contested propositions` | 🟢 applied · 🟡 N/A (outside window) |
| **Withdrawn documents** | listed not silently dropped | _N_ rows in `data-download-manifest.md §Withdrawn Documents` | 🟢 all listed · 🟡 N/A (none in batch) |
| **PIR carry-forward** | prior-cycle PIRs read at pre-warm | _N_ open PIRs ingested · _N_ closed this run | 🟢 read at pre-warm · 🟡 read end-of-cycle · 🔴 not read |
| **Single-agent review substitute** — three-component non-ICD control | all 3 evidenced | Pass 2 ✅/❌ · Devil's Advocate ✅/❌ · Cross-folder/Prior-cycle citation ✅/❌ | 🟢 all 3 ✅ · 🟡 2/3 ✅ · 🔴 ≤ 1/3 ✅ |

---

## 🌐 Data Source Connectivity Audit

> **[REQUIRED]** — Record the live connectivity status of every external data source attempted during this run. This feeds the improvement backlog and enables tracking of systematic fetch failures across runs.

| Source | Endpoint | Status | Fallback Used | Notes |
|--------|----------|:------:|:-------------:|-------|
| **IMF WEO** | `tsx scripts/imf-fetch.ts weo` | 🟢 live / 🟡 cached / 🔴 failed | Y/N | vintage: `{WEO-MMM-YYYY}` |
| **IMF SDMX** | `tsx scripts/imf-fetch.ts sdmx` | 🟢 live / 🔴 failed | N/A | dataflow: `{e.g. CPI, IFS}` |
| **Riksdag MCP** | `riksdag-regering` | 🟢 live / 🔴 failed | N/A | sync time: `{ISO timestamp}` |
| **Statskontoret** | `web_fetch statskontoret.se` | 🟢 live / 🟡 no trigger / 🔴 blocked | N/A | — |
| **Lagrådet** | `web_fetch lagradet.se` | 🟢 live / 🟡 N/A / 🔴 blocked | N/A | — |
| **SCB** | `scb` MCP | 🟢 live / 🟡 not needed / 🔴 failed | N/A | — |
| **World Bank** | `world-bank` MCP | 🟢 live / 🟡 not needed / 🔴 failed | N/A | non-economic only |

> **IMF fallback hierarchy** (codified in `scripts/imf-fetch.ts`):
> 1. Live fetch → persist result with `--persist`
> 2. If live fails → load from `analysis/data/imf/{indicator}/{country}.json` cache
> 3. If cache is >6 months old → annotate with `>6 month vintage` warning
> 4. If no cache exists → report as 🔴 in this table and flag in §What to Improve

---

## 🧪 Recurring Data-Quality Patterns — Pass-2 Scan

> **[REQUIRED in Pass-2]** — Scan the run's `data-download-manifest.md` for the six recurring failure modes catalogued from prior reflections. For each pattern, record whether it was encountered and whether the prescribed remediation in `.github/prompts/03-data-download.md` was applied. A pattern that fired without the documented remediation is a Pass-2 improvement target and rolls forward to `§Improvement Opportunities → PIR Roll-Forward`.

| # | Pattern | Symptom in manifest | Documented remediation | Encountered? | Remediation applied? |
|:-:|---------|---------------------|------------------------|:------------:|:--------------------:|
| 1 | `search_voteringar` 0-result with `bet`-prefix | "API returned 0 results — likely indexing lag" while other queries return votes | Use `avser` + `rm`, full `<rm>:<bet>`, or unfiltered + post-filter (`03-data-download.md §Prior-voteringar enrichment`) | ☐ yes ☐ no | ☐ yes ☐ no ☐ N/A |
| 2 | Pre-publication committee documents | `Dokumentet är inte publicerat` body, `status: planerat`, future scheduled date | Tag `coverage_state: pre_publication`, add to Deferred Retrieval Queue with `retryAfter`, downgrade derived-claim confidence | ☐ yes ☐ no | ☐ yes ☐ no ☐ N/A |
| 3 | Proposition HTML-wrapper extraction failure | `full_text_available: true` but extracted plaintext < 400 chars / dominated by CSS | Tag `coverage_state: pdf_html_wrapper`, set `full_text_available: partial`, downgrade content-extraction confidence to 🟧 MEDIUM with explicit `pdf_html_wrapper` reason | ☐ yes ☐ no | ☐ yes ☐ no ☐ N/A |
| 4 | Statskontoret root-domain miss | `Statskontoret: no directly relevant source found` after a single `web_fetch https://www.statskontoret.se/` | Fetch `/publikationer/`, agency-scoped landing pages, or `?s={keyword}`; cite the specific page URL, not the root domain | ☐ yes ☐ no | ☐ yes ☐ no ☐ N/A |
| 5 | Lagrådet "referral pending" without index scan | `Lagrådet: referral pending` recorded after only a root-domain fetch | Scan `/yttranden/` (year-filtered), then `site:lagradet.se` external fallback; cite the index URL in the manifest line | ☐ yes ☐ no | ☐ yes ☐ no ☐ N/A |
| 6 | Manifest schema drift | Required sections (Coverage State, Full-Text Fetch Outcomes, Deferred Retrieval Queue, Prior-Voteringar, Statskontoret, Lagrådet, PIR Carry-Forward, Withdrawn) missing or renamed vs `analysis/templates/data-download-manifest.md` | Restore the canonical headings exactly; do not invent variant names | ☐ yes ☐ no | ☐ yes ☐ no ☐ N/A |

> If any pattern is marked "Encountered: yes / Remediation applied: no", open a corresponding row in `§🧱 What to Improve` with the concrete fix and add a PIR row in `§🧭 Improvement Opportunities → PIR Roll-Forward`.

---

## 🎓 What Worked

- Pass-2 rewrite substantially sharpened `synthesis-summary.md` §Finding 1 by adding SEK-denominated figures and SIFO polling gap.
- Cross-reference map XR-01 (fiscal cluster) made the synthesis narrative visibly tighter.
- ACH in `devils-advocate.md` surfaced a risk (EU state-aid review) that the main risk register had not yet flagged.

---

## 🧱 What to Improve

| # | Area | Gap | Concrete fix for next run |
|:-:|------|-----|---------------------------|
| 1 | Extensions trigger logic | P0 doc did not trigger `comparative-international.md` | Add "P0 = mandatory comparative" rule to Step 5 checklist |
| 2 | Synthesis Pass-2 | Lede still reads like a docket, not a story | Rewrite lede to open with the #1 DIW finding, not a document count |
| 3 | SWOT neutrality | Two Q1 entries lack opposition framing | Pair every government strength with an opposition-framed threat |
| 4 | Forward indicators | Three indicators have no explicit date | Require ISO date or committee session ID |
| 5 | Language coverage | Only EN + SV produced; DA/NB pending | Schedule translation workflow slot earlier |

---

## 🔁 Backlog for Methodology Updates

| # | Proposal | Target file | Priority |
|:-:|----------|-------------|:--------:|
| B1 | Codify "P0 → comparative-international" as a mandatory trigger | `ai-driven-analysis-guide.md` Step 5 | 🟠 HIGH |
| B2 | Add lede-rewrite rule to synthesis template | `synthesis-summary.md` | 🟠 HIGH |
| B3 | Add SWOT pairing rule ("every strength paired with an opposition threat") | `political-swot-framework.md` | 🟡 MEDIUM |
| B4 | Require ISO date / committee-session ID for every forward indicator | `forward-indicators.md` | 🟡 MEDIUM |

---

## 📋 ICD 203 Analytic Tradecraft Compliance Audit

> **[REQUIRED]** — Every `methodology-reflection.md` must include this ICD 203 compliance checklist. All 9 standards must pass for the workflow to be considered compliant.

> [!WARNING]
> **Illustrative example — replace before publishing.** The checklist rows, status markers, and evidence cells below are worked-example values from a prior reference run and must be replaced with run-specific status and evidence before this file is committed. Do not ship pre-filled ✅ markers or an overall `COMPLIANT` verdict without having reassessed every standard for the current run.

| ICD 203 Standard | Status | Evidence |
|------------------|:------:|----------|
| **1. Source quality described** | ✅ | All evidence tables have Admiralty codes `[A–F][1–6]` |
| **2. Uncertainty expressed** | ✅ | WEP + ODNI confidence overlay used for all forward-looking claims |
| **3. Judgments vs assumptions distinguished** | ✅ | Assumptions section in `intelligence-assessment.md` |
| **4. Alternative analysis incorporated** | ✅ | ACH matrix in `devils-advocate.md` with ≥3 hypotheses |
| **5. Customer relevance demonstrated** | ✅ | 3 decisions named in `executive-brief.md` |
| **6. Logical argumentation used** | ✅ | Evidence chains traced in all synthesis files |
| **7. Consistency explained** | ✅ | Changelog in document control blocks |
| **8. Accurate judgments made** | ✅ | Quality gate score 8.01/10 |
| **9. Visual information incorporated** | ✅ | 19 Mermaid diagrams across workflow |

> **Single-agent review substitute** (separate non-ICD internal control): news workflows run as a single AI agent. Per [`04-analysis-pipeline.md §Single-agent review substitute`](../../.github/prompts/04-analysis-pipeline.md), this control requires **all three** components evidenced — (a) Pass 2 read-back, (b) Devil's Advocate / ACH ≥ 3 hypotheses, (c) cross-folder peer citation (Tier-C) **or** prior-cycle citation (single-type). State which components were satisfied in the §Content Metrics row; if any is missing, surface the gap as the top item in §What to Improve. ICD 203 Standard 9 keeps its established repository meaning — assess it separately above using the existing terminology, not via this substitute control.

**ICD 203 Compliance Status:** `[SELECT: ✅ COMPLIANT / ❌ NON-COMPLIANT]`

---

## 🏆 Exemplar Assessment

| Criterion | Met? | Notes |
|-----------|:----:|-------|
| Composite quality-gate score ≥ 8.0 | ✅ | 8.01 |
| All 9 Family A files present | ✅ | — |
| ≥ 1 Mermaid per file | ✅ | Average 1.7 |
| Pass-2 rewrite documented | ✅ | See section above |
| Two or more Family C + D files completed with depth adapted to DIW tier | ✅ | Illustrative example — all Family C (5) and Family D (7) files are always produced; depth adapted by DIW tier per Step 5 contract |

**Verdict: Eligible as reference exemplar for `${DOC_TYPE}` workflow template set.**

---

**Document Control**
- **Template path:** `/analysis/templates/methodology-reflection.md`
- **Referenced by:** [ai-driven-analysis-guide.md § Step 5](../methodologies/ai-driven-analysis-guide.md#step-5--extensions-f3ead-analyze-continued)
- **Classification:** Public
- **Next Review:** 2026-07-21
