<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">⚠️ Political Risk Assessment Methodology</h1>

<p align="center">
  <strong>📊 Multi-Dimensional Risk Scoring for Swedish Parliamentary Intelligence</strong><br>
  <em>🎯 Cascading Risk · Bayesian Updating · Risk Interconnection · Scenario Trees</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-2.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--30-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 2.0 | **📅 Last Updated:** 2026-03-30 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-30  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This methodology provides the authoritative framework for political risk assessment in Riksdagsmonitor's analytical workflows. Beyond the basic 5×5 Likelihood × Impact matrix, this methodology includes:

- **Cascading risk analysis** — how one risk event triggers a chain of subsequent risks
- **Bayesian updating** — how to revise risk scores as new evidence arrives
- **Risk interconnection mapping** — visualizing dependencies between risk types
- **Scenario tree analysis** — probabilistic branching for complex political situations

This adapts the quantitative approach from [Hack23 ISMS Risk_Assessment_Methodology.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Assessment_Methodology.md) to Swedish parliamentary politics.

See [reference/isms-risk-assessment-adaptation.md](../reference/isms-risk-assessment-adaptation.md) for the complete ISMS-to-political mapping.

---

## 📐 Core Methodology: Likelihood × Impact

All political risks are scored using a **5×5 matrix**. Risk Score = Likelihood × Impact.

### Likelihood Scale (1–5)

| Score | Label | Definition | Parliamentary Analogy |
|:-----:|-------|------------|----------------------|
| 1 | **Rare** | <5% probability in assessment window | Coalition collapse with 176-seat majority |
| 2 | **Unlikely** | 5–20% probability | Budget vote fails despite coalition agreement |
| 3 | **Possible** | 21–40% probability | SD defects on single non-budget vote |
| 4 | **Likely** | 41–70% probability | Opposition files no-confidence motion when polls shift |
| 5 | **Almost Certain** | >70% probability | Government proposes budget in September |

### Impact Scale (1–5)

| Score | Label | Definition | Political Example |
|:-----:|-------|------------|------------------|
| 1 | **Negligible** | Routine disruption; normal operations continue | Minor committee delay |
| 2 | **Minor** | Moderate disruption; corrective action straightforward | Single bill rejected; government re-submits |
| 3 | **Moderate** | Significant disruption; coalition relationship strained | Major budget amendment forced by opposition |
| 4 | **Major** | Severe disruption; coalition integrity threatened | Minister forced to resign |
| 5 | **Severe** | Democratic crisis; constitutional mechanisms triggered | Government falls; extraordinary election called |

### Risk Matrix

```mermaid
graph LR
    subgraph "Risk Score = Likelihood × Impact"
        direction TB
        L1["L=1"] ---|"×1=1"|I1["I=1: 🟢1"]
        L1---|"×2=2"|I2["I=2: 🟢2"]
        L1---|"×3=3"|I3["I=3: 🟢3"]
        L1---|"×4=4"|I4["I=4: 🟢4"]
        L1---|"×5=5"|I5["I=5: 🟡5"]
        L3["L=3"] ---|"×3=9"|I3b["I=3: 🟡9"]
        L3---|"×4=12"|I4b["I=4: 🟠12"]
        L5["L=5"] ---|"×4=20"|I4c["I=4: 🔴20"]
        L5---|"×5=25"|I5c["I=5: 🔴25"]
    end
```

| Score | Tier | Colour | Action |
|:-----:|------|--------|--------|
| 1–4 | **Low** | 🟢 | Monitor; mention in weekly digest |
| 5–9 | **Medium** | 🟡 | Active monitoring; flag in daily analysis |
| 10–14 | **High** | 🟠 | Priority assessment; include in news |
| 15–25 | **Critical** | 🔴 | Immediate analysis; breaking news consideration |

---

## 🤝 Coalition Stability Risk

Coalition risk is the most politically distinctive risk type in Swedish parliamentary analysis.

### Coalition Stability Factors

