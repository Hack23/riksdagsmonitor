<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">⚠️ ISMS Risk Assessment → Political Risk Adaptation</h1>

<p align="center">
  <strong>📊 Mapping ISMS Risk Methodology to Swedish Parliamentary Risk</strong><br>
  <em>🎯 Likelihood · Impact · Register · Treatment → Coalition · Policy · Electoral</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-26  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This reference document maps [Hack23 ISMS Risk_Assessment_Methodology.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Assessment_Methodology.md) concepts to Riksdagsmonitor's political risk assessment framework. It explains the adaptation rationale and provides the authoritative translation between ISMS risk concepts and Swedish parliamentary political risk concepts.

---

## 📊 Likelihood Scale: ISMS → Political Probability

The ISMS defines likelihood based on historical incident frequency and threat intelligence. Political probability is adapted to Swedish parliamentary dynamics:

| ISMS Likelihood | ISMS Definition | Political Probability | Parliamentary Analogy |
|:--------------:|-----------------|:--------------------:|----------------------|
| **5 — Almost Certain** | Expected to occur in most circumstances (>70%) | >70% probability | Government tables annual budget proposition |
| **4 — Likely** | Will probably occur in most circumstances (41–70%) | 41–70% probability | Opposition files no-confidence motion when polls shift >5 points |
| **3 — Possible** | Might occur at some time (21–40%) | 21–40% probability | SD defects on a non-budget vote within a parliamentary term |
| **2 — Unlikely** | Could occur at some time (5–20%) | 5–20% probability | Budget vote fails despite pre-agreed coalition majority |
| **1 — Rare** | May occur only in exceptional circumstances (<5%) | <5% probability | Coalition collapses with 176+ stable seat majority |

### Swedish Parliamentary Likelihood Calibrators

Unlike corporate risk management, Swedish parliamentary likelihood is shaped by:

1. **Tidöavtalet constraints**: Formal coalition agreement limits defection probability for budget items
2. **Swedish electoral stability**: Sweden averages one parliament per 4-year cycle since 1970 — baseline stability is higher than many European parliaments
3. **SD support dependency**: Likelihood calibration must account for SD's known veto points (migration, crime)
4. **Pre-election year dynamics**: All likelihoods increase by 0.5–1 level in the 12 months before an election

---

## 💥 Impact Categories: CIA Triad → Political Impact Triad

The ISMS measures impact across the CIA triad (Confidentiality, Integrity, Availability). Political impact is measured across a parallel political triad:

| ISMS CIA Triad | ISMS Measure | Political Triad | Political Measure |
|:--------------:|-------------|:---------------:|------------------|
| **Confidentiality** | Data exposure or breach | **Accountability** | Failure to disclose political information citizens have a right to know |
| **Integrity** | Data modification or corruption | **Policy Fidelity** | Deviation from legislated policy intent through implementation or interpretation |
| **Availability** | Service disruption or downtime | **Democratic Continuity** | Disruption to normal democratic processes (votes, committee work, government function) |

### Impact Scoring: ISMS to Political

| ISMS Impact Category | Score | ISMS Example | Political Equivalent | Political Example |
|:--------------------:|:-----:|-------------|:--------------------:|-------------------|
| Negligible | 1 | Temporary system slowdown | Committee delay | Minor betänkande delayed 2 weeks |
| Minor | 2 | Single data record exposed | Single bill modified | Budget line amended; government accepts |
| Moderate | 3 | 1,000 records exposed; SLA breach | Major policy reversal | Government forced to withdraw proposition |
| Major | 4 | Regulatory fine; significant breach | Coalition rupture | Partner party threatens withdrawal |
| Severe | 5 | Existential; regulatory revocation | Government collapse | Extraordinary election or no-confidence passes |

---

## 📋 Risk Register: ISMS → Political Risk Register

The ISMS Risk Register tracks organisational security risks over time. The Political Risk Register adapts this structure:

| ISMS Risk Register Field | ISMS Content | Political Risk Register Equivalent | Political Content |
|:------------------------:|-------------|:----------------------------------:|------------------|
| Risk ID | Unique identifier | Risk ID | `RSK-YYYY-MM-DD-NNN` |
| Asset | System or data asset | Political Asset | "Coalition majority", "Budget credibility", "EU compliance" |
| Threat | Threat agent + action | Political Threat | Opposition action, SD defection, EU directive |
| Vulnerability | Weakness exploited | Political Vulnerability | Thin majority, internal disagreement, pre-election pressure |
| Likelihood | 1–5 scale | Political Likelihood | 1–5 (see calibration above) |
| Impact | 1–5 scale | Political Impact | 1–5 (see political triad above) |
| Risk Score | L × I | Risk Score | L × I (1–25) |
| Risk Owner | System/team owner | Political Monitor | Specific agentic workflow |
| Treatment | Accept/Mitigate/Transfer/Avoid | Political Mitigation | Scrutiny/Amendment/Coalition negotiation/Public pressure |
| Review Date | Next review | Next Assessment | Next scheduled workflow run |

---

## 🔧 Treatment Options: ISMS → Political Mitigation Strategies

The ISMS defines four treatment options for risks. Political risk "treatment" is reframed as analytical and editorial responses:

| ISMS Treatment | ISMS Action | Political Mitigation | Editorial/Analytical Action |
|:--------------:|------------|:--------------------:|----------------------------|
| **Mitigate** | Implement controls to reduce likelihood/impact | **Scrutiny** | Publish analysis that increases public awareness and accountability pressure |
| **Accept** | Formally accept the risk | **Monitor** | Track risk without active intervention; include in weekly digest |
| **Transfer** | Insurance or third-party responsibility | **Amendment tracking** | Track opposition amendments that could redirect the policy risk |
| **Avoid** | Change approach to eliminate risk | **Coalition negotiation** | Identify cross-party compromise pathways that resolve the risk |

### Political Mitigation Effectiveness

Unlike ISMS controls, political mitigations act through **public information** and **democratic accountability**:

- Publishing a risk analysis increases the **probability that affected actors respond** (scrutiny effect)
- Tracking amendment attempts measures the **opposition's mitigation capacity** 
- Cross-party deal pathways reduce the risk score by lowering likelihood (negotiation reduces defection probability)

---

## 🔗 Implementation Reference

- [methodologies/political-risk-methodology.md](../methodologies/political-risk-methodology.md) — Full risk methodology
- [templates/risk-assessment.md](../templates/risk-assessment.md) — Risk assessment template

---

**Document Control:**  
- **Path:** `/analysis/reference/isms-risk-assessment-adaptation.md`  
- **Source ISMS Doc:** [Risk_Assessment_Methodology.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Assessment_Methodology.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-26
