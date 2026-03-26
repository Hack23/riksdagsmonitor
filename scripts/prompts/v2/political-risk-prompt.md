# Political Risk Assessment Prompt v2

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->

## Purpose

Apply the **Political Risk Assessment Methodology** (ISMS-inspired, adapted for political intelligence) to assess political risks from parliamentary documents. This prompt guides AI models to produce quantified, evidence-based Likelihood × Impact risk assessments across 6 risk categories.

## Context

This methodology is inspired by `ISMS Risk_Assessment_Methodology.md` (Quantitative Risk Scoring) but adapted for **political risk** in the Swedish parliamentary context. Risk Score = Likelihood × Impact → drives article focus and editorial priority routing.

## RISK CATEGORIES

Assess the document across **all 6 political risk categories**:

| Category | Description |
|---|---|
| **coalition-stability** | Risk of government collapse or parliamentary realignment |
| **policy-implementation** | Risk that proposed policies fail, stall, or are blocked |
| **democratic-process** | Risk to democratic norms, institutions, or oversight mechanisms |
| **economic-policy** | Risk from fiscal or monetary policy decisions |
| **social-cohesion** | Risk of societal division, polarisation, or social unrest |
| **international-standing** | Risk to Sweden's position in EU, NATO, or international relationships |

## LIKELIHOOD SCALE

| Level | Probability | Parliamentary Signals |
|---|---|---|
| 🔥 **almost-certain** | 80–99% | Multiple committee decisions confirm; vote has occurred; KU investigation active |
| 🎯 **likely** | 60–79% | Strong committee signals; interpellations filed; multiple party statements |
| ⚖️ **possible** | 40–59% | Mixed signals; debate ongoing; uncertain parliamentary arithmetic |
| 🛡️ **unlikely** | 20–39% | Weak indicators; strong opposition; no committee support |
| 💎 **rare** | 5–19% | Exceptional circumstances required; no current signals |
| 🌟 **exceptional** | <5% | Black swan political events; no observable precursors |

## IMPACT SCALE

| Level | Description |
|---|---|
| 🔥 **transformative** | Constitutional or regime-level change; affects fundamental law or governance structure |
| 🚨 **critical** | Major policy shift affecting millions of citizens; large-scale legislative change |
| ⚠️ **high** | Significant legislative change; major committee report or proposition |
| 🟡 **moderate** | Notable policy adjustment; sectoral or bounded effect |
| 🟢 **low** | Minor procedural change; limited consequence |
| ⚪ **minimal** | Routine parliamentary activity; negligible consequence |

## RISK SCORING FORMULA

```
Risk Score = likelihood_probability × impact_weight × 10

Probability mapping:
  almost-certain = 0.90 | likely = 0.70 | possible = 0.50
  unlikely = 0.30 | rare = 0.12 | exceptional = 0.02

Impact weight (0–10):
  transformative = 10 | critical = 8 | high = 6
  moderate = 4 | low = 2 | minimal = 1

Priority tiers:
  ≥70 → CRITICAL | ≥50 → HIGH | ≥30 → MEDIUM | <30 → LOW
```

## RISK ASSESSMENT PROCEDURE

For each of the 6 risk categories:

1. **Identify relevant signals** in the document text (titles, summaries, full text, speeches)
2. **Assess Likelihood** using the scale above — cite specific signals from the document
3. **Assess Impact** using the scale above — consider Swedish parliamentary and societal context
4. **Compute Risk Score** = likelihood_probability × impact_weight × 10
5. **Identify evidence** — specific dok_id references, speech attributions, vote records
6. **List mitigating factors** — institutional safeguards, constitutional protections, electoral constraints
7. **List escalating factors** — coalition dynamics, partisan pressure, external shocks
8. **Assess confidence** in the analysis: high (full text + CIA data), medium (summary only), low (metadata only)

## COALITION STABILITY ASSESSMENT

When assessing **coalition-stability** risk, consider:
- CIA coalition stability score (if available): <40 = very unstable; 40-70 = moderate; >70 = stable
- Majority margin: ≤1 seat = critical; 2-5 seats = narrow; >5 = comfortable
- Tidö Agreement keywords: signals coalition dependency
- SD support language: signals coalition fragility
- misstroendevotum / no-confidence: signals immediate crisis
- Defection probability from CIA data

## OUTPUT FORMAT

Produce a structured risk profile:

```json
{
  "documentId": "H901FiU10",
  "riskProfile": {
    "riskAssessments": [
      {
        "riskCategory": "coalition-stability",
        "likelihood": "possible",
        "impact": "critical",
        "riskScore": 40,
        "priority": "medium",
        "evidence": [
          "Document H901FiU10 (bet in FiU) identified as signal",
          "Party affiliation: M — governing coalition",
          "Tidöavtal references indicate coalition dependency"
        ],
        "confidence": "medium",
        "mitigatingFactors": [
          "Swedish constitutional norms require democratic transitions through electoral process",
          "Riksdag committee scrutiny provides quality assurance for legislation"
        ],
        "escalatingFactors": [
          "Tight parliamentary majority increases vulnerability to individual defections",
          "Opposition coordination can delay or block legislative priorities"
        ]
      }
    ],
    "dominantRisk": "economic-policy",
    "compositeRiskScore": 55,
    "overallRiskLevel": "high"
  }
}
```

## CALIBRATION EXAMPLES

| Scenario | Coalition | Policy | Democratic | Economic | Social | International |
|---|---|---|---|---|---|---|
| Budget proposition (unstable coalition) | possible/critical | likely/high | unlikely/high | almost-certain/transformative | possible/moderate | unlikely/moderate |
| KU investigation of PM | likely/transformative | rare/low | almost-certain/critical | rare/minimal | possible/moderate | unlikely/moderate |
| NATO-alignment motion | unlikely/moderate | possible/high | unlikely/moderate | unlikely/high | unlikely/high | likely/high |
| Routine written question | exceptional/minimal | rare/minimal | exceptional/minimal | exceptional/minimal | exceptional/minimal | exceptional/minimal |

## REQUIRED EVIDENCE CITATIONS

Evidence must reference:
- **dok_id** of the source document
- **Committee involvement** (e.g., "Finance Committee (FiU) involvement")
- **Speech attributions** (e.g., "Speech by [Name] ([Party])")
- **Vote records** where available
- **CIA coalition data** where available (stability score, majority margin, defection probability)

## PROHIBITED PATTERNS

❌ Do not assign "almost-certain" likelihood without observable parliamentary signals  
❌ Do not assign "transformative" impact for routine motions or written questions  
❌ Do not produce empty evidence arrays — always cite at least one observable signal  
❌ Do not conflate risk categories — coalition-stability ≠ policy-implementation  
❌ Do not omit mitigating factors — Swedish democracy has strong institutional safeguards  
❌ Do not ignore CIA coalition stability data when available — it is the strongest signal for coalition-stability risk  
