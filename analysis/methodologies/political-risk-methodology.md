# Political Risk Assessment Methodology

<!-- version: 1.0.0 | updated: 2026-03-26 | author: Hack23 AB -->
<!-- document-control: political-analysis-methodology | classification: public -->

## 1. Purpose

This document describes the **Political Risk Assessment Methodology** used by Riksdagsmonitor to quantify political risks from Swedish parliamentary documents. Inspired by the [ISMS Risk_Assessment_Methodology.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Risk_Assessment_Methodology.md), it adapts Likelihood × Impact quantitative scoring for **political risk** across six categories of democratic and governance risk.

## 2. ISMS Inspiration

The ISMS Risk Assessment provides a rigorous quantitative framework: Risk Score = Likelihood × Impact. We adapt this for political intelligence by:
- Replacing "information security risks" with **political governance risks**
- Adapting the likelihood scale to **parliamentary signal strength**
- Adapting the impact scale to **democratic and societal consequence**
- Adding **Swedish parliamentary context** to all calibrations

## 3. Risk Categories

### 3.1 The Six Political Risk Categories

| Category | Failure Mode | Key Indicators |
|---|---|---|
| **coalition-stability** | Government collapse or realignment | Stability score, majority margin, defection probability, Tidö keywords |
| **policy-implementation** | Policy failure or stalling | Parliamentary arithmetic, committee support, motion denial rate |
| **democratic-process** | Democratic norm erosion | KU involvement, constitutional keywords, accountability gaps |
| **economic-policy** | Fiscal/monetary harm | FiU involvement, budget keywords, inflation/debt signals |
| **social-cohesion** | Societal division or unrest | SoU/SfU/AU committee, discrimination/equality keywords |
| **international-standing** | International position risk | UU/FöU committee, NATO/EU keywords, treaty signals |

## 4. Likelihood Scale

| Level | Probability | Swedish Parliamentary Signal |
|---|---|---|
| 🔥 **almost-certain** | 90% | Committee report passed; KU investigation active; vote recorded |
| 🎯 **likely** | 70% | Multiple committee signals; interpellations filed; party consensus |
| ⚖️ **possible** | 50% | Mixed signals; debate ongoing; uncertain arithmetic |
| 🛡️ **unlikely** | 30% | Weak indicators; strong opposition; no committee movement |
| 💎 **rare** | 12% | Exceptional circumstances; no current signals |
| 🌟 **exceptional** | 2% | Black swan event; no observable precursors |

### 4.1 Signal Strength by Document Type

| Document Type | Likelihood Baseline |
|---|---|
| `bet` (committee report) | almost-certain for policy-implementation |
| `prop` (government proposition) | likely for policy-implementation |
| `sou` (SOU report) | possible for policy areas covered |
| `ip` (interpellation) | possible for coalition-stability and policy-implementation |
| `mot` (motion) | unlikely for policy-implementation (99%+ denied) |
| `fr` (written question) | rare — indicative only |

### 4.2 CIA Coalition Data Integration

When CIA coalition stability data is available:
- Stability score < 30 → upgrade coalition-stability likelihood by 1-2 levels
- Stability score 30-50 → moderate likelihood elevation
- Stability score > 70 → baseline likelihood, strong mitigating factor
- Majority margin ≤ 1 → escalating factor for all categories
- Defection probability > 0.2 → escalating factor for coalition-stability

## 5. Impact Scale

| Level | Score | Political Consequence |
|---|---|---|
| **transformative** | 10 | Constitutional/regime-level change; affects fundamental governance |
| **critical** | 8 | Major policy shift affecting millions of citizens |
| **high** | 6 | Significant legislative change; major committee report |
| **moderate** | 4 | Notable policy adjustment; sectoral effect |
| **low** | 2 | Minor procedural change; limited consequence |
| **minimal** | 1 | Routine parliamentary activity; negligible impact |

### 5.1 Impact by Risk Category — Calibration Table

| Category | transformative | critical | high |
|---|---|---|---|
| coalition-stability | Regime change | Near-collapse, misstroendevotum | Significant coalition instability |
| policy-implementation | Structural reform reversal | Major policy blocked/reversed | Significant legislative stalling |
| democratic-process | Constitutional order threatened | Core democratic institution weakened | Significant democratic deficit |
| economic-policy | GDP-level shock, debt crisis | Budget crisis, major fiscal failure | Tax reform, significant spending change |
| social-cohesion | Societal breakdown, mass unrest | Systemic discrimination, wide inequality | Notable group harm, significant exclusion |
| international-standing | Treaty exit, alliance breakdown | Major alliance strain | Significant diplomatic failure |

## 6. Risk Scoring Formula

