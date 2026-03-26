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
