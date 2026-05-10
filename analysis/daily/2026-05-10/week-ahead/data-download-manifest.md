# Data Download Manifest — Week Ahead 2026-05-10

**Run ID**: 25622855919  
**ARTICLE_DATE**: 2026-05-10  
**Subfolder**: week-ahead  
**Generated**: 2026-05-10T07:30:00Z  

## Download Summary

| Field | Value |
|-------|-------|
| Target date | 2026-05-10 |
| Documents on target date | 0 (Sunday — no Riksdag publications) |
| Lookback activated | Yes — 1 business day |
| Lookback date | 2026-05-08 |
| Documents retrieved | 11 |
| Riksmöte | 2025/26 |

## Documents Retrieved

| Dok ID | Type | Committee | Title | DIW |
|--------|------|-----------|-------|-----|
| HD01CU31 | Betänkande | CU | En mer flexibel hyresmarknad | 7.5 |
| HD01CU34 | Betänkande | CU | Ändamålsenliga utmätningsregler och utökad distansutmätning | 2.0 |
| HD01SoU36 | Betänkande | SoU | Bättre förutsättningar att sända ut statlig personal | 2.0 |
| HD01UbU20 | Betänkande | UbU | Offentlighetsprincipen med lättnadsregler för enskilda mindre huvudmän | 3.75 |
| HD01UbU28 | Betänkande | UbU | Legitimation och behörighet i den tioåriga grundskolan | 4.5 |
| HD01UU13 | Betänkande | UU | Interparlamentariska unionen | 1.5 |
| HD10480 | Interpellation | — | Stadigvarande vistelse (Niklas Karlsson S → Elisabeth Svantesson M) | 3.75 |
| HD11800 | Fråga | — | Småföretagares trygghet i Hässelby-Vällingby | 2.25 |
| HD11801 | Fråga | — | Nedsläckning av lands- och glesbygd (V) | 1.5 |
| HD11802 | Fråga | — | Förbud mot heltäckande slöja (Nima Gholam Ali Pour SD → Simona Mohamsson L) | 4.5 |
| HD11803 | Fråga | — | Israels ingripande på internationellt vatten mot svenska medborgare (Johan Büser S → Maria Malmer Stenergard M) | 5.25 |

## Full-Text Fetch Outcomes

| Dok ID | Full-text status | Note |
|--------|-----------------|------|
| HD01CU31 | ✅ fullContent retrieved | HTML encoded — betänkande text available |
| HD01CU34 | ✅ fullContent retrieved | HTML encoded |
| HD01SoU36 | ✅ fullContent retrieved | HTML encoded |
| HD01UbU20 | ✅ fullContent retrieved | HTML encoded |
| HD01UbU28 | ✅ fullContent retrieved | HTML encoded |
| HD01UU13 | ✅ fullContent retrieved | HTML encoded |
| HD10480 | ✅ fullContent retrieved | Interpellation text |
| HD11800 | ✅ fullContent retrieved | Question text |
| HD11801 | ✅ fullContent retrieved | Question text |
| HD11802 | ✅ fullContent retrieved | Question text |
| HD11803 | ✅ fullContent retrieved | Question text |

*full-text-fallback: Auto-fetched via MCP riksdag-regering gateway on initial retrieval.*

## Prior Voteringar Enrichment

**Status**: No voteringsdata available for this week's betänkanden (votes expected during week 10–16 May)

**Search performed**: `search_voteringar(rm="2025/26", bet="CU31")` — returned 0 results (vote not yet held as of 2026-05-10)

**Related prior-cycle votes** (from analysis/daily/2026-05-08/week-ahead/):
- HD01JuU32 — expected week 20 vote: observed in prior cycle PIR-JUSTSEC-001
- HD01FöU18 — signal intelligence: PIR-DEFENCE-001 open

## PIR Carry-Forward

**Source**: analysis/daily/2026-05-08/week-ahead/pir-status.json

Open PIRs carried to this cycle:
- PIR-MIGR-001, PIR-MIGR-002, PIR-MIGR-003 (migration legislation)
- PIR-INTL-001 (partially answered by HD11803 this cycle)
- PIR-FIN-001 (FiU37 vote)
- PIR-DEFENCE-001 (FöU18 margin)
- PIR-ECON-001 (IMF SDMX restoration)

Answered PIRs from prior cycle: PIR-JUSTSEC-001, PIR-JUSTSEC-002, PIR-EDUC-001, PIR-DIGITAL-001

## IMF Context

**File**: data/imf-context.json  
**Status**: degraded  
**Vintage**: WEO-2026-04 (April 2026)  
**Available**: WEO, FM Datamapper (Sweden GDP, fiscal balance, debt)  
**Unavailable**: SDMX IFS, DOTS, GFS, PCPS (404 errors)  
**Action**: Use WEO/FM only; do not attempt SDMX-only claims  

**economicProvenance**: provider: imf, dataflow: WEO, indicator: NGDP_RPCH, vintage: WEO-2026-04, retrieved_at: 2026-05-10
