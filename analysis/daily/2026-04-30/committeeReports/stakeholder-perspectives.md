# Stakeholder Perspectives — Committee Reports 2026-04-29

**Author**: James Pether Sörling  
**Date**: 2026-04-30  
**Confidence**: MEDIUM [B2]

## 6-Lens Stakeholder Matrix

### Lens 1 — Government / Riksdag Majority

**Actor**: Tidöpartiet government (M/SD/KD/L coalition)  
**Position on key reports**: 
- KU36: Accepts oversight recommendations; cautious on mandatory AI assessments that would constrain government AI procurement  
- JuU9: Supportive — court efficiency is aligned with law-and-order agenda  
- NU19: Strongly supportive — nuclear expansion central to energy agenda  
- FöU13: Supportive — security tightening aligns with defence/security priorities  

### Lens 2 — Parliamentary Opposition

**Actor**: S, V, MP  
- KU36: S strongly supportive; V and MP push for stronger AI Act alignment; MP wants data minimisation requirements  
- CU37: S supportive; V wants broader social housing investment beyond guarantees  
- NU19: MP opposed; V opposed; S ambivalent on nuclear expansion timeline  

### Lens 3 — Civil Society / NGOs

**Actor**: Datainspektionen (IMY), Svenska Advokatsamfundet, Hyresgästföreningen  
- IMY (data protection): Closely tracking KU36 — will need to implement any new oversight regime  
- Advokatsamfundet: Supportive of JuU9 court efficiency but concerns about digital hearing access for disadvantaged  
- Hyresgästföreningen: Cautious on CU37 — rental guarantees could reduce pressure for broader social housing investment  

### Lens 4 — Business / Industry

**Actor**: Konkurrensverket, Swedish industry associations, nuclear industry  
- NU22: Konkurrensverket supportive of expanded powers; private sector concerned about broader scope  
- NU19: Vattenfall, Fortum supportive of streamlined permitting  
- SoU33: Hospitality sector (Visita) strongly supportive of food requirement removal  

### Lens 5 — EU / International

**Actor**: European Commission, EDPB, Nordic competition authorities  
- KU36: EC monitoring AI Act implementation — KU36 report feeds Sweden's 2026 compliance roadmap  
- NU22: Nordic competition network (NCN) tracking DMA alignment  
- FöU13: Europol coordination role (JuU46 oversight report context)  

### Lens 6 — Media / Public Opinion

**Actor**: Swedish media, public  
- KU36: High public interest — surveillance/digital rights resonates with urban educated voters  
- JuU9: Moderate public interest — court backlogs are known frustration point  
- SoU33: Low interest — niche hospitality deregulation  

## Influence Network

```mermaid
%%{init: {"theme": "dark", "themeVariables": {"primaryColor": "#1a1e3d", "lineColor": "#00d9ff"}}}%%
flowchart LR
    Gov[Government Coalition] --> KU36[KU36 Oversight]
    Gov --> NU19[NU19 Nuclear]
    Opp[Opposition S/V/MP] --> KU36
    Opp --> CU37[CU37 Housing]
    Civil[Civil Society IMY/NGOs] --> KU36
    EU[EU Commission] --> KU36
    Industry[Industry/Vattenfall] --> NU19
    Media[Media/Public] --> KU36
    style Gov fill:#00d9ff,color:#000
    style Opp fill:#ffbe0b,color:#000
    style Civil fill:#ff006e,color:#fff
    style EU fill:#00d9ff,color:#000
```

```mermaid
%%{init: {"theme": "dark", "themeVariables": {"primaryColor": "#1a1e3d"}}}%%
flowchart TD
    KU36[HD01KU36 Digital Privacy] --> IMY[IMY Implementation]
    KU36 --> EC[EU AI Act Compliance]
    JuU9[HD01JuU9 Courts] --> Adv[Advokatsamfundet]
    JuU9 --> Citizens[Public Access to Justice]
    NU19[HD01NU19 Nuclear] --> Vattenfall[Energy Industry]
    NU19 --> MP[Environmental Opposition]
    style KU36 fill:#ff006e,color:#fff
    style JuU9 fill:#ffbe0b,color:#000
    style NU19 fill:#ffbe0b,color:#000
```
