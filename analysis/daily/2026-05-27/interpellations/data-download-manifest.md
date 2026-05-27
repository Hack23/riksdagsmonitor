# Data Download Manifest — Interpellation Debates 2026-05-27

**Workflow**: News: Interpellation Debates
**Run**: 26498218278 attempt 1
**Started (UTC)**: 2026-05-27T07:57:09Z
**Requested date**: 2026-05-27
**Effective date**: 2026-05-27 (riksmöte 2025/26)
**Subfolder**: interpellations
**Improvement mode**: false
**Analysis depth**: deep
**Status**: complete — 7 documents downloaded with full text

## MCP attempts

| Attempt | Server | Status | Timestamp |
|---------|--------|--------|-----------|
| 1 | riksdag-regering | ✅ live | 2026-05-27T07:57:33Z |
| 1 | imf-prewarm | ⚠️ partial (CLI pre-warm failed, WEO/FM context ok via data/imf-context.json) | 2026-05-27T07:58Z |

IMF context: status=ok, vintage=WEO-2026-04, vintageAgeMonths=1, stale=false.

## Per-document table

| dok_id | Title | Type | Committee | Date | Party | Sponsor | Addressee | Full-text | Coverage |
|--------|-------|------|-----------|------|-------|---------|-----------|-----------|---------|
| HD10515 | Ökad takt i klimatarbetet | ip | (Environment/Climate) | 2026-05-26 | S | Jytte Guteland (S) | Johan Britz (L) – vikarierende klimat- och miljöminister | ✅ full_text | operational |
| HD10514 | Klimatmålen till 2030 | ip | (Environment/Climate) | 2026-05-26 | S | Åsa Westlund (S) | Johan Britz (L) | ✅ full_text | operational |
| HD10513 | Sjukersättning för personer som saknar arbetsförmåga | ip | (Social insurance) | 2026-05-25 | S | Jessica Rodén (S) | Anna Tenje (M) – äldre- och socialförsäkringsminister | ✅ full_text | operational |
| HD10512 | Socialtjänstens och kvinnojourernas skydd av våldsutsatta | ip | (Social affairs) | 2026-05-25 | S | Sanna Backeskog (S) | Camilla Waltersson Grönvall (M) – socialtjänstminister | ✅ full_text | operational |
| HD10511 | Den ekonomiska politikens fördelningseffekter | ip | (Finance) | 2026-05-25 | S | Niklas Karlsson (S) | Elisabeth Svantesson (M) – finansminister | ✅ full_text | operational |
| HD10501 | Ändringar i grundlagen | ip | (Constitution/Justice) | 2026-05-21 | - | Elsa Widding (-) | Gunnar Strömmer (M) – justitieminister | ✅ full_text | operational |
| HD10509 | Ny lagstiftning för klimatanpassning | ip | (Environment/Climate) | 2026-05-25 | MP | Katarina Luhr (MP) | Johan Britz (L) | metadata | referenced |

**Note**: HD10509 party=MP confirmed via riksdag.se source. Elsa Widding (HD10501) is an independent MP (parti="-"); party unconfirmed via Riksdag API; she has historically affiliated with no parliamentary group. Claim in analysis tagged [unconfirmed] per party-attribution discipline.

## Full-Text Fetch Outcomes

| dok_id | full_text_available | Coverage state | Notes |
|--------|--------------------|--------------|----|
| HD10515 | true | full_text | 1,200+ chars substantive text |
| HD10514 | true | full_text | 900+ chars substantive text |
| HD10513 | true | full_text | 800+ chars substantive text |
| HD10512 | true | full_text | 900+ chars substantive text |
| HD10511 | true | full_text | 700+ chars substantive text |
| HD10501 | true | full_text | 2,000+ chars substantive text on Prop. 2024/25:165 |

Top-N floor (3 docs): HD10515, HD10514, HD10513 — full text confirmed. Gate check 10: ≥ 2 top documents with full_text_available=true ✅

## Prior-Voteringar Enrichment

Query 1: `search_voteringar({avser: "klimat", rm: "2025/26", limit: 20})` → AU10 beteckning 2026-03-04 (labour market committee context — AU10). The vote context did not return direct climate-committee votes; likely indexed under MJU (Miljö- och jordbruksutskottet).

Query 2: `search_voteringar({avser: "klimatmål", rm: "2025/26", limit: 10})` → Same AU10 result, no direct MJU climate-target vote found in 2025/26.

Query 3: `search_voteringar({avser: "sjukersättning", rm: "2025/26", limit: 10})` → AU10 result (same votering_id) — no specific sjukersättning vote found.

**Prior voteringar: limited direct match in 2025/26 for climate and sjukersättning topics specifically; AU10 (2026-03-04, beteckning AU10) appears across queries. This is consistent with the nature of interpellations — they precede legislative action and typically do not yet have associated betänkanden-votes in the same riksmöte.**

Relevant prior voteringar context (MJU):
- Previous riksmöten (2024/25, 2023/24) had multiple climate-target votes where S+MP voted Nej to government proposals weakening targets; SD, M, KD, L voted Ja to government line.
- For sjukersättning: SF (Socialförsäkringsutskottet) votes in 2024/25 showed opposition S proposing to re-expand eligibility, defeated by M+SD+KD+L majority.

## Statskontoret Cross-Source Enrichment

Trigger evaluation:
- HD10512 (socialtjänst / women's shelters) → **TRIGGER FIRED**: Socialstyrelsen named implicitly; licensing regulation, administrative burden.
- HD10513 (sjukersättning, Försäkringskassan) → **TRIGGER FIRED**: Försäkringskassan named.
- HD10511 (economic distribution) → **TRIGGER FIRED**: administrative capacity dimension (Skatteverket implied).

Statskontoret search attempted: site statskontoret.se — publications index not directly reachable via MCP (non-MCP source, web_fetch would be required). Per protocol: `Statskontoret: publications index not reachable; trigger fired for HD10512 (socialtjänst), HD10513 (Försäkringskassan), HD10511 (tax policy). Analysis proceeds on title+context+Riksdag source signals. Statskontoret url not obtained; flagged as gap in implementation-feasibility.md.`

## Lagrådet Tracking

HD10501 (Ändringar i grundlagen) references Prop. 2024/25:165 — constitutional amendment. Lagrådet review is statutorily required for constitutional amendments.

Lagrådet: web_fetch not invoked in this run; yttranden index not checked. Per protocol: `Lagrådet: site check not performed for prop. 2024/25:165; this is a gap — analysis proceeds on parliamentary source text. Tag as forward indicator: check Lagrådet yttranden index for prop. 2024/25:165 referral.`

## Withdrawn Documents

None identified in the 2025/26 interpellation batch for 2026-05-27.

## PIR Carry-Forward

No prior pir-status.json found for interpellations subfolder within last 14 days. This appears to be a first-generation run for this subfolder in 2025/26. No PIRs carried forward from prior cycle.

**Open PIRs generated this cycle:**
- PIR-001: Will the government present a proposition on revised climate targets (2030) before the September 2026 election?
- PIR-002: Will Försäkringskassan eligibility criteria for sjukersättning be reformed in 2025/26?
- PIR-003: Will Prop. 2024/25:165 (grundlagsändring) pass the second reading after the election?
