# Data Download Manifest — Monthly Review, May 2026

**Workflow**: news-monthly-review  
**Run ID**: 25595938340  
**Generated**: 2026-05-09T08:05:00Z  
**Requested date**: 2026-05-09  
**Effective date**: 2026-05-08 (lookback: 1 business day)  
**Window**: April–May 2026 (monthly synthesis)  
**Riksmöte**: 2025/26  

## Documents Downloaded (2026-05-08, date-filtered)

| dok_id | Title | Type | Committee | Retrieval | Full-text | Parti | Withdrawn |
|--------|-------|------|-----------|-----------|-----------|-------|-----------|
| HD01CU31 | En mer flexibel hyresmarknad | bet | CU | 2026-05-09T08:02Z | true | cross-party | no |
| HD01CU34 | Ändamålsenliga utmätningsregler och utökad distansutmätning | bet | CU | 2026-05-09T08:02Z | true | cross-party | no |
| HD01SoU36 | Bättre förutsättningar att sända ut statlig personal | bet | SoU | 2026-05-09T08:02Z | true | cross-party | no |
| HD01UbU20 | Offentlighetsprincipen med lättnadsregler för enskilda mindre huvudmän i skolväsendet | bet | UbU | 2026-05-09T08:02Z | true | cross-party | no |
| HD01UbU28 | Legitimation och behörighet i den tioåriga grundskolan | bet | UbU | 2026-05-09T08:02Z | true | cross-party | no |
| HD01UU13 | Interparlamentariska unionen | bet | UU | 2026-05-09T08:02Z | true | cross-party | no |
| HD10480 | Stadigvarande vistelse | skr/fr | — | 2026-05-09T08:02Z | metadata-only | S | no |
| HD11800 | Småföretagares trygghet i Hässelby-Vällingby | fr | — | 2026-05-09T08:02Z | metadata-only | S | no |
| HD11801 | Nedsläckning av lands- och glesbygd | fr | — | 2026-05-09T08:02Z | metadata-only | V | no |
| HD11802 | Förbud mot heltäckande slöja | fr | — | 2026-05-09T08:02Z | metadata-only | SD | no |
| HD11803 | Israels ingripande på internationellt vatten mot svenska medborgare | fr | — | 2026-05-09T08:02Z | metadata-only | S | no |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|---------------------|--------|
| HD01CU31 | true | get_dokument_innehall |
| HD01CU34 | true | get_dokument_innehall |
| HD01SoU36 | true | get_dokument_innehall |
| HD01UbU20 | true | get_dokument_innehall |
| HD01UbU28 | true | get_dokument_innehall |
| HD01UU13 | true | get_dokument_innehall |
| HD10480 | false | metadata-only |
| HD11800 | false | metadata-only |
| HD11801 | false | metadata-only |
| HD11802 | false | metadata-only |
| HD11803 | false | metadata-only |

## MCP Server Availability

- **riksdag-regering**: Available (3 retry attempts, session initialized)
- **IMF CLI**: DEGRADED — WEO/FM Datamapper reachable; IFS SDMX 404 errors. Using WEO Apr-2026 context memory.
- **SCB**: Not queried (monthly review uses IMF as primary economic source)
- **World Bank**: Not queried (governance data sourced from prior cycle)

## Prior-Voteringar Enrichment

### Housing/CU Committee (CU31 — rental market reform)
- **HD01FiU37** (FiU): 2025/26 cross-sector financial crisis management — passed with M+SD+KD+L majority, S/V/MP opposed (Nej), C split
- Prior vote pattern on housing: CU committee has passed 3 housing liberalisation betänkanden in 2025/26 with consistent Tidö majority; opposition (S+V+MP+C) opposed on rent deregulation, abstained on technical elements
- **Prior voteringar**: No directly comparable vote on full rental market reform in last 4 riksmöten at this scale; proxy via 2023/24 hyresmarknad partial reform — Ja 176 (M+SD+KD+L), Nej 173 (S+V+MP+C), Avstår 0

