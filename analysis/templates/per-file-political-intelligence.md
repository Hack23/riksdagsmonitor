<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🔍 Per-File Political Intelligence Analysis Template</h1>

<p align="center">
  <strong>📊 Deep AI-Driven Analysis for Individual Parliamentary Documents</strong><br>
  <em>🎯 SWOT · Risk · Threat · Stakeholder Impact · Strategic Implications</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--28-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-28 (UTC)  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

> **📌 Template Instructions:** This template is for **per-file** analysis. For each data file downloaded via MCP (e.g., a proposition, motion, vote record), the AI agent produces one analysis markdown file stored as `{id}.analysis.md` alongside the data file. This avoids merge conflicts and ensures every piece of downloaded content receives deep analysis.
>
> **Example path:** `analysis/data/documents/propositions/H901.json` → `analysis/data/documents/propositions/H901.analysis.md`

---

## 📋 Document Identity

| Field | Value |
|-------|-------|
| **Document ID** | `[REQUIRED: dok_id or file identifier]` |
| **Document Type** | `[REQUIRED: proposition / motion / committeeReport / vote / speech / question / interpellation / government / worldbank / scb]` |
| **Title** | `[REQUIRED: document title or descriptor]` |
| **Date** | `[REQUIRED: document date or fetch date]` |
| **Riksmöte** | `[REQUIRED if parliamentary: e.g. 2025/26]` |
| **Source MCP Tool** | `[REQUIRED: e.g. search_dokument, get_propositioner]` |
| **Analysis Timestamp** | `[REQUIRED: YYYY-MM-DD HH:MM UTC]` |
| **Analyst** | `[REQUIRED: workflow name, e.g. news-evening-analysis]` |

---

## 🎯 Executive Summary

`[REQUIRED: 3–5 sentences capturing the political significance. Intelligence-level analysis — not just what happened, but what it means for power dynamics, coalition stability, and democratic accountability. Include confidence label.]` **[HIGH/MEDIUM/LOW]**

---

## 📊 Political Classification

```mermaid
graph LR
    A[Document] --> B{Sensitivity}
    B -->|"🔴 CRITICAL"| C[Constitutional Impact]
    B -->|"🟠 HIGH"| D[Policy Delivery Risk]
    B -->|"🟡 MEDIUM"| E[Standard Parliamentary]
    B -->|"🟢 LOW"| F[Routine / Background]
    
    A --> G{Domain}
    G --> H["[REQUIRED: Primary policy domain]"]
    
    A --> I{Urgency}
    I -->|"⚡ IMMEDIATE"| J[Breaking — hours]
    I -->|"📅 SHORT-TERM"| K[This week]
    I -->|"📆 MEDIUM-TERM"| L[This month]
    I -->|"🗓️ LONG-TERM"| M[This session]
    
    style C fill:#dc3545,color:#fff
    style D fill:#fd7e14,color:#fff
    style E fill:#ffc107,color:#000
    style F fill:#28a745,color:#fff
```

| Field | Assessment |
|-------|-----------|
| **Sensitivity Level** | `[REQUIRED: CRITICAL / HIGH / MEDIUM / LOW]` |
| **Primary Domain** | `[REQUIRED: e.g. Migration (MIG), Defence (DEF), Economy (ECO), Climate (ENV), Justice (JUS), Health (HEA), Education (EDU), Foreign Affairs (FOR)]` |
| **Urgency** | `[REQUIRED: IMMEDIATE / SHORT-TERM / MEDIUM-TERM / LONG-TERM]` |
| **Significance Score** | `[REQUIRED: 0–10]` |
| **Confidence** | `[REQUIRED: HIGH / MEDIUM / LOW]` |

---

## 💪 SWOT Impact Assessment

> *How does this document affect the political landscape? Each entry requires evidence.*

### Quadrant Overview

```mermaid
quadrantChart
    title Political Impact Assessment
    x-axis Government --> Opposition
    y-axis Risk --> Opportunity
    quadrant-1 Opposition Opportunities
    quadrant-2 Government Opportunities
    quadrant-3 Government Risks
    quadrant-4 Opposition Risks
    
    "[REQUIRED: key finding 1]": [0.3, 0.7]
    "[REQUIRED: key finding 2]": [0.7, 0.3]
```

### Government Coalition Impact

| Quadrant | Statement | Evidence | Confidence | Impact |
|----------|-----------|----------|:----------:|:------:|
| ✅ Strength | `[If this document strengthens the government position — specific claim]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |
| ⚠️ Weakness | `[If this document exposes a government vulnerability]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |
| 🚀 Opportunity | `[If this creates a government opportunity]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |
| 🔴 Threat | `[If this poses a threat to the government]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |

### Opposition Impact

