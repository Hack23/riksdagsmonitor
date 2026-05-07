# Threat Analysis — Evening Analysis 2026-05-07

**Method**: STRIDE + Actor-based threat modeling  
**Classification**: 🟢 PUBLIC

## Threat Actor Landscape

### State-Level Threats

| Actor | Intent | Capability | Relevance today |
|-------|--------|-----------|-----------------|
| Russia | Undermine Swedish security legislation | HIGH | FöU18 SIGINT reform directly targets Russian SIGINT capabilities; HD03267 strengthens powers against Russian intelligence operatives |
| China | Exploit financial sector | MEDIUM | FiU38 OTC derivatives — China is major counterparty in global derivatives markets; clearing requirements affect Chinese counterparty access |
| Iran | Diplomatic retaliation to HD11795 (Iran support motion) | LOW | SD motion supporting Iranian people — Iranian regime may intensify influence operations |

### Non-State Threats

| Actor | Intent | Capability | Relevance |
|-------|--------|-----------|-----------|
| Organised crime | Evade JuU34 Nordic enforcement | HIGH | JuU34 strengthens cross-border enforcement — criminal networks will shift operations |
| Domestic extremists | Exploit ambiguity in JuU32 (public gatherings) | MEDIUM | Police discretion expansion under JuU32 creates operational targeting questions |
| Financial criminals | Exploit welfare system gaps | MEDIUM | FiU43 welfare fraud — municipalities gain new tools but implementation gap persists |

## STRIDE Analysis — Key Legislative Items

### HD03261 (Skatteverket) — Digital Infrastructure Threat

**Spoofing**: Extended Skatteverket access to population data creates larger target for identity spoofing attacks. More data in one registry = higher-value target.  
**Tampering**: If Skatteverket systems are compromised, folkbokföringsdata could be manipulated, affecting millions of administrative processes.  
**Repudiation**: New access logs required under GDPR Art. 30 — implementation of audit trails is crucial.  
**Information disclosure**: Population registry contains sensitive personal data. Expansion increases exposure surface.  
**Denial of service**: DDoS against Skatteverket population systems would have cascading effects on municipal services using the data.  
**Elevation of privilege**: New powers create insider threat vectors — Skatteverket staff with expanded system access.

**Mitigation requirements**: Zero-trust architecture, IMY oversight, mandatory breach notification, compartmentalisation.

### FöU18 (SIGINT) — Intelligence Operations Threat

**Foreign intelligence exploitation**: Adversaries will study FöU18 to identify gaps in Swedish SIGINT legal authority — timing of enactment matters.  
**Oversight vulnerabilities**: New collection authorities without commensurate oversight bodies create accountability gaps that adversaries can exploit narratively (claiming illegal surveillance).  
**ECHR/CJEU challenge by adversary-linked NGOs**: Russia has historically funded legal challenges to NATO member SIGINT laws through third-party organizations.

### HD03267 (Security Threats) — Counter-Intelligence Dimension

This proposition directly addresses persons identified as security threats. Implications:
- **SÄPO operational interface**: The new proposition changes SÄPO's legal toolkit — affects active cases.
- **Expulsion of intelligence assets**: State actors maintaining cover identities in Sweden could be affected.
- **Due process risk**: Expedited proceedings create risk of wrongful expulsion — potential for adversary to manufacture security threat claims against Swedish sources.

## Threat Assessment Summary

| Threat | Probability | Impact | Owner |
|--------|------------|--------|-------|
| Russian interference targeting FöU18 | MEDIUM (0.35) | HIGH (0.85) | MUST/SÄPO |
| Data breach from HD03261 expansion | MEDIUM (0.30) | HIGH (0.80) | Skatteverket/IMY |
| Financial crime via FiU37 implementation gap | LOW (0.20) | HIGH (0.75) | Finansinspektionen |
| ECHR challenge to HD03267 | LIKELY (0.45) | MEDIUM (0.60) | Justitiedepartementet |
| Nordic criminal networks evading JuU34 | MEDIUM (0.30) | MEDIUM (0.55) | Rikspolis/Europol |
