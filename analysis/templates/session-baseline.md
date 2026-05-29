<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 📆 Session Baseline Template — Kammarens Kalender & Antagna Texter

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/session-baseline.md`. Used by `weekly-review`, `monthly-review`, `motions` (quarterly aggregation), `propositions` and any aggregation workflow. See [`per-artifact-methodologies.md §session-baseline`](../methodologies/per-artifact-methodologies.md#session-baseline).

> **🎯 Purpose** — The comprehensive, structured fact layer of *which Riksdag plenary sittings and committee sessions took place during the period, how long they sat, and which texts they adopted*. Distinct from [`historical-parallels.md`](historical-parallels.md) (metric trending). This is the **calendar + roster** — data-dense, low-prose — that every other artifact in the run points back to.

## 🔄 Tradecraft Context

- **F3EAD stage** — Find + Fix: this is the primary evidence-gathering artifact; all other artifacts cite back to it for dates, dok_ids, vote counts, and actor names
- **Scope discipline** — Record every sitting and committee session in the covered period discretely; do not aggregate across sessions when individual session data is available
- **Evidence standard** — Source-grounded, structured, and low-inference; prioritise dates, durations, adopted texts, counts, chairing/session metadata over narrative prose
- **Gap handling** — If source material is incomplete or ambiguous, note the gap explicitly (`[DATA GAP: source returned zero rows]`) rather than inferring missing details; flag in `mcp-reliability-audit.md §Failure analysis`
- **Cross-reference baseline** — Every `dok_id` cited here must resolve via `get_dokument`; every MP reference must carry an `intressent_id`
- **MCP tools** — `get_calendar_events`, `search_dokument`, `search_voteringar`, `search_anforanden`, `get_betankanden`, `get_propositioner`, `get_motioner`, `get_fragor`, `get_interpellationer`, `search_regering`

> **📅 Calendar sourcing (degraded-source guard)** — The raw `get_calendar_events` MCP tool is **brittle**: when `data.riksdagen.se/kalender/` serves an HTML error page the server still returns a *successful* result with an empty `events: []` array plus an `error`/`rawHtml` sentinel, which silently reads as a legitimate zero-event window. **Do not** treat an empty `get_calendar_events` result as ground truth. Prefer, in order:
> 1. The pre-warmed artifact **`data/runtime/calendar-status.json`** (written by the `news-prewarm` action) — check its `status` (`ok`/`error`) and `path` (`mcp-primary`/`web-fallback`/`none`) fields.
> 2. The resilient CLI **`scripts/calendar-fetch.ts --from <YYYY-MM-DD> --to <YYYY-MM-DD>`**, which falls back from MCP to the public-page scraper and reports `status`/`path` honestly.
>
> If both report `status: error` / `path: none`, record the calendar as a **DATA GAP** (`[DATA GAP: calendar source degraded]`) and log it in `mcp-reliability-audit.md §Failure analysis` — never fabricate a zero-sitting week.

---

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#session-baseline) |
> | **Owning gate check** | Supplementary (Tier-C aggregation) — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | 30 prior runs of same article type |
> | **Horizon band** | per-run (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Operational Supplementary |
> | **Aggregation order** | appended (alphabetical, after canonical block) (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `session-baseline.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
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

## 📋 Run Context

| Field | Value |
|-------|-------|
| **Date** | `[REQUIRED: YYYY-MM-DD]` |
| **Run ID** | `[REQUIRED: {type}-run{N}]` |
| **Analysis Directory** | `[REQUIRED: analysis/daily/YYYY-MM-DD/{type}-run{N}/]` |
| **Article Type** | `[REQUIRED]` |
| **Riksmöte** | `[REQUIRED: e.g. 2025/26]` |
| **Period Covered** | `[REQUIRED: e.g. Week 17 (20-26 April 2026)]` |
| **Kammaren sittings** | `[REQUIRED: total # in period]` |
| **Committee sessions** | `[REQUIRED: total # in period]` |
| **Antagna betänkanden** | `[REQUIRED: total # in period]` |
| **Total voteringar** | `[REQUIRED: total # in period]` |

