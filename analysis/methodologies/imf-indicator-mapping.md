# IMF Indicator → Article Type Mapping (Riksdagsmonitor)

**Purpose** — canonical reference mapping Riksdagsmonitor news workflow article types to the most-relevant IMF indicators sourced from **WEO**, **Fiscal Monitor**, **IFS**, **BOP**, **ER**, and **PCPS** via the local TypeScript IMF client at `scripts/imf-fetch.ts` (SDMX 3.0 base URL `https://api.imf.org/external/sdmx/3.0`, Datamapper JSON base URL `https://www.imf.org/external/datamapper/api/v1` — see `scripts/imf-client.ts`).

**Data access** — no dedicated MCP server; the agent invokes `tsx scripts/imf-fetch.ts …` from `bash` with egress limited to `api.imf.org` and `www.imf.org` (see [`.github/prompts/01-bash-and-shell-safety.md`](../../.github/prompts/01-bash-and-shell-safety.md) and the network allowlist in [`.github/workflows/`](../../.github/workflows/) agentic frontmatter).

**Wave-2 scope (April 2026)** — IMF is the **authoritative source** for **all** economic context: macro / fiscal / trade / monetary / exchange-rate / debt. Social / demographic / health / education / environment / defence / agriculture / innovation / governance indicators remain on World Bank — see [`worldbank-indicator-mapping.md`](worldbank-indicator-mapping.md).

**Why IMF over WB for economics**

- IMF WEO publishes **April + October each year** with full actuals + 5-year forecasts (T+5).
- IMF aggregate codes `EU`, `EA`, `G7`, `G20` are accepted by the IMF API whereas WB's `EUU`, `EMU` are rejected by the IMF endpoint.
- IMF provides a single `"IMF, World Economic Outlook, April 2026"` provenance line with no vintage patching.

**Enforcement** — the evidence-host regex in [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) Check 4 accepts **any** of `api.imf.org`, `data.imf.org`, or `www.imf.org` as a primary-source URL host alongside `worldbank.org`; IMF citations alone are sufficient to pass.

---

## 1. IMF Dataflow Catalogue (subset)

| Dataflow | Scope | Typical series |
|----------|-------|----------------|
| `WEO` | Macro + fiscal, annual, +5y forecasts | NGDP_RPCH, PCPIPCH, LUR, GGXWDG_NGDP, GGXCNL_NGDP, BCA_NGDPD |
| `FM` | Fiscal Monitor, semi-annual | G_XWDG_G01_GDP_PT, G_XCNL_G01_GDP_PT |
| `IFS` | International Financial Statistics (monthly) | FIR (policy rate), EXR (exchange rate), PCPI (CPI), LUR |
| `BOP` | Balance of Payments | Current account components |
| `ER` | Exchange rates | Nominal & real effective |
| `DOTS` | Direction of Trade | Bilateral trade flows |
| `GFS` | Government Finance Statistics | Debt, revenue, expenditure by function |
| `PCPS` | Primary Commodity Prices | Energy / metals / agriculture |

---

## 2. Sweden + Aggregates

| Purpose | IMF code | Notes |
|---------|----------|-------|
| Sweden | `SWE` | ISO-3 |
| EU | `EU` | IMF aggregate (≠ WB `EUU`) |
| Euro area | `EA` | IMF aggregate (≠ WB `EMU`) |
| G7 | `G7` | |
| G20 | `G20` | |
| Nordic baseline | `DNK`, `FIN`, `NOR`, `ISL` | fetched alongside SWE for comparative-international |

---

## 3. Article-Type → Indicator Map

| Article type | WEO indicators (annual) | IFS (monthly, if in-period) | Notes |
|--------------|-------------------------|-----------------------------|-------|
| `propositions` (budget / finance) | NGDP_RPCH, PCPIPCH, LUR, GGXWDG_NGDP, GGXCNL_NGDP | FIR (Riksbank policy rate), EXR (SEK/EUR) | pair with Fiscal Monitor series when available |
| `propositions` (trade / arbetsmarknad) | BCA_NGDPD, TX_RPCH, TM_RPCH | — | cite DOTS if EU counterparties discussed |
| `motions` (ekonomi) | NGDP_RPCH, PCPIPCH, LUR | — | |
| `committee-reports` (FiU) | full WEO + Fiscal Monitor | FIR, EXR, PCPI | required for any FiU analysis |
| `committee-reports` (NU, SkU) | NGDP_RPCH, LUR + sectoral | — | — |
| `interpellations` (macro) | PCPIPCH, LUR | FIR | — |
| `evening-analysis` | WEO delta since previous publication | FIR + EXR if rate decision day | — |
| `realtime-monitor` | — (usually non-economic) | FIR, EXR if Riksbank / ECB news | — |
| `week-ahead` / `month-ahead` | forecast tables | calendar of Riksbank decisions | — |
| `weekly-review` / `monthly-review` | period-over-period WEO + Fiscal Monitor | FIR, EXR, PCPI trend | pair with `session-baseline.md` |

---

## 4. Citation Pattern

Every IMF figure cited in an artifact must appear as:

```text
IMF, "{series name}" ({dataflow/series code}), Sweden, {period},
{"IMF, World Economic Outlook, April 2026" | "IFS via scripts/imf-fetch.ts"}.
Admiralty: A1 (IMF WEO) / A2 (IFS).
```

Example:

```text
IMF, "General government net lending/borrowing, percent of GDP"
(WEO/GGXCNL_NGDP), Sweden, 2026 (forecast), IMF World Economic Outlook,
April 2026. Admiralty: A1.
```

---

## 5. Forecast Handling

IMF WEO forecasts carry a **vintage tag** (April vs October). When forecasts are cited:

- Always include the vintage in the citation (`WEO April 2026` / `WEO October 2026`).
- When comparing runs, ensure both runs cite the same vintage **or** explicitly note the vintage change in [`cross-run-diff.md`](../templates/cross-run-diff.md).
- Forecasts ≥ T+3 require a confidence-in-evidence caveat in prose; WEP band mandatory.

---

## 6. Economic Data Contract

Chart.js specifications for any chart fed by IMF data live in [`../../.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md). Follow the contract exactly — `economic-data.json` under the run folder is the source of truth the static site consumes.

---

## 7. Anti-Patterns (gate failures)

- Mixing IMF `EU` aggregate with WB `EUU` in the same chart.
- Citing a forecast value without vintage.
- Forecast series beyond T+5 (out of WEO horizon).
- Missing Admiralty grade.
- Combining WEO annual with IFS monthly on the same time-axis without resampling annotation.

---

## 8. Changelog

- **v1.0 (2026-04-23)** — Initial Riksdagsmonitor IMF mapping; adapted from EU Parliament Monitor `imf-indicator-mapping.md` under the Wave-2 WB↔IMF split.
