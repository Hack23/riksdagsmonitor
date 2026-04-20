# IMF Data Integration

> **Purpose**: IMF public macro/fiscal/monetary data as a **primary source**
> for Riksdagsmonitor article economic context, complementing (not
> replacing) the World Bank integration.
>
> **Effective**: 2026-04-20 (Economic Data Contract v2.0)

---

## Why IMF

World Bank WDI data is authoritative for governance, environment, and
long-horizon social indicators, but it **lags 12–24 months** for
macro/fiscal headline figures. Most series still showed 2023–2024
values in April 2026, and WB publishes no projections.

The IMF fills both gaps:

| Gap | IMF product | What it unlocks |
|---|---|---|
| Macro freshness | WEO (Apr/Oct) | 2025 final values + 2026 Q1 from the April 2026 WEO release instead of 2024 annuals |
| Projections | WEO + Fiscal Monitor (T+5) | Numeric forward-looking commentary in `week-ahead`, `month-ahead`, `weekly-review`, `monthly-review` |
| Fiscal granularity | GFS_COFOG | Committee-aligned spending decomposition (COFOG 02=FöU, 07=SoU, 09=UbU, 10=social protection) |
| Monetary / FX | IFS, MFS_IR | Policy rate series + SEK/EUR for monetary-policy coverage |
| Cross-country peer quality | Uniform SNA 2008 / GFSM 2014 | Nordic peer comparisons on a consistent methodology |

---

## Adoption strategy (hybrid)

- **Agentic workflows** (LLM-driven article authoring) → use the
  `imf` MCP server (`c-cf/imf-data-mcp`, stdio, Python/`uvx`) for
  discovery and fetch. This mirrors the pattern of `scb` and
  `riksdag-regering`.
- **Build-time scripts** → use `scripts/imf-client.ts` for
  deterministic TypeScript fetches. Primary transport is the IMF
  **Datamapper** JSON endpoint (WEO indicators, no auth). Targeted
  SDMX 3.0 is available via `ImfClient.sdmxFetch()` for IFS/BOP/FM.
- **World Bank** → kept for WGI governance, environment, and social
  residue. Do not replace WB calls that target these classes.
- **SCB** → unchanged; remains the Swedish primary source.

See the architecture decision record:
`docs/adr/0001-adopt-imf-data-alongside-world-bank.md`.

---

## Code surface

| File | Purpose |
|---|---|
| `scripts/imf-client.ts` | TypeScript REST client (Datamapper + SDMX 3.0 passthrough). 429/5xx back-off, projection detection. |
| `scripts/imf-codes.ts` | ISO-3 ↔ IMF AREA code mappings for IFS/GFS/BOP. Fail-loud on unknown codes. |
| `scripts/imf-context.ts` | Policy-area / committee → IMF WEO+FM indicator mapping. `imfCitation()` helper. |
| `analysis/economic-indicators-inventory.json` | v4.0 multi-provider inventory (IMF in-line; WB via reference). |

| MCP server | Transport | Tools |
|---|---|---|
| `imf` | stdio (Python/`uvx`, `c-cf/imf-data-mcp`) | `imf_list_databases`, `imf_search_databases`, `imf_get_parameter_defs`, `imf_get_parameter_codes`, `imf_fetch_data` |

---

## Rate-limit discipline

IMF advertises **~10 req / 5 s**. The client and agentic workflows MUST:

- Batch multi-country queries in a single `imf_fetch_data` call.
- Sleep 1 s between `imf_fetch_data` calls.
- Retry 3× on HTTP 429 with 1 s → 2 s → 4 s back-off.
- Cache raw responses under `analysis/data/imf/$(date +%Y)/$indicator-$country.json`.
- Pre-warm 1 request at workflow start.

---

## Related documents

- `analysis/imf/indicator-policy-mapping.md` — which IMF indicators feed which committees
- `analysis/imf/use-cases.md` — canonical article examples
- `.github/aw/ECONOMIC_DATA_CONTRACT.md` — v2.0 contract (data artefact shape, validator gates)
- `.github/aw/SHARED_PROMPT_PATTERNS.md` — "Economic Indicator Reference"
- `docs/adr/0001-adopt-imf-data-alongside-world-bank.md` — architecture decision
