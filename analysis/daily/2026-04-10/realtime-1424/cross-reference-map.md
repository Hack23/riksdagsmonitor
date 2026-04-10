# 🔗 Cross-Reference Map — 2026-04-10 Realtime-1424

## Document Relationships

```mermaid
graph TD
    subgraph "SfU Migration Cluster"
        SFU31["HD01SfU31<br/>Detention Framework"]
        SFU32["HD01SfU32<br/>Deportation Enforcement"]
        SFU36["HD01SfU36<br/>Character Requirements"]
    end
    subgraph "Opposition Activity"
        M4075["HD024075<br/>S Motion: Matkrav"]
    end
    subgraph "Climate Questions"
        Q11702["HD11702<br/>Styrmedelsutredning (MP)"]
        Q11699["HD11699<br/>Styrmedelsutredning betänkande"]
    end
    SFU31 <--> SFU32
    SFU31 <--> SFU36
    SFU32 <--> SFU36
    Q11702 <--> Q11699
    style SFU31 fill:#ffc107,color:#000
    style SFU32 fill:#ffc107,color:#000
    style SFU36 fill:#ffc107,color:#000
    style M4075 fill:#28a745,color:#fff
    style Q11702 fill:#0d6efd,color:#fff
    style Q11699 fill:#0d6efd,color:#fff
```

## Relationship Table

| Source | Target | Relationship | Strength |
|--------|--------|-------------|:--------:|
| HD01SfU31 | HD01SfU32 | Companion — same committee, complementary enforcement | Strong |
| HD01SfU31 | HD01SfU36 | Companion — same committee, complementary requirements | Strong |
| HD01SfU32 | HD01SfU36 | Companion — same committee, complementary enforcement | Strong |
| HD11702 | HD11699 | Same-topic — both address climate policy instrument investigation | Strong |
| HD024075 | HD01SfU31-36 | Same-day — different policy areas, no topical connection | Weak |

## Pattern Summary

Two document clusters identified:
1. **SfU Migration Cluster** (3 documents): Coordinated committee reporting on migration enforcement
2. **Climate Questions** (2 documents): MP questioning government on climate policy delay
