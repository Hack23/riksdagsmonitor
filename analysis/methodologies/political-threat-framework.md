# Political Threat Framework — PRIDES

<!-- version: 1.0.0 | updated: 2026-03-26 | author: Hack23 AB -->
<!-- document-control: political-analysis-methodology | classification: public -->

## 1. Purpose

This document describes the **PRIDES Political Threat Analysis Framework** used by Riksdagsmonitor to identify and characterise threats to democratic governance from Swedish parliamentary activity. PRIDES is adapted from the [ISMS Threat_Modeling.md](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md) STRIDE framework, reimagined for **political intelligence** rather than cybersecurity.

## 2. The PRIDES Framework — Conceptual Foundation

STRIDE is a systematic threat model used in information security to categorise threats across 6 dimensions (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). We apply the **same structural rigour** to political threats:

| ISMS STRIDE | Threat Type | Political PRIDES | Political Manifestation |
|---|---|---|---|
| **S**poofing | False identity/claims | **P**olarization | False narratives, divisive rhetoric, misleading framing |
| **T**ampering | Unauthorised modification | **R**egulatory Overreach | Abuse of legislative power, bypassing democratic norms |
| **R**epudiation | Denying actions | **I**nstitutional Erosion | Undermining accountability, weakening democratic institutions |
| **I**nformation Disclosure | Unauthorised exposure | **D**emocratic Deficit | Opacity, restricted public access, press freedom violations |
| **D**enial of Service | Blocking legitimate use | **E**conomic Disruption | Policy-driven economic harm, fiscal irresponsibility |
| **E**levation of Privilege | Gaining unauthorised access | **S**ocietal Impact | Rights erosion, disproportionate harm to vulnerable groups |

## 3. PRIDES Category Definitions

### P — Polarization
**What it is**: Intentional or systematic division of public opinion along political, social, or identity-based lines, through misleading rhetoric, disinformation, or populist framing.

**Observable indicators in Swedish parliamentary context**:
- Desinformation or propaganda keywords in document text
- Hatretorik (hate rhetoric) or extremism language
- Oss och dem (us and them) framing in speeches
- Migration policy used as wedge issue with divisive framing
- Nationalistisk rhetoric in chamber debates

**Democratic consequence**: Erodes shared political discourse; undermines coalition-building; increases social fragmentation.

**Swedish countermeasures**:
- SVT and SR public broadcasting obligations (balanced coverage mandate)
- Tryckfrihetsförordningen (Press Freedom Act)
- Civil society fact-checking organisations
- Parliamentary cross-party dialogue culture

---

### R — Regulatory Overreach
**What it is**: Abuse of legislative or executive power; bypassing parliamentary process; concentrating regulatory authority beyond democratic mandate.

**Observable indicators**:
- Undantagsbefogenheter or nödbefogenheter (extraordinary powers) language
- Maktkoncentration (power concentration) in document content
- Legislation designed to circumvent parliamentary oversight
- Regulatory carve-outs excluding specific actors from normal scrutiny

**Democratic consequence**: Weakens parliamentary sovereignty; concentrates power; undermines checks and balances.

**Swedish countermeasures**:
- Lagrådet (Council on Legislation) mandatory pre-legislative constitutional review
- Constitutional Committee (KU) retrospective oversight
- Misstroendevotum (parliamentary no-confidence) mechanism
- JO and JK (Ombudsman institutions) investigate executive overreach

---

### I — Institutional Erosion
**What it is**: Systematic weakening of democratic institutions, accountability mechanisms, or constitutional oversight. Includes accountability gaps, judicial capture, and democratic backsliding.

**Observable indicators**:
- KU (Constitutional Committee) investigation — always a strong indicator
- Ansvarslöshet or accountability gap language
- Konstitutionsbrott (constitutional violation) references
- Court packing or judicial independence threats
- Institutional capture signals

**Democratic consequence**: Long-term structural damage to democratic function; accountability failure becomes self-reinforcing.