---

## 1️⃣ Kammaren (Plenary Sittings)

> Record each sitting separately. Populate from `get_calendar_events` (org=kammaren) and `search_dokument` — see the **📅 Calendar sourcing** guard above; prefer `data/runtime/calendar-status.json` / `scripts/calendar-fetch.ts` over the raw tool.

### Sitting 1 — `[REQUIRED: date]`

| Field | Detail |
|-------|--------|
| Datum | `[REQUIRED: YYYY-MM-DD]` |
| Plats | `Riksdagshuset, Stockholm` |
| Starttid / sluttid | `[REQUIRED: HH:MM–HH:MM]` |
| Duration | `[REQUIRED: decimal hours, e.g. 6.5 h]` |
| Antagna betänkanden | `[REQUIRED: #]` |
| Voteringar (roll-call) | `[REQUIRED: #]` |
| Anföranden | `[REQUIRED: #]` |
| Huvudtema | `[REQUIRED: 1-line summary of dominant legislative focus]` |
| Talman (chair) | `[REQUIRED: name + party]` |
| Vice talman | `[if relevant]` |
| Calendar source | `get_calendar_events dok_id or event_id` |

#### Key vote(s) this sitting

| Voteringsnummer | Beteckning | Ämne | Resultat (J–N–A–F) | Party-block pattern | Margin |
|:---------------:|:----------:|------|:------------------:|---------------------|:------:|
| `[REQUIRED]` | `[REQUIRED]` | `[1-line]` | `[#–#–#–#]` | `[e.g. Tidö vs S+V+MP+C]` | `[#]` |

*(Repeat §1 block for each sitting in the period; add Sitting 2, Sitting 3, etc.)*

---

## 2️⃣ Utskott (Committee) Sessions

> Populate from `get_calendar_events` (org=UTSK), `get_betankanden`, and direct committee-page queries — see the **📅 Calendar sourcing** guard above; prefer `data/runtime/calendar-status.json` / `scripts/calendar-fetch.ts` over the raw tool.

| Utskott | Datum | Tid | Typ (beslutsmöte/sammanträde) | Dagordning | Antagna betänkanden | Ordförande | Party | Source |
|---------|:-----:|:---:|:-----------------------------:|------------|:-------------------:|------------|:-----:|--------|
| `[e.g. FiU]` | `[YYYY-MM-DD]` | `[HH:MM]` | `[REQUIRED]` | `[1-line]` | `[#]` | `[name + intressent_id]` | `[party]` | `[get_betankanden dok_id]` |

### Committee composition snapshot (updated when change occurs)

| Utskott | Ordförande (party) | Vice ordförande (party) | Majority block | Minority parties |
|---------|--------------------|-------------------------|----------------|-----------------|
| `[FiU]` | `[name (M)]` | `[name (S)]` | `[M+KD+L+SD]` | `[S, V, MP, C]` |
| `[…]` | | | | |

---

## 3️⃣ Adopted Texts Roster

> All rows must resolve via `get_dokument`. Flag any row that fails resolution in §8 Data Quality.

| `dok_id` | Title | Typ | Föredragande utskott | Voteringsresultat | Majoritet | Länk |
|----------|-------|:---:|----------------------|:-----------------:|:---------:|------|
| `[REQUIRED: e.g. H901FiU1]` | `[REQUIRED]` | `[bet / prop / mot / skr]` | `[utskott abbrev]` | `[J/N/A/F counts]` | `[Ja/Nej/bifall/avslag]` | `[riksdagen.se URL]` |

**Period totals:**
- Betänkanden adopted: `[#]` (unanimous: `[#]`; contested: `[#]`; one-vote margin: `[#]`)
- Propositioner referred to committee: `[#]`
- Motioner filed: `[#]`

