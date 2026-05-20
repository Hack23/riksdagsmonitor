# Threat Analysis
**Date**: 2026-05-20 | **Subfolder**: realtime-pulse  
**Framework**: STRIDE + DISARM (political threats) per THREAT_MODEL.md

---

## Analytical Scope

Political threat analysis of the risks arising from the May 20, 2026 legislative session. Includes constitutional fragility threats, implementation threats, information-environment threats, and electoral threats.

---

## STRIDE-Adapted Framework (Political Context)

| STRIDE category | Political equivalent |
|----------------|---------------------|
| Spoofing | Identity/mandate fraud — claims of electoral mandate for policies not voted on |
| Tampering | Constitutional process manipulation — bundling of unrelated provisions |
| Repudiation | Deniability claims on policy outcomes |
| Information disclosure | Selective framing of vote outcomes |
| Denial of service | Parliamentary obstruction; municipal non-compliance |
| Elevation of privilege | Constitutional entrenchment to prevent reversal |

---

## T1 — Constitutional Fragility (KU34 Vilande)

**Threat class**: Process integrity — Repudiation + Elevation of privilege  
**Probability**: MODERATE (35%)  
**Impact**: CRITICAL  
**Actor**: Post-election parliamentary arithmetic

**Description**: The vilande mechanism creates a 4-month constitutional window. The September 2026 election could alter the parliamentary balance sufficiently to:
1. Prevent a second reading if the new majority disagrees with the bundled provisions (föreningsfrihet + citizenship revocation alongside abortion)
2. Force renegotiation of non-abortion provisions, delaying final adoption
3. Generate constitutional controversy if the second reading fails

**Trigger conditions**: V or C gaining seats + S forming government with conditions to re-examine KU34 provisions  
**Mitigation available**: Early agreement between S and M+KD on the abortion component as separable from other provisions before election  
**Residual risk**: MODERATE — KU34 is popular but its bundled provisions are contested

---

## T2 — Implementation Failure (SoU30 Medical Certificates)

**Threat class**: Operational — Denial of service (municipal capacity)  
**Probability**: HIGH (55%)  
**Impact**: HIGH  
**Actor**: Municipal administrations, NGOs, affected beneficiaries

**Description**: The July 1, 2026 mandatory medical certificate requirement creates a 42-day implementation window (adoption → entry into force). Threats:
1. Municipal IT systems unprepared → manual processing → delays/denials
2. GP shortage → beneficiaries cannot obtain required certificates → benefits interrupted
3. Pre-election social media amplification of individual denial cases
4. Legal challenges filed immediately post-adoption (administrative law courts)

**Evidence for HIGH probability**: Similar reforms in Denmark (2016 bidragsloft) generated 6–12 months of implementation turbulence. Swedish municipalities have flagged capacity concerns. Source: HD01SoU30 reservations, municipal associations' position.  
**Mitigation available**: Government could issue implementation guidance; allow grace period; increase GP remuneration for certificate consultations  
**Residual risk**: HIGH — timeline is structurally insufficient

---

## T3 — Legal Challenge (SoU30 EU/ECHR Compliance)

**Threat class**: Legal — Tampering (retroactive policy reversal via courts)  
**Probability**: MODERATE (40%)  
**Impact**: MODERATE-HIGH  
**Actor**: Legal aid organizations, opposition parties, EU Commission

**Description**: SoU30's restriction of försörjningsstöd to "legally present" persons faces challenges under:
- ECHR Art. 3 (inhuman or degrading treatment — if destitution results)
- EU Charter Art. 1 (human dignity)
- EU Social Security Regulation 883/2004

**Trigger conditions**: Cases reaching ECHR within 12–18 months; EU Commission infringement proceedings  
**Evidence**: HD01SoU30 reservation R5 (C) explicitly flags EU law concerns. Source: HD01SoU30.  
**Mitigation available**: Government seeks ECHR advisory opinion proactively  
**Residual risk**: MODERATE — risk of prolonged legal uncertainty

---

## T4 — Information Environment Threats (DISARM)

**Threat class**: Information — Spoofing + Information disclosure  
**Probability**: HIGH (elections context)  
**Impact**: MODERATE (narrative contestation)  
**Actor**: Domestic political operators, social media amplifiers

**DISARM TTPs observed or anticipated**:

| TTP | Description | Evidence |
|-----|-------------|---------|
| T0023 — Competing narratives | Government frames KU34 as "rights expansion"; opposition frames welfare as "stigmatizing the poor" | Party press releases (anticipated) |
| T0046 — Seed distortions | KU34 provisions on citizenship revocation being described as "anti-rights" by V/MP | HD01KU34 V reservation |
| T0049 — Flooding the zone | Simultaneous KU34 + SoU30 complexity → media oversimplification | Structural risk from multi-topic sitting |
| T0059 — Exploit tragedies | Individual benefit denial cases amplified pre-election | SoU30 implementation risk |

**Mitigation**: Riksdagsmonitor provides accurate primary-source analysis to counter DISARM TTPs. This article's specificity (exact vote counts, named reservations, constitutional mechanism) is the primary counter-TTP.

---

## T5 — Electoral Threat (Constitutional Uncertainty as Campaign Issue)

**Threat class**: Electoral — Elevation of privilege  
**Probability**: HIGH (110 days is 100% certainty of electoral impact)  
**Impact**: HIGH  
**Actor**: All parties — KU34 becomes the defining election issue

**Description**: The vilande mechanism transforms the September 2026 election into a simultaneous:
1. Choice of government (routine electoral function)
2. Constitutional ratification referendum (extraordinary function — implicit)

Voters may not fully understand that their vote influences whether the constitutional abortion right becomes permanent. If this mechanism is not clearly communicated, post-election claims of mandate ambiguity are likely.

**Risk scenarios**:
- V voters unaware their anti-KU34-provisions stance risks the abortion right itself
- L voters conflicted between government support and rights concerns
- International attention on Swedish "abortion rights at stake in election"

**Mitigation available**: Clear public communication from Riksdag and KU committee on the vilande mechanism  
**Residual risk**: HIGH — mechanistic complexity will not be fully communicated at scale

---

## Threat Summary Matrix

| Threat | Probability | Impact | Priority |
|--------|------------|--------|----------|
| T1 — Constitutional fragility | MODERATE | CRITICAL | P1 |
| T2 — SoU30 implementation failure | HIGH | HIGH | P1 |
| T3 — Legal challenges | MODERATE | MODERATE-HIGH | P2 |
| T4 — Information environment | HIGH | MODERATE | P2 |
| T5 — Electoral confusion on vilande | HIGH | HIGH | P1 |

*Evidence: HD01KU34, HD01SoU29, HD01SoU30, HD01JuU43. Methodology: THREAT_MODEL.md; DISARM TTPs v1.4.*
