# Political Risk Assessment — Evening Analysis — 2026-04-11

| **Field** | **Value** |
|-----------|-----------|
| **Risk Assessment ID** | RSK-2026-04-11-EVE-001 |
| **Assessment Date** | 2026-04-11 16:25 UTC |
| **Assessment Period** | 2026-04-04 — 2026-04-10 (Weekly Evening Assessment) |
| **Produced By** | news-evening-analysis workflow (AI-enriched) |
| **Political Context** | M-KD-L coalition with SD support (Tidoavtalet). Pre-election legislative offensive. Government commands Riksdag majority through SD voting discipline. |
| **Riksmote** | 2025/26 |
| **Overall Risk Level** | MEDIUM |
| **Overall Confidence** | MEDIUM-HIGH |

---

## Election 2026 Risk Dimensions

| Dimension | Assessment | Evidence |
|-----------|------------|----------|
| **Electoral Impact** | Government front-loading flagship legislation to establish delivery narrative before September 2026. Risk: ECHR ruling on HD03235 could transform success into liability. | HD03235, HD03220, HD03218, HD03217 |
| **Coalition Scenarios** | Tidoblocket holds (SD 99 percent cohesion). Post-2026 scenarios: SD demands formal government participation or walks. | SD voting records, HD10430, HD10429 |
| **Voter Salience** | Crime (1st), migration (2nd), defence (3rd) all government domain. Healthcare (4th) opposition domain. | Novus March 2026, SoU16/SoU17 |
| **Campaign Vulnerability** | ECHR deportation challenge and 96 percent motion denial rate provide opposition attack vectors. | HD03235, committee data |
| **Policy Legacy** | Shelter law (FoU12), cybersecurity (HD03214), NATO troops (HD03220) are structural — irreversible regardless of election outcome. | HD01FoU12, HD03214, HD03220 |

**Overall Electoral Significance**: HIGH

**Most Likely Electoral Narrative**: Opposition frames government as "legislatively authoritarian" (96 percent denial) while government frames itself as "the only bloc that delivers."

---

## Risk Heat Map

```mermaid
graph TD
    subgraph "Risk Heat Map — Week 15, 2026"
        direction TB
        subgraph "HIGH Risk 12-25/25"
            HR1["R1: ECHR Compatibility<br/>HD03235: Deportation rules<br/>L:4 x I:4 = 16/25"]
            HR2["R2: Climate Opposition Unity<br/>HD01MJU30: June debate<br/>L:4 x I:3 = 12/25"]
            HR3["R3: SD Tido Boundary-Testing<br/>HD10430 / HD10429<br/>L:3 x I:4 = 12/25"]
        end
        subgraph "MEDIUM Risk 6-11/25"
            MR1["R4: Migration Enforcement<br/>HD01SfU31/32/36<br/>L:3 x I:3 = 9/25"]
            MR2["R5: Security Consensus Fracture<br/>HD01UU6: 13 reservations<br/>L:2 x I:4 = 8/25"]
            MR3["R6: Healthcare Mandates<br/>HD03216 + SoU17<br/>L:3 x I:3 = 9/25"]
            MR4["R7: Arms Export Controversy<br/>HD03228<br/>L:3 x I:3 = 9/25"]
            MR5["R8: S Vote Dilemma<br/>HD03235 positioning<br/>L:3 x I:3 = 9/25"]
        end
        subgraph "LOW Risk 1-5/25"
            LR1["R9: Coalition Stability<br/>Tidoblocket holds<br/>L:1 x I:5 = 5/25"]
            LR2["R10: Parliamentary Passage<br/>Majority intact<br/>L:1 x I:3 = 3/25"]
        end
    end
    style HR1 fill:#D32F2F,color:#FFFFFF
    style HR2 fill:#D32F2F,color:#FFFFFF
    style HR3 fill:#D32F2F,color:#FFFFFF
    style MR1 fill:#FFC107,color:#000000
    style MR2 fill:#FFC107,color:#000000
    style MR3 fill:#FFC107,color:#000000
    style MR4 fill:#FFC107,color:#000000
    style MR5 fill:#FFC107,color:#000000
    style LR1 fill:#4CAF50,color:#FFFFFF
    style LR2 fill:#4CAF50,color:#FFFFFF
```

## Cascading Risk Chain — HD03235 ECHR Scenario

```mermaid
graph TD
    TRIGGER["HD03235 Enacted<br/>Deportation thresholds lowered"]
    TRIGGER --> ECHR["ECHR Referral<br/>Art. 8 proportionality challenge<br/>L:4"]
    ECHR --> RULING["Adverse ECHR Ruling<br/>Sweden found in violation<br/>I:4"]
    RULING --> POL["Political Fallout<br/>Government legitimacy damaged<br/>Opposition: rule-of-law narrative"]
    RULING --> LEGAL["Legal Cascade<br/>Pending deportation orders suspended<br/>Court backlog"]
    POL --> ELEC["Electoral Impact<br/>Swing voters defect<br/>S gains law-credibility"]
    LEGAL --> ADMIN["Administrative Crisis<br/>Migrationsverket overwhelmed<br/>SD demands escalate"]
    ADMIN --> COAL["Coalition Stress<br/>SD: harder line or walk<br/>L: ECHR compliance pressure"]

    style TRIGGER fill:#FFC107,color:#000000
    style ECHR fill:#FF9800,color:#FFFFFF
    style RULING fill:#D32F2F,color:#FFFFFF
    style POL fill:#D32F2F,color:#FFFFFF
    style LEGAL fill:#FF9800,color:#FFFFFF
    style ELEC fill:#D32F2F,color:#FFFFFF
    style ADMIN fill:#FF9800,color:#FFFFFF
    style COAL fill:#D32F2F,color:#FFFFFF
```

