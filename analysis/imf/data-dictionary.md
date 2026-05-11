# IMF Data Dictionary

> **Purpose**: Complete reference for every IMF dataflow, dimension, frequency, code list, release cadence, projection horizon, and known quirk that Riksdagsmonitor consumes. Read this before adding a new IMF indicator, debugging a 404, or interpreting divergent values between IMF and SCB/WB.
>
> **Companion to** `indicators-inventory.json` (machine-readable) and `indicator-policy-mapping.md` (committee mapping).
>
> **Authority**: IMF SDMX 3.0 documentation at https://data.imf.org/api/documentation and IMF Data Portal at https://data.imf.org.

---

## 1 · Transport layers

IMF public data is exposed on two transports, both unauthenticated and both on the Riksdagsmonitor firewall allowlist.

### 1.1 Datamapper JSON (simple, WEO-optimised)

- Base URL: `https://www.imf.org/external/datamapper/api/v1`
- URL pattern: `/{indicatorCode}/{iso3}` (single indicator, single country) or `/{indicatorCode}` (indicator across all countries).
- Country codes: **ISO-3 alpha-3** (`SWE`, `DNK`, `NOR`, `FIN`, `DEU`, `EU`, `EURO`).
- Response: JSON object with `values[indicatorCode][countryCode][year] = number | string | null`.
- Used by: `scripts/imf-client.ts → getWeoIndicator()`, `compareCountriesWeo()`, `getLatestWeoIndicator()`.
- CLI: `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 15 --persist`.
- Scope: Datamapper surfaces **WEO + Fiscal Monitor headline indicators**. For anything else, use SDMX 3.0.

### 1.2 SDMX 3.0 (full catalogue)

- Base URL: `https://api.imf.org/external/sdmx/3.0`
- **Authentication (required):** every `/data/...` request to this surface MUST include the `Ocp-Apim-Subscription-Key: <IMF_SDMX_SUBSCRIPTION_KEY>` Azure APIM header. Without it the gateway returns an auth-mask **HTTP 404** (not 401/403), which is silent and easy to misdiagnose. See [`agentic-integration.md`](agentic-integration.md) §"Pre-warm gate" for the env-var forwarding chain.
- URL pattern (canonical, on the wire): `/data/dataflow/{agencyId}/{dataflowId}/{version}/{key}?startPeriod=…&endPeriod=…` — the SDMX 3.0 REST shape.
- URL pattern (human-readable, kept in docs/CLI): `/data/{agencyId},{dataflowId},{version}/{key}?startPeriod=…&endPeriod=…` — the legacy comma form. **The `ImfClient.sdmxFetch()` client transparently rewrites comma → slash via `normalizeSdmxPathForBase()` before sending** ([`scripts/imf-client.ts`](../../scripts/imf-client.ts)), because `api.imf.org/sdmx/3.0` 404s the comma form. Docs, CLI examples, and `weoSdmxPath()` keep the readable comma form for clarity.
- Agency: `IMF.STA` (Statistics Department) for most datasets; `IMF.RES` (Research) for WEO; `IMF.FAD` (Fiscal Affairs) for FM.
- Country codes: **ISO 3166-1 alpha-3** (`SWE`, `DNK`, `NOR`, `FIN`, `DEU`) for every dataflow we cite. The legacy 3-digit numeric IMF AREA codes (e.g. `144`=SWE) were retired in the 2026-05 SDMX 3.0 refactor; passing them now yields an empty `dataSets[].series` (HTTP 200, zero observations).
- Response: SDMX-JSON 2.0.0 (`application/vnd.sdmx.data+json;version=2.0.0`).
- Used by: `scripts/imf-client.ts → sdmxFetch()` (which applies the comma → slash rewrite + injects the subscription-key header).
- CLI: `tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01"` (CLI keeps comma form; client rewrites it).

### 1.3 Transport choice matrix

