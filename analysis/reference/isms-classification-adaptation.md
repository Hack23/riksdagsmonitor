<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🗂️ ISMS Classification → Political Intelligence Adaptation</h1>

<p align="center">
  <strong>📊 Mapping ISMS Classification Framework to Political Sensitivity Levels</strong><br>
  <em>🎯 Confidentiality · Integrity · Availability → Sensitivity · Accuracy · Urgency</em>
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

This reference document explains how [Hack23 ISMS CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md) has been adapted for political intelligence classification in Riksdagsmonitor. It provides the authoritative mapping between ISMS security classification concepts and political intelligence classification concepts, enabling consistent analytical reasoning across both domains.

---

## 🔒 Confidentiality Levels → Political Sensitivity Levels

The ISMS defines three confidentiality levels (Public, Internal, Confidential). These map directly to Riksdagsmonitor's three political sensitivity levels:

| ISMS Confidentiality Level | ISMS Definition | Political Sensitivity Level | Political Definition |
|:-------------------------:|-----------------|:---------------------------:|---------------------|
| **Public** | Information that can be freely shared with anyone without risk | 🟢 **PUBLIC** | Routine parliamentary activity; freely publishable |
| **Internal** | Information for internal stakeholders; limited external distribution | 🟡 **SENSITIVE** | Politically charged; requires careful framing before publication |
| **Confidential** | Information with legal, competitive, or safety restrictions | 🔴 **RESTRICTED** | Legal sensitivity or acute political risk; editorial review mandatory |

### Adaptation Rationale

The ISMS confidentiality framework is primarily designed to protect **organisational secrets**. The political intelligence adaptation inverts this orientation: the goal is **maximum transparency** rather than restriction. Therefore:

- **PUBLIC** is the default and desirable state — unlike ISMS where most data is Internal
- **RESTRICTED** indicates a *journalistic* caution, not organisational secrecy
- The handling controls differ: ISMS Confidential restricts distribution; RESTRICTED in political context requires *verification and framing*, not suppression

---

## ✅ Integrity Levels → Political Accuracy Requirements

The ISMS defines integrity in terms of data accuracy and modification controls. Political accuracy requirements adapt this to the journalistic verification context:

| ISMS Integrity Level | ISMS Control | Political Accuracy Requirement | Verification Method |
|:--------------------:|-------------|:------------------------------:|---------------------|
| **High Integrity** | Cryptographic signing; audit trails; no modification without approval | **Verified** — multiple primary sources; official Riksdag document | Cross-reference via `get_dokument` + `search_voteringar` |
| **Medium Integrity** | Access controls; version tracking; change logging | **Corroborated** — single primary source + secondary confirmation | `search_anforanden` + media verification |
| **Low Integrity** | Basic controls; review recommended | **Unverified** — single source; flag with [LOW confidence] | Explicit confidence notation required |

### Accuracy Degradation

Just as ISMS data integrity can be compromised over time, political accuracy **degrades temporally**:

- Information verified against a 2025 proposition remains HIGH accuracy
- The same information applied to a 2026 policy context becomes MEDIUM (policy may have changed)
- Information older than 180 days requires re-verification before inclusion in analysis

---

## ⚡ Availability Levels → Political Urgency Levels

The ISMS defines availability in terms of system uptime and data accessibility. Political urgency adapts this to publication timing requirements:

| ISMS Availability | ISMS SLA | Political Urgency Level | Publication Deadline |
|:-----------------:|----------|:-----------------------:|---------------------|
| **Critical** (99.99% uptime) | Near-zero tolerance for downtime | 🔴 **CRITICAL** | Immediate publication; all-language deployment within 2 hours |
| **High** (99.9% uptime) | Maximum 8.7 hours downtime/year | 🟠 **URGENT** | Publish within 4–8 hours; priority placement |
| **Medium** (99% uptime) | Maximum 3.65 days downtime/year | 🔵 **ELEVATED** | Include in next scheduled news cycle |
| **Low** (best-effort) | No SLA | ⚪ **ROUTINE** | Publish in standard workflow; 24–48 hours acceptable |

---

## 📊 ISMS Impact Analysis Matrix → Political Impact Matrix

The ISMS uses an impact matrix to assess security incident consequences. The political adaptation scores consequences for democratic process disruption:

| ISMS Impact Category | ISMS Consequence | Political Impact Category | Political Consequence |
|:--------------------:|-----------------|:-------------------------:|----------------------|
| **Reputational** | Brand/credibility damage to Hack23 | **Democratic Credibility** | Damage to trust in Swedish democratic institutions |
| **Financial** | Revenue loss, fines, remediation cost | **Economic Impact** | Policy cost to Swedish taxpayers or GDP impact |
| **Legal/Regulatory** | Fines, sanctions, legal proceedings | **Constitutional Impact** | Breach of Riksdag procedures or constitutional norms |
| **Operational** | Service disruption, productivity loss | **Governance Impact** | Disruption to government's ability to function |
| **Safety** | Physical harm to persons | **Social Cohesion** | Harm to Swedish social fabric or minority rights |

### Political Impact Score Calibration

The ISMS 1–5 impact scale maps to political impact:

| Score | ISMS Consequence | Political Equivalent |
|:-----:|-----------------|---------------------|
| 1 | Minor operational inconvenience | Routine committee delay |
| 2 | Limited reputational concern | Single bill rejection; government resubmits |
| 3 | Moderate financial/legal exposure | Major budget amendment forced |
| 4 | Severe reputational or operational harm | Minister resignation or major policy reversal |
| 5 | Existential threat to organisation | Government collapse; extraordinary election |

---

## 🔗 Implementation Reference

This adaptation is implemented in:

- [methodologies/political-classification-guide.md](../methodologies/political-classification-guide.md) — Full classification guide
- [templates/political-classification.md](../templates/political-classification.md) — Classification template
- `scripts/analysis-framework/types.ts` — TypeScript classification types
- `scripts/analysis-framework/lenses/` — Automated classification lenses

---

**Document Control:**  
- **Path:** `/analysis/reference/isms-classification-adaptation.md`  
- **Source ISMS Doc:** [CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-26