## Risk Interconnection Map

```mermaid
graph LR
    R1["R1: ECHR<br/>HD03235"] --> R4["R4: Migration<br/>Enforcement"]
    R1 --> R8["R8: S Vote<br/>Dilemma"]
    R3["R3: SD Probing"] --> R5["R5: Security<br/>Fracture"]
    R2["R2: Climate<br/>MJU30"] --> R5
    R4 --> R6["R6: Healthcare<br/>Mandates"]
    R7["R7: Arms Export"] --> R5

    style R1 fill:#D32F2F,color:#FFFFFF
    style R2 fill:#D32F2F,color:#FFFFFF
    style R3 fill:#D32F2F,color:#FFFFFF
    style R4 fill:#FFC107,color:#000000
    style R5 fill:#FFC107,color:#000000
    style R6 fill:#FFC107,color:#000000
    style R7 fill:#FFC107,color:#000000
    style R8 fill:#FFC107,color:#000000
```

## Consolidated Risk Register

| ID | Risk Factor | Evidence (dok_id) | L (1-5) | I (1-5) | Score | Priority | Confidence |
|----|-------------|-------------------|---------|---------|-------|----------|------------|
| R1 | ECHR adverse ruling on deportation rules | HD03235 | 4 | 4 | **16/25** | HIGH | HIGH |
| R2 | Climate opposition unity at MJU30 June debate | HD01MJU30 | 4 | 3 | **12/25** | HIGH | HIGH |
| R3 | SD probing Tido boundaries via interpellations | HD10430, HD10429 | 3 | 4 | **12/25** | HIGH | MEDIUM |
| R4 | SfU migration triple-report enforcement capacity | HD01SfU31, HD01SfU32, HD01SfU36 | 3 | 3 | **9/25** | MEDIUM | HIGH |
| R5 | UU6 nuclear/DCA reservations fracturing consensus | HD01UU6 | 2 | 4 | **8/25** | MEDIUM | HIGH |
| R6 | Healthcare unfunded mandates (172+176 denied motions) | HD03216, HD01SoU17 | 3 | 3 | **9/25** | MEDIUM | HIGH |
| R7 | Arms export controversy post-NATO accession | HD03228 | 3 | 3 | **9/25** | MEDIUM | MEDIUM |
| R8 | S vote dilemma on deportation support | HD03235 | 3 | 3 | **9/25** | MEDIUM | MEDIUM |
| R9 | Coalition stability (overall Tidoblocket) | All voting records | 1 | 5 | **5/25** | LOW | HIGH |
| R10 | Parliamentary passage blocked | Government majority | 1 | 3 | **3/25** | LOW | VERY HIGH |

## 5-Dimension Risk Scoring

| Dimension | Score | Assessment | Key Evidence |
|-----------|-------|------------|-------------|
| **Coalition** | 3/10 | SD 99 percent cohesion; probing but not breaking | HD10430, HD10429, voting records |
| **Policy** | 6/10 | ECHR exposure on HD03235; migration enforcement gap | HD03235, HD01SfU31/32/36 |
| **Budget** | 4/10 | SEK 18.7B spring budget covers defence/law; municipal gap | Budget 2026, HD03216 |
| **Electoral** | 5/10 | Government owns top 3 voter concerns; healthcare gap | Novus 2026, HD01SoU16/17 |
| **External** | 5/10 | ECHR/UNHCR scrutiny; NATO provides diplomatic offset | HD03235, HD03220 |

## Forward Indicators

| # | Indicator | Date/Window | Risk Link | Signal Type |
|---|-----------|-------------|-----------|-------------|
| 1 | Minister responses to SD interpellations (HD10430, HD10429) | April 24-27 | R3 | Coalition tension — concessions vs rebuffs |
| 2 | FoU12 shelter law and UU6 security policy chamber votes | Late April | R5 | Defence consensus floor test |
| 3 | HD03235 deportation rules committee processing begins | April-May | R1, R8 | ECHR debate trajectory, S positioning |
| 4 | MJU30 climate targets debate preparation | June 2026 | R2 | Opposition coordination V/MP/S/C |
| 5 | NATO Foreign Ministers Meeting Stockholm | May 21-22 | R5 | Diplomatic validation vs domestic reservations |
| 6 | SfU migration enforcement implementation reports | May-June | R4 | Migrationsverket capacity signals |
| 7 | Arms export case decisions under HD03228 framework | Q3 2026 | R7 | First test of post-NATO export regime |
| 8 | Election campaign formal launch | August 2026 | R1-R10 | All risks intensify under campaign dynamics |

## Data Quality Notes

Confidence: **MEDIUM-HIGH**. Risk scores use standardised L(1-5) x I(1-5) = Score/25 matrix. Based on 100+ documents cross-referenced from weekly-review sibling analysis. Coalition cohesion scores from floor-vote analysis (40+ recorded divisions). dok_id references verified against Riksdag open data API. Forward indicator dates from parliamentary calendar and government schedules.