```
Risk Score = likelihood_probability × impact_weight × 10

Examples:
  almost-certain (0.90) × transformative (10) × 10 = 90 → CRITICAL priority
  likely (0.70)          × high (6)            × 10 = 42 → MEDIUM priority
  possible (0.50)        × critical (8)         × 10 = 40 → MEDIUM priority
  unlikely (0.30)        × high (6)             × 10 = 18 → LOW priority
  rare (0.12)            × transformative (10)  × 10 = 12 → LOW priority

Priority thresholds:
  ≥ 70 → CRITICAL
  ≥ 50 → HIGH
  ≥ 30 → MEDIUM
  < 30 → LOW
```

## 7. Composite Risk Score

The six category scores are aggregated into a **composite risk score** using priority-weighted averaging:

```
Priority weights: critical×1.0, high×0.7, medium×0.5, low×0.3

composite = Σ(riskScore × priorityWeight) / Σ(priorityWeight)
```

The composite score drives the `overallRiskLevel` and article priority routing.

## 8. Mitigating & Escalating Factors

### 8.1 Standard Mitigating Factors by Category

| Category | Key Mitigating Factors |
|---|---|
| coalition-stability | High stability score, comfortable majority, constitutional norms |
| policy-implementation | Government parliamentary majority, Lagrådet review, committee quality assurance |
| democratic-process | Lagrådet (constitutional review), KU oversight, JO/JK ombudsmen |
| economic-policy | Independent Riksbank, Finanspolitiska rådet, EU SGP constraints |
| social-cohesion | Swedish welfare state baseline, Diskrimineringsombudsmannen, ECHR |
| international-standing | NATO collective defence, EU treaty obligations, Nordic cooperation |

### 8.2 Standard Escalating Factors by Category

| Category | Key Escalating Factors |
|---|---|
| coalition-stability | Low stability score, narrow majority, high defection probability |
| policy-implementation | Unstable coalition, opposition coordination, minority government dynamics |
| democratic-process | Media amplification, public trust erosion, social media polarisation |
| economic-policy | Global economic uncertainty, coalition budget deadlock, external shocks |
| social-cohesion | Polarising rhetoric, unequal burden distribution, social fragmentation |
| international-standing | Domestic instability signals, geopolitical realignment pressures |

## 9. Evidence Standards

Risk assessments must cite:
- **dok_id** of the source document
- **Committee involvement** (specific committee code)
- **Speech attributions** where available
- **CIA coalition data** values (stability score, margin, defection probability)
- **Vote records** where available

## 10. Implementation Reference

**TypeScript Engine**: `scripts/analysis-framework/political-risk-assessment.ts`  
**Types**: `scripts/analysis-framework/methodology-types.ts`  
**AI Prompt**: `scripts/prompts/v2/political-risk-prompt.md`  
**Tests**: `tests/political-methodology.test.ts`

### 10.1 Quick API Reference
```typescript
import { assessPoliticalRisk, assessSingleRiskCategory } from './political-risk-assessment.js';

// Full 6-category profile
const profile = assessPoliticalRisk(doc, ciaContext);
console.log(profile.overallRiskLevel);    // 'critical' | 'high' | 'medium' | 'low'
console.log(profile.compositeRiskScore); // 0–100
console.log(profile.dominantRisk);       // highest-priority category

// Targeted single-category assessment
const coalitionRisk = assessSingleRiskCategory(doc, 'coalition-stability', ciaContext);
console.log(coalitionRisk.riskScore);    // 0–100
console.log(coalitionRisk.likelihood);   // 'almost-certain' | 'likely' | ...
```

## 11. Worked Examples

### Example 1: Unstable Coalition Budget Proposal
**Context**: Budget proposition, FiU, coalition stability score = 28, majority margin = 1

| Category | Likelihood | Impact | Score | Priority |
|---|---|---|---|---|
| coalition-stability | almost-certain | critical | 72 | CRITICAL |
| policy-implementation | likely | high | 42 | MEDIUM |
| democratic-process | unlikely | high | 18 | LOW |
| economic-policy | almost-certain | transformative | 90 | CRITICAL |
| social-cohesion | possible | moderate | 20 | LOW |
| international-standing | unlikely | moderate | 12 | LOW |
| **Composite** | | | **~60** | **HIGH** |

### Example 2: KU Constitutional Investigation
| Category | Likelihood | Impact | Score | Priority |
|---|---|---|---|---|
| coalition-stability | likely | critical | 56 | HIGH |
| policy-implementation | rare | low | 2 | LOW |
| democratic-process | almost-certain | critical | 72 | CRITICAL |
| economic-policy | rare | minimal | 1 | LOW |
| social-cohesion | possible | moderate | 20 | LOW |
| international-standing | unlikely | moderate | 12 | LOW |
| **Composite** | | | **~45** | **MEDIUM** |

## 12. Integration Points

- **`political-significance.ts`**: Risk profile supplements 0–100 significance scoring
- **`DocumentAnalysisResult.methodologyAnalysis.riskProfile`**: Full profile available
- **Article depth routing**: `overallRiskLevel = 'critical'` → deep investigation
- **Headline prioritisation**: `dominantRisk = 'coalition-stability'` → coalition-focused framing
- **CIA data feedback**: CIA context improves coalition and economic risk accuracy
