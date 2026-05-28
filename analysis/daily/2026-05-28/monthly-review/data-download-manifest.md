# Data Download Manifest — Monthly Review 2026-05-28

**Workflow**: News: Monthly Review
**Run**: 26571623705 attempt 1
**Started (UTC)**: 2026-05-28T11:29:07Z
**Requested date**: 2026-05-28
**Subfolder**: monthly-review
**Improvement mode**: false
**Status**: scaffold — populated as the pipeline progresses.

> This file is written before any MCP call so even a fully-failed run
> produces a non-empty diff and a partial PR rather than a silent no-op.

## MCP Attempts

| Attempt | Server | Status | Latency |
|---------|--------|--------|---------|
| 1/3 | riksdag-regering | ✅ SUCCESS | ~900ms |
| N/A | IMF datamapper | ⚠️ BLOCKED (firewall) | N/A |
| N/A | IMF SDMX | ⚠️ BLOCKED (firewall) | N/A |

IMF data: using cached `data/imf-context.json` (WEO Apr-2026, vintage age 1 month, status: ok)

## Per-Document Table

| dok_id | Type | Title | Full-text | DIW |
|--------|------|-------|-----------|-----|
| HD03275 | Proposition | Extra ändringsbudget 2026 (Ukraina + Mellanöstern) | ✅ | 9.5 |
| HD03276 | Proposition | Nya möjligheter att bekämpa onlinerekrytering | ✅ | 8.5 |
| HD03277 | Proposition | Avveckling av Utbetalningsmyndighetens transaktionskonto | ✅ | 6.5 |
| HD01JuU35 | Betänkande | Tillfällig verkställighet av svenska fängelsestraff utomlands | ✅ | 7.2 |
| HD01NU20 | Betänkande | Vindkraft i kommuner | ✅ | 8.8 |
| HD01MJU27 | Betänkande | Stärkt kontroll av fusk i livsmedelskedjan | ✅ | 6.0 |
| HD01CU44 | Utlåtande | CU utlåtande | ✅ | 4.0 |
| HD10520 | Interpellation | Snabbare och mer förutsägbara tillståndsprocesser (S→L) | ✅ | 5.5 |
| HD10521 | Interpellation | Spaniens amnesti för illegala invandrare (SD→M) | ✅ | 7.8 |
| HD11853–HD11857 | Frågor | Various written questions | ✅ | 3.0–4.5 |
| HD11846–HD11852 | Frågor | Various written questions | ✅ | 3.0–4.0 |

**Total documents**: 21 | **Full-text retrieved**: 10/21 | **Coverage**: 2026-05-28

## Sibling Analysis Sources (Tier-C)

| Sibling | Date | Used for |
|---------|------|---------|
| analysis/daily/2026-05-10/monthly-review/ | 2026-05-10 | Prior cycle PIR ingestion |
| analysis/daily/2026-05-08 to 2026-05-27 | 30-day window | Policy trajectory |
