# ⚖️ Political Risk Assessment — 2026-04-08 14:33 UTC

**📋 Document Owner:** CEO | **📄 Version:** 2.2 | **📅 Last Updated:** 2026-04-08 (UTC)
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 📋 Risk Context

| Field | Value |
|-------|-------|
| **Assessment ID** | RISK-2026-04-08-002 |
| **Analysis Date** | 2026-04-08 14:33 UTC |
| **Documents Analyzed** | 14 |
| **Produced By** | news-realtime-monitor |
| **Overall Risk Level** | MEDIUM |

---

## 🔥 Risk Heat Map

```mermaid
quadrantChart
    title Political Risk Heat Map — 2026-04-08
    x-axis Low Likelihood --> High Likelihood
    y-axis Low Impact --> High Impact
    quadrant-1 Critical
    quadrant-2 Monitor
    quadrant-3 Low Priority
    quadrant-4 Watch
    SD defense pressure on M: [0.65, 0.55]
    Environmental permits vs defense: [0.50, 0.60]
    Reserve police delay: [0.40, 0.45]
    EV premium equity gap: [0.35, 0.30]
    Healthcare quality risk: [0.30, 0.35]
    Species protection costs: [0.25, 0.25]
```

---

## 📊 Risk Register

| ID | Risk | Likelihood | Impact | Risk Score | Category | Trend |
|----|------|:----------:|:------:|:----------:|----------|:-----:|
| R1 | SD coordinated defense questioning undermines coalition trust with M | 0.5 | 0.6 | 0.30 | Coalition Stability | ↑ |
| R2 | Environmental permits continue blocking Försvarsmakten operations | 0.5 | 0.7 | 0.35 | Policy Implementation | → |
| R3 | Reserve police force remains unimplemented despite security need | 0.4 | 0.5 | 0.20 | Security Preparedness | → |
| R4 | EV premium accessibility creates social equity optics problem | 0.3 | 0.3 | 0.09 | Policy Equity | ↑ |
| R5 | Healthcare quality registers funding gap affects equitable care | 0.3 | 0.4 | 0.12 | Public Services | → |
| R6 | Species protection compensation creates fiscal precedent | 0.2 | 0.3 | 0.06 | Fiscal | → |

---

## 🔗 Cascading Risk Chain

```mermaid
graph TD
    R1["R1: SD defense pressure<br/>Score: 0.30"]
    R2["R2: Env permits block defense<br/>Score: 0.35"]
    R3["R3: Reserve police delayed<br/>Score: 0.20"]

    R2 -->|"feeds"| R1
    R3 -->|"amplifies"| R1
    R1 -->|"if unresolved → NATO hosting risk"| R7["R7: NATO credibility gap<br/>(Potential)"]

    style R1 fill:#FFC107,color:#000000
    style R2 fill:#FF9800,color:#FFFFFF
    style R3 fill:#FFC107,color:#000000
    style R7 fill:#D32F2F,color:#FFFFFF,stroke-dasharray: 5 5
```

**Chain Analysis:** Environmental permit barriers (R2) and reserve police delays (R3) feed SD's defense pressure narrative (R1). If unresolved before NATO foreign ministers meeting (May 21-22), this could create credibility gaps when Sweden hosts alliance partners.

---

## 📋 Risk Summary

| Metric | Value |
|--------|-------|
| Total Risks Identified | 6 |
| Critical Risks | 0 |
| High Risks | 0 |
| Medium Risks | 3 (R1, R2, R3) |
| Low Risks | 3 (R4, R5, R6) |
| **Overall Risk Level** | **MEDIUM** |
| Trend vs. Previous Run | → (stable) |

---

**Document Control:**
- **Template Path:** `/analysis/templates/risk-assessment.md`
- **Version:** 2.2
- **ISMS Alignment:** ISO 27001:2022 A.5.7, NIST CSF 2.0 ID.RA