| Quadrant | Statement | Evidence | Confidence | Impact |
|----------|-----------|----------|:----------:|:------:|
| ✅ Strength | `[If this strengthens the opposition]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |
| ⚠️ Weakness | `[If this exposes an opposition vulnerability]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |
| 🚀 Opportunity | `[If this creates an opposition opportunity]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |
| 🔴 Threat | `[If this poses a threat to the opposition]` | `[dok_id or evidence]` | `H/M/L` | `H/M/L` |

---

## ⚖️ Risk Assessment

```mermaid
graph TD
    subgraph "Risk Matrix"
        direction TB
        R1["🔴 Coalition Stability Risk"]
        R2["🟠 Policy Implementation Risk"]
        R3["🟡 Electoral Risk"]
        R4["🟢 Institutional Risk"]
    end
    
    R1 --> |"Likelihood × Impact"| S1["Score: [N/25]"]
    R2 --> |"Likelihood × Impact"| S2["Score: [N/25]"]
    R3 --> |"Likelihood × Impact"| S3["Score: [N/25]"]
    R4 --> |"Likelihood × Impact"| S4["Score: [N/25]"]
    
    style R1 fill:#dc3545,color:#fff
    style R2 fill:#fd7e14,color:#fff
    style R3 fill:#ffc107,color:#000
    style R4 fill:#28a745,color:#fff
```

> **Scoring Reference:** Use [political-risk-methodology.md](../methodologies/political-risk-methodology.md) for calibration. Score tiers: 1–4 🟢 Low, 5–9 🟡 Medium, 10–14 🟠 High, 15–25 🔴 Critical.

| Risk Type | Likelihood (1–5) | Impact (1–5) | Score | Assessment |
|-----------|:-----------------:|:------------:|:-----:|------------|
| Coalition Stability | `[1-5]` | `[1-5]` | `[L×I]` | `[REQUIRED: specific risk statement]` |
| Policy Implementation | `[1-5]` | `[1-5]` | `[L×I]` | `[REQUIRED: specific risk statement]` |
| Budget / Fiscal | `[1-5]` | `[1-5]` | `[L×I]` | `[REQUIRED: specific risk statement]` |
| Electoral Impact | `[1-5]` | `[1-5]` | `[L×I]` | `[REQUIRED: specific risk statement]` |
| Democratic Process | `[1-5]` | `[1-5]` | `[L×I]` | `[REQUIRED: specific risk statement]` |
| External / International | `[1-5]` | `[1-5]` | `[L×I]` | `[OPTIONAL: EU, NATO, Nordic impact]` |

**Overall Risk Level:** `[REQUIRED: CRITICAL / HIGH / MEDIUM / LOW]`  
**Risk-to-SWOT:** Any score ≥15 → add as SWOT Threat entry. Any score 10–14 → add as SWOT Weakness or Threat.

### Anomaly Flags

`[List any detected anomalies — unusual voting patterns, unexpected coalition breaks, procedural irregularities]`

---

## 🎭 Threat Analysis (STRIDE-Adapted)

> *Political threats mapped to the STRIDE framework adapted for democratic processes. Severity: 1=Negligible, 2=Minor, 3=Moderate, 4=Major, 5=Severe. See [political-threat-framework.md §9](../methodologies/political-threat-framework.md) for calibration.*

```mermaid
graph LR
    subgraph "Political STRIDE Threats"
        S["🎭 Spoofing<br/>Misrepresentation"]
        T["🔧 Tampering<br/>Process Manipulation"]
        R["📝 Repudiation<br/>Accountability Evasion"]
        I["🔓 Info Disclosure<br/>Intelligence Leaks"]
        D["🚫 Denial of Service<br/>Democratic Obstruction"]
        E["⬆️ Elevation<br/>Power Overreach"]
    end
    
    S --> S1["[If applicable: specific threat]"]
    T --> T1["[If applicable: specific threat]"]
    R --> R1["[If applicable: specific threat]"]
    I --> I1["[If applicable: specific threat]"]
    D --> D1["[If applicable: specific threat]"]
    E --> E1["[If applicable: specific threat]"]
    
    style S fill:#6f42c1,color:#fff
    style T fill:#dc3545,color:#fff
    style R fill:#fd7e14,color:#fff
    style I fill:#ffc107,color:#000
    style D fill:#20c997,color:#fff
    style E fill:#0d6efd,color:#fff
