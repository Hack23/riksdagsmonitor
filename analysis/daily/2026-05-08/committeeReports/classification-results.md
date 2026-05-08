# Classification Results — Committee Reports 2026-05-08

**Classification framework**: CLASSIFICATION.md v1.0  
**CIA triad assessment**: Confidentiality / Integrity / Availability  

---

## Data Classification

| Artifact | Classification | CIA Triad | Rationale |
|----------|---------------|-----------|-----------|
| All analysis artifacts | 🟢 PUBLIC | Low/Low/Low | Derived from public parliamentary documents |
| Document JSONs | 🟢 PUBLIC | Low/Low/Low | Sourced from data.riksdagen.se open data |
| IMF economic data | 🟢 PUBLIC | Low/Low/Low | Public IMF WEO estimates |
| HTML articles | 🟢 PUBLIC | Low/Low/Low | Public-facing content |

## GDPR Assessment

**Political data processing**: These documents contain parliamentary proceedings, committee reports, and voting records of elected officials in their official capacity.

- **No personal data** of private individuals processed in analysis
- **Official capacity data only**: MPs, ministers named in official roles — exempt from GDPR personal data restrictions per Recital 20 (public authority) and Swedish offentlighetsprincipen
- **DPIA required**: NO (no special category data, no profiling of private individuals)
- **Retention**: Analysis artifacts retained per repository retention policy (indefinite for legislative record)

## Information Security Controls Mapping

| Control Domain | ISO 27001:2022 | NIST CSF 2.0 | CIS v8.1 | Status |
|---------------|---------------|--------------|----------|--------|
| Data classification | A.5.12 | GV.PO-01 | CIS 3 | ✅ Applied |
| Access control | A.5.15 | PR.AA-01 | CIS 5 | ✅ GitHub repo access control |
| Integrity | A.8.8 | PR.DS-01 | CIS 3.3 | ✅ Git hash integrity |
| Availability | A.8.6 | PR.IR-01 | CIS 11 | ✅ GitHub Pages CDN |
| Audit logging | A.8.15 | DE.AE-03 | CIS 8 | ✅ Git commit history |

## Threat Classification (legislative content)

- **Injection risk**: LOW — content sourced from riksdagen.se official API; no untrusted user input
- **Prompt injection risk**: LOW — human analyst review gate in Pass 2
- **Disinformation risk**: LOW — verified against primary source documents
- **Political bias risk**: MEDIUM — analyst notes: Pass 2 review applied to check framing balance

## RTO/RPO Impact

**Change type**: Normal (new analysis artifacts, no infrastructure change)  
**RTO impact**: None  
**RPO impact**: None  
**CEO approval required**: No (Normal change, content-only, no agent/workflow config change)
