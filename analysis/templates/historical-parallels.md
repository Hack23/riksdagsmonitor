<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🕰️ Historical Parallels Template</h1>

<p align="center">
  <strong>📊 Disciplined Use of Precedent to Illuminate Today's Decisions</strong><br>
  <em>🎯 Named Precedents · Structural Similarity · Outcome Evidence · Divergence Tests</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.1-0A66C2?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--04--25-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.2 | **📅 Last Updated:** 2026-04-25 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template instructions:** Produce on every run for the target document and save as `analysis/daily/${ARTICLE_DATE}/${DOC_TYPE}/historical-parallels.md`. When clear historical precedent exists (for example, grundlag change, major budget reset, foreign-policy pivot, crisis response), provide the structured precedent comparison below; when no strong precedent exists, still produce this file and record an explicit **no-precedent finding** with the reasoning.

> **✨ What to produce:** A structured comparison of today's measure against at least three named historical episodes, including a structural-similarity score, the observed outcome of each precedent, and explicit tests for where today's situation **diverges** from its precedents.

---

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#historical-parallels) |
> | **Owning gate check** | Check 8 (Family D — ≥ 2 historical episodes) — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | historical Riksdag/government records |
> | **Horizon band** | mixed (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Family D — Electoral & Domain |
> | **Aggregation order** | 19 of 30 in canonical order (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `historical-parallels.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
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

| Field | Value |
|-------|-------|
| **F3EAD stage** | `Exploit / Analyze` (structural comparison deepens interpretation of current measure) |
| **PIRs** | `matches the PIR of the subject measure (e.g., grundlag-risk, fiscal-trajectory, coalition-stability)` |
| **Admiralty floor** | `A1 for current-measure anchor dok_id; B2–C3 acceptable for historical precedents from archival sources` |
| **SATs used** | `Outside-In Thinking; Structured Analogies; Key Assumptions Check; Devil's Advocacy` |
| **ICD 203 standards applied** | `sources, alternative analysis, consistency/change, argumentation` |

> See [`political-style-guide.md`](../methodologies/political-style-guide.md) for canonical F3EAD / PIR catalog / Admiralty Code / ICD 203 / WEP / SATs definitions.

---

## 📋 Parallel Context

| Field | Value |
|-------|-------|
| **Parallel ID** | `HIS-YYYY-MM-DD-NNN` |
| **Generated** | `YYYY-MM-DD HH:MM UTC` |
| **Subject measure** | `e.g., HD03236 Pre-election fiscal relief` |
| **Era span of precedents** | `e.g., 1992–2018` |
| **Precedent count** | `3–5` |
| **Primary analogue** | `e.g., 2010 Reinfeldt pre-election jobbskatteavdrag` |
| **Overall Confidence** | `🟩 HIGH` |

---

## 🧭 Precedent Map

```mermaid
timeline
    title Swedish pre-election fiscal interventions (Moderaterna-led)
    1991 : Bildt government early tax-shift
    2006 : Reinfeldt jobbskatteavdrag introduction
    2010 : Reinfeldt pre-election jobbskatteavdrag step 5
    2018 : Löfven pre-election welfare package
    2022 : Andersson pre-election energy-rebate
    2026 : Kristersson fuel + energy support (subject)
```

---

## 📚 Precedent Register

| # | Year | Episode | Government | Measure | Pre-election effect | Post-measure outcome | Structural similarity (1–10) |
|:-:|:----:|---------|------------|---------|----------------------|---------------------|:----------------------------:|
| HP-1 | 2010 | Reinfeldt step-5 jobbskatteavdrag (earned-income tax credit) | M-led Alliance | Income-tax cut worth ~0.8 % GDP | +1.1 pp incumbent SIFO | Alliance re-elected, reduced majority | 8 |
| HP-2 | 2018 | Löfven welfare package | S-MP-led | Transfer boost for pensioners and families | +0.6 pp incumbent | Coalition lost, formed after 4-month hung parliament | 6 |
| HP-3 | 2022 | Andersson energy-rebate | S-led | Retroactive energy-cost support | +0.4 pp incumbent | Coalition lost narrowly | 7 |
| HP-4 | 2006 | Reinfeldt jobbskatteavdrag (earned-income tax credit) introduction | M-led Alliance | Income-tax cut | +2.3 pp incumbent | Alliance won decisively | 6 |

---

## 🧪 Structural-Similarity Scoring (subject vs HP-1)

| Dimension | Subject (HD03236) | HP-1 (2010) | Match (0–2) |
|-----------|-------------------|-------------|:-----------:|
| Party in government | M-led | M-led | 2 |
| Electoral window | 5 months to election | 6 months to election | 2 |
| Fiscal instrument type | Tax reduction + subsidy | Tax reduction | 1 |
| Target segment | Rural + homeowner | Working-age earners | 1 |
| Macro backdrop | +0.8 % GDP, weak recovery | +3.1 % GDP, recovery | 0 |
| Opposition framing | Regressive incidence | Regressive incidence | 2 |
| EU compatibility signal | 🟠 tension | 🟢 none | 0 |
| **Total** | — | — | **8 / 14** |

---

## 📈 Outcome-Base-Rate Table

| Question | Precedent rate | Source |
|----------|:-------------:|--------|
| Pre-election fiscal intervention produces net +0–1 pp shift | 4 of 4 (100 %) | HP-1..HP-4 |
| Incumbent wins the following election | 2 of 4 (50 %) | HP-1..HP-4 |
| Opposition successfully reframes as regressive | 3 of 4 (75 %) | HP-1..HP-4 |
| EU-level scrutiny materialises | 1 of 4 (25 %) | HP-1..HP-4 (only 2022 triggered EU-state-aid review) |

---

## 🚦 Divergence Tests — Where 2026 is Different

| Dimension | Historical norm | 2026 signal | Implication |
|-----------|-----------------|-------------|-------------|
| Macro growth | 2–3 % GDP | 0.82 % GDP 2024 | Fiscal space narrower; debt-path scrutiny higher |
| Coalition composition | Alliance only | M-KD-L + SD confidence | Add SD-withdrawal risk |
| EU integration | Pre-Green-Deal | Post-Green-Deal | Add state-aid + climate-coherence risk |
| Media ecosystem | Dominant legacy press | Fragmented social + legacy | Counter-narrative speed faster |
| Security context | Pre-NATO | Post-NATO accession | Defence-spending crowd-out tension |

---

## 📜 What Precedents Suggest vs What is Different

```mermaid
flowchart LR
    SIMILAR["✅ Consistent with precedents<br/>• Small polling boost<br/>• Regressive framing by opposition<br/>• Short-horizon effect"] --> VERDICT["🎯 Assessment"]
    DIFFER["⚠️ Divergent factors<br/>• Narrower fiscal space<br/>• SD-dependent coalition<br/>• Green-Deal tension<br/>• Fragmented media"] --> VERDICT

    style SIMILAR fill:#4CAF50,color:#FFFFFF
    style DIFFER fill:#FF9800,color:#FFFFFF
    style VERDICT fill:#7B1FA2,color:#FFFFFF
```

> **Verdict:** Precedent pattern favours a small (+0.5–1.0 pp) incumbent boost but history cannot account for the SD-pivotal coalition dynamic or EU state-aid exposure, both of which are first-time conditions. Confidence in electoral outcome prediction is therefore **🟧 MEDIUM**, not HIGH.

---

## 🧠 Lessons to Carry Forward

| Lesson | Source | Application to 2026 |
|--------|--------|---------------------|
| Sustained discipline on narrative matters more than measure size | HP-4 (2006) | Requires unified coalition messaging through August |
| Regressive-incidence framing sticks if distributional data is published | HP-1 (2010) | Commission SCB distributional series early |
| EU scrutiny depresses post-measure polling boost | HP-3 (2022) | Pre-clear with Commission reduces this risk |
| Coalition rigidity on timing can create opposition opportunity | HP-2 (2018) | Avoid mid-summer re-announcements |

---

## 📎 Sources

| Source | Use |
|--------|-----|
| Valmyndigheten archive 1991–2022 | Outcome data |
| Riksdag open data — prior riksmöten | Historical dok_ids |
| SCB historical CPI and GDP tables | Macro backdrop |
| Statens offentliga utredningar (SOU) historical | Policy-design comparison |
| Academic Swedish political-history monographs | Structural interpretation |

---

**Document Control**
- **Template path:** `/analysis/templates/historical-parallels.md`
- **Also known as:** `historical-baseline.md` (filename variant — content identical)
- **Referenced by:** [ai-driven-analysis-guide.md § Step 5](../methodologies/ai-driven-analysis-guide.md#step-5--extensions-f3ead-analyze-continued)
- **Classification:** Public
- **Next Review:** 2026-07-21

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

