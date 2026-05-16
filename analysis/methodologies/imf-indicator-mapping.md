# IMF Indicator → Article Type Mapping (Riksdagsmonitor)

> **Authoritative methodology** — canonical reference mapping Riksdagsmonitor news workflow article types to the most-relevant IMF indicators sourced from **WEO**, **Fiscal Monitor**, **IFS**, **BOP**, **GFS_COFOG**, **MFS_IR**, **DOTS**, **PCPS**, and **ER** via the local TypeScript IMF client at `scripts/imf-fetch.ts` (Datamapper JSON base URL `https://www.imf.org/external/datamapper/api/v1`, SDMX 3.0 base URL `https://api.imf.org/external/sdmx/3.0`).
>
> **Effective**: 2026-05-15 · **Version**: 2.2 · **Contract**: [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) v3.0+

---

<!-- BEGIN AI-FIRST METHODOLOGY CARD -->

## 🎯 AI-FIRST Methodology Card

> **🚦 Read this card before writing a single paragraph.** It names the artifact this methodology owns, the gate check it satisfies, the evidence-density target it must hit, and the Pass-1 / Pass-2 discipline required by `.github/copilot-instructions.md` §5 (AI-FIRST Quality Principle).

| Field | Value |
|-------|-------|
| **Purpose** | Canonical mapping from Riksdagsmonitor article types → IMF dataflows (WEO, FM, IFS, BOP, GFS_COFOG, MFS_IR, DOTS, PCPS, ER) — IMF is **PRIMARY for all economic context**. |
| **Inputs** | [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) v3.0; `analysis/imf/indicators-inventory.json`; `scripts/imf-fetch.ts` |
| **Outputs** | `session-baseline.md` IMF tables; economic citations across every artifact |
| **Owning artifact(s)** | Every artifact making an economic claim |
| **Owning gate check** | Economic-data contract enforcement (provider precedence, vintage discipline, banned-phrase block on WB economic codes) |
| **Citation density target** | Every economic claim carries `economicProvenance` (provider=imf|scb, dataflow, indicator, vintage, retrieved_at) |
| **Banned phrases** | Enforced via [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) |
| **Threshold source** | [`reference-quality-thresholds.json`](reference-quality-thresholds.json) → `thresholds[articleType][artifact]` (fallback `defaults.coreArtifactFloor`) |

### ✅ Pass-1 checklist (creation — minimal viable artifact)

- [ ] Use IMF first for macro/fiscal/monetary/external/trade/commodity/FX
- [ ] Vintage discipline: > 6 mo → annotate; current vintage tag `WEO-2026-04`
- [ ] Cross-validate IMF SWE vs SCB; > 0.3 pp delta → editorial review
- [ ] Produce every required sub-section listed in the owning template
- [ ] Add ≥ 1 evidence anchor (`dok_id`, vote id, named MP, or primary-source URL) per analytical claim
- [ ] Apply the correct WEP confidence band for the run's horizon (`72h / week / month / quarter / year / cycle`)
- [ ] Include ≥ 1 themed Mermaid diagram with `style …` or `themeVariables` config (where structurally meaningful)
- [ ] Cross-link the relevant template under `analysis/templates/` and the gate check it satisfies

### 🔁 Pass-2 checklist (read-back & improve — AI-FIRST mandatory)

