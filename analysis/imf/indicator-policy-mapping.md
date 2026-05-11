# IMF Indicator ↔ Swedish Policy / Committee Mapping

> Authoritative committee → IMF indicator map. Referenced by [`scripts/imf-context.ts`](../../scripts/imf-context.ts), the Step 2.6 prompt of every `.github/workflows/news-*.md` workflow, and the per-committee analysis templates.
>
> **Companion docs**: [`README.md`](README.md) · [`indicators-inventory.json`](indicators-inventory.json) (machine-readable) · [`data-dictionary.md`](data-dictionary.md) · [`agentic-integration.md`](agentic-integration.md) · [`use-cases.md`](use-cases.md) · [`worldbank/indicator-policy-mapping.md`](../worldbank/indicator-policy-mapping.md) (non-economic residue).

---

## 1 · Committee → IMF indicator matrix

Format key: `DATABASE:CODE` (e.g. `WEO:NGDP_RPCH`, `FM:GGXONLB_NGDP`, `GFS_COFOG:GF02_T`). `[projection]` flags indicators that publish T+5 projections.

| Committee | Remit | IMF role | Primary indicators | Secondary / supporting |
|-----------|-------|----------|---------------------|------------------------|
| **FiU** | Finance — macro & budget | **IMF primary** | `WEO:NGDP_RPCH` [proj] (growth) · `WEO:PCPIPCH` [proj] (inflation) · `WEO:NGDPDPC` [proj] (GDP per capita) · `WEO:GGXWDG_NGDP` [proj] (debt/GDP) · `WEO:GGXCNL_NGDP` [proj] (fiscal balance) · `WEO:GGX_NGDP` [proj] (expenditure) · `FM:GGXONLB_NGDP` [proj] (primary balance) | `WEO:PPPPC` [proj] (GDP per capita PPP) · `CPI:_T.IX` (monthly CPI) · `ER:USD_XDC.PA_RT` (SEK/USD) |
| **SkU** | Taxation | **IMF primary** | `WEO:GGR_NGDP` [proj] (revenue/GDP) · `FM:GGXONLB_NGDP` [proj] (primary balance) · `FM:GGSB_NPGDP` [proj] (cyclically-adjusted) · `WEO:GGXWDG_NGDP` [proj] (debt context) | `WEO:GGX_NGDP` [proj] |
| **AU** | Labour market | **IMF + SCB** | `WEO:LUR` [proj] (unemployment rate) · `WEO:LE` [proj] (employment) | SCB AKU (preferred for Swedish-specific) · `WEO:NGDPDPC` [proj] |
| **NU** | Business & trade | **IMF primary** | `WEO:BCA_NGDPD` [proj] (current account) · `WEO:TX_RPCH` [proj] (exports growth) · `WEO:TM_RPCH` [proj] (imports growth) · `IMTS:XG_FOB_USD` (bilateral exports) · `IMTS:MG_CIF_USD` (bilateral imports) | `PCPS:POILAPSP` (oil — export competitiveness) |
| **UU** | Foreign affairs | **IMF primary** | `WEO:BCA_NGDPD` [proj] · `WEO:TX_RPCH` [proj] · `IMTS:XG_FOB_USD` (partner-country exports) · `IMTS:MG_CIF_USD` (partner-country imports) | — |
| **SoU** | Health & welfare | **IMF + WB** | `GFS_COFOG:GF07_T` (health spending / GDP) · `WEO:LP` [proj] (population) · `WEO:NGDPDPC` [proj] (per-capita context) | WB `SH.XPD.CHEX.GD.ZS`, `SH.MED.PHYS.ZS`, `SH.MED.BEDS.ZS` |
| **SfU** | Social insurance | **IMF + WB** | `GFS_COFOG:GF10_T` (social protection) · `WEO:LP` [proj] · `WEO:LUR` [proj] | WB social-residue indicators |
| **FöU** | Defence | **IMF + WB** | `GFS_COFOG:GF02_T` (defence spending / GDP) | WB `MS.MIL.XPND.GD.ZS` (historical) · `MS.MIL.XPND.CD` |
| **MJU** | Environment | **WB primary (IMF overlay)** | `PCPS:POILAPSP` (oil — energy transition) · `PCPS:PALLFNF` (commodity index) | WB `EN.ATM.CO2E.PC`, `EG.FEC.RNEW.ZS`, `AG.LND.FRST.ZS` |
| **UbU** | Education | **IMF + WB** | `GFS_COFOG:GF09_T` (education spending / GDP) | WB `SE.XPD.TOTL.GD.ZS`, `SE.PRM.ENRR`, `SE.TER.ENRR` |
| **KU** | Constitution / institutions | **WB only (WGI)** | — | WB `CC.EST`, `RL.EST`, `VA.EST`, `GE.EST`, `RQ.EST`, `PV.EST` (all source=75) |
| **JuU** | Justice / rule of law | **WB only** | — | WB `VC.IHR.PSRC.P5`, `IQ.CPA.TRAN.XQ`, WGI |
| **KrU** | Culture | **—** | — | WB `SL.UEM.TOTL.ZS` (sector-specific), `SM.POP.TOTL` |
| **TU** | Transport | **IMF + WB** | `WEO:NGDP_RPCH` [proj] (growth context) | WB `IS.ROD.TOTL.KM`, `IS.RRS.TOTL.KM` |
| **CU** | Civil affairs / housing | **IMF + WB** | `GFS_COFOG:GF10_T` | WB housing indicators |

