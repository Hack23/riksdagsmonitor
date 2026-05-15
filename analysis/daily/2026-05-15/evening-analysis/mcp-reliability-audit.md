# MCP Tillförlitlighetsgranskning — Evening Analysis 2026-05-15
**Author**: James Pether Sörling | **Typ**: Operational quality assurance | **Datum**: 2026-05-15

## MCP-server status

| Server | Status | Svarstid | Tillförlitlighet |
|--------|--------|---------|-----------------|
| riksdag-regering MCP | ✅ LIVE | ~2-4s | 99% |
| IMF WEO (pre-warmed) | ✅ OK | cache | 99% |
| SCB API | ej anropad | — | — |
| World Bank API | ej anropad | — | — |

## Datakvalitetsgranskning

| Verktyg | Anrop | Resultat | Kvalitet |
|---------|-------|---------|---------|
| get_sync_status | 1 | live; riksdagen+regeringen aktiva | A1 |
| get_dokument HD024184 | 1 | 30 569 chars, full text | A1 |
| get_dokument HD10494 | 1 | 5 201 chars, full text | A1 |
| get_dokument HD11812 | 1 | 5 182 chars, full text | A1 |
| get_dokument HD11813 | 1 | 5 168 chars, full text | A1 |
| get_propositioner | 1 | 5 prop. identifierade | A1 |
| search_dokument (KU39) | 1 | KU39 bet. hittat | A1 |
| search_voteringar | 1 | AU10 proxy; KU ej voterat | A2 |
| sibling synthesis-summary lästa | 4 | Alla 4 sibling-mappar | A2 |

## Begränsningar och kringångna problem

| Begränsning | Påverkan | Kringgång |
|------------|---------|----------|
| KU voteringshistorik saknas i MCP för 2025/26 | PIR-1 delvis öppen | AU10 proxy + sibling committeeReports |
| Lagrådets yttranden ej publicerade | IG-3, IG-1 öppna | Bevakningsindikator satt |
| SD:s officiella KU34-position ej i MCP | IG-2 öppen | PIR-1 prioriterad |
| SCB Q1 2026 BNP-data ej publicerat | Ekonomisk kontext partiell | IMF WEO Apr-2026 (1 mån gammal) |

## Käll-provenance (Economic data)

```json
{
  "provider": "imf",
  "dataflow": "WEO",
  "vintage": "2026-04",
  "vintageAgeMonths": 1,
  "retrieved_at": "2026-05-15",
  "status": "ok"
}
```

## Fulltext-hämtning (gate check 10)

| dok_id | full_text_available | chars |
|--------|--------------------:|------:|
| HD024184 | true | 30 569 |
| HD10494 | true | 5 201 |
| HD11812 | true | 5 182 |
| HD11813 | true | 5 168 |

**Full-text retrieved**: 4/4 = 100% ✅

