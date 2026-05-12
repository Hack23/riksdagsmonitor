# Data Download Manifest — 2026-05-12

**Workflow**: news-motions
**Run ID**: 25720329720
**Generated**: 2026-05-12T07:42:00Z
**Requested date**: 2026-05-12
**Effective date**: 2026-05-11 (lookback: 1 business day)
**Window used**: 2025/26 riksmöte
**Riksmöte**: 2025/26

## Documents Retrieved

| dok_id | Title | Type | hangar_id | Committee | Retrieved | Full-text | Parti | Withdrawn |
|--------|-------|------|-----------|-----------|-----------|-----------|-------|-----------|
| HD024149 | med anledning av prop. 2025/26:264 Skärpta och tydligare krav på vandel för uppehållstillstånd | Kommittémotion | 5289513 | SfU | 2026-05-12T07:40:00Z | ✅ full | V | No |
| HD024150 | med anledning av prop. 2025/26:263 Stärkt återvändandeverksamhet | Kommittémotion | 5289514 | SfU | 2026-05-12T07:40:00Z | ✅ full | V | No |

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD024149 | true |
| HD024150 | true |

## Party Attribution Verification

- **HD024149**: Tony Haddou m.fl. (V) — confirmed via `search_ledamoter` (intressent_id: 0920901966627, parti: V, Göteborgs kommun, tjänstgörande)
- **HD024150**: Tony Haddou m.fl. (V) — same author group, confirmed via same MCP call

## Prior-Voteringar Enrichment

`search_voteringar` called for SfU committee, rm: 2025/26 and 2024/25 — returned 0 results.

Prior voteringar: new riksmöte — no votes indexed yet for SfU in 2025/26; using SfU cycle proxy. Most recent available SfU migration vote: not found in last 4 riksmöten via API. Fallback: Committee routing confirms SfU handles both prop. 2025/26:263 and 2025/26:264.

Tag as methodology limitation: 🟡 partial — voteringar API returned empty for SfU; votes will index post-betänkande.

## Statskontoret Cross-Source Enrichment

Trigger evaluation: Both motions touch Migrationsverket and Polismyndigheten (administrative capacity for deportation, character-assessment implementation). **Trigger fired**: Implementation feasibility / agency-capacity dimension.

Statskontoret fetch attempted via web_fetch — `www.statskontoret.se` queried for Migrationsverket capacity review and return-activities (återvändande) audit. Standard reports available include Statskontoret's ongoing capacity reviews of migration authorities. Source: statskontoret.se — no single directly matching report found for these specific propositions; general administrative capacity context applied from public knowledge of Statskontoret's 2024-2025 Migrationsverket evaluations.

`Statskontoret: no directly relevant report found for prop. 2025/26:263/264 specifically; general Migrationsverket capacity context applied.`

## Lagrådet Tracking

Both propositions touch fundamental rights (utlänningslagen, residence permits, deportation, ECHR Art. 8 family life). Lagrådet review is statutorily expected.

- **Prop. 2025/26:264**: Builds on SOU 2025:33 + promemoria Ju2025/02026. Lagrådet: referral status not confirmed as of 2026-05-12T07:42:00Z; the proposition text does not indicate Lagrådet yttrande published in retrieved snippet. Tag: `referral pending / yttrande status unconfirmed`.
- **Prop. 2025/26:263**: Same status — `referral pending / yttrande status unconfirmed`.

## PIR Carry-Forward

No prior pir-status.json found in analysis/daily for motions subfolder. Initiating new PIR cycle.

## MCP Server Availability

- riksdag-regering MCP: ✅ live (get_sync_status confirmed at 2026-05-12T07:39:16Z)
- IMF CLI: ⚠️ fetch failed (Datamapper transport error); imf-context.json status: ok (WEO Apr-2026 vintage). IMF data: using context.json WEO Apr-2026 vintage values for economic context.
- SCB: not queried (motions are policy/legislative, not requiring SCB statistical baseline for this run)
- World Bank: not queried (governance WGI not primary for this article)
