---
name: osint-methodologies
description: OSINT collection, source evaluation, data integration for Swedish political intelligence
license: Apache-2.0
---

# OSINT Methodologies Skill

## Purpose

Provides OSINT collection methodologies for Riksdagsmonitor's mission of democratic transparency in Sweden. Ensures ethical, legal, and effective intelligence gathering from public sources while maintaining GDPR compliance.

## Data Sources via riksdag-regering-mcp

The **riksdag-regering-mcp** MCP server provides 32 specialized tools:

### Available Tools
1. **Ledamöter (MPs)**: Information, activities, assignments
2. **Riksdagsdokument (Documents)**: Motions, questions, bills
3. **Anföranden (Speeches)**: Chamber debates, statements
4. **Voteringar (Votes)**: Voting records, patterns
5. **Regeringsdokument (Government)**: SOU reports, propositions

### Data Sources
- **Riksdagen API**: https://data.riksdagen.se/ (98.5% completeness)
- **Regeringen via g0v.se**: https://g0v.se/ (open government data)

## Source Evaluation Matrix

### Reliability Assessment (NATO Admiralty Code)
- **A - COMPLETELY_RELIABLE**: Primary government source
- **B - USUALLY_RELIABLE**: Established media, verified aggregators
- **C - FAIRLY_RELIABLE**: Secondary sources with limitations
- **D - NOT_USUALLY_RELIABLE**: Requires corroboration
- **E - UNRELIABLE**: Known bias, propaganda
- **F - CANNOT_BE_JUDGED**: Insufficient track record

### Quality Metrics
- **Completeness**: 98.5% (Riksdagen API)
- **Accuracy**: 99.8% (verified via audit sampling)
- **Timeliness**: <24 hours lag
- **Reliability**: Level A (Primary Source)
- **GDPR Compliance**: ✅ Public data only

## OSINT Collection Checklist

### Pre-Collection Assessment
```
✅ Data publicly available (Offentlighetsprincipen)
✅ GDPR Article 6(1)(e) compliance - public interest
✅ Purpose limitation (Article 5(1)(b))
✅ Data retention periods defined
✅ Privacy impact assessment completed
✅ Source attribution verified
```

### Data Collection Workflow
1. **Source Identification**: Evaluate reliability (A-F)
2. **Data Harvesting**: Use riksdag-regering-mcp tools
3. **Source Triangulation**: Cross-reference multiple sources
4. **Quality Validation**: Check completeness, accuracy
5. **Documentation**: Maintain audit trails

## ISMS Compliance

### ISO 27001:2022
- **A.5.10**: Acceptable use (objective, non-partisan)
- **A.5.33**: Protection of records (source attribution)
- **A.8.8**: Technical vulnerabilities (API monitoring)

### NIST CSF 2.0
- **ID.AM-5**: Resources prioritized by classification
- **PR.DS-5**: Protections against data leaks
- **DE.CM-1**: Network monitored for events

## References

- **Riksdagen API**: https://data.riksdagen.se/dokumentation/
- **g0v.se**: https://g0v.se
- **GDPR**: Article 6(1)(e) - Public interest processing
- **ISMS**: https://github.com/Hack23/ISMS-PUBLIC
