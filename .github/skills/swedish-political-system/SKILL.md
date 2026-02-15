---
name: swedish-political-system
description: Swedish Riksdag structure, 8 parties, electoral system, government formation, coalition patterns, and comprehensive political vocabulary for translation
license: Apache-2.0
---

# Swedish Political System Skill

## Purpose

Comprehensive knowledge of Swedish political system for accurate interpretation of political data in Riksdagsmonitor, including authoritative vocabulary for translating Riksdag API data across all 14 supported languages.

## Riksdag Structure

- **Members**: 349 MPs (odd number prevents ties)
- **Electoral System**: Proportional representation, 4% threshold
- **Term**: Fixed 4-year terms
- **Committees**: 15 standing committees
- **Last Election**: September 11, 2022
- **Next Election**: September 2026

## 8 Parliamentary Parties (Left → Right)

1. **Vänsterpartiet (V)** - Left Party (24 seats, 6.9%)
2. **Socialdemokraterna (S)** - Social Democrats (107 seats, 30.7%)
3. **Miljöpartiet (MP)** - Green Party (18 seats, 5.2%)
4. **Centerpartiet (C)** - Centre Party (24 seats, 6.9%)
5. **Liberalerna (L)** - Liberals (16 seats, 4.6%)
6. **Kristdemokraterna (KD)** - Christian Democrats (19 seats, 5.4%)
7. **Moderaterna (M)** - Moderate Party (68 seats, 19.5%)
8. **Sverigedemokraterna (SD)** - Sweden Democrats (73 seats, 20.9%)

## Government Formation

### Negative Parliamentarism
- PM needs <175 votes AGAINST (not majority FOR)
- Speaker proposes candidate
- Riksdag votes (simple yes/no/abstain)
- If <175 vote NO → PM approved

### Current Government (2022-)
- **PM**: Ulf Kristersson (M)
- **Coalition**: M-KD-L (103 seats)
- **External Support**: SD (73 seats)
- **Type**: Minority with support

## Electoral System

- **310 Constituency Seats**: Divided among 29 constituencies
- **39 Leveling Seats**: Ensure national proportionality
- **Modified Sainte-Laguë**: Allocation method
- **4% Threshold**: National OR 12% in one constituency

---

## Swedish Political Vocabulary (Riksdag API Translation Glossary)

This vocabulary is the **authoritative reference** for translating Swedish political terms from the Riksdag API into all 14 supported languages. LLM agents generating news articles MUST consult this glossary.

### Document Types (Dokumenttyper)

These are the `doktyp` values returned by the Riksdag API:

| Swedish | Abbreviation | English | Definition |
|---------|-------------|---------|------------|
| Betänkande | bet | Committee report | A committee's recommendation to the Riksdag on a matter |
| Proposition | prop | Government bill | A legislative proposal from the government to the Riksdag |
| Motion | mot | Parliamentary motion | A proposal submitted by one or more MPs |
| Interpellation | ip | Interpellation | A formal question from an MP to a minister requiring debate |
| Skriftlig fråga | fr | Written question | A written question from an MP to a minister |
| Utskottsbetänkande | bet | Committee report | Synonym for betänkande |
| Protokoll | prot | Minutes/Protocol | Record of proceedings in the chamber |
| Yttrande | ytt | Statement/Opinion | A committee's opinion on a matter referred by another committee |
| Utlåtande | utl | Statement | Used for EU matters referred to committees |
| Förordning | — | Regulation/Ordinance | Government regulation |
| Riksdagsskrivelse | rskr | Parliamentary communication | The Riksdag's formal decisions communicated to the government |
| Statens offentliga utredningar | SOU | Government inquiry report | Thorough investigation reports |
| Departementsserien | Ds | Ministry series | Ministry publication series |

### Document Reference Formats

| Format | Example | Meaning |
|--------|---------|---------|
| Prop. YYYY/YY:NNN | Prop. 2025/26:123 | Government bill 123 of term 2025/26 |
| Bet. YYYY/YY:XxUNN | Bet. 2025/26:FiU10 | Finance Committee report 10 of term 2025/26 |
| Mot. YYYY/YY:NNNN | Mot. 2025/26:1234 | Motion 1234 of term 2025/26 |
| Rskr. YYYY/YY:NNN | Rskr. 2025/26:45 | Parliamentary communication 45 |
| SOU YYYY:NN | SOU 2026:15 | Government inquiry report 15 of 2026 |
| Ds YYYY:NN | Ds 2026:8 | Ministry series publication 8 of 2026 |