> **Convention**: When IMF and SCB both cover a Swedish indicator (typically unemployment, inflation), IMF is primary for **cross-country comparison**, SCB is primary for **Swedish-specific ground truth**. Article commentary may cite both with the methodology difference annotated — see `data-dictionary.md` § 5.5.

---

## 2 · Projection horizons

| Indicator | Historical back to | Projection to (WEO Apr-2026 vintage) | Released |
|-----------|--------------------|--------------------------------------|----------|
| `WEO:NGDP_RPCH` | 1980 | 2031 | Apr/Oct |
| `WEO:NGDPD` | 1980 | 2031 | Apr/Oct |
| `WEO:NGDPDPC` | 1980 | 2031 | Apr/Oct |
| `WEO:PCPIPCH` | 1980 | 2031 | Apr/Oct |
| `WEO:PCPIEPCH` | 1980 | 2031 | Apr/Oct |
| `WEO:LUR` | 1980 | 2031 | Apr/Oct |
| `WEO:LE` | 1980 | 2031 | Apr/Oct |
| `WEO:LP` | 1980 | 2031 | Apr/Oct |
| `WEO:GGXWDG_NGDP` | 1995 | 2031 | Apr/Oct |
| `WEO:GGR_NGDP` | 1995 | 2031 | Apr/Oct |
| `WEO:GGX_NGDP` | 1995 | 2031 | Apr/Oct |
| `WEO:GGXCNL_NGDP` | 1995 | 2031 | Apr/Oct |
| `WEO:BCA_NGDPD` | 1980 | 2031 | Apr/Oct |
| `WEO:TX_RPCH` / `TM_RPCH` | 1980 | 2031 | Apr/Oct |
| `FM:GGXONLB_NGDP` | 2000 | 2031 | Apr/Oct |
| `FM:GGSB_NPGDP` | 2000 | 2031 | Apr/Oct |
| `CPI:_T.IX` | 1950s | — (historical only) | Monthly |
| `MFS_IR:MMRT_RT_PT_A_PT` | 1993 | — | Monthly |
| `GFS_COFOG:GF02_T/07/09/10` | 1995 | — (T+1 annual) | Annual |
| `IMTS:XG_FOB_USD` | 1980 | — | Monthly |
| `PCPS:POILAPSP` | 1980 | — | Monthly |

---

## 3 · How to cite (audit-grade)

**Projection** (WEO/FM only — must include vintage tag):

