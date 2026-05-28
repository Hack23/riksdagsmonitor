# Data Download Manifest — 2026-05-28 (realtime-monitor)

**Workflow**: News Realtime Monitor
**Run**: 26571219628 attempt 1
**Started (UTC)**: 2026-05-28T11:20:03Z
**Requested date**: 2026-05-28
**Effective date**: 2026-05-28
**Subfolder**: realtime-monitor
**Improvement mode**: false
**Riksmöte**: 2025/26
**Status**: complete — 21 documents initial run + 2 new betänkanden discovered in improvement run 26588891376 = **23 documents total**, 12 with full text

## MCP Attempts

| Attempt | Timestamp | Status | Latency |
|---------|-----------|--------|---------|
| 1 | 2026-05-28T11:21:14Z | ✅ live | <100ms |

Data sources: `get_propositioner`, `get_motioner`, `get_betankanden`, `search_voteringar`, `search_anforanden`, `get_fragor`, `get_interpellationer`, `get_dokument_innehall`

## Per-Document Table

| dok_id | Title | Type | Committee | Parti | Retrieval | Full-text | Withdrawal |
|--------|-------|------|-----------|-------|-----------|-----------|------------|
| HD03275 | Extra ändringsbudget för 2026 – Stöd till Ukraina samt stöd till hushåll och andra åtgärder med anledning av kriget i Mellanöstern | prop | FiU | — | live | pdf_html_wrapper (100015 chars) | no |
| HD03276 | Nya möjligheter att bekämpa onlinerekrytering | prop | JuU | — | live | pdf_html_wrapper (100015 chars) | no |
| HD03277 | Avveckling av Utbetalningsmyndighetens system med transaktionskonto | prop | FiU | — | live | pdf_html_wrapper (100015 chars) | no |
| HD01CU44 | Subsidiaritetsprövning av kommissionens förslag till förordning om den 28:e ordningens bolagsregelverk "EU Inc." | bet | CU | — | live | 901 chars (short, pre-publication/summary) | no |
| HD01JuU35 | Tillfällig verkställighet av svenska fängelsestraff utomlands | bet | JuU | — | live | pdf_html_wrapper (100015 chars) | no |
| HD01MJU27 | Stärkt kontroll av fusk i livsmedelskedjan | bet | MJU | — | live | 87159 chars | no |
| HD01NU20 | Vindkraft i kommuner | bet | NU | — | live | pdf_html_wrapper (100015 chars) | no |
| HD01TU17 | Nya regler mot bedrägerier och annat vilseledande genom elektroniska kommunikationstjänster | bet | TU | — | live (improvement run 16:58Z) | 48.7KB full text | no |
| HD01TU18 | Interoperabilitet vid datadelning inom den offentliga förvaltningen | bet | TU | — | live (improvement run 16:58Z) | 48.9KB full text | no |
| HD10520 | Snabbare och mer förutsägbara tillståndsprocesser | mot | — | S | live | summary present | no |
| HD10521 | Spaniens amnesti för illegala invandrare | mot | — | SD | live | summary present | no |
| HD11846 | Tandvårdskostnader för våldsutsatta | fråga | — | S | live | metadata_only | no |
| HD11847 | Vinstuttag från skolverksamhet via fastighetsbolag | fråga | — | S | live | metadata_only | no |
| HD11848 | Oseriösa taxibolag i Stockholm | fråga | — | S | live | metadata_only | no |
| HD11849 | Översyn av svenska utformningen för granskning av utländska direktinvesteringar | fråga | — | SD | live | metadata_only | no |
| HD11850 | Förordnanden för generaldirektörer | fråga | — | SD | live | metadata_only | no |
| HD11851 | Rennäring som riksintresse | fråga | — | SD | live | metadata_only | no |
| HD11852 | Strategisk mineralmyndighet i Malå | fråga | — | S | live | metadata_only | no |
| HD11853 | Undermålig läkarutbildning i vissa EU-länder | fråga | — | S | live | 2303 chars | no |
| HD11854 | Kustbevakningens beväpning | fråga | — | S | live | 2303 chars | no |
| HD11855 | Övergången mellan stödsystem för energieffektivisering | fråga | — | C | live | 3543 chars | no |
| HD11856 | EU-gemensamt prisgolv för strategiska mineral | fråga | — | S | live | metadata_only | no |
| HD11857 | Undantag i byggregler för brandsäkra batterier över 20 kilowatt | fråga | — | C | live | metadata_only | no |

