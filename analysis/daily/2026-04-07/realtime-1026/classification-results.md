# 🏷️ Political Classification Results — 2026-04-07

## 📋 Context

| Field | Value |
|-------|-------|
| **Analysis Date** | 2026-04-07 10:28 UTC |
| **Documents Analyzed** | 4 |
| **Produced By** | news-realtime-monitor |
| **Overall Confidence** | MEDIUM |

---

## 📊 Classification Overview

```mermaid
graph LR
    subgraph "Classification Matrix — 2026-04-07"
        D1["HD03114<br/>Prop: Strategic Export Controls<br/>🟡 SENSITIVE | 7/10"]
        D2["HD10429<br/>IP: Free Speech<br/>🟡 SENSITIVE | 5/10"]
        D3["HD11684<br/>Fr: Syrian Returns<br/>🟡 SENSITIVE | 4/10"]
        D4["HD11685<br/>Fr: Cuba Policy<br/>🟢 PUBLIC | 3/10"]
    end

    D1 --> DOM1["Defense & Security"]
    D2 --> DOM2["Constitutional Law"]
    D3 --> DOM3["Migration"]
    D4 --> DOM4["Foreign Policy"]

    style D1 fill:#FF9800,stroke:#F57C00,color:#FFFFFF
    style D2 fill:#FFC107,stroke:#FFA000,color:#000000
    style D3 fill:#FFC107,stroke:#FFA000,color:#000000
    style D4 fill:#4CAF50,stroke:#2E7D32,color:#FFFFFF
    style DOM1 fill:#D32F2F,stroke:#B71C1C,color:#FFFFFF
    style DOM2 fill:#7B1FA2,stroke:#4A148C,color:#FFFFFF
    style DOM3 fill:#FF9800,stroke:#F57C00,color:#FFFFFF
    style DOM4 fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
```

---

## 📋 Detailed Classification

### HD03114 — Strategisk exportkontroll 2025

| Field | Value |
|-------|-------|
| **Type** | Proposition (Prop. 2025/26:114) |
| **Sensitivity** | 🟡 SENSITIVE |
| **Significance** | 7/10 |
| **Primary Domain** | Defense & Security |
| **Secondary Domains** | Foreign Policy, Trade & Industry |
| **Urgency** | 🟠 URGENT |
| **Confidence** | HIGH |

### HD10429 — Yttrandefrihet vs Prop 133

| Field | Value |
|-------|-------|
| **Type** | Interpellation (IP 2025/26:429) |
| **Sensitivity** | 🟡 SENSITIVE |
| **Significance** | 5/10 |
| **Primary Domain** | Constitutional Law |
| **Secondary Domain** | Criminal Justice |
| **Urgency** | 🟠 URGENT |
| **Confidence** | MEDIUM |

### HD11684 — Återvändande av syrier

| Field | Value |
|-------|-------|
| **Type** | Written Question (Fråga 2025/26:684) |
| **Sensitivity** | 🟡 SENSITIVE |
| **Significance** | 4/10 |
| **Primary Domain** | Migration & Integration |
| **Urgency** | 🔵 ELEVATED |
| **Confidence** | MEDIUM |

### HD11685 — Kubapolitik med USA

| Field | Value |
|-------|-------|
| **Type** | Written Question (Fråga 2025/26:685) |
| **Sensitivity** | 🟢 PUBLIC |
| **Significance** | 3/10 |
| **Primary Domain** | Foreign Policy |
| **Urgency** | ⚪ ROUTINE |
| **Confidence** | MEDIUM |

---

## 📋 Data Quality Notes

Classification confidence: MEDIUM. Document types identified from MCP metadata. Full-text analysis would refine sensitivity classifications and domain assignment.