> "IMF projects Sweden's general government gross debt at **32.4 %** of GDP in **2027** (`WEO Apr-2026, GGXWDG_NGDP`)."

**Historical** (WEO/FM — vintage recommended for extraordinary values, optional otherwise):

> "Sweden's debt/GDP peaked at 38 % in 2022 (`WEO:GGXWDG_NGDP`)."

**High-frequency** (IFS, MFS_IR, DOTS, PCPS, ER):

> "Sweden's HICP reached 109.4 (2010=100) in March 2026 (`CPI:_T.IX`, monthly)."
>
> "Brent crude averaged USD 82/bbl in March 2026 (`PCPS:POILAPSP`)."

**Bilateral trade** (DOTS):

> "Swedish goods exports to Russia collapsed 92 % between 2021-Q4 and 2023-Q4 (`IMTS:XG_FOB_USD`)."

**Never use** un-attributed forecast phrasing:
- ❌ "Sweden will grow at 2 % in 2027"
- ❌ "The economy is expected to reach 2 %"
- ✅ "IMF projects Sweden's real GDP growth at **2.3 %** in 2027 (`WEO Apr-2026, NGDP_RPCH`)"

See banned-phrasings list in [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) § 6.

---

## 4 · Disambiguation — WEO vs FM for same code

The code `GGXWDG_NGDP` exists in both WEO and FM, and can differ by up to ~1 pp in the same year due to different cutoff dates and revision policies. Rule:

- **Headline macro article** → cite WEO: `(WEO Apr-2026, GGXWDG_NGDP)`
- **Debt-sustainability / cyclically-adjusted analysis** → cite FM: `(FM Apr-2026, GGXWDG_NGDP)` or use FM-exclusive codes like `GGXONLB_NGDP`, `GGSB_NPGDP`.

When both are cited in the same article, always qualify with the database prefix so the audit can reconcile.

---

## 5 · Cross-provider coverage — committees with NO IMF primary

- **KU** (constitution / institutions) — IMF has no governance indicator. WB WGI (`CC.EST`, `RL.EST`, `VA.EST`, `GE.EST`, `RQ.EST`, `PV.EST`, all `source=75`) is authoritative. Commentary is historical only (WGI publishes no projections).
- **JuU** (justice / rule of law) — Same as KU. Plus `VC.IHR.PSRC.P5` for homicide rates.
- **KrU** (culture) — IMF does not decompose culture spending. WB sector data or SCB for Swedish cultural budget execution.
- **MJU** (environment) — WB primary for emissions, renewables, forests. IMF PCPS overlay for commodity-price context in energy-policy articles.

Articles touching these committees will have `source.imf: []` in their `economic-data.json`. This is valid and expected — the validator does **not** require a non-empty IMF source, only that IMF is consulted first whenever the article class is one IMF covers (macro/fiscal/monetary/external).

---

## 6 · Machine-readable lookup

```bash
# Human: browse the authoritative committee matrix
cat analysis/imf/indicators-inventory.json | jq '.committeeMatrix'

# Agent: programmatic lookup in TypeScript
import { findImfIndicatorsForCommittee, findImfIndicatorsForDomains } from '../../scripts/imf-context.js';
const forFiU = findImfIndicatorsForCommittee('FiU');
const forDomain = findImfIndicatorsForDomains(['fiscal policy', 'debt']);
```

---

## 7 · Related

- [`README.md`](README.md) · overview + adoption strategy
- [`indicators-inventory.json`](indicators-inventory.json) · full machine-readable catalogue
- [`data-dictionary.md`](data-dictionary.md) · dataflow / dimension / vintage reference
- [`agentic-integration.md`](agentic-integration.md) · 7-step integration playbook
- [`use-cases.md`](use-cases.md) · canonical article examples
- [`analysis/methodologies/imf-indicator-mapping.md`](../methodologies/imf-indicator-mapping.md) · authoritative methodology
- [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) · validator contract
