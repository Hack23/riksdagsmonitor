# 👥 Stakeholder Impact Analysis

## 📋 Stakeholder Context

| Field | Value |
|-------|-------|
| **Analysis ID** | `STK-2026-03-31-001` |
| **Analysis Date** | 2026-03-31 12:02 UTC |
| **Documents Assessed** | 6 |
| **Stakeholder Groups** | 8 |
| **Produced By** | news-realtime-monitor |

---

## 📊 Stakeholder Impact Matrix

```mermaid
graph TD
    subgraph "👥 Stakeholder Impact — 2026-03-31"
        subgraph "HIGH Impact"
            S1["Citizens<br/>Migration + Housing + Crime"]
            S2["Government<br/>Legislative delivery"]
            S3["Municipalities<br/>Settlement obligations"]
        end
        subgraph "MEDIUM Impact"
            S4["Opposition<br/>Campaign material"]
            S5["Business<br/>Consumer credit rules"]
            S6["International<br/>ECHR + Climate reputation"]
        end
        subgraph "LOW Impact"
            S7["Judiciary<br/>New procedures"]
            S8["Media<br/>Reporting opportunities"]
        end
    end

    style S1 fill:#dc3545,stroke:#333,color:#fff
    style S2 fill:#dc3545,stroke:#333,color:#fff
    style S3 fill:#dc3545,stroke:#333,color:#fff
    style S4 fill:#ffc107,stroke:#333,color:#000
    style S5 fill:#ffc107,stroke:#333,color:#000
    style S6 fill:#ffc107,stroke:#333,color:#000
    style S7 fill:#28a745,stroke:#333,color:#fff
    style S8 fill:#28a745,stroke:#333,color:#fff
```

## 📋 Detailed Impact Assessment

| Stakeholder Group | Impact Level | Key Concerns | Primary Documents |
|-------------------|:------------:|--------------|-------------------|
| **Citizens** | HIGH | Migration reception changes, housing allocation, crime victim rights | HD03229, HD03215, HD03222 |
| **Government (M, KD, L)** | HIGH | Legislative delivery before election, Tidö Agreement fulfillment | HD03229, HD03215, HD03222, HD03223 |
| **Opposition (S, V, MP, C)** | MEDIUM | Humanitarian criticism, climate goals, election positioning | HD03229, HD01MJU30 |
| **Business/Industry** | MEDIUM | Consumer credit regulation, property security compliance | HD03223, HD01JuU29 |
| **Civil Society** | MEDIUM | Rights challenges to migration law, climate advocacy | HD03229, HD01MJU30 |
| **International** | MEDIUM | ECHR compatibility, climate reputation, NATO alignment | HD03229, HD01MJU30, HD01JuU29 |
| **Judiciary** | LOW | New compensation procedures, security assessment processes | HD03222, HD01JuU29 |
| **Media** | LOW | Major news cycle — multiple significant legislative stories | All documents |

---

## 📊 MCP Data Files Used

| Tool | Parameters | Data Retrieved |
|------|-----------|----------------|
| `get_propositioner` | rm=2025/26 | Stakeholder-relevant propositions |
| `get_betankanden` | rm=2025/26 | Committee perspective data |
| `search_regering` | dateFrom=2026-03-30 | Government stakeholder positions |
