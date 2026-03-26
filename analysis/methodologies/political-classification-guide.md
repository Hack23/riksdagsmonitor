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
- [reference/isms-classification-adaptation.md](../reference/isms-classification-adaptation.md) — ISMS mapping
- [political-risk-methodology.md](political-risk-methodology.md) — Risk scoring (uses classification output)
- [political-style-guide.md](political-style-guide.md) — Writing standards for each sensitivity level

---

**Document Control:**  
- **Path:** `/analysis/methodologies/political-classification-guide.md`  
- **ISMS Reference:** [CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md)  
- **Classification:** Public  
- **Next Review:** 2026-06-26
# Political Classification Framework

<!-- version: 1.0.0 | updated: 2026-03-26 | author: Hack23 AB -->
<!-- document-control: political-analysis-methodology | classification: public -->

## 1. Purpose

This document describes the **Political Classification Framework** used by Riksdagsmonitor to systematically classify Swedish parliamentary documents across 7 political dimensions. The framework provides a structured, replicable methodology for assigning significance and priority to political events, enabling evidence-based editorial decisions in agentic news generation workflows.

## 2. ISMS Inspiration

This framework is **inspired by** (not identical to) the [Hack23 ISMS CLASSIFICATION.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md). The ISMS document provides a multi-dimensional impact analysis matrix (Confidentiality, Integrity, Availability, Financial, Operational, Reputational, Regulatory) that we have **adapted for political intelligence** analysis.

**Key distinction**: This is a political analysis methodology, not an information security classification. The ISMS provides structural inspiration for systematic, multi-dimensional assessment — we apply the same rigour to political events.

## 3. The 7 Classification Dimensions

### 3.1 Dimension Map

| ISMS Dimension | Political Adaptation | Rationale |
|---|---|---|
| Confidentiality | Public Interest Sensitivity | How politically sensitive/explosive is this event publicly? |
| Integrity | Democratic Integrity Impact | Does this threaten democratic processes or norms? |
| Availability | Policy Urgency | How time-sensitive is this for citizens and policymakers? |
| Financial Impact | Economic Impact | What is the fiscal/economic consequence? |
| Operational Impact | Governance Impact | How does this affect government operations? |
| Reputational Impact | Political Capital Impact | How does this affect party/politician standing? |
| Regulatory Impact | Legislative Impact | Does this change laws or constitutional order? |

### 3.2 Dimension Scales

#### Public Interest Sensitivity
| Level | Description | Examples |
|---|---|---|
| **explosive** | Coalition-threatening, scandal, public crisis | Misstroendevotum, korruption, governmental collapse |
| **sensitive** | Politically charged, significant public debate | Immigration, defence/NATO, climate, tax reform |
| **standard** | Normal legislative activity, moderate interest | Regular propositions, committee reports |
| **routine** | Administrative, low visibility | Written questions, minor directives |

#### Democratic Integrity Impact
| Level | Description | Examples |
|---|---|---|
| **critical** | Constitutional or fundamental rights threat | Grundlagsändring, vallag, grundrättigheter |
| **significant** | Parliamentary oversight, accountability risk | KU investigation, FiU oversight, minister scrutiny |
| **moderate** | Procedural democratic effect | Standard proposition passage |
| **minor** | Minimal democratic process impact | Routine administrative decisions |

#### Policy Urgency
| Level | Description | Document Types |
|---|---|---|
| **immediate** | Action needed within days | bet (committee report), prot (plenary minutes) |
| **short-term** | Action within weeks | prop (proposition), ip (interpellation), sou |
| **medium-term** | Months-long cycle | mot (motion), skr, ds, dir |
| **long-term** | Strategic/multi-year | fr (written question), long-term structural |

#### Economic Impact
| Level | Description | Examples |
|---|---|---|
| **transformative** | Macro-level, GDP/national budget | Statsbudget, BNP policy, miljarder SEK changes |
| **major** | Significant sectoral/fiscal | Tax reform, major spending programme |
| **moderate** | Bounded economic effect | Sectoral regulation, specific industry change |
| **minimal** | Limited fiscal consequence | Administrative process, no budget impact |

#### Governance Impact
| Level | Committee Examples | Description |
|---|---|---|
| **systemic** | FiU, KU, FöU, UU | Cross-government structural change |
| **significant** | JuU, SoU, SfU, AU, MJU, UbU, SkU | Major departmental or policy-area impact |
| **procedural** | Other propositions/reports | Administrative process changes |
| **routine** | Motions, written questions | Standard operations |