- [ ] Confirm provider precedence: IMF > SCB > WB (non-economic only)
- [ ] Reject any economic claim citing World Bank for macro / fiscal / monetary / external / trade / commodity / FX
- [ ] Re-read the file end-to-end; flag every claim that lacks an evidence anchor and add one
- [ ] Replace every banned phrase listed in [`political-style-guide.md` §Machine-readable banned-phrase list](political-style-guide.md#machine-readable-banned-phrase-list) with an evidence-anchored alternative
- [ ] Tighten WEP language: never above **likely** without ≥ 3 cycle-aged sources for `year`/`cycle` horizons
- [ ] Strengthen Mermaid (color-coded `style …` directives, `themeVariables`, ≥ 5 nodes where the structure admits it)
- [ ] Add ≥ 1 second-order effect, cui-bono note, or counterfactual where the artifact admits one
- [ ] Verify citation density meets the per-file target below and the gate's evidence-density rules

### 🟢 Exemplar (good — pattern-match this)

> _(economic citation)_ "IMF projects Sweden general-government net lending −0.3 pp vs baseline by 2030 (WEO Apr-2026, `GGXCNL_NGDP/SWE`, retrieved 2026-04-25 from www.imf.org)."

### 🔴 Anti-exemplar (failure mode — never ship this)

> _(failure mode)_ "Sweden's GDP growth is expected to be modest." — no provider, no dataflow, no indicator, no vintage. **OR** citing World Bank for GDP — provider violation.

### 🔗 Cross-links

- **Template(s)**: `analysis/templates/session-baseline.md` (IMF tables), `analysis/templates/comparative-international.md`
- **Gate check**: [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md#checks-all-must-pass)
- **AI-FIRST canon**: [`.github/copilot-instructions.md` §5](../../.github/copilot-instructions.md) · [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md)
- **Style canon**: [`political-style-guide.md`](political-style-guide.md) · [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md)
- **Catalog row**: [`artifact-catalog.md`](artifact-catalog.md)

<!-- END AI-FIRST METHODOLOGY CARD -->

---


## 0 · TL;DR

- **IMF is PRIMARY for all economic context** — macro, fiscal, monetary, external sector, bilateral trade, government-by-function spending, commodity benchmarks, exchange rates.
- **World Bank is PRIMARY for non-economic residue only** — governance (WGI `source=75`), environment, social / education participation, defence historicals, crime / rule of law.
- **SCB remains primary for Swedish-specific ground truth** — monthly KPIF, AKU labour, regional / municipal, budget execution.
- **No IMF MCP server** — access via `tsx scripts/imf-fetch.ts …` from the `bash` tool. Firewall egress: `data.imf.org`, `api.imf.org`, `www.imf.org`.
- **Projections MUST carry a vintage tag** — `(WEO Apr-2026, GGXWDG_NGDP)`. Current vintage: `WEO-2026-04`.
- Companions: [`analysis/imf/README.md`](../imf/README.md) · [`analysis/imf/indicators-inventory.json`](../imf/indicators-inventory.json) · [`analysis/imf/data-dictionary.md`](../imf/data-dictionary.md) · [`analysis/imf/agentic-integration.md`](../imf/agentic-integration.md) · [`analysis/imf/indicator-policy-mapping.md`](../imf/indicator-policy-mapping.md) · [`analysis/imf/use-cases.md`](../imf/use-cases.md).

---

## 1 · Provider decision matrix

The following rule is non-negotiable — every economic claim routes through IMF in any role (primary, secondary, fallback, historical). World Bank is consulted only for the non-economic residue.

| Claim class | Primary | Secondary | Forbidden (NEVER use, in any role) |
|-------------|---------|-----------|-------------------------------------|
| Real GDP growth | `WEO:NGDP_RPCH` [proj T+5] | SCB QNA | `WB:NY.GDP.MKTP.KD.ZG` |
| Nominal GDP (USD) | `WEO:NGDPD` [proj] | — | `WB:NY.GDP.MKTP.CD` |
| GDP per capita | `WEO:NGDPDPC` / `WEO:PPPPC` [proj] | — | `WB:NY.GDP.PCAP.CD` |
| Annual inflation | `WEO:PCPIPCH` / `WEO:PCPIEPCH` [proj] | — | `WB:FP.CPI.TOTL.ZG` |
| Monthly inflation (high-freq) | `IFS:PCPI_IX` | SCB KPIF | — |
| Unemployment (annual) | `WEO:LUR` [proj] | SCB AKU | `WB:SL.UEM.TOTL.ZS` |
| Gross public debt | `WEO:GGXWDG_NGDP` [proj] | `FM:GGXWDG_NGDP` | `WB:GC.DOD.TOTL.GD.ZS` |
| Fiscal balance | `WEO:GGXCNL_NGDP` [proj] | `FM:GGXCNLB_NGDP` | — |
| Primary balance | `FM:GGXONLB_NGDP` [proj] | — | — |
| Cyclically-adjusted balance | `FM:GGSB_NPGDP` [proj] | — | — |
| Revenue / GDP | `WEO:GGR_NGDP` [proj] | — | `WB:GC.REV.XGRT.GD.ZS` |
| Expenditure / GDP | `WEO:GGX_NGDP` [proj] | — | `WB:GC.XPN.TOTL.GD.ZS` |
| Current account | `WEO:BCA_NGDPD` [proj] | BOP detail | `WB:BN.CAB.XOKA.GD.ZS` |
| Exports volume growth | `WEO:TX_RPCH` [proj] | — | `WB:NE.EXP.GNFS.ZS` |
| Imports volume growth | `WEO:TM_RPCH` [proj] | — | — |
| Bilateral trade flows | `DOTS:TXG_FOB_USD`, `DOTS:TMG_CIF_USD` | — | — |
| Policy rate (Riksbank) | `MFS_IR:FPOLM_PA` | Riksbank press releases | — |
| Exchange rate | `ER:ENDA_XDC_USD_RATE`, `ER:ENDE_XDC_EUR_RATE` | Riksbank | — |
| Commodity prices (oil, all-commodities) | `PCPS:POILAPSP`, `PCPS:PALLFNF` | — | — |
| COFOG defence spending (function 02) | `GFS_COFOG:GF02_T` | WB `MS.MIL.XPND.GD.ZS` | — |
| COFOG health spending (function 07) | `GFS_COFOG:GF07_T` | WB `SH.XPD.CHEX.GD.ZS` | — |
| COFOG education spending (function 09) | `GFS_COFOG:GF09_T` | WB `SE.XPD.TOTL.GD.ZS` | — |
| COFOG social protection (function 10) | `GFS_COFOG:GF10_T` | — | — |
| Population (projection) | `WEO:LP` [proj] | SCB | `WB:SP.POP.TOTL` |
| Governance (rule of law, control of corruption, voice & accountability) | **WB WGI** `source=75` | — | IMF has no equivalent |
| Environment (CO₂, renewables, forest) | **WB** `EN.*`, `EG.*`, `AG.LND.FRST.ZS` | — | IMF has no equivalent |
| Education participation | **WB** `SE.PRM.ENRR`, `SE.TER.ENRR` | — | — |
| Crime / homicide | **WB** `VC.IHR.PSRC.P5` | — | — |

[proj] = publishes T+5 projections.

---

## 2 · IMF dataflow catalogue (complete)

See [`analysis/imf/data-dictionary.md`](../imf/data-dictionary.md) for the full reference. Summary:

| Dataflow | Transport | Scope | Frequency | Projections |
|----------|-----------|-------|-----------|-------------|
| `WEO` | Datamapper + SDMX | Macro + fiscal + external | Annual | T+5 |
| `FM` | Datamapper + SDMX | Deep fiscal (DSA, primary, cyclically-adjusted) | Annual | T+5 |
| `IFS` | SDMX | Monetary + high-frequency CPI / rates | Monthly | — |
| `BOP / BOP_AGG` | SDMX | External sector detail (BPM6) | Quarterly | — |
| `GFS_COFOG` | SDMX | Government expenditure by function | Annual (T+1) | — |
| `MFS_IR` | SDMX | Interest rates (policy, deposit, lending) | Monthly | — |
| `DOTS` | SDMX | Bilateral trade flows | Monthly | — |
| `PCPS` | SDMX | Primary commodity prices | Monthly | — |
| `ER` | SDMX | Exchange rates (nominal, REER) | Daily / Monthly | — |

---

## 3 · Country / aggregate codes

| Purpose | IMF code | Transport | Notes |
|---------|----------|-----------|-------|
| Sweden | `SWE` (Datamapper, WEO SDMX) / `144` (GFS/BOP SDMX) / `SE` (IFS SDMX some sub-dataflows) | ISO-3 / IMF AREA / ISO-2 | Use `scripts/imf-codes.ts → toImfAreaCode()` |
| Nordic peers | `DNK`, `NOR`, `FIN`, `ISL` | same | Standard peer set |
| Germany (EU benchmark) | `DEU` / `134` | same | |
| EU aggregate | `EU` (WEO) | Datamapper/SDMX | ≠ WB `EUU` |
| Euro Area | `EURO` (Datamapper) / `EA` (SDMX) | Datamapper/SDMX | ≠ WB `EMU` |
| G7 / G20 / AE | `G7`, `G20`, `AE` | WEO | |
| World | `WORLD` (Datamapper) / `W0` (SDMX) | | |

> **Mixing rule**: Never combine `WB:EUU` and `IMF:EU` aggregates on the same chart — they have different methodologies and country sets. Use one provider per chart.

---

## 4 · Article type → indicator matrix

| Article type | Required IMF | Optional overlay | WB role |
|--------------|--------------|------------------|--------|
| `propositions` (budget / finance) | `WEO:NGDP_RPCH`, `WEO:PCPIPCH`, `WEO:GGXWDG_NGDP`, `WEO:GGXCNL_NGDP` | `FM:GGXONLB_NGDP`, `IFS:PCPI_IX`, `ER:ENDE_XDC_EUR_RATE` | WGI if governance angle, WB sectorals for implementation |
| `propositions` (tax / SkU) | `WEO:GGR_NGDP`, `FM:GGXONLB_NGDP`, `FM:GGSB_NPGDP` | `WEO:GGXWDG_NGDP` | — |
| `propositions` (trade / NU / UU) | `WEO:BCA_NGDPD`, `WEO:TX_RPCH`, `DOTS:TXG_FOB_USD` | `PCPS:POILAPSP` | — |
| `motions` (economy) | 1 of `WEO:NGDP_RPCH` / `WEO:PCPIPCH` / `WEO:LUR` | — | Sectoral WB for policy feasibility |
| `committee-reports` (FiU) | Full macro+fiscal bundle | `IFS:PCPI_IX`, `MFS_IR:FPOLM_PA` | — |
| `committee-reports` (NU) | `WEO:BCA_NGDPD`, `WEO:TX_RPCH` | `DOTS` bilateral | — |
| `committee-reports` (SkU) | `WEO:GGR_NGDP`, `FM:GGXONLB_NGDP` | — | — |
| `committee-reports` (AU) | `WEO:LUR`, `WEO:LE` | SCB AKU | — |
| `committee-reports` (SoU) | `GFS_COFOG:GF07_T`, `WEO:LP` | — | `SH.XPD.CHEX.GD.ZS`, `SH.MED.PHYS.ZS` |
| `committee-reports` (SfU) | `GFS_COFOG:GF10_T`, `WEO:LP`, `WEO:LUR` | — | — |
| `committee-reports` (FöU) | `GFS_COFOG:GF02_T` | — | `MS.MIL.XPND.GD.ZS` (historical) |
| `committee-reports` (MJU) | `PCPS:POILAPSP` (if energy) | — | `EN.ATM.CO2E.PC`, `EG.FEC.RNEW.ZS`, `AG.LND.FRST.ZS` **primary** |
| `committee-reports` (UbU) | `GFS_COFOG:GF09_T` | — | `SE.XPD.TOTL.GD.ZS`, `SE.PRM.ENRR` |
| `committee-reports` (KU) | — | — | **WB WGI primary** (`source=75`) |
| `interpellations` (macro) | `WEO:PCPIPCH`, `WEO:LUR` | `IFS:PCPI_IX`, `MFS_IR:FPOLM_PA` | — |
| `evening-analysis` | WEO delta since previous publication | `MFS_IR:FPOLM_PA`, `ER:*` if rate-decision day | — |
| `realtime-monitor` | 1 WEO indicator for context | `MFS_IR:FPOLM_PA`, `ER:*` if Riksbank / ECB news | — |
| `week-ahead` | Forecast table — `NGDP_RPCH`, `PCPIPCH`, `GGXWDG_NGDP` | Riksbank calendar | — |
| `month-ahead` | Full `WEO` + `FM` projection bundle | — | Sectoral WB for non-economic agenda |
| `weekly-review` | Period-over-period WEO + FM | `IFS:PCPI_IX`, `MFS_IR:FPOLM_PA`, `ER:*` | — |
| `monthly-review` | Full Nordic compare for `NGDP_RPCH`, `PCPIPCH`, `LUR`, `GGXWDG_NGDP`, `GGXCNL_NGDP`, `BCA_NGDPD` | `DOTS` bilateral, `PCPS` commodity | WB WGI snapshot, environment overlay |
| `article-generator` (any) | Per dominant committee above | — | Per committee above |
| `translate` | — (no new research) | — | — |

---

## 5 · Citation canon

Every IMF figure cited in an artifact MUST conform to one of these patterns.

### Projection (WEO/FM) — vintage tag MANDATORY

```
"IMF projects Sweden's general government gross debt at **32.4 %** of GDP in
**2027** (`WEO Apr-2026, GGXWDG_NGDP`)."
```

### Historical — vintage recommended for extrema

```
"Sweden's debt/GDP peaked at **38 %** in 2022 (`WEO:GGXWDG_NGDP`)."
```

### High-frequency — frequency tag

```
"Sweden's HICP reached **109.4** (2010=100) in March 2026 (`IFS:PCPI_IX`, monthly)."
```

### Bilateral trade — partner + frequency

```
"Swedish goods exports to Russia collapsed **92 %** between Q4-2021 and Q4-2023
(`DOTS:TXG_FOB_USD`, monthly)."
```

### Admiralty grade

Every citation in `source-log.md` / `evidence-register.md` must include an Admiralty code:

- IMF WEO / FM (flagship): **A1**
- IMF IFS, MFS_IR, DOTS, PCPS, ER: **A1** (authoritative primary)
- IMF WEO `LUR` when adjacent to SCB AKU: **A2** (minor methodology divergence)

---

## 6 · Vintage handling

### 6.1 Current vintage

`WEO-2026-04` (April 2026 flagship) — valid until the October 2026 flagship ships.

### 6.2 Cut-over discipline

When a new flagship is published (April / October):

1. Update `DEFAULT_WEO_VINTAGE` in `scripts/imf-client.ts`.
2. Update `vintageDiscipline.current` in `analysis/imf/indicators-inventory.json`.
3. Update banner in `analysis/imf/README.md`.
4. Add row to release calendar in `analysis/imf/data-dictionary.md` § 4.

Ship all four in **one PR** titled `chore(imf): cut over to WEO-YYYY-MM vintage`.

### 6.3 Cross-run vintage drift

When a new run lands after a WEO cut-over:

- Compare previous-run vintage vs current vintage in [`cross-run-diff.md`](../templates/cross-run-diff.md).
- Flag any headline indicator whose projection shifted by > 0.5 pp with a `[VINTAGE-DELTA]` annotation.
- Update the commentary to the new vintage; do not leave the article quoting the old vintage silently.

### 6.4 Stale-vintage warning

A projection citation whose vintage tag is **> 6 months old** relative to article date triggers a warning annotation in [`methodology-reflection.md`](../templates/methodology-reflection.md):

> ⚠️ Stale vintage — commentary cites `(WEO Oct-2025, GGXWDG_NGDP)` but current vintage is WEO-2026-04. Re-fetch and re-cite before publish.

---

## 7 · Economic Data Contract integration

All Chart.js specifications for charts fed by IMF data live in [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) v3.0+. Key points:

- `economic-data.json` is the single source of truth the static site consumes.
- `source.imf[]` MUST be non-empty for any article with an economic-context section.
- Footer attribution reads `Data by IMF / SCB` for IMF-primary articles, or `Data by IMF / World Bank / SCB` when WB governance/environment data is also cited.
- Every `dataPoints[].projection=true` entry MUST carry `projectionVintage`.

---

## 8 · Anti-patterns (gate failures, hard-stop)

| Anti-pattern | Why it fails | Fix |
|--------------|--------------|-----|
| Quoting `WB:NY.GDP.MKTP.KD.ZG` as primary macro citation | IMF WEO is authoritative + fresher + has projections | Replace with `WEO:NGDP_RPCH` |
| Projection citation without vintage tag | Audit cannot detect stale values | Add `(WEO Apr-2026, CODE)` |
| Forecast phrasing without citation ("Sweden will grow at 2 %") | Banned in ECONOMIC_DATA_CONTRACT § 6 | Rewrite as "IMF projects Sweden's real GDP growth at 2.3 % in 2027 (`WEO Apr-2026, NGDP_RPCH`)" |
| Mixing `WB:EUU` and `IMF:EU` on the same chart | Different methodologies / country sets | Use one provider per chart |
| Parallel `weo --country X` × N calls | Breaches rate limit | Use `compare --countries SWE,DNK,NOR,FIN,DEU` |
| Running IMF as an MCP server | Architecture violation — IMF is CLI-via-`bash` | Remove from MCP config, use `tsx scripts/imf-fetch.ts …` |
| Forecast series beyond T+5 | Out of WEO horizon | Cap at 5 years ahead of latest flagship |
| Missing Admiralty grade in `evidence-register.md` | Fails gate Check 4 (`05-analysis-gate.md`) | Add `[A1]` or `[A2]` |
| Combining WEO annual with IFS monthly on same time axis without annotation | Chart misleads — different frequencies | Add resampling annotation in chart caption |

---

## 9 · Enforcement

The evidence-host regex in [`.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) Check 4 accepts `api.imf.org`, `data.imf.org`, `www.imf.org` as primary-source URL hosts. IMF citations alone are sufficient to pass the gate. (The gate does not yet block WB economic codes in new articles — this is advisory methodology until a follow-up automated lint is added.)

---

## 10 · Machine-readable sources

- [`analysis/imf/indicators-inventory.json`](../imf/indicators-inventory.json) — full indicator catalogue, committee matrix, non-economic scope policy, vintage discipline.
- [`analysis/economic-indicators-inventory.json`](../economic-indicators-inventory.json) v4.1 — multi-provider pointer.
- [`scripts/imf-context.ts`](../../scripts/imf-context.ts) — programmatic lookups (`findImfIndicatorsForCommittee`, `findImfIndicatorsForDomains`, `imfCitation`).

---

## 11 · Changelog

- **v2.2 (2026-05-15)** — Version alignment pass: date updated to 2026-05-15; changelog entry added.
- **v2.0 (2026-04-24)** — Full rewrite. IMF set as the source for every economic claim across all domains. Added complete dataflow catalogue (9 dataflows), deep committee matrix (including KrU/TU/CU/JuU), vintage-discipline canon, enforcement & anti-patterns. Cross-references every companion doc in `analysis/imf/`.
- **v1.0 (2026-04-23)** — Initial Wave-2 IMF↔WB split; adapted from EU Parliament Monitor.
