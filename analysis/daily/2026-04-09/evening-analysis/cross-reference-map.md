# 🔗 Cross-Reference Map — 2026-04-09

**XRF-ID:** XRF-2026-04-09-EVE | **Date:** 2026-04-09 | **Riksmöte:** 2025/26

---

## 🕸️ Document Cross-Reference Network

```mermaid
graph LR
    subgraph "Government Propositions"
        P220["HD03220<br/>NATO Finland"]
        P218["HD03218<br/>Double Penalties"]
        P217["HD03217<br/>Civil Servant"]
    end
    subgraph "Committee Reports"
        UU6["HD01UU6<br/>Security Policy"]
        SfU16["HD01SfU16<br/>Migration"]
        TU15["HD01TU15<br/>Transport"]
        FöU8["HD01FöU8<br/>Defense Personnel"]
        UbU31["HD01UbU31<br/>Research Ethics"]
        CU23["HD01CU23<br/>Rural Employment"]
    end
    subgraph "Opposition Motions"
        M73["HD024073<br/>V Youth Crime"]
        M74["HD024074<br/>MP Youth Crime"]
    end
    P220 -.->|"NATO context"| UU6
    P220 -.->|"Personnel needs"| FöU8
    P218 -.->|"Youth dimension"| M73
    P218 -.->|"Youth dimension"| M74
    M73 -.->|"Same bill target"| M74
    SfU16 -.->|"Integration link"| P218
    style P220 fill:#dc3545,color:#fff
    style P218 fill:#fd7e14,color:#fff
    style P217 fill:#fd7e14,color:#fff
    style UU6 fill:#0d6efd,color:#fff
    style SfU16 fill:#0d6efd,color:#fff
    style TU15 fill:#6c757d,color:#fff
    style FöU8 fill:#6c757d,color:#fff
    style UbU31 fill:#6c757d,color:#fff
    style CU23 fill:#6c757d,color:#fff
    style M73 fill:#ffc107,color:#000
    style M74 fill:#ffc107,color:#000
```

## 📊 Reference Links

| Source | Target | Relationship | Strength |
|--------|--------|-------------|----------|
| HD03220 (NATO) | HD01UU6 (Security Policy) | NATO forward presence complements security policy committee review | Strong |
| HD03220 (NATO) | HD01FöU8 (Defense Personnel) | Deployment requires defense personnel framework | Medium |
| HD03218 (Double Penalties) | HD024073 (V motion) | V motion opposes underlying youth crime bill related to double penalties | Strong |
| HD03218 (Double Penalties) | HD024074 (MP motion) | MP motion also opposes same underlying bill | Strong |
| HD024073 (V motion) | HD024074 (MP motion) | Both target Prop 2025/26:227 but filed separately — uncoordinated | Strong |
| HD01SfU16 (Migration) | HD03218 (Double Penalties) | Migration policy intersects with criminal network targeting | Weak |
