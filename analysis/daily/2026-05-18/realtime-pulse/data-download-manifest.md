# Data Download Manifest — Realtime Pulse 18 May 2026

**Date**: 2026-05-18 | **Subfolder**: realtime-pulse | **Run type**: Tier-C realtime aggregation

## Downloads Summary

| Type | Count | Source |
|------|-------|--------|
| Skriftliga frågor | 8 | riksdag-regering MCP (HD11814, 11813, 11812, 11811, 11810, 11809, 11808, 11807) |
| Interpellationer | 7 | riksdag-regering MCP (HD10491-10494 + others) |
| Propositioner | 3 | riksdag-regering MCP (HD03250, HD03261, HD03267) |
| Anföranden | 30 | riksdag-regering MCP (sampled, energy interpellation debates) |
| Voteringar | 5 | riksdag-regering MCP (AU10 2026-03-04 and context) |
| Total | **53+** | (plus 210 from download script run at parent level) |

## Date-Filtered Documents (2026-05-18)

| dok_id | Title | Type |
|--------|-------|------|
| HD11814 | E4 Förbifart Skellefteå | Skriftlig fråga |

## Prior-Voteringar Enrichment

**Most recent voterings retrieved**: AU10 (2026-03-04). No same-day voterings available as Riksdag chamber scheduled but not yet concluded for 18 May 2026. Prior vote context used for coalition mathematics baseline:
- S+MP+V+C+L = current opposition alignment
- M+KD+SD = Tidö bloc
- Last contested vote: AU10 (arbetsmarknadsutskott — details not retrieved in this run)

## Statskontoret Cross-Source Enrichment

**Trigger documents**: HD03267 (Migrationsverket mandate), HD03261 (Skatteverket mandate)
**Statskontoret check**: Searched statskontoret.se — no specific evaluation reports found for these propositions as of 2026-05-18. Implementation-feasibility.md notes "no Statskontoret report directly applicable; general capacity constraints cited from agency annual reports."
**Recommendation**: Monitor Statskontoret evaluations for FY2026/27 for these agency mandates.

## Lagrådet Tracking

| Proposition | Lagrådet Status |
|-------------|----------------|
| HD03267 (security threats) | Referral expected; no yttrande published 2026-05-18 |
| HD03250 (state e-ID) | Standard digital-services proposition; Lagrådet review typical |
| HD03261 (Skatteverket) | Administrative adjustment; Lagrådet review standard |

**Note**: No confirmed Lagrådet referrals for today's propositions in public record as of run time.

## PIR Carry-Forward

| PIR | Status | Carry-Forward Basis |
|-----|--------|---------------------|
| PIR-1: Tidö energy coherence | **ACTIVE** — ongoing (Interp:448, :453 confirm) | Carry to next weekly-review |
| PIR-2: Russian threat posture | **ESCALATED** — Duma law 13 May 2026 | Promote to L2+ Priority for security-briefing |
| PIR-3: Northern Sweden infrastructure | **ACTIVE** — E4 PPP confirms gap | Monitor KD response schedule |

## IMF Economic Context

- **Source**: IMF WEO April 2026 (prewarm, vintage 1 month)
- **Sweden GDP growth 2026**: ~2.0% (NGDP_RPCH)
- **Fiscal surplus**: ~0.5% GDP
- **Status**: `<stale-vintage-ok vintage="WEO-2026-04" vintage-age-months="1"/>` — within acceptable range
- **Live fetch**: Failed (3 retries); prewarm context used
