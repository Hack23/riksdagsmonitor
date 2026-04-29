# Methodology Reflection — Opposition Motions 2026-04-28

**Author**: James Pether Sörling | **Classification**: PUBLIC

## ICD 203 Analytic Standards Audit

| Standard | Met? | Evidence |
|----------|------|----------|
| Sourced claims | PARTIAL | All claims sourced to document text; economic figures lack IMF confirmation |
| Cognitive bias mitigation | YES | Devils Advocate (H1/H2/H3); ACH applied |
| Alternative hypotheses | YES | 3 hypotheses in devils-advocate.md |
| Confidence labeling | YES | ICD 203 labels (A1-D4) applied throughout |
| Key Judgments | YES | 4 KJs with confidence ratings in intelligence-assessment.md |
| Linear reasoning | YES | Policy chains documented in cross-reference-map.md |
| Indicators and warnings | PARTIAL | PIRs established; no hard deadlines for all indicators |

## Data Collection Gaps

### Gap 1: IMF WEO Unavailable
IMF connectivity was unavailable in this run. Economic figures in HD024100, HD024101, HD024108, HD024110, HD024118 are assessed based on motion text only. All such figures are annotated `[unconfirmed-IMF]`. Impact: KJ-4 confidence reduced from HIGH to MEDIUM.

**Remediation**: Re-run `tsx scripts/imf-fetch.ts weo --country SWE` in follow-up; update synthesis-summary.md and executive-brief.md with confirmed figures.

### Gap 2: Full Text Not Retrieved for All 24 Motions
The download script fetched summary fields only. Full yrkanden text was retrieved via MCP for selected high-priority motions only. Three motions (HD024103, HD024104, HD024122) may have yrkanden nuances not captured.

**Remediation**: Re-fetch via `riksdag-regering-get_dokument_innehall` for HD024103, HD024104, HD024122 in follow-up analysis.

### Gap 3: Opposition Internal Communications Not Available
Analysis relies on publicly filed motions; party caucus strategy and whip communications are not available. This limits ability to distinguish coordinated from individual filing decisions.

**Remediation**: Monitor riksdag.se interpellationer and party press releases for strategic signals.

## Analytical Improvements (Pass 2 Actions)

**Improvement 1**: Economic confidence levels — replace `[unconfirmed-IMF]` annotations with confirmed IMF WEO figures once connectivity is restored. Target: synthesis-summary.md KJ-4 confidence raised from MEDIUM to HIGH.

**Improvement 2**: PIR timeline refinement — PIR-JUU-01 should include a specific JuU hearing calendar check from riksdag.se as source rather than generic "within 30 days".

**Improvement 3**: Coalition-mathematics.md should include SD's specific seat contribution to understand the parliamentary arithmetic of any defection scenario more precisely.

## Analytic Line Quality Assessment

- **Distinguishing fact from interpretation**: DONE — source citations provided throughout
- **Caveat calibration**: DONE — VERY LOW/LOW/MEDIUM/HIGH consistently applied
- **Reader orientation**: DONE — executive-brief.md provides 60-second entry point
- **Completeness**: PARTIAL — economic data gap limits full assessment
