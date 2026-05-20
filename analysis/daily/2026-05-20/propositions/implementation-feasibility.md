# Implementation Feasibility Analysis

**Date**: 2026-05-20  
**Framework**: Delivery risk assessment by proposition  
**Scale**: LOW / MEDIUM / HIGH / CRITICAL delivery risk

## Feasibility Matrix

| dok_id | Title | Delivery Risk | Lead Agency | Timeline Estimate | Key Risk Factors |
|--------|-------|--------------|-------------|------------------|-----------------|
| HD03267 | Security threat foreigners | HIGH | SÄPO + MV + Domstolsverket | 18–24 months post-enactment | Constitutional amendments may be required; court capacity for new proceedings |
| HD03250 | State e-ID | HIGH | Digg + Bolagsverket + eSam | 24–36 months (eIDAS 2 deadline end-2026 forces acceleration) | Cross-agency coordination; banking sector integration; IT delivery track record |
| HD03261 | Skatteverket folkbokföring | MEDIUM | Skatteverket | 12–18 months | GDPR amendments may reduce scope; existing Skatteverket digital infrastructure reduces risk |
| HD03258 | Political transparency | LOW | Valmyndigheten + parties | 6–12 months | Administrative simplicity; party compliance risk; reporting system development |
| HD03263 | Deportation enforcement | HIGH | Migrationsverket + Polisen | 18–24 months | International cooperation with receiving countries (diplomatic risk); Polisen capacity constraints |
| HD03264 | Character requirements | MEDIUM | Migrationsverket | 12–18 months | Discretion standards must be precisely codified to avoid discriminatory application |
| HD03255 | Household debt sampling | LOW | SCB + Riksbanken | 6–12 months | Technical data collection; SCB has existing methodology; low political risk |

## Detailed Feasibility Analysis: HD03250 (State e-ID) — Highest Complexity

**Phase 1 — Legal framework** (completed with enactment, Q4 2026)
- Legal basis: HD03250 enacted; Förordning issued by government
- Responsible: Justice/Finance Ministries

**Phase 2 — Technical architecture** (Q1–Q2 2027)
- Digg leads technical specification
- eSam (government interoperability forum) standard development
- BankID API integration or replacement specification
- **Risk**: BankID consortium will seek to shape API standards to require their infrastructure → regulatory capture risk

**Phase 3 — Bolagsverket system development** (Q2–Q4 2027)
- Bolagsverket designated as operator (consistent with their existing handelsregister/business register role)
- Identity proofing process development (how do you verify identity at issuance?)
- **Risk**: Physical service points needed for populations without bank accounts — requires partnership with kommuner (municipalities) → cost escalation

**Phase 4 — Banking sector integration** (Q3 2027–Q1 2028)
- Banks must accept state e-ID for authentication (Finansinspektionen mandate)
- PSD2 compliance layer
- **Risk**: Bank IT upgrade cycles are 18–24 months minimum; banks may seek exemptions

**Phase 5 — Public rollout** (Q2–Q3 2028)
- Mass communication campaign
- Elderly support programme (digital exclusion risk)
- Full operational status
- **eIDAS 2 deadline**: End-2026/early-2027 — **Sweden will almost certainly miss the formal deadline**; will need to notify EU Commission of delay → reputational risk mitigated by being in good company (all EU member states except Germany and Denmark are delayed)

## Critical Path: HD03263 (Deportation) — Highest Diplomatic Risk

The implementation of HD03263 depends on bilateral cooperation agreements with receiving countries. Sweden currently has formal readmission agreements with approximately 18 countries, but most removals are to countries without such agreements (Afghanistan, Iraq, Iran, Somalia, Eritrea). The new "stärkt återvändandeverksamhet" (strengthened return activity) cannot function without either:
1. New bilateral readmission agreements (2–5 years to negotiate)
2. EU-level return cooperation (existing Frontex agreements) — partially available
3. Incentive-based voluntary departure programmes — available but under-resourced

**Implementation verdict**: HD03263 is politically potent but practically constrained by diplomatic reality. The gap between stated policy ambition and operational delivery is HIGH. This is the proposition most likely to generate a "failure to deliver" narrative in the 2027–2028 post-election period.

## Cross-Proposition Implementation Dependency

HD03250 (state e-ID) must be operational before HD03261 (Skatteverket cross-database matching) reaches full effectiveness. The state e-ID provides the universal identifier that makes cross-database matching accurate. If HD03250 is delayed (likely by 18–24 months beyond the eIDAS 2 deadline), HD03261's most powerful provisions are also effectively delayed.
