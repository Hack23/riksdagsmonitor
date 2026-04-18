# Cross-Reference Map — 2026-04-08

**Generated**: 2026-04-08 10:27 UTC | **Workflow**: news-realtime-monitor (run 1027)
**Produced By**: news-realtime-monitor AI agent

---

## Document Relationship Graph

```mermaid
graph TB
    subgraph "Cluster A: SD Defence"
        HD11689["HD11689<br/>Env Permits"] 
        HD11690["HD11690<br/>Private Actors"]
        HD11692["HD11692<br/>Preparedness Police"]
    end
    
    subgraph "Cluster B: Healthcare"
        HD11687["HD11687<br/>Quality Registries"]
        HD03219["HD03219<br/>Dental Care Audit"]
    end
    
    subgraph "Cluster C: Transparency"
        HD11693["HD11693<br/>Lobby Register"]
        HD11694["HD11694<br/>Trust Positions"]
    end
    
    HD11689 <-->|"Same author (Söder), same recipient (Jonson)"| HD11692
    HD11689 <-->|"Same recipient (Jonson), same day"| HD11690
    HD11690 <-->|"Defence cluster"| HD11692
    
    HD11687 -.->|"Healthcare governance"| HD03219
    HD11693 -.->|"Democratic accountability"| HD11694
    
    HD11689 -.->|"Environmental regulation intersection"| HD03230["HD03230<br/>Species Protection"]
    
    style HD11689 fill:#D32F2F,stroke:#424242,color:#FFFFFF
    style HD11690 fill:#D32F2F,stroke:#424242,color:#FFFFFF
    style HD11692 fill:#D32F2F,stroke:#424242,color:#FFFFFF
    style HD11687 fill:#FFC107,stroke:#424242,color:#000000
    style HD03219 fill:#FFC107,stroke:#424242,color:#000000
    style HD11693 fill:#0097A7,stroke:#424242,color:#FFFFFF
    style HD11694 fill:#0097A7,stroke:#424242,color:#FFFFFF
    style HD03230 fill:#4CAF50,stroke:#424242,color:#FFFFFF
```

## Cross-Reference Table

| Source dok_id | Target dok_id | Relationship Type | Strength |
|---------------|---------------|------------------|:--------:|
| HD11689 | HD11690 | Same recipient, same day, defence cluster | STRONG |
| HD11689 | HD11692 | Same author + recipient, same day, defence cluster | STRONG |
| HD11690 | HD11692 | Same recipient, same day, defence cluster | STRONG |
| HD11687 | HD03219 | Healthcare policy domain, governance scrutiny | MEDIUM |
| HD11693 | HD11694 | Same author, democratic accountability theme | MEDIUM |
| HD11689 | HD03230 | Environmental regulation intersection | WEAK |
| HD11687 | HD12669 | S question → government answer on dental care | MEDIUM |

## External Context References

| Document | External Reference | Type |
|----------|-------------------|------|
| HD11689, HD11690, HD11692 | FöU11/FöU12 committee debates | Upcoming (April 14) |
| HD03219 | Riksrevisionen audit report | Source document |
| HD024070 | Skr 2025/26:226 (government response) | Parent document |
| HD11693 | Lagrådsremiss "Ökad insyn i politiska processer" | Legislative context |
| All documents | Spring Budget 2026 (April 7 presentation) | Fiscal context |
| HD11689, HD11690 | NATO FM meeting May 21-22 | Geopolitical context |
