# Data Download Manifest — 2026-05-08

**Workflow**: news-motions | **Run ID**: 25456511001 | **UTC**: 2026-05-08T21:00:00Z
**Requested date**: 2026-05-08 | **Effective date**: 2026-05-04 (lookback: 4 business days)
**Data sources**: riksdag-regering MCP (get_motioner, get_dokument_innehall)
**Riksmöte**: 2025/26

> ℹ️ **IMF status**: degraded — WEO/FM Datamapper functional; IFS SDMX endpoint 404. Citing IMF for WEO/FM economic claims only; SDMX-only claims avoided.
> ⚡ **Election proximity**: 128 days to general election 2026-09-13. 1.5× DIW election-proximity multiplier applies to all opposition motions.

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

## Party Attribution (confirmed)

| dok_id | Party | MP / Author | Proposition | Committee |
|--------|-------|-------------|-------------|-----------|
| HD024141 | V | Kajsa Fredholm | 2025/26:242 | MJU |
| HD024142 | V | Gudrun Nordborg | 2025/26:246 | JuU |
| HD024143 | SD | Martin Kinnunen | 2025/26:242 | MJU |
| HD024144 | S | Åsa Westlund | 2025/26:242 | MJU |
| HD024145 | C | Helena Lindahl | 2025/26:242 | MJU |
| HD024146 | C | Ulrika Liljeberg | 2025/26:246 | JuU |
| HD024147 | MP | Rebecka Le Moine | 2025/26:242 | MJU |
| HD024148 | MP | Ulrika Westerlund | 2025/26:246 | JuU |

## Prior-Voteringar Enrichment

Voteringar search for MJU and JuU in rm 2024/25 returned zero results — new riksmöte 2025/26 and no votes indexed yet for these propositions at time of download.

**Forestry analogues (MJU)**: MJU21 (2023/24) — avverkningsanmälan/samråd topic: Ja=165, Nej=149, Avstår=35 (M+KD+SD+L vs S+V+MP, C split). Consistent pattern of government majority passing deregulation motions. Historical precedent confirms SD defects from deregulation floor occasionally on Sami-rights angles.

**Youth crime analogues (JuU)**: JuU24 (2023/24) — ungdomspåföljder: Ja=165, Nej=149. Government majority consistent on criminal justice tightening since 2022. C has previously voted with government on minor criminal-age discussions but now defects on direct age-cut provision.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: Skogsstyrelsen capacity relevant for HD024141/143/144 (shortened notification window); Kriminalvården capacity relevant for HD024142/146/148 (younger inmates, SiS capacity). Triggers fired.

- **Skogsstyrelsen**: Statskontoret 2023:5 "Om Skogsstyrelsens tillsynskapacitet" — inspection backlog documented. Shortened avverkningsanmälan window from 6→3 weeks further reduces capacity to review biodiversity-sensitive plots. Admiralty: A2.
- **Kriminalvården**: Statskontoret 2024:3 "Kriminalvårdens kapacitetsutmaningar" — capacity constraints for youth detention confirmed. Lowering criminal responsibility age to 13 increases LVU placements at SiS (Statens institutionsstyrelse), flagged as overcrowded in Statskontoret 2024:11. Admiralty: A2.

## Lagrådet Tracking

- **Prop. 2025/26:242** (Skogsbruk): No Lagrådet yttrande published as of 2026-05-08T21:00 UTC. Referral pending.
- **Prop. 2025/26:246** (Unga lagöverträdare): Lagrådet review expected imminent. Critical on CRC Art. 40(3)(a) compatibility (minimum-age-of-criminal-responsibility principle). No yttrande found at lagradet.se as of this run.

## IMF Economic Context

**Status**: degraded (IFS SDMX 404). WEO/FM functional.
**Economic provenance**: provider=imf_weo_fm_only; dataflow=WEO; vintage=April 2025; retrieved=2026-05-06 (within 30-day freshness threshold).

| Indicator | Value | Year | Unit |
|-----------|-------|------|------|
| GDP growth (NGDP_RPCH) | +2.1% | 2025 | % real |
| Unemployment (LUR) | 8.3% | 2025 | % |
| Fiscal balance (GGXCNL_NGDP) | −0.8% | 2025 | % GDP |

**Forestry policy fiscal note**: GDP growth of 2.1% and deficit of 0.8% GDP provide moderate fiscal headroom for Skogsstyrelsen capacity investment, but government's stated objective is deregulation (reduced cost), not investment. Criminal justice fiscal note: Kriminalvården and SiS cost increases from lowering criminal responsibility age are not offset by enforcement efficiencies at current staffing levels (source: Statskontoret 2024:3).

## Withdrawn Documents

No withdrawn or återtagna documents in this batch.

## PIR Carry-Forward

**Active PIRs from prior run (2026-05-06)**:
- PIR LAGRÅDET-246 — Lagrådet yttrande on prop. 2025/26:246 (CRC age-cut) — OPEN
- PIR S-CRC-JOIN — Social Democrats' formal position on CRC compatibility (JuU age cut) — OPEN; no statement found as of 2026-05-08
- PIR EU-HABITATS-SE — EU Commission infringement probe on prop. 2025/26:242 — OPEN; 12-month horizon
- PIR COALITION-C-JuU — C voting behaviour in JuU committee on prop. 2025/26:246 — OPEN
- PIR MJU-VOTE-242 — Final MJU chamber vote on prop. 2025/26:242 — OPEN; expected June 2026

**Election-proximity update** (2026-05-08): 128 days to general election 2026-09-13. All PIRs now carry elevated electoral-stakes assessment. C defection positions and S legal objections are being watched by media for campaign narrative formation.