#### Political Capital Impact
| Level | Description | Examples |
|---|---|---|
| **career-defining** | Permanently alters trajectory | Scandal, avgångskrav, election-determining events |
| **significant** | Meaningful standing shift | Interpellation targeting minister, coalition crisis |
| **notable** | Observable temporary effect | Standard proposition, committee report |
| **negligible** | Minimal standing effect | Routine administrative matters |

#### Legislative Impact
| Level | Description | Legal Instrument |
|---|---|---|
| **constitutional** | Fundamental law change | Regeringsformen, Riksdagsordningen, Vallagen |
| **legislative** | Riksdag statute creation/amendment | Lag |
| **regulatory** | Government/agency ordinance | Förordning, Myndighetsföreskrift |
| **administrative** | Internal guidance | No law change |

## 4. Scoring Methodology

### 4.1 Dimension Weights
```
Public Interest Sensitivity  × 0.20
Democratic Integrity Impact  × 0.20
Policy Urgency               × 0.10
Economic Impact              × 0.15
Governance Impact            × 0.15
Political Capital Impact     × 0.10
Legislative Impact           × 0.10
────────────────────────────────────
                Total:        1.00
```

### 4.2 Numeric Conversion
```
explosive / critical / immediate / transformative / systemic / career-defining / constitutional = 100
sensitive / significant / short-term / major / significant / significant / legislative = 70
standard / moderate / medium-term / moderate / procedural / notable / regulatory = 40
routine / minor / long-term / minimal / routine / negligible / administrative = 10
```

### 4.3 Classification Score Thresholds
```
≥ 70 → critical
≥ 50 → high
≥ 30 → medium
< 30 → low
```

## 5. Implementation Reference

**TypeScript Engine**: `scripts/analysis-framework/political-classification.ts`  
**Types**: `scripts/analysis-framework/methodology-types.ts`  
**AI Prompt**: `scripts/prompts/v2/political-classification-prompt.md`  
**Tests**: `tests/political-methodology.test.ts`

### 5.1 Quick API Reference
```typescript
import { classifyPoliticalDocument } from './political-classification.js';

const classification = classifyPoliticalDocument(doc, ciaContext);
console.log(classification.overallClassification);  // 'critical' | 'high' | 'medium' | 'low'
console.log(classification.classificationScore);    // 0–100
console.log(classification.rationale);              // string[] with evidence citations
```

## 6. Worked Examples

### Example 1: Budget Proposition (High Classification)
**Document**: Budgetproposition 2026 from FiU  
**Classification**:
- Public Interest Sensitivity: `sensitive` (fiscal policy debate)
- Democratic Integrity Impact: `significant` (FiU oversight role)
- Policy Urgency: `short-term` (proposition document type)
- Economic Impact: `transformative` (statsbudget, BNP references)
- Governance Impact: `systemic` (FiU = cross-government fiscal authority)
- Political Capital Impact: `notable` (standard budget debate)
- Legislative Impact: `legislative` (creates budget framework)
- **Overall: HIGH (score ≈ 69)**

### Example 2: No-Confidence Vote (Critical Classification)
**Document**: Misstroendevotum mot statsministern  
**Classification**:
- Public Interest Sensitivity: `explosive` (governmental crisis keywords)
- Democratic Integrity Impact: `critical` (fundamental constitutional mechanism)
- Policy Urgency: `immediate` (committee report context)
- Economic Impact: `minimal` (procedural matter)
- Governance Impact: `systemic` (affects entire government)
- Political Capital Impact: `career-defining` (explosive keywords)
- Legislative Impact: `constitutional` (constitutional procedure)
- **Overall: CRITICAL (score ≈ 86)**

### Example 3: Routine Written Question (Low Classification)
**Document**: Written question about local transport  
**Classification**:
- Public Interest Sensitivity: `routine`
- Democratic Integrity Impact: `minor`
- Policy Urgency: `long-term`
- Economic Impact: `minimal`
- Governance Impact: `routine`
- Political Capital Impact: `negligible`
- Legislative Impact: `administrative`
- **Overall: LOW (score ≈ 10)**

## 7. Integration Points

- **`political-significance.ts`**: Classification score supplements the 0–100 significance score
- **`DocumentAnalysisResult`**: Classification available via `methodologyAnalysis.classification`
- **Article generation**: `overallClassification` drives depth (critical → deepest investigation)
- **Editorial routing**: `policyUrgency = 'immediate'` → breaking news pipeline
- **SWOT generation**: `governanceImpact = 'systemic'` → expanded stakeholder analysis
