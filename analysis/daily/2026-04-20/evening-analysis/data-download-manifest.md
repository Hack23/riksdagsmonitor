# Data Download Manifest — Evening Analysis 2026-04-20

**Generated**: 2026-04-20 18:35 UTC  
**Produced By**: evening-analysis agentic workflow  
**Analysis Period**: 2026-04-17 to 2026-04-20  
**Riksmöte**: 2025/26  
**Data Sources**: riksdag-regering MCP (get_sync_status, search_voteringar, search_anforanden, search_regering, get_betankanden, get_propositioner, get_motioner, get_fragor, get_interpellationer), sibling workflow artifacts

## Documents Analyzed: 54

### Cross-Workflow Synthesis

Evening analysis aggregates findings from ALL four sibling article types produced today:

| Article Type | Documents | Artifacts | Key Focus |
|-------------|-----------|-----------|-----------|
| committeeReports | 6 betänkanden | 13 files | KU32/KU33 constitutional amendments, housing reform, guardianship |
| propositions | 9 propositions | 16 files | Spring Economic Bill HD03100, energy, justice, security clusters |
| interpellations | 10 interpellations | 8 files | Gender equality, Carlson infrastructure, Bernadotte diplomatic |
| motions | 21 motions | 9 files | Opposition counter-offensive vs. immigration legislation |
| **Evening (synthesis)** | **54 (aggregated)** | **14 files** | Full day intelligence synthesis |

### Direct MCP Queries — Today

| Tool | Query | Result Count | Date Filter Applied |
|------|-------|-------------|-------------------|
| search_voteringar | rm=2025/26 | 30 records | AU10 2026-03-04 |
| search_anforanden | rm=2025/26 | 30 anföranden | Socialförsäkringsfrågor, Tillståndsprövning, Säkerhetspolitik |
| search_regering | 2026-04-17 to 2026-04-20 | 15 pressmeddelanden, 2 prop., 1 SOU | Date filtered |
| get_calendar_events | 2026-04-20 | 0 (API returned HTML — known issue) | Fallback used |

### Government Actions (April 17–20, 2026)

| dok_id / id | Title | Date |
|-------------|-------|------|
| prop.202526232 | Sveriges tillträde till Ukraina-skadeståndskommission | 2026-04-17 |
| prop.202526231 | Sveriges anslutning till Ukraina-tribunalen | 2026-04-17 |
| SOU 2026:27 | Lättnader i hållbarhetsrapportering | 2026-04-17 |
| pressm. | Sverige ökar humanitärt stöd till Libanon | 2026-04-19 |
| pressm. | PM besökte Norrbottens flygflottilj i Luleå | 2026-04-17 |
| pressm. | Statsministern i toppmöte om Hormuzsundet | 2026-04-17 |
| pressm. | H.M. Konungen + UM Malmer Stenergard besöker Ukraina | 2026-04-17 |

## Data Quality Notes

- get_sync_status returned live status (2026-04-20T18:33:11 UTC) — data fresh
- Calendar API returned HTML (known intermittent issue) — fallback used
- Speech anföranden returned without text (API limitation) — debates identified by title
- Sibling workflow analysis available at high quality: 46 artifact files from committeeReports + propositions + interpellations + motions

## Completeness Assessment

| Category | Completeness | Note |
|----------|-------------|------|
| Committee reports | ✅ Complete | 6/6 betänkanden analyzed |
| Government propositions | ✅ Complete | 9 focus propositions + supporting docs |
| Interpellations | ✅ Complete | 10/10 interpellations |
| Opposition motions | ✅ Complete | 21 motions across 4 parties |
| Government press releases | ✅ Complete | 15 press releases Apr 17–19 |
| New propositions | ✅ Complete | 2 Ukraine-related propositions Apr 17 |
| Voting records | ⚠️ Partial | Latest vote AU10 from 2026-03-04 |
| Chamber speeches | ⚠️ Text unavailable | 30 speeches identified; full text API limitation |
| Calendar | ⚠️ Fallback | Calendar API returned HTML |
