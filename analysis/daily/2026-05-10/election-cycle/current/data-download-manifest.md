---
title: "Data Download Manifest — Cycle Analysis Sources"
date: 2026-05-10
subfolder: election-cycle/current
classification: PUBLIC
---

# Data Download Manifest — Cycle Analysis Sources

## IMF (Primary Economic Canon)

| Dataflow | Indicator | Country | Vintage | T+N | Path |
|----------|-----------|---------|---------|-----|------|
| WEO | NGDP_RPCH | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| WEO | NGDPDPC | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| WEO | GGXWDG_NGDP | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| WEO | GGXCNL_NGDP | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| WEO | LUR | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| WEO | PCPIPCH | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| FM | (fiscal-monitor projections) | SWE | Apr-2026 | T+0..T+5 | data/imf-context.json |
| (compare) | GGXWDG_NGDP | SWE/DNK/NOR/FIN/DEU | Apr-2026 | T+0 | inline reasoning |

All economic claims in this folder carry `economicProvenance: provider=imf` and inline T+N projection stamp per [`ECONOMIC_DATA_CONTRACT.md`](../../../../.github/aw/ECONOMIC_DATA_CONTRACT.md) v3.1.

## SCB (Swedish-Specific Ground Truth)

- Party Sympathies (PSU) — Q1-2026 series
- CPIF/CPI monthly 2022–2026
- Labour Force Survey monthly 2022–2026
- Population register snapshots 2022/2026 (cycle-bounds)

## Riksdag MCP (Primary Political)

- Betänkanden 2022/23–2025/26 (committee reports)
- Propositioner Y1–Y4 (government bills)
- Voteringar Y1–Y4 (voting records)
- Ledamöter snapshot 2022 + 2026 (MP rolls)
- Anföranden — selected debates around top-DIW events

## Regering MCP / g0v.se

- SOU 2022–2026 (state inquiries)
- Ds 2022–2026 (departmental memos)
- Pressmeddelanden — coalition milestones

## Institutional Open Reports (B2 admiralty)

- Statskontoret — mandate-end agency capacity review 2025
- Riksrevisionen — selected efficiency audits 2023–2026
- MSB — national risk assessment 2024 + 2026
- Lagrådet — annual reports 2022–2025
- SOM-institutet — annual surveys 2022–2025
- Reuters Institute — Digital News Report 2022–2026

## World Bank (Non-Economic Residue Only)

- WGI Sweden 2022–2024 (CC.EST, RL.EST, VA.EST, GE.EST, RQ.EST, PV.EST)

## Cache & Vintage Discipline

- IMF data: `data/imf-context.json` refreshed 2026-05-10 (pre-warm `status: ok`).
- All vintage > 6 months annotated as historical in citations.
- Re-fetch policy: pre-warm gate before each workflow run.

## Sources

- IMF API api.imf.org, datamapper.imf.org [A1]
- SCB API api.scb.se [A1]
- Riksdag MCP riksdag-regering-ai.onrender.com [A1]
- World Bank API api.worldbank.org [A2]
- Hack23 imf-fetch script [B2]
