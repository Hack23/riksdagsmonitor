<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">📚 Analysis Methodologies — Political Intelligence Framework</h1>

<p align="center">
  <strong>📊 Comprehensive Methodology Library for Riksdagsmonitor Political Analysis</strong><br>
  <em>🎯 Evidence-Based · Multi-Framework · ISMS-Compliant · AI-Driven</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-4.1-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--31-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 4.1 | **📅 Last Updated:** 2026-06-01 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-30  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 📚 Architecture Documentation Map

<table class="documentation-map">
  <thead>
    <tr>
      <th>Document</th>
      <th>Focus</th>
      <th>Description</th>
      <th>Documentation Link</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><a href="../../ARCHITECTURE.md">Architecture</a></strong></td>
      <td>🏛️ Architecture</td>
      <td>C4 model showing current system structure</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/ARCHITECTURE.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../FUTURE_ARCHITECTURE.md">Future Architecture</a></strong></td>
      <td>🏛️ Architecture</td>
      <td>C4 model showing future system structure</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/FUTURE_ARCHITECTURE.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../SECURITY_ARCHITECTURE.md">Security Architecture</a></strong></td>
      <td>🛡️ Security</td>
      <td>Current security implementation</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/SECURITY_ARCHITECTURE.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../THREAT_MODEL.md">Threat Model</a></strong></td>
      <td>🎯 Security</td>
      <td>Threat analysis</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/THREAT_MODEL.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../DATA_MODEL.md">Data Model</a></strong></td>
      <td>📊 Data</td>
      <td>Current data structures and relationships</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/DATA_MODEL.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../FLOWCHART.md">Flowcharts</a></strong></td>
      <td>🔄 Process</td>
      <td>Current data processing workflows</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/FLOWCHART.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../SWOT.md">SWOT Analysis</a></strong></td>
      <td>💼 Business</td>
      <td>Current strategic assessment</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/SWOT.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../../WORKFLOWS.md">Workflows</a></strong></td>
      <td>⚙️ DevOps</td>
      <td>CI/CD documentation</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/WORKFLOWS.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../README.md">Analysis Directory</a></strong></td>
      <td>🔬 Analysis</td>
      <td>Analysis directory overview and structure</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/README.md">View Source</a></td>
    </tr>
    <tr>
      <td><strong><a href="../templates/README.md">Analysis Templates</a></strong></td>
      <td>📋 Templates</td>
      <td>8 structured analysis output templates</td>
      <td><a href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/templates/README.md">View Source</a></td>
    </tr>
  </tbody>
</table>

---

## 🛡️ ISMS Policy Alignment

| Policy | Description | Relevance to Analysis Methodologies |
|--------|-------------|-------------------------------------|
| **[Information Security Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md)** | Organization-wide security governance and risk management | Defines risk assessment methodology adapted for political risk scoring |
| **[AI Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md)** | Responsible AI usage, transparency, and human oversight | Governs LLM-driven analysis: quality gates, bias mitigation, evidence requirements |
| **[Classification Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Classification_Policy.md)** | Data classification scheme and handling requirements | Classification guide aligns sensitivity levels with ISMS classification tiers |
| **[Secure Development Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md)** | Secure coding standards and SDLC security gates | Style guide and quality gates enforce structured, reviewable analytical output |
| **[Open Source Policy](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md)** | Open source contribution and licensing governance | All methodology documents published under project license for transparency |

---

## 🎯 Purpose

This directory contains the **authoritative methodology library** for all political intelligence analysis performed by Riksdagsmonitor's AI-driven agentic workflows. Each methodology document defines the analytical framework, evaluation criteria, evidence standards, and quality requirements that AI agents MUST follow when producing political intelligence.

> **Key Principle:** Scripts download data ONLY. AI performs ALL analytical content generation. These methodologies guide AI agents — they are never executed by scripts.

**Core Principle:** Every analytical claim requires verifiable evidence sourced from Swedish parliamentary open data. Opinion-based analysis, boilerplate summaries, and software-centric threat models (such as STRIDE, DREAD, or PASTA) are explicitly rejected.

**Design Philosophy:** The six methodologies form a layered analytical pipeline — classification provides the foundation, risk and threat assessments build the analytical core, SWOT synthesizes strategic implications, style standards enforce writing quality, and the AI guide orchestrates the entire pipeline with quality gates.

---

## 🔄 Methodology Pipeline — How AI Agents Apply Frameworks

The following diagram illustrates the sequential pipeline that an AI agent follows when processing an incoming Riksdag data file:

```mermaid
flowchart TD
    Start([📥 Riksdag MCP Data Received]) --> Read[📚 Agent Reads All 6 Methodology Docs]
    Read --> Classify[🏷️ Step 1: Classify Event<br/>7-Dimension Classification]
    Classify --> Risk[⚠️ Step 2: Assess Risk<br/>Likelihood × Impact Matrix]
    Risk --> Threat[🎯 Step 3: Analyze Threats<br/>Political Threat Taxonomy<br/>+ 3 Supporting Frameworks]
    Threat --> SWOT[💼 Step 4: Build SWOT<br/>Evidence-Based Quadrants]
    SWOT --> Write[📝 Step 5: Write Analysis<br/>Depth Level 1/2/3]
    Write --> QualityGate{✅ Quality Gate<br/>Score ≥ 7.0/10?}
    QualityGate -->|Yes ✅| Publish([📤 Publish Analysis])
    QualityGate -->|No ❌| Revise[🔄 Revise & Re-Assess]
    Revise --> Classify

    style Start fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    style Read fill:#4527A0,stroke:#311B92,color:#FFFFFF
    style Classify fill:#00695C,stroke:#004D40,color:#FFFFFF
    style Risk fill:#E65100,stroke:#BF360C,color:#FFFFFF
    style Threat fill:#B71C1C,stroke:#880E4F,color:#FFFFFF
    style SWOT fill:#1B5E20,stroke:#1B5E20,color:#FFFFFF
    style Write fill:#4A148C,stroke:#311B92,color:#FFFFFF
    style QualityGate fill:#F57F17,stroke:#E65100,color:#FFFFFF
    style Publish fill:#2E7D32,stroke:#1B5E20,color:#FFFFFF
    style Revise fill:#D84315,stroke:#BF360C,color:#FFFFFF
```

---

## 📊 Methodology Relationship Map

This diagram shows how the six methodology documents relate to each other and feed into the final analysis output:

```mermaid
graph LR
    CG[🏷️ Classification Guide<br/>7 Dimensions] --> RG[⚠️ Risk Methodology<br/>5×5 Likelihood × Impact]
    CG --> TF[🎯 Threat Framework<br/>6 Political Threat Dimensions]
    RG --> SW[💼 SWOT Framework<br/>Evidence-Based Quadrants]
    TF --> SW
    SW --> SG[📝 Style Guide<br/>3 Depth Levels]
    SG --> AI[🤖 AI Analysis Guide<br/>Quality Gates]
    AI -->|Orchestrates all| CG
    CG -.->|Sensitivity feeds| TF
    RG -.->|Scores inform| TF
    TF -.->|Threats map to| SW

    style CG fill:#00695C,stroke:#004D40,color:#FFFFFF
    style RG fill:#E65100,stroke:#BF360C,color:#FFFFFF
    style TF fill:#B71C1C,stroke:#880E4F,color:#FFFFFF
    style SW fill:#1B5E20,stroke:#1B5E20,color:#FFFFFF
    style SG fill:#4A148C,stroke:#311B92,color:#FFFFFF
    style AI fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
```

---

## 📋 Methodology Summary Table

| Priority | Document | Key Content | Dimensions / Frameworks | When to Apply |
|----------|----------|-------------|-------------------------|---------------|
| **1** | **[Political Classification Guide](political-classification-guide.md)** | 7-dimension event classification, sensitivity levels, policy domain taxonomy, urgency matrix | Sensitivity (4 levels), Democratic Integrity, Policy Urgency, Economic Impact, Governance Impact, Political Capital, Legislative Impact | **First** — every incoming Riksdag document must be classified before any analysis begins |
| **2** | **[Political Risk Methodology](political-risk-methodology.md)** | Likelihood × Impact scoring, 8 risk categories, 5×5 matrix, cascading risk analysis | Policy, Legislative, Economic, Social, Security, Diplomatic, Coalition, Constitutional | **Second** — after classification, assess political risk using calibrated scoring |
| **3** | **[Political Threat Framework](political-threat-framework.md)** | Multi-framework threat analysis: Political Threat Taxonomy + 3 supporting frameworks | Narrative Integrity, Legislative Integrity, Accountability, Transparency, Democratic Process, Power Balance | **Third** — apply threat analysis using political frameworks (never STRIDE/DREAD/PASTA) |
| **4** | **[Political SWOT Framework](political-swot-framework.md)** | Evidence-based SWOT, confidence levels, 180-day decay, group-to-landscape aggregation | Strengths, Weaknesses, Opportunities, Threats — each with confidence (HIGH/MEDIUM/LOW) | **Fourth** — synthesize classification + risk + threat into strategic SWOT assessment |
| **5** | **[Political Style Guide](political-style-guide.md)** | Writing standards, 3 depth levels, evidence density requirements, anti-patterns | Level 1 Surface (200–500 words), Level 2 Strategic (800–2,000 words), Level 3 Intelligence (2,000–5,000 words) | **Fifth** — apply writing standards when drafting the analysis document |
| **6** | **[AI-Driven Analysis Guide](ai-driven-analysis-guide.md)** | Per-file AI protocol, quality gates, weighted scoring (7.0/10 minimum), conflict resolution | Evidence (25%), Depth (25%), Structural (20%), Actionable (15%), Neutrality (15%) | **Always** — orchestrates the entire pipeline; AI agents must read this first |

---

## 📐 Methodology Architecture

