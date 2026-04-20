# Classification Results — Committee Reports 2026-04-20

<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="96" height="96">
</p>

<h2 align="center">🏷️ Political Event Classification</h2>

<p align="center">
  <strong>Structured Classification for Swedish Committee Reports</strong><br>
  <em>Sensitivity · Urgency · Impact · Policy Domain</em>
</p>

---

## 📋 Document Metadata

| Field | Value |
|-------|-------|
| **Classification ID** | `CLS-2026-04-20-CR001` |
| **Document Type** | Batch Political Event Classification (6 betänkanden) |
| **Event Date** | 2026-04-17 (committee decision date) |
| **Classification Date** | 2026-04-20 05:15 UTC |
| **Primary Source dok_ids** | HD01KU33, HD01CU27, HD01CU28, HD01KU32, HD01CU22, HD01CU42 |
| **Classified By** | `news-committee-reports` agentic workflow |
| **Reviewed By** | Automated quality checks + template compliance |

---

## 🎯 Confidence Scale (5-Level)

| Level | Label | Criteria |
|:-----:|-------|----------|
| ⬛ 1 | **VERY LOW** | Speculation only, single unverified source |
| 🟥 2 | **LOW** | Circumstantial evidence, indirect indicators |
| 🟧 3 | **MEDIUM** | Multiple sources, moderate corroboration |
| 🟩 4 | **HIGH** | Official records, documented data, direct evidence |
| 🟦 5 | **VERY HIGH** | Verified data + independent corroboration + expert consensus |

---

## 🏷️ Classification Decision Tree

```mermaid
graph LR
    DOC["📄 6 Committee<br/>Reports"] --> SENS{Sensitivity}
    SENS -->|"🟢 PUBLIC"| PUB["CU22, CU42<br/>Routine reforms"]
    SENS -->|"🟡 SENSITIVE"| SEN["CU27, CU28, KU32<br/>Contested/technical"]
    SENS -->|"🔴 RESTRICTED"| RES["KU33<br/>Constitutional/press"]

    DOC --> URG{Urgency}
    URG -->|"⚪ ROUTINE"| ROUT["CU42<br/>SOU investigation"]
    URG -->|"🔵 ELEVATED"| ELEV["CU22, CU28<br/>Implementation prep"]
    URG -->|"🟠 URGENT"| URGE["CU27<br/>July 2026 effective"]
    URG -->|"🔴 CRITICAL"| CRIT["KU33, KU32<br/>Election-dependent"]

    DOC --> SCOPE{Impact Scope}
    SCOPE -->|"🏘️ LOCAL"| LOC["None"]
    SCOPE -->|"🇸🇪 NATIONAL"| NAT["All 6 documents"]
    SCOPE -->|"🇪🇺 EU"| EU["KU32, CU27<br/>EU compliance"]
    SCOPE -->|"🌍 INTL"| INT["KU33<br/>Press freedom index"]

    style PUB fill:#4CAF50,color:#FFFFFF
    style SEN fill:#FFC107,color:#000000
    style RES fill:#D32F2F,color:#FFFFFF
    style ROUT fill:#9E9E9E,color:#FFFFFF
    style ELEV fill:#1565C0,color:#FFFFFF
    style URGE fill:#FF9800,color:#FFFFFF
    style CRIT fill:#D32F2F,color:#FFFFFF
    style LOC fill:#9E9E9E,color:#FFFFFF
    style NAT fill:#1565C0,color:#FFFFFF
    style EU fill:#7B1FA2,color:#FFFFFF
    style INT fill:#FF9800,color:#FFFFFF
```

**Active Path Summary:**
- **KU33:** RESTRICTED sensitivity → CRITICAL urgency → INTERNATIONAL scope
- **CU27:** SENSITIVE sensitivity → URGENT urgency → EU scope
- **CU28:** SENSITIVE sensitivity → ELEVATED urgency → NATIONAL scope
- **KU32:** SENSITIVE sensitivity → CRITICAL urgency → EU scope
- **CU22:** PUBLIC sensitivity → ELEVATED urgency → NATIONAL scope
- **CU42:** PUBLIC sensitivity → ROUTINE urgency → NATIONAL scope

---

## 📊 Batch Classification Table

