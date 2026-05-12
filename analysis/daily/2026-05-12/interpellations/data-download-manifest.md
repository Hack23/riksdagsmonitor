# Data Download Manifest — 2026-05-12

**Generated**: 2026-05-12 07:28 UTC  
**Workflow**: news-interpellations · Run ID: 25719755563  
**Data Sources**: get_interpellationer, get_dokument_innehall  
**Documents Downloaded**: 20 (date-filtered to 2 from 2026-05-11)  
**Lookback**: 1 business day (2026-05-11 → no documents for 2026-05-12 at download time)  
**Riksmöte**: 2025/26  

> ℹ️ **Data-Only Pipeline**: Raw data downloaded; analysis performed by AI agent.

## Selected Documents

| dok_id | Title | Type | Riksmöte | Date | Party | Status | Full Text |
|--------|-------|------|----------|------|-------|--------|-----------|
| HD10481 | Klimatmålen | interpellations | 2025/26 | 2026-05-11 | S | **Återtagen (Withdrawn 2026-05-11)** | ✅ full_text_available=true |
| HD10482 | Effektivare kontrollmöjligheter för att förhindra svartarbete | interpellations | 2025/26 | 2026-05-11 | S | Skickad | ✅ full_text_available=true |

**Authors**:  
- HD10481: Åsa Westlund (S) → Johan Britz, Arbetsmarknadsminister och vikarierande klimat- och miljöminister (L)  
- HD10482: Marie Olsson (S) → Finansminister Elisabeth Svantesson (M)  

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|---------------------|--------|
| HD10481 | true | get_dokument_innehall via download-parliamentary-data.ts |
| HD10482 | true | get_dokument_innehall via download-parliamentary-data.ts |

## Withdrawn Documents

| dok_id | Title | Sponsor | Committee | Withdrawal Date | Reason |
|--------|-------|---------|-----------|-----------------|--------|
| HD10481 | Klimatmålen | Åsa Westlund (S) | N/A | 2026-05-11 | "Interpellationen är återtagen" — text in full content; no explicit reason stated. Likely due to parliamentary scheduling constraints or strategic pre-election repositioning. Återtagen on same day as Överlämnad (2026-05-11). |

> 🔴 **Analytic note**: Withdrawal is a significant signal — see synthesis-summary.md §Lead Story and devils-advocate.md.

## Prior-Voteringar Enrichment

Search conducted for FiU/AU topics covering svartarbete/labor crime (2022/23–2025/26 riksmöten):

- AU10 2024/25 (2025-05-14): Vote on labour market matter — S largely Avstår, SD voted Nej on one point, C voted Ja. Context: opposition fragmentation on labour issues.  
- AU10 2025/26 (2026-03-04): All parties voting Ja on specific labour market point.  
- No directly comparable prior interpellation vote found in last 4 riksmöten for "svartarbete + FiU" combination specifically.  
- Climate-related: No comparable prior vote found for Miljömålsberedningens klimatmål interim target in last 4 riksmöten.

`Prior voteringar: no directly comparable vote found in last 4 riksmöten for specific svartarbete or klimatmål interpellation; AU10 labour votes noted as proxy context.`

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**:
- HD10481 (Klimatmålen): No recognised agency named, but references Miljömålsberedningens betänkande. Implementation feasibility dimension present. → Trigger: governance/implementation.  
- HD10482 (Svartarbete): References Skatteverket implicitly (rot/rut/grön teknik/personalliggare control systems). Direct trigger: Skatteverket implementation + regulatory burden.  

Statskontoret search conducted for "svartarbete" and "rot/rut kontrollmöjligheter":  
`Statskontoret: no directly relevant recent report found for undeclared-work control systems or rot/rut reform; the ESO 2026:1 report is the authoritative evidence base.`  
`Statskontoret: no directly relevant report found for klimatmålsberedningens implementation; SMHI/Naturvårdsverket would be primary agencies but not covered by Statskontoret in recent portfolio.`

## Lagrådet Tracking

Neither HD10481 (interpellation, not proposition) nor HD10482 (interpellation, not proposition) requires Lagrådet review. Interpellations are parliamentary questions, not bills.  
`Lagrådet: not applicable — both documents are interpellations, not government propositions.`

## PIR Carry-Forward

Prior open PIRs from 2026-04-30/interpellations:
- PIR-ESA-1: Will Edholm commit ESA supplementary budget? → **Status: open** — not addressed in this cycle (different topic).  
- PIR-Heritage-1: Will Liljestrand commission SFV survey? → **Status: open** — not addressed.  
- PIR-ESA-2: ESA partner reactions? → **Status: open**.  
- PIR-Industry-1: Will Rymdstyrelsen restate funding needs? → **Status: open**.  

New cycle PIRs will be established in pir-status.json for this run's topics.

## MCP Availability

- riksdag-regering MCP: ✅ live (get_sync_status confirmed 2026-05-12T07:26:26Z)  
- IMF Datamapper: ✅ ok (imf-context.json status: ok, vintage WEO-2026-04)  
- IMF SDMX: ✅ ok per prewarm probe  
- World Bank: not queried (non-economic residue not triggered by these interpellations)  
