# README — Interpellation Debates Analysis Reference Example (2026-04-20)

**Analysis Date**: 2026-04-20 | **Riksmöte**: 2025/26 | **Analysis Depth**: Deep (≥2 iterations, AI-FIRST principle)
**Status**: 📌 **Reference example** for interpellation-debates analysis depth and structure

## Purpose

This directory is the **canonical reference analysis** for the `news-interpellations` agentic workflow. It covers the batch of 15 interpellations filed in the Riksdag between April 7–17, 2026 (core focus: 10 interpellations filed April 14–17 under `dok_id` HD10429–HD10438). It is intended to demonstrate best-in-class political-intelligence analysis depth expected for all future interpellation runs.

## Intelligence Headlines (BLUF)

1. 🔴 **EU Pay Transparency Directive breach**: Sweden will miss the June 7, 2026 transposition deadline after the government withdrew its implementation proposal. S (Amloh) interpellates Larsson (L). Response due May 5. [HD10437, significance 9.2/10]
2. 🔴 **Coordinated S pre-election accountability campaign**: 7 of 10 new interpellations filed by S; dual-filing (HD10437 + HD10438) same day, same MP (Amloh), same minister (Larsson) on related gender-equality failures — textbook coordination.
3. 🟠 **Diplomatic flashpoint**: El-Haj (independent) demands Israeli accountability, apology, and compensation for the 1948 Bernadotte assassination. Response due April 30 (URGENT). [HD10435, significance 9.0/10]
4. 🟠 **Carlson saturation**: 6th+ interpellation targets Infrastructure Minister Carlson (KD) — housing, aviation, rail, roads, defence infrastructure. Most-targeted minister of the session.
5. 🟡 **Women's shelter crisis**: Amloh's second April 17 filing documents nationwide kvinnojour closures. Response due May 5. [HD10438, significance 8.5/10]

## Directory Structure

```
2026-04-20/interpellations/
├── README.md                          — this file (index + reading guide)
├── executive-brief.md                 — 1-page BLUF for senior readers
├── synthesis-summary.md               — integrated summary + Mermaid diagrams
├── classification-results.md          — policy-domain + party-strategy classification
├── significance-scoring.md            — 10-document ranked scoring matrix
├── swot-analysis.md                   — 8-stakeholder SWOT (citizens → media)
├── risk-assessment.md                 — L×I risk matrix + ministerial scorecard
├── threat-analysis.md                 — 5 threat vectors + confidence grading
├── stakeholder-perspectives.md        — minister + opposition + institutional views
├── cross-reference-map.md             — 5 thematic clusters + minister linkage
├── intelligence-assessment.md         — ACH, Key Assumptions Check, Red Team
├── scenario-analysis.md               — 4 alternative futures (May 5 response window)
├── comparative-international.md       — EU peer comparison (Pay Transparency transposition)
├── methodology-reflection.md          — analytic pipeline + AI-FIRST iteration log
├── data-download-manifest.md          — source data inventory + provenance
├── economic-data.json                 — World Bank indicators for economic context
└── documents/                         — per-document deep dives (10 of 10)
    ├── HD10429-analysis.md — Freedom of expression (SD's Farivar → Strömmer M)
    ├── HD10430-analysis.md — Mosque hate-speech (SD's Jomshof → Forssmed KD)
    ├── HD10431-analysis.md — LGBTQI+ international rights (C's Lasses → Dousa M)
    ├── HD10432-analysis.md — Hospital infrastructure (S's Olesen → Lann KD)
    ├── HD10433-analysis.md — Tax legitimacy / billionaire paradox (S's Ekeroth Clausson → Svantesson M)
    ├── HD10434-analysis.md — Stockholm housing decline (S's Nysmed → Carlson KD)
    ├── HD10435-analysis.md — Bernadotte/Israel accountability (El-Haj → Malmer Stenergard M)
    ├── HD10436-analysis.md — Space industry (S's Wiking → Edholm L) **WITHDRAWN**
    ├── HD10437-analysis.md — EU Pay Transparency Directive (S's Amloh → Larsson L)
    └── HD10438-analysis.md — Women's shelter closures (S's Amloh → Larsson L)
```

## Reading Paths

### For a 5-minute overview
1. `executive-brief.md`
2. Top 5 findings in `synthesis-summary.md`

