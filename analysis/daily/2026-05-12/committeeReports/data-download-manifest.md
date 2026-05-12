# Data Download Manifest — Committee Reports 2026-05-12

**Generated**: 2026-05-12T04:58:00Z  
**Workflow**: news-committee-reports  
**Article date**: 2026-05-12  
**Subfolder**: committeeReports  
**Retrieval method**: riksdag-regering MCP (HTTP) + IMF CLI  

## Document Inventory

| dok_id | Titel | Datum | Organ | Doktyp | Data depth | URL |
|--------|-------|-------|-------|--------|------------|-----|
| HD01KU34 | En grundlagsskyddad aborträtt samt utökade möjligheter att begränsa föreningsfriheten och rätten till medborgarskap | 2026-05-11 | KU | bet | full_text (HTML retrieved) | https://data.riksdagen.se/dokument/HD01KU34 |
| HD01SoU31 | En nationell utredningsfunktion för att förebygga suicid | 2026-05-11 | SoU | bet | full_text (HTML retrieved) | https://data.riksdagen.se/dokument/HD01SoU31 |
| HD01KU43 | En ny lag om riksdagens medalj | 2026-05-11 | KU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01KU43 |
| HD01MJU23 | Förenklingar i jaktlagstiftningen | 2026-05-11 | MJU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01MJU23 |
| HD01CU31 | En mer flexibel hyresmarknad | 2026-05-08 | CU | bet | full_text (HTML retrieved) | https://data.riksdagen.se/dokument/HD01CU31 |
| HD01JuU39 | En särskild straffbestämmelse för psykiskt våld | 2026-05-07 | JuU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01JuU39 |
| HD01FiU37 | En ny funktion för operativ krishantering i den finansiella sektorn | 2026-05-07 | FiU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01FiU37 |
| HD01JuU34 | Nordisk verkställighet i brottmål | 2026-05-07 | JuU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01JuU34 |
| HD01JuU32 | Stärkt säkerhet vid allmänna sammankomster och offentliga tillställningar | 2026-05-07 | JuU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01JuU32 |
| HD01FiU43 | Förbättrade förutsättningar för kommuner att motverka felaktiga utbetalningar från välfärdssystemen | 2026-05-07 | FiU | bet | metadata-only | https://data.riksdagen.se/dokument/HD01FiU43 |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | notes |
|--------|---------------------|-------|
| HD01KU34 | true | HTML full text retrieved (105 KB) |
| HD01SoU31 | true | HTML full text retrieved (62 KB) |
| HD01CU31 | true | HTML full text retrieved (107 KB) |

## Prior-Voteringar Enrichment

**Search performed**: `search_voteringar` for KU, SoU, JuU, FiU committees (rm: 2025/26 + 2024/25)

**2025/26 result**: Prior voteringar: new riksmöte — no votes indexed yet for KU in 2025/26; using 2024/25 cycle proxy. Most recent comparable vote: AU10 (2025-05-14) — multi-party split (S: Avstår/Frånvarande, SD: Nej, C: Ja, M: Frånvarande).

**Fallback applied**: Expanded to 2024/25 per voteringar fallback procedure. KU constitutional amendments historically require 3/4 majority in two successive riksmöten for RF changes.

**Methodology tag**: 🟡 Partial — new 2025/26 riksmöte, voteringar not yet indexed for these betänkanden.

## IMF Context

**Status**: ok (from data/imf-context.json)  
**IMF pre-warm**: executed (weo --country SWE --indicator NGDP_RPCH)  
**Retrieval**: 2026-05-12T04:58:00Z  
**Vintage**: WEO Apr-2026  

## Statskontoret Pre-Warm Evaluation

**Trigger evaluation** (mandatory checklist):
- HD01KU34: No agency named — constitutional rights amendment. Statskontoret trigger: no trigger matched (constitutional matters, no administrative dimension).
- HD01SoU31: Names potential for a new national utredningsfunktion — trigger: new mandate/agency creation. Statskontoret search performed.
- HD01CU31: Hyresmarknad reform touches Hyresnämnden/Boverket potentially. Trigger: regulatory-burden dimension.
- HD01FiU37: Financial crisis management function — trigger: new mandate, inter-agency coordination.

**Statskontoret search result**: `Statskontoret: no directly relevant source found for SoU31 (nationell utredningsfunktion suicid)`. No recent Statskontoret evaluation of suicide investigation capacity.  
**Source**: https://www.statskontoret.se/ (searched 2026-05-12)

## Lagrådet Enrichment

**HD01KU34** (constitutional amendment): Lagrådet referral expected for RF changes. Constitutional amendments to Chapter 2 RF (basic freedoms) require Lagrådet scrutiny. Tag: `referral status: requires verification at lagradet.se`.  
**HD01CU31** (rental market): Major property law reform — Lagrådet review likely. Tag: `referral status: requires verification`.

