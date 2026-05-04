# Methodology Notes — Realtime Pulse 2026-05-04

**Pass**: 2 (improved)

---

## Workflow Type

**news-realtime-monitor** = Tier-C aggregation workflow. This workflow does NOT have designated specific document types (unlike propositions, motions, or interpellations workflows). Instead, it:
1. Monitors all document types for today's activity
2. Synthesises cross-type signals
3. Carries forward open PIRs from prior realtime-pulse runs
4. Produces a living "intelligence picture" of parliamentary activity

## Analysis Methodology

### Data Collection
- Primary: riksdag-regering MCP (32 tools) for Riksdag documents
- Window: 2026-04-28 to 2026-05-04 for committee reports; 2026-05-04 for interpellations
- Sibling cross-reading: propositions/, motions/, interpellations/, year-ahead/ synthesis-summary.md files

### Analysis Framework
- **STRIDE-lite threat assessment** applied to political risk identification
- **ACH (Analysis of Competing Hypotheses)** applied informally to scenario analysis
- **WEP (Würdigkeits-Eintrits-Produkt)** as probability × impact product for risk/scenario scoring
- **PIR (Priority Intelligence Requirement)** roll-forward from 2026-05-01/realtime-pulse

### Horizon Stratification
Following the standard realtime-pulse horizon model:
- T+72h: Immediate news cycle (2026-05-07)
- T+7d: Weekly political cycle (2026-05-11)
- T+30d: Monthly parliamentary cycle (2026-06-03)
- T+90d: Pre-election period (2026-08-02)
- T+132d: Election (2026-09-13)

### AI-FIRST Quality Protocol
- **Pass 1**: Created all 23 artifacts based on document download and prior context
- **Pass 2**: Read back all artifacts; improved specificity, WEP language, cross-references, and economic provenance blocks
- Both passes completed within single workflow run

## Limitations

1. No same-day voting data (AU10 most recent = March 2026)
2. Anföranden text unavailable (Riksdag API returns empty speech texts)
3. KU39 and FiU49 not yet published — intelligence based on title/schedule only
4. No polling data today (PIR-RT-003 open)
5. Lagrådet yttranden for migration propositions not yet published (PIR-RT-001 open)

## IMF Economic Data Contract Compliance

Following ECONOMIC_DATA_CONTRACT.md v3.0:
- Economic context uses IMF WEO April 2026 (provider=imf)
- Swedish GDP, debt, inflation from WEO, not World Bank
- All economic claims include economicProvenance blocks
- Vintage is April 2026 — within 6-month threshold, no annotation required
- SCB: not queried today (Swedish monthly data not relevant to this document batch)
- World Bank: not used (no WGI governance claims in today's analysis)