```mermaid
graph TB
    subgraph "🏛️ Core Analysis Engine"
        GUIDE["🤖 AI-Driven Analysis Guide<br/><i>Master Protocol</i>"]
        STYLE["✍️ Political Style Guide<br/><i>Writing Standards</i>"]
    end

    subgraph "🔬 Analytical Frameworks"
        CLASS["🏷️ Classification Guide<br/><i>7-Dimension Taxonomy</i>"]
        RISK["⚠️ Risk Methodology<br/><i>Cascading Risk Model</i>"]
        SWOT["💼 SWOT Framework<br/><i>TOWS + Cross-SWOT</i>"]
        THREAT["🎭 Threat Framework<br/><i>4-Framework Approach</i>"]
    end

    subgraph "📋 ISMS Reference Layer"
        ISMS1["📖 ISMS Classification"]
        ISMS2["📖 ISMS Risk Assessment"]
        ISMS3["📖 ISMS Style Guide"]
        ISMS4["📖 ISMS Threat Modeling"]
    end

    GUIDE -->|"governs"| CLASS
    GUIDE -->|"governs"| RISK
    GUIDE -->|"governs"| SWOT
    GUIDE -->|"governs"| THREAT
    STYLE -->|"standards"| CLASS
    STYLE -->|"standards"| RISK
    STYLE -->|"standards"| SWOT
    STYLE -->|"standards"| THREAT
    ISMS1 -.->|"adapted from"| CLASS
    ISMS2 -.->|"adapted from"| RISK
    ISMS3 -.->|"adapted from"| STYLE
    ISMS4 -.->|"adapted from"| THREAT

    style GUIDE fill:#0d6efd,color:#fff,stroke:#0a58ca,stroke-width:2px
    style STYLE fill:#6610f2,color:#fff,stroke:#520dc2,stroke-width:2px
    style CLASS fill:#198754,color:#fff,stroke:#146c43,stroke-width:2px
    style RISK fill:#dc3545,color:#fff,stroke:#b02a37,stroke-width:2px
    style SWOT fill:#fd7e14,color:#fff,stroke:#ca6510,stroke-width:2px
    style THREAT fill:#d63384,color:#fff,stroke:#ab296a,stroke-width:2px
    style ISMS1 fill:#e9ecef,color:#212529,stroke:#adb5bd
    style ISMS2 fill:#e9ecef,color:#212529,stroke:#adb5bd
    style ISMS3 fill:#e9ecef,color:#212529,stroke:#adb5bd
    style ISMS4 fill:#e9ecef,color:#212529,stroke:#adb5bd
```

---

## 📖 Methodology Catalog

### 🤖 AI-Driven Analysis Guide — `ai-driven-analysis-guide.md`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Master protocol governing all AI-driven political intelligence analysis |
| **Scope** | All agentic workflows, all analysis types, all output artifacts |
| **Key Rules** | Folder isolation · AI-only content · Multi-framework depth · Quality gates |
| **Version** | 2.0 |

**Core Principles:**
- **Folder Isolation**: Every workflow writes ONLY to its own `analysis/daily/YYYY-MM-DD/{articleType}/` subfolder
- **AI-Only Content**: Scripts must NEVER generate analysis prose, SWOT entries, risk scores, or template content
- **15-Minute Minimum**: Every deep analysis cycle must invest ≥15 minutes of AI reasoning time
- **Quality Gates**: Automated bash checks validate every analysis artifact before commit

---

### 🏷️ Political Classification Guide — `political-classification-guide.md`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Multi-dimensional taxonomy for political document and event classification |
| **Dimensions** | 7: Public Interest · Democratic Integrity · Policy Urgency · Economic Impact · Governance · Political Capital · Legislative Impact |
| **Confidence Levels** | HIGH (≥80%) · MEDIUM (60–79%) · LOW (<60%) |
| **Version** | 2.0 |

```mermaid
graph LR
    DOC["📄 Parliamentary<br/>Document"] --> C1["🔍 Public Interest<br/>Sensitivity"]
    DOC --> C2["🏛️ Democratic<br/>Integrity Impact"]
    DOC --> C3["⏰ Policy<br/>Urgency"]
    DOC --> C4["💰 Economic<br/>Impact"]
    DOC --> C5["⚙️ Governance<br/>Impact"]
    DOC --> C6["🎯 Political<br/>Capital Impact"]
    DOC --> C7["📜 Legislative<br/>Impact"]
    C1 --> OUT["🏷️ Overall<br/>Classification"]
    C2 --> OUT
    C3 --> OUT
    C4 --> OUT
    C5 --> OUT
    C6 --> OUT
    C7 --> OUT

    style DOC fill:#0d6efd,color:#fff,stroke:#0a58ca,stroke-width:2px
    style OUT fill:#198754,color:#fff,stroke:#146c43,stroke-width:2px
    style C1 fill:#fd7e14,color:#fff,stroke:#ca6510
    style C2 fill:#dc3545,color:#fff,stroke:#b02a37
    style C3 fill:#6f42c1,color:#fff,stroke:#59359a
    style C4 fill:#20c997,color:#000,stroke:#1aa179
    style C5 fill:#0dcaf0,color:#000,stroke:#0aa2c0
    style C6 fill:#d63384,color:#fff,stroke:#ab296a
    style C7 fill:#ffc107,color:#000,stroke:#cc9a06
```

---

### ⚠️ Political Risk Assessment Methodology — `political-risk-methodology.md`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Systematic risk identification, scoring, and cascading impact analysis |
| **Risk Categories** | 8: Policy · Legislative · Economic · Social · Security · Diplomatic · Coalition · Constitutional |
| **Scoring Model** | Likelihood (1–5) × Impact (1–5) = Risk Score (1–25) |
| **Advanced Features** | Cascading risk chains · Political Temperature Index · Risk velocity tracking |
| **Version** | 2.0 |