```mermaid
flowchart TD
    A["🤝 Coalition Stability Assessment"] --> B["📊 Seat Arithmetic<br/>M+KD+L+SD = 176 seats"]
    A --> C["📋 Policy Cohesion<br/>Legislative agreement rate"]
    A --> D["📈 Electoral Pressure<br/>National polls & municipal spillovers"]
    A --> E["📜 Tidöavtalet Compliance<br/>SD cooperation agreement adherence"]
    A --> F["🌍 External Constraints"]

    B --> B1["Formal majority: ≥175 of 349"]
    B --> B2["Support party reliability<br/>SD vote-by-vote basis"]
    B --> B3["By-election & defection risk"]

    C --> C1["Budget agreement status"]
    C --> C2["Migration policy splits<br/>L vs SD divergence"]
    C --> C3["Energy policy cohesion<br/>Nuclear vs renewables"]

    D --> D1["National poll trajectory<br/>Novus, Demoskop, SCB/PSU"]
    D --> D2["Municipal election spillovers"]
    D --> D3["Pre-election positioning pressure"]

    E --> E1["Migration chapter compliance"]
    E --> E2["Crime & justice chapter delivery"]
    E --> E3["SD satisfaction signals<br/>Public statements, vote patterns"]

    F --> F1["EU compliance requirements"]
    F --> F2["NATO commitments"]
    F --> F3["Economic indicators"]

    style A fill:#dc3545,color:#fff
    style B fill:#fd7e14,color:#fff
    style C fill:#fd7e14,color:#fff
    style D fill:#ffc107,color:#000
    style E fill:#6f42c1,color:#fff
    style F fill:#0d6efd,color:#fff
```

### Coalition Collapse Probability (90-day window)

| Likelihood of Collapse | Seat Margin | Policy Cohesion | Electoral Pressure | Combined Score |
|------------------------|:-----------:|:---------------:|:-----------------:|:--------------:|
| **LOW (<15%)** | ≥176 operational buffer | High (all parties aligned) | Low (polls stable) | L≤2, I≤3 |
| **MEDIUM (15–35%)** | 175 bare majority (no buffer) | Medium (one party strained) | Medium (5+ point poll shift) | L=3, I=3–4 |
| **HIGH (>35%)** | <175 no majority | Low (multi-party tension) | High (SD threats withdrawal) | L≥4, I≥4 |

> **Note on majority arithmetic:** A formal Riksdag majority requires **≥175 of 349 seats**. However, absences and abstentions mean that ≥176 seats provide an "operational buffer" — the practical threshold for reliable legislative passage. The table above uses this distinction: ≥176 = comfortable (LOW), exactly 175 = bare majority (MEDIUM), <175 = no majority (HIGH).

---

## 📋 Policy Implementation Risk

Policy implementation risks assess the probability that a proposed policy fails to pass, is significantly amended, or is blocked:

| Stage | Default Likelihood | Risk Amplifiers | Risk Reducers |
|-------|--------------------|-----------------|---------------|
| Proposition submitted | L=2 | Opposition majority, SD conditions | Cross-party agreement |
| Committee review | L=2 | Dissenting committee reports | Government committee majority |
| Floor debate scheduled | L=3 | No-confidence backdrop | Vote whipped by all coalition parties |
| Vote imminent | L=1–4 | Internal defections signalled | Prior vote counting confirms majority |
| Enacted | L=1 (reversal) | New government formed | Constitutional entrenchment |

---

## 💰 Budget Risk Assessment

Swedish budget risk has unique characteristics due to the Riksdag's fiscal framework:

### Budget Timeline Risk Points

```mermaid
timeline
    title Swedish Budget Risk Calendar
    section September
        Budget Proposition : Tabled by Finansminister
        Risk Level: HIGH if coalition unstable
    section October–November
        FiU Committee Review : Amendments filed
        Risk Level: MEDIUM normally
    section November
        Riksdag Budget Vote : Deadline vote
        Risk Level: CRITICAL if no majority confirmed
    section December
        Budget Implementation : Government executes
        Risk Level: LOW if passed
    section April
        Spring Amending Budget : Adjustments
        Risk Level: LOW–MEDIUM
```

**FiU (Finansutskottet) Dissent Tracking:** Track formal dissenting opinions (reservationer) filed by opposition parties. Each reservation from a coalition party signals **High** policy risk for that budget line.

