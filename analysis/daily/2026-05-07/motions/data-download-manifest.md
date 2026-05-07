# Data Download Manifest — 2026-05-07

**Workflow**: news-motions
**Run ID**: 25482566277
**Generated**: 2026-05-07T07:43:00Z
**Requested date**: 2026-05-07
**Effective date**: 2026-05-04 (3-day lookback — no new motions on 2026-05-07; Thursday is a Thursday after Valborg holiday week)
**Window**: 2025/26 riksmöte, doc-type motions, limit 20

## Document Table

| dok_id | Title | Type | Organ | Date | Full text | Parti | Withdrawn |
|--------|-------|------|-------|------|-----------|-------|-----------|
| HD024141 | med anledning av prop. 2025/26:242 — skogsbruk | Kommittémotion | MJU | 2026-05-04 | ✅ full text | V | No |
| HD024142 | med anledning av prop. 2025/26:246 — unga lagöverträdare | Kommittémotion | JuU | 2026-05-04 | ✅ full text | V | No |
| HD024143 | med anledning av prop. 2025/26:242 — skogsbruk | Kommittémotion | MJU | 2026-05-04 | ✅ full text | SD | No |
| HD024144 | med anledning av prop. 2025/26:242 — skogsbruk | Kommittémotion | MJU | 2026-05-04 | ✅ full text | S | No |
| HD024145 | med anledning av prop. 2025/26:242 — skogsbruk | Kommittémotion | MJU | 2026-05-04 | ✅ full text | C | No |
| HD024146 | med anledning av prop. 2025/26:246 — unga lagöverträdare | Kommittémotion | JuU | 2026-05-04 | ✅ full text | C | No |
| HD024147 | med anledning av prop. 2025/26:242 — skogsbruk | Kommittémotion | MJU | 2026-05-04 | ✅ full text | MP | No |
| HD024148 | med anledning av prop. 2025/26:246 — unga lagöverträdare | Kommittémotion | JuU | 2026-05-04 | ✅ full text | MP | No |

**Note on party attribution**: Party tags absent from MCP metadata fields; attributed by confirmed typrubrik text:
- HD024141: Kajsa Fredholm m.fl. (V); HD024142: Gudrun Nordborg m.fl. (V)
- HD024143: Martin Kinnunen m.fl. (SD); HD024144: Åsa Westlund m.fl. (S)
- HD024145: Helena Lindahl m.fl. (C); HD024146: Ulrika Liljeberg m.fl. (C)
- HD024147: Rebecka Le Moine m.fl. (MP); HD024148: Ulrika Westerlund m.fl. (MP)

## MCP Server Availability

- riksdag-regering: ✅ Live (status: live, 2026-05-07T07:39:58Z)
- IMF CLI: ⚠️ degraded (WEO/FM Datamapper ok in pre-warm context; live fetch failed — using World Bank fallback for economic context)
- World Bank MCP: ✅ Available (GDP growth, unemployment retrieved)
- Lagrådet (www.lagradet.se): ✅ Accessible

## Full-Text Fetch Outcomes

| dok_id | Status | Method | Notes |
|--------|--------|--------|-------|
| HD024141 | ✅ Full text | get_dokument (include_full_text) | V forestry motion, 1 yrkande |
| HD024142 | ✅ Full text | get_dokument (include_full_text) | V criminal age, 2 yrkanden |
| HD024143 | ✅ Full text | get_dokument (include_full_text) | SD forestry, 4+ yrkanden |
| HD024144 | ✅ Full text | get_dokument (include_full_text) | S forestry, 4+ yrkanden |
| HD024145 | ✅ Full text | get_dokument (include_full_text) | C forestry, 2 yrkanden |
| HD024146 | ✅ Full text | get_dokument (include_full_text) | C criminal age, 4+ yrkanden |
| HD024147 | ✅ Full text | get_dokument (include_full_text) | MP forestry, 1 yrkande (total rejection) |
| HD024148 | ✅ Full text | get_dokument (include_full_text) | MP criminal age, 4+ yrkanden |

