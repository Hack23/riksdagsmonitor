# 🔗 Cross-Reference Map — Realtime Monitor 1018

## 📋 Context

| Field | Value |
|-------|-------|
| **Map ID** | `XRF-2026-04-03-RT1018` |
| **Date** | 2026-04-03 10:18 UTC |
| **Documents Mapped** | 6 |
| **Produced By** | news-realtime-monitor |

---

## 🔗 Document Relationship Diagram

```mermaid
graph TD
    subgraph "🔗 Cross-Reference Network — April 1-3, 2026"
        HD03214["HD03214<br/>Cybersecurity Center<br/>(Prop, Apr 1)"]
        HD03228["HD03228<br/>War Materials<br/>(Prop, Apr 1)"]
        HD03235["HD03235<br/>Deportation Rules<br/>(Prop, Apr 1)"]
        FoU12["HD01FöU12<br/>Civilian Protection<br/>(Bet, Apr 2)"]
        JuU15["HD01JuU15<br/>Prison System<br/>(Bet, Apr 2)"]
        AIR["8.7B Air Defense<br/>(Press, Apr 2)"]
    end

    HD03214 <-->|"Defense cluster"| HD03228
    HD03214 <-->|"Total defense"| FoU12
    HD03228 <-->|"Procurement link"| AIR
    FoU12 <-->|"Defense cluster"| AIR
    HD03235 <-->|"Criminal justice"| JuU15
    HD03235 -.->|"Policy tension:<br/>enforcement vs capacity"| JuU15

    style HD03214 fill:#dc3545,color:#fff
    style HD03228 fill:#dc3545,color:#fff
    style HD03235 fill:#fd7e14,color:#fff
    style FoU12 fill:#dc3545,color:#fff
    style JuU15 fill:#fd7e14,color:#fff
    style AIR fill:#dc3545,color:#fff
```

---

## 📊 Reference Matrix

| From → To | Relationship Type | Strength | Description |
|-----------|------------------|:--------:|-------------|
| HD03214 ↔ HD03228 | Thematic (Defense) | Strong | Both part of defense modernization package |
| HD03214 ↔ HD01FöU12 | Thematic (Total Defense) | Strong | Cybersecurity + civilian protection = totalförsvaret |
| HD03228 ↔ Air Defense | Operational | Strong | War materials regulation enables procurement like 8.7B deal |
| HD01FöU12 ↔ Air Defense | Strategic | Strong | Civilian + military protection aligned |
| HD03235 ↔ HD01JuU15 | Policy Tension | Strong | Stricter enforcement vs. insufficient capacity |
| HD03214 ↔ Air Defense | Budget Competition | Moderate | Both require defense budget allocation |

---

## 🏷️ Thematic Clusters

| Cluster | Documents | Coherence |
|---------|----------|:---------:|
| **Defense Modernization** | HD03214, HD03228, HD01FöU12, Air Defense | HIGH |
| **Criminal Justice** | HD03235, HD01JuU15 | HIGH |
| **Cross-Cluster** | HD03235 ↔ HD01JuU15 (tension) | MEDIUM |

**Document Control:** XRF-2026-04-03-RT1018 | news-realtime-monitor | 2026-04-03
