# PESTLE Analysis — {{ARTICLE_TYPE}} · {{ARTICLE_DATE}}

> **Analytical supplementary (optional).** Produce when a bill, scandal, budget cycle, election-adjacent event, or external shock crosses **two or more** PESTLE dimensions. Pairs with `swot-analysis.md` (external factors → Opportunities/Threats), `risk-assessment.md` (External dimension rows), and `scenario-analysis.md` (driver framework).
>
> **Methodology** → [`analysis/methodologies/analytical-supplementary-methodology.md § PESTLE`](../methodologies/analytical-supplementary-methodology.md#pestle).
> **Not counted in the 23 core artifacts.** Non-blocking in `05-analysis-gate.md`.

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

**Template version:** v1.0 · **Last updated:** 2026-04-23
