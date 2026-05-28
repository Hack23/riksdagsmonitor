---
artifact_family: B
artifact_type: cross-reference-map
article_date: 2026-05-27
subfolder: election-cycle/next
classification: PUBLIC
workflow: news-election-cycle
horizon: election-cycle
cycle_anchor: next
---

# Cross-Reference Map — Next Mandate Document Dependencies

## Forward-Looking Document Network

```mermaid
graph TD
    A[HD03271 Abortion Bill] -->|shapes campaign frame| B[Scenario A vs B divergence]
    C[HD03262 Permanent Residency] -->|implementation fate| B
    D[L threshold 3.5%] -->|A1 vs A2 determines| B
    E[C kingmaker position] -->|B vs C determines| F[Government formation]
    B --> F
    F --> G[Policy agenda 2026-2030]
    H[EU CEAS 2027 deadline] -->|constrains all scenarios| G
    I[IMF WEO Apr-2026 GDP 1.8%] -->|budget baseline| G
    J[Defence 3.5% GDP commitment] -->|bipartisan lock| G
    K[C housing agenda] --> E
```

## Scenario Cross-Reference Matrix

| Document | A1 | A2 | B | C |
|----------|----|----|---|---|
| HD03271 (abortion) | Shelved/watered | Passed | Withdrawn | Shelved |
| HD03262 (perm residency) | Full implement | Full + expand | Reversed | EU-aligned |
| HD03265 (detention) | Implement | Expand | Partial reverse | EU-aligned |
| 3.5% defence | Maintained | Maintained | Maintained | Maintained |
| EU CEAS | Contested | Contested | Aligned | Aligned |
| Climate targets | Under-deliver | Under-deliver | Accelerate | Moderate |

## Key Sibling Citations (cross-anchor)
- **current/coalition-mathematics.md**: Establishes baseline seat calculations that next/ scenarios inherit
- **current/election-2026-analysis.md**: L/MP threshold analysis directly drives A1/A2/B probability assessment
- **current/scenario-analysis.md**: Pass-through probability weights for next/ scenarios
- **current/forward-indicators.md**: FI-A1/B1/G1/D1 indicators are forward-looking into next/ mandate territory