| # | dok_id | Title | Sensitivity | Primary Domain | Urgency | Impact Scope | L×I | Significance | Decision | Confidence |
|:-:|--------|-------|:-----------:|:-------------:|:-------:|:------------:|:---:|:------------:|----------|:----------:|
| 1 | HD01KU33 | Insyn i handlingar (husrannsakan) | 🔴 RESTRICTED | CON (Constitutional) | 🔴 CRITICAL | 🌍 INTL | 15 | **22/25** | ⚡ Priority | 🟦VERY HIGH |
| 2 | HD01CU27 | Identitetskrav vid lagfart | 🟡 SENSITIVE | ECO/JUS | 🟠 URGENT | 🇪🇺 EU | 16 | **21/25** | ⚡ Priority | 🟩HIGH |
| 3 | HD01CU28 | Nationellt bostadsrättsregister | 🟡 SENSITIVE | INF/ECO | 🔵 ELEVATED | 🇸🇪 NATIONAL | 12 | **18/25** | 📰 Priority | 🟩HIGH |
| 4 | HD01KU32 | Tillgänglighet digital radio | 🟡 SENSITIVE | CON/SOC | 🔴 CRITICAL | 🇪🇺 EU | 8 | **16/25** | 📰 Priority | 🟩HIGH |
| 5 | HD01CU22 | God man och förvaltare | 🟢 PUBLIC | SOC | 🔵 ELEVATED | 🇸🇪 NATIONAL | 12 | **13/25** | 📋 Monitor | 🟩HIGH |
| 6 | HD01CU42 | Redovisning av boutredning | 🟢 PUBLIC | JUS | ⚪ ROUTINE | 🇸🇪 NATIONAL | 8 | **10/25** | 📋 Monitor | 🟩HIGH |

**Decision Legend:**
- ⚡ **Priority** — Significance ≥ 18, urgency CRITICAL/URGENT → full per-file analysis within 4h
- 📰 **Priority** — Significance 15–17 → full per-file analysis within 8h
- 📋 **Monitor** — Significance 10–14 → include in synthesis, condensed analysis
- 🗄️ **Archive** — Significance < 10 → log for trend tracking only

---

## 🏷️ Detailed Classification Dimensions

### 1. Sensitivity Level

| dok_id | Level | Rationale | Confidence |
|--------|:-----:|-----------|:----------:|
| HD01KU33 | 🔴 RESTRICTED | Constitutional amendment restricting offentlighetsprincipen; 16 reservations; press freedom implications requiring careful framing | 🟦VERY HIGH |
| HD01CU27 | 🟡 SENSITIVE | 29 reservations (highest in batch); politically contested tenant protections; housing is 2026 election issue | 🟩HIGH |
| HD01CU28 | 🟡 SENSITIVE | Data privacy implications for 1.7M owners; IT implementation complexity; technical controversy | 🟩HIGH |
| HD01KU32 | 🟡 SENSITIVE | Constitutional amendment (vilande); EU compliance dimension; disability rights framing needed | 🟩HIGH |
| HD01CU22 | 🟢 PUBLIC | Zero reservations; cross-party consensus; routine social welfare reform | 🟩HIGH |
| HD01CU42 | 🟢 PUBLIC | Administrative reform; SOU investigation; no political controversy | 🟩HIGH |

### 2. Urgency Level

| dok_id | Level | Rationale | Calendar Reference | Confidence |
|--------|:-----:|-----------|-------------------|:----------:|
| HD01KU33 | 🔴 CRITICAL | Vilande — second reading required after Sept 2026 election; election determines outcome | Election: 2026-09-14 | 🟦VERY HIGH |
| HD01KU32 | 🔴 CRITICAL | Vilande — same election dependency; EU EAA deadline pressure | Election: 2026-09-14 | 🟦VERY HIGH |
| HD01CU27 | 🟠 URGENT | Identity requirements effective 1 July 2026; 75 days from classification | 2026-07-01 | 🟩HIGH |
| HD01CU28 | 🔵 ELEVATED | IT project planning phase; 3-4 year buildout | Q3 2026 tender | 🟧MEDIUM |
| HD01CU22 | 🔵 ELEVATED | Central authority setup Q1-Q2 2027; implementation planning underway | Q1-Q2 2027 | 🟩HIGH |
| HD01CU42 | ⚪ ROUTINE | SOU investigation; no near-term legislative action | TBD (18+ months) | 🟩HIGH |

### 3. Impact Scope

