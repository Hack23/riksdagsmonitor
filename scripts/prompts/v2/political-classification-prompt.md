# Political Classification Prompt v2

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->

## Purpose

Apply the **Political Classification Framework** (ISMS-inspired, adapted for political intelligence) to a parliamentary document. This prompt guides AI models to produce structured, evidence-based 7-dimension classification scores.

## Context

This classification framework is inspired by `ISMS CLASSIFICATION.md` (Impact Analysis Matrix) but adapted for **political intelligence analysis** rather than information security. It produces a multi-dimensional classification that drives article focus, priority routing, and editorial depth decisions.

## CLASSIFICATION DIMENSIONS

You must assess the document on exactly **7 political dimensions**, each mapped from an ISMS equivalent:

| Dimension | ISMS Source | Scale |
|---|---|---|
| **Public Interest Sensitivity** | Confidentiality | explosive / sensitive / standard / routine |
| **Democratic Integrity Impact** | Integrity | critical / significant / moderate / minor |
| **Policy Urgency** | Availability | immediate / short-term / medium-term / long-term |
| **Economic Impact** | Financial Impact | transformative / major / moderate / minimal |
| **Governance Impact** | Operational Impact | systemic / significant / procedural / routine |
| **Political Capital Impact** | Reputational Impact | career-defining / significant / notable / negligible |
| **Legislative Impact** | Regulatory Impact | constitutional / legislative / regulatory / administrative |

## DIMENSION DEFINITIONS

### Public Interest Sensitivity (Confidentiality → Political Sensitivity)
- **explosive**: Imminent public controversy; coalition-threatening; scandal/crisis keywords present; media firestorm likely
- **sensitive**: Politically charged topic (immigration, defence, climate, tax); significant public interest
- **standard**: Normal legislative activity with moderate public interest; propositions, committee reports
- **routine**: Administrative/procedural; written questions, committee directives; low public visibility

### Democratic Integrity Impact (Integrity → Democratic Health)
- **critical**: Threatens constitutional or democratic foundations (fundamental law, electoral integrity)
- **significant**: Material impact on democratic participation, parliamentary oversight, or accountability
- **moderate**: Noticeable procedural or governance effects on democratic function
- **minor**: Minimal democratic process implications; routine operations

### Policy Urgency (Availability → Citizen Time-Sensitivity)
- **immediate**: Requires action within days; committee votes (bet), plenary minutes (prot), emergency legislation
- **short-term**: Action needed within weeks; government propositions (prop), interpellations (ip), SOU reports
- **medium-term**: Months-long cycle; motions (mot), government communications (skr), committee directives (dir)
- **long-term**: Multi-year strategic direction; structural reforms, constitutional changes

### Economic Impact (Financial Impact → Fiscal Consequence)
- **transformative**: Macro-level change; affects GDP, national budget (statsbudget), or SEK billions+; FiU budget propositions
- **major**: Significant sectoral or fiscal consequence; large-scale redistribution or tax changes
- **moderate**: Notable but bounded economic effect; affects specific industries or groups
- **minimal**: Limited fiscal consequence; administrative or procedural cost only

### Governance Impact (Operational Impact → Institutional Function)
- **systemic**: Cross-government structural change; Finance (FiU), Constitutional (KU), Defence (FöU), Foreign Affairs (UU) committees
- **significant**: Major departmental impact; Justice (JuU), Social Affairs (SoU), Social Insurance (SfU), Labour (AU), Environment (MJU), Education (UbU), Taxation (SkU)
- **procedural**: Changes to administrative processes; other propositions and committee reports
- **routine**: Standard governmental operations; motions, written questions; no structural change

### Political Capital Impact (Reputational Impact → Party Standing)
- **career-defining**: Permanently alters political trajectory; scandal, misstroendevotum, election-determining
- **significant**: Meaningful shift in public perception; interpellations targeting ministers, coalition crises
- **notable**: Observable but temporary; routine propositions, committee reports
- **negligible**: Minimal effect on standing; administrative questions, technical regulations

### Legislative Impact (Regulatory Impact → Law Change)
- **constitutional**: Affects fundamental law (Regeringsformen) or constitutional principles
- **legislative**: Creates or amends riksdag-level statute (lag); most propositions and committee reports
- **regulatory**: Changes government ordinances (förordning) or agency regulations (föreskrift)
- **administrative**: Internal government guidance or procedural decisions; no law change

## CLASSIFICATION PROCEDURE

1. **Read the full document** including title, summary, full text, and attached speeches
2. **Assess each of the 7 dimensions independently** — do not let one dimension bias another
3. **Identify evidence** for each classification — quote or reference specific text signals
4. **Compute composite score and overall classification**:
   - First, derive a **numeric `classificationScore` (0–100)** that reflects the weighted seriousness of all 7 dimensions taken together.
   - Use weighted scoring consistent with the deterministic engine:
     - Public Interest Sensitivity × 0.20
     - Democratic Integrity Impact × 0.20
     - Policy Urgency × 0.10
     - Economic Impact × 0.15
     - Governance Impact × 0.15
     - Political Capital Impact × 0.10
     - Legislative Impact × 0.10
   - Then derive `overallClassification` using thresholds:
     - **critical**: score ≥ 70
     - **high**: score ≥ 50
     - **medium**: score ≥ 30
     - **low**: score < 30
   - Ensure the chosen `overallClassification` is consistent with both the numeric score and the dimension levels.
5. **Write rationale** — 2-3 sentences per dimension explaining the classification

## OUTPUT FORMAT

Produce a structured JSON classification:

```json
{
  "documentId": "H901FiU1",
  "dimensions": {
    "publicInterestSensitivity": "sensitive",
    "democraticIntegrityImpact": "significant",
    "policyUrgency": "short-term",
    "economicImpact": "transformative",
    "governanceImpact": "systemic",
    "politicalCapitalImpact": "notable",
    "legislativeImpact": "legislative"
  },
  "overallClassification": "high",
  "classificationScore": 72,
  "rationale": [
    "Economic Impact: TRANSFORMATIVE — Document is a government budget proposition from FiU with explicit references to statsbudget and BNP targets",
    "Governance Impact: SYSTEMIC — FiU committee drives cross-government fiscal framework affecting all ministries",
    "Democratic Integrity: SIGNIFICANT — Budget propositions shape the government's democratic mandate"
  ]
}
```

## CALIBRATION EXAMPLES FOR SWEDISH PARLIAMENTARY CONTEXT

| Document | Sensitivity | Democratic | Urgency | Economic | Governance | Capital | Legislative |
|---|---|---|---|---|---|---|---|
| Budget proposition (FiU) | sensitive | significant | short-term | transformative | systemic | notable | legislative |
| KU investigation of minister | explosive | critical | immediate | minimal | systemic | career-defining | constitutional |
| Written question on local roads | routine | minor | long-term | minimal | routine | negligible | administrative |
| NATO compliance proposition | sensitive | significant | short-term | major | significant | significant | legislative |
| Misstroendevotum (no-confidence) | explosive | critical | immediate | minimal | systemic | career-defining | constitutional |

## PROHIBITED PATTERNS

❌ Do not classify all dimensions at the highest level — reserve 'explosive' and 'critical' for genuine crises  
❌ Do not classify without citing evidence from the document text  
❌ Do not conflate policyUrgency (time-sensitivity) with publicInterestSensitivity (controversy)  
❌ Do not ignore committee context — FiU and KU documents are structurally more significant  
❌ Do not produce overallClassification that contradicts the dimension scores  
