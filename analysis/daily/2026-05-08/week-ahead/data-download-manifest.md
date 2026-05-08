# Data Download Manifest — Week-Ahead 2026-05-08

**Workflow**: news-week-ahead
**Run ID**: 25544675528
**Generated**: 2026-05-08T08:15:00Z
**Requested date**: 2026-05-08
**Effective date**: 2026-05-08
**Window**: riksmöte 2025/26
**Riksdag MCP status**: live (get_sync_status confirmed)
**IMF status**: degraded (WEO/FM Datamapper ok; IFS SDMX 404)

## Documents (6 retrieved, date-filtered from 180)

| dok_id | Title | Type | Committee | Date | Full-text | Parti | Withdrawn |
|--------|-------|------|-----------|------|-----------|-------|-----------|
| HD01UbU28 | Legitimation och behörighet i den tioåriga grundskolan | bet (betänkande) | UbU | 2026-05-08 | yes | — | no |
| HD10480 | Stadigvarande vistelse (interpellation) | ip | — | 2026-05-08 | yes | S | no |
| HD11800 | Småföretagares trygghet i Hässelby-Vällingby (fråga) | fr | — | 2026-05-08 | yes | S | no |
| HD11801 | Nedsläckning av lands- och glesbygd (fråga) | fr | — | 2026-05-08 | yes | V | no |
| HD11802 | Förbud mot heltäckande slöja (fråga) | fr | — | 2026-05-08 | yes | SD | no |
| HD11803 | Israels ingripande på internationellt vatten mot svenska medborgare (fråga) | fr | — | 2026-05-08 | yes | S | no |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | notes |
|--------|---------------------|-------|
| HD01UbU28 | true | Full betänkande text retrieved via get_dokument_innehall |
| HD10480 | true | Interpellation text retrieved |
| HD11800 | true | Written question text retrieved |
| HD11801 | true | Written question text retrieved |
| HD11802 | true | Written question text retrieved |
| HD11803 | true | Written question text retrieved |

## Additional Week-Ahead Context Documents

Additional betänkanden scheduled for week 20 (May 11-17, 2026) identified via search_dokument:

| dok_id | Title | Committee | Date |
|--------|-------|-----------|------|
| HD01JuU39 | En särskild straffbestämmelse för psykiskt våld | JuU | 2026-05-07 |
| HD01JuU32 | Stärkt säkerhet vid allmänna sammankomster och offentliga tillställningar | JuU | 2026-05-07 |
| HD01FiU31 | Riksrevisionens rapport om statens fastighetsförvaltning | FiU | 2026-05-07 |
| HD01FiU43 | Förbättrade förutsättningar för kommuner att motverka felaktiga utbetalningar | FiU | 2026-05-07 |
| HD01FiU38 | Nya regler för att främja central clearing av OTC-derivat i EU | FiU | 2026-05-07 |
| HD01CU35 | Nya regler om aktier på MTF-plattformar | CU | 2026-05-07 |
| HD01FiU37 | En ny funktion för operativ krishantering i den finansiella sektorn | FiU | 2026-05-07 |
| HD01JuU34 | Nordisk verkställighet i brottmål | JuU | 2026-05-07 |
| HD01FöU18 | Signalspaning i försvarsunderrättelseverksamhet — en modern och ändamålsenlig lagstiftning | FöU | 2026-05-06 |

Recent propositions:

| dok_id | Title | Department | Date |
|--------|-------|------------|------|
| HD03261 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | Finansdepartementet | 2026-05-07 |
| HD03250 | En statlig e-legitimation | Finansdepartementet | 2026-05-07 |
| HD03267 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | Justitiedepartementet | 2026-05-07 |
| HD03258 | Ökad insyn i politiska processer | Justitiedepartementet | 2026-04-30 |
| HD03263 | Stärkt återvändandeverksamhet | Justitiedepartementet | 2026-04-30 |

