# 🔴 Political Threat Analysis

## 📋 Threat Context

| Field | Value |
|-------|-------|
| **Threat ID** | `THR-2026-03-31-001` |
| **Analysis Date** | 2026-03-31 11:58 UTC |
| **Scope** | Government legislative push — democratic function assessment |
| **Produced By** | news-realtime-monitor |
| **Overall Threat Level** | MODERATE |

---

## 📊 Threat Landscape

```mermaid
graph TD
    subgraph "🔴 Threat Categories — 2026-03-31"
        T1["societal-impact<br/>Migration policy polarization<br/>Level: MODERATE"]
        T2["regulatory-overreach<br/>Multiple laws rushed<br/>Level: LOW"]
        T3["institutional-erosion<br/>Municipal autonomy<br/>Level: MODERATE"]
        T4["democratic-deficit<br/>Climate ambition lowered<br/>Level: LOW"]
    end

    style T1 fill:#ffc107,stroke:#333,color:#000
    style T2 fill:#28a745,stroke:#333,color:#fff
    style T3 fill:#ffc107,stroke:#333,color:#000
    style T4 fill:#28a745,stroke:#333,color:#fff
```

## 📋 Threat Register

| Threat ID | Category | Democratic Function | Description | Level | Evidence |
|-----------|----------|-------------------|-------------|:-----:|----------|
| THR-001 | societal-impact | Power Balance | Migration reform may disproportionately affect vulnerable populations | MODERATE | HD03229, HD03215 |
| THR-002 | regulatory-overreach | Legislative Integrity | 4 propositions in one week from single department strains review capacity | LOW | HD03222, HD03223, HD03229 |
| THR-003 | institutional-erosion | Accountability | Forced municipal placement overrides local democratic decision-making | MODERATE | HD03215 |
| THR-004 | democratic-deficit | Democratic Process | Climate target revision reduces environmental commitment without referendum | LOW | HD01MJU30 |

---

## 📊 MCP Data Files Used

| Tool | Parameters | Data Retrieved |
|------|-----------|----------------|
| `get_propositioner` | rm=2025/26 | Threat source propositions |
| `get_betankanden` | rm=2025/26 | Committee context |
