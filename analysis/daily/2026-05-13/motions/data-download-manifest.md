# Data Download Manifest — Opposition Motions 2026-05-13

**Workflow**: news-motions  
**Run ID**: 25785419647  
**UTC Timestamp**: 2026-05-13T07:45:00Z  
**Requested Date**: 2026-05-13  
**Effective Date**: 2026-05-13  
**Riksmöte**: 2025/26  

## Document Download Summary

| dok_id | Title | Type | Committee | Datum | Full-Text | Parti | Withdrawn |
|--------|-------|------|-----------|-------|-----------|-------|-----------|
| HD024151 | med anledning av prop. 2025/26:258 Ökad insyn i politiska processer | Kommittémotion | [unconfirmed] | 2026-05-13 | ✅ | S | No |
| HD024150 | med anledning av prop. 2025/26:263 Stärkt återvändandeverksamhet | Kommittémotion | SfU | 2026-05-11 | ✅ | V | No |
| HD024149 | med anledning av prop. 2025/26:264 Skärpta och tydligare krav på vandel | Kommittémotion | SfU | 2026-05-11 | ✅ | V | No |
| HD024148 | med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | Kommittémotion | JuU | 2026-05-04 | Metadata | MP | No |
| HD024147 | med anledning av prop. 2025/26:242 Aktivt skogsbruk | Kommittémotion | MJU | 2026-05-04 | Metadata | MP | No |
| HD024146 | med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | Kommittémotion | JuU | 2026-05-04 | Metadata | C | No |
| HD024145 | med anledning av prop. 2025/26:242 Aktivt skogsbruk | Kommittémotion | MJU | 2026-05-04 | Metadata | C | No |
| HD024144 | med anledning av prop. 2025/26:242 Aktivt skogsbruk | Kommittémotion | MJU | 2026-05-04 | Metadata | S | No |
| HD024143 | med anledning av prop. 2025/26:242 Aktivt skogsbruk | Kommittémotion | MJU | 2026-05-04 | Metadata | SD | No |
| HD024142 | med anledning av prop. 2025/26:246 Skärpta regler för unga lagöverträdare | Kommittémotion | JuU | 2026-05-04 | Metadata | V | No |
| HD024141 | med anledning av prop. 2025/26:242 Aktivt skogsbruk | Kommittémotion | MJU | 2026-05-04 | Metadata | V | No |
| HD024140 | med anledning av skr. 2025/26:245 Nationell strategi mot mäns våld mot kvinnor | Kommittémotion | AU | 2026-04-29 | Metadata | C | No |
| HD024137 | med anledning av prop. 2025/26:239 Vindkraft i kommuner | Kommittémotion | NU | 2026-04-29 | Metadata | C | No |
| HD024135 | med anledning av prop. 2025/26:234 Kommunal hamnverksamhet | Kommittémotion | TU | 2026-04-29 | Metadata | V | No |
| HD024133 | med anledning av skr. 2025/26:245 Nationell strategi mot mäns våld | Kommittémotion | AU | 2026-04-29 | Metadata | V | No |
| HD024131 | med anledning av prop. 2025/26:238 Ny myndighet för miljöprövning | Kommittémotion | MJU | 2026-04-29 | Metadata | MP | No |
| HD024130 | med anledning av prop. 2025/26:240 Nya lagar om elsystemet | Kommittémotion | NU | 2026-04-29 | Metadata | MP | No |
| HD024128 | med anledning av prop. 2025/26:243 Tonnagebeskattning | Kommittémotion | SkU | 2026-04-29 | Metadata | S | No |
| HD024125 | med anledning av prop. 2025/26:234 Kommunal hamnverksamhet | Kommittémotion | TU | 2026-04-29 | Metadata | S | No |
| HD024127 | Motionen utgår | — | — | 2026-04-29 | N/A | — | **Withdrawn** |

## Full-Text Fetch Outcomes

| dok_id | Status | Notes |
|--------|--------|-------|
| HD024151 | ✅ Retrieved | S motion on political transparency — full text analysed |
| HD024150 | ✅ Retrieved | V motion on deportation operations — full text analysed |
| HD024149 | ✅ Retrieved | V motion on residence permit conditions — full text analysed |
| HD024148–HD024127 | Metadata-only | Summary sufficient for L1-L2 analysis |

## Prior-Voteringar Enrichment

- **KU (Konstitutionsutskottet)**: Prop. 2025/26:258 political transparency — no prior vote found yet in 2025/26; newly introduced proposition.
- **SfU (Socialförsäkringsutskottet)**: Migration props 263, 264 — no votes indexed in 2025/26 yet; new riksmöte cycle.
- **JuU (Justitieutskottet)**: Prop 2025/26:246 young offenders — no comparable vote in last 4 riksmöten on exact criminal age reduction to 13.
- **MJU (Miljö- och jordbruksutskottet)**: Prop 2025/26:242 forestry — no equivalent vote in last 4 riksmöten.
- **Fallback applied**: New riksmöte 2025/26 — using prior cycle proxy where available. See `methodology-reflection.md §Content Metrics` for 🟡 tag.

## Statskontoret Cross-Source Enrichment

Triggers evaluated:
- HD024150 (Stärkt återvändandeverksamhet): Names Migrationsverket (Kriminalvården involved in deportation escort) → **Trigger fired**. Fetched: `https://www.statskontoret.se/` — No directly relevant recent Statskontoret evaluation found for Migrationsverket deportation capacity as of 2026-05-13. Statskontoret's 2025 annual review of government agencies referenced general capacity constraints.
- HD024149 (Vandel för uppehållstillstånd): Names Migrationsverket → **Trigger fired**. No relevant Statskontoret report on implementation feasibility of vandel assessment.
- HD024151 (Insyn i politiska processer): No agency named; no administrative dimension → **No trigger**: Statskontoret pre-warm: no trigger matched.
- HD024246 (Young offenders): Names Kriminalvården, BRÅ → **Trigger fired**. No Statskontoret report on youth detention capacity found.

## Lagrådet Tracking

- Prop. 2025/26:258 (Insyn i politiska processer): Touches association freedom (RF ch.2), party financing law — **Lagrådet referral likely**. Lagrådet.se reachable but no yttrande published as of 2026-05-13T07:45:00Z. Forward indicator: referral window May–June 2026.
- Prop. 2025/26:263, 264 (Migration): Constitutional rights implications (Art. 8 ECHR) — Lagrådet referral expected. Status: referral pending / no yttrande published as of 2026-05-13T07:45:00Z.
- Prop. 2025/26:246 (Young offenders): Criminal procedure, fundamental rights RF ch.2:7 — **Lagrådet referral required**. Status: referral pending as of 2026-05-13.

## Withdrawn Documents

| dok_id | Title | Sponsor | Date | Reason |
|--------|-------|---------|------|--------|
| HD024127 | Motionen utgår | Unknown | 2026-04-29 | Withdrawn before publication — likely strategic repositioning or internal coordination failure |

*Note: HD024127 withdrawal is an analytic signal — see `synthesis-summary.md` and `devils-advocate.md`.*

## PIR Carry-Forward

No prior PIR files found for motions cycle within 14 days. Fresh cycle — new PIRs established in `intelligence-assessment.md`.

## MCP Server Availability

- riksdag-regering: **live** (confirmed 2026-05-13T07:43:35Z)
- IMF context: **ok** (WEO-2026-04, age 1 month, not stale)
- SCB: available (not called in this cycle — Swedish-specific economic data not required)
- World Bank: available (governance residue only if needed)
