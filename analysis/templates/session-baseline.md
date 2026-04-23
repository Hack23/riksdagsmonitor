<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 📆 Session Baseline Template — Kammarens Kalender & Antagna Texter

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/session-baseline.md`. Used by `weekly-review`, `monthly-review`, `motions` (quarterly aggregation), `propositions` and any aggregation workflow. See [`per-artifact-methodologies.md §session-baseline`](../methodologies/per-artifact-methodologies.md#session-baseline).

> **🎯 Purpose** — The comprehensive, structured fact layer of *which Riksdag plenary sittings and committee sessions took place during the period, how long they sat, and which texts they adopted*. Distinct from [`historical-parallels.md`](historical-parallels.md) (metric trending). This is the **calendar + roster** — data-dense, low-prose — that every other artifact in the run points back to.

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