### 15 Standing Committees (Utskott)

| Swedish Name | Abbreviation | English | Key Policy Areas |
|-------------|-------------|---------|-----------------|
| Finansutskottet | FiU | Finance Committee | Budget, taxation, financial regulation |
| Socialutskottet | SoU | Social Affairs Committee | Healthcare, social services, elderly care |
| Justitieutskottet | JuU | Justice Committee | Criminal law, police, courts |
| Civilutskottet | CU | Civil Affairs Committee | Civil law, housing, consumer protection |
| Utrikesutskottet | UU | Foreign Affairs Committee | Foreign policy, international aid |
| Försvarsutskottet | FöU | Defence Committee | Military, civil defence, security policy |
| Konstitutionsutskottet | KU | Constitutional Committee | Constitution, government accountability |
| Kulturutskottet | KrU | Cultural Affairs Committee | Culture, media, religious communities |
| Miljö- och jordbruksutskottet | MJU | Environment and Agriculture Committee | Environment, agriculture, food |
| Näringsutskottet | NU | Industry Committee | Business, energy, regional growth |
| Skatteutskottet | SkU | Tax Committee | Tax legislation |
| Socialförsäkringsutskottet | SfU | Social Insurance Committee | Social insurance, pensions, migration |
| Trafikutskottet | TU | Transport Committee | Transport, IT, postal services |
| Utbildningsutskottet | UbU | Education Committee | Education, research, students |
| Arbetsmarknadsutskottet | AU | Labour Market Committee | Employment, working conditions, equality |

### Parliamentary Proceedings Vocabulary

| Swedish | English | Context |
|---------|---------|---------|
| Riksmöte | Parliamentary session/term | The annual session (Sept–June), e.g. "riksmötet 2025/26" |
| Votering | Division/Vote | A formal vote in the chamber |
| Anförande | Speech/Address | A speech delivered in the chamber |
| Debatt | Debate | Parliamentary debate on a matter |
| Kammare | Chamber | The plenary chamber of the Riksdag |
| Talman | Speaker | The Speaker of the Riksdag (Andreas Norlén) |
| Andre vice talman | Second Deputy Speaker | Deputy speaker role |
| Utskottssammanträde | Committee meeting | Committee session |
| Allmän motionstid | General motion period | Period when all MPs may file motions |
| Statsbudget | National budget | The annual government budget |

### Political & Policy Terms

| Swedish | English | Context |
|---------|---------|---------|
| Tidöavtalet | The Tidö Agreement | The 2022 governing agreement between M, KD, L and SD |
| Januariavtalet | The January Agreement | The 2019 agreement between S, MP, C, L (historical) |
| Decemberöverenskommelsen | The December Agreement | The 2014 budget deal (historical) |
| Föräldrapenning | Parental allowance | Social insurance benefit |
| Bostadsrätt | Tenant-ownership | Swedish form of housing cooperative |
| Fribeloppet | Freehold amount/Earning threshold | Amount students or pensioners may earn tax-free |
| Statlig personal | Government personnel | Civil servants employed by the state |
| Djurskydd | Animal welfare/protection | Animal welfare regulation |
| Riksrevisionen | Swedish National Audit Office | Parliamentary audit authority |
| Riksbanken | Sveriges Riksbank | Sweden's central bank |
| Statsråd | Cabinet minister | Member of the government/cabinet |
| Regeringskansliet | Government Offices | The Swedish Government administrative apparatus |

### Multi-Language Document Type Translations

| Swedish | English | German | French | Spanish |
|---------|---------|--------|--------|---------|
| Betänkande | Committee report | Ausschussbericht | Rapport de commission | Informe de comité |
| Proposition | Government bill | Regierungsvorlage | Projet de loi du gouvernement | Proyecto de ley gubernamental |
| Motion | Parliamentary motion | Parlamentarischer Antrag | Motion parlementaire | Moción parlamentaria |
| Interpellation | Interpellation | Interpellation | Interpellation | Interpelación |
| Skriftlig fråga | Written question | Schriftliche Anfrage | Question écrite | Pregunta escrita |
| Votering | Division/Vote | Abstimmung | Vote/Scrutin | Votación |
| Anförande | Parliamentary speech | Parlamentsrede | Discours parlementaire | Discurso parlamentario |

