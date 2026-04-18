# Document Classification Results — 2026-04-08

| **Field** | **Value** |
|-----------|-----------|
| **Analysis ID** | CLASS-2026-04-08-001 |
| **Analysis Date** | 2026-04-08 06:04 UTC |
| **Documents Analyzed** | 1 |
| **Produced By** | news-propositions workflow (AI-enriched) |
| **Overall Confidence** | MEDIUM |

---

## Classification Summary

| dok_id | Type | Sensitivity | Domain | Urgency | Priority |
|--------|------|-------------|--------|---------|----------|
| HD03114 | Skrivelse (Skr.) | 🟢 PUBLIC | Defence & Security Policy | ROUTINE | MEDIUM |

## Detailed Classification

### HD03114 — Strategisk exportkontroll 2025

- **Document type**: Skrivelse (government communication) — Skr. 2025/26:114
- **Sensitivity**: PUBLIC — annual transparency report, no classified content in report itself
- **Primary domain**: Defence and security policy
- **Secondary domains**: Foreign trade policy, international law compliance, dual-use technology
- **Urgency**: ROUTINE — annual reporting cycle
- **Priority**: MEDIUM — elevated by post-NATO context
- **Committee assignment**: UU (Utrikesutskottet / Foreign Affairs Committee)
- **Policy impact**: Defence export framework, NATO interoperability, dual-use controls

## Classification Distribution

```mermaid
pie title Document Sensitivity Distribution
    "PUBLIC" : 1
```

```mermaid
flowchart TD
    classDef defence fill:#D32F2F,stroke:#D32F2F,color:#FFFFFF
    classDef trade fill:#FF9800,stroke:#FF9800,color:#FFFFFF
    classDef routine fill:#2196F3,stroke:#1565C0,color:#FFFFFF

    HD03114["HD03114<br/>Strategisk exportkontroll 2025<br/>Skr. 2025/26:114"]:::defence
    UU["UU — Utrikesutskottet"]:::trade
    HD03114 --> UU
    UU --> DOMAIN_DEF["Defence & Security Policy"]:::defence
    UU --> DOMAIN_TRADE["Foreign Trade Policy"]:::trade
    UU --> DOMAIN_INTL["International Law Compliance"]:::routine
```

## Data Quality Notes

Classification based on document metadata, committee assignment, and policy domain analysis. Confidence: MEDIUM [MEDIUM]. Single document limits statistical analysis; classification confidence elevated by NATO context and committee-level verification.
