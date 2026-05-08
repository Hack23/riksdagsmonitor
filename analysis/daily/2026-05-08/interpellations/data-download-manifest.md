# Data Download Manifest — 2026-05-08

**Generated**: 2026-05-08 07:03 UTC
**Data Sources**: get_interpellationer, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 5
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references,
> and synthesis) MUST be performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 0 documents
- **motions**: 0 documents
- **committeeReports**: 0 documents
- **votes**: 0 documents
- **speeches**: 0 documents
- **questions**: 0 documents
- **interpellations**: 20 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.
Data sourced from 2026-05-07 via lookback fallback — check freshness indicators.

## Prior-Voteringar Enrichment

**Method**: search_voteringar + get_voting_group for committees AU, UU, KrU, TU (rm 2025/26)

### AU10 (Arbetsmarknadsutskottet bet AU10, 2026-03-04) — relevant to HD10475
- Voting group query: no individual vote data available (data not yet synced for grouping)
- Raw voteringar found: votes recorded under AU10 in rm 2025/26; S, SD, C, M documented voting "Ja" on sakfrågan punkt 3
- **Relevance**: AU10 is the home committee for HD10475 (ILO/labour rights)
- **Note**: Party discipline appears maintained across bloc lines for AU10 — no dissent recorded in available data

### UU (Utrikesutskottet) — relevant to HD10476, HD10478
- No targeted voteringar search yielded UU-specific voting records for Gaza-related issues in 2025/26
- **Relevance**: UU is the home committee for both Gaza interpellations
- **Note**: Gaza-related motions in UU have historically been voted along bloc lines in 2023/24 and 2024/25

### KrU (Kulturutskottet) — relevant to HD10479
- No targeted voteringar for minority policy in KrU for 2025/26 available
- **Relevance**: KrU is the home committee for HD10479 (minority policy/MUCF)

### TU/CU (Transport/Civil affairs) — relevant to HD10477
- No targeted voteringar for Postnord/rural service in 2025/26 available
- **Relevance**: Civilminister Slottner's committee portfolio

## Statskontoret Cross-Source Enrichment

### HD10477 (Postnord/state-owned enterprise, regional service) — TRIGGERED
- **Statskontoret trigger condition**: Postnord is a state-owned enterprise subject to government ownership guidelines (Statens ägarpolicy 2020)
- **Relevant framework**: Statens ägarpolicy requires government-owned enterprises to report on sustainability, social obligations, and regional equity
- **Applicable principle**: Government can issue formal ägaranvisning (ownership instruction) to direct Postnord's service point decisions
- **Assessment**: Government has both the legal tool and the accountability obligation to act on HD10477

### HD10479 (MUCF as named government agency) — TRIGGERED
- **Statskontoret trigger condition**: MUCF is a named government agency (myndighet) subject to government instruction
- **Relevant framework**: Government can issue new annual instruction (regleringsbrev) to MUCF specifying grant priorities for national minority organisations
- **Assessment**: The MUCF uppföljningsrapport findings can be addressed through regleringsbrev revision; the government has direct authority to require MUCF to restore minority-organisation funding

## Lagrådet Tracking

Interpellations are accountability instruments directed at existing policy — they do not trigger Lagrådet referral (which applies to legislative proposals/propositioner). **N/A for all five interpellations in this batch.**

## PIR Carry-Forward

No prior PIR-status.json found for interpellations in prior analysis cycles. Starting fresh PIR register.

**Current PIR register**: See [pir-status.json](pir-status.json)

PIR-1 (flotilla protest) — OPEN  
PIR-2 (Postnord continuity) — OPEN  
PIR-3 (MUCF funding restoration) — OPEN  
PIR-4 (ILO positions) — OPEN  
PIR-5 (Gaza aid commitments) — OPEN