```mermaid
graph TD
    ID["🔍 Risk<br/>Identification"] --> ASSESS["📊 Risk<br/>Assessment"]
    ASSESS --> SCORE["🎯 Risk<br/>Scoring"]
    SCORE --> CASCADE["⛓️ Cascading<br/>Impact Analysis"]
    CASCADE --> TEMP["🌡️ Political<br/>Temperature Index"]
    TEMP --> PRIOR["🏆 Risk<br/>Prioritisation"]
    PRIOR --> MITIG["🛡️ Mitigation<br/>Strategies"]

    ID -->|"8 categories"| CAT["Policy · Legislative<br/>Economic · Social<br/>Security · Diplomatic<br/>Coalition · Constitutional"]

    style ID fill:#0d6efd,color:#fff,stroke:#0a58ca,stroke-width:2px
    style ASSESS fill:#6f42c1,color:#fff,stroke:#59359a,stroke-width:2px
    style SCORE fill:#fd7e14,color:#fff,stroke:#ca6510,stroke-width:2px
    style CASCADE fill:#dc3545,color:#fff,stroke:#b02a37,stroke-width:2px
    style TEMP fill:#d63384,color:#fff,stroke:#ab296a,stroke-width:2px
    style PRIOR fill:#198754,color:#fff,stroke:#146c43,stroke-width:2px
    style MITIG fill:#20c997,color:#000,stroke:#1aa179,stroke-width:2px
    style CAT fill:#e9ecef,color:#212529,stroke:#adb5bd
```

---

### 💼 Political SWOT Analysis Framework — `political-swot-framework.md`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Multi-stakeholder strategic analysis for political events and policy decisions |
| **Stakeholder Lenses** | Government Coalition · Opposition Bloc · Citizens/Civil Society · Economic Actors · International Observers |
| **Advanced Features** | TOWS Matrix · Cross-SWOT Interference · Scenario Generation · Temporal Dynamics |
| **Version** | 2.0 |

```mermaid
quadrantChart
    title Political SWOT Strategic Quadrant
    x-axis "Internal Weaknesses" --> "Internal Strengths"
    y-axis "External Threats" --> "External Opportunities"
    quadrant-1 "SO Strategies (Leverage)"
    quadrant-2 "WO Strategies (Improve)"
    quadrant-3 "WT Strategies (Defend)"
    quadrant-4 "ST Strategies (Diversify)"
```

---

### 🎭 Political Threat Analysis Framework — `political-threat-framework.md`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Multi-framework threat modeling for democratic process threats |
| **Frameworks** | 4: Attack Trees + Political Kill Chain + Diamond Model + Actor Profiling |
| **Threat Taxonomy** | 6 Categories: Narrative Integrity · Legislative Integrity · Accountability · Transparency · Democratic Process · Power Balance |
| **Threat Agents** | 6: Ruling Coalition · Opposition · External Actors · Special Interests · Media · Institutional |
| **Version** | 3.0 |

> ⚠️ **STRIDE is NOT used.** The Political Threat Taxonomy replaces STRIDE with politically-native categories designed for democratic function analysis.

```mermaid
graph TB
    subgraph "🎯 Multi-Framework Threat Analysis"
        AT["🌳 Attack Trees<br/><i>HOW threats succeed</i>"]
        KC["⚔️ Political Kill Chain<br/><i>WHERE in lifecycle</i>"]
        DM["💎 Diamond Model<br/><i>WHO is involved</i>"]
        AP["👤 Actor Profiling<br/><i>WHY they act</i>"]
    end

    subgraph "🏛️ Political Threat Taxonomy"
        NI["📰 Narrative<br/>Integrity"]
        LI["📜 Legislative<br/>Integrity"]
        AC["🔍 Accountability"]
        TR["🔓 Transparency"]
        DP["🗳️ Democratic<br/>Process"]
        PB["⚖️ Power<br/>Balance"]
    end

    AT --> NI & LI & AC & TR & DP & PB
    KC --> NI & LI & AC & TR & DP & PB
    DM --> NI & LI & AC & TR & DP & PB
    AP --> NI & LI & AC & TR & DP & PB

    style AT fill:#dc3545,color:#fff,stroke:#b02a37,stroke-width:2px
    style KC fill:#fd7e14,color:#fff,stroke:#ca6510,stroke-width:2px
    style DM fill:#0d6efd,color:#fff,stroke:#0a58ca,stroke-width:2px
    style AP fill:#6f42c1,color:#fff,stroke:#59359a,stroke-width:2px
    style NI fill:#198754,color:#fff,stroke:#146c43
    style LI fill:#198754,color:#fff,stroke:#146c43
    style AC fill:#198754,color:#fff,stroke:#146c43
    style TR fill:#198754,color:#fff,stroke:#146c43
    style DP fill:#198754,color:#fff,stroke:#146c43
    style PB fill:#198754,color:#fff,stroke:#146c43
```

---

### ✍️ Political Intelligence Style Guide — `political-style-guide.md`

| Attribute | Value |
|-----------|-------|
| **Purpose** | Establishes writing standards for all political intelligence output |
| **Scope** | Article tone, evidence citation standards, Mermaid diagram requirements, confidence labeling |
| **Key Standards** | Evidence tables (not prose) · dok_id citations · Color-coded diagrams · Swedish political terminology |
| **Version** | 2.0 |

---

## 🔗 ISMS Reference Adaptations

The analysis methodologies are adapted from Hack23's ISO 27001/NIST CSF/CIS Controls ISMS framework. The `reference/` directory contains mapping documents showing how cybersecurity risk concepts translate to political intelligence:

| Reference Document | ISMS Source | Political Adaptation |
|---|---|---|
| [`isms-classification-adaptation.md`](../reference/isms-classification-adaptation.md) | ISO 27001 A.5.12–A.5.13 | Multi-dimensional political event classification |
| [`isms-risk-assessment-adaptation.md`](../reference/isms-risk-assessment-adaptation.md) | ISO 27001 A.8.8, NIST CSF ID.RA | Cascading political risk assessment |
| [`isms-style-guide-adaptation.md`](../reference/isms-style-guide-adaptation.md) | ISO 27001 A.5.37 | Evidence-based political writing standards |
| [`isms-threat-modeling-adaptation.md`](../reference/isms-threat-modeling-adaptation.md) | ISO 27001 A.5.7, NIST CSF ID.RA-3 | Multi-framework political threat modeling |

---

## 🔄 Methodology Integration Flow

```mermaid
sequenceDiagram
    participant WF as 🔄 Agentic Workflow
    participant DL as 📥 Data Download
    participant CLASS as 🏷️ Classification
    participant RISK as ⚠️ Risk Assessment
    participant SWOT as 💼 SWOT Analysis
    participant THREAT as 🎭 Threat Analysis
    participant SIG as 📈 Significance
    participant SYNTH as 🧩 Synthesis
    participant QG as ✅ Quality Gate
    participant ART as 📰 Article Generation

    WF->>DL: Fetch Riksdag/Regeringen data
    DL->>CLASS: Raw documents + metadata
    
    Note over CLASS,THREAT: AI performs ALL analysis<br/>(never scripted)
    
    CLASS->>RISK: Classification results
    CLASS->>SWOT: Document classification
    CLASS->>THREAT: Document classification
    
    par Parallel Analysis
        RISK->>SIG: Risk scores + cascading analysis
        SWOT->>SIG: SWOT matrices + TOWS
        THREAT->>SIG: Threat profiles + kill chains
    end
    
    SIG->>SYNTH: Significance scores
    SYNTH->>QG: Synthesis summary
    
    QG-->>QG: Validate structure,<br/>evidence, Mermaid,<br/>confidence, citations
    QG->>ART: Approved analysis
    ART->>WF: HTML article + translations

    Note over QG: Quality gate checks:<br/>✓ Evidence tables<br/>✓ Mermaid diagrams<br/>✓ dok_id citations<br/>✓ Confidence labels<br/>✓ No stub content
```

---

## 🎯 Article-Type-Specific Methodology Selection

Different parliamentary document types require **different analytical emphasis**. This matrix maps which methodologies are PRIMARY vs SUPPORTING for each workflow type:

```mermaid
graph LR
    subgraph "🔴 Always Required"
        CLASS["🏷️ Classification"]
        RISK["⚠️ Risk Assessment"]
    end

    subgraph "🟠 Context-Dependent Primary"
        SWOT["💼 SWOT"]
        THREAT["🎭 Threat Analysis"]
        SIG["📈 Significance"]
        STAKE["👥 Stakeholder"]
    end

    CR["📋 Committee<br/>Reports"] -->|"PRIMARY"| SWOT
    CR -->|"PRIMARY"| THREAT
    PR["📜 Propositions"] -->|"PRIMARY"| RISK
    PR -->|"PRIMARY"| STAKE
    MO["✊ Motions"] -->|"PRIMARY"| SWOT
    MO -->|"PRIMARY"| SIG
    IP["❓ Interpellations"] -->|"PRIMARY"| THREAT
    IP -->|"PRIMARY"| STAKE

    style CR fill:#198754,color:#fff,stroke:#146c43,stroke-width:2px
    style PR fill:#0d6efd,color:#fff,stroke:#0a58ca,stroke-width:2px
    style MO fill:#fd7e14,color:#fff,stroke:#ca6510,stroke-width:2px
    style IP fill:#dc3545,color:#fff,stroke:#b02a37,stroke-width:2px
    style CLASS fill:#6c757d,color:#fff,stroke:#495057,stroke-width:2px
    style RISK fill:#6c757d,color:#fff,stroke:#495057,stroke-width:2px
    style SWOT fill:#ffc107,color:#000,stroke:#cc9a06,stroke-width:2px
    style THREAT fill:#d63384,color:#fff,stroke:#ab296a,stroke-width:2px
    style SIG fill:#6f42c1,color:#fff,stroke:#59359a,stroke-width:2px
    style STAKE fill:#0dcaf0,color:#000,stroke:#0aa2c0,stroke-width:2px
```

