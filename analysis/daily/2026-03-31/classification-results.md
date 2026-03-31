# 🏷️ Political Classification Results

## 📋 Classification Context

| Field | Value |
|-------|-------|
| **Classification ID** | `CLS-2026-03-31-001` |
| **Analysis Date** | 2026-03-31 12:00 UTC |
| **Documents Classified** | 6 |
| **Produced By** | news-realtime-monitor |

---

## 📊 Classification Dashboard

```mermaid
graph TD
    subgraph "🏷️ Document Classification — 2026-03-31"
        subgraph "🔴 HIGH Significance"
            D1["HD03229<br/>New Reception Law<br/>Score: 8/10"]
            D2["HD03215<br/>Settlement Law<br/>Score: 7/10"]
        end
        subgraph "🟡 MEDIUM Significance"
            D3["HD01JuU29<br/>Security Protection<br/>Score: 6/10"]
            D4["HD03222<br/>Crime Victim Comp.<br/>Score: 6/10"]
            D5["HD01MJU30<br/>Climate Goals<br/>Score: 5/10"]
            D6["HD03223<br/>Consumer Credit<br/>Score: 5/10"]
        end
    end

    style D1 fill:#dc3545,stroke:#333,color:#fff
    style D2 fill:#dc3545,stroke:#333,color:#fff
    style D3 fill:#ffc107,stroke:#333,color:#000
    style D4 fill:#ffc107,stroke:#333,color:#000
    style D5 fill:#ffc107,stroke:#333,color:#000
    style D6 fill:#ffc107,stroke:#333,color:#000
```

## 📋 Batch Classification Table

| dok_id | Title | Type | Domain | Sensitivity | Significance | Score |
|--------|-------|------|--------|:-----------:|:------------:|:-----:|
| HD03229 | En ny mottagandelag | prop | Migration | SENSITIVE | HIGH | 8/10 |
| HD03215 | Tidsbegränsat boende — bosättningslag | prop | Migration/Housing | SENSITIVE | HIGH | 7/10 |
| HD01JuU29 | Stärkt säkerhetsskydd fastigheter | bet | Security/Defense | RESTRICTED | MEDIUM | 6/10 |
| HD03222 | Ersättningsregler brottsoffret i fokus | prop | Criminal Justice | PUBLIC | MEDIUM | 6/10 |
| HD01MJU30 | Sveriges klimatmål 2030 | bet | Environment | SENSITIVE | MEDIUM | 5/10 |
| HD03223 | En ny konsumentkreditlag | prop | Consumer Protection | PUBLIC | MEDIUM | 5/10 |

---

## 📊 MCP Data Files Used

| Tool | Parameters | Data Retrieved |
|------|-----------|----------------|
| `get_propositioner` | rm=2025/26 | Proposition classification data |
| `get_betankanden` | rm=2025/26 | Committee report classification data |
