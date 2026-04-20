# Cross-Reference Map — Evening Analysis 2026-04-20

**Reference ID**: `XRF-2026-04-20-EA001`  
**Analysis Date**: 2026-04-20 18:40 UTC  
**Scope**: Cross-references across all article types produced today  
**Confidence**: 🟩 HIGH

---

## Document Relationship Graph

```mermaid
graph LR
    subgraph "💰 Fiscal Cluster"
        HD03100["HD03100<br/>Spring Economic Bill"]
        HD0399["HD0399<br/>Spring Amendment"]
        HD03236["HD03236<br/>Fuel Tax Cut"]
        HD03241["HD03241<br/>Riksrevisionen Fiscal"]
        HD03100 <--> HD0399
        HD03100 <--> HD03236
        HD03241 -.->|"Scrutinises"| HD03100
    end
    
    subgraph "⚖️ Constitutional Cluster"
        KU33["HD01KU33<br/>Police Secrecy Amendment"]
        KU32["HD01KU32<br/>Media Accessibility"]
        KU33 -->|"Both vilande<br/>RF 8:14"| ELECT["🗳️ Sept 2026 Election<br/>determines fate"]
        KU32 --> ELECT
    end
    
    subgraph "🏠 Housing Cluster"
        CU27["HD01CU27<br/>Anti-fraud/Identity"]
        CU28["HD01CU28<br/>National Condo Register"]
        CU42["HD01CU42<br/>Riksrevisionen Response"]
        CU27 <--> CU28
        CU42 -.->|"Context"| CU27
    end
    
    subgraph "⚖️ Justice Cluster"
        HD03237["HD03237<br/>Police Expansion"]
        HD03246["HD03246<br/>Youth Criminal Code"]
        KU33 <-->|"Police powers<br/>theme"| HD03237
    end
    
    subgraph "🌍 Ukraine Cluster"
        P231["prop.202526231<br/>Aggression Tribunal"]
        P232["prop.202526232<br/>Compensation Commission"]
        ROYALVISIT["Royal Visit<br/>+ FM Kyiv Apr 17"]
        P231 <--> P232
        P231 <--> ROYALVISIT
    end
    
    subgraph "🗳️ Opposition Cluster"
        MOT21["21 Counter-Motions<br/>S+V+MP+C Immigration"]
        INTERP10["10 Interpellations<br/>(7 from S)"]
        FRS437["frs 2025/26:437<br/>EU Pay Transparency FAIL"]
        FRS435["frs 2025/26:435<br/>Bernadotte/Israel"]
        FRS434["frs 2025/26:434<br/>Carlson Infrastructure"]
        MOT21 -.->|"Counter to"| HD03100
        INTERP10 -.->|"Challenges"| KU33
        FRS437 -->|"Challenges"| LARSSON["Nina Larsson (L)<br/>Jämställdhetsminister"]
        FRS434 -->|"Challenges"| CARLSON["Andreas Carlson (KD)<br/>Infrastructure Minister"]
    end
    
    HD03100 <-->|"Fiscal context"| MOT21
    KU33 <-->|"Constitutional frame"| ELECT
    HD03237 <-->|"SD coalition link"| KU33
```

---

## Cross-Article Type References

| Source Article | Referenced by Evening | Nature of Link |
|---------------|----------------------|----------------|
| committeeReports/synthesis-summary.md | Evening synthesis | KU33/KU32 constitutional dimension; housing triptych |
| propositions/synthesis-summary.md | Evening synthesis | Spring Economic Bill narrative; pre-election fiscal package |
| interpellations/synthesis-summary.md | Evening synthesis | Gender equality attack; Carlson infrastructure; Bernadotte |
| motions/synthesis-summary.md | Evening synthesis | 21-motion opposition coordination; immigration battleground |

---

## Policy Continuity Chains

| Chain | Documents | Significance |
|-------|-----------|-------------|
| **Fiscal credibility chain** | HD03100 → HD0399 → HD03236 → HD03241 → FiU hearings | Spring Bill establishes macro narrative; Riksrevisionen scrutinises; amendment budgets deliver relief |
| **Constitutional rights chain** | KU33 vilande → Election Sept 2026 → Second reading Q4 2026 → If passes: press freedom restricted | Election literally determines constitutional framework |
| **Opposition accountability chain** | frs 2025/26:434 (Carlson) → frs 2025/26:437 (Larsson) → frs 2025/26:438 (Larsson) → motions cluster | S building systematic multi-minister accountability case |
| **Ukraine solidarity chain** | prop.202526231 → prop.202526232 → Royal visit → NATO credibility | Sweden active ally; justice/accountability framework |
| **Gender equality failure chain** | frs 2025/26:437 → EU directive withdrawal → infringement risk → Larsson exposed | EU law + political accountability combine |

---

## Citation Table (Sibling Workflows)

| dok_id | Analyzed in | Used in Evening | Cross-reference value |
|--------|------------|-----------------|----------------------|
| HD01KU33 | committeeReports | YES | Highest significance; constitutional election |
| HD01KU32 | committeeReports | YES | EU compliance + constitutional |
| HD03100 | propositions | YES | Electoral anchor; fiscal credibility |
| HD03236 | propositions | YES | Fuel tax cut; electoral relief timing |
| frs 2025/26:437 | interpellations | YES | EU Pay Transparency failure |
| frs 2025/26:435 | interpellations | YES | Bernadotte; April 30 deadline |
| frs 2025/26:434 | interpellations | YES | Carlson accountability |
| 21 motions | motions | YES | Opposition coordination |
