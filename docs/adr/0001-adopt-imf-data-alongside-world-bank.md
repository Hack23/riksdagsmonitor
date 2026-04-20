# ADR 0001 — Adopt IMF data alongside World Bank

- **Status**: Accepted
- **Date**: 2026-04-20
- **Authors**: Hack23 AB — Riksdagsmonitor maintainers
- **Deciders**: CEO / CISO (per `Change_Management.md` Normal change)

## Context

Riksdagsmonitor's article pipeline renders an economic-context
dashboard on every news article using **World Bank WDI** (via
`worldbank-mcp@1.0.1`) and **SCB** (via `pxweb-mcp`). Economic Data
Contract v1.0 (effective 2026-04-18) binds the validator and schema
to these two providers.

Two quality defects surfaced during the April 2026 review:

1. **Freshness lag**: most WB macro series (GDP growth, CPI,
   unemployment, debt, deficit) last reported values for 2023–2024.
   Every daily article anchors commentary on figures that are
   12–24 months old.
2. **No projections**: WB publishes no forward-looking data. The four
   "look-ahead" article types (`week-ahead`, `month-ahead`,
   `weekly-review`, `monthly-review`) consequently produce weak
   forward-looking commentary — they describe the future but can only
   cite historical WB values.

Three IMF alternatives were evaluated:

| Option | Protocol | Coverage | Freshness |
|---|---|---|---|
| **c-cf/imf-data-mcp** | Python MCP over SDMX 3.0 | ~155 databases incl. WEO/IFS/BOP/GFS/FM/MFS/DOTS/PCPS | WEO Apr-2026 release; projections to 2031 |
| **IMF Datamapper JSON** | Plain REST (`www.imf.org/external/datamapper/api/v1`) | WEO subset (NGDP_RPCH, PCPIPCH, LUR, GGXWDG_NGDP, BCA_NGDPD, …) | Same Apr/Oct cycle |
| **IMF SDMX 3.0 direct** | SDMX REST (`api.imf.org/external/sdmx/3.0`) | Full IMF catalogue | Per-dataset cadence |

## Decision

**Adopt a hybrid IMF stack** that complements — not replaces — World
Bank:

1. **Agentic workflows** (LLM article authoring) use the
   `c-cf/imf-data-mcp` MCP server (stdio, Python/`uvx`) for discovery
   and fetch. Mirrors the pattern of `scb` and `riksdag-regering`.
2. **Build-time scripts** use a native TypeScript client
   (`scripts/imf-client.ts`) against IMF Datamapper for WEO and SDMX
   3.0 for IFS/BOP/FM/GFS. No Python dependency at build time.
3. **World Bank** is kept for WGI governance (source=75), environment,
   and long-horizon social/education residue where IMF does not
   publish.
4. **SCB** is unchanged and remains the Swedish primary source.

Schema v2 (additive) adds `source.imf[]`,
`dataPoints[].provider`, `dataPoints[].projection`, and
`dataPoints[].projectionVintage`. v1 artefacts remain valid through
the 2026-04-20 → 2026-05-31 grace window.

## Consequences

### Positive

- **Freshness jumps ≈ 18 months**: daily articles can cite 2025 final
  values and 2026 Q1 instead of 2024 annuals.
- **Projections unlocked**: look-ahead article types gain credible
  numeric forward commentary to T+5 (2031 from the Apr-2026 vintage).
- **Fiscal granularity** via GFS_COFOG aligned to committee remits
  (02=FöU, 07=SoU, 09=UbU, 10=social protection).
- **Monetary & FX coverage** (IFS/MFS_IR) absent from WB.
- **Cross-country comparability** improved — SNA 2008 / GFSM 2014
  uniformity reduces the "WB northern-Europe bias" criticism.
- **Editorial neutrality**: IMF is a multilateral primary source.

### Negative / risks

- **New Python/`uvx` runtime** in the agentic sandbox (supply-chain
  surface). Mitigated by pinning to a commit SHA, mirrored wheels,
  SBOM entry, firewall allowlist scoped to `pypi.org` +
  `files.pythonhosted.org`.
- **IMF rate limit (~10 req / 5 s)** requires batching and back-off
  discipline (implemented in `imf-client.ts` and documented in the
  Economic Data Contract v2.0).
- **WEO cadence gap** (Apr/Oct only) — mitigated by using higher-
  frequency IMF datasets (IFS, FM interim, DOTS) for monthly article
  types and by tagging `projectionVintage` so stale vintages surface
  in audit.
- **Schema v2 cutover**: 30-day grace window keeps v1 artefacts valid;
  daily audit gates the cutover on zero P1 violations for two
  consecutive cycles.

## Compliance

- **ISO 27001:2022** — A.5.23 (cloud services), A.8.4 (source-code
  access), A.8.30 (outsourced development)
- **NIST CSF 2.0** — ID.SC-01/03, PR.IP-12 (supply-chain due diligence)
- **CIS Controls v8.1** — 15.1 (service-provider inventory), 16.4
  (default-deny), 18.2 (application firewall)
- **GDPR** — not engaged: IMF data is fully public aggregate macro;
  no personal data; Art 9 not triggered.
- **Threat Model** — STRIDE update captures Tampering/Spoofing of IMF
  responses (mitigated by cached JSON hashing) and DoS via IMF rate
  limits (mitigated by batching + caching).
- **Change Management** — Normal change per `Change_Management.md`;
  CEO approval required for MCP config (`.github/copilot-mcp.json`,
  `copilot-setup-steps.yml`).

## Alternatives considered (and rejected)

- **Replace WB entirely with IMF** — rejected. WGI governance,
  environment, and long-horizon social/education are WB exclusives;
  losing them would regress `KU`, `MJU`, `UbU`, `SoU` coverage.
- **IMF SDMX 3.0 only (no MCP)** — rejected for the agentic path
  because SDMX payloads are complex and agents benefit from the
  four-call discovery pattern in `imf-data-mcp`. Kept as the
  transport for build-time `imf-client.ts`.
- **Wait for WB freshness to improve** — rejected. WB's WDI cadence
  is not scheduled to change; the lag is structural.

## Follow-ups

- Phase 5 (not in the initial PR): retire WB indicators fully
  superseded by IMF (`supersededBy: imf:*` flag in inventory) after a
  180-day dual-source audit window.
- Regenerate `.lock.yml` files via `gh aw compile` in CI once the
  `news-*.md` frontmatter updates land.
- Add `Security_Metrics.md` KPIs: IMF data freshness median age
  (target ≤ 90 days); % of look-ahead articles with IMF projection
  citation (target ≥ 80 %).