---

## 🗳️ Electoral Positioning Risk

Electoral risk quantifies how political events affect parties' electoral prospects over the 4-year Swedish electoral cycle:

| Electoral Phase | Risk Focus | Key Indicators |
|----------------|------------|----------------|
| **Year 1 (post-election)** | Coalition formation stability | Cooperation agreement durability |
| **Year 2 (mid-term)** | Policy delivery credibility | Legislation passing rate; SCB data |
| **Year 3 (positioning)** | Pre-election narrative | Poll trends; party conference resolutions |
| **Year 4 (campaign)** | Electoral positioning | Budget generosity; flagship policy status |

**Note:** General elections in Sweden are held the second Sunday of September every 4 years. Current cycle: September 2022 → **September 2026**.

---

## 📊 Calibration Examples

Real Swedish political scenarios as scoring anchors:

| Scenario | Likelihood | Impact | Score | Tier | Rationale |
|----------|:----------:|:------:|:-----:|------|-----------|
| SD conditionally supports budget | 4 | 4 | 16 | 🔴 Critical | Frequent pattern; major governance impact |
| SD conditionally supports government on migration | 4 | 4 | 16 | 🔴 Critical | Tidöavtalet leverage; SD extracts concessions as price for continued support |
| L exits coalition over migration | 2 | 5 | 10 | 🟠 High | Historically rare; would collapse government |
| L exits government coalition | 2 | 5 | 10 | 🟠 High | L departure reduces M+KD to ~131 seats; SD support alone insufficient for majority |
| Minor committee report delayed | 1 | 1 | 1 | 🟢 Low | Routine; no political consequence |
| Budget vote passes with expected margin | 4 | 1 | 4 | 🟢 Low | Likely but low-impact routine event |
| Plenary adopts budget with expected margin | 4 | 1 | 4 | 🟢 Low | Standard legislative process; M+KD+L+SD bloc votes cohesively |
| KU investigation into government minister | 3 | 3 | 9 | 🟡 Medium | Possible; damages but rarely fatal |
| Motion of no confidence (misstroendeförklaring) | 1 | 5 | 5 | 🟡 Medium | Requires 175 votes; very rare but triggers government fall if passed |
| No-confidence motion passes | 1 | 5 | 5 | 🟡 Medium | Very rare; catastrophic if it occurs |
| New SOU recommends major pension reform | 4 | 3 | 12 | 🟠 High | Likely publication; major policy implications |
| Major government proposition on AI regulation | 4 | 3 | 12 | 🟠 High | Likely given EU AI Act transposition deadline; cross-cutting policy with industry impact |
| Article 7/EU sanctions against Sweden | 1 | 5 | 5 | 🟡 Medium | Extremely rare EU mechanism; would signal severe rule-of-law concerns |

---

## 🔗 Related Documents

- [templates/risk-assessment.md](../templates/risk-assessment.md) — Risk assessment template
- [templates/per-file-political-intelligence.md](../templates/per-file-political-intelligence.md) — Per-file analysis template with risk section
- [reference/isms-risk-assessment-adaptation.md](../reference/isms-risk-assessment-adaptation.md) — ISMS mapping
- [political-threat-framework.md](political-threat-framework.md) — Complementary threat analysis
- [political-classification-guide.md](political-classification-guide.md) — Classification (risk input)
- [ai-driven-analysis-guide.md](ai-driven-analysis-guide.md) — Per-file AI analysis protocol

---

## 🤖 AI Analysis Protocol for Risk Assessment

The AI agent **MUST** follow this protocol when performing risk assessment:

1. **Read this methodology** — understand the 5×5 matrix, calibration examples, coalition stability factors, AND the advanced techniques below
2. **Query MCP tools** for evidence:
   - `search_voteringar` — recent vote margins to assess coalition stability
   - `search_dokument` with `organ=FiU` — budget committee status
   - `search_dokument` with `organ=KU` — constitutional committee investigations
   - `search_anforanden` — parliamentary debate signals
   - World Bank / SCB data — economic context for budget and electoral risk
