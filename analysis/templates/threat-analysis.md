<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🎭 Political Threat Analysis Template</h1>

<p align="center">
  <strong>📊 STRIDE-Inspired Framework for Democratic Process Threat Analysis</strong><br>
  <em>🎯 Spoofing · Tampering · Repudiation · Disclosure · Denial · Elevation</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template Instructions:** This template adapts the STRIDE threat modeling framework from cybersecurity to political intelligence analysis. Each STRIDE category maps to a class of democratic process threats. See [methodologies/political-threat-framework.md](../methodologies/political-threat-framework.md) for full methodology. For the daily workflow, save as `evening-threat-snapshot.md` in `analysis/daily/YYYY-MM-DD/`. For monthly strategic aggregation, save as `monthly-threat-landscape.md` in `analysis/monthly/YYYY-MM/`. For ad-hoc analyses, a date-scoped filename like `YYYY-MM-DD-threat-analysis.md` MAY be used.

---

## 📋 Threat Analysis Context

| Field | Value |
|-------|-------|
| **Threat Analysis ID** | `[REQUIRED: THR-YYYY-MM-DD-NNN]` |
| **Analysis Date** | `[REQUIRED: YYYY-MM-DD HH:MM UTC]` |
| **Analysis Period** | `[REQUIRED: e.g. "2026-W13 (2026-03-23 to 2026-03-29)"]` |
| **Produced By** | `[REQUIRED: workflow name]` |
| **Political Context** | `[REQUIRED: 2–3 sentences on current political situation]` |
| **Overall Threat Level** | `[REQUIRED: LOW / MODERATE / HIGH / SEVERE]` |

---

## 🎭 STRIDE-Adapted Threat Inventory

### S — Spoofing: False Narratives & Misinformation Threats

*Threats involving actors misrepresenting facts, identities, or political positions to manipulate public discourse or parliamentary outcomes.*

| Threat ID | Threat Description | Threat Actor | Evidence Sources | Severity (1–5) | Mitigation |
|-----------|-------------------|--------------|------------------|:--------------:|------------|
| `S-001` | `[REQUIRED: e.g. "Coordinated disinformation campaign misattributing policy position to coalition party"]` | `[REQUIRED: e.g. "Foreign state actor / domestic opposition / media outlet"]` | `[REQUIRED: dok_id or URL]` | `[#]` | `[REQUIRED: 1 sentence]` |
| `S-002` | `[OPTIONAL]` | `[OPTIONAL]` | `[OPTIONAL]` | `[#]` | `[OPTIONAL]` |

**S-Category Threat Level:** `[LOW / MODERATE / HIGH / SEVERE]`

---

### T — Tampering: Policy Corruption Risks

*Threats involving manipulation of legislative texts, parliamentary records, budget figures, or official statistics to corrupt policy outcomes.*

| Threat ID | Threat Description | Threat Actor | Evidence Sources | Severity (1–5) | Mitigation |
|-----------|-------------------|--------------|------------------|:--------------:|------------|
| `T-001` | `[REQUIRED: e.g. "Undisclosed lobbying altering committee report recommendations"]` | `[REQUIRED: e.g. "Industry lobby / coalition ally ministry"]` | `[REQUIRED: dok_id]` | `[#]` | `[REQUIRED]` |
| `T-002` | `[OPTIONAL]` | `[OPTIONAL]` | `[OPTIONAL]` | `[#]` | `[OPTIONAL]` |

**T-Category Threat Level:** `[LOW / MODERATE / HIGH / SEVERE]`

---

### R — Repudiation: Accountability Evasion

*Threats involving actors denying statements, votes, commitments, or policy positions to evade accountability — especially relevant in Swedish parliamentary context where voting records are public.*

| Threat ID | Threat Description | Threat Actor | Evidence Sources | Severity (1–5) | Mitigation |
|-----------|-------------------|--------------|------------------|:--------------:|------------|
| `R-001` | `[REQUIRED: e.g. "Government minister contradicts Riksdag voting record on climate policy"]` | `[REQUIRED: e.g. "Statsråd / party spokesperson"]` | `[REQUIRED: voterings-id or dok_id]` | `[#]` | `[REQUIRED: e.g. "Publish voting record cross-reference"]` |
| `R-002` | `[OPTIONAL]` | `[OPTIONAL]` | `[OPTIONAL]` | `[#]` | `[OPTIONAL]` |

**R-Category Threat Level:** `[LOW / MODERATE / HIGH / SEVERE]`

---

### I — Information Disclosure: Transparency Failures

*Threats involving suppression, delay, or selective disclosure of politically significant information that citizens have a right to know.*

| Threat ID | Threat Description | Threat Actor | Evidence Sources | Severity (1–5) | Mitigation |
|-----------|-------------------|--------------|------------------|:--------------:|------------|
| `I-001` | `[REQUIRED: e.g. "Classified government inquiry suppresses key findings from SOU report"]` | `[REQUIRED: e.g. "Departement / committee chair"]` | `[REQUIRED: dok_id or reference]` | `[#]` | `[REQUIRED: e.g. "FOI request tracking, MCP monitoring"]` |
| `I-002` | `[OPTIONAL]` | `[OPTIONAL]` | `[OPTIONAL]` | `[#]` | `[OPTIONAL]` |

