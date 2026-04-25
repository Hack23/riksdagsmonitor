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
- **Build-time scripts** import `scripts/imf-client.ts` directly. Primary transport is the IMF **Datamapper** JSON endpoint (WEO + FM, no auth); targeted SDMX 3.0 is available via `ImfClient.sdmxFetch()` for IFS / BOP / GFS_COFOG / DOTS / PCPS / ER.
- **World Bank** (`worldbank-mcp@1.0.1`) remains as an MCP server for WGI governance, environment, and social residue. Do **not** replace WB calls that target these classes. Do **not** route fresh economic data through WB — use IMF.
- **SCB** (`pxweb-mcp`) is unchanged; remains the Swedish primary source for monthly inflation (KPIF), AKU labour, regional data, and budget execution.

See ADR: [`docs/adr/0001-adopt-imf-data-alongside-world-bank.md`](../../docs/adr/0001-adopt-imf-data-alongside-world-bank.md).

---

## 4 · Code surface

| File | Purpose |
|---|---|
| [`scripts/imf-client.ts`](../../scripts/imf-client.ts) | TypeScript REST client (Datamapper + SDMX 3.0 passthrough). 3× retry with 1 s → 2 s → 4 s back-off on 429/5xx, projection detection, vintage stamping. Also exports pure helpers `calculateRetryDelay()` and `parseDatamapperValues()` for unit-testing without HTTP stubs, and `getWeoIndicatorsBatch()` for multi-indicator same-country fetch with fail-soft isolation. |
| [`scripts/imf-fetch.ts`](../../scripts/imf-fetch.ts) | Thin CLI wrapper over `imf-client.ts` (commands: `weo`, `compare`, `sdmx`, `list-indicators`). Used by agentic workflows via the `bash` tool. |
| [`scripts/imf-codes.ts`](../../scripts/imf-codes.ts) | ISO-3 ↔ IMF AREA code mappings for IFS/GFS/BOP. Fail-loud on unknown codes (prevents silent data loss). Exports `listKnownIso3Codes()` for programmatic peer-set discovery. |
| [`scripts/imf-context.ts`](../../scripts/imf-context.ts) | Policy-area / committee → IMF indicator mapping. Exports `imfCitation()`, `findImfIndicatorByCode()`, `findImfIndicatorByCitation()`, `getImfDatabasesInUse()`, `getImfCommitteeMatrix()`, `listImfCitations()` and the curated `IMF_INDICATORS` catalogue (19 entries spanning WEO, FM, GFS_COFOG, MFS_IR, DOTS, IFS). |
| [`analysis/imf/indicators-inventory.json`](indicators-inventory.json) | v1.0 comprehensive IMF inventory (24+ indicators, 10 dataflows) — authoritative machine catalogue. |
| [`analysis/economic-indicators-inventory.json`](../economic-indicators-inventory.json) | v4.1 multi-provider inventory (IMF-first; WB by reference; SCB via `scripts/scb-context.ts`). |

No MCP server is required for IMF — access is part of the repository's npm SBOM, and the only firewall egress needed is to `data.imf.org`, `api.imf.org`, and `www.imf.org`.

### 4.1 · TypeScript API quick reference

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
- Rely on the client's built-in 3× retry with 1s→2s→4s back-off on HTTP 429 / 5xx.
- Cache raw responses under `analysis/data/imf/{indicator}/{country}.json` via the `--persist` flag (or `persistIMFData()` for programmatic use).
- Pre-warm 1 request at workflow start.
- Target **≤ 10 IMF calls per article**. > 15 is a workflow-design smell.

---

## 7 · Vintage discipline

Every projection value is stamped with a **vintage tag** — the release cycle that produced it.