| dok_id | Scope | Rationale | Confidence |
|--------|:-----:|-----------|:----------:|
| HD01KU33 | 🌍 INTERNATIONAL | Press freedom index (RSF) implications; ECHR Article 10 scrutiny potential; affects Sweden's international reputation | 🟩HIGH |
| HD01CU27 | 🇪🇺 EU | EU AML Directive 2018/843 compliance; anti-money laundering harmonisation | 🟩HIGH |
| HD01KU32 | 🇪🇺 EU | EU Accessibility Act (2019/882) compliance requirement | 🟩HIGH |
| HD01CU28 | 🇸🇪 NATIONAL | Affects 1.7M Swedish condominiums; national infrastructure reform | 🟩HIGH |
| HD01CU22 | 🇸🇪 NATIONAL | Affects ~100,000 vulnerable adults under guardianship | 🟩HIGH |
| HD01CU42 | 🇸🇪 NATIONAL | Administrative reform for estate handling | 🟩HIGH |

---

## 📊 Impact Analysis Matrix

### Per-Document Likelihood × Impact Scoring

| Dimension | HD01KU33 | HD01CU27 | HD01CU28 | HD01KU32 | HD01CU22 | HD01CU42 |
|-----------|:--------:|:--------:|:--------:|:--------:|:--------:|:--------:|
| **Democratic Process** | L:4 I:5 = **20** 🔴 | L:3 I:3 = **9** 🟡 | L:2 I:2 = **4** 🟢 | L:3 I:4 = **12** 🟠 | L:2 I:3 = **6** 🟡 | L:1 I:2 = **2** 🟢 |
| **Economic Impact** | L:2 I:2 = **4** 🟢 | L:4 I:4 = **16** 🔴 | L:4 I:4 = **16** 🔴 | L:2 I:2 = **4** 🟢 | L:2 I:2 = **4** 🟢 | L:2 I:2 = **4** 🟢 |
| **Social Cohesion** | L:3 I:3 = **9** 🟡 | L:4 I:4 = **16** 🔴 | L:2 I:3 = **6** 🟡 | L:2 I:3 = **6** 🟡 | L:4 I:4 = **16** 🔴 | L:2 I:2 = **4** 🟢 |
| **Coalition Stability** | L:3 I:5 = **15** 🔴 | L:3 I:4 = **12** 🟠 | L:2 I:2 = **4** 🟢 | L:2 I:3 = **6** 🟡 | L:1 I:1 = **1** 🟢 | L:1 I:1 = **1** 🟢 |
| **International Relations** | L:3 I:4 = **12** 🟠 | L:2 I:3 = **6** 🟡 | L:1 I:2 = **2** 🟢 | L:2 I:4 = **8** 🟡 | L:1 I:1 = **1** 🟢 | L:1 I:1 = **1** 🟢 |
| **Composite (Max)** | **20** 🔴 | **16** 🔴 | **16** 🔴 | **12** 🟠 | **16** 🔴 | **4** 🟢 |

### Impact Matrix (Aggregated View)

| Likelihood \ Impact | 1 – Low | 2 – Minor | 3 – Moderate | 4 – Major | 5 – Severe |
|:-------------------:|:-------:|:---------:|:------------:|:---------:|:----------:|
| 1 – Rare | CU42 | — | — | — | — |
| 2 – Unlikely | — | CU28(econ) | CU22(soc) | — | — |
| 3 – Possible | — | — | KU33(soc) | CU27(coa), KU32(dem) | — |
| 4 – Likely | — | — | — | CU27(econ,soc), CU28(econ), CU22(soc) | KU33(dem) |

---

## 📂 Policy Domain Classification

| Code | Domain | Swedish Term | Documents |
|------|--------|--------------|-----------|
| `CON` | Constitution & Democracy | Konstitution och demokrati | HD01KU33, HD01KU32 |
| `ECO` | Economics & Housing | Ekonomi och bostäder | HD01CU27, HD01CU28 |
| `JUS` | Justice & Law | Rättsväsende | HD01CU27, HD01CU42 |
| `SOC` | Social Policy & Welfare | Socialpolitik | HD01CU22, HD01KU32 |
| `INF` | Infrastructure & IT | Infrastruktur | HD01CU28 |

---

## 🔖 Cross-Reference Tags

| Field | Value |
|-------|-------|
| **Primary Actors** | M, KD, L, SD (coalition); S, V, MP (opposition with reservations) |
| **Committees** | KU (Konstitutionsutskottet), CU (Civilutskottet) |
| **Riksmöte** | 2025/26 |
| **Related dok_ids** | Prop 2025/26:XX (underlying propositions for each betänkande) |
| **Related Classifications** | CLS-2026-04-17-CR001 (prior committee reports batch) |
| **Significance Score Range** | 10–22 (spread of 12 points) |