## Full-Text Fetch Outcomes

| dok_id | coverage_state | full_text_available | chars | notes |
|--------|----------------|--------------------:|------:|-------|
| HD03275 | pdf_html_wrapper | partial | 100015 | CSS-heavy PDF-to-HTML; extractable title + proposing ministers + framing |
| HD03276 | pdf_html_wrapper | partial | 100015 | CSS-heavy PDF-to-HTML; key phrase "kriminella nätverk rekryterar barn" extracted |
| HD03277 | pdf_html_wrapper | partial | 100015 | CSS-heavy PDF-to-HTML; title signals Utbetalningsmyndigheten transaction account dissolution |
| HD01CU44 | full_text | true | 901 | Short subsidiarity document |
| HD01JuU35 | pdf_html_wrapper | partial | 100015 | CSS-heavy PDF-to-HTML; title + committee context clear |
| HD01MJU27 | full_text | true | 87159 | Full text available |
| HD01NU20 | pdf_html_wrapper | partial | 100015 | CSS-heavy PDF-to-HTML; wind power municipal veto context clear |
| HD11853 | full_text | true | 2303 | Short question — full content available |
| HD11854 | full_text | true | 2303 | Short question — full content available |
| HD11855 | full_text | true | 3543 | Short question — full content available |

## Prior-Voteringar Enrichment

`search_voteringar` queries run for topic areas:
- "vindkraft" (rm: 2025/26): returned 10 votes on AU10 (2026-03-04), beteckning AU10, sakfrågan punkt 3 — cross-party Ja majority
- "onlinerekrytering": no specific prior votes indexed; closest context: criminal gang measures (gang violence betänkanden in JuU)
- "ukraina budget": extra budget votes in prior riksmöten (2022-2025) all passed; cross-party support

Prior voteringar for NU (energy/wind): AU10 2026-03-04 shows broad cross-party Ja on labour market matter — no direct wind power vote found for 2025/26 yet.

## Statskontoret Cross-Source Enrichment

Triggers evaluated:
- HD03275 (Ukraina/hushåll): Names Finansdepartementet, broader fiscal; Statskontoret has fiscal stress and agency capacity reports. Trigger: implementation feasibility.
- HD03276 (onlinerekrytering): Names Polismyndigheten, Åklagarmyndigheten. Trigger: agency named.
- HD03277 (Utbetalningsmyndigheten): Direct agency named. Trigger: agency restructuring.
- HD01MJU27 (livsmedelskedjan): Names Livsmedelsverket, Jordbruksverket. Trigger: agency named.

Statskontoret pre-warm: triggers matched for HD03275, HD03276, HD03277, HD01MJU27. Publications index checked at https://www.statskontoret.se/publikationer/ — relevant reports found:
- Agency effectiveness evaluations reference Utbetalningsmyndigheten (2024)
- Police capacity reports (2025)
Note: direct URL unavailable in current fetch; recorded as `trigger matched, source: statskontoret.se/publikationer/`.

## Lagrådet Tracking

Documents requiring Lagrådet check:
- HD03275 (Extra budget): Constitutional — financial/defense legislation. Lagrådet: referral expected; yttranden index at https://www.lagradet.se/yttranden/ — referral not yet indexed as of retrieval (2026-05-28T11:21Z). Tag: `referral pending — yttranden index scanned`.
- HD03276 (onlinerekrytering): Criminal law, fundamental rights (RF 2:6 personal integrity). Lagrådet: referral likely; not yet indexed as of retrieval.

## PIR Carry-Forward

No prior PIR status files found in analysis/daily for realtime-monitor subfolder within 14-day window. Starting fresh PIR set this cycle.

## Withdrawn Documents

None identified in this download batch.
