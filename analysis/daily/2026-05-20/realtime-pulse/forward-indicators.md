# Forward Indicators
**Date**: 2026-05-20 | **Subfolder**: realtime-pulse  
**Framework**: PIR-linked forward indicator tracking per analysis/methodologies/forward-indicators.md  
**Coverage**: ≥10 dated indicators spanning T+1d to T+365d

---

## Indicator Tracking Framework

Indicators are classified by:
- **Type**: D=Decision, E=Event, P=Publication, S=Statistic, L=Legal
- **PIR linkage**: Which Priority Intelligence Requirement this indicator serves
- **Confidence**: Probability estimate of indicator triggering
- **Impact**: What we learn if indicator fires

---

## Forward Indicator Register

### FI-01: Riksdag Official Vote Record Published
**Date**: 2026-05-20 to 2026-05-22 (T+0 to T+2)  
**Type**: P — Publication  
**PIR**: PIR-VOTE-KU34, PIR-VOTE-SOU30  
**Description**: Official Riksdag vote records (voteringsresultat) for KU34, SoU29, SoU30, JuU43 will be published in the parliamentary database within 24-48 hours of the vote.  
**Significance**: Confirms exact vote counts; identifies any coalition defectors or absences; validates the 179 vs 178 arithmetic for SoU30.  
**Trigger threshold**: Official publication at data.riksdagen.se  
**Confidence**: VERY HIGH (99%)  
**Where to check**: `riksdag-regering-mcp.search_voteringar(rm="2025/26", bet="KU34")`

---

### FI-02: Government Press Conference Response
**Date**: 2026-05-20 (today, T+0)  
**Type**: E — Event  
**PIR**: PIR-GOVT-COMM  
**Description**: Prime Minister Ulf Kristersson (M) and relevant ministers (Social Affairs, Justice) will hold press conference responding to the day's votes.  
**Significance**: Framing of all three legislation items; KU34 constitutional achievement narrative; SoU30 implementation timeline commitments.  
**Trigger threshold**: Press conference held + transcript available  
**Confidence**: VERY HIGH (95%)

---

### FI-03: First SoU30 Legal Challenge Filed
**Date**: 2026-06-01 to 2026-08-15 (T+12 to T+87)  
**Type**: L — Legal  
**PIR**: PIR-SOU30-LEGAL  
**Description**: Legal aid organizations (FARR, Civil Rights Defenders) or individual applicants file administrative law challenges against municipal SoU30 implementation.  
**Significance**: Earliest legal interpretation of the "legally present" criterion; potential judicial review of EU law compatibility.  
**Trigger threshold**: First reported administrative court case filed  
**Confidence**: MODERATE-HIGH (65%)

---

### FI-04: Municipal Association (SKR) Implementation Report
**Date**: 2026-07-15 to 2026-08-01 (T+56 to T+73)  
**Type**: P — Publication  
**PIR**: PIR-SOU30-IMPLEMENT  
**Description**: SKR publishes early implementation assessment of SoU30's July 1 entry into force. Will include: IT readiness, case processing backlogs, GP certificate access data.  
**Significance**: First objective data on whether implementation fears were justified; will dominate media coverage if problems are confirmed.  
**Trigger threshold**: SKR press release or report published  
**Confidence**: HIGH (80%)  
**Impact if problems confirmed**: Significant pre-election liability for government; S gains electoral advantage

---

### FI-05: Pre-Election Polling on KU34/SoU30 Issues
**Date**: 2026-06-01 to 2026-08-31 (T+12 to T+103)  
**Type**: S — Statistic  
**PIR**: PIR-ELECTORAL  
**Description**: Swedish polling firms (Novus, Kantar Sifo, Demoskop) will publish polls showing voter responses to KU34 and SoU30 as election issues. Key metric: which issue ranks higher as "most important election issue."  
**Significance**: Determines whether KU34 (helps S) or SoU30 (polarizes on government vs. opposition terms) dominates the campaign.  
**Trigger threshold**: Poll showing KU34 or SoU30 in top-3 election issues  
**Confidence**: HIGH (85%)

---

### FI-06: September 2026 Election Result
**Date**: 2026-09-13 (T+116)  
**Type**: E — Event  
**PIR**: PIR-ELECTORAL  
**Description**: Swedish general election. Decisive event for KU34 second reading fate and SoU30 continuity.  
**Significance**: Determines coalition configuration; defines KU34 second reading probability.  
**Trigger threshold**: Election held; preliminary results published (election night)  
**Confidence**: CERTAIN (100%)  
**Sub-indicators**: Mandate count for M+SD+KD+L vs. S+V+MP vs. C pivot position

---

