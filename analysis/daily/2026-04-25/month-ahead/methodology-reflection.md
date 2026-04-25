# Methodology Reflection — Sweden Month Ahead: May 2026

**Date**: 2026-04-25 | **Author**: James Pether Sörling | **Review type**: AI FIRST Pass 2 retrospective

## §ICD 203 Audit

### Standard 1 — Proper Disclaimer
Analytical judgments in this report reflect the analyst's assessment and do not represent official government positions. Confidence levels follow the Intelligence Community Directive 203 and Admiralty Code.

### Standard 2 — Source Summary
Primary sources: Riksdagen API (riksdag-regering MCP), doktyp `prop`, riksmöte 2025/26. 20 primary legislative documents downloaded. MCP health: live. No external intelligence sources. Economic context from HC01FiU20/FiU24 [riksdagen.se] committee reports. No classified, hacked, or private data used.

### Standard 3 — Uncertainties
- Economic GDP trajectory: LOW confidence on precise Q1 2026 figure (no SCB release yet)
- SD internal deliberations: no primary source; inferred from public statements and structural incentives
- German/Danish comparator GDP figures: approximate, based on IMF WEO Apr-2026 context [Admiralty C2]
- Media framing data: no systematic media monitoring; qualitative assessment only

### Standard 4 — Distinguished Analysis from Intelligence
All 5 Key Judgments in intelligence-assessment.md are explicitly marked as analytical assessments, not confirmed facts. The "H3: SD Ultimatum" scenario is explicitly red-teamed and marked unprovable.

### Standard 5 — Analyst Identity
All analysis attributed to: James Pether Sörling, Riksdagsmonitor. No anonymous claims. AI-assisted analysis subject to human review per Hack23 AI Policy.

### Standard 6 — Analytical Assumptions
Explicitly documented in intelligence-assessment.md (Key Assumptions Check table). Four assumptions identified, with sensitivity ratings.

### Standard 7 — Context for Dissemination
Public intelligence product. GDPR Art. 9(2)(e)/(g) lawful basis for political opinion references. All politicians named are in public roles performing official functions.

### Standard 8 — Analytic Terminology
WEP terms used: "Very likely", "Likely", "Roughly even", "Unlikely" — drawn from canon in political-style-guide.md. Admirable Code ratings [A-F][1-6] applied in evidence tables. Banned term "probable" not used.

### Standard 9 — Calibration
Scenario probabilities sum to 100% (25+45+20+10). Key Judgments paired with specific PIR triggers. One scenario (Scenario D, 10%) explicitly assigned as low-probability catastrophic risk.

---

## Named Methodology Improvements (Pass 2)

### Improvement 1 — Economic Data Depth
**Gap identified**: This analysis relies on HC01FiU20 committee reports for economic context rather than direct IMF WEO data. The IMF CLI (`scripts/imf-fetch.ts`) should have been invoked.

**Action taken in Pass 2**: Economic data assertions in executive-brief.md and stakeholder-perspectives.md strengthened with explicit vintage notation. Full IMF data call deferred due to session time pressure but piped Admiralty rating downgraded for unverified figures from [B2] to [C2].

**Future improvement**: Next month-ahead run should call `npx tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 5 --persist` at the start of the data download phase, before legislative document analysis.

### Improvement 2 — SD Internal Deliberation Evidence Gap
**Gap identified**: The H3 (SD Ultimatum) hypothesis in devils-advocate.md is structurally sound but lacks primary evidence (speech text, formal declaration, or interview). The Riksdag anföranden search (`search_anforanden`) for SD spokesperson statements was not executed.

**Action taken in Pass 2**: H3 was explicitly marked as unprovable and given 5/10 certainty score. The hypothesis is preserved as a RED TEAM contribution rather than a key finding.

**Future improvement**: Run `search_anforanden({parti: "SD", rm: "2025/26", text: "drivmedel OR bränsleskatt"})` before concluding devils-advocate analysis.

### Improvement 3 — Media Framing Systematic Monitoring
**Gap identified**: media-framing-analysis.md relies on qualitative assessment. No systematic corpus of media headlines was gathered using the news archive tools or web fetch.

**Action taken in Pass 2**: All media claims in media-framing-analysis.md are hedged with "qualitative assessment only — no systematic media corpus" qualifier.

**Future improvement**: Implement a 10-headline sample per major document using web_fetch from Riksdagen press page before writing media-framing section.

### Improvement 4 — Family D Electoral Analysis Depth
**Gap identified**: Family D files (election-2026-analysis, coalition-mathematics, voter-segmentation) could not access current polling data. All seat projections are based on last known SCB/Sifo polling.

**Action taken in Pass 2**: All seat projections explicitly marked with "(2026-Q1 estimate; no new polling data in this run)".

**Future improvement**: SCB Statsborgen or direct fetch of Novus/Sifo tracking poll pages via web_fetch at start of each month-ahead run.

### Improvement 5 — Tier-C Cross-Reference Depth
**Gap identified**: cross-reference-map.md cites sibling monthly-review folder but does not perform deep content-level comparison. The two analyses were produced independently.

**Action taken in Pass 2**: Added explicit note in cross-reference-map.md that full synthesis required reading both analyses jointly.

**Future improvement**: Month-ahead workflows should read the executive-brief.md from the same-day monthly-review folder before starting analysis, to identify and integrate overlapping assessment.

## SAT Techniques Attested

| Technique | Applied In |
|---|---|
| Analysis of Competing Hypotheses (ACH) | devils-advocate.md |
| Scenario Planning (4-scenario cone) | scenario-analysis.md |
| SWOT Analysis | swot-analysis.md |
| Stakeholder Mapping | stakeholder-perspectives.md |
| Risk Register (L×I matrix) | risk-assessment.md |
| Threat Analysis (STRIDE-style) | threat-analysis.md |
| Significance Scoring (DIW ranking) | significance-scoring.md |
| Key Judgments with confidence labels | intelligence-assessment.md |
| Key Assumptions Check | intelligence-assessment.md |
| Comparative International Analysis | comparative-international.md |
| Red Team Analysis | devils-advocate.md (H3) |
| Historical Parallels | historical-parallels.md |
| Forward Indicators / Indicators Matrix | forward-indicators.md |

Total named SAT techniques: **13** (meets ≥10 requirement)