| Dataset | Preferred transport | Notes |
|---------|---------------------|-------|
| WEO     | Datamapper (faster, JSON) | SDMX also works via `/data/IMF.RES,WEO,9.0.0/…` |
| FM      | Datamapper | SDMX fallback via `/data/IMF.FAD,FM,4.0.0/…` |
| CPI     | **SDMX only** | Dissolved out of legacy IFS in the 2026-05 refactor; v5.0.0 |
| BOP / BOP_AGG | **SDMX only** | v21.0.0 |
| GFS_COFOG | **SDMX only** | v11.0.0; ISO3 country, indicators `GF{02,07,09,10}_T` |
| MFS_IR (policy rates) | **SDMX only** | v8.0.1; `FPOLM_PA` retired for SWE — use `MMRT_RT_PT_A_PT` proxy |
| IMTS    | **SDMX only** | v1.0.0; replaces retired DOTS dataflow; bilateral flows require partner-country dimension |
| PCPS    | **SDMX only** | v9.0.0, agency `IMF.RES` (moved from `IMF.STA`) |
| ER (exchange rates) | **SDMX only** | v4.0.1; `ENDA_/ENDE_XDC_USD_RATE` retired — use `USD_XDC.PA_RT` / `EOP_RT` |

---

## 2 · Dataflows

### 2.1 WEO — World Economic Outlook

- **Dataflow ID**: `WEO` (SDMX), `/` root (Datamapper)
- **Agency**: `IMF.RES`
- **Frequency**: Annual (`A`)
- **Release cadence**: April flagship (~3rd week) and October flagship (~2nd week). Update window publishes an "Update" (July / January) — subset of indicators; no new projections.
- **Projection horizon**: T+5 (April 2026 release → 2026–2031 projections).
- **Vintage tag**: `WEO-YYYY-MM` (e.g. `WEO-2026-04`). Stamp every projection with this.
- **Dimensions (SDMX key)**: `FREQ.REF_AREA.INDICATOR`
  - `FREQ` = `A`
  - `REF_AREA` = ISO-3 or aggregate (`EU`, `EURO`, `G7`, `AE`, `WORLD`)
  - `INDICATOR` = e.g. `NGDP_RPCH`
- **Key indicators** (complete list in `indicators-inventory.json`):
  - `NGDP_RPCH` — real GDP growth, %
  - `NGDPD` — nominal GDP, USD billions
  - `NGDPDPC` — GDP per capita, current USD
  - `PPPPC` — GDP per capita, PPP international $
  - `PCPIPCH` — CPI inflation, average, %
  - `PCPIEPCH` — CPI inflation, end of period, %
  - `LUR` — unemployment rate, %
  - `LE` — employment, millions
  - `LP` — population, millions
  - `GGR_NGDP` — government revenue, % of GDP
  - `GGX_NGDP` — government expenditure, % of GDP
  - `GGXCNL_NGDP` — net lending/borrowing, % of GDP
  - `GGXWDG_NGDP` — gross debt, % of GDP
  - `BCA_NGDPD` — current account, % of GDP
  - `TX_RPCH` / `TM_RPCH` — exports / imports volume growth, %
- **Quirks**:
  - WEO `LUR` may differ from SCB AKU by 0.1–0.3 pp due to ILO definition; cite explicitly when adjacent to SCB numbers.
  - `GGXWDG_NGDP` WEO vintage may diverge from the FM-vintage value of the same code by up to 1 pp in the same year — WEO is more aggregated, FM has later cutoff.
  - Datamapper sometimes returns `"n/a"` as a string for missing observations; the client filters these via explicit null/NaN guards.

### 2.2 FM — Fiscal Monitor

- **Dataflow ID**: `FM`
- **Agency**: `IMF.FAD`
- **Frequency**: Annual (`A`)
- **Release cadence**: Aligned with WEO — April and October.
- **Projection horizon**: T+5.
- **Vintage tag**: `FM-YYYY-MM` (e.g. `FM-2026-04`).
- **Why use FM over WEO for fiscal**: FM publishes cyclically-adjusted balances, primary balances, and debt-sustainability vintages that WEO does not.
- **Key indicators**:
  - `GGXONLB_NGDP` — primary balance, % of GDP
  - `GGSB_NPGDP` — cyclically-adjusted primary balance, % of potential GDP
  - `GGXWDG_NGDP` — gross debt (FM vintage)
  - `GGXCNLB_NGDP` — primary net lending/borrowing