### For political-intelligence analysts (30 min)
1. `executive-brief.md`
2. `intelligence-assessment.md` (ACH + Key Assumptions Check)
3. `scenario-analysis.md`
4. Top-3 per-document analyses: HD10437, HD10435, HD10438

### For senior editorial review (60 min)
1. `README.md` (this file)
2. `executive-brief.md`
3. `synthesis-summary.md`
4. `classification-results.md` + `significance-scoring.md`
5. `swot-analysis.md`
6. `risk-assessment.md` + `threat-analysis.md`
7. `cross-reference-map.md`
8. All 10 per-document analyses
9. `scenario-analysis.md` + `comparative-international.md`
10. `methodology-reflection.md`

### For the published articles
- `../../../../news/2026-04-20-interpellation-debates-en.html`
- `../../../../news/2026-04-20-interpellation-debates-sv.html`

## Analytic Frameworks Applied

| Framework | Artifact | Purpose |
|-----------|----------|---------|
| **SWOT** (8-stakeholder) | `swot-analysis.md` | Multi-perspective strategic view |
| **Risk matrix** (L × I, 1–5) | `risk-assessment.md` | Quantitative risk prioritisation |
| **Threat analysis** (actor × mechanism × severity) | `threat-analysis.md` | Adversarial-pressure mapping |
| **ACH** — Analysis of Competing Hypotheses | `intelligence-assessment.md` | Hypothesis discrimination |
| **Key Assumptions Check** | `intelligence-assessment.md` | Bias/assumption surface |
| **Red Team / Devil's Advocate** | `intelligence-assessment.md`, `stakeholder-perspectives.md` | Alternative-view stress |
| **Scenario analysis** (4 futures) | `scenario-analysis.md` | Uncertainty structuring |
| **Comparative international** | `comparative-international.md` | Peer-benchmark check |
| **Methodology reflection** | `methodology-reflection.md` | Analytic self-audit |

## Confidence Grading System

All analytical statements throughout this set use a **three-tier confidence grade**:

- 🟩 **HIGH** — Primary-source verification (MCP full-text, government authority data, World Bank)
- 🟧 **MEDIUM** — Cross-inferred from multiple secondary sources or expert-judgement-anchored
- 🟥 **LOW** — Speculative / forward-looking / judgement-heavy

Statements are attributed where possible to specific `frs` IDs, `dok_id`s, World Bank indicator codes, or public authority publications.

## Data Provenance

Primary data sources (see `data-download-manifest.md` for details):
- Riksdagen open-data API via `riksdag-regering-mcp` — interpellation metadata, full text (10/10), calendar
- Regeringskansliet metadata via `search_regering` / `get_regering_document`
- World Bank Open Data API — macro-economic indicators (unemployment, GDP, inflation)
- SCB (Statistics Sweden) — regional housing data (Länsstyrelsen Stockholm)
- No social-media, no unreviewed commentary

## Quality Gate Compliance

- [x] ≥2 analysis iterations (AI-FIRST principle)
- [x] All 10 documents have per-document deep dives
- [x] Confidence grading applied to all major statements
- [x] Structured analytic techniques (ACH, KAC, Red Team) applied
- [x] Comparative-international benchmark included
- [x] Scenario analysis with ≥3 futures and probability estimates
- [x] Methodology reflection included
- [x] Evidence cross-referenced to `frs` IDs and data sources
- [x] HTML articles pass htmlhint (0 errors)
- [x] Links validated

## Update Log

| Date | Editor | Change |
|------|--------|--------|
| 2026-04-20 | news-interpellations workflow (pass 1) | Initial generation |
| 2026-04-20 | news-interpellations workflow (pass 2) | AI-FIRST improvement iteration |
| 2026-04-20 | Response to PR review (pethers) | Expansion to reference-class depth: added README, executive-brief, intelligence-assessment, scenario-analysis, comparative-international, methodology-reflection; added 7 per-document deep dives (HD10429–HD10434, HD10436) |

## Related Hack23 ISMS Policies

- [Information_Security_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md) — master ISMS authority
- [AI_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md) — AI-assisted analysis requires human editorial review
- [CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) — data classification
- [Open_Source_Policy.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md) — public-data sourcing compliance