| Article Type | Classification | Risk | SWOT | Threat | Significance | Stakeholder | Unique Focus |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Committee Reports** | ✅ | ✅ | 🔴 PRIMARY | 🔴 PRIMARY | ✅ | ✅ | Voting splits, reservation analysis, committee composition effects |
| **Propositions** | ✅ | 🔴 PRIMARY | ✅ | ✅ | ✅ | 🔴 PRIMARY | Legislative pipeline stage, budget impact, policy domain cascading effects |
| **Motions** | ✅ | ✅ | 🔴 PRIMARY | ✅ | 🔴 PRIMARY | ✅ | Opposition strategy patterns, signalverdi, cross-party co-sponsorship |
| **Interpellations** | ✅ | ✅ | ✅ | 🔴 PRIMARY | ✅ | 🔴 PRIMARY | Minister accountability scoring, response quality, evasion detection |
| **Evening Analysis** | ✅ | ✅ | 🔴 PRIMARY | ✅ | ✅ | ✅ | Daily political pulse, vote results, debate intensity metrics |
| **Realtime Monitor** | ✅ | 🔴 PRIMARY | ✅ | ✅ | 🔴 PRIMARY | ✅ | Breaking event urgency, political temperature spike detection |
| **Weekly Review** | ✅ | ✅ | 🔴 PRIMARY | ✅ | ✅ | ✅ | Cross-type trend detection, week-over-week pattern shifts |
| **Week Ahead** | ✅ | 🔴 PRIMARY | ✅ | 🔴 PRIMARY | ✅ | ✅ | Prospective risk landscape, scheduled debates, expected vote outcomes |
| **Monthly Review** | ✅ | ✅ | 🔴 PRIMARY | ✅ | ✅ | 🔴 PRIMARY | Legislative throughput, party productivity, government scorecard |
| **Month Ahead** | ✅ | 🔴 PRIMARY | ✅ | 🔴 PRIMARY | ✅ | ✅ | Strategic political calendar, major policy decision forecast |

> **Reading the matrix:** ✅ = always required for all types. 🔴 PRIMARY = the methodology that should receive the most analytical depth and word count for this article type. Each workflow must apply ALL methodologies but allocate **more time and depth** to PRIMARY ones.

---

## 📏 Quality Standards

Every analysis artifact produced using these methodologies MUST contain:

| Requirement | Description | Enforcement |
|-------------|-------------|-------------|
| **Evidence Tables** | Structured tables with dok_id citations, not free-form prose | Quality gate Check 1 |
| **Mermaid Diagrams** | ≥1 color-coded diagram with `style` directives per analysis file | Quality gate Check 2 |
| **Confidence Labels** | HIGH/MEDIUM/LOW confidence on every assessment | Quality gate Check 3 |
| **dok_id Citations** | Every claim linked to specific parliamentary document IDs | Quality gate Check 4 |
| **Template Compliance** | Must follow the corresponding template in `analysis/templates/` | Quality gate Check 5 |
| **No Stub Content** | No boilerplate phrases like "_No strengths identified_" | Quality gate Check 6 |

---

## ✅ Quality Gate Requirements

All analysis produced under these methodologies must meet the following minimum quality requirements before publication:

### Weighted Quality Score (Minimum 7.0/10)

| Dimension | Weight | Criteria | Fail Indicators |
|-----------|--------|----------|-----------------|
| **Evidence** | 25% | Every claim cites Riksdag MCP data; confidence levels stated; no opinion-only entries | Uncited claims, missing confidence, assertions without data |
| **Depth** | 25% | Appropriate depth level (L1/L2/L3) applied; word count within range; citation count met | Wrong depth level, under minimum citations, superficial coverage |
| **Structural** | 20% | Hack23 header present; metadata complete; Mermaid diagram included; structured tables used | Missing header, no diagram, placeholder content, broken formatting |
| **Actionable** | 15% | Analysis includes concrete implications; stakeholder impact identified; forward-looking recommendations | Purely descriptive without implications, no stakeholder analysis |
| **Neutrality** | 15% | Balanced perspective; no partisan framing; multiple viewpoints acknowledged; factual tone | One-sided framing, loaded language, missing counter-perspectives |

### Structural Checklist

- [ ] Hack23 header with metadata (Owner, Version, Date, Classification)
- [ ] At least one color-coded Mermaid diagram
- [ ] Classification completed across all 7 dimensions
- [ ] SWOT with ≥2 evidence-based entries per quadrant
- [ ] Risk score calculated using 5×5 Likelihood × Impact matrix
- [ ] Threat analysis using Political Threat Taxonomy (not STRIDE/DREAD/PASTA)
- [ ] Appropriate depth level selected and word/citation counts met
- [ ] Significance score (1–10) with justification

---

## 🌳 Methodology Selection Decision Tree

Use this flowchart to determine which methodology to apply for a given analytical task:

```mermaid
flowchart TD
    Start([🎯 New Analysis Task]) --> Q1{What is the<br/>primary need?}

    Q1 -->|Categorize a Riksdag event| CG[🏷️ Classification Guide<br/>Apply 7 dimensions]
    Q1 -->|Quantify political risk| RM[⚠️ Risk Methodology<br/>Likelihood × Impact]
    Q1 -->|Identify political threats| TF[🎯 Threat Framework<br/>6 Political Threat Dimensions]
    Q1 -->|Strategic assessment| SW[💼 SWOT Framework<br/>Evidence-based quadrants]
    Q1 -->|Write analysis article| SG[📝 Style Guide<br/>Select depth level]
    Q1 -->|Full pipeline analysis| AI[🤖 AI Analysis Guide<br/>Orchestrate all frameworks]

    CG --> Q2{Severity ≥ HIGH?}
    Q2 -->|Yes| RM
    Q2 -->|No| SG

    RM --> Q3{Risk Score ≥ 10?}
    Q3 -->|Yes| TF
    Q3 -->|No| SW

    TF --> SW
    SW --> SG
    SG --> AI

    AI --> Gate{Quality Gate<br/>≥ 7.0/10?}
    Gate -->|✅ Pass| Done([✅ Analysis Complete])
    Gate -->|❌ Fail| Revise[🔄 Revise from<br/>Weakest Dimension]
    Revise --> Q1

    style Start fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    style Q1 fill:#F57F17,stroke:#E65100,color:#000000
    style CG fill:#00695C,stroke:#004D40,color:#FFFFFF
    style RM fill:#E65100,stroke:#BF360C,color:#FFFFFF
    style TF fill:#B71C1C,stroke:#880E4F,color:#FFFFFF
    style SW fill:#1B5E20,stroke:#1B5E20,color:#FFFFFF
    style SG fill:#4A148C,stroke:#311B92,color:#FFFFFF
    style AI fill:#1565C0,stroke:#0D47A1,color:#FFFFFF
    style Q2 fill:#F57F17,stroke:#E65100,color:#000000
    style Q3 fill:#F57F17,stroke:#E65100,color:#000000
    style Gate fill:#F57F17,stroke:#E65100,color:#000000
    style Done fill:#2E7D32,stroke:#1B5E20,color:#FFFFFF
    style Revise fill:#D84315,stroke:#BF360C,color:#FFFFFF
```