### 2.3 CPI — Consumer Price Index (replaces the legacy IFS monthly CPI block)

- **Dataflow ID**: `CPI` (the legacy `IFS` dataflow no longer exists as a single SDMX 3.0 dataflow — its CPI block lives here, its policy-rate block in `MFS_IR`, and its exchange-rate block in `ER`).
- **Agency**: `IMF.STA`
- **Version**: `5.0.0` (post-2026-05 SDMX 3.0 refactor — `4.0.0` and the standalone `PCPI_IX` series were retired).
- **Frequency**: Monthly (`M`), Quarterly (`Q`), or Annual (`A`).
- **Release cadence**: Monthly, ~30–45 days after reference period.
- **No projections** — historical only (use `WEO:PCPIPCH` for forward-looking inflation).
- **Dimensions** (5): `COUNTRY.INDEX_TYPE.COICOP_1999.TYPE_OF_TRANSFORMATION.FREQUENCY`.
  - `COUNTRY` — **ISO3** (e.g. `SWE`). The legacy 3-digit IMF AREA code (`144`) is no longer accepted.
  - `INDEX_TYPE` — `CPI` for consumer-price index; other values include `PPI`, `WPI`.
  - `COICOP_1999` — classification code; `_T` is "all items".
  - `TYPE_OF_TRANSFORMATION` — `IX` (level / index), `PC_PA` (year-on-year %), `PC_PP_PT` (period-on-period %).
  - `FREQUENCY` — `M`, `Q`, `A`.
- **Example SDMX path** (Sweden all-items CPI level, monthly):
  ```
  /data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01
  ```
- **Quirks**: All SDMX 3.0 dataflows now accept ISO3 directly as `COUNTRY`. The 2-letter ISO-2 (`SE`) and 3-digit numeric IMF AREA (`144`) are **not** accepted by IMF.STA/CPI v5.0.0 — verified live 2026-05-11.

### 2.4 BOP / BOP_AGG — Balance of Payments

- **Dataflow ID**: `BOP`, `BOP_AGG`
- **Agency**: `IMF.STA`
- **Version**: `21.0.0` (post-2026-05 refactor).
- **Frequency**: Quarterly (`Q`) or Annual (`A`).
- **Methodology**: BPM6.
- **Dimensions** (5): `COUNTRY.BOP_ACCOUNTING_ENTRY.INDICATOR.UNIT.FREQUENCY`.
- **Key measures**: current account (`CAB`), capital account, financial account, reserve assets, errors and omissions.
- **Example SDMX path** (Sweden current-account balance, USD, annual):
  ```
  /data/IMF.STA,BOP,21.0.0/SWE.NETCD_T.CAB.USD.A?startPeriod=2020
  ```
- **Use case**: Deeper external-sector detail than WEO's `BCA_NGDPD`.

### 2.5 GFS_COFOG — Government Finance Statistics by Function

- **Dataflow ID**: `GFS_COFOG`
- **Agency**: `IMF.STA`
- **Version**: `11.0.0` (post-2026-05 refactor — indicator codes were renamed from `G02`/`G07`/`G09`/`G10` to `GF02_T`/`GF07_T`/`GF09_T`/`GF10_T`).
- **Frequency**: Annual (`A`).
- **Release cadence**: T+1 (data for year Y released in late Y+1).
- **Methodology**: GFSM 2014.
- **Dimensions** (6): `COUNTRY.SECTOR.GFS_GRP.INDICATOR.TYPE_OF_TRANSFORMATION.FREQUENCY`.
  - `SECTOR` — `S13` (general government).
  - `GFS_GRP` — `G2MF` (expense by function — main).
  - `INDICATOR` — `GF02_T` (defence), `GF07_T` (health), `GF09_T` (education), `GF10_T` (social protection), etc.
  - `TYPE_OF_TRANSFORMATION` — `POGDP_PT` (% of GDP), `POTO_PT` (% of total expenditure), `XDC` (national currency).
