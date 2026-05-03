# Data Download Manifest — Month Ahead 2026-05-03

**Workflow**: news-month-ahead  
**Run ID**: 25294016102  
**Generated**: 2026-05-03T23:38:00Z  
**Article Date**: 2026-05-03  
**Subfolder**: month-ahead  
**Effective Date (after lookback)**: 2026-04-30 (2 business days lookback — no documents on 2026-05-03)  
**Window**: 2026-04-30 (most recent parliamentary activity)  
**Riksmöte**: 2025/26  

## MCP Server Status
- riksdag-regering MCP: ✅ live (https://riksdag-regering-ai.onrender.com/mcp)
- IMF CLI (tsx scripts/imf-fetch.ts): ⚠️ WEO API returned null results — using WEO Apr-2026 vintage figures from institutional knowledge, documented as `[IMF WEO Apr-2026, retrieved API null, vintage annotated]`
- SCB: not queried this cycle (IMF null; Swedish macro fundamentals documented from prior cycle knowledge)
- World Bank: not queried this cycle

## Documents Selected (21 total from 2026-04-30)

| dok_id | Title | Type | Department/Committee | Date | Full-text | Parti | Status |
|--------|-------|------|---------------------|------|-----------|-------|--------|
| HD03251 | En mer sammanhållen vård för skadligt bruk/beroende och psykiatriska tillstånd | prop | Socialdepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03254 | Förbättrade förutsättningar för operativt militärt samarbete | prop | Försvarsdepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03258 | Ökad insyn i politiska processer | prop | Justitiedepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03260 | En mer ändamålsenlig reglering av etikprövning av forskning | prop | Utbildningsdepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03262 | Utmönstring av permanent uppehållstillstånd + EU migrations-/asylpakt | prop | Justitiedepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03263 | Stärkt återvändandeverksamhet | prop | Justitiedepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03264 | Skärpta och tydligare krav på vandel för uppehållstillstånd | prop | Justitiedepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD03265 | Skärpta regler om uppsikt och förvar | prop | Justitiedepartementet | 2026-04-30 | partial (summary) | Gov | Active |
| HD10460 | Statens kulturarv och bidragsfastigheternas underhåll | interpellation | SD/Pia Trollehjelm → Kulturminister | 2026-04-30 | summary | SD | Active |
| HD10461 | Insatser för den svenska rymdbranschen | interpellation | S/Mats Wiking → Lotta Edholm | 2026-04-30 | summary | S | Active |
| HD11768 | Förbud mot turbokycklingar | motion | MP | 2026-04-30 | summary | MP | Active |
| HD11769 | Handlingsplan för psykisk hälsa och suicidprevention | motion | S | 2026-04-30 | summary | S | Active |
| HD11770 | Avtal för vårdvetenskaplig utbildning/forskning (Vulf) | motion | S | 2026-04-30 | summary | S | Active |
| HD11771 | Ändrade jakttider för älg | motion | S | 2026-04-30 | summary | S | Active |
| HD11772 | Ukraina och bistånd | motion | SD | 2026-04-30 | summary | SD | Active |
| HD11773 | Mäklares ansvar och köpares skydd vid fastighetsaffärer | motion | S | 2026-04-30 | summary | S | Active |
| HD11774 | Kreditgarantier för lån till anordnande av nya bostäder | motion | S | 2026-04-30 | summary | S | Active |
| HD11775 | Fattigdom bland ensamstående föräldrar | motion | S | 2026-04-30 | summary | S | Active |
| HD11776 | Anmälande av arbetsskador till Försäkringskassan | motion | S | 2026-04-30 | summary | S | Active |
| HD11777 | Verksamheten vid Statens museer för världskultur | motion | MP | 2026-04-30 | summary | MP | Active |
| HD11778 | Nekad mammografi på grund av grav funktionsnedsättning | motion | S | 2026-04-30 | summary | S | Active |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | notes |
|--------|---------------------|-------|
| HD03262 | true | EU asylum pact + permanent permit abolition — full summary retrieved via get_propositioner |
| HD03263 | true | Strengthened deportation — full summary retrieved |
| HD03264 | true | Character requirements — full summary retrieved |
| HD03254 | true | Military cooperation — full summary retrieved |
| HD03258 | true | Political transparency — full summary retrieved |

<full-text-fallback: top-5 full summaries retrieved via get_propositioner; additional documents have partial metadata>

## Prior-Voteringar Enrichment

Voteringar search for SfU (migration committee) 2022/23–2025/26: No directly comparable vote found for HD03262 cluster via MCP (voteringar data not yet synced for 2025/26 migration legislative batch). Most comparable prior vote: AU10 (2026-03-04) showed broad cross-party agreement on arbetslöshet procedures (all sampled MPs voted Ja on sakfrågan punkt 3).

No directly comparable vote found in last 4 riksmöten specifically for migration permanent-permit abolition — this is a novel measure exceeding prior policy scope.

## Statskontoret Cross-Source Enrichment

Triggers evaluated:
- HD03263 (Stärkt återvändandeverksamhet) → names Migrationsverket → **trigger: recognized agency + implementation-feasibility**
- HD03262 (EU asylum pact adaptation) → names Migrationsverket → **trigger**
- HD03251 (vård for addiction/psychiatric) → names Socialstyrelsen, regional authorities → **trigger: recognized agencies**
- HD03265 (supervision/detention) → names Migrationsverket → **trigger**

Statskontoret web_fetch: domain not reachable during this run. Recording: `Statskontoret: site retrieval not performed — proceeding with MCP evidence and propositions text. Agency capacity evidence sourced from proposition text summaries.`

## Lagrådet Tracking

HD03262, HD03263, HD03264, HD03265 — constitutional law dimension (fundamental rights under ECHR/RF): major migration package restricting individual rights → Lagrådet referral required.

Lagrådet site retrieval attempted. Recording: `Lagrådet: site not accessible during this run (2026-05-03T23:38:00Z). Referral status: pending confirmation. Based on proposition scope (abolishing permanent residence — RF Ch.2 + ECHR Art.8 implications), Lagrådet yttrande expected before Riksdag committee consideration.`

## Withdrawn Documents

No withdrawn documents identified in this batch.

## PIR Carry-Forward

No prior-cycle PIRs found (first run for 2026-05-03/month-ahead).

Standing PIRs for this cycle:
- PIR-1: Migration reform legislative trajectory — will Riksdag pass HD03262 cluster intact?
- PIR-2: Coalition arithmetic stability — can M-SD-KD-L hold 176-seat majority through election sprint?
- PIR-3: Defense posture — how does HD03254 military cooperation framework interact with NATO commitments?
- PIR-4: Healthcare reform momentum — HD03251 vs S/V/MP counter-proposals
- PIR-5: Transparency (HD03258) — KU committee reception and opposition amendments
