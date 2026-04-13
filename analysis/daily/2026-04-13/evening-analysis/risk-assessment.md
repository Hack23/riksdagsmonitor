# 🔴 Risk Assessment — Evening Analysis 2026-04-13

| Field | Value |
|-------|-------|
| **ID** | RSK-EVE-2026-04-13-001 |
| **Date** | 2026-04-13 |
| **Riksmöte** | 2025/26 |
| **Overall Risk Level** | ELEVATED |
| **Confidence** | HIGH |
| **Generated** | 2026-04-13 17:55 UTC |
| **Documents Cross-Referenced** | 61 |

---

## Risk Heat Map

```mermaid
graph TD
    subgraph "Risk Heat Map — Evening 2026-04-13"
        direction TB
        subgraph "🔴 CRITICAL (Score ≥15)"
            R1["R1: Fiscal framework rejection<br/>L:4 × I:4 = 16<br/>HD03100"]
            R2["R2: GDP forecast deviation<br/>L:3 × I:5 = 15<br/>HD03100, HD03241"]
            R3["R3: Climate-fiscal contradiction<br/>L:5 × I:3 = 15<br/>HD03236 vs MJU30"]
        end
        subgraph "🟠 HIGH (Score 10-14)"
            R4["R4: Election bribe framing<br/>L:4 × I:3 = 12<br/>HD03236"]
            R5["R5: SD blocks spending items<br/>L:3 × I:4 = 12<br/>HD0399"]
            R6["R6: Healthcare system strain<br/>L:3 × I:4 = 12<br/>SoU16, SoU17"]
            R7["R7: Defence personnel gap<br/>L:4 × I:3 = 12<br/>FöU8"]
        end
        subgraph "🟡 MEDIUM (Score 6-9)"
            R8["R8: Coalition interpellation friction<br/>L:3 × I:3 = 9<br/>HD10429, HD10430"]
            R9["R9: NATO cost escalation<br/>L:2 × I:3 = 6<br/>HD03220"]
            R10["R10: Prison capacity insufficiency<br/>L:3 × I:3 = 9<br/>HD03218"]
        end
    end
    style R1 fill:#dc3545,stroke:#333,color:#fff
    style R2 fill:#dc3545,stroke:#333,color:#fff
    style R3 fill:#dc3545,stroke:#333,color:#fff
    style R4 fill:#fd7e14,stroke:#333,color:#fff
    style R5 fill:#fd7e14,stroke:#333,color:#fff
    style R6 fill:#fd7e14,stroke:#333,color:#fff
    style R7 fill:#fd7e14,stroke:#333,color:#fff
    style R8 fill:#ffc107,stroke:#333,color:#000
    style R9 fill:#ffc107,stroke:#333,color:#000
    style R10 fill:#ffc107,stroke:#333,color:#000
```

## Detailed Risk Register

| ID | Risk | Category | Likelihood (1-5) | Impact (1-5) | Score | dok_id | Mitigation | Confidence |
|----|------|----------|------------------|-------------|-------|--------|------------|:----------:|
| R1 | Opposition rejects Vårproposition fiscal framework in FiU | Fiscal | 4 | 4 | **16** | HD03100 | Coalition secures SD support in Finance Committee | 🟧MEDIUM |
| R2 | GDP growth forecast proves overly optimistic | Economic | 3 | 5 | **15** | HD03100, HD03241 | Quarterly fiscal revisions, Riksrevisionen oversight | 🟧MEDIUM |
| R3 | Fuel tax cut contradicts climate milestones | Policy Coherence | 5 | 3 | **15** | HD03236, MJU30 | Frame as temporary crisis measure; pair with green investments | 🟩HIGH |
| R4 | S/V frame fuel tax relief as election bribery | Electoral | 4 | 3 | **12** | HD03236 | Emphasise structural energy policy, not one-off relief | 🟩HIGH |
| R5 | SD blocks specific Vårändringsbudget spending items | Coalition | 3 | 4 | **12** | HD0399 | Early consultation with SD on spending priorities | 🟧MEDIUM |
| R6 | Healthcare access crisis deepens without policy response | Social | 3 | 4 | **12** | SoU16, SoU17 | Commission new healthcare inquiry for autumn | 🟧MEDIUM |
| R7 | Defence personnel shortfall blocks NATO commitments | Security | 4 | 3 | **12** | FöU8 | Accelerate military recruitment and retention programs | 🟩HIGH |
| R8 | SD interpellations expose coalition fault lines | Coalition | 3 | 3 | **9** | HD10429, HD10430 | Ministers deliver substantive responses by deadline | 🟧MEDIUM |
| R9 | NATO deployment costs escalate beyond budget | Security | 2 | 3 | **6** | HD03220 | NATO burden-sharing framework limits Swedish exposure | 🟧MEDIUM |
| R10 | Prison capacity insufficient for double gang penalties | Justice | 3 | 3 | **9** | HD03218 | Announce Kriminalvården expansion plan | 🟩HIGH |

## Risk Cascade Analysis

```mermaid
flowchart TD
    A["🌍 Global Economic Shock<br/>(trade wars, energy crisis)"] --> B["GDP Forecast Deviation<br/>R2: L:3×I:5=15"]
    B --> C["Vårproposition<br/>Credibility Collapse"]
    B --> D["Revenue Shortfall<br/>Forces Budget Cuts"]
    D --> E["Supplementary Budget<br/>Insufficient (HD0399)"]
    C --> F["Opposition Economic<br/>Alternative Gains Traction"]
    
    G["⚡ Energy Price Spike"] --> H["Fuel Tax Cut<br/>Relief Insufficient"]
    G --> I["Extra Budget Costs<br/>Exceed Allocation (HD03236)"]
    I --> J["Fiscal Deficit Widens"]
    J --> K["EU Stability Pact<br/>Pressure"]
    
    L["🌡️ Climate Event"] --> M["MJU30 Target Revision<br/>Draws EU Scrutiny"]
    M --> N["Green Credibility<br/>Damaged Internationally"]
    
    style A fill:#dc3545,color:#fff
    style G fill:#dc3545,color:#fff
    style L fill:#dc3545,color:#fff
    style B fill:#ffc107,color:#000
    style C fill:#fd7e14,color:#fff
    style K fill:#dc3545,color:#fff
    style N fill:#fd7e14,color:#fff
```

## Forward Indicators — Risk Watch Items

| Indicator | Trigger | Timeline | Risk IDs |
|-----------|---------|----------|----------|
| FiU committee vote on Vårproposition | SD signals opposition to fiscal assumptions | April-May 2026 | R1, R5 |
| Quarterly GDP revision | KI, SCB, or Riksbanken revises growth outlook downward | Q2 2026 | R2 |
| MJU debate on climate milestones | MP/V challenge MJU30 in plenary | April 2026 | R3, R4 |
| Minister responses to SD interpellations | Strömmer (Apr 24) and Forssmed (Apr 27) deadlines | Late April 2026 | R8 |
| Kriminalvården capacity report | Quarterly occupancy data release | May 2026 | R10 |

## Aggregate Risk Profile

- **Overall Level**: ELEVATED (weighted average score: 12.1)
- **Primary Cluster**: Fiscal-economic risks (R1, R2, R5) — concentrated in spring budget package
- **Secondary Cluster**: Policy coherence (R3, R4) — climate vs cost-of-living tension
- **Emerging**: Coalition dynamics (R5, R8) — SD testing boundaries ahead of Election 2026
