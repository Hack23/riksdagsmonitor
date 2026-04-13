# 🔗 Cross-Reference Map — 2026-04-13 Realtime Monitor

**Generated**: 2026-04-13 14:33 UTC | **Documents**: 9

```mermaid
graph TD
    subgraph "Cross-Reference Network"
        VP["HD03100<br/>Vårpropositionen"]
        VÄB["HD0399<br/>Vårändringsbudget"]
        EXTRA["HD03236<br/>Extra budget"]
        ÅR["HD03101<br/>Årsredovisning"]
        RR["HD03241<br/>Riksrevisionen"]
        SK["HD0398<br/>Skatteutgifter"]
        NATO["HD01UFöU3<br/>NATO Finland"]
        FIU["HD01FiU48<br/>FiU committee"]
        VMOT["HD024076<br/>V Motion"]
        VP --> VÄB
        VP --> EXTRA
        VP --> ÅR
        VP --> RR
        VP --> SK
        EXTRA --> FIU
        NATO -.-> VP
        VMOT -.-> |"prop 2025/26:229"| SFU["Earlier SfU reports"]
    end
    style VP fill:#dc3545,stroke:#333,color:#fff
    style VÄB fill:#fd7e14,stroke:#333,color:#fff
    style EXTRA fill:#fd7e14,stroke:#333,color:#fff
    style ÅR fill:#17a2b8,stroke:#333,color:#fff
    style RR fill:#17a2b8,stroke:#333,color:#fff
    style SK fill:#6c757d,stroke:#333,color:#fff
    style NATO fill:#ffc107,stroke:#333,color:#000
    style FIU fill:#6c757d,stroke:#333,color:#fff
    style VMOT fill:#ffc107,stroke:#333,color:#000
    style SFU fill:#6c757d,stroke:#333,color:#fff
```

## Key Relationships

| Source | Target | Relationship |
|--------|--------|-------------|
| HD03100 → HD0399 | VP sets fiscal framework → VÄB implements specific changes |
| HD03100 → HD03236 | VP provides context → Extra budget addresses energy emergency |
| HD03100 → HD03101 | VP builds on → Actual 2025 state accounts |
| HD03100 → HD03241 | VP responds to → Riksrevisionens fiscal framework audit |
| HD03100 → HD0398 | VP references → Tax expenditure accounting |
| HD03236 → HD01FiU48 | Extra budget proposition → Committee report processing |
| HD01UFöU3 → HD03100 | NATO commitment → Defence spending in fiscal framework |
| HD024076 → prop. 2025/26:229 | V motion opposes → Government reception law proposition |
| HD024076 → HD01SfU31/32/36 | V motion relates to → Earlier migration committee reports (today's earlier run) |
