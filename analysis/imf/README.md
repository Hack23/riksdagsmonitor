# IMF Data Integration

> **Purpose**: IMF public macro/fiscal/monetary/external data as the **primary economic-data source** for Riksdagsmonitor article workflows. World Bank is retained for **non-economic** classes only (governance WGI, environment, social/education residue). SCB is unchanged as Swedish-specific ground truth.
>
> **Effective**: 2026-04-24 (Economic Data Contract v2.1 · IMF-first integration)
>
> **Authoritative companions in this folder**:
> - [`indicators-inventory.json`](indicators-inventory.json) — machine-readable catalogue (24 indicators, 10 dataflows)
> - [`data-dictionary.md`](data-dictionary.md) — dataflow / dimension / vintage / quirk reference
> - [`agentic-integration.md`](agentic-integration.md) — step-by-step integration playbook for workflows
> - [`indicator-policy-mapping.md`](indicator-policy-mapping.md) — committee → indicator matrix
> - [`use-cases.md`](use-cases.md) — canonical article examples

---

## 1 · Why IMF is primary

World Bank WDI data lags **12–24 months** for macro / fiscal / monetary headline figures and publishes **no projections**. Through April 2026, most WB series still showed 2023–2024 values. This is a deal-breaker for look-ahead article types (`week-ahead`, `month-ahead`, `weekly-review`, `monthly-review`) and for committee-level fiscal commentary.

The IMF closes both gaps:

| Gap | IMF product | What it unlocks |
|---|---|---|
| Macro freshness | **WEO** (Apr/Oct) | 2025 final + 2026–2031 projections on day-1 of each flagship |
| Fiscal freshness & methodology | **Fiscal Monitor** (Apr/Oct) | EDP/GFSM 2014-consistent debt, primary balance, cyclically-adjusted balance |
| Projections | **WEO + FM** (T+5) | Numeric forward-looking commentary with vintage-stamped projections |
| Committee-aligned spending | **GFS_COFOG** (annual, T+1) | Function-level decomposition — 02 defence (FöU), 07 health (SoU), 09 education (UbU), 10 social protection (SfU) |
| Monthly inflation & rates | **IFS**, **MFS_IR** | High-frequency monetary-policy coverage |
| Bilateral trade flows | **DOTS** (monthly) | Swedish exports/imports by partner country |
| Commodity benchmarks | **PCPS** (monthly) | Inflation-drivers commentary |
| Exchange rates | **ER** (daily) | SEK/EUR, SEK/USD, REER |
| Cross-country peer consistency | Uniform SNA 2008 / GFSM 2014 / BPM6 | Nordic peer comparisons on a single methodology |

---

## 2 · Provider decision matrix

Short version (see `agentic-integration.md` § 1 for the long table).

```
┌─────────────────────────────────────────────────────────────┐
│ Macro  · Fiscal  · Monetary  · External  · Trade  →  IMF    │
│ Governance (WGI)  · Environment  · Social residue  →  WB    │
│ Swedish-specific monthly / regional / budget exec →  SCB    │
└─────────────────────────────────────────────────────────────┘
```

Rule of thumb: if a journalist would quote "the IMF projects…" in a Financial Times headline, the data comes from IMF. If "the World Bank estimates quality of governance at…", from WB. If "SCB's December AKU reports…", from SCB.

---

## 3 · Adoption strategy (hybrid, no MCP)

