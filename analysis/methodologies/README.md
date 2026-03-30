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
  <a href="#"><img src="https://img.shields.io/badge/Version-3.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--30-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 3.0 | **📅 Last Updated:** 2026-03-30 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-30  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This directory contains the **authoritative methodology library** for all political intelligence analysis performed by Riksdagsmonitor's AI-driven agentic workflows. Each methodology document defines the analytical framework, evaluation criteria, evidence standards, and quality requirements that AI agents MUST follow when producing political intelligence.

> **Key Principle:** Scripts download data ONLY. AI performs ALL analytical content generation. These methodologies guide AI agents — they are never executed by scripts.

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

## 📚 Related Documentation

| Document | Focus | Link |
|----------|-------|------|
| **Analysis README** | Directory overview and critical rules | [analysis/README.md](../README.md) |
| **Templates README** | Template catalog and usage guide | [analysis/templates/README.md](../templates/README.md) |
| **Prompts v2** | AI prompt library for analysis generation | [scripts/prompts/v2/](../../scripts/prompts/v2/) |
| **WORKFLOWS.md** | CI/CD and agentic workflow documentation | [WORKFLOWS.md](../../WORKFLOWS.md) |
| **ISMS-PUBLIC** | Hack23 Information Security Management System | [Hack23/ISMS-PUBLIC](https://github.com/Hack23/ISMS-PUBLIC) |

---

<p align="center">
  <em>📊 Hack23 AB — Political Intelligence Through Rigorous Methodology</em>
</p>
