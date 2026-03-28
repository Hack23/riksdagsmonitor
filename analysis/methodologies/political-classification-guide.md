<p align="center">
  <img src="https://hack23.com/icon-192.png" alt="Hack23 Logo" width="192" height="192">
</p>

<h1 align="center">🏷️ Political Classification Guide</h1>

<p align="center">
  <strong>📊 Detailed Methodology for Classifying Swedish Parliamentary Events</strong><br>
  <em>🎯 Sensitivity · Domain Taxonomy · Urgency Matrix · Impact Assessment</em>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Owner-CEO-0A66C2?style=for-the-badge" alt="Owner"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Version-1.0-555?style=for-the-badge" alt="Version"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Effective-2026--03--26-success?style=for-the-badge" alt="Effective Date"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Classification-Public-green?style=for-the-badge" alt="Classification"/></a>
</p>

**📋 Document Owner:** CEO | **📄 Version:** 1.0 | **📅 Last Updated:** 2026-03-26 (UTC)  
**🔄 Review Cycle:** Quarterly | **⏰ Next Review:** 2026-06-26  
**🏢 Owner:** Hack23 AB (Org.nr 5595347807) | **🏷️ Classification:** Public

---

## 🎯 Purpose

This guide provides the authoritative classification methodology for Swedish parliamentary events processed by Riksdagsmonitor's agentic workflows. Classification is the **first analytical step** — all subsequent risk assessment, threat analysis, and significance scoring depend on accurate initial classification.

This methodology is directly inspired by [Hack23 ISMS CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md), adapted for political intelligence contexts. See [reference/isms-classification-adaptation.md](../reference/isms-classification-adaptation.md) for the full mapping.

---

## 🔒 Sensitivity Levels

Political sensitivity levels are analogous to ISMS confidentiality levels, adapted for a public transparency platform:

```mermaid
graph TD
    A[Incoming Event] --> B{Contains legally sensitive<br/>personal/security data?}
    B -->|Yes| C[🔴 RESTRICTED]
    B -->|No| D{Politically charged:<br/>coalition threat, allegation,<br/>ongoing investigation?}
    D -->|Yes| E[🟡 SENSITIVE]
    D -->|No| F[🟢 PUBLIC]
    
    C --> G[Requires editorial review<br/>before publication]
    E --> H[Requires careful framing<br/>and attribution]
    F --> I[Freely publishable<br/>in standard workflow]
    
    style C fill:#ffebee,stroke:#f44336
    style E fill:#fffde7,stroke:#ffc107
    style F fill:#e8f5e9,stroke:#4caf50
```

### 🟢 PUBLIC

**Definition:** Routine parliamentary activity that is fully public record, non-controversial, and freely publishable without additional editorial controls.

**Examples:**
- Standard committee betänkanden (committee reports) without partisan controversy
- Routine interpellationer with standard ministerial responses
- Published SOU (Statens offentliga utredningar) reports
- Budget implementation reports with no surprise findings
- New legislation that passed with broad cross-party support

**ISMS Analogy:** Public / TLP:WHITE — no restrictions on distribution

---

### 🟡 SENSITIVE

**Definition:** Events that are politically charged, involve ongoing controversies, contain allegations against named politicians, or could be misrepresented without careful framing.

**Classification Triggers (any one is sufficient):**
- Event directly threatens coalition stability
- Named politician faces formal allegation or KU granskning
- Sensitive migration, crime, or security policy dimensions
- Significant partisan disagreement between coalition partners
- EU compliance concerns raised
- Budget figures significantly different from projections

**ISMS Analogy:** Internal / TLP:GREEN — share within editorial team only

---

### 🔴 RESTRICTED

**Definition:** Events with legal sensitivity, active security dimensions, potential personal data exposure, or that could cause direct harm if published without expert review.

**Classification Triggers:**
- Active criminal investigation involving a politician
- National security information (defence, SÄPO)
- Personal data of private individuals (not politicians acting in public role)
- Information subject to ongoing court proceedings (rättegång)
- Content that may constitute defamation without additional verification

**ISMS Analogy:** Confidential / TLP:RED — editorial review mandatory before any publication

---

## 📋 Policy Domain Taxonomy

Sweden's 13 parliamentary domain codes, aligned with Riksdag committee structure:

- **ECO – Economics & Finance** (FiU oversight)
  - Budget process
  - Taxation
  - Monetary policy
- **DEF – Defence & Security** (FöU oversight)
  - Military capability
  - NATO commitments
  - Civil defence
- **JUS – Justice & Law** (JuU oversight)
  - Criminal law
  - Courts
  - Police reform
- **SOC – Social Policy** (SoU oversight)
  - Welfare benefits
  - Pension system
  - Disability rights
- **HEA – Health** (SoU/HEaU oversight)
  - Healthcare funding
  - Public health
  - Pharmaceuticals
- **EDU – Education** (UbU oversight)
  - School reform
  - University funding
  - Research policy
- **ENV – Environment** (MJU oversight)
  - Climate targets
  - Biodiversity
  - Water quality
- **AGR – Agriculture** (MJU/NäU oversight)
  - Farm subsidies
  - Food security
  - Fishing rights
- **INF – Infrastructure** (TU oversight)
  - Transport
  - Housing
  - Digital infrastructure
- **ENE – Energy** (NäU oversight)
  - Nuclear policy
  - Renewable targets
  - Grid capacity
- **FOR – Foreign Affairs** (UU oversight)
  - EU relations
  - Bilateral treaties
  - NATO coordination
- **MIG – Migration** (SfU oversight)
  - Asylum policy
  - Integration
  - Border control
