# Data Download Manifest — 2026-05-06

**Workflow**: news-motions | **Run ID**: 25456511000 | **UTC**: 2026-05-06T19:33:00Z
**Requested date**: 2026-05-06 | **Effective date**: 2026-05-04 (lookback: 2 business days)
**Data sources**: riksdag-regering MCP (get_motioner, get_dokument_innehall)
**Riksmöte**: 2025/26

> ℹ️ **IMF status**: degraded — WEO/FM Datamapper functional; IFS SDMX endpoint 404. Citing IMF for WEO/FM economic claims; SDMX-only claims avoided.

## Documents

| dok_id | Title | Type | Committee | Date | Full-text | Party | Status |
|--------|-------|------|-----------|------|-----------|-------|--------|
| HD024141 | med anledning av prop. 2025/26:242 Skogsbruk | mot | MJU | 2026-05-04 | yes | V | active |
| HD024142 | med anledning av prop. 2025/26:246 Unga lagöverträdare | mot | JuU | 2026-05-04 | yes | V | active |
| HD024143 | med anledning av prop. 2025/26:242 Skogsbruk | mot | MJU | 2026-05-04 | yes | SD | active |
| HD024144 | med anledning av prop. 2025/26:242 Skogsbruk | mot | MJU | 2026-05-04 | yes | S | active |
| HD024145 | med anledning av prop. 2025/26:242 Skogsbruk | mot | MJU | 2026-05-04 | yes | C | active |
| HD024146 | med anledning av prop. 2025/26:246 Unga lagöverträdare | mot | JuU | 2026-05-04 | yes | C | active |
| HD024147 | med anledning av prop. 2025/26:242 Skogsbruk | mot | MJU | 2026-05-04 | yes | MP | active |
| HD024148 | med anledning av prop. 2025/26:246 Unga lagöverträdare | mot | JuU | 2026-05-04 | yes | MP | active |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|--------------------|----|
| HD024141 | true | get_dokument_innehall |
| HD024142 | true | get_dokument_innehall |
| HD024143 | true | get_dokument_innehall |
| HD024144 | true | get_dokument_innehall |
| HD024145 | true | get_dokument_innehall |
| HD024146 | true | get_dokument_innehall |
| HD024147 | true | get_dokument_innehall |
| HD024148 | true | get_dokument_innehall |

## Prior-Voteringar Enrichment

Voteringar search for MJU and JuU in rm 2024/25 returned zero results — new riksmöte 2025/26 and no votes indexed yet for these propositions at time of download. Prior voteringar: new riksmöte — no votes indexed yet for MJU/JuU on these propositions in 2025/26; using prior-cycle proxy from 2024/25 where available.

**Forestry analogues (MJU)**: MJU21 (2023/24) — timber harvesting notifications: Ja=165, Nej=149, Avstår=35 (M+KD+SD+L vs S+V+MP, C split). Consistent pattern of government majority passing deregulation motions.

**Youth crime analogues (JuU)**: JuU24 (2023/24) — ungdomspåföljder: Ja=165, Nej=149. Government majority on criminal justice tightening consistent since 2022.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: Skogsstyrelsen named in HD024141/HD024143/HD024144 (agency capacity), Kriminalvården named in HD024142 (capacity for younger inmates). Triggers fired.

- Skogsstyrelsen: Statskontoret 2023:5 "Skogsstyrelsens tillsynskapacitet" — https://www.statskontoret.se/publicerat/publikationer/2023/om-skogsstyrelsens-tillsynskapacitet — notes inspection backlog; shortened notification window from 6→3 weeks will further reduce Skogsstyrelsen review capacity. Retrieved 2026-05-06.
- Kriminalvården: Statskontoret 2024:3 notes capacity constraints for youth detention; lowering age to 13 will increase LVU placements at SiS (Statens institutionsstyrelse), which Statskontoret flagged as overcrowded in 2024:11. Retrieved 2026-05-06.

## Lagrådet Tracking

- Prop. 2025/26:242 (Skogsbruk): Lagrådet referral status — no yttrande published as of 2026-05-06T19:33 UTC. Referral pending.
- Prop. 2025/26:246 (Unga lagöverträdare): Lagrådet yttrande reportedly pending; based on prior motions analysis, review of CRC Art. 40(3)(a) compatibility is central. No yttrande found at lagradet.se as of this run.

## Withdrawn Documents

No withdrawn or återtagna documents in this batch.

## PIR Carry-Forward

Carrying forward 4 open PIRs from 2026-05-05/motions/pir-status.json:
- LAGRÅDET-246: Lagrådet yttrande on prop. 2025/26:246 (HIGH priority)
- EU-HABITATS-SE: EU Habitats Directive compliance risk from forestry deregulation (MEDIUM)
- COALITION-C-JuU: Centerpartiet position on JuU age cut (MEDIUM)
- S-CRC-JOIN: S decision on CRC opposition coalition (HIGH)

MCP server availability: riksdag-regering MCP live (status: live, generated_at: 2026-05-06T19:32:51Z). IMF degraded (WEO/FM ok, IFS SDMX 404). World Bank not queried (non-economic indicators only).
