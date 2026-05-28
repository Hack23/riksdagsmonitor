# Classification Results — Monthly Review 2026-05-28

**Author**: James Pether Sörling | **Date**: 2026-05-28  
**Framework**: ISMS-PUBLIC CLASSIFICATION.md | **Data**: PUBLIC (political data, no PII)

---

## GDPR / DPIA Assessment

| Category | Value | Note |
|----------|-------|------|
| Personal data processed | NO | Parliamentary documents are public institutional records |
| GDPR DPIA required | NO | No personal data; names of elected officials = public role data |
| Data classification | PUBLIC | Riksdag open data, Regeringen press releases |
| Retention | Permanent | Historical parliamentary record |
| Source | riksdagen.se (Riksdag API), regeringen.se | Licensed public domain |

## Document Classification

| dok_id | Category | Confidentiality | Integrity | Availability |
|--------|----------|----------------|-----------|--------------|
| HD03275 | Fiscal/foreign policy | PUBLIC | HIGH | HIGH |
| HD01NU20 | Energy regulation | PUBLIC | HIGH | HIGH |
| HD03276 | Criminal justice | PUBLIC | HIGH | HIGH |
| HD10521 | Parliamentary interpellation | PUBLIC | MEDIUM | HIGH |
| HD01JuU35 | Committee report | PUBLIC | HIGH | HIGH |
| HD03277 | Administrative dissolution | PUBLIC | HIGH | MEDIUM |
| HD01MJU27 | Regulatory enforcement | PUBLIC | MEDIUM | MEDIUM |
| HD10520 | Parliamentary interpellation | PUBLIC | MEDIUM | HIGH |

## CIA Triad: Analysis Artifacts

| Artifact family | Confidentiality | Integrity | Availability | RTO | RPO |
|-----------------|----------------|-----------|--------------|-----|-----|
| Core synthesis (A) | PUBLIC | HIGH | HIGH | 4h | 24h |
| Structural metadata (B) | PUBLIC | HIGH | HIGH | 8h | 48h |
| Strategic extensions (C) | PUBLIC | MEDIUM | HIGH | 8h | 48h |
| Electoral/domain lenses (D) | PUBLIC | MEDIUM | HIGH | 8h | 48h |

## Information Asset Register (this run)

| Asset | Owner | Classification | Notes |
|-------|-------|----------------|-------|
| analysis/daily/2026-05-28/monthly-review/ | CISO-delegate | PUBLIC | Created 2026-05-28 |
| data/imf-context.json | DataPipeline | PUBLIC | WEO Apr-2026, age 1 month |
| analysis/daily/2026-05-28/documents/ | DataPipeline | PUBLIC | Riksdag API exports |
| analysis/daily/2026-05-28/full-text/ | DataPipeline | PUBLIC | Extracted document text |

## Handling Instructions

All artifacts in this monthly review are classified PUBLIC and may be:
- Published on riksdagsmonitor.com without restriction
- Translated into all 14 supported languages
- Referenced in journalism and academic research
- Cited under Creative Commons Attribution 4.0

No material in this analysis involves classified government information, personal data subject to GDPR, or commercially sensitive data.

## ISO 27001:2022 Control Reference

| Control | ID | Status |
|---------|-----|--------|
| Information classification | A.5.12 | ✅ COMPLIANT |
| Handling of classified information | A.5.13 | ✅ COMPLIANT |
| Privacy and PII protection | A.5.34 | ✅ N/A (no PII) |
| Data retention | A.8.11 | ✅ Permanent |
