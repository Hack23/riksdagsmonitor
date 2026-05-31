# Reference & Analysis Quality — Tidö Mandate Cycle — Current

Source-quality and analytic-rigour audit for the Tier-C product. Supplementary (comprehensive-tier) artifact.

## Source inventory

| Source | Type | Access | Reliability |
|--------|------|--------|-------------|
| `riksdag-regering` MCP | Primary (parliamentary) | Live (`get_sync_status: live`) | A — authoritative |
| riksdagen.se / data.riksdagen.se | Primary | Live | A |
| regeringen.se | Primary (executive) | Live | A |
| IMF WEO (Apr-2026 vintage) | Secondary (macro) | **Cached — live degraded** | B — pinned vintage |
| SCB | Secondary (Swedish stats) | Referenced | A |
| statskontoret.se | Tertiary (oversight) | Referenced | B |

## Evidence discipline

- Every SWOT, significance and scenario claim is tied to a dok_id or primary-source URL.
- All WEP probability terms carry `[horizon:band]` tags.
- Every IMF citation carries a `T+N` projection stamp and names the Apr-2026 vintage (live IMF degraded — see `mcp-reliability-audit.md`).
- World Bank was **not** substituted for any GDP/debt/inflation figure (economic-data contract honoured).

## Analytic-rigour self-assessment (ICD 203)

| Criterion | Rating | Note |
|-----------|--------|------|
| Sourcing transparency | Strong | dok_id/URL on every claim |
| Uncertainty expression | Strong | WEP + confidence labels throughout |
| Alternatives considered | Strong | `devils-advocate.md`, `wildcards-blackswans.md` |
| Distinguishing analysis from fact | Strong | projections vintage-stamped |
| Logical argumentation | Strong | scenario tree + indicators |

## Known limitations

1. IMF figures are a pinned vintage, not live — flagged inline throughout.
2. Forward dates are statutory-anchored (calendar API degraded).
3. Post-election seat ranges are analytic, not poll-derived.
4. No quarter-ahead predecessor exists (gap-annotated in `cross-reference-map.md`).

**Overall quality grade**: B+ — strong primary sourcing and rigour; macro layer constrained by IMF live degradation and pinned to a disclosed vintage.

## Pass-2 refinement

Pass-2 specifies what would raise the grade to A: (1) a live IMF fetch confirming the WEO Apr-2026 figures within the 6-month window; (2) a recovered calendar feed converting statutory-anchored dates into confirmed sitting dates; and (3) an existing quarter-ahead predecessor closing the 90-day cross-horizon gap. None were available this run; all three are disclosed rather than papered over, which is why the grade is a defensible B+ rather than an inflated A on degraded inputs.