### FI-07: KU34 Second Reading Scheduled in New Parliament
**Date**: 2026-10-01 to 2026-12-31 (T+134 to T+225)  
**Type**: D — Decision  
**PIR**: PIR-KU34-SECOND  
**Description**: The newly constituted parliament's constitutional committee (KU) schedules the second reading of KU34. First substantive signal of new parliament's intent.  
**Significance**: Confirms whether new government will proceed with second reading; timing indicates urgency.  
**Trigger threshold**: KU formally announced the second reading on its agenda  
**Confidence**: HIGH (78%) — conditional on election producing a government

---

### FI-08: Socialstyrelsen Guidance Published for SoU30
**Date**: 2026-06-10 to 2026-06-30 (T+21 to T+41)  
**Type**: P — Publication  
**PIR**: PIR-SOU30-IMPLEMENT  
**Description**: Socialstyrelsen publishes implementation guidance for municipalities on the medical certificate requirement and bidragstak calculation.  
**Significance**: Whether guidance arrives before July 1 is a binary indicator of implementation readiness. Late guidance = confirmed implementation risk.  
**Trigger threshold**: Official guidance published and accessible to municipalities  
**Confidence**: MODERATE (55%) — arriving on time; HIGH (85%) that it's published before July 15

---

### FI-09: Opposition Coalition Statement on KU34 Second Reading
**Date**: 2026-06-01 to 2026-09-13 (T+12 to T+116)  
**Type**: D — Decision  
**PIR**: PIR-KU34-SECOND  
**Description**: S party (and coalition) publish their formal position on the KU34 second reading — specifically whether they commit to passing it as-is or will require modifications to bundled provisions.  
**Significance**: Determines the degree of post-election constitutional uncertainty. A clean S commitment to pass as-is removes the primary constitutional risk.  
**Trigger threshold**: S party leader (or Social Affairs spokesperson) makes formal statement on KU34 second reading  
**Confidence**: HIGH (80%)  
**Impact scenarios**: Commitment to pass as-is → reduces T1 threat probability to 10%; insistence on modifications → T1 threat probability remains 35%

---

### FI-10: First SoU30 Benefit Denial Media Case
**Date**: 2026-07-01 to 2026-08-31 (T+42 to T+103)  
**Type**: E — Event  
**PIR**: PIR-SOU30-IMPLEMENT  
**Description**: The first high-profile media case of a welfare benefit denial under SoU30 — family with children, person with disability, or EU citizen denied försörjningsstöd.  
**Significance**: This is the key pre-election information environment event. A sympathetic individual case amplified by media/social media could define the welfare narrative pre-election.  
**Trigger threshold**: National media coverage of individual SoU30 denial case  
**Confidence**: HIGH (75%) — the structural conditions guarantee cases will occur; media coverage likelihood is also high given election context  
**Political impact**: Moderate-to-significant depending on case profile

---

### FI-11: JuU43 First Prosecution Under New Honor Crime Provisions
**Date**: 2026-07-01 to 2027-06-30 (T+42 to T+376)  
**Type**: L — Legal  
**PIR**: PIR-JUU43-IMPLEMENT  
**Description**: First prosecution under JuU43's strengthened honor crime provisions. Test case for the new legal framework.  
**Significance**: Early test of whether JuU43 achieves its legislative intent; media attention to prosecution quality.  
**Trigger threshold**: Reported prosecution citing JuU43-amended criminal code  
**Confidence**: MODERATE (50%) within 12 months

---

### FI-12: IMF WEO Update on Sweden (October 2026)
**Date**: 2026-10-01 to 2026-10-15 (T+134 to T+148)  
**Type**: P — Publication  
**PIR**: PIR-ECONOMIC  
**Description**: IMF World Economic Outlook October 2026 update will include revised Sweden GDP growth, employment, and fiscal projections post-election.  
**Significance**: External validation of whether the government's fiscal rationale for SoU30 was credible; new government's economic inheritance.  
**Trigger threshold**: IMF WEO published with Sweden chapter  
**Confidence**: CERTAIN (99%)

---

## Indicator Priority Matrix

| Indicator | Time | PIR | Confidence | Electoral significance |
|-----------|------|-----|-----------|----------------------|
| FI-06: Election result | T+116 | Electoral | 100% | DECISIVE |
| FI-01: Vote record | T+2 | Vote confirmation | 99% | CONFIRMATORY |
| FI-04: SKR report | T+56-73 | Implementation | 80% | HIGH |
| FI-09: S KU34 commitment | T+12-116 | Constitutional | 80% | HIGH |
| FI-05: KU34/SoU30 polling | T+12-103 | Electoral | 85% | HIGH |
| FI-10: First denial case | T+42-103 | Implementation | 75% | MODERATE-HIGH |
| FI-07: KU34 second reading | T+134-225 | Constitutional | 78% | HIGH (post-election) |

---

*Evidence: HD01KU34, HD01SoU29, HD01SoU30. Methodology: analysis/methodologies/forward-indicators.md. IMF WEO 2026-04 (1 month old — fresh; vintaged at collected April 2026).*