---

## 🚫 Anti-Patterns — What NOT To Do

The following practices are **explicitly prohibited** across all methodologies:

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|-------------|------------------|
| **Using STRIDE, DREAD, or PASTA** | These are software security threat models, not political intelligence frameworks | Use Political Threat Taxonomy (6 dimensions), Attack Trees, Kill Chain, Diamond Model, Actor Profiling |
| **Boilerplate summaries** | Generic text adds no analytical value; wastes reader attention | Every paragraph must contain at least one Riksdag data citation or concrete analytical insight |
| **Claims without confidence levels** | Ungraded assertions cannot be evaluated for reliability | Assign HIGH / MEDIUM / LOW confidence with source justification |
| **Tables-only analysis** | Data without narrative interpretation is not analysis | Tables must be accompanied by explanatory prose interpreting the data |
| **Opinion without evidence** | Subjective assertions undermine analytical credibility | All opinions must cite verifiable Riksdag/Regeringen MCP data sources |
| **Hardcoded Mermaid values** | Static diagrams become stale and misleading | Use data-driven values sourced from MCP tool results |
| **Shallow classification** | Single-dimension classification misses complexity | Apply all 7 classification dimensions; score each independently |
| **Stale SWOT entries** | Entries older than 180 days without re-verification are unreliable | Enforce 180-day decay rule; re-verify or remove expired entries |
| **Missing stakeholder analysis** | Analysis without impact assessment has no actionable value | Identify affected parties, opposition blocs, committees, and citizens |
| **Ignoring multi-language requirements** | Analysis must serve 14-language platform | Structure content for translation; avoid idioms and culture-specific references |

---

## 🔒 ISMS Compliance Framework Mapping

### ISO 27001:2022 Controls

| Control | Title | Methodology Relevance |
|---------|-------|----------------------|
| **A.5.1** | Policies for information security | All methodologies align with Hack23 ISMS policy framework |
| **A.5.10** | Acceptable use of information | Classification guide defines sensitivity-based data handling |
| **A.5.33** | Protection of records | Style guide enforces evidence citation and audit trail |
| **A.8.3** | Information access restriction | Sensitivity levels (PUBLIC/SENSITIVE/RESTRICTED) gate access |
| **A.8.10** | Information deletion | 180-day SWOT decay rule ensures stale data is removed |
| **A.8.28** | Secure coding | AI analysis guide enforces structured, reviewable output with quality gates |

### NIST CSF 2.0 Functions

| Function | Relevance to Methodologies |
|----------|---------------------------|
| **Identify (ID)** | Classification guide identifies and categorizes Riksdag events by sensitivity and impact |
| **Protect (PR)** | Style guide protects analytical quality through evidence requirements and anti-patterns |
| **Detect (DE)** | Threat framework detects political threats across 6 dimensions using multiple analytical models |
| **Respond (RS)** | Risk methodology provides quantified risk scores enabling proportionate response |
| **Recover (RC)** | SWOT framework supports strategic recovery planning through forward-looking opportunity analysis |

### CIS Controls v8.1

| Control | Title | Methodology Relevance |
|---------|-------|----------------------|
| **Control 1** | Inventory and Control of Enterprise Assets | Classification guide inventories and categorizes all Riksdag data assets |
| **Control 3** | Data Protection | Sensitivity levels enforce appropriate handling for each data classification |
| **Control 8** | Audit Log Management | AI analysis guide requires documented quality gate assessments (audit trail) |
| **Control 14** | Security Awareness and Skills Training | Methodology documents serve as training material for AI agents and analysts |
| **Control 16** | Application Software Security | Quality gates enforce structured, validated analytical output |

---

## 📰 Workflow-Specific Analytical Approach

Each agentic workflow applies the 6 methodologies with **unique emphasis** tailored to its article type:

