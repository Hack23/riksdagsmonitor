# IMF Indicator ↔ Swedish Policy / Committee Mapping

> Companion to `analysis/worldbank/indicator-policy-mapping.md`.
> Source of truth for which IMF indicator answers which Riksdag
> committee's question. Referenced by `scripts/imf-context.ts` and by
> the Step 2.6 prompt of every `news-*.md` workflow.

---

## Committee → IMF indicator matrix

| Committee | Remit                                  | Primary IMF indicators                                                                                           |
|-----------|----------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| **FiU**   | Finance — macro & budget               | `WEO:NGDP_RPCH` (growth), `WEO:PCPIPCH` (inflation), `WEO:NGDPDPC` (GDP per capita), `WEO:GGXWDG_NGDP` (debt/GDP), `WEO:GGXCNL_NGDP` (fiscal balance), `WEO:GGX_NGDP` (expenditure) |
| **SkU**   | Taxation                               | `WEO:GGR_NGDP` (revenue/GDP), `FM:GGXONLB_NGDP` (primary balance), `WEO:GGXWDG_NGDP` (debt context)              |
| **AU**    | Labour market                          | `WEO:LUR` (unemployment rate)                                                                                     |
| **NU**    | Business / trade                       | `WEO:BCA_NGDPD` (current account), `WEO:TX_RPCH` (exports volume growth)                                          |
| **UU**    | Foreign affairs                        | `WEO:BCA_NGDPD`, `WEO:TX_RPCH`                                                                                    |
| **SoU**   | Health / welfare                       | `WEO:LP` (population), `WEO:NGDPDPC` (per capita context for health-spending share)                               |
| **SfU**   | Social insurance                       | `WEO:LP` (population base), `WEO:LUR`                                                                             |
| **FöU**   | Defence                                | *(IMF does not publish military outlays; use WB MS.MIL.XPND.GD.ZS)*                                              |
| **MJU**   | Environment                            | *(Use WB EN.ATM.CO2E.PC, EG.FEC.RNEW.ZS)*                                                                         |
| **UbU**   | Education                              | *(Use WB SE.XPD.TOTL.GD.ZS)*                                                                                      |
| **KU**    | Constitution / institutions            | *(Use WB WGI — CC.EST, RL.EST, VA.EST, source=75)*                                                                |

## Projection horizons

| Indicator       | Historical back to | Projection to | Released |
|-----------------|--------------------|---------------|----------|
| `WEO:NGDP_RPCH` | 1980               | T+5 (2031)    | Apr/Oct  |
| `WEO:PCPIPCH`   | 1980               | T+5           | Apr/Oct  |
| `WEO:LUR`       | 1980               | T+5           | Apr/Oct  |
| `WEO:GGXWDG_NGDP` | 1995            | T+5           | Apr/Oct  |
| `WEO:GGXCNL_NGDP` | 1995            | T+5           | Apr/Oct  |
| `WEO:BCA_NGDPD` | 1980               | T+5           | Apr/Oct  |
| `FM:GGXONLB_NGDP` | 2000            | T+5           | Apr/Oct  |

---

## How to cite

Commentary MUST use the explicit IMF format so the audit can detect
stale vintages:

> "IMF projects Sweden's general government gross debt at **32.4 %** of
> GDP in **2027** (`WEO Apr-2026, GGXWDG_NGDP`)."

Never use un-attributed forecast phrasing ("Sweden will…", "The economy
is expected to…") — see the banned-phrasings list in
`.github/aw/ECONOMIC_DATA_CONTRACT.md`.