- **Agentic workflows** (LLM-driven article authoring) invoke the `scripts/imf-fetch.ts` CLI via the `bash` tool (`tsx scripts/imf-fetch.ts weo|compare|sdmx|list-indicators …`). The CLI is a thin wrapper over `scripts/imf-client.ts` — a pure-TypeScript client — so there is **no Python / `uvx` runtime** and **no third-party MCP server** on the critical path.
- **Build-time scripts** import `scripts/imf-client.ts` directly. Primary transport is the IMF **Datamapper** JSON endpoint (WEO + FM, no auth); targeted SDMX 3.0 (the only IMF SDMX surface this repo targets) is available via `ImfClient.sdmxFetch()` for IFS / BOP / GFS_COFOG / DOTS / PCPS / ER / MFS_IR. Every SDMX request requires the Azure APIM `Ocp-Apim-Subscription-Key` header (set via the `IMF_SDMX_SUBSCRIPTION_KEY` env var); the Datamapper transport remains unauthenticated.
- **World Bank** (`worldbank-mcp@1.0.1`) remains the MCP server for WGI governance, environment, and social residue — keep WB calls that target these classes. Economic data routes through `scripts/imf-fetch.ts`.
- **SCB** (`pxweb-mcp`) is unchanged; remains the Swedish primary source for monthly inflation (KPIF), AKU labour, regional data, and budget execution.

See ADR: [`docs/adr/0001-adopt-imf-data-alongside-world-bank.md`](../../docs/adr/0001-adopt-imf-data-alongside-world-bank.md).

---

## 4 · Code surface

| File | Purpose |
|---|---|
| [`scripts/imf-client.ts`](../../scripts/imf-client.ts) | TypeScript REST client (Datamapper + SDMX 3.0 passthrough). Default retry uses 1 s → 2 s back-off on retryable 429/5xx, network, and abort errors; 4 s+ back-off applies only when `maxRetries` is increased. Also exports pure helpers `calculateRetryDelay()` and `parseDatamapperValues()` for unit-testing without HTTP stubs, and `getWeoIndicatorsBatch()` for multi-indicator same-country fetch with fail-soft isolation. |
| [`scripts/imf-fetch.ts`](../../scripts/imf-fetch.ts) | Thin CLI wrapper over `imf-client.ts` (commands: `weo`, `compare`, `sdmx`, `list-indicators`). Used by agentic workflows via the `bash` tool. |
| [`scripts/imf-codes.ts`](../../scripts/imf-codes.ts) | ISO-3 ↔ IMF AREA code mappings for IFS/GFS/BOP. Fail-loud on unknown codes (prevents silent data loss). Exports `listKnownIso3Codes()` for programmatic peer-set discovery. |
| [`scripts/imf-context.ts`](../../scripts/imf-context.ts) | Policy-area / committee → IMF indicator mapping. Exports `imfCitation()`, `findImfIndicatorByCode()`, `findImfIndicatorByCitation()`, `getImfDatabasesInUse()`, `getImfCommitteeMatrix()`, `listImfCitations()` and the curated `IMF_INDICATORS` catalogue spanning WEO, FM, GFS_COFOG, MFS_IR, DOTS, ER, and PCPS. |
| [`analysis/imf/indicators-inventory.json`](indicators-inventory.json) | v1.0 comprehensive IMF inventory (24+ indicators, 10 dataflows) — authoritative machine catalogue. |
| [`analysis/economic-indicators-inventory.json`](../economic-indicators-inventory.json) | v4.1 multi-provider inventory (IMF-first; WB by reference; SCB via `scripts/scb-context.ts`). |

No MCP server is required for IMF — access is part of the repository's npm SBOM, and the only firewall egress needed is to `data.imf.org`, `api.imf.org`, and `www.imf.org`.

### 4.1 · Authentication & repository secrets

| Repository secret | Status | Consumed by | Purpose |
|---|---|---|---|
| `IMF_SDMX_SUBSCRIPTION_KEY` | **Required** (primary) | Every `news-*.md` workflow → `news-prewarm` action → `IMF_SDMX_SUBSCRIPTION_KEY` env var → `scripts/imf-client.ts#sdmxFetch` `Ocp-Apim-Subscription-Key` header | Authenticates every SDMX 3.0 `/data/...` call (the only IMF SDMX surface used). Without it the IMF Azure APIM gateway returns HTTP 404 (masked) on every dataflow request and the connectivity probe records `status: degraded` with reason `sdmx-subscription-key-not-configured`. |
| `IMF_SDMX_SUBSCRIPTION_KEY_SECONDARY` | Optional (rotation) | **Not consumed by code** — stored as a hot spare so operators can swap primary↔secondary without downtime when the IMF issues a new subscription key. | Mirrors the IMF Data SDMX API "primary / secondary key" subscription product. See `analysis/imf/agentic-integration.md` §"Pre-warm gate" → "Key rotation" for the rotation playbook. |