3. **Score each risk dimension** using the 5×5 matrix with evidence
4. **Apply calibration** — compare against the calibration examples above
5. **Perform cascading risk analysis** — identify risk chains and second-order effects
6. **Map risk interconnections** — which risks amplify each other?
7. **Apply Bayesian updating** — adjust base rates with new evidence
8. **Assign overall risk level** — weighted by dimension (Coalition 0.30, Policy 0.25, Budget 0.20, Electoral 0.15, External 0.10)

### Risk-to-SWOT Integration

Risk assessment results feed directly into SWOT analysis:
- **Risk Score ≥ 15 (Critical)** → SWOT Threat entry (HIGH confidence, HIGH impact)
- **Risk Score 10–14 (High)** → SWOT Threat or Weakness entry (MEDIUM+ confidence)
- **Risk Score 5–9 (Medium)** → SWOT Weakness or Threat entry (flag for monitoring)
- **Risk Score 1–4 (Low)** → Informational only; no SWOT entry required

---

## 🔗 Advanced Technique 1: Cascading Risk Analysis

Political risks rarely occur in isolation. A **cascading risk chain** models how one risk event triggers subsequent risks:

```mermaid
flowchart TD
    R1["⚠️ TRIGGER RISK:<br/>SD demands migration<br/>policy concession<br/>L=4, I=3, Score=12 🟠"]
    R1 --> R2["⚠️ SECOND-ORDER:<br/>Government refuses;<br/>coalition tension rises<br/>L=3, I=4, Score=12 🟠"]
    R2 --> R3A["⚠️ BRANCH A:<br/>SD withdraws budget<br/>support<br/>L=2, I=5, Score=10 🟠"]
    R2 --> R3B["⚠️ BRANCH B:<br/>Government compromises;<br/>L loses face<br/>L=3, I=3, Score=9 🟡"]
    R3A --> R4A["🔴 CASCADING CRISIS:<br/>No-confidence vote<br/>L=2, I=5, Score=10 🟠"]
    R3B --> R4B["🟡 MANAGED STRESS:<br/>Internal L party dissent<br/>L=3, I=2, Score=6 🟡"]

    style R1 fill:#fd7e14,color:#fff
    style R2 fill:#fd7e14,color:#fff
    style R3A fill:#dc3545,color:#fff
    style R3B fill:#ffc107,color:#000
    style R4A fill:#dc3545,color:#fff
    style R4B fill:#ffc107,color:#000
```

### Cascading Risk Construction Protocol

1. **Identify trigger risk** — the initial event that starts the chain
2. **Map first-order consequences** — what happens immediately if the trigger occurs?
3. **Map second-order consequences** — what happens as a result of the first-order effects?
4. **Identify branching points** — where does the chain split into alternative paths?
5. **Score each node** independently using the 5×5 matrix
6. **Calculate cumulative chain probability** — multiply probabilities along each path
7. **Identify circuit breakers** — what intervention could stop the chain at each stage?

### Cascading Risk Table

| Chain Stage | Risk Event | Likelihood | Impact | Score | Circuit Breaker |
|:-----------:|-----------|:----------:|:------:|:-----:|----------------|
| Trigger | `[Initial event]` | `[1-5]` | `[1-5]` | `[L×I]` | `[What stops it here?]` |
| 1st Order | `[Immediate consequence]` | `[1-5]` | `[1-5]` | `[L×I]` | `[Intervention point]` |
| 2nd Order | `[Follow-on effect]` | `[1-5]` | `[1-5]` | `[L×I]` | `[Intervention point]` |
| Terminal | `[Final outcome]` | `[1-5]` | `[1-5]` | `[L×I]` | `[Recovery action]` |

---

## 📊 Advanced Technique 2: Bayesian Updating for Risk Scores

Political risk scores should be **updated** as new evidence arrives, not just recalculated from scratch. Bayesian updating provides a disciplined framework:

### Update Protocol