**Swedish countermeasures**:
- Independent judiciary (Högsta domstolen, Högsta förvaltningsdomstolen)
- Parliamentary Ombudsman (JO) investigates maladministration
- KU retrospective review of government exercise of power
- ECHR and EU Charter provide supranational constitutional protection

---

### D — Democratic Deficit
**What it is**: Restriction of public access to information, press freedom violations, transparency failures, or deliberate opacity in government decision-making.

**Observable indicators**:
- Offentlighetsprincipen (public access principle) restriction language
- Sekretess (secrecy) or hemligstämplad (classified) expansion
- Pressfrihet or yttrandefrihet (freedom of press/speech) threats
- Begränsad insyn (restricted oversight) signals
- Whistleblower protection weakening

**Democratic consequence**: Citizens cannot hold power accountable without information; media cannot fulfil watchdog function.

**Swedish countermeasures**:
- Offentlighetsprincipen (constitutional principle — Tryckfrihetsförordningen 2 kap.)
- Freedom of the press and expression (TF, YGL) constitutional protections
- EU General Data Protection Regulation (GDPR) and privacy rights
- ECHR Article 10 (freedom of expression)

---

### E — Economic Disruption
**What it is**: Policy-driven economic harm; fiscal irresponsibility; policy failures that cause macroeconomic instability or economic harm to citizens.

**Observable indicators**:
- Budgetkris (budget crisis) or statsbankrutt (state bankruptcy) language
- Skuldkris (debt crisis) or finanskris (financial crisis) signals
- FiU involvement with economic disruption content
- Inflation spiral or stagflation language
- Coalition budget deadlock signals

**Democratic consequence**: Economic instability undermines social trust; fiscal failure limits democratic government's ability to function; vulnerable groups disproportionately harmed.

**Swedish countermeasures**:
- Independent Riksbank mandate (monetary policy buffer)
- Finanspolitiska rådet (Fiscal Policy Council) independent monitoring
- EU Stability and Growth Pact fiscal constraints
- Cross-party budget framework limiting extreme year-on-year changes

---

### S — Societal Impact
**What it is**: Disproportionate harm to vulnerable groups, erosion of fundamental rights, discriminatory policy effects, or systematic social exclusion through political decisions.

**Observable indicators**:
- Marginaliserade (marginalised) or utsatta grupper (vulnerable groups) language
- Diskriminering (discrimination) or rättighetsförlust (rights loss) signals
- Ojämlikhet (inequality) or social exclusion content
- SoU, SfU, or AU committee involvement with welfare/rights content
- Mänskliga rättigheter (human rights) concerns

**Democratic consequence**: Democratic legitimacy depends on inclusion; systematic exclusion of groups undermines democratic social contract.

**Swedish countermeasures**:
- Diskrimineringsombudsmannen (DO) — equality ombudsman
- Swedish welfare state baseline protections (socialtjänstlagen, etc.)
- ECHR Article 14 (prohibition of discrimination)
- EU equality law and Charter of Fundamental Rights

## 4. Threat Agents

### 4.1 Threat Agent Classification

| Agent | Primary Activities | Detection Signals |
|---|---|---|
| **ruling-coalition** | Policy agenda, legislative control, executive decisions | Proposition keywords, statsminister, Tidöavtal references |
| **opposition-parties** | Obstruction, alternative agendas, populist pressure | Motion keywords, interpellation filing, bloc references |
| **external-actors** | Foreign influence, EU regulatory pressure | EU/NATO/foreign government references, UU/FöU committee |
| **special-interests** | Lobbying, regulatory capture | Lobbyism, branschintresse, corporate influence signals |
| **media** | Narrative framing, selective coverage, disinformation | Media narrative signals, press freedom references |
| **institutional** | Implementation failures, bureaucratic inertia | Agency/myndighet keywords, bet/ds/dir document types |

### 4.2 Agent Detection in Swedish Context

- **Propositions (prop)** → ruling-coalition primary agent
- **Motions (mot), Interpellations (ip)** → opposition-parties primary agent
- **Foreign Affairs (UU), Defence (FöU) committee** → external-actors relevant
- **Committee reports (bet), Directives (dir)** → institutional agent relevant