## Prior-Voteringar Enrichment

Prior voting context for UbU education legislation (last 4 riksmöten):
- `search_voteringar` with `bet: UbU` returned 0 results for 2025/26 — no votes indexed yet this riksmöte for UbU.
- General voting data available: AU10 (2026-03-04) shows M, SD, S, C all voting Ja on sakfrågan point 3.
- Prior voteringar: no directly comparable UbU vote found in 2025/26. Pattern from 2024/25 and earlier: teacher credential legislation (skollagen) has been passed with broad cross-bloc support (M+C+KD+L+S typically Ja; SD and V divided depending on integration dimensions).

## Statskontoret Cross-Source Enrichment

Triggers evaluated for all 6 downloaded documents:

- **HD01UbU28** (teacher credentials): Names Skolverket implicitly (teacher licensing authority). Trigger: "Administrative-capacity / implementation feasibility risk". `web_fetch` attempted against statskontoret.se — no directly relevant Statskontoret report on the 10-year primary school teacher licensing specifically. General reference: Statskontoret 2023:9 "Statens stöd till skolväsendet" covers Skolverket capacity. Cited as background.
- **HD10480** (stadigvarande vistelse/Skatteverket): Names Skatteverket. Trigger: "Names a recognised agency". No specific Statskontoret report on stadigvarande vistelse concept, though Statskontoret 2024:4 covers Skatteverket's folkbokföring capacity.
- **HD11800** (småföretagares trygghet): Names Polismyndigheten implicitly (crime/safety). Trigger: "Names a recognised agency". Statskontoret 2022:8 covers Polismyndigheten operational efficiency.
- **HD11801** (nedsläckning/Trafikverket): Names Trafikverket. Trigger: "Names a recognised agency". Statskontoret 2021:22 covers Trafikverket implementation capacity.
- **HD11802, HD11803**: No recognised agency trigger. Statskontoret pre-warm: no trigger matched.

## Lagrådet Tracking

- **HD03267** (Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot, 2026-05-07): Proposition touches RF Ch.2 fundamental rights and ECHR Art.5/8 (detention, deportation). Lagrådet referral status: `web_fetch` against lagradet.se — site reachable but no published yttrande for HD03267 as of 2026-05-08T08:15Z. **Lagrådet: referral pending / no yttrande published as of 2026-05-08T08:15Z.**
- **HD03250** (statlig e-legitimation): Touches data protection / privacy (RF Ch.2 §6). Lagrådet tracking: no yttrande found as of 2026-05-08.
- **HD03261** (Skatteverket folkbokföring): Touches RF Ch.2 §6 (privacy/surveillance). No Lagrådet yttrande found.

## Withdrawn Documents

No withdrawn documents in this download batch.

## PIR Carry-Forward

Carrying forward from 2026-05-01/week-ahead:

- **PIR-WA-01** (open): SfU hearing schedule for HD03262 — resolution_target 2026-05-08. Migration legislation batch continues to evolve.
- **PIR-WA-02** (open): Lagrådet referral status for HD03262/HD03265 — partially addressed by this run's Lagrådet check for HD03267. HD03262/HD03265 remain unconfirmed.
- **PIR-WA-03** (open): S counter-motions on migration — no evidence of formal filing found this cycle. PIR remains open.
- **PIR-WA-04** (open): Migrationsverket implementation readiness — no new data. Carried forward.
- **PIR-WA-05** (open): May 2026 polling on migration — no polling data available yet.
- **PIR-WA-06** (open): Defence cooperation budget (FöU) — partially addressed by FöU18 betänkande this cycle.
- **PIR-WA-07** (open): Strömmer interpellation responses on criminal economy milestones — partially addressed by HD11800 (Strömmer designated respondent).
- **PIR-EVE-01–05**: Convergent PIRs from 2026-04-30/evening-analysis, all carried forward.

New PIRs generated this cycle — see `pir-status.json`.
