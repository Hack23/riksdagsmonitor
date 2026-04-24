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
- URL pattern: `/data/{agencyId},{dataflowId},{version}/{key}?startPeriod=…&endPeriod=…`
- Agency: `IMF.STA` (Statistics Department) for most datasets; `IMF.RES` (Research) for WEO; `IMF.FAD` (Fiscal Affairs) for FM.
- Country codes: **IMF AREA numeric** (`144`=SWE, `128`=DNK, `142`=NOR, `172`=FIN, `134`=DEU) for IFS/GFS/BOP. WEO still uses ISO-3 here.
- Response: SDMX-JSON 2.1 (structure + observation arrays).
- Used by: `scripts/imf-client.ts → sdmxFetch()`.
- CLI: `tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2024-01"`.

### 1.3 Transport choice matrix

| Dataset | Preferred transport | Notes |
|---------|---------------------|-------|
| WEO     | Datamapper (faster, JSON) | SDMX also works via `/data/IMF.RES,WEO,4.0.0/…` |
| FM      | Datamapper | SDMX fallback via `/data/IMF.FAD,FM,4.0.0/…` |
| IFS     | **SDMX only** | No Datamapper coverage |
| BOP / BOP_AGG | **SDMX only** | |
| GFS_COFOG | **SDMX only** | |
| MFS_IR (policy rates) | **SDMX only** | |
| DOTS    | **SDMX only** | Bilateral flows require partner-country dimension |
| PCPS    | **SDMX only** | |
| ER (exchange rates) | **SDMX only** | |

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

### 2.3 IFS — International Financial Statistics

- **Dataflow ID**: `IFS` (historical) / `CPI`, `IR`, `ER` (post-2024 SDMX 3.0 refactor — several sub-dataflows)
- **Agency**: `IMF.STA`
- **Frequency**: Monthly (`M`) or Quarterly (`Q`).
- **Release cadence**: Monthly, ~30–45 days after reference period.
- **No projections** — historical only.
- **Dimensions**: `FREQ.REF_AREA.INDICATOR` (varies by sub-dataflow).
- **Known sub-dataflows**:
  - `CPI,4.0.0` — consumer prices (`PCPI_IX` monthly index, `PCPI_PC_CP_A_PT` year-on-year %)
  - `IR,4.0.0` — interest rates
  - `ER,4.0.0` — exchange rates
- **Example SDMX path**:
  ```
  /data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2024-01
  ```
  (Frequency=M, Country=SE, Indicator=PCPI_IX, monthly CPI index.)
- **Quirks**: IFS country codes are 2-letter ISO-2 in some sub-dataflows (`SE`, `DK`) and 3-letter ISO-3 in others. Always verify via `/structure/codelist/…`.

### 2.4 BOP / BOP_AGG — Balance of Payments

- **Dataflow ID**: `BOP`, `BOP_AGG`
- **Agency**: `IMF.STA`
- **Frequency**: Quarterly (`Q`).
- **Methodology**: BPM6.
- **Key measures**: current account, capital account, financial account, reserve assets, errors and omissions.
- **Use case**: Deeper external-sector detail than WEO's `BCA_NGDPD`.

### 2.5 GFS_COFOG — Government Finance Statistics by Function

- **Dataflow ID**: `GFS_COFOG`
- **Agency**: `IMF.STA`
- **Frequency**: Annual (`A`).
- **Release cadence**: T+1 (data for year Y released in late Y+1).
- **Methodology**: GFSM 2014.
- **Dimensions**: `FREQ.REF_AREA.SECTOR.FUNCTION.TRANSACTION`.
- **COFOG functions** (critical for committee mapping):
  - `01` General public services
  - `02` Defence → **FöU**
  - `03` Public order and safety → **JuU**
  - `04` Economic affairs
  - `05` Environmental protection → **MJU** (partial — WB still primary)
  - `06` Housing and community amenities
  - `07` Health → **SoU**
  - `08` Recreation, culture, religion → **KrU**
  - `09` Education → **UbU**
  - `10` Social protection → **SfU**
- **Use case**: Committee-aligned spending decomposition when a report or motion concerns function-specific policy.

### 2.6 MFS_IR — Monetary & Financial Statistics, Interest Rates

- **Dataflow ID**: `MFS_IR` (or sub-dataflow in the new SDMX 3.0 refactor)
- **Agency**: `IMF.STA`
- **Frequency**: Monthly.
- **Key indicators**: `FPOLM_PA` (policy rate, per annum), `FID_PA` (deposit rate), `FILR_PA` (lending rate), `FIR_PA` (interbank rate).
- **Swedish relevance**: Riksbankens styrränta (policy rate) — complements Riksbank press releases with standardised cross-country comparison.

### 2.7 DOTS — Direction of Trade Statistics

- **Dataflow ID**: `DOTS`
- **Agency**: `IMF.STA`
- **Frequency**: Monthly.
- **Key dimensions**: `FREQ.REF_AREA.COUNTERPART_AREA.INDICATOR.CLASS`.
- **Key indicators**: `TXG_FOB_USD` (exports FOB, USD), `TMG_CIF_USD` (imports CIF, USD).
- **Use case**: Bilateral trade flows — e.g. Swedish exports to Russia, EU, China. Critical for foreign-policy / sanctions coverage.

### 2.8 PCPS — Primary Commodity Prices

- **Dataflow ID**: `PCPS`
- **Agency**: `IMF.RES`
- **Frequency**: Monthly.
- **Key indicators**: `PALLFNF` (all commodities, non-fuel), `POILAPSP` (oil, average of Brent/Dubai/WTI).
- **Use case**: Inflation drivers commentary — tie Swedish CPI movements to commodity shocks.

### 2.9 ER — Exchange Rates

- **Dataflow ID**: embedded in IFS post-2024 refactor, `ER,4.0.0`.
- **Agency**: `IMF.STA`.
- **Frequency**: Daily (representative) + monthly.
- **Key indicators**:
  - `ENDA_XDC_USD_RATE` — SEK per USD (end of period)
  - `ENDE_XDC_EUR_RATE` — SEK per EUR (end of period)
  - `EREER_IX` — real effective exchange rate index
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