- **CON – Constitution** (KU oversight)
  - Electoral law
  - Government formation
  - Parliamentary procedure

### Domain Assignment Rules

1. **Always assign a primary domain** — if ambiguous, choose the domain of the lead committee
2. **Secondary domains** are optional but recommended when event touches multiple areas
3. **CON (Constitution)** takes precedence as primary when constitutional norms are at stake
4. **DEF (Defence)** takes precedence for national security events regardless of secondary domain
5. When in doubt, check which Riksdag **committee** (utskott) has jurisdiction

---

## ⏰ Urgency Matrix

Urgency is assessed against the **Swedish legislative calendar** and real-world impact timelines:

| Urgency Level | Legislative Trigger | Real-World Trigger | Max Delay to Classify |
|--------------|--------------------|--------------------|----------------------|
| ⚪ **ROUTINE** | Motion filed; SOU published | No immediate action required | 24–48 hours |
| 🔵 **ELEVATED** | Committee report published; debate scheduled | Government response expected within 2 weeks | 4–8 hours |
| 🟠 **URGENT** | Vote scheduled within 48 hours | Immediate government or policy action required | 1–2 hours |
| 🔴 **CRITICAL** | Constitutional crisis; emergency session called | Acute national security or democracy event | Immediate |

### Swedish Legislative Calendar Markers

Key dates that automatically elevate urgency:

- **September 20**: Budget Proposition (Budgetproposition) — **ELEVATED** minimum
- **October**: Committee review period — **ROUTINE** unless contested
- **November**: Riksdag budget vote — **URGENT** minimum for budget items
- **April**: Spring Amending Budget — **ELEVATED** minimum
- **June**: Spring session close — **ELEVATED** for pending legislation
- **September (election year)**: Riksdag election — **CRITICAL** political environment

---

## 📊 Impact Scope Assessment

Use the following evidence-based criteria to assign impact scope:

| Scope | Geographic | Affected Population | International Dimension |
|-------|-----------|---------------------|------------------------|
| 🏘️ **LOCAL** | Single municipality/region | <100,000 affected | None |
| 🇸🇪 **NATIONAL** | Whole of Sweden | 100K–10.5M affected | None or minor |
| 🇪🇺 **EU** | Sweden + EU implications | Swedish + EU dimension | EU directive, ECJ, Commission |
| 🌍 **INTERNATIONAL** | Global dimension | International treaty | NATO, UN, bilateral |

---

## 🤖 Automated Classification (Scripts Reference)

The following scripts provide automated first-pass classification:

| Script | Function | Output |
|--------|----------|--------|
| `scripts/analysis-framework/index.ts` | Main analysis pipeline entry | Classification JSON |
| `scripts/analysis-framework/lenses/citizen.ts` | Citizen impact lens | Sensitivity indicator |
| `scripts/analysis-framework/lenses/economic.ts` | Economic domain classifier | Domain codes |
| `scripts/analysis-framework/lenses/government.ts` | Government action classifier | Urgency indicator |
| `scripts/analysis-framework/lenses/international.ts` | International scope checker | Scope level |
| `scripts/analysis-framework/lenses/opposition.ts` | Opposition response classifier | Political temperature |
| `scripts/analysis-framework/lenses/media.ts` | Media salience estimator | Public interest score |
| `scripts/analysis-framework/types.ts` | TypeScript type definitions | Classification schema |

**Automated classifications should always be reviewed** for SENSITIVE and RESTRICTED levels before workflow propagation.

---

## 🔗 Related Documents

- [templates/political-classification.md](../templates/political-classification.md) — Classification template
- [templates/per-file-political-intelligence.md](../templates/per-file-political-intelligence.md) — Per-file analysis template with classification section
- [reference/isms-classification-adaptation.md](../reference/isms-classification-adaptation.md) — ISMS mapping
- [political-risk-methodology.md](political-risk-methodology.md) — Risk scoring (uses classification output)
- [political-style-guide.md](political-style-guide.md) — Writing standards for each sensitivity level
- [ai-driven-analysis-guide.md](ai-driven-analysis-guide.md) — Per-file AI analysis protocol

---

## 🤖 AI Analysis Protocol for Classification

The AI agent **MUST** follow this protocol when classifying political documents:

1. **Read this guide** — understand sensitivity levels, domain taxonomy, urgency matrix
2. **Extract key fields** from the document (title, type, committee, parties involved, date)
3. **Determine sensitivity** — PUBLIC (default), SENSITIVE (triggers apply), RESTRICTED (editorial review)
4. **Assign primary domain** + up to 2 secondary domains from the 13-domain taxonomy
5. **Assess urgency** using the calendar-aware urgency matrix
6. **Score significance** per the 5-dimension rubric in `significance-scoring.md`

### Borderline Classification Guidance

When a document falls between two classification levels:

| Scenario | Resolution |
|----------|-----------|
| SENSITIVE vs. RESTRICTED | If any single trigger exceeds threshold, classify as RESTRICTED. When in doubt, err toward higher classification. |
| ROUTINE vs. ELEVATED urgency | Check the legislative calendar — if within 2 weeks of a major vote, use ELEVATED. |
| Domain ambiguity | Assign the domain with strongest evidence as primary; use secondary domains for remaining relevance. CON (Constitution) and DEF (Defence) always take precedence when applicable. |
| Manual vs. automated score divergence (>3 points) | Use the higher score and flag for human editorial review with a note explaining the divergence. |

---

**Document Control:**  
- **Path:** `/analysis/methodologies/political-classification-guide.md`  
- **ISMS Reference:** [CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-28