```mermaid
flowchart TD
    subgraph "🏷️ Classification"
        CG2["Political Classification Guide"]
    end
    subgraph "⚠️ Risk"
        RM2["Risk Methodology"]
    end
    subgraph "🎯 Threat"
        TF2["Political Threat Framework"]
    end
    subgraph "💼 SWOT"
        SW2["SWOT Framework"]
    end

    subgraph "📰 Workflow Article Types"
        CR2["📋 Committee Reports\n= CG + SWOT primary"]
        PR2["📜 Propositions\n= RISK + STAKE primary"]
        MO2["✊ Motions\n= SWOT + SIG primary"]
        IP2["❓ Interpellations\n= THREAT + STAKE primary"]
        EV2["🌙 Evening Analysis\n= SWOT + ALL primary"]
        WR2["📊 Weekly Review\n= CG + SWOT primary"]
        MR2["📈 Monthly Review\n= ALL primary"]
    end

    CG2 --> CR2 & MO2 & WR2
    RM2 --> PR2 & EV2 & MR2
    TF2 --> IP2 & MR2
    SW2 --> CR2 & MO2 & EV2 & WR2 & MR2

    style CG2 fill:#00695C,stroke:#004D40,color:#fff
    style RM2 fill:#E65100,stroke:#BF360C,color:#fff
    style TF2 fill:#B71C1C,stroke:#880E4F,color:#fff
    style SW2 fill:#1B5E20,stroke:#1B5E20,color:#fff
    style CR2 fill:#198754,stroke:#146c43,color:#fff
    style PR2 fill:#0d6efd,stroke:#0a58ca,color:#fff
    style MO2 fill:#fd7e14,stroke:#ca6510,color:#fff
    style IP2 fill:#dc3545,stroke:#b02a37,color:#fff
    style EV2 fill:#6f42c1,stroke:#59359a,color:#fff
    style WR2 fill:#20c997,stroke:#1aa179,color:#fff
    style MR2 fill:#0dcaf0,stroke:#0aa2c0,color:#000
```

### Unique Analytics Per Article Type

| Workflow | Primary Methodology Focus | Unique Analytical Requirements |
|----------|--------------------------|-------------------------------|
| **Committee Reports** | Classification (document type) + SWOT (coalition dynamics) | 🏛️ Per-committee voting splits, reservation analysis, committee-to-policy-domain mapping |
| **Propositions** | Risk (legislative pipeline risk) + Stakeholder (affected populations) | 📜 Procedure stage tracking; budget impact analysis; policy domain cascading effects |
| **Motions** | SWOT (opposition strategy) + Significance (signalverdi) | ✊ Opposition strategy patterns, cross-party co-sponsorship, signal value assessment |
| **Interpellations** | Threat (accountability gaps) + Stakeholder (minister responses) | ❓ Minister accountability scoring, response quality analysis, evasion detection |
| **Evening Analysis** | ALL methodologies at equal weight | 🌙 Daily parliamentary pulse, vote results + debate intensity, party discipline metrics |
| **Weekly Review** | Classification (outcome categorization) + SWOT (trend assessment) | 📊 Cross-type trend detection, week-over-week pattern shifts, political narrative arc |
| **Monthly Review** | ALL methodologies at equal weight | 📈 Comprehensive legislative throughput, party productivity, government scorecard |

> **Key principle:** Every article type must produce analysis that is **unique and specific** to its focus area. A committee report analysis looks fundamentally different from a monthly review — different data sources, different methodology emphasis, different analytical depth.

---

## 📚 Related Documentation

| Document | Focus | Link |
|----------|-------|------|
| **Analysis README** | Directory overview and critical rules | [analysis/README.md](../README.md) |
| **Templates README** | Template catalog and usage guide | [analysis/templates/README.md](../templates/README.md) |
| **Prompts v2** | AI prompt library for analysis generation | [scripts/prompts/v2/](../../scripts/prompts/v2/) |
| **WORKFLOWS.md** | CI/CD and agentic workflow documentation | [WORKFLOWS.md](../../WORKFLOWS.md) |
| **ISMS-PUBLIC** | Hack23 Information Security Management System | [Hack23/ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) |

---

## 🆕 v4.1 Methodology Upgrades (2026-06-01)

All methodology guides were updated in v4.1 with the following cross-cutting improvements:

### 🗳️ Election 2026 Coverage
- `ai-driven-analysis-guide.md` v5.0: Mandatory Election 2026 lens with 5-dimension electoral assessment for ALL analyses
- `political-classification-guide.md` v2.3: Election 2026 urgency boost rules for pre-election period
- `political-swot-framework.md` v2.3: Election 2026 as mandatory SWOT dimension with electoral quadrant requirements
- `political-style-guide.md` v2.2: Election 2026 framing requirements with approved vocabulary and confidence standards

### 🎯 5-Level Confidence Scale
All methodology guides now use a unified **5-level confidence scale**:
- ⬛ VERY LOW → 🟥 LOW → 🟧 MEDIUM → 🟩 HIGH → 🟦 VERY HIGH
- `political-swot-framework.md`: Updated decay table from 3-level to 5-level
- `political-risk-methodology.md`: Added confidence scale mapping + election proximity factor

### 📊 Mermaid Diagram Mandates
- `ai-driven-analysis-guide.md` v5.0: Specifies required diagram type per analysis context (flowchart/timeline/quadrantChart/mindmap for each scenario)

### 📋 Historical Comparison
- `ai-driven-analysis-guide.md` v5.0: Mandatory historical comparison with 3 time periods + precedents table for all synthesis analyses

---

<p align="center">
  <em>📊 Hack23 AB — Political Intelligence Through Rigorous Methodology</em>
</p>
