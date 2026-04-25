<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 📆 Session Baseline Template — Kammarens Kalender & Antagna Texter

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/session-baseline.md`. Used by `weekly-review`, `monthly-review`, `motions` (quarterly aggregation), `propositions` and any aggregation workflow. See [`per-artifact-methodologies.md §session-baseline`](../methodologies/per-artifact-methodologies.md#session-baseline).

> **🎯 Purpose** — The comprehensive, structured fact layer of *which Riksdag plenary sittings and committee sessions took place during the period, how long they sat, and which texts they adopted*. Distinct from [`historical-parallels.md`](historical-parallels.md) (metric trending). This is the **calendar + roster** — data-dense, low-prose — that every other artifact in the run points back to.

## 🔄 Tradecraft Context

- Use this artifact to establish the factual session baseline for the covered period before drawing analytical conclusions in other artifacts.
- Keep content source-grounded, structured, and low-inference: prioritise dates, durations, adopted texts, counts, chairing/session metadata over narrative prose.
- Where multiple sittings or committee sessions occurred, record each discretely so downstream artifacts can cite this file as the canonical calendar/roster reference.
- If source material is incomplete or ambiguous, note the gap explicitly rather than inferring missing details.

---

## 📋 Run Context

| Field | Value |
|-------|-------|
| **Date** | `[REQUIRED: YYYY-MM-DD]` |
| **Run ID** | `[REQUIRED: {type}-run{N}]` |
| **Analysis Directory** | `[REQUIRED: analysis/daily/YYYY-MM-DD/{type}-run{N}/]` |
| **Article Type** | `[REQUIRED]` |
| **Riksmöte** | `[REQUIRED: e.g. 2025/26]` |
| **Period Covered** | `[REQUIRED: e.g. Week 17 (20-26 April 2026)]` |

---

## 1️⃣ Kammaren (Plenary Sittings)

### Sitting 1 — `[REQUIRED: date]`

| Field | Detail |
|-------|--------|
| Datum | `[REQUIRED: YYYY-MM-DD]` |
| Plats | `Riksdagshuset, Stockholm` |
| Starttid / sluttid | `[REQUIRED: HH:MM–HH:MM]` |
| Antagna betänkanden | `[REQUIRED: #]` |
| Voteringar (roll-call) | `[REQUIRED: #]` |
| Anföranden | `[REQUIRED: #]` |
| Huvudtema | `[REQUIRED: 1-line]` |
| Talman (chair) | `[REQUIRED: name]` |

(Repeat §1 block for each sitting in the period.)

---

## 2️⃣ Utskott (Committee) Sessions

| Utskott | Datum | Tid | Dagordning | Antagna betänkanden | Ordförande |
|---------|:-----:|:---:|------------|:-------------------:|------------|
| `[REQUIRED: e.g. FiU]` | `[YYYY-MM-DD]` | `[HH:MM]` | `[1-line]` | `[#]` | `[name + intressent_id]` |

---

## 3️⃣ Adopted Texts Roster

| `dok_id` | Title | Typ | Föredragande / utskott | Voteringsresultat | Länk |
|----------|-------|:---:|------------------------|:-----------------:|------|
| `[REQUIRED: e.g. H901FiU1]` | `[REQUIRED]` | `[bet / prop / mot]` | `[MP + intressent_id / utskott]` | `[Ja/Nej/Avstår]` | `[URL on riksdagen.se]` |

All rows must resolve via `get_dokument` (see [`mcp-reliability-audit.md`](mcp-reliability-audit.md)).

---

## 4️⃣ Votering Summary

### Top 10 by salience

| # | Voteringsnummer | Beteckning | Ämne | Resultat (J–N–A–F) | Party-block pattern |
|:-:|:---------------:|:----------:|------|:------------------:|---------------------|
| 1 | `[REQUIRED]` | `[REQUIRED]` | `[REQUIRED]` | `[#–#–#–#]` | `[e.g. Tidö vs S+V+MP+C]` |

### Discipline matrix (by party)

| Party | Votes cast | Discipline % | Break-aways (MP count) |
|-------|:----------:|:------------:|:----------------------:|
| S | `[#]` | `[%]` | `[#]` |
| M | `[#]` | `[%]` | `[#]` |
| SD | `[#]` | `[%]` | `[#]` |
| V | `[#]` | `[%]` | `[#]` |
| MP | `[#]` | `[%]` | `[#]` |
| C | `[#]` | `[%]` | `[#]` |
| L | `[#]` | `[%]` | `[#]` |
| KD | `[#]` | `[%]` | `[#]` |

---

## 5️⃣ Interpellationer & Frågor

| Typ | Avsändare | Mottagare (minister) | Ämne | Status | Datum |
|-----|-----------|----------------------|------|:------:|:-----:|
| `[interpellation / skriftlig fråga]` | `[MP + intressent_id + party]` | `[minister + department]` | `[1-line]` | `[ställd / besvarad / utgår]` | `[YYYY-MM-DD]` |

---

## 6️⃣ Regeringens Aktivitet under Perioden

| Datum | Dokumenttyp | Titel | Departement | Länk |
|:-----:|:-----------:|-------|:-----------:|------|
| `[REQUIRED]` | `[prop / skr / SOU / Ds / remiss]` | `[REQUIRED]` | `[e.g. Fi / Ju / UD]` | `[regeringen.se URL]` |

Populated from `search_regering` / `get_regering_document`.

---

## 7️⃣ Data Source Coverage

| Source | Rows contributed | Freshness | Notes |
|--------|:----------------:|:---------:|-------|
| `search_dokument` | `[#]` | `[ts]` | — |
| `get_calendar_events` | `[#]` | `[ts]` | — |
| `search_voteringar` | `[#]` | `[ts]` | — |
| `search_anforanden` | `[#]` | `[ts]` | — |
| `get_betankanden` | `[#]` | `[ts]` | — |
| `get_propositioner` | `[#]` | `[ts]` | — |
| `get_motioner` | `[#]` | `[ts]` | — |
| `get_fragor` / `get_interpellationer` | `[#]` | `[ts]` | — |
| `search_regering` | `[#]` | `[ts]` | — |

Any source returning zero rows when it shouldn't → flag in `mcp-reliability-audit.md §Failure analysis`.

---

## 8️⃣ Data Quality Checklist

- [ ] Every `dok_id` in §3 resolves via `get_dokument`.
- [ ] Every MP reference carries an `intressent_id`.
- [ ] Every vote row sums correctly (`J + N + A + F = total`).
- [ ] Every `regeringen.se` URL returns HTTP 200 (spot-check 5 random).
- [ ] Period totals in §1 equal the sum across sitting blocks (arithmetic check).
- [ ] No row is an estimate (numeric fields have exact counts).

---

## 🔗 Cross-References

- Methodology: [`../methodologies/per-artifact-methodologies.md#session-baseline`](../methodologies/per-artifact-methodologies.md#session-baseline)
- Pair with: [`cross-session-intelligence.md`](cross-session-intelligence.md) (narrative) + [`historical-parallels.md`](historical-parallels.md) (trend)
- Source tools: `riksdag-regering` MCP (see [`../../.github/prompts/02-mcp-access.md`](../../.github/prompts/02-mcp-access.md))

---

**Template version:** v1.2 · **Last updated:** 2026-04-25

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

