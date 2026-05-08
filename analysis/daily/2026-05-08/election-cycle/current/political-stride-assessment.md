# Political STRIDE Assessment — Swedish Election Cycle 2022-2026

**Date**: 2026-05-08 | **Cycle**: Current | **T-128 days**  
**Framework**: STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Adapted**: STRIDE applied to political/democratic systems (not solely ICT)  
**Confidence**: HIGH [Admiralty B2]

---

## STRIDE Framework (Democratic-System Application)

### S — Spoofing (Political Identity/Legitimacy Spoofing)

**Threat**: Foreign actors or domestic groups misrepresenting political positions or fabricating statements to manipulate voter perception  
**Current instances**:
- Russian information operations (SVT investigation 2025): Fabricated Kristersson quotes on NATO; detected by MSB  
- Social media deep-fake risk: Riksdag security committee (JuU) warned 2026-03 about AI-generated video fabrications targeting L/SD  
**Assessment**: MEDIUM risk — MSB + Säpo pre-election monitoring active; HD03267 provides legal framework for state-actor expulsion  
**Evidence**: HD03267 (security threat expulsion), Säpo 2025 threat assessment  
**WEP**: Attempts LIKELY; successful spoofing impact UNLIKELY  

### T — Tampering (Electoral Process/Data Integrity)

**Threat**: Unauthorized modification of voter rolls, ballot tabulation systems, or Riksdag voting records  
**Current instances**:
- Valmyndigheten commissioned CERT-SE security audit Q1 2026 (results: classified)  
- Skatteverket folkbokföring false-address problem (HD03261): 12% error rate creates voter roll anomalies  
**Assessment**: HD03261 directly addresses the most accessible tampering vector (false address registrations → false voter roll entries). State e-ID (HD03250) adds authentication layer.  
**Evidence**: HD03261, HD03250, HC03181 (election security law)  
**WEP**: Opportunistic tampering attempts ROUGHLY EVEN; systemic tampering UNLIKELY  

### R — Repudiation (Democratic Accountability Gaps)

**Threat**: Political actors denying or obfuscating their positions on key legislation; accountability gaps in confidence-and-supply arrangements  
**Current instances**:
- SD-Tidö confidence-and-supply: SD denies full coalition responsibility for M/KD/L policies while enabling them → classic repudiation pattern  
- Gaza/war-crimes (HD10470, HD11789): Government non-committal responses preserve deniability at cost of credibility  
**Assessment**: Structural repudiation baked into Swedish parliamentary practice; not acute  
**Evidence**: HD10470, HD11789 Riksdag record  
**WEP**: Repudiation pattern continues LIKELY  

### I — Information Disclosure (Classified/Sensitive Political Intelligence Leaks)

**Threat**: Unauthorized disclosure of classified security assessments, coalition negotiations, or intelligence estimates  
**Current instances**:
- Säpo 2025 threat assessment: Declassified summary released; classified annex rumored in Riksdag security committee  
- FOI (HD01FöU16): New oversight rules create clearer classification boundaries  
**Assessment**: LOW risk — Sweden's classification framework (Offentlighets- och sekretesslagen) is robust; Lagrådet oversight ensures proportionality  
**Evidence**: HD01FöU16 (FOI reform), OSL framework  
**WEP**: Unauthorized disclosure UNLIKELY  

### D — Denial of Service (Political/Democratic Process Disruption)

**Threat**: Disruption of parliamentary sessions, election logistics, or government decision-making capacity  
**Current instances**:
- Demonstration-related public order risks: HD01JuU32 (strengthened rules for public gatherings) directly addresses this  
- Cyberattack on Riksdag IT systems: ongoing low-level attempts (MSB Q4 2025 report)  
**Assessment**: HD01JuU32 passed 2026-05-07 — directly mitigates physical disruption risk. Cyber DoS risk managed by NCSC.  
**Evidence**: HD01JuU32, MSB cyber monitoring  
**WEP**: Physical disruption UNLIKELY; cyber disruption attempts ROUGHLY EVEN but impact manageable  

### E — Elevation of Privilege (Illegitimate Power Concentration)

**Threat**: Parliamentary or executive actors acquiring powers beyond constitutional mandate; emergency powers abuse; erosion of checks and balances  
**Current instances**:
- HD03267 (security threat expulsion): Expanded Migrationsverket/Säpo powers — Lagrådet review of RF 2:4 proportionality pending. Risk: administrative discretion could expand beyond security contexts.  
- HD03261 (Skatteverket): Expanded investigative powers over citizens — GDPR/OSL interface critical  
**Assessment**: MEDIUM risk — Lagrådet review pending for both critical propositions. Constitutional Safeguards: Riksdag Constitutional Committee (KU) oversight, Justitieombudsmannen (JO), GDPR Data Protection Authority.  
**Evidence**: HD03267, HD03261, Lagrådet precedent  
**WEP**: Constitutional violation UNLIKELY given Lagrådet oversight; administrative overreach ROUGHLY EVEN without explicit guidance  

---

## STRIDE Summary Matrix

| Threat | Likelihood | Impact | Mitigation | Residual Risk |
|--------|-----------|--------|-----------|---------------|
| Spoofing (political) | MEDIUM | HIGH | MSB, HD03267, Säpo | MEDIUM |
| Tampering (voter rolls) | LOW | CRITICAL | HD03261, HD03250, HC03181 | LOW |
| Repudiation (SD-Tidö) | HIGH (structural) | MEDIUM | Parliamentary record | MEDIUM |
| Information disclosure | LOW | HIGH | OSL framework, FOI reform | LOW |
| Denial of service | MEDIUM | HIGH | HD01JuU32, NCSC | LOW-MEDIUM |
| Privilege elevation | MEDIUM | HIGH | Lagrådet PIR-007, KU oversight | MEDIUM |

**Overall Democratic System STRIDE Rating**: MEDIUM (manageable with active Lagrådet + MSB oversight)