---

## 4️⃣ Votering Summary

### Top 10 by salience (sort by margin desc or political significance)

| # | Voteringsnummer | Beteckning | Ämne | Resultat (J–N–A–F) | Margin | Party-block pattern | Pivotal defectors |
|:-:|:---------------:|:----------:|------|:------------------:|:------:|---------------------|-------------------|
| 1 | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[#–#–#–#]` | `[#]` | `[Tidö vs opposition]` | `[name + party + intressent_id if any]` |
| 2 | | | | | | | |
| 3 | | | | | | | |

### Discipline matrix (by party)

> Source: `search_voteringar` grouped by `parti`. Discipline = (MPs voting with party caucus majority / MPs casting a vote) × 100.

| Party | Seats in kammaren | Votes cast | Discipline % | Break-aways (# MPs) | Break-away names (intressent_id) |
|-------|:-----------------:|:----------:|:------------:|:-------------------:|----------------------------------|
| S | 107 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| M | 68 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| SD | 73 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| V | 24 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| MP | 18 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| C | 24 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| L | 16 | `[#]` | `[%]` | `[#]` | `[names if any]` |
| KD | 19 | `[#]` | `[%]` | `[#]` | `[names if any]` |

**Period average party discipline**: `[overall %]`
**Most-disciplined party**: `[party, %]`
**Least-disciplined party**: `[party, %; note if low discipline correlates with specific issue]`

### Coalition arithmetic tracker

| Vote | Coalition votes (J) | Opposition votes (N) | Majority line (175) | Margin | Bloc pattern |
|------|:-------------------:|:--------------------:|:-------------------:|:------:|:------------|
| `[top 3 contested votes]` | `[#]` | `[#]` | 175 | `[J - 175]` | `[M+KD+L+SD / S+V+MP+C / split]` |

---

## 5️⃣ Interpellationer & Skriftliga Frågor

> Source: `get_interpellationer` and `get_fragor`. Record all in period; highlight politically significant ones.

| Typ | Nr | Avsändare | Party | Mottagare (minister) | Departement | Ämne | Status | Datum ställd | Datum besvarad |
|-----|----|-----------|:-----:|----------------------|:-----------:|------|:------:|:------------:|:--------------:|
| `[interpellation / skriftlig fråga]` | `[YYYY:N]` | `[MP + intressent_id]` | `[party]` | `[minister + titel]` | `[Fi / Ju / UD…]` | `[1-line]` | `[ställd / besvarad / utgår]` | `[YYYY-MM-DD]` | `[YYYY-MM-DD or —]` |

**Period totals** — Interpellationer: `[#]` (besvarade: `[#]`, utgångna: `[#]`). Skriftliga frågor: `[#]` (besvarade: `[#]`).

**Most-active interpellant**: `[name + party + intressent_id]` (`[#]` interpellationer in period).

---

## 6️⃣ Regeringens Aktivitet under Perioden

> Source: `search_regering` and `get_regering_document`.

| Datum | Dokumenttyp | Titel | Departement | Avsändande minister | Länk |
|:-----:|:-----------:|-------|:-----------:|---------------------|------|
| `[REQUIRED]` | `[prop / skr / SOU / Ds / remiss / pressmeddelande]` | `[REQUIRED]` | `[e.g. Fi / Ju / UD]` | `[minister name + title]` | `[regeringen.se URL]` |

**Riksråd (government decisions) of note:**
| Datum | Ärende | Beslutsdepartement | Significance | URL |
|:-----:|--------|-------------------|:------------:|-----|
| `[YYYY-MM-DD]` | `[1-line]` | `[abbrev]` | `[1–5]` | `[URL]` |

---

## 7️⃣ EU-Agenda Interface

> Record any EU-level developments (COM proposals, Council of EU decisions, EP votes, ECOFIN/Eurogroup) that directly interface with the period's Riksdag/Riksdag agenda. This section establishes the EU political context for downstream PESTLE §Legal and §Economic analysis.

| EU event | Date | Institution | Instrument / CELEX | Swedish Riksdag interface | Responsible utskott |
|----------|:----:|:-----------:|---------------------|--------------------------|:-------------------:|
| `[e.g. COM proposal published]` | `[YYYY-MM-DD]` | `[COM / EP / Council]` | `[COM(YYYY)N / CELEX]` | `[Riksdag EUN discussion / prop. referral / UU betänkande]` | `[UU / EUN / sector utskott]` |

---

## 8️⃣ Budget Cycle Position

> Locate the current period within the Swedish budget cycle. This informs downstream risk-assessment §Fiscal and scenario-analysis horizon calibration.

| Budget milestone | Date | Status | Responsible actor |
|-----------------|:----:|:------:|------------------|
| Vårpropositionen (Spring fiscal bill) | `[YYYY-MM-DD]` | `[planned / submitted / adopted / past]` | Finansdepartementet |
| Budgetpropositionen (Autumn budget) | `[YYYY-MM-DD]` | `[planned / submitted / adopted / past]` | Finansdepartementet |
| Rambeslutet (Framework decision) | `[YYYY-MM-DD]` | `[planned / adopted / past]` | Riksdag FiU |
| Anslagsbeslutet (Appropriation decision) | `[YYYY-MM-DD]` | `[planned / adopted / past]` | Riksdag kammaren |
| Finanspolitiska rådet annual report | `[YYYY-MM-DD]` | `[published / pending]` | FPR |

**Current fiscal cycle position**: `[describe: e.g. "Post-Vårproposition; pre-Budgetpropositionen; FiU reviewing spring supplement amendments"]`

---

## 9️⃣ Speaker (Anföranden) Statistics

> Source: `search_anforanden` grouped by party and talare.

| Party | # Anföranden | Top speaker | # Speeches | Dominant topic |
|:-----:|:------------:|-------------|:----------:|----------------|
| S | `[#]` | `[name + intressent_id]` | `[#]` | `[1-line]` |
| M | `[#]` | `[name]` | `[#]` | `[1-line]` |
| SD | `[#]` | `[name]` | `[#]` | `[1-line]` |
| V | `[#]` | `[name]` | `[#]` | `[1-line]` |
| MP | `[#]` | `[name]` | `[#]` | `[1-line]` |
| C | `[#]` | `[name]` | `[#]` | `[1-line]` |
| L | `[#]` | `[name]` | `[#]` | `[1-line]` |
| KD | `[#]` | `[name]` | `[#]` | `[1-line]` |

**Government representative anföranden**: `[# speeches by statsråd]`
**Longest debate**: `[topic, date, total speeches]`
**Most contested debate**: `[topic, date, # interruptions / repliker]`

---

## 🔟 Data Source Coverage

| Source | MCP tool | Rows contributed | Freshness (last retrieval ts) | Status | Notes |
|--------|----------|:----------------:|:-----------------------------:|:------:|-------|
| Plenary calendar | `get_calendar_events` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Document register | `search_dokument` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Vote records | `search_voteringar` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Speech records | `search_anforanden` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Committee reports | `get_betankanden` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Propositions | `get_propositioner` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Motions | `get_motioner` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Written questions | `get_fragor` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Interpellations | `get_interpellationer` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |
| Government docs | `search_regering` | `[#]` | `[ts]` | `[✅/⚠️/❌]` | — |

Any source returning zero rows when it should not → flag in `mcp-reliability-audit.md §Failure analysis` with the exact error and timestamp.

---

## 1️⃣1️⃣ Data Quality Checklist

- [ ] Every `dok_id` in §3 resolves via `get_dokument` without error.
- [ ] Every MP reference carries a valid `intressent_id` (verified via `get_ledamot`).
- [ ] Every vote row arithmetic is correct: `J + N + A + F = total present` (spot-check ≥ 5 rows).
- [ ] Every `regeringen.se` URL returns HTTP 200 (spot-check ≥ 5 random rows from §6).
- [ ] Period totals in §1 equal the sum across sitting blocks (no double-counting).
- [ ] No field contains an estimate: all numeric fields are exact counts from source data.
- [ ] Discipline percentages computed from actual vote data, not estimated.
- [ ] EU events in §7 cite CELEX or COM number (not just "EU regulation").
- [ ] Budget cycle position in §8 cites at least one Finansdepartementet or FPR source.
- [ ] Speaker statistics in §9 sourced from `search_anforanden` not estimated.

---

## 🔗 Cross-References

- Methodology: [`../methodologies/per-artifact-methodologies.md#session-baseline`](../methodologies/per-artifact-methodologies.md#session-baseline)
- Pair with: [`cross-session-intelligence.md`](cross-session-intelligence.md) (narrative) + [`historical-parallels.md`](historical-parallels.md) (trend) + [`coalition-mathematics.md`](coalition-mathematics.md) (vote arithmetic)
- Operational log: [`mcp-reliability-audit.md`](mcp-reliability-audit.md) (data quality issues flagged here appear there)
- Source tools: `riksdag-regering` MCP (see [`../../.github/prompts/02-mcp-access.md`](../../.github/prompts/02-mcp-access.md))
- Budget context: [`analysis/imf/README.md`](../imf/README.md) for IMF fiscal vintage used in §8

---

**Template version:** v2.0 · **Last updated:** 2026-04-25

---

## ✅ Pass-2 Self-Audit Checklist (v4.4 — required)

> **Purpose:** AI-FIRST principle requires a Pass-2 read-back-and-improve. After producing this artifact in Pass 1, re-read it end-to-end and verify each item below. Document any remediation in [`methodology-reflection.md`](methodology-reflection.md) §"Pass-2 audit log". Any unchecked ❌ box at the end of Pass 2 forces a Pass-3 rewrite of the affected section.

- [ ] **Tradecraft anchors honoured** — F3EAD stage matches the artifact's role; PIRs declared in the §Tradecraft Context block are actually addressed in the body; Admiralty grades attached to every external source; WEP band + ODNI confidence on every probabilistic judgement.
- [ ] **Source diversity floor met** — at least the minimum number of independent MCP sources required by the artifact's tradecraft block are cited; single-source claims are explicitly labelled `[SINGLE-SOURCE — corroboration pending]`.
- [ ] **Evidence specificity** — every quantified claim cites a `dok_id` (Riksdag), an SCB / IMF dataflow code, or a named external source with date; no "according to data" / "studies show" hand-waves.
- [ ] **Named-actor discipline** — every political claim names ≥ 1 person (party + role + dated act/quote) or labels the absence (`[diffuse — no named actor]`).
- [ ] **Counter-narrative present** — at least one explicit competing hypothesis, dissent quote, or framed objection appears in the body; "no opposition recorded" is itself a finding to label, not silence.
- [ ] **Election 2026 lens applied** — the §"Election 2026 Implications" subsection (or equivalent) addresses electoral salience, coalition pressure, and forward indicators; not boilerplate.
- [ ] **No illustrative content shipped as fact** — every `[REQUIRED]` placeholder is filled OR removed; every `Example:` block is clearly fenced or removed; no fabricated `dok_id`, vote count, or quote leaks into the final artifact.
- [ ] **Cross-references resolve** — every `[link](file.md)` in this artifact points to a file that exists in the run folder (`analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`) or to a methodology / template under `analysis/`.
- [ ] **Mermaid renders** — every fenced ` ```mermaid ` block parses (no missing class definitions, no orphan nodes, no >40-node graphs that overflow viewport on mobile).
- [ ] **Line-floor check** — artifact length ≥ the per-artifact floor in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json); shorter artifacts trigger Pass-2 rewrite, never a `[truncated]` note.

