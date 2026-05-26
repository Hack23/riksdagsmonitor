# Threat Analysis — Realtime Monitor 2026-05-26

**Analyst:** James Pether Sörling | **Date:** 2026-05-26
**Method:** Legislative STRIDE adaptation — Spoofing/Substitution, Tampering, Repudiation, Information disclosure, Denial, Elevation

---

## Threat Analysis by Legislative Instrument

### HD03271 — En förändrad abortlag

**Threat T1.1 — Constitutional spoofing (RF 2:6)**
Type: Constitutional integrity threat
Description: The abortion law change may be presented as a "medical safeguard" measure when it functionally restricts the constitutional right to bodily integrity (RF 2:6). If this framing succeeds, the constitutional protection is effectively bypassed without formal amendment.
Likelihood: POSSIBLE | Impact: CRITICAL (constitutional integrity)
Mitigation: Lagrådet referral; KU scrutiny of RF 2:6 compatibility

**Threat T1.2 — ECHR Art. 8 violation**
Type: International human rights law
Description: Mandatory consultation or reduced access may constitute interference with Art. 8 (private life) without meeting the "necessary in a democratic society" test.
Likelihood: POSSIBLE | Impact: HIGH
Mitigation: Lagrådet opinion; full text analysis; comparison with ECHR jurisprudence

**Threat T1.3 — Democratic accountability gap (full text not published promptly)**
Type: Transparency / democratic deliberation
Description: If HD03271 full text is not published and analysed before public debate concludes, citizens and opposition MPs cannot provide informed scrutiny. This is a threat to the democratic deliberation process.
Likelihood: LOW (Swedish offentlighetsprincip requires timely publication) | Impact: MEDIUM
Mitigation: Automatic publication via offentlighetsprincipen (TF 2 kap.)

---

### HD01FöU17 — Sveriges militära stöd till Ukraina

**Threat T2.1 — Scope creep in materiel transfers**
Type: Mandate boundary
Description: Authorisation framework may be interpreted more broadly in implementation than Riksdagen intended, particularly regarding offensive versus defensive materiel distinction.
Likelihood: LOW | Impact: MEDIUM
Mitigation: KU oversight; FöU committee follow-up requirements

**Threat T2.2 — Information disclosure (sensitive military materiel)**
Type: National security / GDPR adjacent
Description: Detailed public reporting of specific materiel transfers may reveal operational capabilities to adversaries. Riksdagen's duty of public disclosure vs. military operational security.
Likelihood: POSSIBLE | Impact: HIGH (classified aspects)
Mitigation: Government follows established practice of redacting sensitive specifics from public authorisations

**Threat T2.3 — Russian hybrid response**
Type: Hybrid warfare / critical infrastructure
Description: Sweden's FöU17 authorisation may trigger Russian hybrid operations (disinformation, cyber, infrastructure interference). Sweden's hybrid threat level elevated since NATO accession.
Likelihood: POSSIBLE | Impact: HIGH
Mitigation: NCSC (National Cyber Security Centre), MSB readiness; NATO Art. 3/5 deterrence

---

### HD01JuU48 — Nytt straffrättsligt påföljdssystem

**Threat T3.1 — Retroactive effect (ECHR Art. 7)**
Type: Human rights law — nulla poena
Description: If the new sanctions framework is applied retroactively to ongoing cases, it violates ECHR Art. 7 (no punishment without law). Criminal justice reforms with immediate application risk this.
Likelihood: LOW (Swedish legislative practice avoids retroactivity) | Impact: HIGH
Mitigation: Explicit transitional provisions; Lagrådet review

**Threat T3.2 — Prison capacity overflow**
Type: Systemic implementation threat
Description: Tougher sanctions → longer sentences → higher prison population in an already at-capacity system. Kriminalvården may be unable to implement without emergency capacity expansion.
Likelihood: LIKELY | Impact: HIGH
Mitigation: Kriminalvården budget expansion (requires supplementary budget)

---

### HD01UU24 — Civil underrättelsetjänst

**Threat T4.1 — Mission creep**
Type: Institutional boundary
Description: New civilian intelligence service may expand beyond its statutory mandate, particularly regarding domestic surveillance of political actors. Comparable risks to SÄPO mission-creep in 1960s–70s IB affair.
Likelihood: POSSIBLE | Impact: CRITICAL (democratic accountability)
Mitigation: Strong parliamentary oversight committee (currently WEAK — see comparative-international.md)

**Threat T4.2 — GDPR Art. 9 political opinion processing**
Type: Data protection
Description: Civil intelligence activities involving political actors require Art. 9(2)(g) substantial public interest basis. Without explicit statutory authorisation, collection on political persons may be unlawful.
Likelihood: POSSIBLE | Impact: HIGH
Mitigation: Explicit statutory provisions in UU24; dedicated Data Protection Officer oversight

---

## Threat Summary Matrix

| Threat ID | Legislation | Type | Likelihood | Impact | Priority |
|-----------|------------|------|-----------|--------|---------|
| T1.1 | HD03271 | Constitutional | POSSIBLE | CRITICAL | HIGH |
| T1.2 | HD03271 | ECHR | POSSIBLE | HIGH | HIGH |
| T1.3 | HD03271 | Transparency | LOW | MEDIUM | MEDIUM |
| T2.1 | FöU17 | Mandate | LOW | MEDIUM | LOW |
| T2.2 | FöU17 | Security | POSSIBLE | HIGH | MEDIUM |
| T2.3 | FöU17 | Hybrid warfare | POSSIBLE | HIGH | HIGH |
| T3.1 | JuU48 | ECHR | LOW | HIGH | MEDIUM |
| T3.2 | JuU48 | Systemic | LIKELY | HIGH | HIGH |
| T4.1 | UU24 | Democratic | POSSIBLE | CRITICAL | HIGH |
| T4.2 | UU24 | GDPR | POSSIBLE | HIGH | HIGH |
