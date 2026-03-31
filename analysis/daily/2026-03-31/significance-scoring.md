# 📈 Significance Scoring Results

## 📋 Scoring Context

| Field | Value |
|-------|-------|
| **Scoring ID** | `SIG-2026-03-31-001` |
| **Analysis Date** | 2026-03-31 12:04 UTC |
| **Documents Scored** | 6 |
| **Produced By** | news-realtime-monitor |

---

## 📊 Significance Distribution

```mermaid
graph LR
    subgraph "📈 Significance Scoring — 2026-03-31"
        subgraph "≥8 Breaking News"
            D1["HD03229: 8/10<br/>New Reception Law"]
        end
        subgraph "6-7 Major Analysis"
            D2["HD03215: 7/10<br/>Settlement Law"]
            D3["HD01JuU29: 6/10<br/>Security Protection"]
            D4["HD03222: 6/10<br/>Crime Victims"]
        end
        subgraph "4-5 Standard"
            D5["HD01MJU30: 5/10<br/>Climate Goals"]
            D6["HD03223: 5/10<br/>Consumer Credit"]
        end
    end

    style D1 fill:#dc3545,stroke:#333,color:#fff
    style D2 fill:#fd7e14,stroke:#333,color:#000
    style D3 fill:#ffc107,stroke:#333,color:#000
    style D4 fill:#ffc107,stroke:#333,color:#000
    style D5 fill:#28a745,stroke:#333,color:#fff
    style D6 fill:#28a745,stroke:#333,color:#fff
```

## 📋 Scoring Details

| dok_id | Title | Raw Score | Tier | Factors |
|--------|-------|:---------:|:----:|---------|
| HD03229 | En ny mottagandelag | 8/10 | BREAKING | +2 migration policy, +2 budget impact, +2 3+ parties affected, +1 minister named, +1 dual-proposition coordination |
| HD03215 | Tidsbegränsat boende bosättningslag | 7/10 | MAJOR | +2 migration policy, +2 housing impact, +1 minister named, +2 municipal autonomy |
| HD01JuU29 | Stärkt säkerhetsskydd fastigheter | 6/10 | MAJOR | +2 defense/security, +2 national security, +2 cross-party |
| HD03222 | Ersättningsregler brottsoffret | 6/10 | MAJOR | +2 criminal justice, +2 welfare reform, +1 minister named |
| HD01MJU30 | Sveriges klimatmål 2030 | 5/10 | STANDARD | +2 climate policy, +2 3+ parties involved, +1 EU dimension |
| HD03223 | En ny konsumentkreditlag | 5/10 | STANDARD | +2 consumer protection, +2 budget impact, +1 EU alignment |

---

## 📊 MCP Data Files Used

| Tool | Parameters | Data Retrieved |
|------|-----------|----------------|
| `get_propositioner` | rm=2025/26 | Document metadata for scoring |
| `get_betankanden` | rm=2025/26 | Committee context for scoring |
