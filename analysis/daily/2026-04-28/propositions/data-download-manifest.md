# Data Download Manifest — 2026-04-28

**Generated**: 2026-04-28 06:24 UTC
**Workflow**: news-propositions
**Run ID**: 25037283767
**Data Sources**: get_propositioner, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 4
**Requested Date**: 2026-04-28
**Effective Date**: 2026-04-23 (lookback: 3 business days)
**Riksmöte**: 2025/26
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis is performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 4 documents selected (20 retrieved)
- **motions**: 0 documents
- **committeeReports**: 0 documents
- **votes**: 0 documents
- **speeches**: 0 documents
- **questions**: 0 documents
- **interpellations**: 0 documents

## Selected Documents

| dok_id | Title | Committee | Dept | Retrieved | Full Text |
|--------|-------|-----------|------|-----------|-----------|
| HD03104 | Utvärdering av statens upplåning och skuldförvaltning 2021–2025 | FiU | Finansdepartementet | 2026-04-28T06:24Z | true |
| HD03252 | En begränsning av rätten till socialförsäkringsförmåner för den som avtjänar fängelsestraff | SfU | Justitiedepartementet | 2026-04-28T06:24Z | true |
| HD03253 | EU:s bankpaket | FiU | Finansdepartementet | 2026-04-28T06:24Z | true |
| HD03256 | Kraftfullare åtgärder mot manipulation och allvarligt missbruk av färdskrivare | TU | Landsbygds- och infrastrukturdepartementet | 2026-04-28T06:24Z | true |

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD03104 | true |
| HD03252 | true |
| HD03253 | true |
| HD03256 | true |

## Document Details

### HD03104 — Utvärdering av statens upplåning och skuldförvaltning 2021–2025

- **Typ**: Regeringens skrivelse 2025/26:104
- **Organ**: FiU (Finansutskottet)
- **Departement**: Finansdepartementet
- **Datum**: 2026-04-23
- **URL**: https://data.riksdagen.se/dokument/HD03104
- **Retrieval**: 2026-04-28T06:24Z; full-text: ✅
- **Summary**: The government's formal 5-year evaluation of Sweden's state borrowing and debt management (Riksgälden) for 2021–2025. Reviews debt composition (nominal, inflation-linked, FX), cost and risk outcomes, borrowing targets vs actuals, and compliance with Parliament-mandated debt anchors.

### HD03252 — Socialförsäkringsbegränsning vid fängelsestraff

- **Typ**: Proposition 2025/26:252
- **Organ**: SfU (Socialförsäkringsutskottet)
- **Departement**: Justitiedepartementet
- **Datum**: 2026-04-23
- **URL**: https://data.riksdagen.se/dokument/HD03252
- **Retrieval**: 2026-04-28T06:24Z; full-text: ✅
- **Summary**: Proposes restricting social insurance benefits for persons serving prison sentences in controlled housing (kontrollerat boende) or security detention (säkerhetsförvaring). Amends socialförsäkringsbalken; implements principle that serious offenders should not receive welfare during supervised incarceration.

### HD03253 — EU:s bankpaket

- **Typ**: Proposition 2025/26:253
- **Organ**: FiU (Finansutskottet)
- **Departement**: Finansdepartementet
- **Datum**: 2026-04-23
- **URL**: https://data.riksdagen.se/dokument/HD03253
- **Retrieval**: 2026-04-28T06:24Z; full-text: ✅
- **Summary**: Implements the EU Banking Package (Basel III finalisation: CRR3/CRD6) in Swedish law. Updates capital requirements, risk-weight floors, supervisory frameworks for Swedish banks. Amends kreditinstitutslagen and related financial sector legislation.

### HD03256 — Kraftfullare åtgärder mot färdskrivarmissbruk

- **Typ**: Proposition 2025/26:256
- **Organ**: TU (Trafikutskottet)
- **Departement**: Landsbygds- och infrastrukturdepartementet
- **Datum**: 2026-04-23
- **URL**: https://data.riksdagen.se/dokument/HD03256
- **Retrieval**: 2026-04-28T06:24Z; full-text: ✅
- **Summary**: Strengthened measures against tachograph (färdskrivare) manipulation and serious misuse in commercial road transport. Implements EU Regulation 2020/1054. Higher penalties, enhanced enforcement powers, improved operator licensing rules.

## MCP Server Availability

- **riksdag-regering**: ✅ Live (status: live, sources: riksdagen + regeringen)
- **Lookback active**: yes — 3 business days (documents from 2026-04-23)
- **MCP retries**: 0

## Cross-Source Enrichment

- **Statskontoret (HD03256)**: | **Statskontoret relevance** | none found |
- **IMF**: HD03104 (debt management) and HD03253 (EU banking) enriched with IMF fiscal/financial data in analysis artifacts.

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API (riksdagen.se + regeringen.se).
Data sourced from 2026-04-23 via lookback fallback — all 4 documents have full text available.