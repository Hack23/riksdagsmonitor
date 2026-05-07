# Threat Analysis (STRIDE) — Monthly Review, May 2026

**Framework**: STRIDE + parliamentary threat actors
**Date**: 2026-05-07

## Threat Landscape Summary

The May 2026 legislative package introduces new information systems (e-legitimation), expanded state-data-collection (Skatteverket), and international legal enforcement links (Nordic enforcement). From a security architecture perspective, each creates new threat surfaces.

## STRIDE Analysis — HD03250 (Statlig e-legitimation)

| STRIDE | Threat | Severity | Probability |
|--------|--------|---------|-------------|
| **S**poofing | Nation-state actors attempting to spoof state e-ID issuance | HIGH | LOW |
| **T**ampering | Tampering with e-ID backend database (registry manipulation) | CRITICAL | LOW |
| **R**epudiation | Users denying transactions authenticated with e-ID | MEDIUM | MEDIUM |
| **I**nformation Disclosure | Mass data exfiltration from e-ID infrastructure | CRITICAL | MEDIUM |
| **D**enial of Service | Attack on e-ID authentication endpoints during election | HIGH | MEDIUM |
| **E**levation of Privilege | E-ID admin account compromise enabling mass identity theft | CRITICAL | LOW |

**Key control gap**: Single point of failure — centralised state e-ID infrastructure becomes critical national infrastructure. Security classification: must be equivalent to SÄPO-protected systems.

## Threat Actors

### State-Level
- **Russia GRU/SVR**: Active interest in Swedish identity infrastructure post-NATO accession. Likely intelligence gathering on e-ID architecture design documents. Risk: HIGH for espionage.
- **China MSS**: Lower tactical interest in Swedish e-ID specifically; broader interest in EU digital identity standardisation to identify replication targets.

### Criminal/Financial
- **Organised cybercrime (SEA)**: High incentive to compromise e-ID for financial fraud once mandatory. Historical pattern: BankID compromise attempts 2019–2024 show viable threat actor pool.

### Domestic
- **Far-right extremists**: Ideological opposition to mandatory digital identity; potential for sabotage attempts against implementation infrastructure. Probability LOW but elevated given Säkerhetspolisen threat level for right-wing extremism in Sweden.

## Threat Analysis — HD03267 (Säkerhetshot/utlänningar)

| Threat | Actor | Severity |
|--------|-------|---------|
| Abuse of "qualified security threat" designation | Domestic political actors | HIGH |
| ECHR challenge enabling foreign-state gaming of Swedish asylum system | State actors | MEDIUM |
| Real-time intelligence compromise on threat designation criteria | Russia | MEDIUM |

## HD01FiU37 — Financial Crisis Management System

New operational crisis function creates a new intelligence target. Threat: financial infrastructure operators now have clearer incident reporting obligations — this information, if leaked, enables adversaries to map Swedish financial system vulnerabilities. Control: information classification at restricted level required for incident reports.

## Parliamentary Threat Context

No evidence of foreign interference in current riksmöte legislative process. High interpellation density on Gaza (5 in 72h) may indicate coordinated civil society campaign amplification — standard democratic activity, not threat-level concern.