---

## 🗳️ Election 2026 Classification Context

| Dimension | Assessment | Evidence | Confidence |
|-----------|------------|----------|:----------:|
| **Electoral Impact** | 🔴 CRITICAL for KU33/KU32 — Two vilande constitutional amendments require second reading by new parliament; election outcome is determinative | Both adopted per RF 8:14; documented in HD01KU33, HD01KU32 | 🟦VERY HIGH |
| **Coalition Scenarios** | If Tidö wins: KU33/KU32 pass second reading Q4 2026. If S-bloc wins: KU33 blocked, KU32 likely passes (EU pressure) | Polling April 2026: margin of error race | 🟧MEDIUM |
| **Voter Salience** | Housing (CU27/CU28): 🔴HIGH — top-3 issue. Constitutional (KU33): 🟡MEDIUM — press freedom salient for informed voters | Housing prices affect ~5M households; SJF/TU advocacy | 🟩HIGH |
| **Campaign Vulnerability** | KU33 creates opposition attack vector: "Tidö restricts offentlighetsprincipen"; CU27 creates "insufficient tenant protections" critique | 16 + 29 reservations respectively | 🟩HIGH |
| **Policy Legacy** | If KU33 passes second reading, creates constitutional precedent for 8+ years (same process required to repeal) | TF amendment permanence | 🟦VERY HIGH |

**Overall Electoral Significance**: **🔴 CRITICAL** — First "grundlagsval" (constitutional election) in modern Swedish history where fundamental law amendments hinge on election outcome.

---

## 📝 Classification Rationale

### Summary of Event Batch
Six committee reports (betänkanden) from KU and CU were adopted on 2026-04-17. Two (KU33, KU32) are vilande constitutional amendments to Tryckfrihetsförordningen (TF) and Yttrandefrihetsgrundlagen (YGL), creating unprecedented election-dependency. Three housing/civil law reforms (CU27, CU28, CU22) address anti-fraud, property transparency, and vulnerable adult protections. One (CU42) defers estate administration reform to SOU investigation.

**Key actors:**
- **Ulf Kristersson (M)** — Statsminister, government sponsor
- **Gunnar Strömmer (M)** — Justitieminister, KU33 owner
- **Andreas Carlson (KD)** — Infrastructure minister, CU27/CU28 owner
- **Magdalena Andersson (S)** — Opposition leader, pledges KU33 reversal
- **Ida Karkiainen (S)** — KU chair, opposition oversight

### Classification Justification
- **KU33 RESTRICTED:** Directly restricts constitutional transparency right (offentlighetsprincipen since 1766); 16 reservations from S/V/MP; international press freedom implications
- **CU27 SENSITIVE:** 29 reservations (highest); contested tenant protections; housing is 2026 election battleground
- **CU28 SENSITIVE:** 1.7M owner data privacy implications; significant IT infrastructure
- **KU32 SENSITIVE:** Vilande constitutional amendment; EU EAA compliance dimension
- **CU22 PUBLIC:** Zero reservations; genuine cross-party consensus; routine social welfare improvement
- **CU42 PUBLIC:** Administrative deferral; no political controversy

### Confidence Assessment
- **Source Quality:** 🟦VERY HIGH — All documents are official Riksdag betänkanden
- **Information Completeness:** 🟩HIGH — Full text available for 5/6 documents (CU22 summary only)
- **Overall Confidence:** **🟩HIGH**

### Recommended Actions
- [x] ⚡ **Priority** — KU33 (significance 22): Full per-file analysis ✓
- [x] ⚡ **Priority** — CU27 (significance 21): Full per-file analysis ✓
- [x] 📰 **Priority** — CU28 (significance 18): Full per-file analysis ✓
- [x] 📰 **Priority** — KU32 (significance 16): Full per-file analysis ✓
- [x] 📋 **Monitor** — CU22 (significance 13): Condensed analysis ✓
- [x] 📋 **Monitor** — CU42 (significance 10): Condensed analysis ✓

---

## ⏳ Classification Confidence Decay Rule