**I-Category Threat Level:** `[LOW / MODERATE / HIGH / SEVERE]`

---

### D — Denial: Democratic Process Obstruction

*Threats involving obstruction, delay, or blockage of normal democratic processes — votes, committee work, public consultations, or legislative timelines.*

| Threat ID | Threat Description | Threat Actor | Evidence Sources | Severity (1–5) | Mitigation |
|-----------|-------------------|--------------|------------------|:--------------:|------------|
| `D-001` | `[REQUIRED: e.g. "Systematic filibustering of budget committee deliberations to delay vote"]` | `[REQUIRED: e.g. "Opposition bloc / specific party"]` | `[REQUIRED: calendar ref or dok_id]` | `[#]` | `[REQUIRED: e.g. "Track committee session attendance and delay patterns"]` |
| `D-002` | `[OPTIONAL]` | `[OPTIONAL]` | `[OPTIONAL]` | `[#]` | `[OPTIONAL]` |

**D-Category Threat Level:** `[LOW / MODERATE / HIGH / SEVERE]`

---

### E — Elevation of Privilege: Power Concentration

*Threats involving actors accumulating disproportionate political power beyond their constitutional mandate — e.g. bypassing Riksdag oversight, concentrating ministerial authority, or circumventing checks and balances.*

| Threat ID | Threat Description | Threat Actor | Evidence Sources | Severity (1–5) | Mitigation |
|-----------|-------------------|--------------|------------------|:--------------:|------------|
| `E-001` | `[REQUIRED: e.g. "Government uses regulatory decree to bypass Riksdag legislative vote on migration policy"]` | `[REQUIRED: e.g. "Statsminister / Justitiedepartementet"]` | `[REQUIRED: dok_id or proposition ref]` | `[#]` | `[REQUIRED: e.g. "Track Konstitutionsutskottet (KU) granskning proceedings"]` |
| `E-002` | `[OPTIONAL]` | `[OPTIONAL]` | `[OPTIONAL]` | `[#]` | `[OPTIONAL]` |

**E-Category Threat Level:** `[LOW / MODERATE / HIGH / SEVERE]`

---

## 📊 Threat Summary Matrix

> Use this matrix to summarize, for each STRIDE category, the single highest-severity threat and its assessed severity score (1–5).

| STRIDE Category | Highest Threat | Severity | Threat Level |
|----------------|---------------|:--------:|--------------|
| S — Spoofing | `[highest S threat ID]` | `[#]` | `[LOW/MOD/HIGH/SEVERE]` |
| T — Tampering | `[highest T threat ID]` | `[#]` | `[LOW/MOD/HIGH/SEVERE]` |
| R — Repudiation | `[highest R threat ID]` | `[#]` | `[LOW/MOD/HIGH/SEVERE]` |
| I — Disclosure | `[highest I threat ID]` | `[#]` | `[LOW/MOD/HIGH/SEVERE]` |
| D — Denial | `[highest D threat ID]` | `[#]` | `[LOW/MOD/HIGH/SEVERE]` |
| E — Elevation | `[highest E threat ID]` | `[#]` | `[LOW/MOD/HIGH/SEVERE]` |

---

## 🎯 Threat Actor Mapping

| Actor Type | Specific Actor | Primary Threat Category | Intent | Capability |
|------------|---------------|------------------------|--------|------------|
| Government | `[e.g. Statsminister]` | `[S/T/R/I/D/E]` | `[known/suspected/unknown]` | `[HIGH/MED/LOW]` |
| Opposition | `[e.g. S party leadership]` | `[S/T/R/I/D/E]` | `[known/suspected/unknown]` | `[HIGH/MED/LOW]` |
| Media | `[e.g. specific outlet]` | `[S/T/R/I/D/E]` | `[known/suspected/unknown]` | `[HIGH/MED/LOW]` |
| External | `[e.g. EU Commission]` | `[S/T/R/I/D/E]` | `[known/suspected/unknown]` | `[HIGH/MED/LOW]` |

---

## 🛡️ Priority Mitigations

1. **[Threat ID]:** `[Mitigation action — who does what by when]`
2. **[Threat ID]:** `[Mitigation action]`
3. **[Threat ID]:** `[Mitigation action]`

**Overall Threat Level:** `[REQUIRED: LOW / MODERATE / HIGH / SEVERE]`  
**Assessment Confidence:** `[REQUIRED: HIGH / MEDIUM / LOW]`

---

**Document Control:**  
- **Template Path:** `/analysis/templates/threat-analysis.md`  
- **Framework Reference:** [THREAT_MODEL.md](../../THREAT_MODEL.md), [FUTURE_THREAT_MODEL.md](../../FUTURE_THREAT_MODEL.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-26
