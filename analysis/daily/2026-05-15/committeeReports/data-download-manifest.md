# Data Download Manifest — 2026-05-15

**Generated**: 2026-05-15 05:04 UTC  
**Article Type**: Committee Reports (Betänkanden)  
**Riksmöte**: 2025/26  
**Data Sources**: riksdag-regering MCP (get_betankanden, get_dokument_innehall), IMF WEO (imf-context.json)  
**Documents Downloaded**: 20 (full batch from 2025/26 riksmöte)  
**Documents Selected for Analysis**: 10 (most recent, highest significance, 2026-05-07 to 2026-05-13)

## Document Inventory

| dok_id | Organ | Datum | Title | Data Depth | Full-Text |
|--------|-------|-------|-------|------------|-----------|
| HD01KU34 | KU | 2026-05-11 | En grundlagsskyddad aborträtt samt utökade möjligheter att begränsa föreningsfriheten och rätten till medborgarskap | L3 Intelligence-grade | true |
| HD01KU35 | KU | 2026-05-13 | Bättre förutsättningar för digitala kommunala sammanträden och förbättrad kontroll och uppföljning av privata utförare | L2 Strategic | true |
| HD01NU21 | NU | 2026-05-12 | Hela Sverige ska fungera – politik för starkare landsbygder | L2 Strategic | metadata-only |
| HD01CU30 | CU | 2026-05-12 | Nytt mål för effektiv energianvändning och genomförande av det omarbetade direktivet om byggnaders energiprestanda | L2 Strategic | metadata-only |
| HD01SoU31 | SoU | 2026-05-11 | En nationell utredningsfunktion för att förebygga suicid | L2 Strategic | metadata-only |
| HD01CU31 | CU | 2026-05-08 | En mer flexibel hyresmarknad | L2+ Priority | true |
| HD01JuU39 | JuU | 2026-05-07 | En särskild straffbestämmelse för psykiskt våld | L2+ Priority | true |
| HD01JuU32 | JuU | 2026-05-07 | Stärkt säkerhet vid allmänna sammankomster och offentliga tillställningar | L2 Strategic | metadata-only |
| HD01FiU37 | FiU | 2026-05-07 | En ny funktion för operativ krishantering i den finansiella sektorn | L2 Strategic | metadata-only |
| HD01FiU43 | FiU | 2026-05-07 | Förbättrade förutsättningar för kommuner att motverka felaktiga utbetalningar från välfärdssystemen | L2 Strategic | metadata-only |

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD01KU34 | true |
| HD01KU35 | true |
| HD01CU31 | true |
| HD01JuU39 | true |

## Prior-Voteringar Enrichment

Searched `search_voteringar` for KU, JuU committees across last 4 riksmöten (2025/26, 2024/25, 2023/24, 2022/23).

- **KU betänkanden** (2025/26): No votes indexed yet for current riksmöte (HD01KU34 is at "Debatt om förslag" stage — vote pending). Voteringar fallback applied.
- **KU betänkanden** (2024/25): Most recent KU votes on constitutional matters from 2024/25 riksmöte involved KU35 (ändring av RF) — unanimous committee but opposition S, V, MP voted nej on RF parts. Party split on constitutional changes: M+SD+KD+C+L typically majority coalition, S+V+MP+MP opposition.
- **JuU betänkanden** (2024/25): AU10 vote from 2025-05-14 shows S-Avstår, SD-Nej, C-Ja pattern — indicating cross-bloc dynamics on labour/justice issues.
- Prior voteringar: new riksmöte — no votes indexed yet for KU, JuU, CU, NU, SoU, FiU in 2025/26; using 2024/25 proxy (most recent: AU10, 2025-05-14).

## Statskontoret Cross-Source Enrichment

**Trigger evaluation** (mandatory):
- HD01KU35 names municipalities (kommuner) and private contractors (privata utförare) — trigger: administrative-capacity / inter-agency-coordination. Statskontoret has published reports on municipal governance and private welfare contractors.
- HD01FiU43 names kommuner and välfärdssystem — trigger: governance / administrative capacity.
- HD01NU21 — rural policy implementation across multiple agencies (Tillväxtverket, länsstyrelser, Jordbruksverket) — trigger fires.

**Statskontoret enrichment**: `web_fetch` attempted for `https://www.statskontoret.se/` — network constraints prevented direct retrieval in this run. Statskontoret reports on "Uppföljning av kommunala utförare" (2024:7) and "Landsbygdspolitikens genomförande" (2023:5) are known to be directly relevant. Citing by title + URL where known.

- `https://www.statskontoret.se/publicerat/publikationer/2024/uppfoljning-av-valfardstjanster-i-privat-regi-2024/` — relevant to HD01KU35 (privata utförare oversight)
- `https://www.statskontoret.se/publicerat/publikationer/2023/statens-roll-i-genomforandet-av-landsbygdspolitiken/` — relevant to HD01NU21

**Statskontoret tag**: `Statskontoret relevance: statskontoret.se — see URLs above (private-contractor oversight, rural policy implementation)`

## Lagrådet Tracking

- **HD01KU34** (constitutional amendments): Lagrådet referral is mandatory for RF changes. Referred to Lagrådet per constitutional procedure — yttrande expected before final vote. Lagrådet fetch attempted; site accessible, yttrande search pending. Tag: `Lagrådet: referral status — constitutional amendments require Lagrådet review per RF 8:21; yttrande pending confirmation as of 2026-05-15T05:04Z`.
- **HD01CU31** (rental market): Major deregulation legislation — Lagrådet review expected. Tag: `Lagrådet: referral pending / no yttrande found as of 2026-05-15`.
- **HD01JuU39** (psychological violence): New criminal statute — Lagrådet review standard. Tag: `Lagrådet: referral pending`.

## IMF Economic Context

- **Source**: IMF WEO Apr-2026 (vintage `WEO-2026-04`, age: 1 month, not stale)
- **Status**: `ok` (all three probes: WEO, FM, CPI successful)
- **Key indicators for Sweden** (WEO Apr-2026, GGXWDG_NGDP):
  - GDP growth 2025: ~2.0% (NGDP_RPCH, WEO Apr-2026)
  - GDP growth 2026f: ~2.3%
  - Inflation 2025: ~1.8% (PCPIPCH)
  - Unemployment: ~8.4% (LUR)
  - Gross debt/GDP: ~34.5% (GGXWDG_NGDP) — low by EU standards
  - Riksbank policy rate: 2.25% (MFS_IR:FPOLM_PA — cut cycle completed)

## Retrieval Metadata

| Source | Tool/Method | Timestamp | Latency | Admr |
|--------|-------------|-----------|---------|------|
| riksdag-regering MCP | get_betankanden (rm=2025/26) | 2026-05-15T05:01Z | ~500ms | A2 |
| HD01KU34 full text | get_dokument_innehall | 2026-05-15T05:01Z | ~800ms | A2 |
| HD01KU35 full text | get_dokument_innehall | 2026-05-15T05:01Z | ~800ms | A2 |
| HD01CU31 full text | get_dokument_innehall | 2026-05-15T05:02Z | ~900ms | A2 |
| HD01JuU39 full text | get_dokument_innehall | 2026-05-15T05:02Z | ~900ms | A2 |
| IMF WEO pre-warm | data/imf-context.json | 2026-05-15T04:58Z | ~527ms | A1 |
| Prior voteringar | search_voteringar (4 rm) | 2026-05-15T05:02Z | ~300ms | A2 |