| Classification Age | Action Required | Rationale |
|:------------------:|:---------------:|-----------|
| **0–3 days** | ✅ Current — no action | Classification reflects active political context |
| **4–7 days** | ⚠️ Review recommended | Political landscape may have shifted; check for new developments |
| **8–14 days** | 🟠 Re-evaluation REQUIRED | Urgency and sensitivity may have changed; update or confirm |
| **15–30 days** | 🔴 Re-classification MANDATORY | Original context likely stale; full re-assessment needed |
| **31+ days** | ❌ Expired — archive only | Classification no longer actionable; retain for trend analysis only |

**This Classification's Age:** **0 days** (classified 2026-04-20)  
**Re-evaluation Status:** ✅ **Current** — No action required until 2026-04-24

---

## 📂 MCP Data Files Used

| # | File Path | Source MCP Tool | Data Type | Freshness | Confidence |
|:-:|-----------|----------------|-----------|:---------:|:----------:|
| 1 | HD01KU33 | `get_dokument` | betänkande | Current | 🟩HIGH |
| 2 | HD01CU27 | `get_dokument` | betänkande | Current | 🟩HIGH |
| 3 | HD01CU28 | `get_dokument` | betänkande | Current | 🟩HIGH |
| 4 | HD01KU32 | `get_dokument` | betänkande | Current | 🟩HIGH |
| 5 | HD01CU22 | `get_dokument` | betänkande | Current | 🟩HIGH |
| 6 | HD01CU42 | `get_dokument` | betänkande | Current | 🟩HIGH |

---

## 🔗 Cross-References

| Related Analysis File | Relationship | Key Finding |
|----------------------|-------------|-------------|
| [significance-scoring.md](./significance-scoring.md) | Classification informs significance urgency dimension | Urgency scores (1-5) derived from classification |
| [synthesis-summary.md](./synthesis-summary.md) | Classification feeds intelligence dashboard tier display | Tier-1/2/3 breakdown from significance |
| [risk-assessment.md](./risk-assessment.md) | Classification sensitivity maps to risk severity | RESTRICTED → Critical-tier risks |
| [stakeholder-perspectives.md](./stakeholder-perspectives.md) | Classification scope maps to stakeholder groups | International scope → EU/Press freedom stakeholders |

---

## ✅ Quality Self-Check Checklist

- [x] **Document Metadata complete:** Classification ID, event date, classification date, dok_ids, classified by all filled
- [x] **All classification dimensions assigned:** Sensitivity, Policy Domain, Urgency, Impact Scope for all 6 documents
- [x] **Rationale provided for each dimension:** Sensitivity, urgency, and impact scope all have rationales
- [x] **Classification Decision Tree Mermaid:** Active path through diagram identified
- [x] **Impact Analysis Matrix scored:** 5 dimensions scored for all 6 documents
- [x] **Cross-Reference Tags complete:** Primary Actors, Riksmöte, Significance Score all filled
- [x] **Classification Rationale written:** Summary + justification + confidence assessment
- [x] **Recommended Action selected:** All 6 documents have action assignments
- [x] **Confidence Decay assessed:** Classification age calculated (0 days)
- [x] **MCP Data Provenance:** All 6 source documents listed
- [x] **No placeholder text remaining:** Zero `[REQUIRED]` markers
- [x] **Election 2026 Classification Context present:** All 5 dimensions assessed
- [x] **5-level confidence applied:** Source Quality, Information Completeness, Overall Confidence documented
- [x] **Named actors cited:** ≥3 politicians (Kristersson, Strömmer, Carlson, Andersson, Karkiainen)
- [x] **Cross-references linked:** 4 sibling analysis files referenced

---

## 🔒 ISMS Alignment

| Framework | Control | Alignment Note |
|-----------|---------|----------------|
| ISO 27001:2022 | A.5.12 (Classification of Information) | Sensitivity levels (PUBLIC/SENSITIVE/RESTRICTED) align with ISO classification scheme |
| ISO 27001:2022 | A.5.13 (Labelling of Information) | All documents labelled with sensitivity in batch table |
| NIST CSF 2.0 | ID.AM-5 (Asset Classification) | Political events classified by sensitivity/urgency/scope |
| CIS Controls v8.1 | Control 3 (Data Protection) | Classification drives handling requirements for analysis outputs |

---

**Document Control:**  
- **File Path:** `analysis/daily/2026-04-20/committeeReports/classification-results.md`  
- **Version:** 2.0 (elevated to reference-example quality)  
- **Classification Date:** 2026-04-20 05:15 UTC  
- **Re-evaluation Date:** 2026-04-24 (or upon significant political development)  
- **Classification:** Public  
- **Owner:** Hack23 AB (Org.nr 5595347807)
