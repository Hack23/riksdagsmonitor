# Classification Results — 2026-05-22 Propositions

**Date**: 2026-05-22
**Dimensions**: Policy Domain · Legal Instrument · Constitutional Salience · GDPR Sensitivity · Implementation Complexity · Reversibility · Controversy Index

## 7-Dimension Classification Matrix

| dok_id | Policy Domain | Legal Instrument | Constitutional | GDPR | Impl. Complexity | Reversibility | Controversy |
|--------|--------------|-----------------|---------------|------|-----------------|--------------|-------------|
| HD03267 | Security/Migration | Lag | HIGH | HIGH (biometric) | HIGH | LOW | 9/10 |
| HD03262 | Migration | Lag (Utlänningslagen amendment) | HIGH | HIGH (residence status) | HIGH | VERY LOW | 10/10 |
| HD03265 | Migration/Criminal | Lag | HIGH | HIGH (location data) | HIGH | LOW | 8/10 |
| HD03254 | Defence/Military | Lag + International Treaty | VERY HIGH | LOW | HIGH | MEDIUM | 6/10 |
| HD03261 | Tax/Registry | Lag (Skatteverket powers) | HIGH | VERY HIGH (database cross-ref) | MEDIUM | LOW | 7/10 |
| HD03250 | Digital/Identity | Lag + Förordning | MEDIUM | HIGH (identity) | VERY HIGH | MEDIUM | 5/10 |
| HD03263 | Migration | Lag | MEDIUM | LOW | HIGH | LOW | 7/10 |
| HD03264 | Migration | Lag | MEDIUM | MEDIUM | MEDIUM | LOW | 6/10 |
| HD03258 | Governance/Finance | Lag | MEDIUM | LOW | MEDIUM | HIGH | 4/10 |
| HD03251 | Social/Health | Lag | LOW | HIGH (health data) | HIGH | HIGH | 2/10 |

## Detailed Classification Notes

### HD03267 — Security Threat Deportation
- **Constitutional**: Touches RF 2 kap. (grundläggande fri- och rättigheter), ECHR Art. 3 (non-refoulement), Art. 6 (fair trial)
- **GDPR**: SÄPO determination involves profiling and special category data; PbD compliance unclear
- **Reversibility**: Once deported, re-admission extremely unlikely in practice; de facto irreversible
- **Controversy**: Maximum — opposition has flagged ECHR Art. 3 absolute prohibition concerns

### HD03262 — Permanent Residence Abolition
- **Constitutional**: Does not contradict RF directly (RF guarantees to Swedish citizens only); conflicts with EU long-term resident directive 2003/109/EC for EEA residents
- **GDPR**: Residence status is indirectly identifying and enables data linkage — DPIA recommended
- **Reversibility**: Institutional path dependency — once administrative systems retooled, re-introduction of permanent permits would require new legislation and significant IT rebuild
- **Controversy**: 10/10 — no comparable reform anywhere in EU for non-crisis circumstances

### HD03265 — Supervision and Detention
- **Constitutional**: Balances RF 2:17 (freedom of movement) against public security; Lagrådet scrutiny expected
- **GDPR**: Electronic tagging involves continuous location data — special category processing
- **Reversibility**: LOW — once detention estate expanded, political pressure to maintain capacity

### HD03254 — Military Cooperation
- **Constitutional**: VERY HIGH — Sweden's written constitution (RF kap. 10) requires parliamentary consent for foreign forces on Swedish soil; this proposition creates a framework pre-authorisation, the constitutionality of which will be scrutinised by KU
- **GDPR**: LOW — military operations data is outside GDPR scope
- **Implementation**: HIGH — requires revision of HOPs (operational procedures), NATO interoperability protocols

### HD03261 — Skatteverket Registry Powers
- **Constitutional**: HIGH — database cross-referencing can create de facto surveillance without individual authorisation
- **GDPR**: VERY HIGH — primary data controller risk; IMY opinion flagged scope creep in remissvar
- **Implementation**: MEDIUM — Skatteverket has mature IT infrastructure; timeline 12-18 months

### HD03250 — State E-Identity
- **Constitutional**: MEDIUM — creates state-controlled identity infrastructure; BankID market competition concerns
- **GDPR**: HIGH — biometric and identity data at scale
- **Implementation**: VERY HIGH — requires Digg to build from scratch; prior IT project failures at Digg on record (Statskontoret 2024)

## Cross-Dimension Compound Risk Indicators

**Maximum compound risk (High Constitutional + Very High GDPR + Low Reversibility)**:
- HD03262: Permanent residence abolition — compound risk CRITICAL
- HD03267: Security deportation — compound risk CRITICAL
- HD03265: Detention expansion — compound risk HIGH

**Acceptable compound risk (Medium Constitutional + Low Controversy)**:
- HD03251: Mental health care — compound risk LOW
- HD03258: Political transparency — compound risk LOW

## GDPR Sensitivity Summary

| dok_id | Art. 9 Special Category | DPIA Needed | IMY Contact | Risk Level |
|--------|------------------------|-------------|-------------|-----------|
| HD03267 | Yes (biometric, SÄPO profiling) | Yes (mandatory) | Yes | CRITICAL |
| HD03265 | Yes (location continuous) | Yes (mandatory) | Yes | HIGH |
| HD03261 | Potentially (health inferences from address patterns) | Yes (recommended) | Prior opinion exists | HIGH |
| HD03250 | Yes (identity, potentially biometric) | Yes (mandatory) | Required pre-launch | HIGH |
| HD03262 | No direct, but linkage risk HIGH | Yes (recommended) | — | MEDIUM |
| HD03251 | Yes (health data) | Yes (mandatory) | Standard health | MEDIUM |
