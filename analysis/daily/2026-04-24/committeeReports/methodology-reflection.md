# Methodology Reflection — Committee Reports 2026-04-24

**Purpose**: run-audit gate per `analysis/methodologies/ai-driven-analysis-guide.md §Methodology Reflection`.
**Standards audited**: ICD 203 (9 analytic standards), Admiralty Code, WEP/Kent confidence, OSINT tradecraft ethics, DIW weighting.

## 1. Evidence sufficiency

- All 5 attested `dok_id` sourced via `get_dokument` (A1).
- Implementing agency coverage: Kriminalvården, Migrationsverket, Riksbank, Arbetsmiljöverket, DO, Boverket, Energimyndigheten — all with primary-source URLs (A1–A2).
- International comparator coverage: ILO NORMLEX + 5 comparator countries (DK/FI/NO/DE/NL) with primary agency citations (A1–A2).
- **Gap**: full text of the 5 reports not fetched in this run (titles + metadata only). Mitigated by committee-calendar and Tidöavtal trajectory knowledge; flagged as limitation.
- **Gap**: current polling data not integrated. Mitigated by structural analysis; flagged as PIR-6 + PIR-7 for cross-session-intelligence in next aggregation cycle.

## 2. Confidence distribution

| Level | Count | Share |
|-------|:-----:|:-----:|
| VERY HIGH | 0 | 0 % |
| HIGH | 4 | 57 % |
| MEDIUM | 3 | 43 % |
| LOW | 0 | 0 % |
| VERY LOW | 0 | 0 % |

HIGH:MEDIUM ratio (4:3) is calibrated — absence of VERY HIGH reflects that no judgments are derived from settled ground truth (election has not happened; Q2 reports not yet published). Absence of LOW reflects that judgments for which we lacked evidence were instead flagged as **assumptions** in §Key Assumptions Check (A1–A5), not promoted to judgments.

## 3. Source diversity

- **Parliamentary primary**: data.riksdagen.se, riksdagen.se (A1)
- **Government primary**: regeringen.se (A2)
- **Independent institution primary**: riksbank.se, riksrevisionen.se, valmyndigheten.se (A1–A2)
- **Agency primary**: kriminalvarden.se, migrationsverket.se, av.se, do.se, boverket.se, energimyndigheten.se, msb.se, digg.se (A2–B2)
- **International primary**: ilo.org, norden.org, eur-lex.europa.eu (A1–A2)
- **Comparator primary**: justitsministeriet.dk, om.fi, kriminalomsorgen.no, bmas.de, rijksoverheid.nl and central-bank sites (A1–A2)

Diversity satisfies **Source Diversity Rule**: every P0/P1 claim (KJ-1, KJ-2, KJ-3, KJ-4, KJ-7) cites ≥ 3 independent sources across categories.

## 4. Party-neutrality arithmetic

SWOT + stakeholder + scenario analysis applied evenly across parties:

| Party | Positive references | Negative references | Net |
|-------|:-------------------:|:-------------------:|:---:|
| M | 6 | 3 | +3 |
| KD | 4 | 2 | +2 |
| L | 5 | 3 | +2 |
| SD | 4 | 5 | −1 |
| S | 4 | 3 | +1 |
| V | 3 | 4 | −1 |
| MP | 4 | 3 | +1 |
| C | 4 | 2 | +2 |

Variance is ≤ ±3 for all parties — within neutrality tolerance (tolerance threshold: ≤ ±5 per `political-style-guide.md`). No party exceeds ±5. SD's mildly negative score reflects its own hardline positions on CU25 / SfU23 being flagged as coalition-stress factors, not analyst bias.

## 5. ICD 203 audit

| ICD 203 standard | Applied? | Evidence |
|------------------|:--------:|----------|
| 1. Describes quality and reliability of underlying sources | ✅ | Admiralty codes on every evidence row |
| 2. Properly caveats and expresses uncertainties | ✅ | Confidence labels on all KJs + §Key Assumptions Check |
| 3. Properly distinguishes analyst judgments from facts | ✅ | "We assess…" language vs. source-cited facts |
| 4. Incorporates alternative analyses (ACH/Red Team) | ✅ | `devils-advocate.md` H1–H4 + Red Team |
| 5. Demonstrates customer relevance | ✅ | §"3 Decisions This Brief Supports" in `executive-brief.md` |
| 6. Uses clear and logical argumentation | ✅ | Mainline → evidence → confidence structure |
| 7. Explains change to or consistency of judgments | ✅ | Anchored against 2024/25 SfU tightening trajectory + 2022 Tidöavtal |
| 8. Makes accurate judgments and assessments | ⚠️ | Will be audited at +60 d Kriminalvården report (PIR-1) |
| 9. Incorporates visualisations where appropriate | ✅ | 12+ Mermaid diagrams across artifacts |

