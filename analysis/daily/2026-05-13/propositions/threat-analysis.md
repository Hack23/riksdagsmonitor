# Threat Analysis — Government Propositions 2026-05-13

**Framework**: STRIDE applied to legislative/political threats; Riksdagsmonitor Democratic Integrity Watchlist (DIW)

---

## Strategic Threat Landscape

### T1 — Normalisation of Exceptional Security Powers (HD03267)

**Category**: Democratic Integrity  
**STRIDE**: Tampering (with fundamental rights baseline)  
**Severity**: 🔴 CRITICAL  

The proposition's removal of time limits for adult detention is presented as a narrow technical fix ("qualified security threats"), but the structural effect is the creation of indefinite administrative detention power for a class of persons. Historical precedent (UK Control Orders, US NDAA detention provisions) demonstrates that "exceptional" security measures tend toward permanence and scope expansion. The threat is not primarily from this proposition in isolation but from the precedent it sets for future legislation.

**Indicators to watch**:
- Whether the "qualified security threat" definition is interpreted expansively by SÄPO
- Any future proposals to apply similar detention logic to other categories of persons
- Parliamentary debate on the precision of the evidentiary standard

### T2 — Centralisation of Digital Identity Infrastructure (HD03250)

**Category**: Digital Sovereignty / Privacy  
**STRIDE**: Spoofing / Information Disclosure  
**Severity**: 🟡 HIGH  

A state e-ID creates a single, government-controlled source of truth for citizen identity. While this addresses BankID's private monopoly risk, it creates a new concentration risk: a state system breach would expose the entire Swedish digital identity infrastructure. Additionally, a state-controlled e-ID can, in theory, be used for surveillance of citizens' digital activities more readily than a private system.

**Threat vector**: Data breach of the central state e-ID registry would be a critical national security incident. Insider threat from Skatteverket or the administering authority.

### T3 — Cumulative Surveillance Capacity (HD03261 + HD03250)

**Category**: Systemic Privacy Erosion  
**STRIDE**: Information Disclosure (aggregated)  
**Severity**: 🟡 HIGH  

Consider HD03261 (expanded Skatteverket registration powers) and HD03250 (state e-ID) together with prior expansions of Skatteverket's data powers since 2014. Each piece of legislation appears proportionate in isolation; cumulatively, Skatteverket is acquiring the data infrastructure of a surveillance state without formal designation as such.

### T4 — Pre-Election Legitimacy Challenge (All)

**Category**: Democratic Process  
**STRIDE**: Repudiation  
**Severity**: 🟠 MEDIUM  

All three propositions submitted 123 days before the election can be framed as "caretaker legislation" that binds a future government. HD03267's entry into force date of 1 March 2027 means any post-election government (including an alternative majority) would need to repeal active law rather than block a pending proposition.

---

## Democratic Integrity Watchlist Items

| Item | DIW Status | Notes |
|------|-----------|-------|
| HD03267 detention without time limits | 🔴 Active Watch | Fundamental rights baseline erosion |
| State e-ID centralisation | 🟡 Active Watch | New systemic risk category |
| Skatteverket scope creep | 🟡 Active Watch | Pattern risk across multiple laws |
| Pre-election legislation timing | 🟡 Active Watch | Democratic legitimacy concern |

---

## Threat Intelligence Summary

The primary threat is not the surface-level political contest over these three propositions but the longer-term structural shifts they represent in Swedish governance: a state with greater detention powers, a state with centralised digital identity infrastructure, and a state administrative apparatus with broader personal data access. Each shift is individually defensible; their cumulative trajectory points toward a materially different relationship between the Swedish state and its residents.
