# Data Download Manifest — Realtime Pulse 2026-04-29

**Workflow**: news-realtime-monitor
**Run ID**: 25104012777
**UTC Timestamp**: 2026-04-29T10:45:00Z
**Requested date**: 2026-04-29
**Effective date**: 2026-04-29 (no lookback required)
**Window**: Same-day pulse (2025/26 riksmöte)

## MCP Server Status

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering (HTTP) | ✅ Live | `get_sync_status` returned live at 10:38:45Z |
| SCB | ✅ Available | Container-based |
| World Bank | ✅ Available | Container-based |
| IMF CLI | ✅ Pre-warmed | `imf-fetch.ts weo --country SWE` succeeded |

## Downloaded Documents

| dok_id | Title | Type | Organ | Date | Full-text |
|--------|-------|------|-------|------|-----------|
| HD0J20260429 | Onsdag den 29 april 2026 (talarlista) | t-lista | kammaren | 2026-04-29 | metadata-only |
| HDC120260429ap | Arbetsplenum | kam-ap | kammaren | 2026-04-29 | metadata-only |
| HDC120260429vo | Votering efter debattens slut i SfU28 (≥16:00) | kam-vo | kammaren | 2026-04-29 | metadata-only |
| HDA3EUN37 | EU-nämndens sammanträde 2025/26:37 | utskottsmöte | EUN | 2026-04-29 | ✅ full-text |
| HD0N50B0F8 | Kommenterad dagordning Ekofinrådets möte 5 maj 2026 | eunbil | EUN | 2026-04-29 | ✅ full-text |
| HD0N50B0F6 | 260429 Ekofin dagordning | eunbil | EUN | 2026-04-29 | ✅ full-text |
| HD05FiU3y | Verksamheten i EU under 2025 — FiU yttrande | yttr | FiU | 2026-04-29 | metadata-only |
| HD05FiU2y | Riksdagens skrivelser till regeringen åtgärder under 2025 — FiU yttrande | yttr | FiU | 2026-04-29 | metadata-only |
| HD024124 | Motion: Ny myndighet för miljöprövning (prop 2025/26:238) | mot | MJU | 2026-04-29 | ✅ full-text |
| HD024125 | Motion: En ny lag om kommunal hamnverksamhet (prop 2025/26:234) | mot | TU | 2026-04-29 | metadata-only |
| HD024126 | Motion: Vindkraft i kommuner (prop 2025/26:239) | mot | NU | 2026-04-29 | ✅ full-text |
| HD10454 | Interpellation: Kriminella driver HVB-hem | ip | S | 2026-04-29 | ✅ full-text |
| HD10455 | Interpellation: Rörliga kulturarvet | ip | SD | 2026-04-29 | metadata-only |
| HD10456 | Interpellation: Organhandel (Kina) | ip | SD | 2026-04-29 | ✅ full-text |
| HD10457 | Interpellation: Sällsynta hälsotillstånd | ip | S | 2026-04-29 | metadata-only |
| HD12734 | Svar: Sveriges deltagande i hållbara flygbränslen | frs | TU | 2026-04-29 | metadata-only |
| HD12735 | Svar: Konsumtionslån | frs | FiU | 2026-04-29 | metadata-only |
| HD12737 | Svar: Utbildning barn i ungdomsanstalter | frs | JuU | 2026-04-29 | metadata-only |
| HD12738 | Svar: Samverkan mot organiserad brottslighet | frs | JuU | 2026-04-29 | metadata-only |
| HD12739 | Svar: Lönetransparensdirektivet | frs | AU | 2026-04-29 | metadata-only |
| HD12740 | Svar: Kriegers flak vindkraft | frs | NU | 2026-04-29 | metadata-only |
| HD12741 | Svar: Kostnader AP-fondssammanslagning | frs | FiU | 2026-04-29 | metadata-only |
| HD12742 | Svar: Nationell molnpolicy | frs | KU | 2026-04-29 | ✅ full-text |
| HD12743 | Svar: Vattenbrist Skåne och civilt försvar | frs | MJU | 2026-04-29 | metadata-only |
| HD12744 | Svar: Kinas inflytande i Sveriges näringsliv | frs | NU | 2026-04-29 | ✅ full-text |
| HD12745 | Svar: Vattenbrist och civilt försvar | frs | FöU | 2026-04-29 | metadata-only |
| HD12746 | Svar: Inställt taiwanesiskt presidentbesök | frs | UU | 2026-04-29 | ✅ full-text |

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HDA3EUN37 | true |
| HD024124 | true |
| HD024126 | true |
| HD10454 | true |
| HD10456 | true |
| HD12742 | true |
| HD12744 | true |
| HD12746 | true |

## Cross-Source Enrichment

- **IMF WEO Apr-2026**: Sweden GDP growth 2026 ~1.2% (SWE NGDP_RPCH). Used in economic context.
- **Statskontoret**: No directly relevant Statskontoret source found for today's primary documents. The HVB-hem issue (HD10454) touches IVO (Inspektionen för vård och omsorg) administrative capacity — IVO is a recognised agency but no specific Statskontoret evaluation of IVO was directly applicable to the 2024 police HVB report.

## Reference Analyses (sibling folders)

- `analysis/daily/2026-04-29/` — today's earlier workflow runs consulted where available
- `analysis/daily/2026-04-28/realtime-pulse/` — prior cycle, PIRs carried forward
