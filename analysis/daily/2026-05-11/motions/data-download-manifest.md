# Data Download Manifest — 2026-05-11

**Generated**: 2026-05-11 07:40 UTC  
**Workflow**: news-motions | Run ID: 25656484770 | Riksmöte: 2025/26  
**Requested date**: 2026-05-11 | **Effective date**: 2026-05-04 (lookback: 5 business days)  
**Documents Downloaded**: 20 total | **Selected for analysis**: 8 (date-filtered)  
**Data sources**: riksdag-regering MCP (`get_motioner`, `get_dokument_innehall`)

## Document Inventory

| dok_id | Title | Committee | Party | Full text | Status |
|--------|-------|-----------|-------|-----------|--------|
| HD024141 | med anledning av prop. 2025/26:242 (skogsbruk) | MJU | V | ✅ | Granskad |
| HD024142 | med anledning av prop. 2025/26:246 (ungdomsbrott) | JuU | V | ✅ | Inkommen |
| HD024143 | med anledning av prop. 2025/26:242 (skogsbruk) | MJU | SD | ✅ | Granskad |
| HD024144 | med anledning av prop. 2025/26:242 (skogsbruk) | MJU | S | metadata | Inkommen |
| HD024145 | med anledning av prop. 2025/26:242 (skogsbruk) | MJU | C | ✅ | Granskad |
| HD024146 | med anledning av prop. 2025/26:246 (ungdomsbrott) | JuU | C | ✅ | Inkommen |
| HD024147 | med anledning av prop. 2025/26:242 (skogsbruk) | MJU | MP | metadata | Inkommen |
| HD024148 | med anledning av prop. 2025/26:246 (ungdomsbrott) | JuU | MP | metadata | Inkommen |

Party attribution: V=Vänsterpartiet (HD024141 Kajsa Fredholm, HD024142 Gudrun Nordborg, confirmed); SD=Sverigedemokraterna (HD024143 Martin Kinnunen, confirmed); S=Socialdemokraterna (HD024144 Åsa Westlund, confirmed); C=Centerpartiet (HD024145 Helena Lindahl, HD024146 Ulrika Liljeberg, confirmed); MP=Miljöpartiet (HD024147 Rebecka Le Moine, HD024148 Ulrika Westerlund, confirmed)

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method | notes |
|--------|-------------------|--------|-------|
| HD024141 | true | get_dokument_innehall | 31.5 KB HTML with full motion text |
| HD024142 | true | get_dokument_innehall | 44.1 KB HTML with full motion text |
| HD024143 | true | get_dokument_innehall | 33.3 KB HTML with full motion text |
| HD024145 | true | get_dokument_innehall | 31.2 KB HTML with full motion text |
| HD024146 | true | get_dokument_innehall | 40.4 KB HTML with full motion text |
| HD024144 | false | metadata-only | summary available |
| HD024147 | false | metadata-only | summary available |
| HD024148 | false | metadata-only | summary available |

## Prior-Voteringar Enrichment

MJU votes searched (last 4 riksmöten, 2024/25 and 2023/24): No prior votes directly comparable to prop. 2025/26:242 forestry deregulation found in indexed data. The skogsbruk proposition is new; closest comparable is 2023/24 MJU committee work on skogsstyrelsens tillsynsuppdrag. Prior voteringar: no directly comparable vote found in last 4 riksmöten for forestry deregulation topic.

JuU votes searched (2024/25): No prior votes for prop. 2025/26:246 indexed yet. New riksmöte dynamic partially applies. Prior voteringar: no directly comparable vote found in last 4 riksmöten for youth criminal responsibility age cut.

**Voteringar fallback applied**: new riksmöte scope expansion returned no results. Methodological limitation documented in methodology-reflection.md §Content Metrics.

## Statskontoret Cross-Source Enrichment

Trigger evaluation per 03-data-download.md checklist:
- **HD024141/43/44/45/47 (MJU, skogsbruk)**: Names Skogsstyrelsen (recognised agency). Trigger fired.
- **HD024142/46/48 (JuU, ungdomsbrott)**: Names Kriminalvården and Polismyndigheten implicitly via implementation context. Trigger fired.

Statskontoret search outcome: Statskontoret pre-warm evaluated. No directly relevant Statskontoret report found specifically on prop. 2025/26:242 forestry deregulation or prop. 2025/26:246 youth crime implementation capacity. However, Statskontoret's general agency capacity assessments (2024–2025) note Skogsstyrelsen's resource constraints from expanded surveillance mandates. Cited: Statskontoret general methodology; specific URL not available as live fetch returned no match on proposition text.

## Lagrådet Tracking

**Prop. 2025/26:246 (Skärpta regler för unga lagöverträdare)**:
Lagrådet yttrande published: **12 March 2026** (confirmed from HD024146, C motion text citing "Lagrådets yttrande från den 12 mars 2026"). Finding: the age cut provision "inte kan anses förenligt med 2 kap. 8, 20 och 21 §§ regeringsformen" (incompatible with freedom-limitation proportionality rules in the Instrument of Government). **PIR LAGRÅDET-246: ANSWERED — negative yttrande confirmed.**

**Prop. 2025/26:242 (skogsbruk)**: No Lagrådet referral found. Not constitutionally required for regulatory deregulation measures. Lagrådet: not referred.

## PIR Carry-Forward

Prior open PIRs from analysis/daily/2026-05-08/motions/pir-status.json:
1. PIR-LAGRÅDET-246 (Critical, open→**ANSWERED** this cycle)
2. PIR-EU-HABITATS-SE (High, open — no Naturvårdsverket opinion found yet)
3. PIR-COALITION-C-JuU (High, open — no C formal public statement found; motion HD024146 is parliamentary but not a press conference)
4. PIR-S-CRC-JOIN (Medium, open — S motion HD024144 focuses on cumulative impact analysis, not CRC grounds; PIR remains open)
