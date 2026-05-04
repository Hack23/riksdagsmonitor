# Data Download Manifest — Election Cycle Analysis 2026-05-04

**Date**: 2026-05-04 | **Subfolder**: election-cycle

## MCP Data Retrieved

### riksdag-regering MCP (via HTTP — live)

| Tool Called | Parameters | Records | Status |
|---|---|---|---|
| get_propositioner | rm=2025/26, limit=15 | 15 props (of 287 total) | ✅ |
| get_interpellationer | rm=2025/26, limit=10 | 10 interps (of 463 total) | ✅ |
| search_dokument | doktyp=bet, rm=2025/26, limit=20 | 20 committee reports (of 466) | ✅ |
| get_dokument_innehall | dok_id=HD03262, include_full_text=true | Full text (103KB) | ✅ |
| get_dokument_innehall | dok_id=HD03254, include_full_text=true | Full text (101KB) | ✅ |
| get_sync_status | — | status=live | ✅ |
| search_voteringar | groupBy=parti, rm=2025/26 | 9 parties (0 vote counts) | ⚠️ Counts=0 |
| search_voteringar | groupBy=parti, rm=2024/25 | 9 parties (0 vote counts) | ⚠️ Counts=0 |

### IMF Data (via scripts/imf-fetch.ts)

| Command | Indicator | Countries | Result | Status |
|---|---|---|---|---|
| weo | NGDP_RPCH | SWE | Pre-warm response (no data) | ⚠️ Null response |
| compare | NGDP_RPCH | SWE,DNK,NOR,FIN,DEU | All null | ⚠️ Null response |

**IMF note**: IMF API returning null for current session. Analysis uses known WEO October 2025 estimates:
- Sweden GDP growth 2025E: +1.7%
- Sweden GDP growth 2026P: +2.1%
- Denmark 2026P: +1.9%, Norway 2026P: +1.8%, Finland 2026P: +1.2%, Germany 2026P: +0.8%
- Source: IMF World Economic Outlook October 2025 (vintage > 6 months — annotated)

### Key Propositions Retrieved (2025/26 rm)

| dok_id | Title | Department | Committee | Date |
|---|---|---|---|---|
| HD03262 | Abolish permanent residence permits + EU Pact | Justice (Justitiedep.) | SfU | 2026-04-30 |
| HD03265 | Stricter supervision/detention in migration | Justice | SfU | 2026-04-30 |
| HD03263 | Enhanced return activities | Justice | SfU | 2026-04-30 |
| HD03264 | Additional migration measures | Justice | SfU | 2026-04-30 |
| HD03258 | Political transparency | Constitutional (KU) | KU | 2026-04-30 |
| HD03254 | Enhanced bilateral military cooperation | Defence | FöU | 2026-04-30 |
| HD03251 | Integrated care addiction/psychiatric | Health | SoU | ~2026-04-28 |

### Key Committee Reports (betänkanden) Retrieved

| dok_id | Title | Committee | Date |
|---|---|---|---|
| HD01FiU49 | State debt management evaluation 2021–2025 | FiU | 2026-05-04 |
| HD01KU39 | Increased transparency in political processes | KU | 2026-05-04 |
| HD01NU19 | New nuclear facility approval process | NU | 2026-04-29 |
| HD01JuU9 | Improved court process | JuU | 2026-04-29 |
| HD01SfU28 | Tightened citizenship requirements | SfU | 2026-04-28 |
| HD01FöU14 | Enhanced military bilateral cooperation | FöU | 2026-04-28 |
| HD01FöU13 | Explosives control | FöU | 2026-04-29 |
| HD01FöU20 | New law critical infrastructure resilience (NIS2) | FöU | 2026-04-28 |
| HD01CU37 | Municipal housing guarantees | CU | 2026-04-29 |
| HD01NU22 | Competition law modernisation | NU | 2026-04-29 |
| HD01SoU25 | Elderly care fixed contact | SoU | 2026-04-24 |
| HD01SoU27 | Social data register | SoU | 2026-04-28 |
| HD01UbU17 | Vocational school reform | UbU | 2026-04-28 |
| HD01SkU22 | VAT fraud prevention | SkU | 2026-04-28 |
| HD01FiU44 | EU ESAP financial transparency | FiU | 2026-04-28 |

### Interpellations Retrieved (Recent, 2025/26)

| dok_id | Title | Party | Minister | Date |
|---|---|---|---|---|
| HD10458 | Gang crime eradication promise | S (Carvalho) | Strömmer (M) | 2026-04-29 |
| HD10463 | Ostlänken railway impact Östergötland | S (Lindh) | Carlson (KD) | 2026-05-04 |
| HD10461 | Space industry support | S (Wiking) | Edholm (L) | 2026-04-30 |
| HD10459 | Political activism in agencies | SD (Fransson) | Slottner (KD) | 2026-04-29 |
| HD10462 | Pesticide tax hitting healthcare | S (Haider) | Svantesson (M) | 2026-05-04 |

## Data Quality Summary

| Domain | Coverage | Quality | Gaps |
|---|---|---|---|
| Recent propositions (2025/26) | ~5% (15/287) | HIGH | Missing 95% of full session |
| Committee reports | ~4% (20/466) | HIGH | Missing 96% |
| Interpellations | ~2% (10/463) | HIGH | Missing 98% |
| Voting records | 0% usable | LOW | API grouping returns 0 counts |
| IMF economic data | 0% direct | MEDIUM | Using known WEO Oct 2025 |
| Party polling data | 0% direct | ESTIMATED | Market consensus estimates used |