The Datamapper transport (`getWeoIndicator`, `compareCountriesWeo`, `getWeoIndicatorsBatch`) is unauthenticated. Both keys are obtained from <https://datamarketplace.imf.org/> (formerly <https://data.imf.org/> developer portal) — one subscription per repository.

### 4.2 · TypeScript API quick reference

The snippet below assumes it is copied into a TypeScript file at the
repository root. From this README's directory (`analysis/imf/`), use
`../../scripts/...` instead.

```ts
import {
  ImfClient,
  getDefaultImfClient,
  calculateRetryDelay,
  parseDatamapperValues,
  IMF_WEO_INDICATORS,
  IMF_FM_INDICATORS,
} from './scripts/imf-client.js';
import {
  findImfIndicatorByCode,
  findImfIndicatorByCitation,
  findImfIndicatorsForCommittee,
  getImfCommitteeMatrix,
  getImfDatabasesInUse,
  listImfCitations,
  imfCitation,
  IMF_NORDIC_PEERS,
} from './scripts/imf-context.js';
import { listKnownIso3Codes, toImfAreaCode } from './scripts/imf-codes.js';

// Single-indicator series (Datamapper)
const series = await getDefaultImfClient().getWeoIndicator('SWE', 'NGDP_RPCH', 10);

// Multi-indicator fan-out for one country (batched, fail-soft)
const panel = await getDefaultImfClient().getWeoIndicatorsBatch(
  'SWE',
  ['NGDP_RPCH', 'PCPIPCH', 'LUR', 'GGXWDG_NGDP', 'BCA_NGDPD'],
);

// Committee-aligned indicator discovery (returns `{database, indicatorId, ...}` records)
const fiu = findImfIndicatorsForCommittee('FiU');       // [{ database: 'WEO', indicatorId: 'NGDP_RPCH', ... }, ...]
const citations = getImfCommitteeMatrix().get('FIU');   // ['WEO:NGDP_RPCH', 'WEO:PCPIPCH', ...]

// Citation round-trip
const hit = findImfIndicatorByCitation('WEO:NGDP_RPCH'); // ImfIndicatorContext | undefined
```

---

## 5 · Dataflows at a glance

| Code | Full name | Frequency | Projections | Primary use |
|------|-----------|-----------|-------------|-------------|
| **WEO** | World Economic Outlook | Annual | T+5 | All macro/fiscal/external headlines |
| **FM** | Fiscal Monitor | Annual | T+5 | Cyclically-adjusted balance, primary balance, DSA |
| **IFS** | International Financial Statistics | Monthly | — | High-frequency CPI, interest rates |
| **BOP / BOP_AGG** | Balance of Payments | Quarterly | — | Deeper external-sector detail (BPM6) |
| **GFS_COFOG** | Government Finance Statistics by Function | Annual (T+1) | — | Committee-aligned spending decomposition (02/07/09/10) |
| **MFS_IR** | Monetary & Financial Statistics — Interest Rates | Monthly | — | Riksbankens styrränta, interbank |
| **DOTS** | Direction of Trade Statistics | Monthly | — | Bilateral trade flows |
| **PCPS** | Primary Commodity Prices | Monthly | — | Inflation drivers, MJU energy |
| **ER** | Exchange Rates | Daily | — | SEK/USD, SEK/EUR, REER |

Full details: [`data-dictionary.md`](data-dictionary.md).

---

## 6 · Rate-limit discipline

IMF advertises **~10 req / 5 s**. The client and agentic workflows MUST:

- Prefer the `compare` subcommand (one batched Datamapper call across several countries) or a single `weo` call returning a full series.
- `sleep 1` between separate `imf-fetch.ts` invocations.
- Rely on the client's built-in retry on HTTP 429 / 5xx: the default back-off sleeps 1s→2s, and 4s+ applies only when `maxRetries` is increased.
- Cache raw responses under `analysis/data/imf/{indicator}/{country}.json` via the `--persist` flag (or `persistIMFData()` for programmatic use).
- Pre-warm 1 request at workflow start.
- Target **≤ 10 IMF calls per article**. > 15 is a workflow-design smell.

---

## 7 · Vintage discipline

Every projection value is stamped with a **vintage tag** — the release cycle that produced it.

- Current: **`WEO-2026-04`** (April 2026 flagship, valid until October 2026 ships).
- WEO release **cadence is twice a year — April and October** ([IMF Data Explorer · WEO 9.0.0](https://data.imf.org/en/Data-Explorer?datasetUrn=IMF.RES:WEO(9.0.0))). Inter-cycle data does not change; only the projection vector revises on each flagship.
- Commentary citation format: `(WEO Apr-2026, GGXWDG_NGDP)` — **mandatory** for any projection quote.
- Stale-vintage threshold: 6 months. Older citations trigger a warning annotation in `methodology-reflection.md`.
- Cut-over checklist on each new flagship (April / October):
  1. `DEFAULT_WEO_VINTAGE` in [`scripts/imf-client.ts`](../../scripts/imf-client.ts).
  2. `vintageDiscipline.current` in [`indicators-inventory.json`](indicators-inventory.json).
  3. Banner in this README.
  4. Release calendar row in [`data-dictionary.md`](data-dictionary.md) § 4.

Ship all four in **one PR** titled `chore(imf): cut over to WEO-YYYY-MM vintage`.

---

## 7a · WEO transport split — Datamapper vs SDMX 9.0.0

The WEO universe is reachable via two transports with very different surfaces:

| Transport | URL pattern | Indicators | Auth | Use case |
|-----------|-------------|------------|------|----------|
| **Datamapper** (simple JSON) | `/external/datamapper/api/v1/{code}/{ISO3}` | **15 WEO codes** (the headline subset) | None | Default for fast historical+projection pulls |
| **SDMX 3.0** (`IMF.RES,WEO,9.0.0`) | `/external/sdmx/3.0/data/IMF.RES,WEO,9.0.0/A.{ISO3}.{code}` | **Full WEO catalogue** (all ~45 series, all countries) | `IMF_SDMX_SUBSCRIPTION_KEY` (Azure APIM `Ocp-Apim-Subscription-Key` header) | Codes outside the Datamapper subset, or when historical depth back to 1980 is needed |

The 9 codes in [`scripts/imf-client.ts`](../../scripts/imf-client.ts) `IMF_WEO_DATAMAPPER_AVAILABLE` (`NGDP_RPCH`, `NGDPD`, `NGDPDPC`, `PCPIPCH`, `LUR`, `GGXWDG_NGDP`, `GGXCNL_NGDP`, `BCA_NGDPD`, `LP`) are reachable through `getWeoIndicator()`. The 4 codes in `IMF_WEO_SDMX_ONLY` (`GGR_NGDP`, `GGX_NGDP`, `GGXONLB_NGDP`, `TX_RPCH`) **only resolve via SDMX** — `getWeoIndicator()` raises `ImfWeoSdmxOnlyError` with the resolved SDMX path so callers can recover programmatically. The `imf-fetch weo` CLI auto-routes those codes to SDMX when `IMF_SDMX_SUBSCRIPTION_KEY` is set.

**Discover any indicator at runtime** (no SDMX key needed):

```bash
# Print the static partition + an SDMX path example
tsx scripts/imf-fetch.ts list-indicators

# Live-fetch the IMF Datamapper indicator catalog (~132 entries across
# 24 datasets: WEO, FM, FPP, IFS, BOP, DOTS, GFS_COFOG, MFS_IR, PCPS,
# ER, AFRREO, …). Filter by dataset to focus.
tsx scripts/imf-fetch.ts list-datamapper-indicators --dataset WEO
tsx scripts/imf-fetch.ts list-datamapper-indicators --dataset FM
```

The Datamapper FM dataset uses different suffix conventions from `IMF_FM_INDICATORS` (`GGR_G01_GDP_PT`, `G_X_G01_GDP_PT`, `GGXONLB_G01_GDP_PT`, `G_XWDG_G01_GDP_PT`). Use `list-datamapper-indicators --dataset FM` to enumerate them.

---

## 8 · Economic context — IMF dataflow + indicator reference

Use this table to pick the right IMF dataflow + indicator for each economic claim.

| Claim | IMF dataflow + indicator | Rationale |
|-------|---------------------------|-----------|
| Real GDP growth | `WEO:NGDP_RPCH` | Vintage-tagged WEO with T+5 projections |
| Nominal GDP (USD) | `WEO:NGDPD` | Same |
| GDP per capita | `WEO:NGDPDPC` | Same |
| Annual inflation | `WEO:PCPIPCH` | Same; `CPI:_T.IX` for monthly |
| Unemployment (annual) | `WEO:LUR` | SCB AKU as Swedish-specific ground truth |
| Gross public debt / GDP | `WEO:GGXWDG_NGDP` (or `FM:GGXWDG_NGDP`) | General-government (EDP) basis |
| Fiscal balance / GDP | `WEO:GGXCNL_NGDP` (or `FM:GGXCNLB_NGDP`) | GFSM 2014 |
| Expenditure / GDP | `WEO:GGX_NGDP` | Same |
| Revenue / GDP | `WEO:GGR_NGDP` | Same |
| Current account / GDP | `WEO:BCA_NGDPD` | Same |
| Export / Import volume growth | `WEO:TX_RPCH` / `WEO:TM_RPCH` | Growth basis cleaner for trend articles |

See the `providerSelection` section of [`indicators-inventory.json`](indicators-inventory.json) for the complete catalogue.

**World Bank** is the source for governance (WGI `source=75`), environment (CO₂, renewables, forest), education participation, defence historicals (`MS.MIL.XPND.GD.ZS`), and crime & justice (`VC.IHR.PSRC.P5`).

---

## 9 · Committee quick reference

| Committee | IMF role | Example `mustQuery` |
|-----------|----------|---------------------|
| **FiU** (Finance) | **IMF primary** | `WEO:NGDP_RPCH`, `WEO:PCPIPCH`, `WEO:GGXWDG_NGDP`, `WEO:GGXCNL_NGDP` |
| **SkU** (Taxation) | **IMF primary** | `WEO:GGR_NGDP`, `FM:GGXONLB_NGDP` |
| **AU** (Labour) | **IMF + SCB** | `WEO:LUR` + SCB AKU |
| **NU** (Business/Trade) | **IMF primary** | `WEO:BCA_NGDPD`, `WEO:TX_RPCH`, `IMTS:XG_FOB_USD` |
| **UU** (Foreign affairs) | **IMF primary** | `WEO:BCA_NGDPD`, `WEO:TX_RPCH` |
| **SoU** (Health) | **IMF + WB** | `GFS_COFOG:GF07_T`, `WEO:LP` + `worldBank:SH.XPD.CHEX.GD.ZS` |
| **SfU** (Social insurance) | **IMF + WB** | `GFS_COFOG:GF10_T`, `WEO:LP`, `WEO:LUR` |
| **FöU** (Defence) | **IMF + WB** | `GFS_COFOG:GF02_T` + `worldBank:MS.MIL.XPND.GD.ZS` |
| **MJU** (Environment) | **WB primary** | `PCPS:POILAPSP` overlay + `worldBank:EN.ATM.CO2E.PC`, `worldBank:EG.FEC.RNEW.ZS` |
| **UbU** (Education) | **IMF + WB** | `GFS_COFOG:GF09_T` + `worldBank:SE.XPD.TOTL.GD.ZS` |
| **KU** (Constitution) | **WB only (WGI)** | `worldBank:CC.EST`, `worldBank:RL.EST`, `worldBank:VA.EST` (source=75) |
| **JuU** (Justice) | **WB only** | `worldBank:VC.IHR.PSRC.P5`, WGI |

Full matrix: [`indicator-policy-mapping.md`](indicator-policy-mapping.md), machine-readable: `indicators-inventory.json → committeeMatrix`.

---

## 10 · Integration touch-points

IMF is referenced from every layer of the agentic stack. To keep sources in sync, this README is the hub; the docs below are its spokes.

| Layer | Document | Role |
|-------|----------|------|
| **Prompts (workflow contract)** | [`.github/prompts/02-mcp-access.md`](../../.github/prompts/02-mcp-access.md) | IMF CLI catalogue |
| | [`.github/prompts/04-analysis-pipeline.md`](../../.github/prompts/04-analysis-pipeline.md) | IMF-first Step 2.6 |
| | [`.github/prompts/00-base-contract.md`](../../.github/prompts/00-base-contract.md) | Provider ordering |
| **Contract** | [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) | Validator gates |
| **Methodology** | [`analysis/methodologies/imf-indicator-mapping.md`](../methodologies/imf-indicator-mapping.md) | Authoritative methodology |
| | [`analysis/methodologies/worldbank-indicator-mapping.md`](../methodologies/worldbank-indicator-mapping.md) | Residual WB (non-economic) |
| **Inventory (machine)** | [`indicators-inventory.json`](indicators-inventory.json) | IMF catalogue |
| | [`../economic-indicators-inventory.json`](../economic-indicators-inventory.json) | Multi-provider pointer |
| **Templates** | [`analysis/templates/*.md`](../templates/) | Per-artifact IMF references |
| **Agents** | [`.github/agents/intelligence-operative.md`](../../.github/agents/intelligence-operative.md), [`news-journalist.md`](../../.github/agents/news-journalist.md), [`data-pipeline-specialist.md`](../../.github/agents/data-pipeline-specialist.md) | Persona integration |
| **Skills** | [`.github/skills/economic-policy-analysis/SKILL.md`](../../.github/skills/economic-policy-analysis/SKILL.md) | Skill guidance |

---

## 11 · Anti-patterns (hard stop)

- ❌ **Running IMF as an MCP server** — IMF is CLI-via-`bash` only (no Python, no uvx, no third-party MCP package).
- ❌ **Projection citation without vintage tag** — always include `(WEO Apr-2026, INDICATOR_CODE)`.
- ❌ **Parallel `weo` calls for the Nordic peer set** — use `compare --countries SWE,DNK,NOR,FIN,DEU` (1 call, not 5).
- ❌ **Quoting WB `NY.GDP.*` as primary macro** — replaced by `WEO:*`; WB retained only for governance/environment/residue.
- ❌ **Forecast phrasing without citation** — "Sweden is expected to…" must be rewritten as "IMF projects Sweden's X at Y% (WEO Apr-2026, CODE)…".
- ❌ **Silent fallback to WB when IMF is down** — log to `analysis/data/imf/_outages/` and flag in `mcp-reliability-audit.md`.
- ❌ **Mixing WEO and FM values for the same code without disambiguation** — always cite each with its own vintage.

---

## 12 · Related documents

- [`indicators-inventory.json`](indicators-inventory.json) — machine-readable catalogue
- [`data-dictionary.md`](data-dictionary.md) — complete dataflow / dimension reference
- [`agentic-integration.md`](agentic-integration.md) — 7-step integration playbook
- [`indicator-policy-mapping.md`](indicator-policy-mapping.md) — committee matrix
- [`use-cases.md`](use-cases.md) — canonical article examples
- [`analysis/methodologies/imf-indicator-mapping.md`](../methodologies/imf-indicator-mapping.md) — authoritative methodology
- [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) — v2.1 validator contract
- [`.github/prompts/README.md`](../../.github/prompts/README.md) — shared prompt library
- [`docs/adr/0001-adopt-imf-data-alongside-world-bank.md`](../../docs/adr/0001-adopt-imf-data-alongside-world-bank.md) — architecture decision
