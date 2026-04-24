# Data Download Manifest — 2026-04-24

**Generated**: 2026-04-24 00:28 UTC
**Workflow**: news-propositions
**Run ID**: 24865726626
**Requested date**: 2026-04-24
**Effective date**: 2026-04-23 (1-business-day lookback — Riksdag publishes after close-of-day)
**Riksmöte**: 2025/26
**Data sources**: `get_propositioner`, `get_dokument_innehall` (riksdag-regering MCP, session 4N6ZRTD5)
**Window used**: 2026-04-23 00:00–23:59 Europe/Stockholm
**MCP availability**: `riksdag-regering` ✅ live (get_sync_status OK at 00:27Z); `scb`, `world-bank` not called this run (single-type propositions scope).

## Documents

| dok_id | Title | Type | Ministry | Committee | Retrieval UTC | Full text |
|--------|-------|------|----------|-----------|---------------|-----------|
| [HD03104](https://data.riksdagen.se/dokument/HD03104.html) | Utvärdering av statens upplåning och skuldförvaltning 2021–2025 | Skrivelse (Written Communication) | Finansdepartementet | FiU (Finansutskottet) | 2026-04-24T00:27Z | ✅ 100 KB retrieved |
| [HD03252](https://data.riksdagen.se/dokument/HD03252.html) | En begränsning av rätten till socialförsäkringsförmåner för den som avtjänar fängelsestraff, vistas i kontrollerat boende eller är underkastad säkerhetsförvaring | Proposition (Government Bill) | Justitiedepartementet | SfU (Socialförsäkringsutskottet) | 2026-04-24T00:27Z | ✅ 100 KB retrieved |
| [HD03253](https://data.riksdagen.se/dokument/HD03253.html) | EU:s bankpaket | Proposition (Government Bill) | Finansdepartementet | FiU (Finansutskottet) | 2026-04-24T00:27Z | ✅ 100 KB retrieved |
| [HD03256](https://data.riksdagen.se/dokument/HD03256.html) | Kraftfullare åtgärder mot manipulation och allvarligt missbruk av färdskrivare | Proposition (Government Bill) | Landsbygds- och infrastrukturdepartementet | TU (Trafikutskottet) | 2026-04-24T00:27Z | ✅ 100 KB retrieved |

## Coverage

- **propositions**: 30 downloaded, 4 date-matched, 26 excluded (non-matching dates in the MCP window).
- **motions**: 0 (out of scope — `--doc-type propositions`)
- **committeeReports**: 0 (out of scope)
- **votes**: 0 (not in scope — no vote rounds matched for these document IDs yet; referral phase)
- **speeches / questions / interpellations**: 0 (out of scope)

## Data-quality notes

1. **Lookback fallback active** — 0 docs published under 2026-04-24; falling back to 2026-04-23 retrieved 4 bills signed by PM Kristersson on 2026-04-23. Normal Swedish government pattern (Thursday release, Friday indexing).
2. **Full text**: All 4 documents have `fullContent` ≥ 100 000 chars via `get_dokument_innehall` — none flagged `metadata-only`.
3. **Tachograph document (HD03256)** cross-references transport-law enforcement discussions but no vote record yet — committee referral (TU) expected within 14 days.
4. **No SCB/IMF calls** this run — fiscal context sourced from MCP document text only. Economic enrichment deferred to evening-analysis or weekly-review workflows.

## Provenance

All `dok_id` are resolvable at `https://data.riksdagen.se/dokument/{dok_id}.html` (verified pattern). No private or leaked data.