```

| STRIDE Category | Applicable? | Threat Description | Severity (1–5) | Evidence |
|----------------|:-----------:|-------------------|:--------------:|----------|
| 🎭 Spoofing | `[Y/N]` | `[Misrepresentation of positions, false attributions]` | `[1-5]` | `[dok_id]` |
| 🔧 Tampering | `[Y/N]` | `[Process manipulation, rule bending]` | `[1-5]` | `[dok_id]` |
| 📝 Repudiation | `[Y/N]` | `[Accountability evasion, position reversal]` | `[1-5]` | `[dok_id]` |
| 🔓 Info Disclosure | `[Y/N]` | `[Premature leaks, intelligence compromise]` | `[1-5]` | `[dok_id]` |
| 🚫 Denial of Service | `[Y/N]` | `[Parliamentary obstruction, filibuster]` | `[1-5]` | `[dok_id]` |
| ⬆️ Elevation | `[Y/N]` | `[Executive overreach, bypassing parliament]` | `[1-5]` | `[dok_id]` |

---

## 👥 Stakeholder Impact Matrix

> *Six analytical lenses applied to this document.*

```mermaid
graph TD
    DOC["📄 This Document"] --> GOV["🏛️ Government"]
    DOC --> OPP["⚖️ Opposition"]
    DOC --> CIT["👥 Citizens"]
    DOC --> ECO["💰 Economic Actors"]
    DOC --> INT["🌍 International"]
    DOC --> MED["📰 Media"]
    
    GOV --> G1["[Impact summary]"]
    OPP --> O1["[Impact summary]"]
    CIT --> C1["[Impact summary]"]
    ECO --> E1["[Impact summary]"]
    INT --> I1["[Impact summary]"]
    MED --> M1["[Impact summary]"]
    
    style DOC fill:#0d6efd,color:#fff
    style GOV fill:#198754,color:#fff
    style OPP fill:#dc3545,color:#fff
    style CIT fill:#6f42c1,color:#fff
    style ECO fill:#fd7e14,color:#fff
    style INT fill:#0dcaf0,color:#000
    style MED fill:#ffc107,color:#000
```

| Stakeholder | Impact Level | Key Assessment | Confidence |
|------------|:------------:|----------------|:----------:|
| 🏛️ Government | `[HIGH/MEDIUM/LOW/NONE]` | `[REQUIRED: How does this affect government's position, agenda, and coalition stability?]` | `[H/M/L]` |
| ⚖️ Opposition | `[HIGH/MEDIUM/LOW/NONE]` | `[REQUIRED: How does this create opportunities or challenges for opposition parties?]` | `[H/M/L]` |
| 👥 Citizens | `[HIGH/MEDIUM/LOW/NONE]` | `[REQUIRED: How does this affect public services, rights, daily life?]` | `[H/M/L]` |
| 💰 Economic | `[HIGH/MEDIUM/LOW/NONE]` | `[REQUIRED: Fiscal impact, business implications, labour market effects?]` | `[H/M/L]` |
| 🌍 International | `[HIGH/MEDIUM/LOW/NONE]` | `[REQUIRED: EU compliance, Nordic cooperation, foreign relations?]` | `[H/M/L]` |
| 📰 Media | `[HIGH/MEDIUM/LOW/NONE]` | `[REQUIRED: Newsworthiness, narrative potential, public attention?]` | `[H/M/L]` |

---

## 🔮 Forward Indicators

> *What to monitor as a consequence of this document.*

| # | Indicator | Timeline | Trigger Condition | Watch Priority |
|---|-----------|----------|-------------------|:--------------:|
| 1 | `[REQUIRED: specific future event or metric to monitor]` | `[days/weeks/months]` | `[what would trigger escalation]` | `🔴/🟠/🟡/🟢` |
| 2 | `[REQUIRED]` | `[timeline]` | `[trigger]` | `🔴/🟠/🟡/🟢` |
| 3 | `[OPTIONAL]` | `[timeline]` | `[trigger]` | `🔴/🟠/🟡/🟢` |

---

## 🔗 Cross-References

| Related Document | Relationship | dok_id |
|-----------------|-------------|--------|
| `[If related documents exist]` | `[supports / contradicts / amends / supersedes / responds-to]` | `[dok_id]` |

---

## 📊 Data Quality Assessment

| Metric | Value |
|--------|-------|
| **Source Completeness** | `[REQUIRED: Full text / Metadata only / Summary only]` |
| **Evidence Density** | `[REQUIRED: N evidence points cited]` |
| **Temporal Currency** | `[REQUIRED: Current / Recent (30d) / Dated (90d) / Stale (180d+)]` |
| **Analytical Confidence** | `[REQUIRED: HIGH / MEDIUM / LOW]` |

---

**Document Control:**  
- **Template Path:** `/analysis/templates/per-file-political-intelligence.md`  
- **Output Path:** `analysis/data/{type}/{id}.analysis.md`  
- **Framework References:** [SWOT.md](../../SWOT.md), [THREAT_MODEL.md](../../THREAT_MODEL.md)  
- **Methodology:** [ai-driven-analysis-guide.md](../methodologies/ai-driven-analysis-guide.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-28
