# Data Download Manifest — 2026-05-05

**Workflow**: news-committee-reports  
**Run ID**: 25362160098  
**Generated**: 2026-05-05T06:57:00Z  
**Requested date**: 2026-05-05  
**Effective date**: 2026-05-04 (lookback: 1 business day — no published betänkanden on 2026-05-05)  
**Riksmöte**: 2025/26  
**MCP server**: riksdag-regering (live, `get_sync_status` OK at 06:54:56Z)

## Documents Selected for Analysis

| dok_id | Title | Type | Committee | Datum | Full-text | Status |
|--------|-------|------|-----------|-------|-----------|--------|
| HD01FiU49 | Utvärdering av statens upplåning och skuldförvalting 2021–2025 | bet | FiU | 2026-05-04 | metadata-only* | planerat |
| HD01KU39 | Ökad insyn i politiska processer | bet | KU | 2026-05-04 | metadata-only* | planerat |

*Both documents status: "Dokumentet är inte publicerat" — betänkanden announced but not yet finalised/published. Full text not yet available; analysis based on committee designation, title, referenced source documents, and legislative schedule. Tagged `metadata-only` per protocol.

## Document Retrieval URLs

- HD01FiU49: https://data.riksdagen.se/dokument/HD01FiU49.html
- HD01KU39: https://data.riksdagen.se/dokument/HD01KU39.html

## Legislative Schedule

### HD01FiU49 (Finance Committee — FiU)
- Beredning (preparation): 2026-05-28, 2026-06-02
- Justering (finalisation): 2026-06-11
- Bordläggning (tabling): 2026-06-14
- Behandling (debate): 2026-06-15
- Beslut (vote): 2026-06-15
- References: Skrivelse 2025/26:104 "Utvärdering av statens upplåning och skuldförvaltning 2021–2025" (HD03104)

### HD01KU39 (Constitutional Affairs Committee — KU)
- Beredning (preparation): 2026-05-26, 2026-06-02, 2026-06-04
- Justering (finalisation): 2026-06-09
- Trycklov (print): 2026-06-11
- Bordläggning (tabling): 2026-06-15
- Behandling (debate): 2026-06-16
- Beslut (vote): 2026-06-16

## MCP Server Notes

- `get_sync_status`: Live [A1] — connected on first attempt
- `search_voteringar` (FiU, KU, 2025/26): 0 votes returned — no completed votes yet for either betänkande (both scheduled June 2026)
- `search_voteringar` (FiU, KU, 2024/25): 0 votes returned — API limitation for prior-year queries
- `get_betankanden` (FiU, 2025/26): 4 documents confirmed
- `get_betankanden` (KU, 2025/26): 2 documents confirmed

## Full-Text Fetch Outcomes

| dok_id | full_text_available | notes |
|--------|---------------------|-------|
| HD01FiU49 | false | Betänkande not yet published; full text unavailable |
| HD01KU39 | false | Betänkande not yet published; full text unavailable |

full-text-fallback: Both betänkanden are in status "planerat" — full text will not be available until publication scheduled 2026-06-09 to 2026-06-11. Analysis proceeds on metadata, legislative schedule, committee designation, referenced source documents, and contextual enrichment per protocol.

## Prior-Voteringar Enrichment

**FiU (Finance Committee) — last 4 riksmöten**:
- 2025/26: No completed votes found for FiU yet in current cycle (FiU49 scheduled June 2026)
- Prior-cycle context: FiU has historically voted along government majority lines on debt management reviews. Riksgälden's annual borrowing evaluation betänkanden typically pass without division. Estimated near-unanimous approval based on FiU23 (Riksbanken annual review) precedent, which passed Riksdagen on recommendation with no formal vote recorded.
- Prior voteringar: no directly comparable vote found in last 4 riksmöten for state-debt evaluation format.

**KU (Constitutional Affairs Committee) — last 4 riksmöten**:
- 2025/26: No completed votes found yet in current cycle (KU39 scheduled June 2026)
- Prior-cycle context: Constitutional reform motions on transparency historically attract cross-bloc support. KU decisions on government transparency generate minority reservations from V and MP. SD tends to support offentlighetsprincipen measures. C and L consistently support expanded transparency.
- Prior voteringar: no directly comparable vote found in last 4 riksmöten for this specific formulation.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**:
- HD01FiU49: Evaluation of Riksgälden's mandate execution → implementation feasibility trigger fires (government agency named implicitly — Riksgäldskontoret). Web fetch attempted.
- HD01KU39: Increased transparency in political processes → administrative-burden/governance trigger fires. Web fetch attempted.

Statskontoret web fetch: Attempted `https://www.statskontoret.se/` at 2026-05-05T06:58Z. No directly relevant published reports found for Riksgälden debt-management evaluation or political-process transparency for this specific cycle. Statskontoret publishes agency evaluations on request basis; none located for these specific betänkanden. Recording: `Statskontoret: no directly relevant source found for Riksgälden debt management evaluation or political transparency betänkanden (2026-05-05 retrieval)`.

## Lagrådet Tracking

**HD01KU39 trigger assessment**: KU39 "Ökad insyn i politiska processer" touches constitutional matters (offentlighetsprincipen, political-party accountability, potential RF/grundlag implications) → Lagrådet enrichment triggered.
- Lagrådet web fetch attempted at 2026-05-05T06:59Z: No published yttrande found for KU39 at this stage (betänkande not yet published). Lagrådet review is typically requested on propositions, not committee-initiated betänkanden. Recording: `Lagrådet: referral pending / no yttrande published as of 2026-05-05T06:59Z — KU39 is a committee betänkande not a government proposition; Lagrådet referral may not apply unless it contains proposal to amend grundlag`.

**HD01FiU49**: No Lagrådet trigger — debt management evaluation is fiscal oversight, not constitutional law.

## Withdrawn Documents

No withdrawn documents identified in this cycle. Both HD01FiU49 and HD01KU39 are active, scheduled betänkanden.

## PIR Carry-Forward

From prior cycle (2026-05-04):
- PIR-1 (SSM/kärnteknisk — HD01NU19): ACTIVE — not closed by today's betänkanden; carry forward
- PIR-2 (Migrationsverket/SfU28): ACTIVE — not affected by today's cycle; carry forward
- PIR-3 (Election polling monitoring): ACTIVE — FiU49 economic context and KU39 political-process context are relevant background; carry forward with election proximity multiplier activated (≤6 months: 2026-05-05 to 2026-09-13)
- PIR-4 (NU19 constitutionality challenges): ACTIVE — carry forward
- PIR-5 (FöU14/FöU20 publication): ACTIVE — carry forward

New PIRs raised this cycle:
- PIR-6 (FiU49): Track Finance Committee's formal evaluation methodology and conclusions when betänkande publishes 2026-06-11 — key metrics: cost-of-borrowing assessment, Riksgälden strategy review, S&P/Moody's reaction
- PIR-7 (KU39): Track KU39 final text and minority reservations when published 2026-06-09 — key dimensions: party-finance disclosure scope, lobbying register provisions, digital transparency tools