- **COFOG functions** (critical for committee mapping):
  - `01` General public services
  - `02` Defence (`GF02_T`) → **FöU**
  - `03` Public order and safety → **JuU**
  - `04` Economic affairs
  - `05` Environmental protection → **MJU** (partial — WB still primary)
  - `06` Housing and community amenities
  - `07` Health (`GF07_T`) → **SoU**
  - `08` Recreation, culture, religion → **KrU**
  - `09` Education (`GF09_T`) → **UbU**
  - `10` Social protection (`GF10_T`) → **SfU**
- **Example SDMX path** (Sweden defence spending, % of GDP, annual):
  ```
  /data/IMF.STA,GFS_COFOG,11.0.0/SWE.S13.G2MF.GF02_T.POGDP_PT.A?startPeriod=2015
  ```
- **Use case**: Committee-aligned spending decomposition when a report or motion concerns function-specific policy.

### 2.6 MFS_IR — Monetary & Financial Statistics, Interest Rates

- **Dataflow ID**: `MFS_IR`
- **Agency**: `IMF.STA`
- **Version**: `8.0.1` (post-2026-05 refactor).
- **Frequency**: Monthly (`M`).
- **Dimensions** (3): `COUNTRY.INDICATOR.FREQUENCY`.
- **Key indicators (Sweden codelist, verified 2026-05-11)**: `MMRT_RT_PT_A_PT` (money-market rate, IMF proxy for the Riksbank policy rate), `S13BOND_RT_PT_A_PT` (sovereign-bond yield), `MFS135_RT_PT_A_PT`, `MFS162_RT_PT_A_PT`, `MFS166_RT_PT_A_PT`, `MFS171_RT_PT_A_PT`, `GSTBILY_RT_PT_A_PT`.
- **Example SDMX path** (Sweden money-market rate, monthly):
  ```
  /data/IMF.STA,MFS_IR,8.0.1/SWE.MMRT_RT_PT_A_PT.M?startPeriod=2024-01
  ```
- **Swedish relevance**: The legacy `FPOLM_PA` central-bank policy-rate code is **no longer in the SWE codelist**. Use `MMRT_RT_PT_A_PT` as the IMF proxy and prefer Riksbank statistics directly for the official styrränta.

### 2.7 IMTS — International Merchandise Trade Statistics (replaces the legacy DOTS dataflow)

- **Dataflow ID**: `IMTS` (the `DOTS` / `DOT` dataflow no longer exists in SDMX 3.0).
- **Agency**: `IMF.STA`
- **Version**: `1.0.0` (post-2026-05 refactor).
- **Frequency**: Monthly (`M`), Quarterly (`Q`), or Annual (`A`).
- **Dimensions** (4): `COUNTRY.INDICATOR.COUNTERPART_COUNTRY.FREQUENCY`.
- **Key indicators**: `XG_FOB_USD` (exports FOB, USD — formerly `TXG_FOB_USD`), `MG_FOB_USD` / `MG_CIF_USD` (imports FOB / CIF, USD — formerly `TMG_CIF_USD`), `TBG_USD` (trade balance, USD).
- **Example SDMX path** (Sweden exports to USA, annual):
  ```
  /data/IMF.STA,IMTS,1.0.0/SWE.XG_FOB_USD.USA.A?startPeriod=2023
  ```
- **Use case**: Bilateral trade flows — e.g. Swedish exports to Russia, EU, China. Critical for foreign-policy / sanctions coverage.

### 2.8 PCPS — Primary Commodity Prices

