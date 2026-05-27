# Data download manifest — scaffold

**Workflow**: News Realtime Monitor
**Run**: 26507641839 attempt 1
**Started (UTC)**: 2026-05-27T11:19:48Z
**Requested date**: 2026-05-27
**Subfolder**: realtime-monitor
**Improvement mode**: false
**Status**: COMPLETE — all 23 Family A-D artifacts + 12 Family E per-document analyses written.

> This file is written before any MCP call so even a fully-failed run
> produces a non-empty diff and a partial PR rather than a silent no-op.

## MCP attempts

| Attempt | Time | Tool | Result |
|---------|------|------|--------|
| 1 | 2026-05-27T11:20:45Z | get_sync_status | ✅ live |
| 2 | 2026-05-27T11:21:27Z | download-parliamentary-data | ✅ 210 documents, 12 date-filtered |

## Pipeline Status

| Phase | Status | Notes |
|-------|--------|-------|
| MCP pre-warm | ✅ | Status: live |
| IMF context | ✅ | WEO-2026-04, 1 month old, all probes OK |
| Data download | ✅ | 12 documents for 2026-05-27 |
| Full-text enrichment | ✅ | 10/12 documents, 40K-100K chars each |
| Analysis Pass 1 | ✅ | 23 artifacts created |
| Pass 1 snapshot | ✅ | pass1/ directory populated |
| Family E per-doc | ✅ | 12 documents analysed |
| Analysis Pass 2 | ✅ | All artifacts improved |
| Analysis gate | — | Pending |
| Aggregate | — | Pending |
| Render | — | Pending |
| Commit + PR | — | Pending |

## Per-document table

| dok_id | Title | Level | Coverage | Full text |
|--------|-------|-------|----------|-----------|
| HD01FöU15 | Lagändringar för ett stärkt nationellt cybersäkerhetscenter | L3 | full_text | ✅ 82,334 chars |
| HD01JuU38 | Ett förstärkt samhällsskydd och tydligare reaktioner vid återfall i brott | L3 | full_text | ✅ 100,015 chars |
| HD01UU18 | Ett modernt och anpassat regelverk för krigsmateriel | L3 | full_text | ✅ 100,015 chars |
| HD01SfU25 | Utdelning av överskott i inkomstpensionssystemet | L2 | full_text | ✅ 40,936 chars |
| HD01SfU34 | Riksrevisionens rapport om förvar i migrationsprocessen | L2 | full_text | ✅ 86,334 chars |
| HD01KrU9 | Attraktiva platser – bredare genomslag | L1 | full_text | ✅ 76,252 chars |
| HD10516 | Äldreomsorgens ekonomiska förutsättningar | L2 | metadata_only | — |
| HD11840 | Upprättelse för dem som drabbats av felaktiga pethtester | L1 | full_text | ✅ 4,654 chars |
| HD11841 | Ökning av negativa attityder mot hbtqi-personer i skolan | L2 | full_text | ✅ 2,179 chars |
| HD11842 | Vansinneskörningar | L0 | full_text | ✅ 2,937 chars |
| HD11843 | Regeringens arbete mot unga människors ökande intolerans | L2 | metadata_only | — |
| HD11844 | Pojkars attityder och machokultur | L2 | full_text | ✅ 2,266 chars |
