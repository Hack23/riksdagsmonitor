# Data Download Manifest — 2026-04-26 (Motions)

**Generated**: 2026-04-26 18:28 UTC
**Workflow**: news-motions (Opposition Motions)
**Data Sources**: riksdag-regering-mcp (get_motioner, get_fragor, get_interpellationer, get_betankanden, get_dokument)
**Documents Selected**: 8
**Riksmöte**: 2025/26
**Lookback Active**: Data from 2026-04-24 (1 business day lookback, no documents on 2026-04-26)
**Analysis Depth**: standard

## Document Inventory

| dok_id | Doctype | Party | Title | Data Depth |
|--------|---------|-------|-------|------------|
| HD10448 | ip (interpellation) | SD | Desinformation om vindkraft | FULL-TEXT |
| HD11747 | fr (question) | S | Lönestöd till företag trots varningar om farlig arbetsmiljö | FULL-TEXT |
| HD11748 | fr (question) | S | Den frihetsberövade svenske medborgaren Christophe Sahabo i Burundi | SUMMARY |
| HD11749 | fr (question) | S | Rätten till likvärdig utbildning för barn i kriminalvård | FULL-TEXT |
| HD01JuU10 | bet (committee report) | — | En ny vapenlag | SUMMARY |
| HD01JuU31 | bet (committee report) | — | Riksrevisionens rapport om Polisreformen 2015 | SUMMARY |
| HD01CU24 | bet (committee report) | — | Effektiv och säker byggprocess | METADATA-ONLY |
| HD01SoU25 | bet (committee report) | — | Stärkta insatser för äldre och för de som vårdar eller stöder närstående | METADATA-ONLY |

## Data Depth Distribution

- FULL-TEXT: 3 documents (HD10448, HD11747, HD11749)
- SUMMARY: 2 documents (HD11748, HD01JuU10, HD01JuU31)
- METADATA-ONLY: 2 documents (HD01CU24, HD01SoU25)

## Opposition Activity Summary

**SD opposition**: 1 interpellation on energy policy / disinformation narrative (Josef Fransson → Ebba Busch/KD)
**S opposition**: 3 questions covering workplace safety, foreign affairs/consular protection, criminal justice/education
**Committee reports**: 4 betänkanden from JuU (2), CU (1), SoU (1)

## MCP Tools Used

- `get_interpellationer` (rm: 2025/26)
- `get_fragor` (rm: 2025/26)
- `get_motioner` (rm: 2025/26)
- `get_betankanden` (rm: 2025/26)
- `get_dokument` (individual enrichment for HD10448, HD11747, HD11749)
- `get_dokument_innehall` (HD01JuU10, HD01JuU31)

## Quality Notes

- Date filter applied: 2026-04-24 (lookback 1 business day — no Riksdag sessions on 2026-04-26 Sunday)
- All documents from official Riksdagen API via riksdag-regering-mcp
- S documents dominate due to party's active parliamentary scrutiny role as main opposition