- **Dataflow ID**: `PCPS`
- **Agency**: `IMF.RES` (moved from `IMF.STA` to `IMF.RES` in the 2026-05 refactor).
- **Version**: `9.0.0`.
- **Frequency**: Monthly (`M`).
- **Dimensions** (4): `COUNTRY.INDICATOR.DATA_TRANSFORMATION.FREQUENCY` — `COUNTRY=G001` (global aggregate), `DATA_TRANSFORMATION=USD` for nominal USD prices.
- **Key indicators**: `PALLFNF` (all commodities, non-fuel), `POILAPSP` (oil, average of Brent/Dubai/WTI), `POILBRE` (Brent), `POILWTI` (WTI), `POILDUB` (Dubai).
- **Example SDMX path** (Brent crude, monthly):
  ```
  /data/IMF.RES,PCPS,9.0.0/G001.POILBRE.USD.M?startPeriod=2024-01
  ```
- **Use case**: Inflation drivers commentary — tie Swedish CPI movements to commodity shocks.

### 2.9 ER — Exchange Rates

- **Dataflow ID**: `ER`
- **Agency**: `IMF.STA`
- **Version**: `4.0.1` (post-2026-05 refactor).
- **Frequency**: Monthly (`M`), Quarterly (`Q`), or Annual (`A`) — period-average and end-of-period variants.
- **Dimensions** (4): `COUNTRY.INDICATOR.TYPE_OF_TRANSFORMATION.FREQUENCY`.
  - `TYPE_OF_TRANSFORMATION` — `PA_RT` (period average), `EOP_RT` (end of period).
- **Key indicators**: `USD_XDC` (USD per national currency), `EUR_XDC` (EUR per national currency), `XDC_USD` (national currency per USD), `XDC_EUR`, `XDR_XDC`, `EREER_IX` (real effective exchange rate index).
- **Example SDMX path** (Sweden SEK/USD period-average, monthly):
  ```
  /data/IMF.STA,ER,4.0.1/SWE.USD_XDC.PA_RT.M?startPeriod=2024-01
  ```
- **Use case**: Monetary-policy coverage, export-competitiveness commentary.

---

## 3 · Aggregate country codes

IMF WEO publishes aggregates that make peer-comparison cleaner than adding up ISO-3 countries manually.

| Aggregate | WEO code | SDMX equivalent | Description |
|-----------|----------|-----------------|-------------|
| European Union | `EU` | `EU` | 27 member states |
| Euro Area | `EURO` | `EA` | 20 member states |
| Advanced Economies | `AE` | `AE` | IMF classification |
| G7 | `G7` | `G7` | |
| G20 | `G20` | `G20` | |
| World | `WORLD` | `W0` | |

**Use**: For `comparative-international.md`, use `EU` and `EURO` as baseline aggregates alongside the Nordic peer set (`SWE,DNK,NOR,FIN,DEU`) — one batched `compare` call per indicator delivers all comparators.

---

## 4 · Release calendar (2026)

| Date | Release |
|------|---------|
| Late April 2026 | **WEO Apr-2026** (flagship) + **Fiscal Monitor Apr-2026** |
| Mid July 2026 | WEO Update (subset, no new projections) |
| Mid October 2026 | **WEO Oct-2026** (flagship) + **Fiscal Monitor Oct-2026** |
| Mid January 2027 | WEO Update |

**Action**: On each flagship release (April / October), update `DEFAULT_WEO_VINTAGE` in `scripts/imf-client.ts`, the `vintageDiscipline.current` field in `indicators-inventory.json`, and the banner in `analysis/imf/README.md` in the same PR.

---

## 5 · Known quirks & caveats

### 5.1 Null / n/a observations

Datamapper returns `null`, `"n/a"`, or omits the key for missing observations. The client filters via:
```
if (rawValue === null || rawValue === undefined) continue;
if (!Number.isFinite(numeric)) continue;
```
**Never** coerce via `Number(x)` without a `Number.isFinite` guard — `Number(null) === 0` would silently inject bogus zeros.

### 5.2 Country code mismatches