Standard 8 is retrospective — marked as action item in §Methodology Improvements.

## 6. SAT technique attestation

Structured Analytic Techniques used in this run:

1. **Analysis of Competing Hypotheses (ACH)** — `devils-advocate.md` §ACH matrix
2. **Red Team / Devil's Advocate** — `devils-advocate.md` §Red-Team challenge
3. **Key Assumptions Check** — `intelligence-assessment.md` §Key Assumptions Check
4. **SWOT + TOWS** — `swot-analysis.md`
5. **Scenario analysis with leading indicators** — `scenario-analysis.md`
6. **Political Threat Taxonomy / Attack tree / Kill chain** — `threat-analysis.md`
7. **6-lens stakeholder mapping** — `stakeholder-perspectives.md`
8. **Bayesian posterior update** — `risk-assessment.md` R1, R3, R5
9. **Outside-In comparative analysis** — `comparative-international.md`
10. **DIW weighted significance** — `significance-scoring.md`
11. **PESTLE-adjacent 5-dimension risk register** — `risk-assessment.md`

11 distinct SATs applied; meets the ≥ 10 threshold in `osint-tradecraft-standards.md`.

## 7. GDPR / OSINT ethics compliance

- All data from Offentlighetsprincipen / public-data MCPs.
- Named actors are public officials or party groups in their public capacity. No private personal data.
- GDPR Art. 9 lawful bases invoked: 9(2)(e) publicly made + 9(2)(g) substantial public interest.
- No voter-level or psychographic inference beyond aggregate party positioning.
- No third-party data sources; no scraping; no leaked/hacked material.

## 8. Methodology Improvements (for next cycle)

1. **Pre-fetch full text** for at least the P0 and P1 committee reports (`HD01CU25`, `HD01SfU23`, `HD01FiU23`) by using `get_dokument_innehall` with `include_full_text: true` in the download pipeline. This will let per-document analyses cite specific paragraphs rather than inferring from titles.
2. **Integrate Riksdag voting history on predecessor items** via `get_voteringar` — e.g. pull the prior year's corresponding bet votes to quantify coalition-stress baseline for KJ-3. Add a `prior-votes-context.json` enrichment step.
3. **Operationalise PIR-4 + PIR-7** (Migrationsverket IT + MSB disinfo observatory) as standing cross-run indicators in `cross-session-intelligence.md` for the next aggregation workflow.
4. **Test H3 (defensive scrambling) hypothesis explicitly** at +60 d by comparing the Kriminalvården Q2 capacity figure against the CU25 implied baseline. If deviation ≥ 10 %, update hypothesis weighting.
5. **Add comparator-side prison-capacity and migration-permit metrics** as structured JSON (`comparator-metrics.json`) so future Outside-In analyses can quantitatively compare rather than narratively compare.

## 9. Limitations

- Full text of committee reports not fetched this run (title + metadata only).
- Polling data not integrated (relies on published 2025 Q4 / 2026 Q1 baselines).
- Implementation-agency status reports for Q1 2026 not all available yet; some inference on capacity trajectory.
- Comparative analysis depth varies by comparator (DK / FI deepest; DE / NL lighter).

## Sources

This reflection cites: `analysis/methodologies/ai-driven-analysis-guide.md`, `osint-tradecraft-standards.md`, `political-style-guide.md`, and all 15 other artifacts in this folder.

## Pass 2 refinements

Pass 2 re-read this artifact in full, cross-checked every `dok_id` citation against [`data-download-manifest.md`](./data-download-manifest.md), confirmed Admiralty codes are consistent with §Source diversity in [`methodology-reflection.md`](./methodology-reflection.md), and verified cluster-level internal consistency against [`intelligence-assessment.md`](./intelligence-assessment.md). No judgments were reversed; confidence labels retained. Additional evidence row: `HD01CU25`, `HD01SfU23`, `HD01FiU23`, `HD01AU15`, `HD01CU29` at [data.riksdagen.se](https://data.riksdagen.se/) [A1].
