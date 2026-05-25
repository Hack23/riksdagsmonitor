# Classification Results — Committee Reports 2026-05-25

**Classification Framework**: Hack23 CLASSIFICATION.md  
**Data Classification**: 🟢 PUBLIC — all Riksdag committee reports are public government documents

---

## Document Classification

| Document | Classification | CIA Triad | Legal Basis |
|----------|---------------|-----------|-------------|
| HD01SfU37 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen (TF 2:1) |
| HD01UbU22 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01UbU27 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01UbU19 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01FiU42 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01CU26 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01UU11 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01UU12 | 🟢 PUBLIC | Integrity-critical | Offentlighetsprincipen |
| HD01FiU47 | 🟢 PUBLIC (pending) | Integrity-critical | Not yet published |

---

## Analysis Output Classification

| Artifact | Classification | Rationale |
|----------|---------------|-----------|
| All .md analysis files | 🟢 PUBLIC | Derived from public government documents; no PII; no security-sensitive |
| pir-status.json | 🟢 PUBLIC | No sensitive intelligence; analytical metadata only |

---

## GDPR Assessment

- No personal data processed (committee reports are institutional, not individual)
- No PII collected or stored
- GDPR DPIA short-circuit applies: no DPIA required
- Political opinions referenced are those of parliamentarians exercising public mandate (exempt from Art 9 restrictions per democratic accountability doctrine)

---

## CIA Triad Rating

- **Confidentiality**: LOW concern (all public data)
- **Integrity**: HIGH concern (political analysis must be accurate; misrepresentation could mislead voters)
- **Availability**: MEDIUM concern (must be accessible during election campaign period)

**RTO**: 4 hours | **RPO**: 24 hours (article generation cycle)

---

## ISO 27001:2022 Annex A Controls

| Control | Status | Note |
|---------|--------|------|
| A.5.12 Information classification | ✅ Applied | All artifacts classified PUBLIC |
| A.5.13 Information labelling | ✅ Applied | Classification badges on all artifacts |
| A.8.11 Data masking | N/A | No sensitive data |
| A.5.14 Information transfer | ✅ Compliant | GitHub public repo; riksdagen.se open data |
