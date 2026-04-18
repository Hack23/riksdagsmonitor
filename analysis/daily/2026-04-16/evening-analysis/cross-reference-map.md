# Cross-Reference Map — Evening Analysis 2026-04-16

## 📋 Cross-Reference Context

| Field | Value |
|-------|-------|
| **Cross-Reference ID** | `XRF-2026-04-16-EVE` |
| **Analysis Date** | 2026-04-16 19:30 UTC |
| **Documents Mapped** | 24 primary + 32 cross-referenced from sibling analysis |
| **Document Types** | Propositions (5), Committee Reports (6), Motions (8), Interpellations (2), Press Releases (9) — 30 retrieved, 21 deeply analyzed |
| **Produced By** | news-evening-analysis workflow |

---

## 🔗 Document Relationship Graph

```mermaid
graph TD
    subgraph "🏛️ Government Propositions"
        P246["HD03246<br/>Youth Crime<br/>🔴 9/10"]
        P231["HD03231<br/>Ukraine Tribunal<br/>🟠 8/10"]
        P232["HD03232<br/>Ukraine Damages<br/>🟠 8/10"]
        P244["HD03244<br/>Digital Interop<br/>🟡 7/10"]
        P242["HD03242<br/>Active Forestry<br/>🟡 7/10"]
    end
    
    subgraph "📋 Committee Reports"
        SKU23["HD01SkU23<br/>EV+Fuel Tax<br/>🟠 8/10"]
        MJU19["HD01MJU19<br/>Waste Reform<br/>🟡 7/10"]
        MJU20["HD01MJU20<br/>Climate Audit<br/>🟡 7/10"]
        SFU20["HD01SfU20<br/>Parental Leave<br/>🟢 4/10"]
        TU16["HD01TU16<br/>Driving Practice<br/>🟢 4/10"]
        SKU32["HD01SkU32<br/>Savings<br/>🟢 2/10"]
    end
    
    subgraph "⚔️ Opposition Motions"
        M4090["HD024090<br/>V: Reject Deportation"]
        M4091["HD024091<br/>V: Reject War Material"]
        M4092["HD024092<br/>V: Reject Fuel Tax"]
        M4093["HD024093<br/>C: Cybersecurity"]
        M4094["HD024094<br/>C: Health Care"]
        M4095["HD024095<br/>C: Deportation"]
        M4096["HD024096<br/>MP: War Material Ban"]
        M4097["HD024097<br/>MP: Deportation"]
    end
    
    subgraph "❓ Interpellations"
        I435["HD10435<br/>Bernadotte Murder"]
        I436["HD10436<br/>Space Industry"]
    end
    
    %% Cross-references
    P246 -.->|"Tidöavtalet delivery"| M4090
    M4090 -.->|"Same target: Prop 235"| M4095
    M4095 -.->|"Same target: Prop 235"| M4097
    M4091 -.->|"Same target: Prop 228"| M4096
    P242 -.->|"Environmental tension"| MJU19
    P242 -.->|"Climate contradiction"| MJU20
    SKU23 -.->|"Energy policy"| M4092
    P231 -.->|"Companion"| P232
    
    style P246 fill:#D32F2F,color:#FFFFFF
    style P231 fill:#FF9800,color:#FFFFFF
    style P232 fill:#FF9800,color:#FFFFFF
    style SKU23 fill:#FF9800,color:#FFFFFF
    style M4090 fill:#D32F2F,color:#FFFFFF
    style M4091 fill:#D32F2F,color:#FFFFFF
    style M4092 fill:#D32F2F,color:#FFFFFF
```

---

## 📊 Cross-Reference Matrix

### Proposition → Opposition Motion Links