## 5. Severity Calibration

| Level | Definition | Example Scenarios |
|---|---|---|
| **critical** | Immediate, fundamental threat to democratic function | Misstroendevotum context, constitutional breach, fundamental rights emergency |
| **high** | Serious, near-term threat requiring political response | KU investigation active, significant democratic accountability gap |
| **medium** | Moderate threat with observable indicators | Polarising rhetoric in debate, transparency concerns, emerging social tensions |
| **low** | Latent threat, early warning signal | Minor transparency concern, low-level institutional friction |

### 5.1 Calibration Principles
- Reserve **critical** for genuine constitutional or democratic emergencies
- **high** is appropriate for serious KU oversight findings or major democratic concerns
- Most ordinary parliamentary documents should produce **medium** or **low** threats
- Never assign all 6 categories as **critical** — that indicates miscalibration

## 6. Implementation Reference

**TypeScript Engine**: `scripts/analysis-framework/political-threat-analysis.ts`  
**Types**: `scripts/analysis-framework/methodology-types.ts`  
**AI Prompt**: `scripts/prompts/v2/political-threat-prompt.md`  
**Tests**: `tests/political-methodology.test.ts`

### 6.1 Quick API Reference
```typescript
import { analysePoliticalThreats, analyseSinglePridesCategory } from './political-threat-analysis.js';

// Full PRIDES profile
const profile = analysePoliticalThreats(doc, ciaContext);
console.log(profile.overallThreatLevel);  // 'critical' | 'high' | 'medium' | 'low' | 'none'
console.log(profile.primaryThreat);       // dominant PridesCategory
console.log(profile.activeThreatAgents); // ThreatAgent[]

// Targeted single-category analysis
const polarizationThreat = analyseSinglePridesCategory(doc, 'polarization', ciaContext);
console.log(polarizationThreat?.severity);        // 'critical' | 'high' | 'medium' | 'low'
console.log(polarizationThreat?.countermeasures); // string[]
```

## 7. Worked Examples

### Example 1: KU Constitutional Investigation (Institutional Erosion)
**Document**: KU-granskning av grundlagsändring  
**Committee**: KU  

| PRIDES | Threat Agents | Severity |
|---|---|---|
| polarization | opposition-parties, media | low |
| regulatory-overreach | ruling-coalition | medium |
| **institutional-erosion** | **ruling-coalition, institutional** | **high** |
| democratic-deficit | ruling-coalition | medium |
| economic-disruption | institutional | low |
| societal-impact | institutional | low |
| **Primary Threat: institutional-erosion** | | **Overall: HIGH** |

### Example 2: Polarising Migration Interpellation
**Document**: Interpellation about migration and integration, SD party  

| PRIDES | Threat Agents | Severity |
|---|---|---|
| **polarization** | **opposition-parties, media** | **high** |
| regulatory-overreach | ruling-coalition | low |
| institutional-erosion | institutional | low |
| democratic-deficit | ruling-coalition | low |
| economic-disruption | ruling-coalition | low |
| societal-impact | opposition-parties | medium |
| **Primary Threat: polarization** | | **Overall: HIGH** |

### Example 3: Routine Written Question
**Document**: Written question about local transport  

| PRIDES | Threat Agents | Severity |
|---|---|---|
| polarization | ruling-coalition | low |
| regulatory-overreach | ruling-coalition | low |
| institutional-erosion | institutional | low |
| democratic-deficit | ruling-coalition | low |
| economic-disruption | ruling-coalition | low |
| societal-impact | ruling-coalition | low |
| **Primary Threat: polarization** | | **Overall: LOW** |

## 8. Integration Points

- **`DocumentAnalysisResult.methodologyAnalysis.threatProfile`**: Full PRIDES profile
- **Article framing**: `primaryThreat` guides which democratic risk to highlight
- **Headline selection**: `overallThreatLevel = 'critical'` → democracy-focused framing
- **Editorial safeguards**: Always present `countermeasures` alongside threat identification
- **SWOT integration**: Threat analyses feed into SWOT threat quadrant
