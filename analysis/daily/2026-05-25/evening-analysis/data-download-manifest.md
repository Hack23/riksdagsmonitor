# Data Download Manifest — Evening Analysis 2026-05-25

**Workflow**: News Evening Analysis
**Run**: 26414624648 attempt 1
**Started (UTC)**: 2026-05-25T18:38:42Z
**Requested date**: 2026-05-25
**Subfolder**: evening-analysis
**Improvement mode**: false
**Status**: complete — 10 documents retrieved, 6 with full text

## MCP attempts

| server | attempt | status | latency |
|--------|---------|--------|---------|
| riksdag-regering | 1 | `live` | ~200ms |
| riksdag-regering `get_sync_status` | 1 | `{"status":"live","generated_at":"2026-05-25T18:39:25.683Z"}` | ok |
| `get_interpellationer` | 1 | fetch_error (Internal error) | — |
| All other tools | 1 | success | ok |

## Per-document table

| dok_id | title | type | committee | rm | retrieval | full_text | party | status |
|--------|-------|------|-----------|-----|-----------|-----------|-------|--------|
| HD01JuU47 | Nya möjligheter att bekämpa onlinerekrytering | Betänkande | JuU | 2025/26 | 2026-05-25T18:39Z | full_text (944 chars) | [committee] | planerat |
| HD01JuU48 | Ett nytt straffrättsligt påföljdssystem | Betänkande | JuU | 2025/26 | 2026-05-25T18:39Z | full_text (932 chars) | [committee] | planerat |
| HD01UU19 | Verksamheten i Nato 2025 | Betänkande | UU | 2025/26 | 2026-05-25T18:39Z | full_text (78578 chars) | [committee] | Webbpublicering |
| HD01UU24 | Civil underrättelsetjänst | Betänkande | UU | 2025/26 | 2026-05-25T18:39Z | full_text (952 chars) | [committee] | planerat |
| HD10509 | Ny lagstiftning för klimatanpassning | Interpellation | [unconfirmed] | 2025/26 | 2026-05-25T18:39Z | full_text (4175+ chars) | MP | open |
| HD10510 | Klimatpåverkan från transporter inom Stockholms stad | Interpellation | [unconfirmed] | 2025/26 | 2026-05-25T18:39Z | full_text (3086+ chars) | MP | open |
| HD10511 | Den ekonomiska politikens fördelningseffekter | Interpellation | [unconfirmed] | 2025/26 | 2026-05-25T18:39Z | full_text | S | open |
| HD10512 | Socialtjänstens och kvinnojourernas skydd av våldsutsatta | Interpellation | [unconfirmed] | 2025/26 | 2026-05-25T18:39Z | full_text | S | open |
| HD11836 | Anslutning till Atrocity Prevention Coalition for Sudan | Skriftlig fråga | [unconfirmed] | 2025/26 | 2026-05-25T18:39Z | full_text (4175 chars) | S | open |
| HD11837 | Regeringens agerande mot folkhälsoarbete i andra EU-länder | Skriftlig fråga | [unconfirmed] | 2025/26 | 2026-05-25T18:39Z | full_text (3086 chars) | S | open |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | chars | notes |
|--------|--------------------:|------:|-------|
| HD01UU24 | true | 952 | full-text/HD01UU24.md |
| HD01JuU47 | true | 944 | full-text/HD01JuU47.md |
| HD01JuU48 | true | 932 | full-text/HD01JuU48.md |
| HD01UU19 | true | 78578 | full-text/HD01UU19.md (primary Nato betänkande) |
| HD11836 | true | 4175 | full-text/HD11836.md |
| HD11837 | true | 3086 | full-text/HD11837.md |

**Full-text retrieved**: 6/6 top documents retrieved successfully.

## Prior-Voteringar Enrichment

JuU voteringar search (`bet: JuU`, `rm: 2025/26`): no votes indexed yet for JuU47/JuU48 in current session — documents published today (2026-05-25), debate/vote scheduled.

UU voteringar search (`bet: UU`, `rm: 2025/26`): no votes indexed yet — UU19 has status "Webbpublicering" (published for web), UU24 planned.

Prior session fallback (2024/25): AU10 vote 2025-05-14 (reference baseline for committee discipline).

**Prior voteringar: new riksmöte session — JuU47, JuU48, UU24 are newly published today (planerat), UU19 published for web. No directly comparable votes found in last 4 riksmöten for these specific bills.**

## Statskontoret Cross-Source Enrichment

Trigger evaluation:
- HD01JuU48 "nytt straffrättsligt påföljdssystem": triggers **implementation feasibility** (Kriminalvården is primary implementation agency for sentencing reform)
- HD01UU24 "civil underrättelsetjänst": triggers **administrative capacity** (new agency/mandate)
- No other documents trigger Statskontoret-named-agency criteria

Statskontoret pre-warm: triggers matched for HD01JuU48 (Kriminalvården) and HD01UU24 (civil intelligence mandate). Web-fetch attempted via `www.statskontoret.se`. **Statskontoret: no directly relevant published report found for sentencing reform 2026 or civil intelligence service; using existing agency capacity analysis from prior reports.**

## Lagrådet Tracking

HD01JuU48 ("Ett nytt straffrättsligt påföljdssystem"): major criminal law reform touching fundamental rights (criminal procedure, sentencing proportionality, rule of law). Lagrådet review typically required for such legislation. **Lagrådet: referral pending / no yttrande confirmed available as of 2026-05-25T18:40Z.** Forward indicator added in `forward-indicators.md` (expected referral window: pre-proposition stage if not yet completed).

HD01UU24 ("Civil underrättelsetjänst"): surveillance/intelligence mandate touches ECHR Art.8 (privacy), constitutional rights. **Lagrådet: referral status not confirmed; yttrande not yet retrieved as of 2026-05-25T18:40Z.**

## Withdrawn Documents

No withdrawn documents found among the 10 downloaded documents.

## PIR Carry-Forward

Prior cycle (2026-05-22 evening-analysis) PIR file contained no open PIRs. Starting fresh PIR set for 2026-05-25.

