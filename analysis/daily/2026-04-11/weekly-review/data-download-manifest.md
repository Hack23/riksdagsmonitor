# Data Download Manifest — 2026-04-11

**Generated**: 2026-04-11 09:20 UTC | **Updated**: 2026-04-11 10:33 UTC (code-quality-engineer enrichment)
**Data Sources**: riksdag-regering-mcp (32 tools)
**Confidence**: MEDIUM-HIGH

## Summary

Data download manifest for weekly review covering April 4–10, 2026. Documents fetched via riksdag-regering-mcp tools during pre-article analysis pipeline.

## MCP Tool Usage

| Tool | Parameters | Result Count | Purpose |
|------|-----------|--------------|---------|
| `get_propositioner` | rm=2025/26, limit=100 | 9 propositions | Government legislative proposals |
| `get_betankanden` | rm=2025/26, limit=100 | 20+ reports | Committee reports and recommendations |
| `get_motioner` | rm=2025/26, limit=100 | 70+ motions | Opposition legislative proposals |
| `get_interpellationer` | rm=2025/26, limit=50 | 15 interpellations | Parliamentary accountability questions |
| `get_fragor` | rm=2025/26, limit=50 | 30+ questions | Written questions to ministers |
| `search_anforanden` | rm=2025/26, limit=100 | 150+ speeches | Chamber debate transcripts |
| `search_voteringar` | rm=2025/26, limit=50 | Available records | Voting records and party positions |
| `search_dokument` | from_date=2026-04-04, to_date=2026-04-10 | 100+ documents | Full-text document search |
| `get_sync_status` | — | Status OK | Data source health check |

## Documents Downloaded

### Propositions (9)
| dok_id | Title | Date |
|--------|-------|------|
| HD03235 | Skärpta regler om utvisning på grund av brott | 2026-04-01 |
| HD03214 | Lagändringar för ett stärkt nationellt cybersäkerhetscenter | 2026-04-01 |
| HD03228 | Ett modernt och anpassat regelverk för krigsmateriel | 2026-04-01 |
| HD03220 | Svenskt deltagande i Natos framskjutna närvaro i Finland | 2026-04-09 |
| HD03218 | Skärpta straff för brott kopplade till kriminella nätverk | 2026-04-09 |
| HD03217 | Stärkt ansvarsutkrävande av offentliga tjänstemän | 2026-04-09 |
| HD03216 | Stärkt medicinsk kompetens i kommunal hälso- och sjukvård | 2026-04-01 |
| HD03230 | Undantag från krav enligt art- och habitatdirektivet | 2026-04-07 |
| HD03219 | Riksrevisionens rapport om tandvårdsstödet | 2026-04-08 |

### Key Committee Reports (Selected)
| dok_id | Title | Committee |
|--------|-------|-----------|
| HD01FöU12 | Shelter law — civilian protection | FöU |
| HD01UU6 | Security policy | UU |
| HD01JuU15 | Criminal justice omnibus | JuU |
| HD01NU18 | Renewable energy permitting | NU |
| HD01MJU30 | Climate target recalibration | MJU |
| HD01SfU16 | Migration and asylum policy | SfU |
| HD01TU15 | Transport policy | TU |
| HD01FöU8 | Defense personnel | FöU |
| HD01CU23 | Rural policy | CU |
| HD01UbU31 | Research ethics | UbU |

## Data Quality

- **Freshness**: All data fetched within 24 hours of article publication
- **Completeness**: 100+ documents across all active committees
- **Voting records**: Available at committee level; formal chamber votes pending
- **Speech data**: 150+ transcripts available for analysis
- **Confidence**: MEDIUM-HIGH

## Analysis Pipeline

```
pre-article-analysis.ts → analysis/daily/2026-04-11/weekly-review/
                         → analysis/weekly/2026-W15/
```

## Data Quality Notes

Data retrieved via riksdag-regering-mcp tools. All document IDs verified against riksdag.se. MCP sync status confirmed operational before data fetch.
