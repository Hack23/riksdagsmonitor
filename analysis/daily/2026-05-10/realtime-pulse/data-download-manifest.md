# Data Download Manifest — Realtime Pulse 2026-05-10

| Field | Value |
|---|---|
| Workflow | news-realtime-monitor |
| Run ID | 25628802517 |
| UTC timestamp | 2026-05-10T12:40:00Z |
| Requested date | 2026-05-10 |
| Effective date | 2026-05-07 (lookback −3 days for propositions) |
| Riksdag MCP | Live (get_sync_status OK) |
| IMF pre-warm | degraded (WEO/FM ok; IFS/SDMX 404) |

## Documents Downloaded

| dok_id | Title | Type | Committee | Date | Full-text | Parti | Status |
|---|---|---|---|---|---|---|---|
| HD03267 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | prop | JuU | 2026-05-07 | metadata-only | [Justitiedepartementet] | active |
| HD03261 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | prop | SkU | 2026-05-07 | metadata-only | [Finansdepartementet] | active |
| HD03250 | En statlig e-legitimation | prop | TU | 2026-05-07 | metadata-only | [Finansdepartementet] | active |
| HD03263 | Stärkt återvändandeverksamhet | prop | JuU | 2026-04-30 | metadata-only | [Justitiedepartementet] | active |
| HD024148 | Med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | mot | JuU | 2026-05-04 | metadata-only | MP | active |
| HD024146 | Med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | mot | JuU | 2026-05-04 | metadata-only | C | active |
| HD024142 | Med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | mot | JuU | 2026-05-04 | metadata-only | V | active |
| HD024136 | Med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | mot | JuU | 2026-04-29 | metadata-only | S | active |
| HD024147 | Med anledning av prop. 2025/26:242 Ett tydligt regelverk för aktivt skogsbruk | mot | MJU | 2026-05-04 | metadata-only | MP | active |
| HD024145 | Med anledning av prop. 2025/26:242 | mot | MJU | 2026-05-04 | metadata-only | C | active |
| HD10480 | Stadigvarande vistelse (interpellation) | ip | SkU | 2026-05-08 | metadata-only | S | active |
| HD10479 | Uppföljningsrapport om minoritetspolitiken (interpellation) | ip | KU | 2026-05-07 | metadata-only | S | active |
| HD10478 | Sveriges agerande för skydd för civila humanitära konvojer | ip | UU | 2026-05-07 | metadata-only | MP | active |
| HD10477 | Postnords nedläggningar i inlandskommuner | ip | TU | 2026-05-07 | metadata-only | SD | active |
| HD10476 | Humanitärt tillträde till Gaza | ip | UU | 2026-05-07 | metadata-only | MP | active |

## Full-Text Fetch Outcomes

full-text-fallback: MCP returned metadata-only for all docs (fulltext_available=true but text=null); API limitation acknowledged

| dok_id | full_text_available | Notes |
|---|---|---|
| HD03267 | false (null) | API returns metadata only |
| HD03261 | false (null) | API returns metadata only |
| HD03250 | false (null) | API returns metadata only |

## Prior-Voteringar Enrichment

Searched `search_voteringar` rm=2025/26 for JuU, SkU, TU committees. Most recent result: beteckning AU10, datum 2026-03-04, vote on sakfrågan punkt 3. No directly comparable votes for HD03267/HD03261/HD03250 yet (newly tabled 2026-05-07).

Prior voteringar for prop 2025/26:246 (Skärpta regler för unga lagöverträdare): searching JuU rm=last 4 — AU10 (2026-03-04, mixed S+SD+M+C Ja). Direct vote on 246 not yet indexed (prop tabled earlier in session).

## Statskontoret Cross-Source Enrichment

Trigger evaluation: HD03261 names Skatteverket (recognised agency) → trigger fired. HD03267 names Migrationsverket implicitly (migration law) → trigger fired. HD03250: new state e-legitimation authority (ny myndighet) → trigger fired.

Statskontoret pre-warm: trigger matched for Skatteverket/ny e-legitimationsmyndighet. No web_fetch attempted (www.statskontoret.se not in realtime-pulse firewall allow-list for this run). Recording as: `Statskontoret: triggers fired but domain not reachable — implementation-feasibility based on proposition summaries`.

## Lagrådet Tracking

HD03267 (Justitiedepartementet, constitutional/fundamental-rights dimension): Lagrådet referral expected for security proposition touching utlänningslagen and ECHR Art. 5 (detention/expulsion). Domain lagradet.se: `Lagrådet: site check not performed; referral pending / no yttrande confirmed as of 2026-05-10T12:40Z`.

## PIR Carry-Forward

No prior pir-status.json found for realtime-pulse in last 14 days (new subfolder, first run).
Standing PIR-1: Coalition stability — status: open.
Standing PIR-3: Opposition legislative capacity — status: open.
Standing PIR-5: Election-proximity policy acceleration — status: open.

## Withdrawn Documents

None detected.

## MCP Server Notes

riksdag-regering: live. IMF: degraded (WEO/FM ok, IFS SDMX 404). World Bank: not queried (non-economic residue only). SCB: not queried.
