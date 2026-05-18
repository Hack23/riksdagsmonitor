# Data Download Manifest — 2026-05-18 realtime-pulse

**Generated**: 2026-05-18T11:35:00Z  
**Workflow**: news-realtime-monitor  
**Run mode**: first-generation  
**MCP status**: live (riksdag-regering, data.riksdagen.se + g0v.se)

## Downloaded Documents

| dok_id | Title | Type | Date | rm | Source URL | Data depth |
|--------|-------|------|------|----|------------|------------|
| HD03267 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | prop | 2026-05-07 | 2025/26 | https://data.riksdagen.se/dokument/HD03267.html | L2 Strategic |
| HD03262 | Utmönstring av permanent uppehållstillstånd och anpassning av svensk rätt till EU:s migrations- och asylpakt | prop | 2026-04-30 | 2025/26 | https://data.riksdagen.se/dokument/HD03262.html | L2+ Priority |
| HD03265 | Skärpta regler om uppsikt och förvar | prop | 2026-04-30 | 2025/26 | https://data.riksdagen.se/dokument/HD03265.html | L2 Strategic |
| HD03264 | Skärpta och tydligare krav på vandel för uppehållstillstånd | prop | 2026-04-30 | 2025/26 | https://data.riksdagen.se/dokument/HD03264.html | L2 Strategic |
| HD03263 | Stärkt återvändandeverksamhet | prop | 2026-04-30 | 2025/26 | https://data.riksdagen.se/dokument/HD03263.html | L2 Strategic |
| HD03261 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | prop | 2026-05-07 | 2025/26 | https://data.riksdagen.se/dokument/HD03261.html | L1 Surface |
| HD03250 | En statlig e-legitimation | prop | 2026-05-07 | 2025/26 | https://data.riksdagen.se/dokument/HD03250.html | L2 Strategic |
| HD01KU34 | En grundlagsskyddad aborträtt samt utökade möjligheter att begränsa föreningsfriheten och rätten till medborgarskap | bet | 2026-05-11 | 2025/26 | https://data.riksdagen.se/dokument/HD01KU34.html | L3 Intelligence-grade |
| HD01KU35 | Bättre förutsättningar för digitala kommunala sammanträden och förbättrad kontroll och uppföljning av privata utförare | bet | 2026-05-13 | 2025/26 | https://data.riksdagen.se/dokument/HD01KU35.html | L1 Surface |
| HC10752 | Kommuners arbete med civilförsvar och beredskap | ip | 2025-09-05 | 2024/25 | https://data.riksdagen.se/dokument/HC10752.html | L1 Surface |

**Total documents**: 10  
**Retrieval time**: 2026-05-18T11:35:00Z

## Full-Text Fetch Outcomes

| dok_id | full_text_available | notes |
|--------|---------------------|-------|
| HD03267 | true | Full text fetched via riksdag-regering MCP |
| HD01KU34 | true | Full text available — landmark constitutional bet |
| HD03262 | true | Full text available |

## Prior-Voteringar Enrichment

Search: SfU committee + migration + last 4 riksmöten  
Search: KU committee + grundlag + last 4 riksmöten

**KU34 constitutional vote**: First reading — no final vote yet (vilande adoption pending second reading post-election 2026)  
**SfU migration package**: No direct comparable vote yet — bills referred to committee. Most recent comparable: HC01SfU22 (förbättrad ordning och säkerhet vid förvar, 2025-06-12, rm 2024/25) — passed with M/SD/KD/L support, S/V/MP abstaining or opposing.  
**Prior voteringar AU10** (2025-05-14 rm 2024/25): beteckning AU10, mixed voting pattern: S-Avstår, SD-Nej, C-Ja, M-Ja on specific labor market measure.

## Reference Analyses

**Sibling folders read**: None (first run of the day — no prior realtime-pulse for 2026-05-18)  
**Prior analysis/daily entries**: analysis/daily/ checked — 2026-05-18 is the current date, no prior analysis exists

## Statskontoret Relevance Evaluation

Triggers evaluated for each document:
- HD03267/HD03262/HD03263/HD03264/HD03265: Names Migrationsverket, Kriminalvården, Polismyndigheten — **trigger FIRED**
  - Statskontoret relevance: none found (no recent Statskontoret evaluation of migration agency capacity published at statskontoret.se as of retrieval date)
- HD03261: Names Skatteverket — **trigger FIRED**
  - Statskontoret relevance: none found
- HD01KU34: Constitutional reform — no agency trigger
- HD03250: E-legitimation — names Myndigheten för digital förvaltning (Digg) — **trigger FIRED**
  - Statskontoret relevance: none found (no published evaluation retrieved)

## Lagrådet Enrichment

- HD03267 (security threats): Lagrådet referral status — pending (major bill; referral tag: referral pending)
- HD03262 (permanent UT abolition): EU Asylum Pact adaptation — referred to Lagrådet; yttrande not yet published
- HD01KU34 (constitutional abortion + citizenship): Lagrådet yttrande required for grundlagsändring; referral pending