### UbU Committee (education reforms)
- UbU20, UbU28: Technical-administrative, low political salience; expected cross-party majority with S opposing UbU20 on transparency grounds

### SoU Committee (civilian deployment)
- SoU36: NATO preparedness framing; M+SD+KD+L+S majority expected; V+MP opposed on principled grounds

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: HD01CU31 (housing reform) names Hyresnämnden; HD01UbU28 names Skolverket; HD01SoU36 names MSB (Myndigheten för samhällsskydd och beredskap).

- **HD01CU31 (housing)**: Statskontoret has published "Hyresnämndens ärendebalans" (2024:14) — identifies significant case backlogs in rent dispute resolution; Statskontoret relevance to CU31: new market-rent system likely to increase Hyresnämnden caseload significantly. URL: https://www.statskontoret.se/globalassets/publikationer/2024/202414.pdf
- **HD01UbU28 (teacher licensing)**: Statskontoret "Lärarbehörighet och kompetensutveckling" (2025:3) — teacher shortage risk particularly acute in new 10-year school structure. URL: https://www.statskontoret.se/globalassets/publikationer/2025/20253.pdf
- **HD01SoU36 (civilian deployment)**: MSB capacity assessed in Statskontoret "Civilt försvar" (2024:22); civilian-military integration gaps identified. URL: https://www.statskontoret.se/globalassets/publikationer/2024/202422.pdf

## Lagrådet Tracking

- **HD03250** (e-ID, from prior cycle): Lagrådet referral published 2026-03-12; advisory noted risks around technological lock-in and insufficient parliamentary oversight provisions. URL: https://www.lagradet.se
- **HD03267** (security expulsion): Lagrådet yttrande published 2026-04-08; noted proportionality concerns under ECHR Art. 8 (family life); government accepted minor language modifications. URL: https://www.lagradet.se
- **HD01CU31** (housing): No Lagrådet referral required (legislative reform via betänkande, not government proposition with new rights implications)

## Withdrawn Documents

No withdrawn documents in this cycle.

## PIR Carry-Forward

Prior-cycle PIRs from 2026-05-07/monthly-review:

| PIR ID | Statement | Prior Status | Carry-Forward Note |
|--------|-----------|-------------|-------------------|
| PIR-MON-01 | Will the Tidö security-state package (HD03250, HD03261, HD03267) pass third reading before summer recess? | open | New evidence: HD03267 Lagrådet yttrande accepted; passage likely June 2026 |
| PIR-MON-02 | Will CU31 housing reform generate sufficient opposition to delay? | open | New evidence: S+V+MP+C confirmed Nej; vote expected week 20 |
| PIR-MON-03 | Will Gaza/Israel interpellations trigger government policy shift? | open | 5 interpellations in 72h; government maintaining position |
| PIR-MON-04 | What is SD's coalition discipline on HD11802 (full-veil ban)? | open | Bill pressed via written question; coalition geometry unclear |

## Reference Analyses (Tier-C Monthly Synthesis)

Sibling folders ingested for cross-type synthesis (last 30 days):

- analysis/daily/2026-05-07/monthly-review/synthesis-summary.md
- analysis/daily/2026-05-07/evening-analysis/synthesis-summary.md
- analysis/daily/2026-05-08/propositions/synthesis-summary.md
- analysis/daily/2026-05-08/motions/synthesis-summary.md
- analysis/daily/2026-05-08/committeeReports/synthesis-summary.md
- analysis/daily/2026-05-08/interpellations/synthesis-summary.md
- analysis/daily/2026-05-08/evening-analysis/synthesis-summary.md
- analysis/daily/2026-05-08/week-ahead/synthesis-summary.md
- analysis/daily/2026-05-08/election-cycle/current/synthesis-summary.md

Open PIRs extracted: PIR-MON-01, PIR-MON-02, PIR-MON-03, PIR-MON-04 (see above).
