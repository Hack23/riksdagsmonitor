# 🔗 Cross-Document Reference Map — 2026-03-27

## 📋 Context

| Field | Value |
|-------|-------|
| **Map ID** | `XRF-2026-03-27-001` |
| **Analysis Date** | `2026-03-30 07:30 UTC` |
| **Documents Mapped** | 3 |
| **Produced By** | `news-interpellations` workflow |

---

## 📊 Cross-Reference Network

```mermaid
graph TD
    subgraph "Cross-Reference Map — 2026-03-27"
        HD10422["HD10422<br/>Labour Market<br/>& Integration"]
        HD10421["HD10421<br/>Integration<br/>Finance"]
        HD10420["HD10420<br/>Police<br/>Discrimination"]
        HD10422 <-->|"Same author, same theme"| HD10421
        HD10422 ---|"Integration context"| HD10420
        HD10421 ---|"Integration context"| HD10420
    end
    style HD10422 fill:#2196F3,color:#FFFFFF,stroke:#1565C0
    style HD10421 fill:#2196F3,color:#FFFFFF,stroke:#1565C0
    style HD10420 fill:#D32F2F,color:#FFFFFF,stroke:#D32F2F
```

## Reference Table

| Source | Target | Relationship | Evidence | Confidence |
|--------|--------|-------------|----------|:----------:|
| HD10422 | HD10421 | Thematic overlap — integration policy | Same author (Redar), same day, overlapping text about 500K unemployed | `H` |
| HD10422 | HD10420 | Broader integration context | Both address integration failures from different angles (employment vs. rights) | `M` |
| HD10421 | HD10420 | Fiscal-rights nexus | Economic exclusion (HD10421) and institutional discrimination (HD10420) are linked | `M` |

## Key Findings

1. HD10422 and HD10421 share substantial text overlap — coordinated messaging strategy.
2. All three form a thematic cluster: integration failure manifests as unemployment (HD10422, HD10421) and institutional discrimination (HD10420).

## Data Quality Notes

Cross-reference confidence: **HIGH**. Full-text analysis confirmed textual overlap.
