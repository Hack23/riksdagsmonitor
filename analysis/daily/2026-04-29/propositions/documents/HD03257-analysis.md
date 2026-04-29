# HD03257 — Dokumentanalys

**Beteckning**: Prop. 2025/26:257  
**Utskott**: CU (Civilutskottet)  
**Ansvarig minister**: Andreas Carlson (KD), Landsbygds- och infrastrukturdepartementet  
**Dok_id**: HD03257  
**Datum**: 2026-04-28  
**Analystatus**: Metadata-only (fulltext ej tillgänglig via MCP)

## Sammanfattning

Prop. 2025/26:257 moderniserar IT-infrastrukturen för kommunala lantmäterimyndigheter (KLM) och kräver interoperabilitet med Lantmäteriets nationella system. Genomförs med INSPIRE-direktivet som EU-rättslig grund.

## Dokumentklassificering

- **Typ**: Proposition (förvaltningsteknisk reform)
- **Komplexitet**: L1 Informational
- **Urgency**: LÅG
- **Politisk signifikans**: LÅG

## Teknisk analys

- Kräver API-integration eller systembyte för kommunala KLM (uppskattningsvis 40–50 % av kommunerna)
- Lantmäteriet ges central roll som standardsättare och supportfunktion
- INSPIRE-direktivet (EU 2007/2/EG) kräver geodatasystem interoperabilitet

## Berörda kommuner (uppskattning)

Det finns 54 kommunala lantmäterimyndigheter i Sverige. Av dessa har ungefär:
- 25–30 % (15–16 stycken): Moderna, kompatibla system → minimala kostnader
- 40–45 % (22–24 stycken): Partiellt kompatibla system → uppgraderingskostnader 500 tkr–2 Mkr/KLM
- 25–30 % (15–16 stycken): Äldre system → systembyten 2–5 Mkr/KLM

**Totalberäknad kommunal kostnad**: 200–400 Mkr totalt (ej statligt finansierat i nuläget)

## Genomförandekonsekvenser

1. Upphandlingsprocesser tar 12–18 månader per KLM
2. Lantmäteriet behöver teknisk supportfunktion (nya tjänster)
3. Privata fastighetsköpare gynnas av snabbare kartmyndighetsprocesser
4. Kommunal budgetpåverkan kan öka fastighetstaxeringskostnader

## Key Gaps (PIR)

- Statlig finansieringsmekanism (finns den?)
- Tidplan för obligatorium
- Sanktioner för icke-efterlevnad

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#0a0e27","primaryTextColor": "#e0e0e0","primaryBorderColor": "#00d9ff","lineColor": "#ff006e","sectionBkgColor": "#1a1e3d","altSectionBkgColor": "#0a0e27"}}}%%
flowchart LR
    INSPIRE[EU INSPIRE-direktiv] --> HD03257[Prop 2025/26:257 HD03257]
    HD03257 --> Lantm[Lantmäteriet standardsättare]
    HD03257 --> KLM[54 kommunala KLM]
    KLM --> IT[IT-uppgradering]
    IT --> Fastighet[Snabbare fastighetsprocess]
    style INSPIRE fill:#1a1e3d,stroke:#00d9ff
    style HD03257 fill:#ff006e,color:#fff
    style Lantm fill:#1a1e3d,stroke:#ffbe0b
    style KLM fill:#1a1e3d,stroke:#ff006e
    style IT fill:#ffbe0b,color:#0a0e27
    style Fastighet fill:#00d9ff,color:#0a0e27
```