| Proposition | Motions Against | Parties | Rejection Type | Cross-Party Coordination |
|------------|:---------------:|---------|---------------|:------------------------:|
| Prop 2025/26:235 (Deportation) | 3 | V (HD024090), C (HD024095), MP (HD024097) | Full rejection (V, MP), partial rejection (C) | ✅ HIGH — 3 parties converge |
| Prop 2025/26:228 (War Material) | 2 | V (HD024091), MP (HD024096) | Full rejection (V), ban expansion (MP) | ✅ MEDIUM — left-green alignment |
| Prop 2025/26:236 (Fuel Tax Cut) | 1 | V (HD024092) | Full rejection of fuel tax reduction | ❌ V only |
| Prop 2025/26:214 (Cybersecurity) | 1 | C (HD024093) | Amendment request, not rejection | ❌ C constructive |
| Prop 2025/26:216 (Health Care) | 1 | C (HD024094) | Partial rejection of health care provisions | ❌ C only |

### Committee Report → Proposition Links

| Committee Report | Related Proposition | Relationship |
|-----------------|-------------------|-------------|
| HD01SkU23 (EV+Fuel Tax) | Prop 236 (Fuel Tax Cut) | SkU23 advances green transport; Prop 236 cuts fuel taxes — complementary but tension |
| HD01MJU19 (Waste Reform) | Prop 242 (Forestry) | Both involve environmental regulation — MJU19 tightens waste rules, Prop 242 loosens forestry rules |
| HD01MJU20 (Climate Audit) | Prop 242 (Forestry) | Riksrevisionen audit questions climate evaluation; forestry deregulation adds to credibility gap |

### Press Release → Legislative Activity Links

| Press Release | Related Document | Messaging Connection |
|--------------|-----------------|---------------------|
| Pressträff om skärpta regler för unga brottslingar | HD03246 | Direct: Press conference for Prop 246 tabling |
| Tidsobestämd påföljd i kraft | HD03246 | Thematic: Youth crime reform + indefinite sentences = crime blitz |
| Bidragsspärr för kriminella | HD03246 | Thematic: Crime prevention + punishment package |
| Cyberhot-åtgärder | HD024093, HD03244 | Thematic: Cybersecurity + digital governance |
| Telefonbedrägerier-åtgärder | — | Thematic: Crime prevention communications |
| Socialtjänsten verktyg | HD03246 | Thematic: Social services + youth crime |
| Utmätningsregler kriminella ekonomin | — | Thematic: Crime prevention fiscal tools |

---

## 🕸️ Thematic Clusters

### Cluster 1: Crime & Justice (5 documents)
HD03246 → pressträff → tidsobestämd påföljd → bidragsspärr → utmätningsregler
**Coherence:** VERY HIGH — deliberate government messaging package

### Cluster 2: Ukraine Accountability (2 documents)
HD03231 ↔ HD03232
**Coherence:** VERY HIGH — companion propositions, same minister (Malmer Stenergard)

### Cluster 3: Opposition Mobilization on Prop 235 (3 documents)
HD024090 (V) ↔ HD024095 (C) ↔ HD024097 (MP)
**Coherence:** HIGH — coordinated multi-party rejection of same proposition

### Cluster 4: Environmental Policy Tension (3 documents)
HD03242 ↔ HD01MJU19 ↔ HD01MJU20
**Coherence:** MEDIUM — conflicting signals on environmental regulation

### Cluster 5: Defense/Export (2 documents)
HD024091 (V) ↔ HD024096 (MP)
**Coherence:** HIGH — left-green convergence on war material restrictions

### Cluster 6: Energy/Tax (2 documents)
HD01SkU23 ↔ HD024092 (V)
**Coherence:** MEDIUM — complementary energy policies challenged by V fiscal critique

---

## 🔗 Sibling Analysis Cross-References

This evening analysis synthesizes findings from:

| Sibling Type | Date | Key Finding Incorporated |
|-------------|------|-------------------------|
| committeeReports | 2026-04-16 | SkU23 EV charging permanence, MJU19 waste reform, MJU20 climate audit |
| propositions | 2026-04-16 | Props 246, 231, 232, 244, 242 significance scoring |
| motions | 2026-04-16 | V triple rejection pattern, C-MP convergence on Prop 235 |
| interpellations | 2026-04-16 | HD10435 Bernadotte, HD10436 space industry |
| realtime (morning) | 2026-04-16 | Government press release monitoring data |

---

**Document Control:** v1.0 | Generated 2026-04-16 19:30 UTC | news-evening-analysis | Hack23 AB
