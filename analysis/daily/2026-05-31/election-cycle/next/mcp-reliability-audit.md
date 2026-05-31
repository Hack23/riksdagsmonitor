# MCP Reliability Audit — Post-2026 Mandate — Next

Runtime reliability record for all data sources used in this product. Supplementary (comprehensive-tier) artifact.

## Source health at runtime

| Source | Status | Evidence | Mitigation |
|--------|--------|----------|------------|
| `riksdag-regering` MCP | ✅ Live | `get_sync_status: live` | None needed — primary data fully available |
| Parliamentary docs (25 fetched) | ✅ OK | date-root downloads | 10 selected for Family E |
| IMF live fetch | ❌ **Degraded** | `imf-fetch.ts` live transport down | Pinned WEO-2026-04 vintage (`data/imf-context.json`, vintageAgeMonths=1) |
| Calendar API | ⚠️ **Degraded** | `data/runtime/calendar-status.json` status:error | Forward dates statutory-anchored |
| SCB | ✅ Referenced | available | used as Swedish ground truth |
| World Bank | ⚪ Not used for economic | by contract | IMF is economic canon |

## IMF degradation detail

The live IMF SDMX/Datamapper transport was unavailable during this run. Per the economic-data contract, GDP/debt/inflation figures were **not** substituted with World Bank data. Instead, all macro figures are pinned to the **WEO April-2026 vintage** (age 1 month, within the 6-month annotation threshold) and every citation carries a `T+N` projection stamp. Figures used: SWE growth ~2.1% `T+1` / ~2.4% `T+2`, gross debt ~34% GDP `T+1`, inflation ~2.0%.

## Calendar degradation detail

The calendar API returned an error (`calendar-status.json`). Forward-indicator dates in `forward-indicators.md` are anchored on the statutory Riksmöte rhythm and the fixed 2026-09-13 election date rather than live calendar entries. This is disclosed inline.

## Impact assessment

| Capability | Impact | Severity |
|------------|--------|----------|
| Parliamentary analysis | None | — |
| Macro contextualisation | Vintage-pinned, disclosed | Low |
| Forward scheduling | Statutory-anchored, disclosed | Low |

## Disposition

Product integrity **maintained**: the binding primary source (parliamentary MCP) was fully live; degraded secondary sources were mitigated with disclosed, contract-compliant fallbacks. No fabricated live figures.

**Confidence**: HIGH — degradations are documented with concrete evidence files and consistent mitigation.

## Pass-2 refinement

Pass-2 records the contract-compliance test explicitly: at no point was World Bank substituted for an IMF economic series. Where live IMF was unavailable, the choice was vintage-pin-with-disclosure, never source-swap — preserving the economic-data canon (IMF primary, WB governance/environment residue only). This is the auditable difference between a degraded-but-honest macro layer and a silently-substituted one.
