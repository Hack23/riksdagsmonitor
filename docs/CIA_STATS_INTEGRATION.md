# CIA Production Statistics Integration - Quick Reference

**Document Classification:** 🟢 Public  
**Last Updated:** 2026-02-12  
**Owner:** Hack23 AB (Org.nr 5595347807)  
**Version:** 1.0.0

## Overview

Riksdagsmonitor integrates with CIA production database statistics for accurate, real-time data about Swedish Parliament.

## Quick Start

### Fetch Latest Statistics

```bash
node scripts/load-cia-stats.js
```

### Update Website

```bash
node scripts/update-stats-from-cia.js
```

### Automated Updates

Daily workflow at 03:00 CET: `.github/workflows/update-cia-stats.yml`

## Key Statistics

From CIA Production Database (2026-02-09):

| Metric | Value |
|--------|-------|
| **Current MPs** | 349 |
| **Historical Politicians** | 2,494 (1971-2024) |
| **Total Votes** | 3,529,786 |
| **Total Documents** | 109,259 |
| **Rule Violations** | 2,308 |

**Source**: [extraction_summary_report.csv](https://github.com/Hack23/cia/blob/master/service.data.impl/sample-data/extraction_summary_report.csv)

## Implementation

- `scripts/load-cia-stats.js` - Fetch & parse CSV
- `scripts/update-stats-from-cia.js` - Update website
- `.github/workflows/update-cia-stats.yml` - Automation
- `cia-data/production-stats.json` - Cache (24h)

## ISMS Compliance

- **ISO 27001** A.5.33 - Protection of records (source attribution, audit trails)
- **ISO 27001** A.5.34 - Privacy and PII (public officials in official capacity only)
- **ISO 27001** A.8.10 - Information deletion (retention policies, no excessive storage)
- **ISO 27001** A.8.19 - Security in use (HTTPS-only, CSP headers)
- **NIST CSF** PR.DS-5 - Data leakage protection (HTTPS-only, public data only)
- **NIST CSF** ID.AM-5 - Resources prioritized (data classified as PUBLIC)
- **CIS Control** 3.1 - Data inventory (documented public sources)
- **CIS Control** 3.14 - Data integrity validation
- **GDPR** Article 6(1)(e) - Public interest processing (democratic transparency)
- **GDPR** Article 9(2)(e) - Political opinions (manifestly public, voting records)
- **Swedish Offentlighetsprincipen** - Public access to government information

**Note**: A.8.11 (Data Masking) NOT applicable - processes only public government data.
Journalist/OSINT platform covering public officials, protected by Press Freedom Act.

## References

- [CIA Platform](https://github.com/Hack23/cia)
- [Riksdagsmonitor](https://riksdagsmonitor.com)
- [Hack23 ISMS](https://github.com/Hack23/ISMS-PUBLIC)

---

**Hack23 AB** · [hack23.com](https://www.hack23.com) · [LinkedIn](https://www.linkedin.com/company/hack23/)
