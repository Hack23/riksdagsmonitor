# Political Threat Analysis — 2026-03-31

**Generated**: 2026-03-31 14:34 UTC
**Data Sources**: riksdag-regering-mcp (get_propositioner, get_betankanden, search_voteringar)
**Documents Analyzed**: 6
**Confidence**: HIGH

---

## Summary

Primary threats center on constitutional/legal challenges to the migration reform package and implementation capacity constraints across multiple simultaneous reforms. External security threats assessed in UU6 remain elevated but managed through NATO framework.

---

## Threat Landscape

```mermaid
graph TD
    subgraph "Legal/Constitutional Threats"
        LC1["ECHR Article 3<br/>Challenge to Prop 229<br/>🔴 HIGH"]
        LC2["Lagrådet Review<br/>Proportionality Concerns<br/>🟡 MEDIUM"]
    end
    subgraph "Implementation Threats"
        IM1["Agency Capacity<br/>Migrationsverket Overload<br/>🟡 MEDIUM"]
        IM2["Municipal Resistance<br/>Settlement Requirements<br/>🟡 MEDIUM"]
    end
    subgraph "Political Threats"
        PT1["Opposition Unity<br/>S+V+MP Migration Block<br/>🟢 LOW"]
        PT2["SD Supply Volatility<br/>Pre-Election Positioning<br/>🟢 LOW"]
    end
    subgraph "External Security"
        ES1["Russian Aggression<br/>Baltic Theatre<br/>🔴 HIGH"]
        ES2["Hybrid Threats<br/>Cyber/Disinformation<br/>🔴 HIGH"]
    end
    style LC1 fill:#dc3545,stroke:#333,color:#fff
    style LC2 fill:#ffc107,stroke:#333,color:#000
    style IM1 fill:#ffc107,stroke:#333,color:#000
    style IM2 fill:#ffc107,stroke:#333,color:#000
    style PT1 fill:#28a745,stroke:#333,color:#fff
    style PT2 fill:#28a745,stroke:#333,color:#fff
    style ES1 fill:#dc3545,stroke:#333,color:#fff
    style ES2 fill:#dc3545,stroke:#333,color:#fff
```

---

## Threat Register

| ID | Category | Threat | Likelihood | Impact | Score | dok_id |
|----|----------|--------|:----------:|:------:|:-----:|--------|
| LC1 | Legal | ECHR challenge to reception law benefit reductions | 3/5 | 5/5 | 15 | HD03229 |
| LC2 | Legal | Lagrådet flags proportionality issues | 3/5 | 4/5 | 12 | HD03229 |
| IM1 | Implementation | Migrationsverket capacity exhaustion | 4/5 | 3/5 | 12 | HD03229, HD03215 |
| IM2 | Implementation | Municipal non-compliance with settlement mandates | 3/5 | 3/5 | 9 | HD03215 |
| PT1 | Political | United opposition delays committee processing | 4/5 | 2/5 | 8 | HD03229 |
| PT2 | Political | SD leverages migration for election positioning | 2/5 | 3/5 | 6 | HD03229 |
| ES1 | External | Russian military escalation in Baltic | 2/5 | 5/5 | 10 | HD01UU6 |
| ES2 | External | Hybrid attack on critical infrastructure | 3/5 | 4/5 | 12 | HD01UU6 |

---

## Key Findings

1. Highest-probability threats are implementation-related (IM1, IM2) — government capacity to execute parallel reforms
2. Highest-impact threat is ECHR non-compliance (LC1) — could invalidate core migration reform
3. Political threats (PT1, PT2) manageable given coalition majority margins
4. External security threats (ES1, ES2) managed through NATO framework per UU6 consensus

## Data Quality Notes

Threat analysis derived from 6 primary documents and CIA coalition metrics. External security assessment based on UU6 committee report metadata (full text pending).
