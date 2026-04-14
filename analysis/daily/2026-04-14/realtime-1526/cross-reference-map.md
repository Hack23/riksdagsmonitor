# Cross-Reference Map — 2026-04-14

**Generated**: 2026-04-14 15:28 UTC (AI-enriched)
**Documents Analyzed**: 17
**Confidence**: HIGH
**Produced By**: AI-driven analysis (realtime-1526)

## Document Relationship Map

```mermaid
graph TD
    subgraph "Energy Cluster"
        HD03240["HD03240<br/>Elsystemet<br/>⭐ Score: 7"]
        HD03239["HD03239<br/>Vindkraft<br/>Score: 5"]
        HD03238["HD03238<br/>Miljöprövning<br/>Score: 5"]
    end
    subgraph "Security Cluster"
        HD03237["HD03237<br/>Polisutbildning<br/>Score: 6"]
        HD03233["HD03233<br/>Bedrägerier<br/>Score: 4"]
        HD03245["HD03245<br/>Våldsstrategi<br/>Score: 6"]
    end
    subgraph "Committee Processing"
        HD01TU21["HD01TU21<br/>E-legitimation<br/>Score: 5"]
        HD01TU17["HD01TU17<br/>Bedrägerier TU<br/>Score: 4"]
        HD01SfU22["HD01SfU22<br/>Inhibition<br/>Score: 4"]
        HD01FiU48["HD01FiU48<br/>Extra budget<br/>Score: 4"]
    end
    HD03240 -->|"same department"| HD03239
    HD03239 -->|"permitting needed"| HD03238
    HD03240 -->|"permits required"| HD03238
    HD03233 -->|"committee processes"| HD01TU17
    HD03237 -->|"justice reforms"| HD03233
    HD03245 -->|"social security"| HD03237
    HD01TU21 -->|"digital anti-fraud"| HD01TU17
    style HD03240 fill:#ff6b6b,color:#fff
    style HD03237 fill:#ffd93d,color:#000
    style HD03245 fill:#ffd93d,color:#000
    style HD03239 fill:#6bcb77,color:#fff
    style HD03238 fill:#6bcb77,color:#fff
```

## Key Cross-References

| Source | Target | Relationship |
|--------|--------|-------------|
| HD03240 (Elsystemet) | HD03239 (Vindkraft) | Both from Klimat- och näringslivsdepartementet; electricity reform enables wind power expansion |
| HD03239 (Vindkraft) | HD03238 (Miljöprövning) | Wind power projects require environmental permits — new authority streamlines process |
| HD03233 (Bedrägerier prop) | HD01TU17 (Bedrägerier bet) | Committee report (TU17) processes the proposition (233) |
| HD03237 (Polisutbildning) | HD03245 (Våldsstrategi) | Both address public safety — police capacity enables violence prevention |
| HD01TU21 (E-legitimation) | HD01TU17 (Bedrägerier) | State e-ID can counter digital fraud; both in TU committee |
| HD03236 (Extra budget) | HD01FiU48 (Extra budget bet) | Committee processing the extra budget proposition |

## Cluster Analysis

1. **Energy Transformation Cluster** (3 documents): HD03240 + HD03239 + HD03238 — coherent energy transition package
2. **Public Safety Cluster** (3 documents): HD03237 + HD03233 + HD03245 — multi-vector security approach
3. **Committee Processing Cluster** (4 documents): HD01TU21 + HD01TU17 + HD01SfU22 + HD01FiU48 — items advancing to Riksdag decisions
