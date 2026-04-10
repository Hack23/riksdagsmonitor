# Cross-Reference Map - 2026-04-10

## Cross-Reference Context

| Field | Value |
|-------|-------|
| **Map ID** | XRF-2026-04-10-1026 |
| **Analysis Date** | 2026-04-10 10:26 UTC |
| **Documents Mapped** | 6 |
| **Produced By** | news-realtime-monitor (realtime-1026) |

---

## Document Relationship Diagram

```mermaid
graph TD
    subgraph SD Foreign Policy Cluster - Wiechel
        HD11696[HD11696 CIS Question]
        HD11698[HD11698 PAO-stod]
        HD11701[HD11701 Taiwan WHA]
    end

    subgraph S Domestic Scrutiny
        HD11697[HD11697 Gotland Freight]
        HD11700[HD11700 AF Accessibility]
    end

    subgraph C Climate Pressure
        HD11699[HD11699 Styrmedelsutredningen]
    end

    HD11696 -.->|same author same day| HD11698
    HD11696 -.->|same author same day| HD11701
    HD11698 -.->|same author same day| HD11701
    HD11697 -.->|same party S| HD11700

    style HD11696 fill:#0d6efd,color:#fff
    style HD11698 fill:#0d6efd,color:#fff
    style HD11701 fill:#ffc107,color:#000
    style HD11697 fill:#dc3545,color:#fff
    style HD11700 fill:#dc3545,color:#fff
    style HD11699 fill:#28a745,color:#fff
```

## Identified Clusters

### Cluster 1: SD Foreign Policy (Wiechel)
- **Documents:** HD11696, HD11698, HD11701
- **Author:** Markus Wiechel (SD)
- **Addressees:** Stenergard (M), Dousa (M)
- **Theme:** Coordinated foreign policy scrutiny covering CIS/Russia, Taiwan/WHA, PAO democracy aid
- **Pattern:** Single MP filing 3 foreign policy questions in one day signals systematic committee-level research

### Cluster 2: S Domestic Service Delivery
- **Documents:** HD11697, HD11700
- **Authors:** Westeren (S), Svensson (S)
- **Addressees:** Kullgren (KD), Britz (L)
- **Theme:** Government domestic service delivery gaps (rural freight, employment agency accessibility)
- **Pattern:** S building pre-election narrative on everyday citizen concerns

### Cluster 3: C Climate Policy
- **Documents:** HD11699
- **Author:** Nordin (C)
- **Addressee:** Britz (L)
- **Theme:** Climate policy instrument investigation delay
- **Pattern:** C positioning as credible environmental alternative to coalition

---

## Cross-Day References

| Today's Document | Related Historical | Relationship |
|-----------------|-------------------|-------------|
| HD11701 (Taiwan WHA) | HD03220 (NATO eFP Finland, 2026-04-09) | Same-week foreign policy/security context |
| HD11699 (Styrmedelsutredningen) | HD12682 (Miljomalseredningen, 2026-04-10) | Nordin (C) climate governance questions |

---

## MCP Data Files Used

| # | Data Source | File / Tool Path | Retrieved |
|:-:|-----------|-----------------|-----------|
| 1 | riksdag-regering-mcp | search_dokument(from_date=2026-04-09) | 2026-04-10 10:27 UTC |