- Current: **`WEO-2026-04`** (April 2026 flagship, valid until October 2026 ships).
- Commentary citation format: `(WEO Apr-2026, GGXWDG_NGDP)` — **mandatory** for any projection quote.
- Stale-vintage threshold: 6 months. Older citations trigger a warning annotation in `methodology-reflection.md`.
- Cut-over checklist on each new flagship (April / October):
  1. `DEFAULT_WEO_VINTAGE` in [`scripts/imf-client.ts`](../../scripts/imf-client.ts).
  2. `vintageDiscipline.current` in [`indicators-inventory.json`](indicators-inventory.json).
  3. Banner in this README.
  4. Release calendar row in [`data-dictionary.md`](data-dictionary.md) § 4.

Ship all four in **one PR** titled `chore(imf): cut over to WEO-YYYY-MM vintage`.

---

## 8 · Migration from World Bank (economic codes)

These WB codes are **deprecated for new articles** and kept as read-only reference for back-compat.

| WB (deprecated) | IMF replacement | Rationale |
|-----------------|-----------------|-----------|
| `NY.GDP.MKTP.KD.ZG` | `WEO:NGDP_RPCH` | Freshness + projections |
| `NY.GDP.MKTP.CD` | `WEO:NGDPD` | Same |
| `NY.GDP.PCAP.CD` | `WEO:NGDPDPC` | Same |
| `FP.CPI.TOTL.ZG` | `WEO:PCPIPCH` | Same |
| `SL.UEM.TOTL.ZS` | `WEO:LUR` | Same; SCB still preferred for Swedish specifics |
| `GC.DOD.TOTL.GD.ZS` | `WEO:GGXWDG_NGDP` | General-government (EDP) basis |
| `GC.XPN.TOTL.GD.ZS` | `WEO:GGX_NGDP` | GFSM 2014 |
| `GC.REV.XGRT.GD.ZS` | `WEO:GGR_NGDP` | Same |
| `BN.CAB.XOKA.GD.ZS` | `WEO:BCA_NGDPD` | Same |
| `NE.EXP.GNFS.ZS` | `WEO:TX_RPCH` | Growth basis cleaner for trend articles |

Full supersedes map: see the `deprecationPolicy` section of [`indicators-inventory.json`](indicators-inventory.json).

**WB is still primary** for: WGI governance (source=75), environment (CO2, renewables, forest), education participation, defence historicals (`MS.MIL.XPND.GD.ZS`), crime & justice (`VC.IHR.PSRC.P5`).

---

## 9 · Committee quick reference

| Committee | IMF role | Example `mustQuery` |
|-----------|----------|---------------------|
| **FiU** (Finance) | **IMF primary** | `WEO:NGDP_RPCH`, `WEO:PCPIPCH`, `WEO:GGXWDG_NGDP`, `WEO:GGXCNL_NGDP` |
| **SkU** (Taxation) | **IMF primary** | `WEO:GGR_NGDP`, `FM:GGXONLB_NGDP` |
| **AU** (Labour) | **IMF + SCB** | `WEO:LUR` + SCB AKU |
| **NU** (Business/Trade) | **IMF primary** | `WEO:BCA_NGDPD`, `WEO:TX_RPCH`, `DOTS:TXG_FOB_USD` |
| **UU** (Foreign affairs) | **IMF primary** | `WEO:BCA_NGDPD`, `WEO:TX_RPCH` |
| **SoU** (Health) | **IMF + WB** | `GFS_COFOG:G07`, `WEO:LP` + `worldBank:SH.XPD.CHEX.GD.ZS` |
| **SfU** (Social insurance) | **IMF + WB** | `GFS_COFOG:G10`, `WEO:LP`, `WEO:LUR` |
| **FöU** (Defence) | **IMF + WB** | `GFS_COFOG:G02` + `worldBank:MS.MIL.XPND.GD.ZS` |
| **MJU** (Environment) | **WB primary** | `PCPS:POILAPSP` overlay + `worldBank:EN.ATM.CO2E.PC`, `worldBank:EG.FEC.RNEW.ZS` |
| **UbU** (Education) | **IMF + WB** | `GFS_COFOG:G09` + `worldBank:SE.XPD.TOTL.GD.ZS` |
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
