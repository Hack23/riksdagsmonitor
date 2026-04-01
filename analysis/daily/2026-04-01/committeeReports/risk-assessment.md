# Political Risk Assessment — 2026-04-01

**Generated**: 2026-04-01 04:58 UTC
**Data Sources**: riksdag-regering-mcp get_betankanden, CIA coalition metrics
**Documents Analyzed**: 20 (latest betänkanden, riksmöte 2025/26)
**Confidence**: MEDIUM
**Riksmöte**: 2025/26

## Summary

Coalition demonstrates low political risk. Voting discipline is strong with 96% motion denial rate. Majority margin is adequate. High cross-party voting alignment percentages reflect government-SD cooperation rather than anomalies.

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TD
    style RISK fill:#00d9ff,stroke:#333,color:#000
    style LOW fill:#22c55e,stroke:#333,color:#000
    style MED fill:#ffbe0b,stroke:#333,color:#000
    RISK[Coalition Risk<br/>Score: 4/100] --> LOW[LOW Risk<br/>Stable Majority]
    RISK --> MED[Cross-Party Alignment<br/>KD-M: 89% | L-M: 88%]
    LOW --> D1[96% Motion<br/>Denial Rate]
    LOW --> D2[8 Committees<br/>Processing Smoothly]
    MED --> D3[EU Subsidiarity<br/>Challenge SoU37]
    MED --> D4[Climate Target<br/>Debate MJU30]
    style D1 fill:#22c55e,stroke:#333,color:#000
    style D2 fill:#22c55e,stroke:#333,color:#000
    style D3 fill:#ffbe0b,stroke:#333,color:#000
    style D4 fill:#ffbe0b,stroke:#333,color:#000
```

## Detailed Analysis

**Coalition Risk Score**: 4/100
**Risk Level**: LOW

### 5×5 Risk Matrix

| | Impact 1 (Minimal) | Impact 2 (Low) | Impact 3 (Moderate) | Impact 4 (High) | Impact 5 (Critical) |
|---|---|---|---|---|---|
| **Likelihood 5 (Very High)** | | | | | |
| **Likelihood 4 (High)** | | | | | |
| **Likelihood 3 (Moderate)** | | | EU subsidiarity (SoU37) | | |
| **Likelihood 2 (Low)** | | Climate adequacy (MJU30) | Property security gap (JuU29) | | |
| **Likelihood 1 (Very Low)** | | Minority languages (KU31) | | | |

### Coalition Alignment Indicators

| Party Pair | Alignment % | Assessment |
|-----------|------------|-----------|
| KD-M | 89% | Strong coalition core alignment |
| L-M | 88% | Solid right-bloc coordination |
| KD-L | 88% | Government parties voting together |
| C-L | 81% | Centre-right cooperation maintained |
| C-KD | 80% | Cross-bloc alignment on specific issues |

### Anomaly Assessment

The high cross-party voting percentages (80-89%) reflect structural coalition cooperation (M+KD+L with SD support), not genuine anomalies. This is expected behaviour for the Tidö Agreement government formation.

## Key Findings

1. Coalition stability at risk score **4** (LOW) — no imminent threat to government majority
2. Motion denial rate **96%** — opposition has minimal legislative influence at committee stage
3. Cross-party voting alignment is consistent with Tidö Agreement coalition dynamics
4. EU subsidiarity challenge (SoU37) is the highest-risk single item — Likelihood 3 × Impact 3

## Implications

- 20 committee reports processed without coalition-challenging divisions
- Security policy cluster (UU6 + JuU29) strengthens government's national security narrative
- Climate targets (MJU30) may face electoral scrutiny but don't threaten coalition stability
- No high-significance documents identified that could split the government majority

## Data Quality Notes

- Risk assessment derived from CIA coalition metrics (stability: 83/100, denial rate: 96%)
- Cross-party voting alignment from historical voting pattern analysis
- Individual report risk assessment limited by metadata-only analysis
- **MCP tools used**: riksdag-regering-mcp get_betankanden, CIA export metrics