| Step | Action | Example |
|:----:|--------|---------|
| 1 | **Start with prior** — the current risk score based on existing evidence | "Coalition collapse risk: L=2, I=5, Score=10 (prior)" |
| 2 | **New evidence arrives** — an MCP-observable event changes the picture | "SD publicly demands migration concession (MCP: interpellation 2025/26:789)" |
| 3 | **Assess evidence strength** — how much should this shift the score? | Strong evidence (official statement) → adjust by +1 on likelihood |
| 4 | **Update score** — adjust likelihood and/or impact based on evidence | "Coalition collapse risk: L=3, I=5, Score=15 (posterior)" |
| 5 | **Document the update** — record prior, evidence, and posterior | "Prior 10 → Evidence: SD interpellation → Posterior 15 (+5)" |

### Evidence Strength Table

| Evidence Type | Likelihood Adjustment | Example |
|-------------|:---------------------:|---------|
| Official Riksdag document (proposition, vote) | ±1 to ±2 | Vote passes/fails |
| Named politician public statement | ±1 | SD leader demands concession |
| Verified media report with named sources | ±0.5 to ±1 | DN reports coalition talks stalled |
| Single unnamed source | ±0.5 | "Sources say minister may resign" |
| Statistical data (SCB, World Bank) | ±0.5 to ±1 | GDP growth data, unemployment change |

---

## 🔗 Advanced Technique 3: Risk Interconnection Mapping

Political risks are **interconnected** — coalition risk affects budget risk, which affects electoral risk. Map these connections to understand system-level vulnerability:

```mermaid
graph TD
    CR["🤝 Coalition Risk<br/>Score: [X]"]
    PR["📋 Policy Risk<br/>Score: [X]"]
    BR["💰 Budget Risk<br/>Score: [X]"]
    ER["🗳️ Electoral Risk<br/>Score: [X]"]
    XR["🌍 External Risk<br/>Score: [X]"]

    CR -->|"Coalition instability delays<br/>policy implementation"| PR
    CR -->|"Budget depends on<br/>coalition agreement"| BR
    PR -->|"Policy failures erode<br/>electoral support"| ER
    BR -->|"Budget cuts affect<br/>policy capacity"| PR
    XR -->|"EU pressure forces<br/>unwanted policy"| PR
    XR -->|"Economic headwinds<br/>squeeze budget"| BR
    ER -->|"Election proximity increases<br/>coalition posturing"| CR

    style CR fill:#dc3545,color:#fff
    style PR fill:#fd7e14,color:#fff
    style BR fill:#ffc107,color:#000
    style ER fill:#0d6efd,color:#fff
    style XR fill:#6f42c1,color:#fff
```

### Interconnection Strength Assessment

| From → To | Connection Strength | Mechanism | Evidence |
|:---------:|:-------------------:|-----------|---------|
| Coalition → Budget | **Strong** | Budget requires coalition majority | `[vote records]` |
| Coalition → Policy | **Strong** | Policy delivery requires coalition unity | `[committee reports]` |
| Policy → Electoral | **Medium** | Policy success/failure affects polls | `[polling data]` |
| External → Budget | **Medium** | EU/economic pressures constrain budget | `[SCB/World Bank data]` |
| Electoral → Coalition | **Medium** | Election proximity strains coalition | `[calendar, debate rhetoric]` |

**System-Level Risk Assessment:** When ≥3 risk categories score ≥10 (High), the system is in a **fragile state** where any single trigger event could cascade across multiple risk dimensions simultaneously.

---

## 🌳 Advanced Technique 4: Scenario Tree Analysis

For complex risk situations with multiple branching points, construct a **scenario tree** showing probability-weighted outcomes:

```mermaid
flowchart TD
    START["📊 Current Situation<br/>Coalition majority holds"]
    START -->|"60%"| A["🟢 Stability<br/>Coalition remains intact"]
    START -->|"30%"| B["🟡 Stress<br/>Coalition strained but holds"]
    START -->|"10%"| C["🔴 Crisis<br/>Coalition breaks"]

    A -->|"80%"| A1["Budget passes normally"]
    A -->|"20%"| A2["Budget amended but passes"]

    B -->|"50%"| B1["Compromise found, stability restored"]
    B -->|"30%"| B2["Ongoing tension, weakened governance"]
    B -->|"20%"| B3["Delayed collapse"]

    C -->|"60%"| C1["New coalition formed"]
    C -->|"40%"| C2["Extraordinary election"]

    style START fill:#0d6efd,color:#fff
    style A fill:#28a745,color:#fff
    style B fill:#ffc107,color:#000
    style C fill:#dc3545,color:#fff
```