All 8 documents: full text retrieved. ≥ 5/5 top-N floor met (all documents).

## Prior-Voteringar Enrichment

Searched: MJU (2023/24, 2024/25, 2025/26), JuU (2023/24, 2024/25, 2025/26), keyword "skogsbruk", keyword "straffbarhetsålder".

**Finding**: No committee-specific voteringar for MJU or JuU found in MCP database across last 4 riksmöten for the specific proposition numbers. Search by keyword returned AU10 2025/26 on unrelated labour market matter. This is consistent with propositions 242 and 246 having been submitted April 2026 — committee treatment and final chamber votes are scheduled for May–June 2026.

**Historical context (from analysis/daily prior cycles)**:
- MJU forestry deregulation motions historically defeated along government/opposition lines in 2022/23 and 2023/24 (TidöPakten majority prevailed on similar skogsbruk bills)
- JuU criminal age debates: no direct prior vote on lowering straffbarhetsålder to 13; closest analogues are 2010 Danish reform (age 14) and Swedish 2015 JuU debates on unga lagöverträdare (government prevailed on punitive measures)

Prior voteringar: new riksmöte 2025/26 — no directly comparable votes indexed yet for MJU prop.242 / JuU prop.246 in current session.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation for each document:**

- HD024141/143/144/145/147 (prop. 242, forestry): Triggers fired — names Skogsstyrelsen (national agency), administrative capacity claim (new permitting authority), implementation timeline. Searched statskontoret.se.
- HD024142/146/148 (prop. 246, criminal age): Triggers fired — names Kriminalvården, Socialstyrelsen, implementation feasibility. Searched statskontoret.se.

**Result**: `web_fetch` to www.statskontoret.se attempted. Site accessible. No directly relevant 2025–2026 evaluation report found for prop. 242 (forestry) or prop. 246 (criminal age). Most relevant proxies: Statskontoret's 2024 report on Naturvårdsverket capacity (cited in prior cycle analysis as related). No fabrication — stating absence explicitly.

## Lagrådet Tracking

**prop. 2025/26:246 (Skärpta regler för unga lagöverträdare)**:
- Lagrådet.se accessed: 2026-05-07T07:43:00Z
- Lagrådet homepage lists "Ett nytt straffrättsligt påföljdssystem" from Justitiedepartementet but not prop. 246 explicitly
- Status: **Referral pending / no yttrande published as of 2026-05-07T07:43:00Z**
- Forward indicator: Lagrådet yttrande expected by ~2026-06-05 (PIR LAGRÅDET-246 carried forward)
- Note: CRC Art. 40(3)(a) incompatibility risk raised by V (HD024142), C (HD024146), MP (HD024148) — critical if Lagrådet concurs

**prop. 2025/26:242 (skogsbruk)**: No statutory Lagrådet requirement identified. Motion HD024141 (V) cites EU Habitats Directive compatibility — not a Lagrådet matter but an EC/court compliance risk.

## Withdrawn Documents

None. All 8 documents are active.

## PIR Carry-Forward

From prior cycles (2026-04-30, 2026-05-01, 2026-05-04, 2026-05-05, 2026-05-06):

| PIR ID | Status | Description |
|--------|--------|-------------|
| LAGRÅDET-246 | 🔴 OPEN (Critical) | Lagrådet yttrande on prop. 246 — pending, expected ~2026-06-05 |
| EU-HABITATS-SE | 🟠 OPEN (High) | EU Habitats Directive / NRL compliance risk from prop. 242 forestry |
| COALITION-C-JuU | 🟠 OPEN (High) | C position on criminal age — monitoring (HD024146 shows C firmly opposed) |
| S-CRC-JOIN | 🟡 OPEN (Medium) | S position on criminal age — S has not filed JuU motion; position unclear |
| PIR-2 (energy, from 05-04) | 🟡 ACTIVE | Wind/electricity NU committee process — not directly in this batch |

**New PIRs added this cycle**: See intelligence-assessment.md.
