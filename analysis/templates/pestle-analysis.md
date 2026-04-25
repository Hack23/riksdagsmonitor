<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# PESTLE Analysis — {{ARTICLE_TYPE}} · {{ARTICLE_DATE}}

> **Analytical supplementary (optional).** Produce when a bill, scandal, budget cycle, election-adjacent event, or external shock crosses **two or more** PESTLE dimensions. Pairs with `swot-analysis.md` (external factors → Opportunities/Threats), `risk-assessment.md` (External dimension rows), and `scenario-analysis.md` (driver framework).
>
> **Methodology** → [`analysis/methodologies/analytical-supplementary-methodology.md § PESTLE`](../methodologies/analytical-supplementary-methodology.md#pestle).
> **Not counted in the 23 core artifacts.** Non-blocking in `05-analysis-gate.md`.

## 🔄 Tradecraft Context

- **Artifact class** — Analytical supplementary (optional, never blocking)
- **Use when** — A bill, scandal, budget cycle, election-adjacent event, or external shock crosses **two or more** PESTLE dimensions
- **Pairs with** — `swot-analysis.md` (external factors → Opportunities/Threats), `risk-assessment.md` (External dimension rows), and `scenario-analysis.md` (driver framework)
- **Methodology** — [`analytical-supplementary-methodology.md § PESTLE`](../methodologies/analytical-supplementary-methodology.md#pestle)
- **Workflow status** — Not counted in the 23 core artifacts; non-blocking in [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md)

## 📋 Scope declaration

- **Trigger event / decision** — [dok_id(s), bill name, or event that prompted the scan]
- **Time horizon** — [short ≤ 6 m / medium 6–24 m / long 2–10 y]
- **Unit of analysis** — [policy domain / party / coalition / institution]
- **Primary sources consulted** — [riksdagen.se, regeringen.se, scb.se, IMF WEO vintage, World Bank indicator codes, myndigheter]

---

## 🏛️ Political (P)

| Factor | Current state | Direction (↑/↓/→) | Evidence | Impact on scoped entity | WEP† |
|--------|---------------|-------------------|----------|------------------------|------|
| Government composition & majority stability | | | riksdagen.se / vote dok_id | | |
| Opposition positioning | | | motion dok_id × n | | |
| Coalition arithmetic shift | | | voteringar dok_id | | |
| Parliamentary committee balance | | | betänkande dok_id | | |
| EU / NATO / Nordic council pressure | | | regeringen.se / COM doc | | |

**Key judgement (P)** — [1–3 sentences, WEP-tagged]

---

## 💰 Economic (E)

> **Authoritative source → IMF** ([`imf-indicator-mapping.md`](../methodologies/imf-indicator-mapping.md)). World Bank only for non-economic residue ([`worldbank-indicator-mapping.md`](../methodologies/worldbank-indicator-mapping.md)).

| Factor | Latest value | Forecast vintage | Delta vs prior vintage | Implication | WEP† |
|--------|--------------|------------------|-----------------------|-------------|------|
| GDP growth (IMF WEO NGDP_RPCH) | | | | | |
| Inflation CPI (IMF WEO PCPIPCH) | | | | | |
| Unemployment (IMF WEO LUR) | | | | | |
| Fiscal balance % GDP (IMF WEO GGXCNL_NGDP) | | | | | |
| Current account % GDP (IMF WEO BCA_NGDPD) | | | | | |
| Policy-rate path (Riksbank) | | | | | |

**Key judgement (E)** — [WEP-tagged, link to coalition-mathematics fiscal capacity]

---

## 👥 Social (S)

| Factor | SCB / WB code | Latest value | Trend (5 y) | Political salience (1–5) | Evidence |
|--------|---------------|--------------|-------------|-------------------------|----------|
| Population & demographic shift | SCB BE0101 / WB SP.POP.TOTL | | | | |
| Urban / rural divergence | SCB BE0101 | | | | |
| Migration & integration | SCB BE0101J | | | | |
| Income inequality (Gini) | WB SI.POV.GINI | | | | |
| Trust in institutions | SOM Institute survey | | | | |
| Labour market participation | SCB AM0401 | | | | |

**Key judgement (S)** — [voter-segmentation tie-in]

---

## 🔬 Technological (T)

| Factor | State | Rate of change | Policy response gap | Evidence | WEP† |
|--------|-------|----------------|--------------------|----------|------|
| AI governance (EU AI Act transposition) | | | | regeringen.se prop | |
| Cybersecurity / MSB posture | | | | MSB rapport | |
| Digital public infrastructure (eID, 1177) | | | | myndigheter | |
| Defence-tech / dual-use | | | | FMV, FOI | |
| R&D intensity (WB GB.XPD.RSDV.GD.ZS) | | | | WB | |

**Key judgement (T)** — [threat-analysis kill-chain / implementation-feasibility tie-in]

---

## 🌿 Legal (L)

| Factor | Instrument | Status | Binding on Sweden | Compliance gap | Evidence |
|--------|-----------|--------|-------------------|----------------|----------|
| Primary legislation in flight | prop. / motion | | | | dok_id |
| EU regulation / directive | COM / CELEX | | yes/no | | EUR-Lex |
| Constitutional (grundlag) | | | | | KU-betänkande |
| Judicial review / JO granskning | | | | | JO-beslut |
| International treaty | | | | | UD-dok |

**Key judgement (L)** — [classification-results legal dimension tie-in]

---

## 🌍 Environmental (E)

| Factor | Indicator / source | Latest value | Trajectory vs target | Political leverage | Evidence |
|--------|-------------------|--------------|----------------------|-------------------|----------|
| Climate target (net-zero 2045) | Naturvårdsverket | | | | |
| Energy mix & security | SvK / EI | | | | |
| Biodiversity / water | SLU / SMHI | | | | |
| CO₂ emissions per capita (WB EN.ATM.CO2E.PC) | WB | | | | |
| EU ETS / CBAM exposure | EUR-Lex | | | | |

**Key judgement (Env)** — [forward-indicators / risk-assessment external tie-in]

---

## 🔀 Cross-dimension interactions (≥ 3)

| Interaction | Direction | Magnitude (1–5) | Evidence | Feeds artifact |
|------------|-----------|-----------------|----------|----------------|
| e.g. E × S | e.g. inflation ↑ → trust in government ↓ | | | swot Threats + risk External |
| | | | | |
| | | | | |

## 🎯 PIR feedback

| PIR | Addressed by dimension(s) | Gap | Action |
|-----|--------------------------|-----|--------|
| PIR-1 | | | |

---

## 🔗 Cross-links

- [`swot-analysis.md`](swot-analysis.md) — external Opportunities/Threats rows cite rows here
- [`risk-assessment.md`](risk-assessment.md) — External dimension uses PESTLE P/E/Env
- [`scenario-analysis.md`](scenario-analysis.md) — drivers matrix consumes PESTLE columns
- [`forward-indicators.md`](forward-indicators.md) — dated indicators per dimension
- [`intelligence-assessment.md`](intelligence-assessment.md) — Key Judgements cite PESTLE cells

† WEP = [Words-of-Estimative-Probability](../methodologies/osint-tradecraft-standards.md#wep) confidence band.

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