- Datamapper = ISO-3 (`SWE`)
- SDMX WEO = ISO-3 (`SWE`)
- SDMX IFS = ISO-2 (`SE`) in some dataflows
- SDMX GFS / BOP = IMF AREA 3-digit numeric (`144`)

Use `scripts/imf-codes.ts → toImfAreaCode(iso3)` for SDMX-numeric mapping; the function throws on unknown codes (fail-loud — prevents silent data loss).

### 5.3 Vintage divergence

The same code (e.g. `GGXWDG_NGDP`) in WEO and in FM may differ by up to 1 pp in the same year because the two flagships have slightly different cutoff dates and revision policies. Rule of thumb: **use WEO for headline macro, FM for debt-sustainability**. When both are cited in the same article, disambiguate with the vintage tag.

### 5.4 Rate limiting

IMF advertises ~10 requests / 5 s. The client defaults to `maxRetries=2` with 1s→2s back-off. Agentic workflows should:
- Prefer `compare` (one call per indicator across the peer set) over parallel `weo` calls.
- Sleep 1 s between separate `imf-fetch.ts` invocations.
- Pre-warm 1 request at workflow start to avoid cold-start latency spikes.
- Cache with `--persist`.

### 5.5 WEO `LUR` vs SCB AKU

- WEO `LUR` uses ILO harmonised definition.
- SCB AKU uses Swedish survey methodology.
- Divergence: 0.1–0.3 pp typical.
- Rule: **SCB for Swedish-specific ground truth; IMF for cross-country comparison**. When both cited, annotate the methodology difference.

### 5.6 Projection year detection

The client classifies any year `> currentYear` as a projection. This is correct for WEO/FM (which extend to T+5) but for IFS/BOP/GFS_COFOG — which have **no projections** — every observation is historical. Client tags `projection: false` for all non-WEO/FM datasets.

---

## 6 · Migration map — WB → IMF

| WB code | IMF replacement | Rationale |
|---------|----------------|-----------|
| `NY.GDP.MKTP.KD.ZG` (GDP growth) | `WEO:NGDP_RPCH` | Freshness + projections |
| `NY.GDP.MKTP.CD` (GDP USD) | `WEO:NGDPD` | Same |
| `NY.GDP.PCAP.CD` (GDP per capita) | `WEO:NGDPDPC` | Same |
| `FP.CPI.TOTL.ZG` (CPI inflation) | `WEO:PCPIPCH` | Same |
| `SL.UEM.TOTL.ZS` (unemployment) | `WEO:LUR` | Same; SCB still preferred for Swedish-specific |
| `GC.DOD.TOTL.GD.ZS` (central-gov debt) | `WEO:GGXWDG_NGDP` | GFSM 2014 general-government basis |
| `GC.XPN.TOTL.GD.ZS` (expenditure) | `WEO:GGX_NGDP` | Same |
| `GC.REV.XGRT.GD.ZS` (revenue) | `WEO:GGR_NGDP` | Same |
| `BN.CAB.XOKA.GD.ZS` (current account) | `WEO:BCA_NGDPD` | Same |
| `NE.EXP.GNFS.ZS` (exports) | `WEO:TX_RPCH` | Growth basis cleaner than % of GDP for trend articles |

These WB codes remain read-only reference. New articles MUST cite the IMF counterpart; existing committed articles do not require retroactive update.

---

## 7 · Cross-references

- `analysis/imf/README.md` — high-level overview & adoption strategy
- `analysis/imf/indicators-inventory.json` — machine-readable catalogue
- `analysis/imf/indicator-policy-mapping.md` — committee mapping
- `analysis/imf/agentic-integration.md` — integration playbook for agentic workflows
- `analysis/imf/use-cases.md` — canonical article examples
- `analysis/methodologies/imf-indicator-mapping.md` — authoritative methodology
- `.github/aw/ECONOMIC_DATA_CONTRACT.md` — validator contract (v2.1+)
- `scripts/imf-client.ts` / `scripts/imf-fetch.ts` / `scripts/imf-codes.ts` / `scripts/imf-context.ts` — code surface
