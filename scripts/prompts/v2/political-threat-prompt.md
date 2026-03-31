# Political Threat Analysis Prompt v3 — Political Threat Taxonomy

<!-- version: 3.0.0 | updated: 2026-03-30 | author: Hack23 AB -->

## Purpose

Apply the **Political Threat Taxonomy** to analyse threats to democratic governance from parliamentary documents. This prompt guides AI models to produce structured, evidence-based threat profiles using politically-native categories (NOT cybersecurity-origin frameworks like STRIDE).

## Context

The Political Threat Taxonomy identifies threats to **democratic function, civic rights, and political integrity** from parliamentary activity and political actors. It categorises threats by the **democratic function threatened**, not by cybersecurity attack type.

## THE POLITICAL THREAT TAXONOMY

| Canonical Identifier (`threatCategory`) | Democratic Function Threatened | Description |
|---|---|---|
| `polarization` | Narrative Integrity | Disinformation, false framing, misleading rhetoric, propaganda, polarisation |
| `regulatory-overreach` | Legislative Integrity | Policy corruption, undisclosed lobbying, legislative manipulation, process bypassing |
| `institutional-erosion` | Accountability | Oversight evasion, KU obstruction, blame-shifting, record falsification |
| `democratic-deficit` | Transparency | Information suppression, FOI obstruction, secrecy expansion, classification abuse |
| `economic-disruption` | Democratic Process | Procedural obstruction, filibustering, quorum manipulation, budget deadlock |
| `societal-impact` | Power Balance | Disproportionate harm to vulnerable groups, rights erosion, social marginalisation, welfare inequality |

## THREAT AGENTS

Identify which actor(s) are the source or amplifier of each threat:

| Agent | Role |
|---|---|
| **ruling-coalition** | Policy agenda risks; power concentration; governing party overreach |
| **opposition-parties** | Obstruction; populist pressure; deliberate legislative destabilisation |
| **external-actors** | Foreign government influence; EU regulatory pressure; geopolitical actors |
| **special-interests** | Lobbying; regulatory capture; corporate or sectoral influence on legislation |
| **media** | Narrative manipulation; selective framing; disinformation amplification |
| **institutional** | Bureaucratic inertia; implementation failures; agency drift from democratic mandate |

## SEVERITY LEVELS

| Level | Description |
|---|---|
| **critical** | Immediate and fundamental threat to democratic function; constitutional crisis; rights emergency |
| **high** | Serious and near-term threat requiring political response; significant democratic deficit |
| **medium** | Moderate threat with observable indicators; concerning but manageable |
| **low** | Latent or low-probability threat; early warning signal only |

## THREAT ANALYSIS PROCEDURE

For each Threat Category:

1. **Identify observable indicators** from the document text, speeches, and committee context
2. **Assess severity** based on the scale above — be calibrated, not alarmist
3. **Identify threat agents** responsible for this threat vector
4. **Document countermeasures** — Swedish institutional safeguards that mitigate this threat
5. **Write evidence-based rationale** — link signals to the specific threat category

## NARRATIVE INTEGRITY ASSESSMENT

Look for:
- Division rhetoric: "oss och dem" (us and them), nationalistisk, populistisk
- Disinformation signals: propaganda, desinformation, hatretorik
- Migration-as-wedge framing: migrationsretorik combined with polarisering
- Party positioning signals that intentionally divide constituencies

Countermeasures to mention: SVT/SR public broadcasting, Tryckfrihetsförordningen, civil society fact-checking

## LEGISLATIVE INTEGRITY ASSESSMENT

Look for:
- Bypassing parliament signals: undantagsbefogenheter, nödbefogenheter
- Undisclosed lobbying: remiss response vs. final proposition delta
- Weakening oversight: kringgå regler, undantas granskning
- Fast-tracking legislation without proper remiss process

Countermeasures: Lagrådet review, KU oversight, misstroendevotum mechanism, remiss process

## ACCOUNTABILITY ASSESSMENT

Look for:
- KU investigation context — always signals institutional accountability concern
- Accountability gap signals: ansvarslöshet, bristande transparens
- Democratic backsliding indicators: institutional capture
- Constitutional compliance failures: konstitutionsbrott

Countermeasures: Independent judiciary (Högsta domstolen, HFD), JO investigation, ECHR, KU scrutiny

## TRANSPARENCY ASSESSMENT

Look for:
- Transparency restrictions: sekretess, hemligstämplad, begränsad insyn
- Press freedom signals: pressfrihet, yttrandefrihet threatened
- Public access limitations: offentlighetsprincipen restricted
- Whistleblower risk signals