### Scenario Tree Table

| Path | Probability | Outcome | Key Trigger | Watch Indicator |
|------|:----------:|---------|------------|----------------|
| Stability → Budget passes | 48% (60%×80%) | Normal governance continues | SD confirms budget support | SD budget stance statement |
| Stability → Budget amended | 12% (60%×20%) | Minor adjustments, governance continues | Partial SD objections | Committee amendment volume |
| Stress → Compromise | 15% (30%×50%) | Short-term disruption resolved | Public negotiation succeeds | Joint coalition statement |
| Crisis → New coalition | 6% (10%×60%) | Government changes, democracy functions | Coalition collapse triggers realignment | No-confidence vote result |
| Crisis → Election | 4% (10%×40%) | Extraordinary election called | No alternative coalition possible | Riksdag vote on dissolution |

---

## 📡 MCP Data Sources for Risk Assessment

The following table maps each risk category to the primary MCP tools and query strategies used to gather evidence for scoring:

| Risk Category | Primary MCP Tools | Query Strategy |
|---------------|-------------------|----------------|
| **Coalition stability** | `search_voteringar`, `analyze_voting_patterns` | Track M+KD+L+SD voting cohesion; detect defections and abstention spikes |
| **Policy implementation** | `get_propositioner`, `search_dokument` | Monitor committee referrals, plenary vote outcomes, and reservation filings |
| **Legislative integrity** | `search_voteringar`, `get_betankanden` | Track contested votes (margin <10 seats), reservation analysis per party |
| **Economic governance** | `get_propositioner`, `search_dokument` | Budget bills (FiU), fiscal forecasts, spring amending budgets |
| **Social cohesion** | `search_anforanden`, `get_interpellationer` | Migration/welfare debate intensity; interpellation frequency by topic |
| **Democratic process** | `get_calendar_events`, `search_voteringar` | Participation rates, vote margins, plenary attendance patterns |

### Query Examples

```bash
# Coalition cohesion: check if M+KD+L+SD voted together on recent budget
search_voteringar(rm="2025/26", bet="FiU1", groupBy="parti")

# Policy risk: track contested committee reports
get_betankanden(rm="2025/26", organ="SfU")  # Social insurance committee

# Democratic process: monitor plenary participation
search_voteringar(rm="2025/26", rost="Frånvarande", groupBy="parti")

# Social cohesion: migration debate intensity
search_anforanden(text="migration", rm="2025/26")
```

---

## ⚠️ Anti-Pattern Warning

> **REJECTED:** Generic risk statements like _"medium risk"_ without specific L×I scores, evidence, or calibration examples are **REJECTED**. Every risk assessment MUST include:
>
> 1. **Explicit Likelihood (1–5) and Impact (1–5) scores** with justification
> 2. **MCP evidence** — specific document IDs, vote records, or speech references
> 3. **Calibration anchor** — which calibration example is this most similar to?
> 4. **Confidence level** — HIGH (multiple MCP sources), MEDIUM (single source), LOW (inference only)
>
> ❌ _"Coalition risk is medium"_ → Not actionable, no evidence, no scores  
> ✅ _"Coalition risk: L=3, I=4, Score=12 (HIGH). Evidence: SD voted against government on SfU14 punkt 3 (search_voteringar rm=2025/26). Calibrated against 'SD conditionally supports government on migration' scenario."_

---

**Document Control:**  
- **Path:** `/analysis/methodologies/political-risk-methodology.md`  
- **ISMS Reference:** [Risk_Assessment_Methodology.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Assessment_Methodology.md)  
- **Version:** 2.0  
- **Advanced Techniques:** Cascading Risk, Bayesian Updating, Risk Interconnection, Scenario Trees  
- **Classification:** Public  
- **Next Review:** 2026-06-30
