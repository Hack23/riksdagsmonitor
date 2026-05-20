# Implementation Feasibility
**Date**: 2026-05-20 | **Subfolder**: realtime-pulse  
**Framework**: Policy implementation analysis per analysis/methodologies/implementation-analysis.md

---

## Scope

Implementation feasibility analysis for SoU30 (bidragstak + medical certificate requirement) — entry into force July 1, 2026 — and comparative assessment of KU34 second-reading procedural feasibility.

---

## SoU30 Implementation Analysis

### Timeline Assessment

| Milestone | Date | Status |
|-----------|------|--------|
| Betänkande published | 2026-05-11 | ✅ Complete |
| Riksdag adoption | 2026-05-20 | ✅ Today |
| Proposition formally enacted | 2026-06-01 (est.) | 🔄 Pending |
| Socialstyrelsen implementation guidance | 2026-06-15 (target) | ⚠️ At risk |
| Municipal IT systems updated | 2026-06-25 (deadline) | ❌ Unrealistic |
| **Entry into force** | **2026-07-01** | **⚠️ HIGH RISK** |

**Critical finding**: The 42-day window from adoption (2026-05-20) to entry into force (2026-07-01) is structurally insufficient for full implementation. Specific capacity constraints:

---

### Capacity Constraint 1: Municipal IT Systems

**Requirement**: 290 municipalities must update social welfare case management systems to:
1. Record medical certificate receipt/absence
2. Calculate bidragstak against new formula
3. Implement the "legally present" criterion checks

**Reality**: The three dominant Swedish municipal IT systems (Procapita, Combine, VIVA) require vendor patch cycles of 4-8 weeks plus UAT. At adoption (2026-05-20), vendors are unlikely to have production-ready patches until mid-June at the earliest.

**Risk**: Municipal case workers will be operating on manual workarounds from July 1, creating data quality issues, administrative backlogs, and increased error rates.

**Evidence**: SKR flagged this concern in remissvar to SoU30 betänkande preparation. *Source: HD01SoU30 remissdelen.*

---

### Capacity Constraint 2: GP Certificate Supply

**Requirement**: Welfare recipients must present a GP certificate to qualify for exception from bidragstak (e.g., disability, serious illness).

**Reality**: Sweden has a documented GP shortage — approximately 1,000 GP positions unfilled nationwide (Socialstyrelsen estimate). Average GP appointment wait time: 3-4 weeks in urban areas; 6-8 weeks in rural municipalities.

**Risk**: Beneficiaries unable to access GP before July 1 cannot obtain certificates → automatic benefit reduction or denial. This is a foreseeable structural injustice built into the implementation timeline.

**Mitigation proposed but not adopted**: Opposition reservations proposed telemedical certification as alternative. Government did not incorporate.

---

### Capacity Constraint 3: Socialstyrelsen Guidance

**Requirement**: Socialstyrelsen must issue implementation guidelines for municipalities before July 1.

**Reality**: Government agencies have a standard 4-6 week cycle for developing, consulting, and publishing implementation guidance. From May 20 (adoption day), that timeline puts complete guidance at July 1 at the earliest — leaving zero buffer.

**Risk**: Municipalities applying inconsistent criteria in the absence of complete guidance → legal challenges → administrative courts backlog.

---

### Overall SoU30 Implementation Risk Rating

| Risk dimension | Level | Probability | Impact |
|----------------|-------|------------|--------|
| Municipal IT delays | HIGH | 80% | MEDIUM |
| GP certificate access | HIGH | 70% | HIGH |
| Socialstyrelsen guidance | MEDIUM | 50% | MEDIUM |
| Legal challenges (Day 1) | MEDIUM | 40% | HIGH |
| Pre-election scandal case | MEDIUM | 35% | CRITICAL (political) |

**Overall implementation risk**: HIGH (3 of 4 capacity constraints are critically at risk)

**Comparable implementation**: Denmark's kontanthjælpsloft (June 2015 → January 2016) had 6+ months and still generated implementation turbulence. Sweden's 42 days is structurally insufficient by Nordic peer standards.

---

### SoU29 Activity Requirements — Implementation

**Additional requirement**: Municipal advisors must document and monitor activity plan compliance for welfare recipients.

**Feasibility**: Similarly constrained. Municipal case worker capacity is the binding constraint — the same workforce must implement both SoU29 (activity monitoring) and SoU30 (certificate verification + bidragstak calculation).

**Risk**: Double capacity demand on municipal social services workforce → prioritization → some aspects of SoU29 will be de facto deferred.

---

## KU34 Constitutional Process Feasibility

### Second Reading Requirements (RF ch. 8:14)

| Step | Date | Condition |
|------|------|-----------|
| First reading (vilande) | 2026-05-20 ✅ | Majority vote — completed |
| General election | 2026-09-13 | Must occur — constitutionally scheduled |
| New parliament constituted | 2026-10-01 (est.) | Automatic after election |
| Second reading (must occur in new parliament) | 2026-10 to 2027-06 | Requires majority of new parliament |
| KU34 enters into force | Day after second reading publication | Upon completion |

**Constitutional feasibility**: HIGH — the process is clear and has no procedural obstacles assuming political will exists. The only risk is political (see scenario-analysis.md for probability breakdown).

**Legal interpretation**: RF ch. 8:14 requires the second reading to occur "after the election" — specifically in the newly elected parliament. There is no explicit deadline within the new parliamentary term, meaning the new parliament has four years to hold the second reading. However, political convention and public pressure will create pressure for a prompt second reading.

**Risk of lapse**: If no second reading occurs before the end of the new parliament's term (2026-2030), the vilande first reading expires. This is theoretically possible but politically extremely unlikely given the KU34 level of political salience.

---

## Implementation Feasibility Summary

| Legislation | Implementation readiness | Timeline feasibility | Risk level |
|-------------|--------------------------|---------------------|-----------|
| SoU30 (July 1, 2026) | LOW | LOW (42 days insufficient) | HIGH |
| SoU29 (July 1, 2026) | LOW | LOW (same timeline) | HIGH |
| KU34 second reading (post-election) | N/A (political, not administrative) | HIGH (constitutional process clear) | MODERATE (political risk) |
| JuU43 (criminal code update) | MODERATE | MODERATE | LOW |

---

*Evidence: HD01SoU29, HD01SoU30, HD01KU34, SKR remissvar. Danish Ankestyrelsen evaluation 2017. Methodology: analysis/methodologies/implementation-analysis.md.*
