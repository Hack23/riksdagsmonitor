# ⚠️ Risk Assessment — Evening Analysis (Second Pass)

| Field | Value |
|-------|-------|
| **ID** | RSK-EVE-2026-04-13-002 |
| **Date** | 2026-04-13 18:30 UTC |
| **Riksmöte** | 2025/26 |
| **Overall Risk Level** | ELEVATED |
| **Confidence** | HIGH |
| **Methodology** | political-risk-methodology.md (5×5 L×I matrix) |

---

## 📊 Risk Heat Map

```mermaid
graph TD
    subgraph "🔥 Political Risk Heat Map — 2026-04-13 Evening"
        direction TB
        subgraph CRIT["🔴 CRITICAL (L×I ≥ 16)"]
            RSK1["RSK-001: Climate-Fiscal Contradiction<br/>L:4 × I:4 = 16<br/>HD03236 fuel cut vs MJU30 milestones"]
        end
        subgraph HIGH["🟠 HIGH (L×I 10-15)"]
            RSK2["RSK-002: Defence Readiness Gap<br/>L:3 × I:4 = 12<br/>FöU8 rejects 98 motions, NATO gap"]
            RSK3["RSK-003: Healthcare Policy Vacuum<br/>L:4 × I:3 = 12<br/>SoU16+SoU17 reject 348 motions"]
        end
        subgraph MED["🟡 MEDIUM (L×I 6-9)"]
            RSK4["RSK-004: Coalition Strain<br/>L:3 × I:3 = 9<br/>SD interpellations HD10429+HD10430"]
            RSK5["RSK-005: Democratic Deficit Narrative<br/>L:3 × I:3 = 9<br/>404 motions rejected in one day"]
            RSK6["RSK-006: EU Climate Infringement<br/>L:2 × I:4 = 8<br/>MJU30 target realignment"]
        end
        subgraph LOW["🟢 LOW (L×I ≤ 5)"]
            RSK7["RSK-007: Energy Price Volatility<br/>L:2 × I:2 = 4<br/>NU17 debate, short-term"]
        end
    end
    style RSK1 fill:#dc3545,stroke:#333,color:#fff
    style RSK2 fill:#fd7e14,stroke:#333,color:#fff
    style RSK3 fill:#fd7e14,stroke:#333,color:#fff
    style RSK4 fill:#ffc107,stroke:#333,color:#000
    style RSK5 fill:#ffc107,stroke:#333,color:#000
    style RSK6 fill:#ffc107,stroke:#333,color:#000
    style RSK7 fill:#28a745,stroke:#333,color:#fff
```

## 📋 Detailed Risk Register

| Risk ID | Risk | Likelihood (1-5) | Impact (1-5) | L×I Score | Category | Evidence |
|---------|------|:-----------------:|:------------:|:---------:|----------|----------|
| RSK-001 | Climate-fiscal contradiction: fuel tax cut (HD03236) vs climate milestones (MJU30) | 4 | 4 | **16** | Policy | HD03236 explicit tax reduction vs MJU30 target framework |
| RSK-002 | Defence readiness gap: NATO force structure unfilled after FöU8 rejects 98 motions | 3 | 4 | **12** | Security | FöU8 committee report, documented personnel shortfall |
| RSK-003 | Healthcare policy vacuum: 348 motions rejected without replacement policy | 4 | 3 | **12** | Electoral | SoU16 (187 motions) + SoU17 (161 motions) rejected |
| RSK-004 | Coalition strain: SD interpellations targeting M and KD ministers | 3 | 3 | **9** | Coalition | HD10429 (Strömmer/M), HD10430 (Forssmed/KD), due Apr 24-27 |
| RSK-005 | Democratic deficit narrative: opposition frames mass rejection as rubber stamp | 3 | 3 | **9** | Democratic | 404 motions across 20 committee reports in one day |
| RSK-006 | EU climate infringement: MJU30 reframes targets below EU expectations | 2 | 4 | **8** | International | MJU30 "EU-aligned" language vs previous national ambition |
| RSK-007 | Energy price volatility: NU17 debate shows unresolved electricity market tensions | 2 | 2 | **4** | Economic | NU17 debate, Lakso (MP) vs Skalberg Karlsson (M) |

## 🎯 Risk Mitigation Observations

| Risk | Government Mitigation | Opposition Exploitation |
|------|----------------------|------------------------|
| RSK-001 | Frame fuel cuts as "household relief" not "climate retreat" | "Choosing voters over planet" campaign narrative |
| RSK-002 | Point to NATO membership itself as achievement | "Paper membership without real capability" attack |
| RSK-003 | Refer to ongoing healthcare commission work | "Four years, no healthcare improvement" attack |
| RSK-004 | Emphasize Tidö cooperation successes | Monitor SD positioning for post-election demands |
| RSK-005 | Normal parliamentary process argument | Democratic accountability framing |

## 📅 Risk Monitoring Triggers

| Risk | Trigger Event | Timeline | Escalation Criteria |
|------|---------------|----------|:-------------------:|
| RSK-001 | EU Commission climate review | Q3 2026 | Formal infringement warning |
| RSK-002 | NATO capability review | Oct 2026 | Public readiness gap disclosure |
| RSK-003 | Healthcare wait time statistics release | May 2026 | Wait times increase >10% |
| RSK-004 | Ministerial interpellation responses | Apr 24-27 | Evasive or confrontational responses |
| RSK-005 | Media coverage of rejected motions | Apr 14-18 | >5 major outlet editorials |