| Swedish | Danish | Norwegian | Finnish | Dutch |
|---------|--------|-----------|---------|-------|
| Betänkande | Udvalgsbetænkning | Komitéinnstilling | Valiokunnan mietintö | Commissieverslag |
| Proposition | Regeringsforslag | Regjeringsforslag | Hallituksen esitys | Wetsvoorstel |
| Motion | Beslutningsforslag | Representantforslag | Lakialoite | Parlementaire motie |
| Interpellation | Forespørgsel | Interpellasjon | Välikysymys | Interpellatie |
| Skriftlig fråga | Skriftligt spørgsmål | Skriftlig spørsmål | Kirjallinen kysymys | Schriftelijke vraag |
| Votering | Afstemning | Votering | Äänestys | Stemming |
| Anförande | Tale | Innlegg | Puheenvuoro | Toespraak |

| Swedish | Arabic | Hebrew | Japanese | Korean | Chinese |
|---------|--------|--------|----------|--------|---------|
| Betänkande | تقرير اللجنة | דוח ועדה | 委員会報告 | 위원회 보고서 | 委员会报告 |
| Proposition | مشروع قانون حكومي | הצעת חוק ממשלתית | 政府法案 | 정부 법안 | 政府法案 |
| Motion | اقتراح برلماني | הצעה פרלמנטרית | 議会動議 | 의회 동의 | 议会动议 |
| Interpellation | استجواب | אינטרפלציה | 質問主意書 | 대정부질문 | 质询 |
| Skriftlig fråga | سؤال مكتوب | שאילתה | 書面質問 | 서면질의 | 书面质询 |
| Votering | تصويت | הצבעה | 採決 | 표결 | 表决 |
| Anförande | خطاب برلماني | נאום פרלמנטרי | 国会演説 | 의회 연설 | 议会发言 |

### Article Type Classification Keywords (All 14 Languages)

Used by `classifyArticleType()` in `generate-news-indexes.js` to determine article type from content:

| Type | English | Swedish | Danish | Norwegian |
|------|---------|---------|--------|-----------|
| prospective | Week Ahead, upcoming, preview, preview, look ahead | Veckan som kommer, kommande, framåtblick | Ugen der kommer, kommende, fremadrettet | Uken som kommer, kommende, fremtidsrettet |
| analysis | Committee Reports, analysis, review, assessment | Utskottsbetänkanden, analys, granskning | Udvalgsrapporter, analyse, gennemgang | Komitérapporter, analyse, gjennomgang |
| breaking | Breaking, urgent, alert, flash | Senaste nytt, akut, brådskande | Seneste nyt, urgent, hastesag | Siste nytt, haster, pressemelding |

| Type | Finnish | German | French | Spanish |
|------|---------|--------|--------|---------|
| prospective | Tuleva viikko, tulevat, ennakko | Woche voraus, kommende, Vorschau | Semaine à venir, à venir, aperçu | Semana por delante, próximo, adelanto |
| analysis | Valiokuntaraportit, analyysi, katsaus | Ausschussberichte, Analyse, Überprüfung | Rapports de commission, analyse, examen | Informes de comité, análisis, revisión |
| breaking | Viimeisimmät, kiireellinen, hälytys | Eilmeldungen, dringend, Alarm | Dernières nouvelles, urgent, alerte | Última hora, urgente, alerta |

| Type | Dutch | Arabic | Hebrew | Japanese | Korean | Chinese |
|------|-------|--------|--------|----------|--------|---------|
| prospective | Week vooruit, komende, vooruitblik | الأسبوع المقبل, القادم | השבוע הבא, הקרוב | 来週の展望, 今後 | 주간 전망, 다가오는 | 一周展望, 即将 |
| analysis | Commissierapporten, analyse, beoordeling | تقارير اللجان, تحليل | דוחות ועדות, ניתוח | 委員会報告, 分析 | 위원회 보고서, 분석 | 委员会报告, 分析 |
| breaking | Laatste nieuws, dringend, alert | أخبار عاجلة, عاجل | חדשות אחרונות, דחוף | 速報, 緊急 | 속보, 긴급 | 突发新闻, 紧急 |

---

## ISMS Compliance

### ISO 27001:2022
- **A.5.10**: Parliamentary data for accountability
- **A.5.33**: Historical records maintained

## References

- **Riksdagen**: https://www.riksdagen.se/
- **Constitution**: https://www.riksdagen.se/en/how-the-riksdag-works/democracy/the-constitution/
- **Election Authority**: https://www.val.se/
- **Riksdag Open Data API**: https://data.riksdagen.se/
- **TRANSLATION_GUIDE.md**: See repository root for cross-language terminology tables
