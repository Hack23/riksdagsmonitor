# Political Threat Analysis Prompt v2 — PRIDES Framework

<!-- version: 2.0.0 | updated: 2026-03-26 | author: Hack23 AB -->

## Purpose

Apply the **PRIDES Political Threat Framework** (ISMS STRIDE adapted for political intelligence) to analyse threats to democratic governance from parliamentary documents. This prompt guides AI models to produce structured, evidence-based threat profiles.

## Context

PRIDES is a political adaptation of the ISMS STRIDE threat model from `THREAT_MODEL.md`. Instead of cybersecurity threats, PRIDES identifies threats to **democratic function, civic rights, and political integrity** from parliamentary activity and political actors.

## THE PRIDES FRAMEWORK

| ISMS STRIDE | Political PRIDES | Description |
|---|---|---|
| **S**poofing → | **P**olarization | Intentional division of public opinion; misleading rhetoric; disinformation; populist framing |
| **T**ampering → | **R**egulatory Overreach | Abuse of legislative or executive power; democratic norm erosion; bypassing parliamentary process |
| **R**epudiation → | **I**nstitutional Erosion | Weakening democratic institutions; accountability gaps; judicial or constitutional capture |
| **I**nformation Disclosure → | **D**emocratic Deficit | Lack of transparency; restricted public access; secrecy; press freedom violation |
| **D**enial of Service → | **E**conomic Disruption | Policy-driven economic harm; fiscal irresponsibility; crisis-inducing economic policy |
| **E**levation of Privilege → | **S**ocietal Impact | Disproportionate harm to vulnerable groups; rights erosion; discriminatory policy |

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

For each PRIDES category:

1. **Identify observable indicators** from the document text, speeches, and committee context
2. **Assess severity** based on the scale above — be calibrated, not alarmist
3. **Identify threat agents** responsible for this threat vector
4. **Document countermeasures** — Swedish institutional safeguards that mitigate this threat
5. **Write evidence-based rationale** — link signals to the PRIDES category specifically

## POLARIZATION ASSESSMENT (P)

Look for:
- Division rhetoric: "oss och dem" (us and them), nationalistisk, populistisk
- Disinformation signals: propaganda, desinformation, hatretorik
- Migration-as-wedge framing: migrationsretorik combined with polarisering
- Party positioning signals that intentionally divide constituencies

Countermeasures to mention: SVT/SR public broadcasting, Tryckfrihetsförordningen, civil society fact-checking

## REGULATORY OVERREACH ASSESSMENT (R)

Look for:
- Bypassing parliament signals: undantagsbefogenheter, nödbefogenheter
- Power concentration: maktkoncentration, undantag från lagstiftning
- Weakening oversight: kringgå regler, undantas granskning
- Extraordinary executive action without parliamentary mandate

Countermeasures: Lagrådet review, KU oversight, misstroendevotum mechanism, JO/JK ombudsman

## INSTITUTIONAL EROSION ASSESSMENT (I)

Look for:
- KU investigation context — always signals institutional accountability concern
- Accountability gap signals: ansvarslöshet, bristande transparens
- Democratic backsliding indicators: court packing, institutional capture
- Constitutional compliance failures: konstitutionsbrott

Countermeasures: Independent judiciary (Högsta domstolen, HFD), JO investigation, ECHR, KU scrutiny

## DEMOCRATIC DEFICIT ASSESSMENT (D)

Look for:
- Transparency restrictions: sekretess, hemligstämplad, begränsad insyn
- Press freedom signals: pressfrihet, yttrandefrihet threatened
- Public access limitations: offentlighetsprincipen restricted
- Whistleblower risk signals

Countermeasures: Offentlighetsprincipen, TF/YGL constitutional protections, IMY/GDPR, EU press freedom

## ECONOMIC DISRUPTION ASSESSMENT (E)

Look for:
- Fiscal crisis signals: budgetkris, statsbankrutt, skuldkris, finanskris
- FiU involvement with economic disruption keywords
- Unstable coalition combined with economic policy deadlock
- Budget failure or rejection scenarios

Countermeasures: Independent Riksbank, Finanspolitiska rådet, EU SGP, cross-party budget framework

## SOCIETAL IMPACT ASSESSMENT (S)

Look for:
- Vulnerable group signals: marginaliserade, utsatta grupper, diskriminering
- Rights erosion: rättighetsförlust, ojämlikhet, mänskliga rättigheter
- Disproportionate burden distribution signals
- SoU, SfU, AU committee involvement with social welfare content

Countermeasures: Diskrimineringsombudsmannen (DO), welfare state baseline, ECHR Article 14, EU equality law

## OUTPUT FORMAT

```json
{
  "documentId": "H901KU99",
  "threatProfile": {
    "threatAnalyses": [
      {
        "pridesCategory": "institutional-erosion",
        "threatAgents": ["ruling-coalition", "institutional"],
        "severity": "high",
        "indicators": [
          "Parliamentary document H901KU99 (bet) identified as signal",
          "Constitutional Committee (KU) scrutiny indicates accountability concern",
          "Committee involvement: KU"
        ],
        "countermeasures": [
          "Independent judiciary and administrative courts provide institutional check",
          "Parliamentary Ombudsman (JO) investigates institutional maladministration",
          "Riksdag constitutional review through KU provides political accountability",
          "ECHR and EU Charter of Fundamental Rights provide supranational protection"
        ],
        "rationale": "HIGH PRIDES threat: signals of weakening democratic institutions or accountability gaps detected in bet document from committee KU. Full document content available. Document H901KU99 presents observable signals matching this threat category."
      }
    ],
    "primaryThreat": "institutional-erosion",
    "overallThreatLevel": "high",
    "activeThreatAgents": ["ruling-coalition", "institutional"]
  }
}
```

## CALIBRATION EXAMPLES

| Scenario | Primary PRIDES | Severity | Primary Threat Agent |
|---|---|---|---|
| KU investigation of constitutional breach | institutional-erosion | critical | ruling-coalition |
| Budget policy harming welfare recipients | societal-impact | high | ruling-coalition |
| Government restricts press access | democratic-deficit | critical | ruling-coalition |
| Populist migration rhetoric in parliamentary debate | polarization | high | opposition-parties |
| Interpellation on budget fiscal irresponsibility | economic-disruption | medium | ruling-coalition |
| Foreign influence in legislative process | institutional-erosion | high | external-actors |
| Routine administrative committee report | societal-impact | low | institutional |

## SEVERITY CALIBRATION PRINCIPLES

- Do **not** assign `critical` severity for routine parliamentary activity
- Reserve `critical` for genuine constitutional or democratic emergencies (KU investigations, misstroendevotum, fundamental rights breaches)
- Assign `high` for serious but manageable threats with clear institutional response pathways
- Assign `medium` for emerging threats with observable but not yet systemic indicators
- Most routine documents should have at least one category at `medium` or `low`

## PROHIBITED PATTERNS

❌ Do not assign "critical" severity without citing constitutional or fundamental rights signals  
❌ Do not produce empty indicators — always reference observable parliamentary signals  
❌ Do not omit countermeasures — Swedish democracy has strong institutional resilience  
❌ Do not assign a single threat agent when multiple actors are involved  
❌ Do not conflate PRIDES categories (e.g., economic-disruption ≠ societal-impact)  
❌ Do not use generic rationale — always tie reasoning to specific document signals  
❌ Do not ignore committee context — KU = institutional-erosion, FiU = economic-disruption signals  
