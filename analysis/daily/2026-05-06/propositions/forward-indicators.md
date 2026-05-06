# Forward Indicators — Propositions 2026-05-06

**Horizon**: T+72h through T+4y (election cycle)  
**PIR reference**: intelligence-assessment.md §PIRs

## Monitoring Triggers

| Indicator | Watch for | Timeline | Significance |
|-----------|---------|---------|-------------|
| FI-1: UU committee hearing announcement | Joint hearing HD03248 + HD03249 scheduled | T+30d | Confirms normal processing |
| FI-2: UU betänkande circulated | Draft recommendation to plenary | T+60d | Reveals any conditionality language |
| FI-3: Other EU MS ratification completions | EU Council treaty database update | Ongoing | Tracks entry-into-force eligibility |
| FI-4: EU Commission EPCA Joint Committee announcement | First KG/UZ Joint Committee | T+180d post entry-into-force | Confirms implementation activation |
| FI-5: Uzbekistan CRM working group | EU-UZ mineral cooperation MOU signed | T+1y | Confirms CRM value activation |
| FI-6: Kyrgyzstan constitutional/governance changes | New legislation concentrating executive power | T+90d to T+1y | Triggers HR clause monitoring |
| FI-7: Russia CSTO-Kyrgyzstan activity | Military exercises; pressure signalling | Ongoing | Threatens EPCA implementation compliance |
| FI-8: V/MP motion on EPCA HR conditions | Riksdagen motion table by V or MP | T+30d | Possible delay indicator |
| FI-9: Swedish plenary vote result | Vote count; any dissents; protokollsanteckningar | T+90-120d | Archives actual outcome |
| FI-10: Sweden bilateral meetings UZ/KG | Bilateral trade/investment meeting post-ratification | T+6-12m | Tracks EPCA economic activation |

## Priority Indicator

**FI-5 (Uzbekistan CRM)** is the highest-value indicator. If EU-UZ CRM working group activates within 12 months of entry-into-force, the Uzbekistan EPCA has delivered on its primary strategic promise. If not, the CRM provisions are confirmed as largely declaratory (consistent with H2 in devil's advocate).

## Riksdagsmonitor Auto-Monitor

Recommend flagging the following MCP query patterns for future workflow runs:
- `search_dokument(organ=UU, bet=contains("248" OR "249"), rm=2025/26)` — betänkande tracker
- `search_voteringar(rm=2025/26, bet=UU*)` — vote tracker
- `search_dokument(titel=contains("Kirgizistan" OR "Uzbekistan"), rm=2025/26 OR 2026/27)` — related document tracker