Countermeasures: Offentlighetsprincipen, TF/YGL constitutional protections, IMY/GDPR, EU press freedom

## ECONOMIC DISRUPTION ASSESSMENT

Look for:
- Fiscal crisis signals: budgetkris, statsbankrutt, skuldkris, finanskris
- FiU involvement with economic disruption keywords
- Unstable coalition combined with economic policy deadlock
- Budget failure or rejection scenarios
- Procedural obstruction: filibustering, quorum manipulation

Countermeasures: Independent Riksbank, Finanspolitiska rådet, EU SGP, cross-party budget framework

## SOCIETAL IMPACT ASSESSMENT

Look for:
- Disproportionate burden on vulnerable groups: welfare cuts, social safety net erosion
- SoU, SfU, AU committee involvement with social welfare content
- Rights erosion signals: discrimination, marginalisation, inequality amplification
- Societal polarisation effects on minority or disadvantaged communities
- Constitutional boundary tests affecting individual rights

Countermeasures: Diskrimineringsombudsmannen (DO), JO/JK, ECHR Article 14, welfare state baseline, cross-party norms

## OUTPUT FORMAT

```json
{
  "documentId": "H901KU99",
  "threatProfile": {
    "threatAnalyses": [
      {
        "threatCategory": "institutional-erosion",
        "threatAgents": ["ruling-coalition", "institutional"],
        "severity": "high",
        "indicators": [
          "Parliamentary document H901KU99 (bet) identified as signal",
          "Constitutional Committee (KU) scrutiny indicates institutional-erosion concern (threatens Accountability)",
          "Committee involvement: KU"
        ],
        "countermeasures": [
          "Independent judiciary and administrative courts provide institutional check",
          "Parliamentary Ombudsman (JO) investigates institutional maladministration",
          "Riksdag constitutional review through KU provides political accountability",
          "ECHR and EU Charter of Fundamental Rights provide supranational protection"
        ],
        "rationale": "HIGH threat: signals of weakening democratic accountability detected in bet document from committee KU. Full document content available. Document H901KU99 presents observable signals matching institutional-erosion threat category."
      }
    ],
    "primaryThreat": "institutional-erosion",
    "overallThreatLevel": "high",
    "activeThreatAgents": ["ruling-coalition", "institutional"]
  }
}
```

## CALIBRATION EXAMPLES

| Scenario | Primary Threat Category | Severity | Primary Threat Agent |
|---|---|---|---|
| KU investigation of constitutional breach | institutional-erosion | critical | ruling-coalition |
| Budget policy harming welfare recipients | societal-impact | high | ruling-coalition |
| Government restricts press access | democratic-deficit | critical | ruling-coalition |
| Populist migration rhetoric in parliamentary debate | polarization | high | opposition-parties |
| Interpellation on budget fiscal irresponsibility | economic-disruption | medium | ruling-coalition |
| Foreign influence in legislative process | regulatory-overreach | high | external-actors |
| Routine administrative committee report | polarization | low | institutional |

## SEVERITY CALIBRATION PRINCIPLES

- Do **not** assign `critical` severity for routine parliamentary activity
- Reserve `critical` for genuine constitutional or democratic emergencies (KU investigations, misstroendevotum, fundamental rights breaches)
- Assign `high` for serious but manageable threats with clear institutional response pathways
- Assign `medium` for emerging threats with observable but not yet systemic indicators
- Many routine documents will show at least one threat category at `medium` or `low` when they contain even minor democratic-risk signals
- If a document contains no discernible threat signals, return **no threats detected**: set `overallThreatLevel` to `none`, `primaryThreat` to `null`, and `threatAnalyses` to an empty list (`[]`)

## PROHIBITED PATTERNS

❌ Do not assign "critical" severity without citing constitutional or fundamental rights signals  
❌ Do not claim a non-`none` threat level without referencing observable parliamentary signals — if no signals are present, explicitly use the no-threat case (`overallThreatLevel: 'none'`, `primaryThreat: null`, `threatAnalyses: []`)  
❌ Do not omit countermeasures — Swedish democracy has strong institutional resilience  
❌ Do not assign a single threat agent when multiple actors are involved  
❌ Do not conflate threat categories (e.g., `economic-disruption` ≠ `societal-impact`)  
❌ Do not use generic rationale — always tie reasoning to specific document signals  
❌ Do not ignore committee context — KU = institutional-erosion, FiU = economic-disruption signals  
❌ Do not use STRIDE categories (S/T/R/I/D/E) — use Political Threat Taxonomy categories  
